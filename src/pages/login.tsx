import Head from "next/head";
import type { GetServerSidePropsContext } from "next";
import { csrfToken } from "@/server/auth";

export default function Login({
  csrf,
  next,
  error,
  logout,
}: {
  csrf: string;
  next: string;
  error: boolean;
  logout: boolean;
}) {
  return (
    <>
      <Head>
        <title>Please sign in</title>
        <link rel="stylesheet" href="/default-ui.css" />
      </Head>
      <div className="content">
        <form className="login-form" method="post" action="/login">
          <h2>Please sign in</h2>
          {error && (
            <div className="alert alert-danger" role="alert">
              Invalid credentials
            </div>
          )}
          {logout && (
            <div className="alert alert-success" role="alert">
              You have been signed out
            </div>
          )}
          <p>
            <label htmlFor="username" className="screenreader">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Username"
              required
              autoFocus
            />
          </p>
          <p>
            <label htmlFor="password" className="screenreader">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Password"
              required
            />
          </p>
          <input name="_csrf" type="hidden" value={csrf} />
          <input name="next" type="hidden" value={next} />
          <button type="submit" className="primary">
            Sign in
          </button>
        </form>
      </div>
    </>
  );
}
export function getServerSideProps(context: GetServerSidePropsContext) {
  context.res.setHeader("Cache-Control", "private, no-store");
  return {
    props: {
      csrf: csrfToken(context.req, context.res),
      next:
        typeof context.query.next === "string" ? context.query.next : "/admin",
      error: "error" in context.query,
      logout: "logout" in context.query,
    },
  };
}
