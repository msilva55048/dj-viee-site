// Converted from admin/musicas.html; original classes, content and whitespace retained.
import Head from "next/head";
import { formatDate, safeMediaUrl } from "@/lib/format";
import type { ContentProps } from "@/types/content";

export default function Musicas({
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
        <title>Músicas | DJ VIEE</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/css/admin/musicas.css" />
      </Head>{" "}
      <header className="admin-header">
        {" "}
        <div className="admin-brand">
          {" "}
          <small>{" DJ VIEE "}</small>{" "}
          <strong>{" GERENCIAR MÚSICAS "}</strong>{" "}
        </div>{" "}
        <a href={"/admin"} className="back-button">
          {" ← VOLTAR "}
        </a>{" "}
      </header>{" "}
      <main className="admin-main">
        {" "}
        <span className="section-label">{" DISCOGRAFIA "}</span>{" "}
        <h1>
          {" GERENCIAR"}
          <br />
          {" MÚSICAS "}
        </h1>{" "}
        <p className="page-description">
          {
            " Cadastre novos lançamentos do DJ VIEE. Informe o título, os artistas e o link do YouTube. "
          }
        </p>{" "}
        {successMessage ? (
          <div className="message success-message">{successMessage}</div>
        ) : null}{" "}
        {errorMessage ? (
          <div className="message error-message">{errorMessage}</div>
        ) : null}{" "}
        <form action={"/admin/musicas"} method="post" className="music-form">
          <input type="hidden" name="_csrf" value={csrf} />{" "}
          <h2>{" ADICIONAR MÚSICA "}</h2>{" "}
          <div className="form-grid">
            {" "}
            <div className="form-group">
              {" "}
              <label htmlFor="title">{" TÍTULO "}</label>{" "}
              <input
                type="text"
                id="title"
                name="title"
                required={true}
                maxLength={180}
                placeholder="Ex.: MEGA FUNK - NOVO LANÇAMENTO"
              />{" "}
            </div>{" "}
            <div className="form-group">
              {" "}
              <label htmlFor="artists">{" ARTISTAS "}</label>{" "}
              <input
                type="text"
                id="artists"
                name="artists"
                required={true}
                maxLength={220}
                placeholder="Ex.: DJ VIEE & DJ CONVIDADO"
              />{" "}
            </div>{" "}
            <div className="form-group form-group-full">
              {" "}
              <label htmlFor="youtubeUrl">{" LINK DO YOUTUBE "}</label>{" "}
              <input
                type="url"
                id="youtubeUrl"
                name="youtubeUrl"
                required={true}
                maxLength={500}
                placeholder="https://youtu.be/..."
              />{" "}
            </div>{" "}
          </div>{" "}
          <button type="submit" className="save-button">
            {" ADICIONAR MÚSICA "}
          </button>{" "}
        </form>{" "}
        <section className="music-list">
          {" "}
          <h2 className="music-list-title">{" MÚSICAS CADASTRADAS "}</h2>{" "}
          {musics.length === 0 ? (
            <div className="empty-message">
              {" Nenhuma música cadastrada no momento. "}
            </div>
          ) : null}{" "}
          {musics.map((music, index) => (
            <article key={music.id} className="music-card">
              {" "}
              <img
                className="music-cover"
                src={
                  "https://img.youtube.com/vi/" +
                  music.youtubeVideoId +
                  "/hqdefault.jpg"
                }
                alt={"Capa de " + music.title}
              />{" "}
              <div className="music-info">
                {" "}
                <span className="music-position">
                  {"POSIÇÃO " + music.position}
                </span>{" "}
                <h3>{music.title}</h3> <p>{music.artists}</p>{" "}
                <a
                  className="youtube-link"
                  href={safeMediaUrl(music.youtubeUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {music.youtubeUrl}
                </a>{" "}
              </div>{" "}
              <form action={"/admin/musicas/excluir"} method="post">
                <input type="hidden" name="_csrf" value={csrf} />{" "}
                <input type="hidden" name="id" defaultValue={music.id ?? ""} />{" "}
                <button
                  type="submit"
                  className="delete-button"
                  onClick={(event) => {
                    if (
                      !window.confirm("Deseja realmente excluir esta música?")
                    )
                      event.preventDefault();
                  }}
                >
                  {" EXCLUIR "}
                </button>{" "}
              </form>{" "}
            </article>
          ))}{" "}
        </section>{" "}
      </main>{" "}
    </>
  );
}
