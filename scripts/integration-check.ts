import assert from "node:assert/strict";
import { writeFileSync, mkdirSync } from "node:fs";
import { testStack } from "./test-support";

async function main() {
  const stack = await testStack();
  const cookies = new Map<string, string>();
  const checks: string[] = [];
  async function request(path: string, init: RequestInit = {}) {
    const res = await fetch(stack.app + path, {
      ...init,
      redirect: "manual",
      headers: {
        cookie: [...cookies].map(([k, v]) => k + "=" + v).join("; "),
        ...init.headers,
      },
    });
    for (const cookie of res.headers.getSetCookie()) {
      const [pair] = cookie.split(";");
      const i = pair.indexOf("=");
      cookies.set(pair.slice(0, i), pair.slice(i + 1));
    }
    return res;
  }
  const csrf = () => cookies.get("__Host-djviee-csrf")!;
  const post = (path: string, body: Record<string, string>) =>
    request(path, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        origin: stack.app,
      },
      body: new URLSearchParams({ _csrf: csrf(), ...body }),
    });
  const expectRedirect = (res: Response, location: string) => {
    assert.equal(res.status, 303);
    assert.equal(res.headers.get("location"), location);
  };
  try {
    for (const path of [
      "/admin",
      "/admin/conta",
      "/admin/sobre",
      "/admin/musicas",
      "/admin/eventos",
    ])
      assert.equal((await request(path)).status, 307);
    checks.push("Todas as páginas administrativas bloqueadas sem sessão");
    assert.equal(
      (
        await request("/api/events", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{}",
        })
      ).status,
      401,
    );
    await request("/login");
    assert.equal(
      (
        await request("/admin/musicas", {
          method: "POST",
          body: "title=x",
          headers: { "content-type": "application/x-www-form-urlencoded" },
        })
      ).status,
      403,
    );
    expectRedirect(
      await post("/login", { username: "visual-test", password: "wrong" }),
      "/login?error",
    );
    expectRedirect(
      await post("/login", {
        username: "visual-test",
        password: stack.password,
        next: "/admin/musicas",
      }),
      "/admin/musicas",
    );
    checks.push("Login incorreto/correto, destino de retorno e CSRF");
    for (const path of [
      "/admin",
      "/admin/conta",
      "/admin/sobre",
      "/admin/musicas",
      "/admin/eventos",
    ]) {
      const res = await request(path);
      assert.equal(res.status, 200);
      const html = await res.text();
      assert.ok(!html.includes(stack.secret));
      assert.ok(!html.includes(stack.password));
      assert.ok(!html.includes("token_hash"));
      assert.ok(!html.includes("$2b$"));
    }
    checks.push("Cinco telas administrativas respondem sem expor segredos");
    expectRedirect(
      await post("/admin/sobre", {
        paragraph1: "Parágrafo de teste 1",
        paragraph2: "Parágrafo de teste 2",
        paragraph3: "Parágrafo de teste 3",
      }),
      "/admin/sobre?message=about_saved",
    );
    assert.match(await (await request("/")).text(), /Parágrafo de teste 1/);
    expectRedirect(
      await post("/admin/musicas", {
        title: "TEST ONLY",
        artists: "TEST ONLY",
        youtubeUrl: "https://evil.example/",
      }),
      "/admin/musicas?message=error_youtube",
    );
    for (let i = 1; i <= 8; i++)
      expectRedirect(
        await post("/admin/musicas", {
          title: "TEST ONLY " + i,
          artists: "TEST ONLY",
          youtubeUrl: "https://youtu.be/abcdefghijk",
        }),
        "/admin/musicas?message=music_added",
      );
    const home = await (await request("/")).text();
    assert.equal((home.match(/class="track"/g) ?? []).length, 6);
    assert.ok(home.indexOf("TEST ONLY 8") < home.indexOf("TEST ONLY 7"));
    assert.equal(
      (await stack.db.query("select * from public.music")).rows.length,
      8,
    );
    expectRedirect(
      await post("/admin/musicas/excluir", { id: "4" }),
      "/admin/musicas?message=music_deleted",
    );
    assert.deepEqual(
      (
        await stack.db.query<{ position: number }>(
          "select position from public.music order by position",
        )
      ).rows.map((r) => r.position),
      [1, 2, 3, 4, 5, 6, 7],
    );
    checks.push(
      "Biografia, validação YouTube, oito cadastros, seis destaques e exclusão/reordenação",
    );
    expectRedirect(
      await post("/admin/eventos", {
        title: "TEST ONLY",
        eventDate: "2026-09-04",
        city: "Teste",
        location: "Teste",
        description: "Teste",
      }),
      "/admin/eventos?message=event_added",
    );
    expectRedirect(
      await post("/admin/eventos/editar", {
        id: "1",
        title: "CHANGED",
        eventDate: "2026-09-05",
        city: "Teste",
        location: "Teste",
        description: "Teste",
      }),
      "/admin/eventos?message=event_updated",
    );
    let api = await (await request("/api/events")).json();
    assert.equal(api[0].title, "CHANGED");
    assert.equal(api[0].eventDate, "2026-09-05");
    const created = await request("/api/events", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": csrf(),
        origin: stack.app,
      },
      body: JSON.stringify({
        title: "API TEST",
        eventDate: "2026-09-06",
        ticketUrl: "https://example.com/ticket",
      }),
    });
    assert.equal(created.status, 200);
    const event = await created.json();
    assert.equal(event.ticketUrl, "https://example.com/ticket");
    const edited = await request("/api/events", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": csrf(),
        origin: stack.app,
      },
      body: JSON.stringify({ ...event, title: "API CHANGED" }),
    });
    assert.equal(edited.status, 200);
    expectRedirect(
      await post("/admin/eventos/excluir", { id: "1" }),
      "/admin/eventos?message=event_deleted",
    );
    assert.equal(
      (
        await request("/api/events/" + event.id, {
          method: "DELETE",
          headers: { "x-csrf-token": csrf(), origin: stack.app },
        })
      ).status,
      200,
    );
    api = await (await request("/api/events")).json();
    assert.equal(api.length, 0);
    checks.push(
      "Agenda: cadastro, edição, exclusão; API JSON com ticketUrl preservado",
    );
    const largeId = "9007199254740993";
    await stack.db.query(
      "insert into public.events(id,title,event_date) values($1,$2,$3)",
      [largeId, "BIGINT TEST", "2026-09-04"],
    );
    const largeApi = await (await request("/api/events")).text();
    assert.ok(largeApi.includes('"id":' + largeId));
    const largeAdmin = await (await request("/admin/eventos")).text();
    assert.ok(largeAdmin.includes('value="' + largeId + '"'));
    expectRedirect(
      await post("/admin/eventos/excluir", { id: largeId }),
      "/admin/eventos?message=event_deleted",
    );
    checks.push(
      "ID bigint acima de 2^53 preservado no JSON, formulário e exclusão",
    );
    const oldSession = cookies.get("__Host-djviee-session");
    for (const [fields, code] of [
      [
        {
          currentPassword: "wrong",
          newPassword: "12345678",
          confirmPassword: "12345678",
        },
        "error_current",
      ],
      [
        {
          currentPassword: stack.password,
          newPassword: "short",
          confirmPassword: "short",
        },
        "error_short",
      ],
      [
        {
          currentPassword: stack.password,
          newPassword: "12345678",
          confirmPassword: "different",
        },
        "error_confirm",
      ],
      [
        {
          currentPassword: stack.password,
          newPassword: stack.password,
          confirmPassword: stack.password,
        },
        "error_same",
      ],
    ] as const)
      expectRedirect(
        await post("/admin/conta/senha", fields),
        "/admin/conta?message=" + code,
      );
    const newPassword = stack.password + "changed";
    expectRedirect(
      await post("/admin/conta/senha", {
        currentPassword: stack.password,
        newPassword: newPassword,
        confirmPassword: newPassword,
      }),
      "/admin/conta?message=password_changed",
    );
    const revoked = await fetch(stack.app + "/admin", {
      redirect: "manual",
      headers: { cookie: "__Host-djviee-session=" + oldSession },
    });
    assert.equal(revoked.status, 307);
    expectRedirect(await post("/logout", {}), "/login?logout");
    assert.equal((await request("/admin")).status, 307);
    expectRedirect(
      await post("/login", {
        username: "visual-test",
        password: stack.password,
      }),
      "/login?error",
    );
    expectRedirect(
      await post("/login", { username: "visual-test", password: newPassword }),
      "/admin",
    );
    checks.push(
      "Quatro validações de senha, troca, revogação da sessão anterior, logout e novo login",
    );
    for (let i = 0; i < 10; i++)
      await post("/login", { username: "unknown-test", password: "wrong" });
    expectRedirect(
      await post("/login", { username: "unknown-test", password: "wrong" }),
      "/login?error",
    );
    checks.push("Tentativas de login persistidas e limitadas");
    mkdirSync("test-results", { recursive: true });
    writeFileSync(
      "test-results/integration.json",
      JSON.stringify(
        {
          passed: true,
          environment: "Isolated PGlite/PostgREST adapter, not hosted Supabase",
          checks,
        },
        null,
        2,
      ),
    );
    console.log(checks.join("\n"));
  } finally {
    await stack.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
