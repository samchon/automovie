import type * as THREE from "three";

/** A card's drawing, as the object gallery's cards hold it. */
export interface IGalleryCard {
  /** What to draw. */
  scene: THREE.Scene;

  /** The camera, framed on the model. */
  camera: THREE.PerspectiveCamera;

  /**
   * Turn the model about the vertical.
   *
   * @param radians The heading.
   */
  turn(radians: number): void;

  /** Release the model's geometry and materials. */
  dispose(): void;
}

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
  const { GalleryCard } = await import("./package/GalleryCard");
  return GalleryCard.build(subject, variant);
}
