import type { IAutoMovieQuaternion } from "../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../geometry/IAutoMovieVector3";
import type { IAutoMoviePhysicalProfile } from "../../physics/IAutoMoviePhysicalProfile";
import type { AutoMovieHumanoidBone } from "../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieSkeleton } from "../../skeleton/IAutoMovieSkeleton";

/**
 * Type contracts exchanged by AutoMovieHumanCanonicalBody; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanCanonicalBody {
  /** A Human on the canonical rig. */
  export interface IBody {
    /**
     * The canonical rig at its T-pose rest; consumers read it with
     * `HUMANOID_JOINT_AXES` and `HUMANOID_REST_FRAME`.
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

  /**
   * The options argument of AutoMovieHumanCanonicalBody.prepare. Prepare a
   * Human's polygon man on the canonical rig from its parameters, at the
   * skeleton level: no skin, loft or head surface is built. The bind joints
   * come from Human's own source preparation and skeleton law
   * (`AutoMovieHumanBodyLaw.prepareSources`, its head source and
   * `AutoMovieHumanSkeletonLaw.complete`), about 2 s a body. Each joint's girth
   * radius is perimeter / 2π of the person's own resolved circumference
   * (`AutoMovieHumanBodyAnatomy.resolve`): hip, waist, chest, neck and head for
   * the trunk and head, the arm at the axilla, the forearm, the hand, the
   * thigh, the calf, the ankle and the ball of the foot (0.8 of it at the
   * midfoot, as Human's rig has it); the jaw is 0.12 of the head radius as
   * Human's rig has it, the eye a 12 mm globe (Bekerman et al. 2014), and a
   * digit the stature girth Human uses for an unlofted digit (finger and lesser
   * toe 0.03, hallux 0.04 of stature). The joints then move onto the canonical
   * rig: reflected from Human's registered frame, each arm straightened along
   * ±X by shortest arcs about the shoulder, the elbow and the wrist and
   * pronated until the palm faces -Y, each finger straightened in the palm's
   * plane along its own knuckle line and the thumb's two hinges along its
   * metacarpal (the bind holds a relaxed hand, and a finger angle of zero is
   * the extended finger, as in the VRM T-pose and the Neutral-0 position), each
   * thigh and shank straightened along -Y with the foot keeping its bind
   * orientation, and the whole body raised or lowered so its lowest foot joint
   * sphere touches the floor. Every humanoid-named joint becomes a rig bone
   * with an identity rest rotation, the toes bone at the hallux's
   * metatarsophalangeal joint, and every other joint rides its nearest humanoid
   * ancestor. The contact profile is built from the same joints and radii
   * (`AutoMovieHumanCanonicalProfile`), its colliders the convex hulls of the
   * drawn ring points, so contacts meet what is drawn.
   *
   * @param params The Human's parameters.
   * @param options Body mass in kilograms and the skeleton id.
   * @returns The canonical body.
   */
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
