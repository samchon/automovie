import { IAutoMovieDesignChange } from "./IAutoMovieDesignChange";

/**
 * One design alternative: a change set over a common base revision.
 *
 * A variant records opaque changes against shared subject ids instead of duplicating the building. Lineage comparison and view hashing read those strings but never apply them to the underlying graph or verify that untouched geometry/citations match a base revision; the authored production must implement the actual alternative.
 *
 * The base design itself is not a variant; a stamp says so with a null
 * variant.
 *
 * @evidence contracts/common.md#principled-implementation `validateDesignLineage` requires unique nonblank variant identity/label, a resolving revision base, globally unique change ids, resolving subjects and one change per subject/aspect, using JSON array keys. Comparison uses the shared length-prefixed key encoder and exact value strings; neither owner parses a patch or loads the base design's actual values.
 * @evidence contracts/common.md#clear-and-simple-design Label, base revision and change list form one alternative. Comparison diffs opaque subject/aspect values; impact tracing separately walks declared derived-artifact input edges from caller-supplied changed ids, without cloning or evaluating a building.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Two edits of one aspect inside a variant are refused rather than resolved by taking the later one, and the base design is expressed by a null stamp variant instead of a synthetic empty variant.
 * @evidence contracts/common.md#meaningful-documentation States recorded-delta semantics, caller ownership of applying geometry, base/no-variant spelling, resolving base revision, globally unique change ids and one edit per subject/aspect.
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
