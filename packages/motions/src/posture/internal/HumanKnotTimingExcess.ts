import { HumanQuinticSegment } from "./HumanQuinticSegment";

/*
 * The method's own bound on how far a TOPP-RA grid interval's acceleration and
 * squared speed pass the larger of their values at its two gridpoints (Pham and
 * Pham 2018; `HumanKnotTiming`).
 *
 * Over an interval of length Δ the path acceleration u is constant
 * (`ConstAccel`), so x = ṡ² runs linearly in s and the coordinate's
 * acceleration is f = q' u + q'' x and its squared speed h = q'² x, smooth
 * functions of s whose departure from the chord of their end values is at most
 * Δ² / 8 times their greatest second derivative: f'' = 5 q''' u + q'''' x and
 * h'' = 2 (q''² + q' q''') x + 8 q' q'' u. Each derivative's greatest magnitude
 * over the interval is bounded the same way from its own ends, the quintic's
 * fifth derivative constant, so the bound is closed-form and never below the
 * true excess.
 * Parameter segment: The path's quintic over the interval, its duration in s.
 * Parameter a: The interval's start in the quintic's own s.
 * Parameter b: Its end.
 * Parameter xa: The squared path velocity at its start.
 * Parameter xb: At its end.
 * Parameter u: The constant path acceleration over it.
 * Returns: The acceleration's and the squared speed's greatest excess over the
 * coordinates.
 */
export function HumanKnotTimingExcess(
  segment: HumanQuinticSegment.ISegment,
  a: number,
  b: number,
  xa: number,
  xb: number,
  u: number,
): HumanKnotTimingExcess.IExcess {
  const delta: number = b - a;
  const chord: number = (delta * delta) / 8;
  const T: number = segment.duration;
  const start: HumanQuinticSegment.IState = HumanQuinticSegment.state(
    segment,
    a,
  );
  const end: HumanQuinticSegment.IState = HumanQuinticSegment.state(segment, b);
  const x: number = Math.max(xa, xb);
  let acceleration: number = 0;
  let speed: number = 0;
  segment.coefficients.forEach((c: readonly number[], k: number): void => {
    const snap = (s: number): number =>
      Math.abs((24 * c[4]! + 120 * c[5]! * (s / T)) / T ** 4);
    const fifth: number = Math.abs((120 * c[5]!) / T ** 5);
    const m4: number = Math.max(snap(a), snap(b));
    const m3: number =
      Math.max(Math.abs(start.jerk[k]!), Math.abs(end.jerk[k]!)) +
      chord * fifth;
    const m2: number =
      Math.max(
        Math.abs(start.acceleration[k]!),
        Math.abs(end.acceleration[k]!),
      ) +
      chord * m4;
    const m1: number =
      Math.max(Math.abs(start.velocity[k]!), Math.abs(end.velocity[k]!)) +
      chord * m3;
    acceleration = Math.max(
      acceleration,
      chord * (5 * m3 * Math.abs(u) + m4 * x),
    );
    speed = Math.max(
      speed,
      chord * (2 * (m2 * m2 + m1 * m3) * x + 8 * m1 * m2 * Math.abs(u)),
    );
  });
  return { acceleration, speed };
}

/*
 * Companion types of HumanKnotTimingExcess.
 */
export namespace HumanKnotTimingExcess {
  /*
   * A grid interval's bound on its excess between gridpoints.
   */
  export interface IExcess {
    /*
     * The acceleration's, the coordinate's units per second squared.
     */
    acceleration: number;

    /*
     * The squared speed's, the coordinate's units squared per second squared.
     */
    speed: number;
  }
}
