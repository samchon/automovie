import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * Authoring inputs for walking through a yielding or resisting medium:
 * wading in water, trudging through snow, sand or mud, and leaning into a
 * steady wind.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names each medium, its depth and the wind's force.
 * @evidence contracts/development/design.md#principled-representation Depths in metres above the ground, forces in newtons, delays in seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The parameter records of `HumanMediumWalk`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A medium is one closed kind with its own depth; a walk without one is a walk on rigid ground.
 */
export namespace IAutoMovieMotionHumanMedium {
  /**
   * The medium walked through.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents Kind: The medium walked through.
   */
  export type Kind = "water" | "snow" | "sand" | "mud";

  /**
   * The medium on the walk's path.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit.
   * @evidence contracts/development/design.md#principled-representation A kind and a depth, with mud's hold.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `HumanMediumWalk`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Water's depth is its surface; a yielding layer's depth is how far a foot sinks through it to the firm ground.
   */
  export interface IMedium {
    /** The medium. */
    kind: Kind;

    /** Water's surface above the ground, or the depth of the snow, sand or mud layer over the firm ground a stance foot sinks through to, metres. */
    depth: number;

    /** Seconds a foot stuck in mud takes to pull free at each toe-off; mud only, zero when absent. */
    hold?: number;
  }

  /**
   * A walk through a medium, optionally into a steady wind.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and frame.
   * @evidence contracts/development/design.md#principled-representation The walk's world target and turns, the medium and the wind's force.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `HumanMediumWalk`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The wind is a force the scene gives, not a lean angle.
   */
  export interface IWalkParams {
    /** World target of the walk, metres. */
    to: IAutoMovieVector3;

    /** World points the walk passes on the way, metres. */
    via?: IAutoMovieVector3[];

    /** The medium on the path; rigid ground when absent. */
    medium?: IMedium;

    /** The steady horizontal wind force on the body, world newtons; none when absent. */
    wind?: IAutoMovieVector3;
  }
}
