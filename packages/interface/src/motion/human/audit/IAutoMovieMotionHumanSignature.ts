import type { IAutoMovieResolvedBone } from "../../../pose/IAutoMovieResolvedBone";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";

/**
 * The kinematic readings of an act's signature: what human-movement studies
 * measure on a performer, read off the displayed bones of a performance.
 *
 * A production checks its own composition with these the way the vocabulary
 * is checked: perform it, then read, at the instants the act's events name,
 * the quantities the literature reports (the trunk's inclination from
 * vertical in the sagittal plane, joint flexions, the whole-body centre of
 * mass, the head's pitch, which feet bear on the floor, the duty factor and
 * the cadence), and compare each with a cited value in a unit test. No
 * reading knows an action; the bounds and their sources belong to the test.
 *
 * ```ts
 * const reader = HumanSignature.of(performance, "a", body, 0);
 * const lean = HumanSignature.trunk(reader, seconds) - HumanSignature.trunk(reader, 0);
 * ```
 *
 * Conventions: the performer's forward is the heading given to the reader,
 * so a positive inclination tips the shoulders ahead of the hips; a flexion
 * is 0 with the joint straight and grows as it folds; a head pitch is
 * positive when the face turns down. A foot bears on the floor when its
 * lowest sole socket (heel, ball or toe) lies within `CONTACT` of the
 * floor's height and is nearly still over it (`SLIDE`). The trunk reading of
 * a quiet stance is not exactly zero on every body, so a lean is read
 * against the same body's standing value.
 *
 * @evidence contracts/development/common.md#meaningful-documentation duration: Seconds from 0 to the end. yaw: The heading their forward is read along, degrees about +Y, 0 facing +Z. duty: The share of the window each foot bears, averaged over both feet.
 * @evidence contracts/development/design.md#principled-representation duration: Seconds from 0 to the end. yaw: The heading their forward is read along, degrees about +Y, 0 facing +Z. duty: The share of the window each foot bears, averaged over both feet.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: audit/HumanSignature.ts (HumanSignature.of, motion); audit/HumanSignature.ts (HumanSignature.of, return); audit/HumanSignature.ts (HumanSignature.bones, reader); audit/HumanSignature.ts (HumanSignature.joint, reader); audit/HumanSignature.ts (HumanSignature.trunk, reader); audit/HumanSignature.ts (HumanSignature.knee, reader).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanoidBone, IAutoMovieResolvedBone, IAutoMovieMotionHumanBody identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanSignature {
  /**
   * What the readings need of a performance: its length and anyone's displayed bones.
   *
   * @evidence contracts/development/common.md#meaningful-documentation duration: Seconds from 0 to the end.
   * @evidence contracts/development/design.md#principled-representation duration: Seconds from 0 to the end.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: audit/HumanSignature.ts (HumanSignature.of, motion).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanoidBone, IAutoMovieResolvedBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IMotion {
    /** Seconds from 0 to the end. */
    duration: number;

    /**
     * A person's displayed world bones at a film second.
     *
     * @param subject The person.
     * @param seconds Film seconds.
     * @returns Resolved bones by rig bone.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents IAutoMovieMotionHumanSignature.IMotion.bones: A person's displayed world bones at a film second.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanSignature.IMotion.bones is used through packages/motions/src/audit/HumanSignature.ts.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanSignature.IMotion.bones is used through packages/motions/src/audit/HumanSignature.ts.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanSignature.IMotion.bones is used through packages/motions/src/audit/HumanSignature.ts.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanSignature.IMotion.bones is used through packages/motions/src/audit/HumanSignature.ts.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanSignature.IMotion.bones is used through packages/motions/src/audit/HumanSignature.ts.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanSignature.IMotion.bones is used through packages/motions/src/audit/HumanSignature.ts.
     */
    bones(
      subject: string,
      seconds: number,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  }

  /**
   * One performer of a motion, as the readings take them.
   *
   * @evidence contracts/development/common.md#meaningful-documentation yaw: The heading their forward is read along, degrees about +Y, 0 facing +Z.
   * @evidence contracts/development/design.md#principled-representation yaw: The heading their forward is read along, degrees about +Y, 0 facing +Z.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: audit/HumanSignature.ts (HumanSignature.of, return); audit/HumanSignature.ts (HumanSignature.bones, reader); audit/HumanSignature.ts (HumanSignature.joint, reader); audit/HumanSignature.ts (HumanSignature.trunk, reader); audit/HumanSignature.ts (HumanSignature.knee, reader); audit/HumanSignature.ts (HumanSignature.hip, reader).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanSignature.IMotion, IAutoMovieMotionHumanBody identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IReader {
    /** The motion. */
    motion: IAutoMovieMotionHumanSignature.IMotion;

    /** The performer. */
    subject: string;

    /** Their body. */
    body: IAutoMovieMotionHumanBody;

    /** The heading their forward is read along, degrees about +Y, 0 facing +Z. */
    yaw: number;
  }

  /**
   * The gait of a window: the duty factor of each foot and the cadence.
   *
   * @evidence contracts/development/common.md#meaningful-documentation duty: The share of the window each foot bears, averaged over both feet.
   * @evidence contracts/development/design.md#principled-representation duty: The share of the window each foot bears, averaged over both feet.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: audit/HumanSignature.ts (HumanSignature.gait, return); audit/HumanSignature.ts (HumanSignature.gait).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in HumanSignature.gait.
   */
  export interface IGait {
    /** The share of the window each foot bears, averaged over both feet. */
    duty: number;

    /** Foot strikes (a foot coming down) per minute, both feet. */
    cadence: number;

    /** The strikes, in time order, with the foot. */
    strikes: {
      /** Observed heel-strike instant in the gait sample's seconds. */
      seconds: number;
      /** Foot whose heel made the observed strike. */
      side: "left" | "right";
    }[];
  }
}
