/** The record of `ISampleProps`'s site. */
type ISampleProps = {
  /** Seconds since the pull began. */
  seconds: number;
};
/**
 * The original constant-pull inverted pendulum with fixed physical
 * coefficients. Position-only reads and complete state reads share the same
 * cosh expression; no sampled time, pose, force outcome or numerical history is
 * retained.
 */
export namespace HumanForceDrawn {
  /** Physical inputs unchanged throughout one prepared pull. */
  export interface IProps {
    /** Kilograms. */
    mass: number;
    /** Eigenfrequency, inverse seconds. */
    frequency: number;
    /** Constant horizontal newtons. */
    force: number;
  }

  /** One actual pendulum observation. */
  export interface IState {
    /** Displacement from rest along the pull, metres. */
    offset: number;
    /** Speed along the pull, metres per second. */
    speed: number;
    /** Extrapolated displacement offset + speed/frequency, metres. */
    extrapolated: number;
  }

  /** Fixed-coefficient readers, with no retained time observation. */
  export interface IMotion {
    /**
     * Displacement at seconds since the pull began; negative seconds use the
     * zero clock.
     */
    offset(seconds: number): number;

    /** Fresh complete state at seconds since the pull began. */
    sample(seconds: number): IState;
  }

  /**
   * Prepare a fixed physical pull without preparing an observation.
   *
   * @param props The unchanged mass, eigenfrequency and horizontal force.
   * @returns Actual scalar and complete-state readers of changing seconds.
   */
  export function prepare(props: IProps): IMotion {
    const w: number = props.frequency;
    const a: number = props.force / (props.mass * w * w);
    return {
      offset: (seconds: number): number =>
        position(a, w * Math.max(0, seconds)),
      sample: (seconds: number): IState => state(w, a, Math.max(0, seconds)),
    };
  }

  /**
   * The complete original one-shot observation, including its read order.
   *
   * @param props Physical inputs and seconds since the pull began.
   * @returns Fresh offset, speed and extrapolated displacement.
   */
  export function sample(props: IProps & ISampleProps): IState {
    const t: number = Math.max(0, props.seconds);
    const w: number = props.frequency;
    const a: number = props.force / (props.mass * w * w);
    return state(w, a, t);
  }

  /** The single original cosh displacement expression. */
  function position(a: number, phase: number): number {
    return a * (Math.cosh(phase) - 1);
  }

  /** Complete observations keep original offset, speed and extrapolation order. */
  function state(w: number, a: number, t: number): IState {
    const phase: number = w * t;
    const offset: number = position(a, phase);
    const speed: number = a * w * Math.sinh(phase);
    return { offset, speed, extrapolated: offset + speed / w };
  }
}
