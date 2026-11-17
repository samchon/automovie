import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * An aim kept on a world target from a moving support, every second (#3491).
 *
 * A carried plan (`HumanSupportCarry`) keeps its goals on the support, so a
 * line aimed at the start turns and moves with the support while the target
 * stays in the world. The aim re-takes that line at each second: the line
 * from the carried pivot (the eye, the cheek) to the target against the
 * carried line, its turn about the vertical and its rise. The turn goes to
 * the trunk, which twists on the pelvis, the chest and the lumbar spine
 * sharing it (`AutoMovieMotionHumanTrunk.CHEST`), and the arms' goals turn
 * with it about the vertical through the root; the rise goes to the arms'
 * goals alone, turned about the horizontal axis through the pivot square to
 * the line. A twist the chest's or the spine's axial range
 * (`DEFAULT_HUMANOID_ROM`) cannot hold at some frame of the act is refused
 * when the act is planned: the performer, or the support, turns first.
 *
 * @evidence contracts/development/common.md#meaningful-documentation target: The target, world metres; it stays in the world. pivot: Where the line was planned from at the start (the eye, the cheek), world metres; it rides the support.
 * @evidence contracts/development/design.md#principled-representation target: The target, world metres; it stays in the world. pivot: Where the line was planned from at the start (the eye, the cheek), world metres; it rides the support.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: carrier/HumanSupportAim.ts (HumanSupportAim.correction, aim); carrier/HumanSupportAim.ts (HumanSupportAim.posture, aim); carrier/HumanSupportCarry.ts (HumanSupportCarry.plan, aim); lexicon/HumanWeaponHeld.ts (HumanWeaponHeld.carried, aim).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanSupportAim {
  /**
   * A line kept on a world target.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame.
   * @evidence contracts/development/design.md#principled-representation Two world points at the act's start.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Plain points.
   */
  export interface IAim {
    /** The target, world metres; it stays in the world. */
    target: IAutoMovieVector3;

    /** Where the line was planned from at the start (the eye, the cheek), world metres; it rides the support. */
    pivot: IAutoMovieVector3;
  }
}
