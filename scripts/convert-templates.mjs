// One-time, strict conversion of the audited Thymeleaf templates into editable JSX.
// Unknown expressions fail rather than silently dropping content.
import { readFileSync, writeFileSync, mkdirSync, cpSync } from "node:fs";
import { parse } from "parse5";
const base = "src/main/resources";
const write = (path, value) => {
  mkdirSync(path.slice(0, path.lastIndexOf("/")), { recursive: true });
  writeFileSync(path, value);
};
const expressions = {
  "${events.isEmpty()}": "events.length === 0",
  "${!events.isEmpty()}": "events.length > 0",
  "${musics.isEmpty()}": "musics.length === 0",
  "${event.description != null and !event.description.isEmpty()}":
    "Boolean(event.description)",
  "${about.updatedAt != null}": "about.updatedAt !== null",
  "${#numbers.formatInteger(status.count, 2)}":
    'String(index + 1).padStart(2, "0")',
  "${#temporals.format(event.eventDate, 'dd/MM/yyyy')}":
    "formatDate(event.eventDate)",
  "${#temporals.format( about.updatedAt, 'dd/MM/yyyy HH:mm' )}":
    "formatDate(about.updatedAt, true)",
};
function expression(value) {
  value = value.replace(/\s+/g, " ").trim();
  if (expressions[value]) return expressions[value];
  if (
    /^\$\{(?:about\.(?:paragraph[123]|updatedAt)|music\.(?:id|title|artists|youtubeUrl|youtubeVideoId|position)|event\.(?:id|title|eventDate|location|city|description)|username|successMessage|errorMessage)\}$/.test(
      value,
    )
  )
    return value.slice(2, -1);
  if (/^@\{\/[^}]*\}$/.test(value)) return JSON.stringify(value.slice(2, -1));
  if (value.includes(" + "))
    return value
      .split(" + ")
      .map((part) =>
        part.startsWith("'")
          ? JSON.stringify(part.slice(1, -1))
          : expression(part),
      )
      .join(" + ");
  throw Error("Unmapped expression: " + value);
}
const find = (node, tag) =>
  node.tagName === tag
    ? node
    : (node.childNodes ?? []).map((n) => find(n, tag)).find(Boolean);
const voids = new Set(["img", "input", "br", "meta", "link", "hr"]);
const rename = {
  class: "className",
  for: "htmlFor",
  maxlength: "maxLength",
  minlength: "minLength",
  autocomplete: "autoComplete",
  viewbox: "viewBox",
  formaction: "formAction",
};
function jsx(node, inLoop = false) {
  if (node.nodeName === "#text")
    return "{" + JSON.stringify(node.value.replace(/\s+/g, " ")) + "}";
  if (!node.tagName) return "";
  const attrs = Object.fromEntries(node.attrs.map((a) => [a.name, a.value]));
  const each = attrs["th:each"];
  if (each && !inLoop) {
    const isMusic = each.startsWith("music");
    return `{${isMusic ? "musics.map((music, index)" : "events.map((event)"} => (${jsx(node, true)}))}`;
  }
  const fields = [];
  if (each)
    fields.push(`key={${each.startsWith("music") ? "music" : "event"}.id}`);
  let text = null;
  for (const [key, value] of Object.entries(attrs)) {
    if (["th:each", "th:if"].includes(key)) continue;
    if (key === "onclick") {
      fields.push(
        `onClick={(event) => { if (!window.confirm(${JSON.stringify(/confirm\('(.*)'\)/.exec(value)[1])})) event.preventDefault(); }}`,
      );
      continue;
    }
    if (key === "th:text") {
      if (node.tagName === "textarea")
        fields.push(`defaultValue={${expression(value)} ?? ''}`);
      else text = "{" + expression(value) + "}";
      continue;
    }
    if (key.startsWith("th:")) {
      let target = key.slice(3);
      let expr = expression(value);
      if (target === "href" && value === "${music.youtubeUrl}")
        expr = `safeMediaUrl(${expr})`;
      if (target === "value") target = "defaultValue";
      fields.push(
        `${rename[target] ?? target}={${expr}${target === "defaultValue" ? " ?? ''" : ""}}`,
      );
    } else {
      fields.push(
        `${rename[key] ?? key}=${["required", "defer"].includes(key) ? "{true}" : ["maxlength", "minlength"].includes(key) ? "{" + Number(value) + "}" : JSON.stringify(value)}`,
      );
    }
  }
  let child = text ?? (node.childNodes ?? []).map((n) => jsx(n)).join("");
  if (node.tagName === "textarea") child = "";
  if (node.tagName === "form")
    child = '<input type="hidden" name="_csrf" value={csrf} />' + child;
  let result = `<${node.tagName}${fields.length ? " " + fields.join(" ") : ""}${voids.has(node.tagName) ? " />" : ">" + child + "</" + node.tagName + ">"}`;
  if (attrs["th:if"])
    result = `{(${expression(attrs["th:if"])}) ? (${result}) : null}`;
  return result;
}
cpSync(`${base}/static`, "public", { recursive: true });
for (const [source, name] of [
  ["index", "Home"],
  ["admin/dashboard", "Dashboard"],
  ["admin/sobre", "Sobre"],
  ["admin/musicas", "Musicas"],
  ["admin/eventos", "Eventos"],
  ["admin/conta", "Conta"],
]) {
  const raw = readFileSync(`${base}/templates/${source}.html`, "utf8");
  const tree = parse(raw);
  const title = find(tree, "title").childNodes[0].value;
  const style = find(tree, "style");
  const css =
    name === "Home" ? "/css/style.css" : `/css/admin/${name.toLowerCase()}.css`;
  if (style) write("public" + css, style.childNodes[0].value);
  const body = find(tree, "body")
    .childNodes.map((n) => jsx(n))
    .join("");
  write(
    `src/components/${name}.tsx`,
    `// Converted from ${source}.html; original classes, content and whitespace retained.\nimport Head from 'next/head';\nimport { formatDate, safeMediaUrl } from '@/lib/format';\nimport type { ContentProps } from '@/types/content';\n${name === "Home" ? "import { SiteBehavior } from './SiteBehavior';" : ""}\nexport default function ${name}({ about, musics, events, username, csrf, successMessage, errorMessage }: ContentProps) {\nreturn <><Head><title>${title}</title><meta name="viewport" content="width=device-width, initial-scale=1.0"/><link rel="stylesheet" href="${css}"/>${name === "Home" ? '<meta name="description" content="Site oficial do DJ VIEE. Mega Funk, lançamentos, agenda, press kit e contratação para eventos."/>' : ""}</Head>${body}${name === "Home" ? "<SiteBehavior />" : ""}</>;\n}\n`,
  );
}
const java = readFileSync(
  `${base}/../java/com/djviee/site/service/AboutService.java`,
  "utf8",
);
const about = { id: null, updatedAt: null };
for (let i = 1; i <= 3; i++) {
  const block = new RegExp(`about.setParagraph${i}\\(([\\s\\S]*?)\\);`).exec(
    java,
  )[1];
  about[`paragraph${i}`] = [...block.matchAll(/"([^"]*)"/g)]
    .map((m) => m[1])
    .join("");
}
write(
  "src/lib/default-about.ts",
  `import type { About } from '@/types/content';\n// Exact default paragraphs from AboutService; never substitutes a failed database read.\nexport const defaultAbout: About = ${JSON.stringify(about, null, 2)};\n`,
);
console.log("Converted 6 templates; copied all assets and original CSS.");
