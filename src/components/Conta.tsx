// Converted from admin/conta.html; original classes, content and whitespace retained.
import Head from "next/head";
import { formatDate, safeMediaUrl } from "@/lib/format";
import type { ContentProps } from "@/types/content";

export default function Conta({
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
        <title>Conta | DJ VIEE</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/css/admin/conta.css" />
      </Head>{" "}
      <header className="admin-header">
        {" "}
        <div className="admin-brand">
          {" "}
          <small>{" DJ VIEE "}</small> <strong>{" CONTA "}</strong>{" "}
        </div>{" "}
        <a href={"/admin"} className="back-button">
          {" ← VOLTAR "}
        </a>{" "}
      </header>{" "}
      <main className="admin-main">
        {" "}
        <span className="section-label">{" SEGURANÇA "}</span>{" "}
        <h1>
          {" CONTA"}
          <br />
          {" ADMIN "}
        </h1>{" "}
        <p className="page-description">
          {
            " Gerencie a senha utilizada para acessar o painel administrativo do site. "
          }
        </p>{" "}
        <div className="account-info">
          {" "}
          <span>{" USUÁRIO "}</span> <strong>{username}</strong>{" "}
        </div>{" "}
        {successMessage ? (
          <div className="message success-message">{successMessage}</div>
        ) : null}{" "}
        {errorMessage ? (
          <div className="message error-message">{errorMessage}</div>
        ) : null}{" "}
        <form
          action={"/admin/conta/senha"}
          method="post"
          className="password-form"
        >
          <input type="hidden" name="_csrf" value={csrf} />{" "}
          <h2>{" ALTERAR SENHA "}</h2>{" "}
          <div className="form-group">
            {" "}
            <label htmlFor="currentPassword">{" SENHA ATUAL "}</label>{" "}
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              required={true}
              autoComplete="current-password"
            />{" "}
          </div>{" "}
          <div className="form-group">
            {" "}
            <label htmlFor="newPassword">{" NOVA SENHA "}</label>{" "}
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              required={true}
              minLength={8}
              autoComplete="new-password"
            />{" "}
          </div>{" "}
          <div className="form-group">
            {" "}
            <label htmlFor="confirmPassword">
              {" CONFIRMAR NOVA SENHA "}
            </label>{" "}
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              required={true}
              minLength={8}
              autoComplete="new-password"
            />{" "}
          </div>{" "}
          <p className="password-help">
            {" A nova senha deve possuir pelo menos 8 caracteres. "}
          </p>{" "}
          <button type="submit" className="save-button">
            {" ALTERAR SENHA "}
          </button>{" "}
        </form>{" "}
        <p className="security-note">
          {
            " A senha é armazenada de forma criptografada no banco de dados. O sistema não armazena a senha original em texto puro. "
          }
        </p>{" "}
      </main>{" "}
    </>
  );
}
