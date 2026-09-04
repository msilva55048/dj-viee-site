import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { compare, hash } from "bcryptjs";

test("Original public assets are copied byte for byte", () => {
  const walk = (path: string): string[] =>
    readdirSync(path).flatMap((name) => {
      const p = join(path, name);
      return statSync(p).isDirectory() ? walk(p) : [p];
    });
  for (const file of walk("src/main/resources/static")) {
    const copy = file.replace(
      join("src", "main", "resources", "static"),
      "public",
    );
    assert.deepEqual(readFileSync(copy), readFileSync(file), file);
  }
  for (const name of ["conta", "dashboard", "eventos", "musicas", "sobre"]) {
    const html = readFileSync(
      `src/main/resources/templates/admin/${name}.html`,
      "utf8",
    );
    const css = /<style>([\s\S]*?)<\/style>/
      .exec(html)![1]
      .replaceAll("\r\n", "\n");
    assert.equal(readFileSync(`public/css/admin/${name}.css`, "utf8"), css);
  }
});
test("Spring BCrypt password hashes remain usable", async () => {
  const encoded = await hash("isolated-test-password", 10);
  assert.equal(
    await compare("isolated-test-password", encoded.replace("$2b$", "$2a$")),
    true,
  );
  assert.equal(await compare("wrong", encoded.replace("$2b$", "$2a$")), false);
});
test("Production browser chunks contain no privileged backend modules", () => {
  if (!existsSync(".next/static")) return;
  const walk = (path: string): string[] =>
    readdirSync(path).flatMap((name) => {
      const p = join(path, name);
      return statSync(p).isDirectory() ? walk(p) : [p];
    });
  for (const file of walk(".next/static").filter((p) => p.endsWith(".js"))) {
    const content = readFileSync(file, "utf8");
    for (const forbidden of [
      "SUPABASE_SECRET_KEY",
      "LEGACY_DATABASE_URL",
      "change_admin_password",
      "consume_login_attempt",
    ])
      assert.equal(content.includes(forbidden), false, `${file}: ${forbidden}`);
  }
});
