import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePhysicalProfile } from "../physics/IAutoMoviePhysicalProfile";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";

/**
 * Type contracts exchanged by AutoMovieHumanCanonicalBody; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanCanonicalBody {
  /** A Human on the canonical rig. */
  export interface IBody {
    /**
     * The canonical rig at its T-pose rest; consumers read it with
     * `AutoMovieEngineHumanoidJointAxes` and `AutoMovieEngineHumanoidRestFrame`.
     */
    skeleton: IAutoMovieSkeleton;

    /**
     * The polygon man's contact and mass profile on the rig's bones, segment
     * frames at the rest.
     */
    profile: IAutoMoviePhysicalProfile;

    /**
     * Every Human joint at the rest, canonical frame, parent before child, with
     * its carrier.
     */
    joints: IJoint[];
  }

  /** One Human joint on the canonical rig. */
  export interface IJoint {
    /** Human joint id, including joints the humanoid vocabulary lacks. */
    bone: string;

    /** Parent Human joint, or null at the root. */
    parent: string | null;

    /** The rig bone that carries this joint rigidly. */
    carrier: AutoMovieHumanoidBone;

    /** Rest joint centre, canonical metres. */
    position: [number, number, number];

    /** Rest tip of a leaf segment, canonical metres; null when children end it. */
    tip: [number, number, number] | null;

    /** Girth radius of the segment leaving the joint, metres. */
    radius: number;

    /** A point on the foot's longitudinal heel plane, in canonical metres. */
    heel?: [number, number, number];
  }

  /** One Human joint's placement under a canonical pose. */
  export interface IPlacement {
    /** Human joint id. */
    bone: string;

    /** World joint centre, canonical metres. */
    position: IAutoMovieVector3;

    /** Rotation from the T-pose rest. */
    rotation: IAutoMovieQuaternion;
  }

  /** Required mass and identity for canonical body preparation. */
  export type IPrepareOptions = {
    /**
     * Required body mass in kilograms, forwarded to canonical physical-profile
     * construction; this preparation supplies no default.
     */
    mass: number;
    /**
     * Required skeleton/profile identity used by downstream rig and motion
     * consumers; this preparation supplies no default.
     */
    id: string;
  };
}
