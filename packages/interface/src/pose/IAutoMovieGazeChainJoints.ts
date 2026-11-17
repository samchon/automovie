import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";

/**
 * Solved clinical aim distributed across the connected neck/head chain.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Explains rig fallback, clinical aim units and intentionally retained excess on the head.
 * @evidence contracts/development/design.md#principled-representation Finite flexion/twist degrees are caller premises; a connected head/neck chain shares effective ROM, otherwise the full aim stays on head.
 * @evidence contracts/development/design.md#minimal-and-owned-surface gazeChainJoints reads the rig's ancestry and constraints and leaves impossible residual for the downstream ROM gate.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Null explicitly means no rig; two-axis addition is documented as an approximation rather than claiming exact quaternion preservation.
 */
export namespace IAutoMovieGazeChainJoints {
  /**
   * Distribute one solved aim over the gaze chain, `neck` then `head`, so a gaze
   * the rig's declared ranges can hold compiles inside them.
   *
   * The head takes as much of each axis as its range holds, since its rotation
   * points the eyes, and the neck takes what remains up to its own range. An aim
   * the head holds alone therefore compiles to the single `head` joint, and the
   * neck appears only when it carries something. Whatever neither range can hold
   * stays on the head unclamped, so the shot's ROM gate reports the head
   * overshooting by exactly the amount the whole chain falls short, as an
   * impossible reach does; bending the aim into range would point the actor
   * somewhere it was never told to look.
   *
   * Splitting relies on the two joints' angles adding along the chain. Both use
   * the default clinical basis, so this holds exactly for a split on one axis
   * when the head rests unrotated relative to the neck, as the canonical humanoid
   * does. Flexion and twist split together compose two non-commuting rotations,
   * so the combined aim then differs slightly from the single-bone aim.
   *
   * The aim stays on the single `head` joint when there is no rig (`null`; the
   * perform-shot ROM gate does not run for a rig-less actor), when the rig
   * declares no `head` or `neck`, or when the head's parent is not the neck,
   * because rotating a neck the head does not hang from would not move the head.
   * A missing per-bone constraint falls back to the default humanoid ROM, as the
   * gate does.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Explains rig fallback, clinical aim units and intentionally retained excess on the head.
   * @evidence contracts/development/design.md#principled-representation Finite flexion/twist degrees are caller premises; a connected head/neck chain shares effective ROM, otherwise the full aim stays on head.
   * @evidence contracts/development/design.md#minimal-and-owned-surface gazeChainJoints reads the rig's ancestry and constraints and leaves impossible residual for the downstream ROM gate.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Null explicitly means no rig; two-axis addition is documented as an approximation rather than claiming exact quaternion preservation.
   */
  export type IProps = {
    /** Rig used to find head/neck ancestry and effective ROM. Null, missing bones, or a non-neck head parent keeps the full aim on head. */
    rig: IAutoMovieSkeleton | null;
    /** Total clinical flexion in degrees; caller supplies a finite angle. Unavailable range remains as head overshoot for the downstream ROM gate. */
    flexionDeg: number;
    /** Total clinical twist in degrees; caller supplies a finite angle. Both axes are split independently, so a two-axis split need not preserve the exact original quaternion. */
    twistDeg: number;
  };
}
