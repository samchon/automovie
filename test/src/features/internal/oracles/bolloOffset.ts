/**
 * The inertialization offset of Bollo (Inertialization: High-Performance
 * Animation Transitions in Gears of War, GDC 2018) as the talk writes it, an
 * oracle for tests of the transitions built on it.
 *
 * With `s = t1 - t`, the offset is `s^4 (b + c s)`, `b = (5 x0 + v0 t1) / t1^4`
 * and `c = -(4 x0 + v0 t1) / t1^5`: the quintic that starts at `x0` with slope
 * `v0` and ends at `t1` with zero value, slope and acceleration. It is zero
 * from `t1` on and `x0` before the cut. The decay time is the caller's: this
 * oracle applies no clamp, so a test states which `t1` the contract it checks
 * implies.
 *
 * @param x0 Offset at the cut.
 * @param v0 Offset velocity at the cut, per second.
 * @param t1 Decay time, seconds; positive.
 * @param elapsed Seconds since the cut.
 * @returns The offset.
 */
export function bolloOffset(
  x0: number,
  v0: number,
  t1: number,
  elapsed: number,
): number {
  if (elapsed >= t1) return 0;
  const s: number = t1 - Math.max(0, elapsed);
  const b: number = (5 * x0 + v0 * t1) / t1 ** 4;
  const c: number = -(4 * x0 + v0 * t1) / t1 ** 5;
  return s ** 4 * (b + c * s);
}
