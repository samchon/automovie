import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieResolvedBone } from "../../../pose/IAutoMovieResolvedBone";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";

/**
 * A two-person hold's key pose adapted to any pair of bodies: the joints of
 * both bodies at the key pose, the target bodies' bone lengths and the hold's
 * contacts go through the interaction mesh (`HumanInteractionMesh`, Ho, Komura
 * and Tai 2010), and each body's adapted joints become its limb goals (each
 * wrist and ankle on its adapted joint, bent toward its adapted elbow or knee)
 * and its root's shift, which the existing limb fits (`resolveHumanPosture`)
 * resolve.
 *
 * The key pose is a coupled solve of the hold on two reference bodies, never
 * authored per hold; a contact keeps the offset between its two joints that the
 * key pose has, so a hand on a back stays a hand's thickness off the spine
 * joint.
 *
 * First pass: a contact's offset is kept as the key pose has it, not scaled to
 * the target bodies' surfaces; the trunk's joint angles are not refitted to the
 * adapted spine, only shifted with the hips.
 */
export namespace IAutoMovieMotionHumanHoldMesh {
  /** Adapt a hold's key pose to a pair of bodies. One body of the key pose. */
  export interface IKey {
    /** The reference body. */
    body: IAutoMovieMotionHumanBody;

    /** Its resolved bones at the key pose. */
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  }

  /** A contact of the hold: a joint of the first body on a joint of the second. */
  export interface IContact {
    /** The first body's joint. */
    a: AutoMovieHumanoidBone;

    /** The second body's joint. */
    b: AutoMovieHumanoidBone;
  }

  /** Adapt a hold's key pose to a pair of bodies. One body's adapted pose. */
  export interface IAdapted {
    /** Its adapted joints, world metres. */
    joints: Map<AutoMovieHumanoidBone, IAutoMovieVector3>;

    /** How far its hips moved from the key pose, world metres. */
    shift: IAutoMovieVector3;

    /**
     * Its limb goals: each wrist and ankle on its joint, bent toward its elbow
     * or knee.
     */
    limbs: IAutoMovieMotionHumanPosture["limbs"];
  }
}
