export { default } from "@/components/Home";
import { publicContent } from "@/server/content";
export async function getServerSideProps() {
  return { props: await publicContent() };
}
