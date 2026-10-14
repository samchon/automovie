/**
 * Authored article facts observed once by the native adapter. Source and tour links belong to the active document; an image source can remain relative while its node belongs to an inert template. The native display adopts image clones and assigns link destinations in the active document.
 *
 * @evidence contracts/common.md#principled-implementation The content projection retains authored copy and destinations separately from controller indices; null text and an absent tour remain distinct from synthesized defaults.
 * @evidence contracts/common.md#clear-and-simple-design One DOM-independent record serves deriveGallerySelection while mountGallery retains actual image nodes and opener ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Image and link facts come from the article rather than a second hardcoded collection or expected output table.
 * @evidence contracts/common.md#meaningful-documentation Members state nullable copy, absent tour meaning, source destinations and exterior-first image order.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The erased content record performs no DOM read or selection.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record itself coordinates no cache or effects.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no image listeners or document handles.
 *
 * @author Samchon
 */
export interface IGalleryContent {
  /** Authored display copy; a null native text value is preserved without coercion. */
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
  images: ReadonlyArray<{
    /** Authored image destination; active-document adoption owns resolution. */
    src: string;

    /** Authored alternative text. */
    alt: string;

    /** Optional room-view caption; the exterior receives its fixed UI caption. */
    label: string | undefined;
  }>;
}
