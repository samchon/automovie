import type { IAutoMovieDesignChange } from "./IAutoMovieDesignChange";

/**
 * One design alternative: a change set over a common base revision.
 *
 * A variant records opaque changes against shared subject ids instead of
 * duplicating the building. Lineage comparison and view hashing read those
 * strings but never apply them to the underlying graph or verify that untouched
 * geometry/citations match a base revision; the authored production must
 * implement the actual alternative.
 *
 * The base design itself is not a variant; a stamp says so with a null variant.
 */
export interface IAutoMovieDesignVariant {
  /** Stable, non-blank variant identity, unique within the lineage. */
  id: string;

  /** Non-blank human label such as `warm-oak` or `open-plan`. */
  label: string;

  /** Recorded revision every change in this variant applies to. */
  base: string;

  /** Edits this alternative makes; at most one per subject and aspect. */
  changes: IAutoMovieDesignChange[];
}
