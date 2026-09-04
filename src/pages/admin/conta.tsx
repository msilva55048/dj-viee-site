export { default } from "@/components/Conta";
import type { GetServerSidePropsContext } from "next";
import { adminPage } from "@/server/pages";
export const getServerSideProps = (context: GetServerSidePropsContext) =>
  adminPage(context, "conta");
