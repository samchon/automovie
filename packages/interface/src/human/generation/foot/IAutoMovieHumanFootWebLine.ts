import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanFootFrame } from "./IAutoMovieHumanFootFrame";

/**
 * The foot fan's shared origin, yaw/turn axes and station levers, together with its crest-height reader.
 *
 * The interface package owns these declarations; AutoMovieHumanFootWebLine in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The foot fan's shared origin, yaw/turn axes and station levers, together with its crest-height reader. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only IWebLine, IInput declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation IWebLine, IInput separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanFootWebLine exchanges the named IWebLine, IInput contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
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

    /**
     * The forefoot crest's height over the floor at a place along the foot, foot lengths.
     *
     * @evidence contracts/development/common.md#meaningful-documentation The forefoot crest's height over the floor at a place along the foot, foot lengths.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or compensations execute in this signature. AutoMovieHumanFootWebLine and the callback provider must satisfy the documented depth contract.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no algorithm or storage strategy; AutoMovieHumanFootWebLine and its callback provider own the cost of each depth invocation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no requests or caching. AutoMovieHumanFootWebLine and the callback provider determine when the inputs to depth describe equivalent work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources. AutoMovieHumanFootWebLine and the callback provider own any captured source data and the callable's lifetime.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This is the IAutoMovieHumanFootWebLine.IInput.depth callable contract, without an implementation body. AutoMovieHumanFootWebLine and its supplied callbacks own the numerical method and admission of the documented arguments.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanFootWebLine.IInput.depth declares only the invocation boundary; decomposition belongs to AutoMovieHumanFootWebLine and the callback provider.
     */
    depth: (a: number) => number;
  }
}
