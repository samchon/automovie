import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanFootFrame } from "./IAutoMovieHumanFootFrame";

/** Type contracts exchanged by AutoMovieHumanFootWebLine; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanFootWebLine {
  /** The fan's axes, levers and stations.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The fan's axes, levers and stations.
   * @evidence contracts/development/design.md#principled-representation `origin`: The shared point: on the vertical yaw axis and the horizontal turn axis. `lateral`: Horizontal, across the foot toward its lateral side: the turn axis. `back`: Horizontal, along the foot toward the heel.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanFootWebLine.of. Read by AutoMovieHumanFootColumn.knots, AutoMovieHumanFootFan.plane, AutoMovieHumanFootFan.station. Also types AutoMovieHumanFootConstruction.line, AutoMovieHumanFootBody.line.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `origin`, `lateral`, `back`, `yaw`, `square`, `yawLever`, `turnLever`, `end`; callers supply the complete record.
   */
  export interface IWebLine {
    /** The shared point: on the vertical yaw axis and the horizontal turn axis. */
    origin: AutoMovieVector3Tuple;

    /** Horizontal, across the foot toward its lateral side: the turn axis. */
    lateral: AutoMovieVector3Tuple;

    /** Horizontal, along the foot toward the heel. */
    back: AutoMovieVector3Tuple;

    /** The web ring's yaw from the square plane, radians. */
    yaw: number;

    /** Station at the square plane. */
    square: number;

    /** Station per radian of the yaw fan. */
    yawLever: number;

    /** Station per radian of the turn fan. */
    turnLever: number;

    /** Station at the ankle ring. */
    end: number;
  }

  /** What the web line reads besides the frame.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What the web line reads besides the frame.
   * @evidence contracts/development/design.md#principled-representation `frame`: The foot's frame. `depth`: The forefoot crest's height over the floor at a place along the foot, foot lengths.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanFootWebLine.of.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `frame`, `depth`; callers supply the complete record.
   */
  export interface IInput {
    /** The foot's frame. */
    frame: IAutoMovieHumanFootFrame.IFrame;

    /** The forefoot crest's height over the floor at a place along the foot, foot lengths. */
    depth: (a: number) => number;
  }
}
