

/**
 * One authored room, object, or camera destination.
 */
export interface IAutoMoviePreviewNavigationItem {
  /** Stable authored destination passed to the apply callback. */
  id: string;

  /** Readable camera or room label displayed by the panel. */
  label: string;

  /** Optional category used to group destinations. */
  group?: string;

  /** Optional additional search terms for this authored destination. */
  keywords?: readonly string[];
}
