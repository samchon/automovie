import type { IGalleryCard } from "./structures/IGalleryCard";

/**
 * Build one archetype's card, importing the archetype and drawing packages
 * only when the first card is drawn.
 *
 * @param subject The producer's export name.
 * @param variant Its first kind, or the empty text when it has none.
 * @returns The card.
 */
export async function loadGalleryCard(
  subject: string,
  variant: string,
): Promise<IGalleryCard> {
  const { GalleryCard }: typeof import("./package/GalleryCard") =
    await import("./package/GalleryCard");
  return GalleryCard.build(subject, variant);
}
