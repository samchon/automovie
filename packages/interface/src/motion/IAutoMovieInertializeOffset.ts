/** Data and callback contracts shared by the InertializeOffset operations. */
export namespace IAutoMovieInertializeOffset {
  /** The offset at an instant. */
  export interface IState {
    /** Offset, the channel's unit. */
    value: number;

    /** Offset velocity, the channel's unit per second. */
    velocity: number;

    /** The decay time after the overshoot clamp, seconds. */
    duration: number;
  }
}
