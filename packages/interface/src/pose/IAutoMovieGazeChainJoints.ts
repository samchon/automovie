import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";

/** Solved clinical aim distributed across the connected neck/head chain. */
export namespace IAutoMovieGazeChainJoints {
  /**
   * Distribute one solved aim over the gaze chain, `neck` then `head`, so a
   * gaze the rig's declared ranges can hold compiles inside them.
   *
   * The head takes as much of each axis as its range holds, since its rotation
   * points the eyes, and the neck takes what remains up to its own range. An
   * aim the head holds alone therefore compiles to the single `head` joint, and
   * the neck appears only when it carries something. Whatever neither range can
   * hold stays on the head unclamped, so the shot's ROM gate reports the head
   * overshooting by exactly the amount the whole chain falls short, as an
   * impossible reach does; bending the aim into range would point the actor
   * somewhere it was never told to look.
   *
   * Splitting relies on the two joints' angles adding along the chain. Both use
   * the default clinical basis, so this holds exactly for a split on one axis
   * when the head rests unrotated relative to the neck, as the canonical
   * humanoid does. Flexion and twist split together compose two non-commuting
   * rotations, so the combined aim then differs slightly from the single-bone
   * aim.
   *
   * The aim stays on the single `head` joint when there is no rig (`null`; the
   * perform-shot ROM gate does not run for a rig-less actor), when the rig
   * declares no `head` or `neck`, or when the head's parent is not the neck,
   * because rotating a neck the head does not hang from would not move the
   * head. A missing per-bone constraint falls back to the default humanoid ROM,
   * as the gate does.
   */
  export type IProps = {
    /**
     * Rig used to find head/neck ancestry and effective ROM. Null, missing
     * bones, or a non-neck head parent keeps the full aim on head.
     */
    rig: IAutoMovieSkeleton | null;
    /**
     * Total clinical flexion in degrees; caller supplies a finite angle.
     * Unavailable range remains as head overshoot for the downstream ROM gate.
     */
    flexionDeg: number;
    /**
     * Total clinical twist in degrees; caller supplies a finite angle. Both
     * axes are split independently, so a two-axis split need not preserve the
     * exact original quaternion.
     */
    twistDeg: number;
  };
}
