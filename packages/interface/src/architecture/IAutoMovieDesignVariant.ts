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
