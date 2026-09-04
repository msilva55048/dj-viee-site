import { useEffect } from "react";

export function SiteBehavior() {
  useEffect(() => {
    const menuLinks = [
      ...document.querySelectorAll<HTMLAnchorElement>(".menu a[data-section]"),
    ];
    const sections = menuLinks.flatMap((link) => {
      const element = document.getElementById(link.dataset.section!);
      return element ? [{ id: link.dataset.section!, element }] : [];
    });
    const navbarHeight = () =>
      document.querySelector<HTMLElement>(".navbar")?.offsetHeight ?? 0;
    const activate = (id: string | null) =>
      menuLinks.forEach((link) =>
        link.classList.toggle("active", link.dataset.section === id),
      );
    const update = () => {
      const reference = window.scrollY + navbarHeight() + 90;
      let active: string | null = null;
      sections.forEach((section) => {
        if (reference >= section.element.offsetTop) active = section.id;
      });
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 20
      )
        active = "contato";
      activate(active);
    };
    const links = [
      ...document.querySelectorAll<HTMLAnchorElement>(
        'a[href="#sobre"],a[href="#musicas"],a[href="#agenda"],a[href="#contato"]',
      ),
    ];
    const scroll = (event: MouseEvent) => {
      const link = event.currentTarget as HTMLAnchorElement;
      const target = document.querySelector<HTMLElement>(
        link.getAttribute("href")!,
      );
      if (!target) return;
      event.preventDefault();
      window.scrollTo({
        top:
          target.getBoundingClientRect().top +
          window.scrollY -
          navbarHeight() -
          18,
        behavior: "smooth",
      });
      if (link.closest(".menu")) activate(link.dataset.section!);
    };
    links.forEach((link) => link.addEventListener("click", scroll));
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
    return () => {
      links.forEach((link) => link.removeEventListener("click", scroll));
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  return null;
}
