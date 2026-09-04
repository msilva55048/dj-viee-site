import test from "node:test";
import assert from "node:assert/strict";
import { formatDate, youtubeId, safeMediaUrl } from "../src/lib/format";
import { eventFields, recordId } from "../src/server/validation";
import { validCsrf, csrfToken } from "../src/server/auth";
import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";

test("YouTube formats preserve video identifiers and reject executable/lookalike URLs", () => {
  for (const url of [
    "https://youtu.be/abcdefghijk?t=1",
    "https://www.youtube.com/watch?v=abcdefghijk&list=x",
    "https://youtube.com/embed/abcdefghijk",
    "https://m.youtube.com/shorts/abcdefghijk",
  ])
    assert.equal(youtubeId(url), "abcdefghijk");
  for (const url of [
    "javascript:alert(1)",
    "https://youtube.com.evil.example/watch?v=abcdefghijk",
    "https://evil.example/youtube.com/watch?v=abcdefghijk",
    "https://youtu.be/short",
    "file:///etc/passwd",
  ])
    assert.equal(youtubeId(url), null);
  assert.equal(safeMediaUrl("javascript:alert(1)"), "#");
});
test("Calendar dates and timestamps do not change with timezone", () => {
  assert.equal(formatDate("2026-09-04"), "04/09/2026");
  assert.equal(
    formatDate("2026-09-04T00:01:22.123456", true),
    "04/09/2026 00:01",
  );
  assert.equal(formatDate(null), "");
  assert.throws(() =>
    eventFields({
      title: "x",
      city: "x",
      location: "x",
      eventDate: "2026-02-30",
    }),
  );
  assert.equal(
    eventFields({
      title: " x ",
      city: " x ",
      location: " x ",
      eventDate: "2028-02-29",
    }).event_date,
    "2028-02-29",
  );
});
test("IDs preserve bigint precision and reject invalid inputs", () => {
  assert.equal(recordId("9223372036854775807"), "9223372036854775807");
  for (const id of ["0", "-1", "1 OR 1=1", "9223372036854775808"])
    assert.throws(() => recordId(id));
});
test("CSRF requires the exact cookie token and rejects cross-origin submission", () => {
  const req = new IncomingMessage(new Socket());
  req.headers.host = "localhost:3000";
  const res = new ServerResponse(req);
  const token = csrfToken(req, res);
  req.headers.cookie = (res.getHeader("Set-Cookie") as string[])[0].split(
    ";",
  )[0];
  assert.equal(validCsrf(req, token), true);
  assert.equal(validCsrf(req, "x"), false);
  assert.equal(validCsrf(req, token.slice(0, 63) + "x"), false);
  req.headers.origin = "https://evil.example";
  assert.equal(validCsrf(req, token), false);
  delete req.headers.origin;
  req.headers["sec-fetch-site"] = "cross-site";
  assert.equal(validCsrf(req, token), false);
});
