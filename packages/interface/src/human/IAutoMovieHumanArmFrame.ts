import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanWalkPart } from "./IAutoMovieHumanWalkPart";
import type { IAutoMovieHumanArmBones } from "./IAutoMovieHumanArmBones";
import type { IAutoMovieHumanArmJointWindows } from "./IAutoMovieHumanArmJointWindows";
import type { IAutoMovieHumanArmWalk } from "./IAutoMovieHumanArmWalk";

/**
 * Type contracts exchanged by AutoMovieHumanArmFrame; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanArmFrame {
  /**
   * Original placement/control inputs; no completed source or neighbouring part
   * is required.
   */
  export interface IInput {
    /** Side-qualified original owner name. */
    name: string;

    /** Neutral GH, elbow and wrist datums in calibration mm. */
    bones: Pick<IAutoMovieHumanArmBones.IBones, "shoulder" | "elbow" | "wrist">;

    /** Actual third metacarpal head, calibration mm. */
    knuckle: AutoMovieVector3Tuple;

    /** Anatomically declared distal palm reach, calibration mm. */
    reach: number;

    /** Unsolved named site boxes and tape inputs, proximal first. */
    sites: IAutoMovieHumanArmWalk.ISiteLaw[];

    /**
     * Public joint depth laws controlling the unchanged axis turns, calibration
     * mm.
     */
    joints: IAutoMovieHumanArmJointWindows;

    /** Existing display subdivision spacing, calibration mm. */
    gap: number;

    /** Optional palmar crease locus, calibration mm. */
    crease?: AutoMovieVector3Tuple;

    /** Optional signed across-hand direction defining the material roll. */
    radial?: AutoMovieVector3Tuple;

    /** Existing periodic compatibility and display order. */
    order: number;
  }

  /** Common axis/site chart before any native girth solve, scalar curve or loft. */
  export interface IOutput {
    /** Pure jointed axis, site stations, source pole and original frame mapping. */
    source: IAutoMovieHumanWalkPart.ISource;

    /** Proximal support distance inside the shoulder girdle, calibration mm. */
    run: number;

    /** Actual rigid GH-to-elbow distance, calibration mm. */
    humerus: number;
  }
}
