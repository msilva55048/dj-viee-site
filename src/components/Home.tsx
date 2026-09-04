// Converted from index.html; original classes, content and whitespace retained.
import Head from "next/head";
import { formatDate, safeMediaUrl } from "@/lib/format";
import type { ContentProps } from "@/types/content";
import { SiteBehavior } from "./SiteBehavior";
export default function Home({
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
        <title>DJ VIEE</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/css/style.css" />
        <meta
          name="description"
          content="Site oficial do DJ VIEE. Mega Funk, lançamentos, agenda, press kit e contratação para eventos."
        />
      </Head>{" "}
      <div className="noise"></div>{" "}
      <a
        href="https://wa.me/5548998351892?text=Ol%C3%A1%21%20Vi%20o%20site%20do%20DJ%20VIEE%20e%20gostaria%20de%20informa%C3%A7%C3%B5es%20sobre%20contrata%C3%A7%C3%A3o%20para%20um%20evento."
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-floating"
        aria-label="Falar com DJ VIEE pelo WhatsApp"
      >
        {" "}
        <span className="whatsapp-icon">
          {" "}
          <svg viewBox="0 0 32 32" aria-hidden="true">
            {" "}
            <path d="M16.04 3C9.39 3 4 8.27 4 14.77c0 2.3.68 4.55 1.96 6.47L4 29l8.02-1.9a12.2 12.2 0 0 0 4.02.69C22.69 27.79 28 22.52 28 16S22.69 3 16.04 3Zm0 22.66c-1.3 0-2.58-.26-3.77-.76l-.27-.11-4.76 1.13 1.18-4.51-.18-.29a9.45 9.45 0 0 1-1.49-5.1c0-5.25 4.17-9.52 9.29-9.52 5.13 0 9.3 4.27 9.3 9.52s-4.17 9.64-9.3 9.64Z"></path>{" "}
            <path d="M21.19 18.55c-.28-.14-1.65-.81-1.9-.9-.26-.09-.44-.14-.63.14-.19.28-.72.9-.88 1.09-.16.18-.33.21-.61.07-.28-.14-1.18-.43-2.25-1.38-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.13-.13.28-.33.42-.49.14-.16.19-.28.28-.46.09-.19.05-.35-.02-.49-.07-.14-.63-1.51-.86-2.07-.23-.55-.46-.47-.63-.48h-.54c-.19 0-.49.07-.74.35-.26.28-.98.95-.98 2.32 0 1.37 1 2.69 1.14 2.88.14.19 1.97 3 4.77 4.21.67.29 1.19.46 1.6.59.67.21 1.28.18 1.76.11.54-.08 1.65-.67 1.88-1.32.23-.65.23-1.21.16-1.32-.07-.12-.25-.19-.53-.33Z"></path>{" "}
          </svg>{" "}
        </span>{" "}
        <span className="whatsapp-text">{" WHATSAPP "}</span>{" "}
      </a>{" "}
      <nav className="navbar">
        {" "}
        <a href="#inicio" className="logo" aria-label="DJ VIEE - Início">
          {" "}
          <img src={"/imagem/logo-dj-viee.png"} alt="DJ VIEE" />{" "}
        </a>{" "}
        <div className="menu">
          {" "}
          <a
            href="https://www.dropbox.com/scl/fo/qx6zogp4uh0iexfxzgcm7/ALyMqMw8RLJR0vvL6BYujsY?rlkey=068dhr8di51nsulq9i1alyrah&st=5998dv52&dl=0"
            target="_blank"
            rel="noopener noreferrer"
          >
            {" PressKit "}
          </a>{" "}
          <a href="#sobre" data-section="sobre">
            {" Sobre "}
          </a>{" "}
          <a href="#musicas" data-section="musicas">
            {" Músicas "}
          </a>{" "}
          <a href="#agenda" data-section="agenda">
            {" Agenda "}
          </a>{" "}
          <a href="#contato" data-section="contato">
            {" Contrate "}
          </a>{" "}
        </div>{" "}
      </nav>{" "}
      <header className="hero" id="inicio">
        {" "}
        <div className="grid-background"></div>{" "}
        <div className="hero-glow hero-glow-green"></div>{" "}
        <div className="hero-glow hero-glow-purple"></div>{" "}
        <div className="hero-container">
          {" "}
          <div className="hero-content">
            {" "}
            <div className="tag">
              {" "}
              <span className="green-dot"></span>
              {" MEGA FUNK • OPEN FORMAT • LIVE EXPERIENCE "}
            </div>{" "}
            <h1>
              {" DJ "}
              <span>{" VIEE "}</span>{" "}
            </h1>{" "}
            <p className="hero-description">
              {
                " DJ VIEE traz energia, identidade e uma seleção musical que conecta o público do início ao fim. Com sets envolventes e presença marcante, transforma qualquer evento em uma experiência única. Leve o DJ VIEE para o seu club, festa ou evento e eleve o nível da sua noite. "
              }
            </p>{" "}
            <div className="hero-buttons">
              {" "}
              <a href="#contato" className="btn btn-primary">
                {" CONTRATAR PARA EVENTO "}
              </a>{" "}
              <a href="#musicas" className="btn btn-secondary">
                {" OUVIR LANÇAMENTOS "}
              </a>{" "}
            </div>{" "}
          </div>{" "}
          <div className="hero-photo">
            {" "}
            <div className="photo-frame">
              {" "}
              <div className="photo-label">
                {" "}
                <span className="photo-label-line"></span>
                {" DJ VIEE "}
              </div>{" "}
              <img
                src={"/imagem/dj-viee-perfil.png"}
                alt="DJ VIEE"
                className="dj-photo"
              />{" "}
              <div className="photo-gradient"></div>{" "}
              <div className="photo-signature">
                {" "}
                <small>{" ARTISTA "}</small> <strong>{" VIEE "}</strong>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </header>{" "}
      <section className="about" id="sobre">
        {" "}
        <div className="container">
          {" "}
          <span className="section-label">{" ARTISTA "}</span>{" "}
          <h2>
            {" SOM QUE"}
            <br />
            {" MOVIMENTA A PISTA. "}
          </h2>{" "}
          <div className="about-grid">
            {" "}
            <div className="about-text">
              {" "}
              <p>{about.paragraph1}</p> <p>{about.paragraph2}</p>{" "}
              <p>{about.paragraph3}</p>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </section>{" "}
      <section className="music" id="musicas">
        {" "}
        <div className="container">
          {" "}
          <span className="section-label">{" DISCOGRAFIA "}</span>{" "}
          <h2>
            {" LANÇAMENTOS"}
            <br />
            {" EM DESTAQUE "}
          </h2>{" "}
          <div className="tracks">
            {" "}
            {musics.map((music, index) => (
              <a
                key={music.id}
                href={safeMediaUrl(music.youtubeUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="track"
              >
                {" "}
                <div className="track-cover">
                  {" "}
                  <img
                    src={
                      "https://img.youtube.com/vi/" +
                      music.youtubeVideoId +
                      "/hqdefault.jpg"
                    }
                    alt={"Capa da música " + music.title}
                  />{" "}
                  <span className="track-badge">{" YOUTUBE "}</span>{" "}
                  <span className="track-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>{" "}
                </div>{" "}
                <div className="track-content">
                  {" "}
                  <small>{music.artists}</small> <h3>{music.title}</h3>{" "}
                </div>{" "}
              </a>
            ))}{" "}
          </div>{" "}
        </div>{" "}
      </section>{" "}
      <section className="events" id="agenda">
        {" "}
        <div className="events-glow"></div>{" "}
        <div className="container">
          {" "}
          <div className="events-header">
            {" "}
            <div>
              {" "}
              <span className="section-label">{" AGENDA "}</span>{" "}
              <h2>
                {" PRÓXIMOS"}
                <br />
                {" EVENTOS "}
              </h2>{" "}
            </div>{" "}
            <p className="events-intro">
              {
                " Acompanhe as próximas apresentações do DJ VIEE, confira locais, cidades e informações de cada evento. "
              }
            </p>{" "}
          </div>{" "}
          {events.length === 0 ? (
            <div className="no-events">
              {" "}
              <div className="no-events-icon">{" + "}</div>{" "}
              <div>
                {" "}
                <strong>{" NOVAS DATAS EM BREVE "}</strong>{" "}
                <p>
                  {
                    " Nenhum evento cadastrado no momento. Acompanhe as próximas atualizações da agenda. "
                  }
                </p>{" "}
              </div>{" "}
            </div>
          ) : null}{" "}
          {events.length > 0 ? (
            <div className="events-list">
              {" "}
              {events.map((event) => (
                <article key={event.id} className="event-card">
                  {" "}
                  <div className="event-date-box">
                    {" "}
                    <span className="event-date-label">{" DATA "}</span>{" "}
                    <strong className="event-date">
                      {formatDate(event.eventDate)}
                    </strong>{" "}
                  </div>{" "}
                  <div className="event-info">
                    {" "}
                    <span className="event-status">
                      {" "}
                      <span className="event-status-dot"></span>
                      {" PRÓXIMO EVENTO "}
                    </span>{" "}
                    <h3>{event.title}</h3>{" "}
                    <div className="event-location">
                      {" "}
                      <span>{event.location}</span>{" "}
                      <span className="separator">{" • "}</span>{" "}
                      <span>{event.city}</span>{" "}
                    </div>{" "}
                    {Boolean(event.description) ? (
                      <p className="event-description">{event.description}</p>
                    ) : null}{" "}
                  </div>{" "}
                </article>
              ))}{" "}
            </div>
          ) : null}{" "}
        </div>{" "}
      </section>{" "}
      <section className="contact" id="contato">
        {" "}
        <div className="contact-decoration contact-decoration-left"></div>{" "}
        <div className="contact-decoration contact-decoration-right"></div>{" "}
        <div className="container contact-container">
          {" "}
          <div className="contact-topline">
            {" "}
            <span className="contact-dot"></span>
            {" BOOKING • CLUBES • FESTAS • EVENTOS "}
          </div>{" "}
          <h2>
            {" SUA NOITE."}
            <br /> <span>{" OUTRO NÍVEL. "}</span>{" "}
          </h2>{" "}
          <p className="contact-description">
            {
              " Leve a energia do DJ VIEE para o seu evento. Clubes, festas, formaturas, eventos privados e experiências que pedem uma pista em movimento do início ao fim. "
            }
          </p>{" "}
          <div className="contact-callout">
            {" "}
            <span>{" DISPONIBILIDADE DE DATAS "}</span>{" "}
            <strong>{" CONSULTE AGORA "}</strong>{" "}
          </div>{" "}
          <div className="contact-buttons">
            {" "}
            <a
              href="https://wa.me/5548998351892?text=Ol%C3%A1%21%20Vi%20o%20site%20do%20DJ%20VIEE%20e%20gostaria%20de%20informa%C3%A7%C3%B5es%20sobre%20contrata%C3%A7%C3%A3o%20para%20um%20evento."
              target="_blank"
              rel="noopener noreferrer"
              className="contact-button contact-button-main"
            >
              {" "}
              <span>{" CONTRATAR DJ VIEE "}</span>{" "}
              <span className="contact-arrow">{" ↗ "}</span>{" "}
            </a>{" "}
            <a
              href="https://www.instagram.com/djviee/"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-button contact-button-outline"
            >
              {" "}
              <span>{" INSTAGRAM "}</span>{" "}
              <span className="contact-arrow">{" ↗ "}</span>{" "}
            </a>{" "}
          </div>{" "}
          <div className="contact-note">
            {" "}
            <span></span>
            {
              " Para informações de cachê, disponibilidade e condições, entre em contato pelo canal oficial. "
            }
            <span></span>{" "}
          </div>{" "}
        </div>{" "}
      </section>{" "}
      <footer>
        {" "}
        <span>{" © 2026 DJ VIEE "}</span>{" "}
        <span>{" TODOS OS DIREITOS RESERVADOS "}</span>{" "}
      </footer>{" "}
      <SiteBehavior />
    </>
  );
}
