// Converted from admin/dashboard.html; original classes, content and whitespace retained.
import Head from "next/head";
import { formatDate, safeMediaUrl } from "@/lib/format";
import type { ContentProps } from "@/types/content";

export default function Dashboard({
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
        <title>Painel Administrativo | DJ VIEE</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/css/admin/dashboard.css" />
      </Head>{" "}
      <header className="admin-header">
        {" "}
        <div className="admin-brand">
          {" "}
          <small>{" DJ VIEE "}</small>{" "}
          <strong>{" PAINEL ADMINISTRATIVO "}</strong>{" "}
        </div>{" "}
        <form action={"/logout"} method="post" className="logout-form">
          <input type="hidden" name="_csrf" value={csrf} />{" "}
          <button type="submit" className="logout-button">
            {" SAIR "}
          </button>{" "}
        </form>{" "}
      </header>{" "}
      <main className="admin-main">
        {" "}
        <span className="admin-label">{" ADMINISTRAÇÃO "}</span>{" "}
        <h1>
          {" CONTROLE DO"}
          <br />
          {" SITE DJ VIEE "}
        </h1>{" "}
        <p className="admin-description">
          {
            " Gerencie as informações públicas do site. Altere a apresentação do artista, músicas, eventos e configurações da conta administrativa. "
          }
        </p>{" "}
        <div className="admin-grid">
          {" "}
          <a href="/admin/sobre" className="admin-card">
            {" "}
            <span className="admin-card-number">{" 01 "}</span>{" "}
            <span className="admin-arrow">{" ↗ "}</span>{" "}
            <div className="admin-card-content">
              {" "}
              <span>{" CONTEÚDO "}</span> <h2>{" SOBRE "}</h2>{" "}
              <p>
                {
                  " Altere os textos de apresentação e biografia exibidos no site. "
                }
              </p>{" "}
            </div>{" "}
          </a>{" "}
          <a href="/admin/musicas" className="admin-card">
            {" "}
            <span className="admin-card-number">{" 02 "}</span>{" "}
            <span className="admin-arrow">{" ↗ "}</span>{" "}
            <div className="admin-card-content">
              {" "}
              <span>{" DISCOGRAFIA "}</span> <h2>{" MÚSICAS "}</h2>{" "}
              <p>
                {
                  " Adicione novos lançamentos, altere músicas existentes ou exclua conteúdos da discografia. "
                }
              </p>{" "}
            </div>{" "}
          </a>{" "}
          <a href="/admin/eventos" className="admin-card">
            {" "}
            <span className="admin-card-number">{" 03 "}</span>{" "}
            <span className="admin-arrow">{" ↗ "}</span>{" "}
            <div className="admin-card-content">
              {" "}
              <span>{" AGENDA "}</span> <h2>{" EVENTOS "}</h2>{" "}
              <p>
                {
                  " Cadastre novas apresentações, edite informações ou remova eventos. "
                }
              </p>{" "}
            </div>{" "}
          </a>{" "}
          <a href="/admin/conta" className="admin-card">
            {" "}
            <span className="admin-card-number">{" 04 "}</span>{" "}
            <span className="admin-arrow">{" ↗ "}</span>{" "}
            <div className="admin-card-content">
              {" "}
              <span>{" SEGURANÇA "}</span> <h2>{" CONTA "}</h2>{" "}
              <p>
                {
                  " Gerencie futuramente a senha e configurações de acesso do administrador. "
                }
              </p>{" "}
            </div>{" "}
          </a>{" "}
        </div>{" "}
      </main>{" "}
      <footer className="admin-footer">
        {" © 2026 DJ VIEE • ÁREA ADMINISTRATIVA "}
      </footer>{" "}
    </>
  );
}
