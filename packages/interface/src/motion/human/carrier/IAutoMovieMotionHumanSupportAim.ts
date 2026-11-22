import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * An aim kept on a world target from a moving support, every second (#3491).
 *
 * A carried plan (`HumanSupportCarry`) keeps its goals on the support, so a
 * line aimed at the start turns and moves with the support while the target
 * stays in the world. The aim re-takes that line at each second: the line
 * from the carried pivot (the eye, the cheek) to the target against the
 * carried line, its turn about the vertical and its rise. The arms' goals
 * turn by the whole turn about the vertical through the root, and the
 * trunk follows them as far as the chest's and the lumbar spine's axial
 * ranges hold (`DEFAULT_HUMANOID_ROM`); the rest is the arms'. The rise goes
 * to the arms' goals alone, turned about the horizontal axis through the
 * pivot square to the line. An aim whose arms would present the line
 * further off the trunk's facing than `arms` at some frame of the act is
 * refused when the act is planned: the performer, or the support, turns
 * first.
 *
 * @evidence contracts/development/common.md#meaningful-documentation target: The target, world metres; it stays in the world. pivot: Where the line was planned from at the start (the eye, the cheek), world metres; it rides the support. arms: How far the arms present the line off the trunk's facing, degrees.
 * @evidence contracts/development/design.md#principled-representation target: The target, world metres; it stays in the world. pivot: Where the line was planned from at the start (the eye, the cheek), world metres; it rides the support. arms: Degrees off the trunk's facing.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: carrier/HumanSupportAim.ts (HumanSupportAim.correction, aim); carrier/HumanSupportAim.ts (HumanSupportAim.posture, aim); carrier/HumanSupportCarry.ts (HumanSupportCarry.plan, aim); lexicon/HumanWeaponHeld.ts (HumanWeaponHeld.carried, aim).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanSupportAim {
  /**
   * A line kept on a world target.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame.
   * @evidence contracts/development/design.md#principled-representation Two world points at the act's start and an angle.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Plain points and degrees.
   */
  export interface IAim {
    /** The target, world metres; it stays in the world. */
    target: IAutoMovieVector3;

    /** Where the line was planned from at the start (the eye, the cheek), world metres; it rides the support. */
    pivot: IAutoMovieVector3;

    /** How far the arms present the line off the trunk's facing to either side, degrees: what the trunk's twist cannot take of the line's turn they take up to this. */
    arms: number;
  }
}
