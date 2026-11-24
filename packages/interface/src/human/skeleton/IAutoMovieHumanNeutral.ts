import type { AutoMovieQuaternionTuple } from "../../geometry/AutoMovieQuaternionTuple";
import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanChainRings } from "./IAutoMovieHumanChainRings";
import type { IAutoMovieHumanJointCentres } from "./IAutoMovieHumanJointCentres";
import type { IAutoMovieHumanSkeletonMath } from "./IAutoMovieHumanSkeletonMath";

/**
 * Bind-derived neutral joint placements, world turns and clinical segment frames.
 *
 * The interface package owns these declarations; AutoMovieHumanNeutral in Human supplies their runtime values.
 */
export namespace IAutoMovieHumanNeutral {
  /** A body's neutral.
   */
  export interface IOutput {
    /** The skeleton standing at neutral, in the bind's order, mm. */
    joints: IAutoMovieHumanJointCentres.IJoint[];

    /** Each bone's world turn from bind to neutral: the achieved offset, inverted. */
    turns: Map<string, AutoMovieQuaternionTuple>;

    /** Each upper arm's and thigh's resting abduction from the plumb line, degrees, by bone. */
    resting: Map<string, number>;

    /** Each forearm's achieved pronation from thumbs forward, degrees. */
    forearms: Map<string, number>;
  }

  /** One bone's segment frame at neutral.
   */
  export interface IFrame {
    /** Bone id. */
    bone: string;

    /** Parent bone, or null for the root. */
    parent: string | null;

    /** Joint centre, mm. */
    centre: AutoMovieVector3Tuple;

    /** End of the segment: the child's centre or the leaf's tip, mm. */
    end: AutoMovieVector3Tuple;

    /** The bone's clinical axes; `twist` runs along the segment. */
    axes: IAutoMovieHumanSkeletonMath.IAxes;
  }

  /** What a body's neutral is derived from: its skin's rings and its bind skeleton.
   */
  export interface ISource {
    /** The skin as rings; at least the chains {@link READS} names. */
    rings: readonly IAutoMovieHumanChainRings[];

    /** The bind skeleton. */
    joints: readonly IAutoMovieHumanJointCentres.IJoint[];
  }

  /** Supplies the neutral's rings and bind skeleton once per call to AutoMovieHumanNeutral.of. */
  export type OfSource = () => ISource;
}
