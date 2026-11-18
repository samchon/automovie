import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";

/**
 * The frame a limb fit is solved in (`solveHumanLimbFit`): the root's world
 * position and heading, so two people of one body doing the same thing in
 * different places, or one body facing another way, solve the same numbers.
 *
 * A pose and its goal are moved into the frame by taking away the root's
 * world position on all three axes and turning by minus its heading about
 * +Y; the limb solver reads only the geometry relative to the
 * root, so a fit solved in the frame is the fit solved in the world, moved.
 * The fitted pose is handed back with the caller's own root, since a limb
 * fit changes the limb's joints and not the root; its seed (the swivel and
 * branch of `fitSeededChainToTarget`) lives in the chain root's bone-local
 * frame, which a turn about +Y and a floor translation leave as they are, so
 * it is handed back unchanged. A goal attached to a bone (`on`), or kept
 * clear of or resting on other bodies' colliders (`clear`, `rests`), names
 * world things the frame would have to carry, and is solved in the world;
 * so is a pose without a root.
 *
 * @evidence contracts/development/common.md#meaningful-documentation x: The root's x, world metres. z: The root's z, world metres.
 * @evidence contracts/development/design.md#principled-representation x: The root's x, world metres. z: The root's z, world metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/HumanLimbFitFrame.ts (HumanLimbFitFrame.of, return); posture/HumanLimbFitFrame.ts (HumanLimbFitFrame.point, frame); posture/HumanLimbFitFrame.ts (HumanLimbFitFrame.pose, frame); posture/HumanLimbFitFrame.ts (HumanLimbFitFrame.goal, frame); posture/HumanLimbFitFrame.ts (HumanLimbFitFrame.statistics, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanLimbFitFrame {
  /**
   * The frame a fit of a pose and a goal is solved in: a root's position and heading.
   *
   * @evidence contracts/development/common.md#meaningful-documentation x: The root's x, world metres. z: The root's z, world metres.
   * @evidence contracts/development/design.md#principled-representation x: The root's x, world metres. z: The root's z, world metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/HumanLimbFitFrame.ts (HumanLimbFitFrame.of, return); posture/HumanLimbFitFrame.ts (HumanLimbFitFrame.point, frame); posture/HumanLimbFitFrame.ts (HumanLimbFitFrame.pose, frame); posture/HumanLimbFitFrame.ts (HumanLimbFitFrame.goal, frame).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IFrame {
    /** The root's x, world metres. */
    x: number;

    /** The root's y, world metres; omission means zero for an explicit floor frame. */
    y?: number;

    /** The root's z, world metres. */
    z: number;

    /** The turn into the frame: minus the heading about +Y. */
    into: IAutoMovieQuaternion;
  }

  /**
   * A body's fit memory counts, the seam a cost test reads.
   *
   * @evidence contracts/development/common.md#meaningful-documentation hits: Fits read from the memory. misses: Fits solved and kept.
   * @evidence contracts/development/design.md#principled-representation hits: Fits read from the memory. misses: Fits solved and kept.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/HumanLimbFitFrame.ts (HumanLimbFitFrame.statistics, return); posture/HumanLimbFitFrame.ts (HumanLimbFitFrame.count); posture/HumanLimbFitFrame.ts (HumanLimbFitFrame.statistics); posture/HumanLimbFitFrame.ts (HumanLimbFitFrame.COUNTS).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanLimbFitFrame.statistics.
   */
  export interface IStatistics {
    /** Fits read from the former fit memory: always 0, since every fit is solved directly; kept while specifications written against the memory read it. */
    hits: number;

    /** Fits solved and kept by the former memory: always 0, for the same reason. */
    misses: number;

    /** Actual solver attempts without a near seed, including failed attempts. */
    coldFits: number;

    /** Actual solver attempts with a near seed, including failed attempts. */
    continuedFits: number;

    /** Actual outer owned-free-curve queries, including unsupported inputs. */
    curveQueries: number;

    /** Actual current near-correction probes, including canonical-anchor construction. */
    curveProbes: number;

    /** Current probes passing every physical, bracket and chain-continuity check. */
    curveAccepted: number;

    /** Actual ordinary cold source preparations used as canonical anchors. */
    curveColdAnchors: number;

    /** Actual ordinary cold source preparations used as current-target fallbacks. */
    curveColdFallbacks: number;

    /** Rejected current candidates that required a finer deterministic predecessor. */
    curveRefinements: number;

    /** Actual algebraic orientation-root physical candidate trials. */
    orientationRootTrials: number;

    /** Actual accepted algebraic orientation-root returns. */
    orientationRootAccepted: number;

    /** Actual ordinary near-refinement calls inside the explicit continuation dispatcher. */
    continuationNearAttempts: number;

    /** Actual ordinary cold-fit calls inside the explicit continuation dispatcher. */
    continuationColdAttempts: number;
  }
}
