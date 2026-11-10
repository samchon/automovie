/**
 * The decaying offset of one channel after a transition, by inertialization.
 *
 * Bollo (Inertialization: High-Performance Animation Transitions in Gears of
 * War, GDC 2018) replaces a cross-fade with an offset: at the cut the new
 * motion starts at once, and the difference between the old and the new
 * value (`x0`) and velocity (`v0`) decays to zero over `t1` seconds on a
 * quintic with zero value, velocity and acceleration at `t1`. Written about
 * `s = t1 - t`, that quintic is `x(t) = s^4 (b + c s)` with
 * `b = (5 x0 + v0 t1) / t1^4` and `c = -(4 x0 + v0 t1) / t1^5`: it starts at
 * `x0` with slope `v0`, so the displayed value and velocity are continuous at
 * the cut, and it keeps the sign of `x0` exactly when `b` does, that is when
 * `t1 <= -5 x0 / v0` for a velocity heading toward zero. Bollo's clamp
 * shortens `t1` to that bound, so the offset never overshoots; a velocity
 * heading away needs no clamp. A zero offset leaves the signed lobe
 * `v0 s^4 t / t1^4`, which returns to zero without crossing it.
 *
 * Unlike a critically damped spring, which only approaches zero, the quintic
 * ends at exactly zero at `t1`, so a transition has a finite, known end; it
 * is closed-form in the elapsed time, so any frame can be evaluated alone, and
 * it is the method of Unreal's Inertialization node.
 *
 * @param x0 Offset at the cut, any unit.
 * @param v0 Offset velocity at the cut, that unit per second.
 * @param duration Requested decay time `t1`, seconds; positive.
 * @param elapsed Seconds since the cut.
 * @returns The offset, its velocity and the clamped decay time.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Cites the method, derives the factored quintic and the clamp, states the continuity and overshoot guarantees and why a finite quintic is used.
 * @evidence contracts/development/implementation.md#principled-implementation Bollo's quintic inertialization with its overshoot clamp, written in the factored form whose sign condition is the clamp.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Clamp, then two polynomials.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Non-finite inputs and a non-positive duration throw.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Allocates one small record.
 */
export function inertializeOffset(
  x0: number,
  v0: number,
  duration: number,
  elapsed: number,
): inertializeOffset.IState {
  if (
    ![x0, v0, elapsed].every(Number.isFinite) ||
    !(duration > 0) ||
    !Number.isFinite(duration)
  )
    throw new Error(
      "Inertialization needs finite offsets and a positive duration",
    );
  const t1: number =
    x0 * v0 < 0 ? Math.min(duration, (-5 * x0) / v0) : duration;
  if (elapsed >= t1 || t1 <= 0)
    return { value: 0, velocity: 0, duration: Math.max(t1, 0) };
  const t: number = Math.max(0, elapsed);
  const s: number = t1 - t;
  const t14: number = t1 * t1 * t1 * t1;
  const b: number = (5 * x0 + v0 * t1) / t14;
  const c: number = -(4 * x0 + v0 * t1) / (t14 * t1);
  const s3: number = s * s * s;
  return {
    value: s3 * s * (b + c * s),
    velocity: -(4 * s3 * (b + c * s) + s3 * s * c),
    duration: t1,
  };
}

/**
 * Companion types of {@link inertializeOffset}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each member's unit.
 * @evidence contracts/development/design.md#principled-representation An offset, its rate and the decay time actually used.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What the pose inertialization and its audits read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace inertializeOffset {
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
