import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieResolvedBone } from "../../../pose/IAutoMovieResolvedBone";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";

/**
 * A two-person hold's key pose adapted to any pair of bodies (#3438): the
 * joints of both bodies at the key pose, the target bodies' bone lengths and
 * the hold's contacts go through the interaction mesh
 * (`HumanInteractionMesh`, Ho, Komura and Tai 2010), and each
 * body's adapted joints become its limb goals (each wrist and ankle on its
 * adapted joint, bent toward its adapted elbow or knee) and its root's
 * shift, which the existing limb fits (`resolveHumanPosture`) resolve.
 *
 * The key pose is a coupled solve of the hold on two reference bodies
 * (#3437), never authored per hold; a contact keeps the offset between its
 * two joints that the key pose has, so a hand on a back stays a hand's
 * thickness off the spine joint.
 *
 * First pass: a contact's offset is kept as the key pose has it, not scaled
 * to the target bodies' surfaces; the trunk's joint angles are not refitted
 * to the adapted spine, only shifted with the hips.
 *
 * @evidence contracts/development/common.md#meaningful-documentation joints: Its adapted joints, world metres. shift: How far its hips moved from the key pose, world metres.
 * @evidence contracts/development/design.md#principled-representation joints: Its adapted joints, world metres. shift: How far its hips moved from the key pose, world metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanHoldMesh.ts (HumanHoldMesh.adapt, key); lexicon/HumanHoldMesh.ts (HumanHoldMesh.adapt, k); lexicon/HumanHoldMesh.ts (HumanHoldMesh.adapt, contacts); lexicon/HumanHoldMesh.ts (HumanHoldMesh.adapt.result, c); lexicon/HumanHoldMesh.ts (HumanHoldMesh.adapt, return); lexicon/HumanHoldMesh.ts (HumanHoldMesh.adapt.adapted, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanBody, AutoMovieHumanoidBone, IAutoMovieResolvedBone, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanHoldMesh {
  /**
   * Adapt a hold's key pose to a pair of bodies. One body of the key pose.
   *
   * @evidence contracts/development/common.md#meaningful-documentation body: The reference body. bones: Its resolved bones at the key pose.
   * @evidence contracts/development/design.md#principled-representation body: The reference body. bones: Its resolved bones at the key pose.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanHoldMesh.ts (HumanHoldMesh.adapt, key); lexicon/HumanHoldMesh.ts (HumanHoldMesh.adapt, k).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanBody, AutoMovieHumanoidBone, IAutoMovieResolvedBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IKey {
    /** The reference body. */
    body: IAutoMovieMotionHumanBody;

    /** Its resolved bones at the key pose. */
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  }

  /**
   * A contact of the hold: a joint of the first body on a joint of the second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation a: The first body's joint. b: The second body's joint.
   * @evidence contracts/development/design.md#principled-representation a: The first body's joint. b: The second body's joint.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanHoldMesh.ts (HumanHoldMesh.adapt, contacts); lexicon/HumanHoldMesh.ts (HumanHoldMesh.adapt.result, c).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanoidBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IContact {
    /** The first body's joint. */
    a: AutoMovieHumanoidBone;

    /** The second body's joint. */
    b: AutoMovieHumanoidBone;
  }

  /**
   * Adapt a hold's key pose to a pair of bodies. One body's adapted pose.
   *
   * @evidence contracts/development/common.md#meaningful-documentation joints: Its adapted joints, world metres. shift: How far its hips moved from the key pose, world metres.
   * @evidence contracts/development/design.md#principled-representation joints: Its adapted joints, world metres. shift: How far its hips moved from the key pose, world metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanHoldMesh.ts (HumanHoldMesh.adapt, return); lexicon/HumanHoldMesh.ts (HumanHoldMesh.adapt.adapted, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanoidBone, IAutoMovieVector3, IAutoMovieMotionHumanPosture identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IAdapted {
    /** Its adapted joints, world metres. */
    joints: Map<AutoMovieHumanoidBone, IAutoMovieVector3>;

    /** How far its hips moved from the key pose, world metres. */
    shift: IAutoMovieVector3;

    /** Its limb goals: each wrist and ankle on its joint, bent toward its elbow or knee. */
    limbs: IAutoMovieMotionHumanPosture["limbs"];
  }
}
