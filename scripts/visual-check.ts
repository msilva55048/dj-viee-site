import { chromium } from "@playwright/test";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import assert from "node:assert/strict";
import { testStack } from "./test-support";

async function main() {
  assert.ok(
    existsSync("test-results/legacy/index-empty.html"),
    "Run scripts/render-legacy.ps1 first.",
  );
  const stack = await testStack(3101);
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const results: Record<string, unknown>[] = [];
  try {
    const context = await browser.newContext();
    // No real/synthetic YouTube request is sent: both implementations get the same unavailable thumbnail state.
    await context.route("https://img.youtube.com/**", (route) => route.abort());
    const next = await context.newPage(),
      legacy = await context.newPage();
    const pageErrors: string[] = [];
    next.on("pageerror", (error) => pageErrors.push(error.message));
    await next.goto(stack.app + "/login");
    await next.locator("#username").fill("visual-test");
    await next.locator("#password").fill(stack.password);
    await Promise.all([
      next.waitForURL(stack.app + "/admin"),
      next.getByRole("button", { name: "Sign in", exact: true }).click(),
    ]);
    mkdirSync("test-results/visual", { recursive: true });
    const routes = [
      ["/", "index"],
      ["/admin", "admin-dashboard"],
      ["/admin/sobre", "admin-sobre"],
      ["/admin/musicas", "admin-musicas"],
      ["/admin/eventos", "admin-eventos"],
      ["/admin/conta", "admin-conta"],
    ] as const;
    for (const populated of [false, true]) {
      await stack.populate(populated);
      for (const width of [390, 768, 1440]) {
        await next.setViewportSize({ width, height: 900 });
        await legacy.setViewportSize({ width, height: 900 });
        for (const [path, name] of routes) {
          const variant = populated ? "populated" : "empty";
          await Promise.all([
            next.goto(stack.app + path, { waitUntil: "networkidle" }),
            legacy.goto(
              stack.backend + "/__legacy/" + name + "-" + variant + ".html",
              { waitUntil: "networkidle" },
            ),
          ]);
          // Disable only transitions/carets during comparison, identically on both pages.
          for (const page of [next, legacy])
            await page.addStyleTag({
              content:
                "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}",
            });
          const actual = await next.screenshot({ fullPage: true }),
            expected = await legacy.screenshot({ fullPage: true });
          const a = PNG.sync.read(actual),
            b = PNG.sync.read(expected);
          let differing = -1;
          if (a.width === b.width && a.height === b.height) {
            const diff = new PNG({ width: a.width, height: a.height });
            differing = pixelmatch(
              a.data,
              b.data,
              diff.data,
              a.width,
              a.height,
              { threshold: 0.1 },
            );
            if (differing > 0)
              writeFileSync(
                `test-results/visual/${name}-${variant}-${width}-diff.png`,
                PNG.sync.write(diff),
              );
          }
          writeFileSync(
            `test-results/visual/${name}-${variant}-${width}-next.png`,
            actual,
          );
          writeFileSync(
            `test-results/visual/${name}-${variant}-${width}-legacy.png`,
            expected,
          );
          const textA = (await next.locator("body").innerText())
            .replace(/\s+/g, " ")
            .trim();
          const textB = (await legacy.locator("body").innerText())
            .replace(/\s+/g, " ")
            .trim();
          const match = textA === textB;
          results.push({
            path,
            variant,
            width,
            dimensions: [a.width, a.height, b.width, b.height],
            differingPixels: differing,
            textEqual: match,
          });
          console.log(
            `${path} ${variant} ${width}px: diff=${differing}, text=${match}`,
          );
        }
      }
    }
    for (const path of ["/login", "/logout"])
      for (const width of [390, 1440]) {
        await next.setViewportSize({ width, height: 900 });
        await legacy.setViewportSize({ width, height: 900 });
        await Promise.all([
          next.goto(stack.app + path),
          legacy.goto(stack.backend + "/__legacy" + path + ".html"),
        ]);
        await next.locator("body").click({ position: { x: 1, y: 1 } });
        await legacy.locator("body").click({ position: { x: 1, y: 1 } });
        const actual = await next.screenshot({ fullPage: true }),
          expected = await legacy.screenshot({ fullPage: true });
        const a = PNG.sync.read(actual),
          b = PNG.sync.read(expected);
        const differing =
          a.width === b.width && a.height === b.height
            ? pixelmatch(a.data, b.data, undefined, a.width, a.height, {
                threshold: 0.1,
              })
            : -1;
        results.push({ path, width, differingPixels: differing });
        console.log(`${path} ${width}px: diff=${differing}`);
        writeFileSync(
          `test-results/visual/${path.slice(1)}-${width}-next.png`,
          actual,
        );
        writeFileSync(
          `test-results/visual/${path.slice(1)}-${width}-legacy.png`,
          expected,
        );
      }
    await next.setViewportSize({ width: 390, height: 844 });
    await next.goto(stack.app + "/", { waitUntil: "networkidle" });
    for (const section of ["sobre", "musicas", "agenda", "contato"]) {
      await next.locator(`.menu a[data-section="${section}"]`).click();
      await next.waitForFunction(
        (id) =>
          document
            .querySelector(`.menu a[data-section="${id}"]`)
            ?.classList.contains("active"),
        section,
      );
      await next.waitForFunction(
        (id) => {
          const top = document.getElementById(id)!.getBoundingClientRect().top;
          return top >= 0 && top < 300;
        },
        section,
        { timeout: 10000 },
      );
      const top = await next
        .locator("#" + section)
        .evaluate((el) => el.getBoundingClientRect().top);
      assert.ok(
        top >= 0 && top < 300,
        `Menu target ${section} visible below navbar: ${top}`,
      );
    }
    await next.goto(stack.app + "/admin/eventos", { waitUntil: "networkidle" });
    next.once("dialog", (dialog) => dialog.dismiss());
    await next
      .getByRole("button", { name: "EXCLUIR EVENTO", exact: true })
      .click();
    assert.equal(
      (await stack.db.query("select * from public.events")).rows.length,
      1,
    );
    next.once("dialog", (dialog) => dialog.accept());
    await Promise.all([
      next.waitForURL("**/admin/eventos?message=event_deleted"),
      next.getByRole("button", { name: "EXCLUIR EVENTO", exact: true }).click(),
    ]);
    assert.equal(
      (await stack.db.query("select * from public.events")).rows.length,
      0,
    );
    await next.goto(stack.app + "/admin/musicas", { waitUntil: "networkidle" });
    await next.locator("#title").fill("BROWSER TEST");
    await next.locator("#artists").fill("BROWSER TEST");
    await next.locator("#youtubeUrl").fill("https://youtu.be/abcdefghijk");
    await Promise.all([
      next.waitForURL("**/admin/musicas?message=music_added"),
      next
        .getByRole("button", { name: "ADICIONAR MÚSICA", exact: true })
        .click(),
    ]);
    assert.equal(
      (await stack.db.query("select * from public.music")).rows.length,
      7,
    );
    next.once("dialog", (dialog) => dialog.accept());
    await Promise.all([
      next.waitForURL("**/admin/musicas?message=music_deleted"),
      next
        .getByRole("button", { name: "EXCLUIR", exact: true })
        .first()
        .click(),
    ]);
    assert.equal(
      (await stack.db.query("select * from public.music")).rows.length,
      6,
    );
    assert.equal(pageErrors.length, 0, pageErrors.join("\n"));
    writeFileSync(
      "test-results/visual/results.json",
      JSON.stringify({ results, pageErrors }, null, 2),
    );
    assert.ok(
      results.every((r) => r.differingPixels === 0 && r.textEqual !== false),
      "Visual differences remain; inspect screenshots.",
    );
    console.log("Visual parity verified, including mobile menu.");
  } finally {
    await browser.close();
    await stack.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
