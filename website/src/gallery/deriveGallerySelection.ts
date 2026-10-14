import type { IGalleryContent } from "./IGalleryContent";

/**
 * Project the selected authored article/view without retaining another building's destination. Exterior is view zero; other labels remain authored. Indices must identify existing content and images, as supplied by the controller and authored view buttons; this projection performs no range admission.
 *
 * @evidence contracts/common.md#principled-implementation Array lookup selects the current article and image while mapping its image indices to pressed states; nullable copy and image object identity are preserved.
 * @evidence contracts/common.md#clear-and-simple-design The pure projection keeps display facts independent of native DOM mutation and controller navigation policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exterior's fixed UI caption reflects view-zero convention; all other copy and destinations remain authored without fixture-specific replacements.
 * @evidence contracts/common.md#meaningful-documentation The comment states index premises, exterior caption semantics and the absence of range validation; URL resolution stays with the native adapter.
 * @evidence contracts/performance.md#efficient-algorithms Article/image lookup is constant; pressed-state projection costs O(I) time and result storage for the selected building's I images.
 * @evidence contracts/performance.md#reuse-equivalent-work The projection borrows existing content and image objects rather than cloning them; current pressed states are rebuilt for the current view without retained cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned projection and pressed array survive; no image loads or listeners are acquired.
 */
export function deriveGallerySelection(content: readonly IGalleryContent[], buildingIndex: number, viewIndex: number): {
  /** Current article title without nullable-text coercion. */
  title: string | null;

  /** Current article period label. */
  era: string | null;

  /** Current article description. */
  description: string | null;

  /** Current source destination. */
  source: string;

  /** Current interactive destination, or null when absent. */
  tour: string | null;

  /** One-based current building position and collection size. */
  count: string;

  /** Borrowed current image facts. */
  image: IGalleryContent["images"][number];

  /** Exterior UI caption or authored optional view label. */
  caption: string | undefined;

  /** One current-view flag per authored image, in image order. */
  pressed: boolean[];
} {
  const building: IGalleryContent = content[buildingIndex];
  const image: IGalleryContent["images"][number] = building.images[viewIndex];
  return {
    title: building.title,
    era: building.era,
    description: building.description,
    source: building.source,
    tour: building.tour,
    count: `${buildingIndex + 1} / ${content.length}`,
    image,
    caption: viewIndex === 0 ? "Exterior" : image.label,
    pressed: building.images.map((_image: IGalleryContent["images"][number], index: number): boolean => index === viewIndex),
  };
}
