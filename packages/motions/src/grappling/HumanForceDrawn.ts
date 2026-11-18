/**
 * The original constant-pull inverted pendulum with fixed physical coefficients.
 * Position-only reads and complete state reads share the same cosh expression;
 * no sampled time, pose, force outcome or numerical history is retained.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States constant horizontal pull, mass/frequency/time units, nonnegative clock policy, scalar/full observations and unchanged nonfinite propagation.
 * @evidence contracts/development/design.md#principled-representation Existing scalar mass, eigenfrequency and force describe the fixed law; fresh offset/speed/extrapolated fields describe one actual time observation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface prepare serves the actual response's repeated offset and paired break-state reads, while sample preserves HumanForceExchange.drawn's complete one-shot owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No pose, fitted result, success flag, alternate time law, repaired input or force bound enters this scalar owner; every requested observation runs its original analytic expression.
 */
export namespace HumanForceDrawn {
  /**
   * Physical inputs unchanged throughout one prepared pull.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Fields state kilograms, inverse seconds and newtons for the original constant-pull law.
   * @evidence contracts/development/design.md#principled-representation Three scalar physical inputs determine F/(M*w*w); the changing observation clock remains a query argument.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only actual mass, eigenfrequency and horizontal force define this model.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No reference pose, baked observation, target proxy, scene identity or result token can replace an input.
   */
  export interface IProps {
    /** Kilograms. */
    mass: number;
    /** Eigenfrequency, inverse seconds. */
    frequency: number;
    /** Constant horizontal newtons. */
    force: number;
  }

  /**
   * One actual pendulum observation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Fields state displacement, speed and extrapolated-centre units and meanings.
   * @evidence contracts/development/design.md#principled-representation Three scalar observations retain the original drawn result shape.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The throw needs paired offset/speed and legacy drawn callers retain extrapolated centre.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Values come from the actual analytic clock; none denotes success or a reusable pose.
   */
  export interface IState {
    /** Displacement from rest along the pull, metres. */
    offset: number;
    /** Speed along the pull, metres per second. */
    speed: number;
    /** Extrapolated displacement offset + speed/frequency, metres. */
    extrapolated: number;
  }

  /**
   * Fixed-coefficient readers, with no retained time observation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Both methods state seconds since pull start, the original nonnegative clock and scalar/fresh-state ownership.
   * @evidence contracts/development/design.md#principled-representation Distinct offset and complete-state demands avoid optional result flags and preserve the original physical result shape.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Response consumes offset during yielding and sample once for the body's actual break-state offset/speed.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Neither method certifies a pose or stores a past answer; all requested times remain actual analytic evaluations.
   */
  export interface IMotion {
    /**
     * Displacement at seconds since the pull began; negative seconds use the zero clock.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the clock and metre output, including the original Math.max nonfinite behavior.
     * @evidence contracts/development/implementation.md#principled-implementation prepare evaluates the same F/(M*w*w)*(cosh(w*t)-1) used by the complete state owner.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One clock clamp reaches the shared position expression.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No speed, tolerance, repaired scalar or alternate offset is substituted.
     * @evidence contracts/development/implementation.md#efficient-algorithms One cosh and constant scalar work omit unused sinh/speed/extrapolation and state allocation; speedup is unmeasured.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work The response fixes mass/frequency/force, so only frequency and its actual coefficient are shared; the current time is always evaluated.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader retains two fixed numbers and no sampled answer; only its scalar observation escapes.
     */
    offset(seconds: number): number;

    /**
     * Fresh complete state at seconds since the pull began.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the clock, original nonnegative clamp and fresh offset/speed/extrapolated result.
     * @evidence contracts/development/implementation.md#principled-implementation prepare runs the original cosh displacement, sinh speed and offset + speed/frequency expressions in order.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One clock clamp reaches the shared complete-state owner.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts All three original fields, arithmetic order and nonfinite propagation remain.
     * @evidence contracts/development/implementation.md#efficient-algorithms Constant scalar work returns one fresh three-field state, sharing no numerical time history.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work A throw consumes one actual break-state observation for both offset and speed; fixed coefficients are shared but different clocks are not.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each returned state is independent; the prepared reader retains no state record, clock, pose or query workspace.
     */
    sample(seconds: number): IState;
  }

  /**
   * Prepare a fixed physical pull without preparing an observation.
   *
   * @param props The unchanged mass, eigenfrequency and horizontal force.
   * @returns Actual scalar and complete-state readers of changing seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fixed physical inputs, changing clock, output ownership and preservation of original nonfinite arithmetic.
   * @evidence contracts/development/implementation.md#principled-implementation Computes the original coefficient force/(mass*w*w) once, retaining its left-associated denominator; both readers use the same original nonnegative clock and shared analytic owner.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two fixed scalars feed offset-only and complete-state entry points, with position and state as the sole numerical owners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Adds no input repair, finite filter, branch on scene/outcome, sampled answer or fit bypass.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed division/multiplications run once; each offset evaluates only cosh and each state retains the original cosh/sinh arithmetic. Runtime improvement is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The response explicitly fixes actual mass/frequency/force for this constant-pull branch; every changing time and current body posture remains separately observed.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The owning response retains two scalar coefficients and two closures until plan release, with no body, pose, time, state record, external handle or growing history captured.
   */
  export function prepare(props: IProps): IMotion {
    const w: number = props.frequency;
    const a: number = props.force / (props.mass * w * w);
    return {
      offset: (seconds: number): number => position(a, w * Math.max(0, seconds)),
      sample: (seconds: number): IState => state(w, a, Math.max(0, seconds)),
    };
  }

  /**
   * The complete original one-shot observation, including its read order.
   *
   * @param props Physical inputs and seconds since the pull began.
   * @returns Fresh offset, speed and extrapolated displacement.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States complete physical inputs, timebase and fresh result fields.
   * @evidence contracts/development/implementation.md#principled-implementation Clamps seconds, reads frequency, computes the original coefficient, then evaluates the original offset/speed/extrapolated expressions.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The one-shot adapter and prepared reader share state and position owners without allocating a prepared factory.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps Math.max, coefficient arithmetic, all result fields and nonfinite propagation; no new acceptance or repair is added.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant scalar work and one result record match the original complete observation; no factory or time cache is constructed.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the same original position/state expressions with actual prepared consumers, while each one-shot input is read afresh.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains no props, state or workspace; the caller owns its fresh three-scalar result.
   */
  export function sample(props: IProps & {
    /** Seconds since the pull began. */
    seconds: number;
  }): IState {
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
