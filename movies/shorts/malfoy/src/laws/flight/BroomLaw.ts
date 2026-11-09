import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Broom riding's laws: speeds, the level-turn bank angle, the seated reach
 * limit, hanging endurance and sink, the riderless broom, tandem dip and the
 * five transfer phases, and a smooth flight path through route points with
 * its arc length, from the broom-riding study and the flight settings.
 *
 * ```ts
 * BroomLaw.bank(12, 25); // 0.53 rad: tan φ = v² / (g r)
 * const path = BroomLaw.path([a, b, c]); path.at(path.length / 2);
 * ```
 *
 * @evidence docs/research/flight/broom-riding.md#speed Hover 0–3, cruise 6–10, sprint 12–18 m/s; under 3 m/s².
 * @evidence docs/research/flight/broom-riding.md#banking tan φ = v² / (g r), capped at 60°.
 * @evidence docs/research/flight/broom-riding.md#overreach Arm length plus 0.3 m lean before the seat unloads.
 * @evidence docs/research/flight/broom-riding.md#hanging One-handed up to 10 s; the broom sinks 0.3–0.5 m/s.
 * @evidence docs/research/flight/broom-riding.md#riderless Keeps heading, slows about 1 m/s², sinks gently.
 * @evidence docs/research/flight/broom-riding.md#tandem Dip 0.5–1.0 m, recovery 2–3 s, banks under 30°.
 * @evidence docs/research/flight/broom-riding.md#transfer Conditions and the five phase windows.
 * @evidence contracts/development/behaviors.md#studied-laws Every constant is the study's.
 * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
 * @evidence contracts/development/common.md#meaningful-documentation States units and sources.
 * @evidence contracts/development/design.md#principled-representation Metres, seconds and radians.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What the flight steps, motion and tests read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No rider is named.
 */
export namespace BroomLaw {
  /** Standard gravity, metres per second squared. */
  export const G: number = 9.80665;

  /** Largest bank, radians. */
  export const BANK_MAX: number = Math.PI / 3;

  /** Sink of a broom under a hanging rider, metres per second. */
  export const HANG_SINK: number = 0.4;

  /** Riderless deceleration, metres per second squared. */
  export const RIDERLESS_DECELERATION: number = 1.0;

  /** Riderless sink, metres per second. */
  export const RIDERLESS_SINK: number = 0.3;

  /** Tandem dip, metres. */
  export const TANDEM_DIP: number = 0.75;

  /** Tandem recovery, seconds. */
  export const TANDEM_RECOVERY: number = 2.5;

  /** A transfer's conditions: shafts parallel within 10° (radians), speeds within 0.5 m/s, the rear section within 0.5 m of the free hand. */
  export const TRANSFER_CONDITIONS = Object.freeze({ parallel: Math.PI / 18, speed: 0.5, reach: 0.5 });

  /** Braking to a hover, metres per second squared: the study's 3 m/s² limit. */
  export const BRAKE: number = 3;

  /** An escort's approach speed to its station beside the escorted rider, metres per second: the sprint's low end. */
  export const ESCORT_SPEED: number = 12;

  /** Most a broom carrying two riders banks, radians: 30°. */
  export const TANDEM_BANK: number = Math.PI / 6;

  /** The five transfer phases, seconds: grip new, swing onto it, chest over, leg over, steady. */
  export const TRANSFER_PHASES: readonly number[] = Object.freeze([0.4, 0.75, 1.0, 1.0, 0.75]);

  /** Seat point above the shaft's centre line, metres: the pelvis rests on the shaft. */
  export const SEAT_HEIGHT: number = 0.1;

  /** Rear rider's pelvis behind the front rider's, metres (0.45–0.55). */
  export const TANDEM_SPACING: number = 0.5;

  /**
   * The bank angle of a level turn.
   *
   * @param speed Metres per second.
   * @param radius Turn radius, metres; Infinity for straight flight.
   * @param limit The rider's or the load's bank limit, radians; 60° by default.
   * @returns Radians, capped at the limit.
   */
  export function bank(speed: number, radius: number, limit: number = BANK_MAX): number {
    if (!(radius > 0) || !Number.isFinite(radius)) return 0;
    return Math.min(limit, BANK_MAX, Math.atan((speed * speed) / (G * radius)));
  }

  /** A smooth path through points. */
  export interface IPath {
    /** Arc length, metres. */
    length: number;

    /** Point at an arc length. */
    at(s: number): IAutoMovieVector3;

    /** Unit tangent at an arc length. */
    tangent(s: number): IAutoMovieVector3;

    /** Signed horizontal curvature at an arc length, 1/m, positive turning left. */
    curvature(s: number): number;
  }

  /**
   * A centripetal Catmull–Rom path through route points, tabulated by arc length.
   *
   * @param points At least two points.
   * @returns The path.
   */
  export function path(points: readonly IAutoMovieVector3[]): IPath {
    if (points.length < 2) throw new Error("A flight path needs two points");
    const p = (k: number): IAutoMovieVector3 => points[Math.max(0, Math.min(points.length - 1, k))]!;
    const spans: number = points.length - 1;
    const sample = (u: number): IAutoMovieVector3 => {
      const i: number = Math.min(spans - 1, Math.floor(u));
      const t: number = u - i;
      const [a, b, c, d] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
      const f = (x0: number, x1: number, x2: number, x3: number): number =>
        0.5 * (2 * x1 + (-x0 + x2) * t + (2 * x0 - 5 * x1 + 4 * x2 - x3) * t * t + (-x0 + 3 * x1 - 3 * x2 + x3) * t * t * t);
      return { x: f(a.x, b.x, c.x, d.x), y: f(a.y, b.y, c.y, d.y), z: f(a.z, b.z, c.z, d.z) };
    };
    const n: number = spans * 40;
    const us: number[] = [];
    const ss: number[] = [0];
    let prev: IAutoMovieVector3 = sample(0);
    us.push(0);
    for (let k = 1; k <= n; k++) {
      const u: number = (k / n) * spans;
      const q: IAutoMovieVector3 = sample(u);
      ss.push(ss[k - 1]! + Math.hypot(q.x - prev.x, q.y - prev.y, q.z - prev.z));
      us.push(u);
      prev = q;
    }
    const length: number = ss[n]!;
    const uAt = (s: number): number => {
      const c: number = Math.max(0, Math.min(length, s));
      let lo: number = 0;
      let hi: number = n;
      while (hi - lo > 1) {
        const mid: number = (lo + hi) >> 1;
        if (ss[mid]! <= c) lo = mid;
        else hi = mid;
      }
      const span: number = ss[hi]! - ss[lo]!;
      return us[lo]! + (span < 1e-12 ? 0 : ((c - ss[lo]!) / span) * (us[hi]! - us[lo]!));
    };
    const at = (s: number): IAutoMovieVector3 => sample(uAt(s));
    const tangent = (s: number): IAutoMovieVector3 => {
      const a: IAutoMovieVector3 = at(s - 0.25);
      const b: IAutoMovieVector3 = at(s + 0.25);
      const d: number = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z) || 1;
      return { x: (b.x - a.x) / d, y: (b.y - a.y) / d, z: (b.z - a.z) / d };
    };
    const curvature = (s: number): number => {
      const a: IAutoMovieVector3 = tangent(s - 1);
      const b: IAutoMovieVector3 = tangent(s + 1);
      const ha: number = Math.atan2(a.x, a.z);
      const hb: number = Math.atan2(b.x, b.z);
      let d: number = hb - ha;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      // A heading increase turns toward +X from +Z, which is to the rider's left.
      return d / 2;
    };
    return { length, at, tangent, curvature };
  }
}
