import { IAutoMovieDesignChange } from "./IAutoMovieDesignChange";

/**
 * One design alternative: a change set over a common base revision.
 *
 * An alternative is never a copy of the building. Duplicating the design is
 * precisely what destroys the identity that makes two schemes comparable, so a
 * variant carries only what it changes and every subject it does not name keeps
 * the id, the geometry, and the citations the base revision gave it.
 *
 * The base design itself is not a variant; a stamp says so with a null
 * variant.
 *
 * @evidence contracts/common.md#principled-implementation `validateDesignLineage` requires a unique non-blank id and label, a base that resolves to a recorded revision, change ids unique across the lineage, resolving change subjects, and at most one change per subject and aspect, keyed with length-prefixed fields.
 * @evidence contracts/common.md#clear-and-simple-design A variant is a label, a base, and a delta list over shared subject ids, so comparisons and impact queries diff two change sets instead of two copies of a building.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Two edits of one aspect inside a variant are refused rather than resolved by taking the later one, and the base design is expressed by a null stamp variant instead of a synthetic empty variant.
 * @evidence contracts/common.md#meaningful-documentation States that a variant is a delta and why, what unnamed subjects keep, how the base design is spelled, what the base must resolve to, and the one-change-per-aspect rule.
 * @author Samchon
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
