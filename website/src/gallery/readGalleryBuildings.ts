import { requireGalleryValue } from "./requireGalleryValue";

/**
 * Read authored article content once. The capture marker chooses the opener; the exterior comes from the article independently of the opener's children. Missing required markup fails before the native enhancement binds events; absent tour links and nullable native text remain unchanged.
 *
 * @evidence contracts/common.md#principled-implementation Native selectors read the active article and inert view template, preserving exterior-first image order and actual opener nodes; required markup is admitted with requireGalleryValue.
 * @evidence contracts/common.md#clear-and-simple-design DOM reading is separate from GalleryController and display projection, keeping index.html as the collection data owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The reader observes authored nodes and link resolution without a parallel collection table or foreign DOM method replacement.
 * @evidence contracts/common.md#meaningful-documentation The comment states missing-markup failure, opener selection, image order and null copy/link handling.
 * @evidence contracts/performance.md#efficient-algorithms One article traversal plus each template's image traversal costs O(A + I) output work in article and image counts, with native selector costs determined by DOM size and O(A + I) returned references.
 * @evidence contracts/performance.md#reuse-equivalent-work Each mount reads its current document once and retains those observations; no global document cache can preserve stale markup across mounts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller retains returned DOM references for its mount lifetime; this reader attaches no events and starts no image task.
 */
export function readGalleryBuildings(document: Document): {
  /** Actual authored capture link whose focus returns after close. */
  opener: HTMLAnchorElement;

  /** Native article title text without coercion. */
  title: string | null;

  /** Native period label text. */
  era: string | null;

  /** Native article description text. */
  description: string | null;

  /** Active-document source-link destination. */
  source: string;

  /** Authored interactive-tour link, or null when absent. */
  tour: HTMLAnchorElement | null;

  /** Exterior image first, then inert-template view nodes in authored order. */
  images: HTMLImageElement[];
}[] {
  const required: <T extends Element>(root: ParentNode, selector: string) => T = <T extends Element>(root: ParentNode, selector: string): T =>
    requireGalleryValue(root.querySelector<T>(selector), selector);
  return Array.from(document.querySelectorAll<HTMLElement>(".building"), (article: HTMLElement): ReturnType<typeof readGalleryBuildings>[number] => {
    const opener: HTMLAnchorElement = required<HTMLAnchorElement>(article, "[data-gallery]");
    const exterior: HTMLImageElement = required<HTMLImageElement>(article, "img");
    const template: HTMLTemplateElement = required<HTMLTemplateElement>(article, ".building-views");
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
