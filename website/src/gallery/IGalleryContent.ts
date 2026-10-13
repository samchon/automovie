/**
 * Authored article facts observed once by the native adapter. Source and tour
 * links belong to the active document; an image source can remain relative
 * while its node belongs to an inert template. The native display adopts image
 * clones and assigns link destinations in the active document.
 * @author Samchon
 */
export interface IGalleryContent {
  /** Authored display copy; empty native text remains nullable. */
  title: string | null;

  /** Authored period label independent of navigation. */
  era: string | null;

  /** Authored building description independent of view selection. */
  description: string | null;

  /** Resolved source destination for this building. */
  source: string;

  /** Resolved interactive tour, or null when the article has no tour. */
  tour: string | null;

  /** Exterior first, then authored views; the active consumer resolves image and link destinations. */
  images: ReadonlyArray<{ src: string; alt: string; label: string | undefined }>;
}
