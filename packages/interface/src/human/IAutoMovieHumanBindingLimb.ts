import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanBindingLips } from "./IAutoMovieHumanBindingLips";
import type { IAutoMovieHumanBindingPlane } from "./IAutoMovieHumanBindingPlane";

/**
 * One bone's piece of the binding tree: its capsule, the cuts that hand it skin
 * from its parent, and the comparisons that tell it from its neighbours.
 */
export interface IAutoMovieHumanBindingLimb {
  /** The Human joint the limb starts at. */
  bone: string;

  /** The rig bone's slot. */
  slot: number;

  /** The limb its skin comes from, or null for the root. */
  parent: IAutoMovieHumanBindingLimb | null;

  /** Start of the bone's capsule, metres. */
  from: AutoMovieVector3Tuple;

  /** End of the bone's capsule, metres. */
  to: AutoMovieVector3Tuple;

  /** Capsule radius at the start, metres. */
  near: number;

  /** Capsule radius at the end, metres. */
  far: number;

  /** Largest turn from its parent between the bind and any pose, radians. */
  turn: number;

  /** The cuts that hand skin down from the parent; a point must pass them all. */
  planes: IAutoMovieHumanBindingPlane[];

  /** The jaw's cut along the lips' contact line, or null for any other limb. */
  lips: IAutoMovieHumanBindingLips | null;

  /** Width of the fall to nothing at the midline, metres; zero for no fall. */
  midline: number;

  /** Past this plane a limb has left the midline and the fall no longer applies. */
  clear: IAutoMovieHumanBindingPlane | null;

  /** Side of the body: left 1, right -1, midline 0. */
  side: number;

  /** Limbs that hold skin beside this one, compared by capsule. */
  rivals: IAutoMovieHumanBindingLimb[];

  /** The capsules that answer for this limb in that comparison. */
  own: IAutoMovieHumanBindingLimb[];

  /** Half of a capsule comparison's ramp, metres. */
  contest: number;

  /** Limbs the skin passes on to. */
  kids: IAutoMovieHumanBindingLimb[];
}
