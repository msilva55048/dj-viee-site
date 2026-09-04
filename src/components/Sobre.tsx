// Converted from admin/sobre.html; original classes, content and whitespace retained.
import Head from "next/head";
import { formatDate, safeMediaUrl } from "@/lib/format";
import type { ContentProps } from "@/types/content";

export default function Sobre({
  about,
  musics,
  events,
  username,
  csrf,
  successMessage,
  errorMessage,
}: ContentProps) {
  return (
    <>
      <Head>
        <title>Editar Sobre | DJ VIEE</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/css/admin/sobre.css" />
      </Head>{" "}
      <header className="admin-header">
        {" "}
        <div className="admin-brand">
          {" "}
          <small>{" DJ VIEE "}</small> <strong>{" EDITAR SOBRE "}</strong>{" "}
        </div>{" "}
        <a href={"/admin"} className="back-button">
          {" ← VOLTAR "}
        </a>{" "}
      </header>{" "}
      <main className="admin-main">
        {" "}
        <span className="section-label">{" CONTEÚDO DO SITE "}</span>{" "}
        <h1>
          {" SOBRE"}
          <br />
          {" O ARTISTA "}
        </h1>{" "}
        <p className="page-description">
          {
            " Os três textos abaixo aparecem na seção Sobre do site do DJ VIEE. "
          }
        </p>{" "}
        {successMessage ? (
          <div className="success-message">{successMessage}</div>
        ) : null}{" "}
        {errorMessage ? (
          <div className="success-message" role="alert">
            {errorMessage}
          </div>
        ) : null}
        <form action={"/admin/sobre"} method="post" className="about-form">
          <input type="hidden" name="_csrf" value={csrf} />{" "}
          <div className="form-group">
            {" "}
            <label htmlFor="paragraph1">{" PARÁGRAFO 01 "}</label>{" "}
            <textarea
              id="paragraph1"
              name="paragraph1"
              required={true}
              defaultValue={about.paragraph1 ?? ""}
            ></textarea>{" "}
          </div>{" "}
          <div className="form-group">
            {" "}
            <label htmlFor="paragraph2">{" PARÁGRAFO 02 "}</label>{" "}
            <textarea
              id="paragraph2"
              name="paragraph2"
              required={true}
              defaultValue={about.paragraph2 ?? ""}
            ></textarea>{" "}
          </div>{" "}
          <div className="form-group">
            {" "}
            <label htmlFor="paragraph3">{" PARÁGRAFO 03 "}</label>{" "}
            <textarea
              id="paragraph3"
              name="paragraph3"
              required={true}
              defaultValue={about.paragraph3 ?? ""}
            ></textarea>{" "}
          </div>{" "}
          <div className="form-footer">
            {" "}
            <button type="submit" className="save-button">
              {" SALVAR ALTERAÇÕES "}
            </button>{" "}
          </div>{" "}
        </form>{" "}
        {about.updatedAt !== null ? (
          <p className="updated-at">
            {" Última alteração: "}
            <span>{formatDate(about.updatedAt, true)}</span>{" "}
          </p>
        ) : null}{" "}
      </main>{" "}
    </>
  );
}
