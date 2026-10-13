import { requireGalleryValue } from "./requireGalleryValue";

/**
 * Read authored article content once. The capture marker chooses the opener;
 * the exterior comes from the article independently of the opener's children.
 * Missing required markup fails before the native enhancement binds events.
 */
export function readGalleryBuildings(document: Document) {
  const required = <T extends Element>(root: ParentNode, selector: string): T =>
    requireGalleryValue(root.querySelector<T>(selector), selector);
  return Array.from(document.querySelectorAll<HTMLElement>(".building"), (article) => {
    const opener = required<HTMLAnchorElement>(article, "[data-gallery]");
    const exterior = required<HTMLImageElement>(article, "img");
    const template = required<HTMLTemplateElement>(article, ".building-views");
    return {
      opener,
      title: required<HTMLElement>(article, "h3").textContent,
      era: required<HTMLElement>(article, ".era").textContent,
      description: required<HTMLElement>(article, ".building-description").textContent,
      source: required<HTMLAnchorElement>(article, ".source-link").href,
      tour: article.querySelector<HTMLAnchorElement>(".tour-link"),
      images: [
        exterior,
        ...template.content.querySelectorAll<HTMLImageElement>("img"),
      ],
    };
  });
}
