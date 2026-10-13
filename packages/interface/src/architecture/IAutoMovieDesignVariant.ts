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
 * @evidence contracts/common.md#principled-implementation An alternative is a change set over one recorded base revision; `validateDesignLineage` requires the base to resolve, a non-blank label, and at most one change per subject and aspect, keyed by length-prefixed fields so no authored text can forge a collision.
 * @evidence contracts/common.md#clear-and-simple-design An id, a label, a base, and the changes only; untouched subjects inherit everything from the base because the variant never copies the design.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No variant is privileged as a default, and the base design is represented by a null variant in a stamp rather than by a placeholder variant with no changes.
 * @evidence contracts/common.md#meaningful-documentation States the identity scope, label examples, what the base names, the one-change-per-key rule, and how the base design is referred to.
 * @author Samchon
 */
export interface IAutoMovieDesignVariant {
  /** Stable variant identity within the lineage. */
  id: string;

  /** Human label such as `warm-oak` or `open-plan`. */
  label: string;

  /** Revision every change in this variant applies to. */
  base: string;

  /** Edits this alternative makes; at most one per subject and aspect. */
  changes: IAutoMovieDesignChange[];
}
