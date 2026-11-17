import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Data and callback contracts shared by the SuperposeMinimumJerk operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each unit adds metres in the origin's frame over a positive duration on one seconds clock. Results are fresh position, velocity and acceleration vectors in metres, metres per second and metres per second squared; the producer rejects nonpositive duration and minimumJerk admits each normalized sample.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This namespace groups the IAutoMovieSuperposeMinimumJerk contracts used by packages/engine/src/motion/superposeMinimumJerk.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.
 * @evidence contracts/development/design.md#principled-representation Each unit adds metres in the origin's frame over a positive duration on one seconds clock. Results are fresh position, velocity and acceleration vectors in metres, metres per second and metres per second squared; the producer rejects nonpositive duration and minimumJerk admits each normalized sample. The namespace groups these type contracts without implementing the operation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieSuperposeMinimumJerk contract belongs to interface; packages/engine/src/motion/superposeMinimumJerk.ts and packages/motions/src/handling/HumanPrehension.ts use its nested records and callbacks. Runtime computation remains with those consumers.
 */
export namespace IAutoMovieSuperposeMinimumJerk {
  /**
   * One unit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each unit adds metres in the origin's frame over a positive duration on one seconds clock. Results are fresh position, velocity and acceleration vectors in metres, metres per second and metres per second squared; the producer rejects nonpositive duration and minimumJerk admits each normalized sample.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMovieSuperposeMinimumJerk.IUnit keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation Each unit adds metres in the origin's frame over a positive duration on one seconds clock. Results are fresh position, velocity and acceleration vectors in metres, metres per second and metres per second squared; the producer rejects nonpositive duration and minimumJerk admits each normalized sample. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieSuperposeMinimumJerk.IUnit contract belongs to interface; packages/engine/src/motion/superposeMinimumJerk.ts and packages/motions/src/handling/HumanPrehension.ts use this boundary. Runtime computation remains with those consumers.
   */
  export interface IUnit {
    /** Displacement the unit adds, metres. */
    displacement: IAutoMovieVector3;

    /** Start, seconds. */
    start: number;

    /** Duration, seconds; positive. */
    duration: number;
  }

  /**
   * The moved point at an instant.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each unit adds metres in the origin's frame over a positive duration on one seconds clock. Results are fresh position, velocity and acceleration vectors in metres, metres per second and metres per second squared; the producer rejects nonpositive duration and minimumJerk admits each normalized sample.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts IAutoMovieSuperposeMinimumJerk.IState keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.
   * @evidence contracts/development/design.md#principled-representation Each unit adds metres in the origin's frame over a positive duration on one seconds clock. Results are fresh position, velocity and acceleration vectors in metres, metres per second and metres per second squared; the producer rejects nonpositive duration and minimumJerk admits each normalized sample. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieSuperposeMinimumJerk.IState contract belongs to interface; packages/engine/src/motion/superposeMinimumJerk.ts and packages/motions/src/handling/HumanPrehension.ts use this boundary. Runtime computation remains with those consumers.
   */
  export interface IState {
    /** Position, metres. */
    position: IAutoMovieVector3;

    /** Velocity, metres per second. */
    velocity: IAutoMovieVector3;

    /** Acceleration, metres per second squared. */
    acceleration: IAutoMovieVector3;
  }
}
