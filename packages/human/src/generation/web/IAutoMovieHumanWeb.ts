import type { AutoMovieHumanHandVector } from "../hand/AutoMovieHumanHandVector";
import type { IAutoMovieHumanWebChild } from "./IAutoMovieHumanWebChild";

type Vec3 = AutoMovieHumanHandVector.Vec3;

/**
 * A web between two children: the saddle at the crest where two neighbouring
 * digits (or toes) part from each other and from their parent's ring, with
 * the margin's lips and each child's own column down to its section.
 */
export interface IAutoMovieHumanWeb {
  /** Its two pinches, the lower vertex first: the first of them. */
  first: number;

  /** The second pinch. */
  second: number;

  /** The first pinch's point, mm. */
  A: Vec3;

  /** The second pinch's point, mm. */
  B: Vec3;

  /** Unit from the first pinch to the second. */
  xi: Vec3;

  /** Unit along the parent's surface past the pinches, square to `xi`. */
  ea: Vec3;

  /** Radius of the round margin, half the pinches' chord, mm. */
  rho: number;

  /** The crest, mm. */
  S: Vec3;

  /** Each pinch's lip vertices from the pinch to the crest. */
  lips: Map<number, number[]>;

  /** The crest's vertex. */
  crest: number;

  /** Each child's own column. */
  children: Map<string, IAutoMovieHumanWebChild>;
}
