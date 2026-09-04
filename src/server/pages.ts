import type { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import type { ContentProps } from "@/types/content";
import { currentAdmin, csrfToken } from "./auth";
import { emptyProps, readAbout, readMusic, readEvents } from "./content";

export async function adminPage(
  context: GetServerSidePropsContext,
  section: string,
): Promise<GetServerSidePropsResult<ContentProps>> {
  context.res.setHeader("Cache-Control", "private, no-store");
  const user = await currentAdmin(context.req);
  if (!user)
    return {
      redirect: {
        destination:
          "/login?next=" +
          encodeURIComponent(context.resolvedUrl.split("?")[0]),
        permanent: false,
      },
    };
  const props = {
    ...emptyProps(),
    username: user.username,
    csrf: csrfToken(context.req, context.res),
  };
  if (section === "sobre") props.about = await readAbout();
  if (section === "musicas") props.musics = await readMusic();
  if (section === "eventos") props.events = await readEvents();
  // Only known server-defined messages are accepted; query text is never rendered as HTML.
  const message = context.query.message;
  if (typeof message === "string" && messages[message]) {
    props[message.startsWith("error_") ? "errorMessage" : "successMessage"] =
      messages[message];
  }
  return { props };
}
export const messages: Record<string, string> = {
  about_saved: "Informações atualizadas com sucesso.",
  music_added: "Música adicionada com sucesso.",
  music_deleted: "Música excluída com sucesso.",
  event_added: "Evento adicionado com sucesso.",
  event_updated: "Evento atualizado com sucesso.",
  event_deleted: "Evento excluído com sucesso.",
  password_changed: "Senha alterada com sucesso.",
  error_youtube: "Link do YouTube inválido.",
  error_music: "Música não encontrada.",
  error_event: "Evento não encontrado.",
  error_event_add: "Não foi possível adicionar o evento.",
  error_current: "A senha atual está incorreta.",
  error_short: "A nova senha deve ter pelo menos 8 caracteres.",
  error_confirm: "A confirmação da nova senha não confere.",
  error_same: "A nova senha deve ser diferente da senha atual.",
  error_fields: "Verifique os campos informados.",
  error_operation: "Não foi possível concluir a operação. Tente novamente.",
};
