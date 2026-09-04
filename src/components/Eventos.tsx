// Converted from admin/eventos.html; original classes, content and whitespace retained.
import Head from "next/head";
import { formatDate, safeMediaUrl } from "@/lib/format";
import type { ContentProps } from "@/types/content";

export default function Eventos({
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
        <title>Eventos | DJ VIEE</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/css/admin/eventos.css" />
      </Head>{" "}
      <header className="admin-header">
        {" "}
        <div className="admin-brand">
          {" "}
          <small>{" DJ VIEE "}</small>{" "}
          <strong>{" GERENCIAR EVENTOS "}</strong>{" "}
        </div>{" "}
        <a href={"/admin"} className="back-button">
          {" ← VOLTAR "}
        </a>{" "}
      </header>{" "}
      <main className="admin-main">
        {" "}
        <span className="section-label">{" AGENDA "}</span>{" "}
        <h1>
          {" GERENCIAR"}
          <br />
          {" EVENTOS "}
        </h1>{" "}
        <p className="page-description">
          {
            " Cadastre novas apresentações do DJ VIEE, altere as informações dos eventos existentes ou remova uma data da agenda. "
          }
        </p>{" "}
        {successMessage ? (
          <div className="message success-message">{successMessage}</div>
        ) : null}{" "}
        {errorMessage ? (
          <div className="message error-message">{errorMessage}</div>
        ) : null}{" "}
        <form action={"/admin/eventos"} method="post" className="event-form">
          <input type="hidden" name="_csrf" value={csrf} />{" "}
          <h2>{" ADICIONAR EVENTO "}</h2>{" "}
          <div className="form-grid">
            {" "}
            <div className="form-group">
              {" "}
              <label htmlFor="title">{" NOME DO EVENTO "}</label>{" "}
              <input
                type="text"
                id="title"
                name="title"
                required={true}
                placeholder="Ex.: DJ VIEE"
              />{" "}
            </div>{" "}
            <div className="form-group">
              {" "}
              <label htmlFor="eventDate">{" DATA "}</label>{" "}
              <input
                type="date"
                id="eventDate"
                name="eventDate"
                required={true}
              />{" "}
            </div>{" "}
            <div className="form-group">
              {" "}
              <label htmlFor="location">{" LOCAL "}</label>{" "}
              <input
                type="text"
                id="location"
                name="location"
                required={true}
                placeholder="Ex.: Nome do clube"
              />{" "}
            </div>{" "}
            <div className="form-group">
              {" "}
              <label htmlFor="city">{" CIDADE "}</label>{" "}
              <input
                type="text"
                id="city"
                name="city"
                required={true}
                placeholder="Ex.: Florianópolis - SC"
              />{" "}
            </div>{" "}
            <div className="form-group form-group-full">
              {" "}
              <label htmlFor="description">{" DESCRIÇÃO "}</label>{" "}
              <textarea
                id="description"
                name="description"
                maxLength={1000}
                placeholder="Informações adicionais sobre o evento..."
              ></textarea>{" "}
            </div>{" "}
          </div>{" "}
          <button type="submit" className="save-button">
            {" ADICIONAR EVENTO "}
          </button>{" "}
        </form>{" "}
        <section className="events-list">
          {" "}
          <h2 className="events-list-title">{" EVENTOS CADASTRADOS "}</h2>{" "}
          {events.length === 0 ? (
            <div className="empty-message">
              {" Nenhum evento cadastrado no momento. "}
            </div>
          ) : null}{" "}
          {events.map((event) => (
            <form
              key={event.id}
              className="event-card"
              action={"/admin/eventos/editar"}
              method="post"
            >
              <input type="hidden" name="_csrf" value={csrf} />{" "}
              <input type="hidden" name="id" defaultValue={event.id ?? ""} />{" "}
              <div className="event-card-header">
                {" "}
                <span>{" EVENTO CADASTRADO "}</span>{" "}
                <strong>{formatDate(event.eventDate)}</strong>{" "}
              </div>{" "}
              <div className="form-grid">
                {" "}
                <div className="form-group">
                  {" "}
                  <label>{" NOME DO EVENTO "}</label>{" "}
                  <input
                    type="text"
                    name="title"
                    required={true}
                    defaultValue={event.title ?? ""}
                  />{" "}
                </div>{" "}
                <div className="form-group">
                  {" "}
                  <label>{" DATA "}</label>{" "}
                  <input
                    type="date"
                    name="eventDate"
                    required={true}
                    defaultValue={event.eventDate ?? ""}
                  />{" "}
                </div>{" "}
                <div className="form-group">
                  {" "}
                  <label>{" LOCAL "}</label>{" "}
                  <input
                    type="text"
                    name="location"
                    required={true}
                    defaultValue={event.location ?? ""}
                  />{" "}
                </div>{" "}
                <div className="form-group">
                  {" "}
                  <label>{" CIDADE "}</label>{" "}
                  <input
                    type="text"
                    name="city"
                    required={true}
                    defaultValue={event.city ?? ""}
                  />{" "}
                </div>{" "}
                <div className="form-group form-group-full">
                  {" "}
                  <label>{" DESCRIÇÃO "}</label>{" "}
                  <textarea
                    name="description"
                    maxLength={1000}
                    defaultValue={event.description ?? ""}
                  ></textarea>{" "}
                </div>{" "}
              </div>{" "}
              <div className="event-actions">
                {" "}
                <button type="submit" className="update-button">
                  {" SALVAR ALTERAÇÕES "}
                </button>{" "}
                <button
                  type="submit"
                  className="delete-button"
                  formAction={"/admin/eventos/excluir"}
                  onClick={(event) => {
                    if (
                      !window.confirm("Deseja realmente excluir este evento?")
                    )
                      event.preventDefault();
                  }}
                >
                  {" EXCLUIR EVENTO "}
                </button>{" "}
              </div>{" "}
            </form>
          ))}{" "}
        </section>{" "}
      </main>{" "}
    </>
  );
}
