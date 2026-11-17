import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanWebChild } from "./IAutoMovieHumanWebChild";

/**
 * A web between two children: the saddle at the crest where two neighbouring
 * digits (or toes) part from each other and from their parent's ring, with
 * the margin's lips and each child's own column down to its section.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation A web between two children: the saddle at the crest where two neighbouring digits (or toes) part from each other and from their parent's ring, with the margin's lips and each child's own column down to its section.
 * @evidence contracts/development/design.md#principled-representation `first`: Its two pinches, the lower vertex first: the first of them. `second`: The second pinch. `A`: The first pinch's point, mm.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanWebColumns.sequence, AutoMovieHumanWebColumns.web.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `first`, `second`, `A`, `B`, `xi`, `ea`, `rho`, `S`, `lips`, `crest`, `children`; callers supply the complete record.
 */
export interface IAutoMovieHumanWeb {
  /** Its two pinches, the lower vertex first: the first of them. */
  first: number;

  /** The second pinch. */
  second: number;

  /** The first pinch's point, mm. */
  A: AutoMovieVector3Tuple;

  /** The second pinch's point, mm. */
  B: AutoMovieVector3Tuple;

  /** Unit from the first pinch to the second. */
  xi: AutoMovieVector3Tuple;

  /** Unit along the parent's surface past the pinches, square to `xi`. */
  ea: AutoMovieVector3Tuple;

  /** Radius of the round margin, half the pinches' chord, mm. */
  rho: number;

  /** The crest, mm. */
  S: AutoMovieVector3Tuple;

  /** Each pinch's lip vertices from the pinch to the crest. */
  lips: Map<number, number[]>;

  /** The crest's vertex. */
  crest: number;

  /** Each child's own column. */
  children: Map<string, IAutoMovieHumanWebChild>;
}
