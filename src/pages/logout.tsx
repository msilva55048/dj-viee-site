import Head from "next/head";
import type { GetServerSidePropsContext } from "next";
import { csrfToken } from "@/server/auth";
export default function Logout({ csrf }: { csrf: string }) {
  return (
    <>
      <Head>
        <title>Confirm Log Out?</title>
        <link rel="stylesheet" href="/default-ui.css" />
      </Head>
      <div className="content">
        <form className="logout-form" method="post" action="/logout">
          <h2>Are you sure you want to log out?</h2>
          <input type="hidden" name="_csrf" value={csrf} />
          <button className="primary" type="submit">
            Log Out
          </button>
        </form>
      </div>
    </>
  );
}
export function getServerSideProps(context: GetServerSidePropsContext) {
  context.res.setHeader("Cache-Control", "private, no-store");
  return { props: { csrf: csrfToken(context.req, context.res) } };
}
