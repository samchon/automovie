import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanWebColumn } from "./IAutoMovieHumanWebColumn";

/** A web's column down one child: from the crest to the child's section along the web's own separatrix.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation A web's column down one child: from the crest to the child's section along the web's own separatrix.
 * @evidence contracts/development/design.md#principled-representation `phi`: Phase where it meets the child's section. `q`: The point where it meets the child's section, mm. `d`: The child's inward direction there.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanWebMesh.own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `phi`, `q`, `d`, `eta`, `xi`, `depth`, `own`, `rows`, `beside`; callers supply the complete record.
 */
export interface IAutoMovieHumanWebChild {
  /** Phase where it meets the child's section. */
  phi: number;

  /** The point where it meets the child's section, mm. */
  q: AutoMovieVector3Tuple;

  /** The child's inward direction there. */
  d: AutoMovieVector3Tuple;

  /** Unit from the crest toward the child, across the web, along its own column. */
  eta: AutoMovieVector3Tuple;

  /** Unit along the margin from the first pinch toward the second, square to `eta`. */
  xi: AutoMovieVector3Tuple;

  /** Depth of its arrival past the crest, mm. */
  depth: number;

  /**
   * Its point at a depth past the crest, mm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Its point at a depth past the crest, mm.
   */
  own: (depth: number) => AutoMovieVector3Tuple;

  /** Its vertices from the crest to the section. */
  rows: number[];

  /** The column law beside the web on each side the child has there. */
  beside: IAutoMovieHumanWebChild.IBeside[];
}

/** Type contracts exchanged by IAutoMovieHumanWebChild; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanWebChild {
  /** The column law beside a web on one side of the child.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The column law beside a web on one side of the child.
   * @evidence contracts/development/design.md#principled-representation `side`: Which side of the web, -1 at the first pinch's side. `law`: The plain column at a chart distance from the pinch, margin radii. `reach`: The greatest chart distance the law serves before the next web's columns, margin radii.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanWebColumns.besides, AutoMovieHumanWebColumns.list.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `side`, `law`, `reach`; callers supply the complete record.
   */
  export interface IBeside {
    /** Which side of the web, -1 at the first pinch's side. */
    side: number;

    /**
     * The plain column at a chart distance from the pinch, margin radii.
     *
     * @evidence contracts/development/common.md#meaningful-documentation The plain column at a chart distance from the pinch, margin radii.
     */
    law: (y: number) => Plain;

    /** The greatest chart distance the law serves before the next web's columns, margin radii. */
    reach: number;
  }

  /** A column away from the pinches.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A column away from the pinches.
   * @evidence contracts/development/design.md#principled-representation A column away from the pinches. Extract< IAutoMovieHumanWebColumn, { kind: "plain"; } > retains the referenced owner's constraints and mutability.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanWebChild.Plain is the canonical exchange used by IAutoMovieHumanWebChild.IBeside.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by IAutoMovieHumanWebChild.IBeside for a column away from the pinches.
   */
  export type Plain = Extract<
    IAutoMovieHumanWebColumn,
    {
      /** Discriminant selecting the plain representation. */
      kind: "plain";
    }
  >;
}
