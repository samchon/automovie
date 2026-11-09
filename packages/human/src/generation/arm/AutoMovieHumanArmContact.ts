import type { IAutoMovieSolidSurface } from "@automovie/engine";

import type { AutoMovieHumanTrunkNeckTurn } from "../trunk/AutoMovieHumanTrunkNeckTurn";
import type { AutoMovieHumanArmCurveSpec } from "./AutoMovieHumanArmCurveSpec";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;

/**
 * The relaxed arm's contact with the chest wall in the neutral pose: the
 * humerus' abduction at GH, about the humerus X (anterior) axis, at which the
 * arm's skin below the axilla rests on the trunk's skin without passing into
 * it. The least signed gap over the arm's sampled skin is zero there: one
 * tangent contact, every other sample outside. The relaxed arm rests on the
 * chest wall (contact, not overlap), so the constraint is two-sided: a clear
 * arm is adducted until it touches and an overlapping one abducted until it
 * no longer overlaps.
 *
 * The gap is read radially in the trunk's own section plane at the sample's
 * height: the trunk's chart phase is the polar angle about the plane origin
 * (`AutoMovieHumanTrunkPorts`), so the trunk skin at the sample's phase gives
 * the radius the sample must reach. Samples with no trunk section at their
 * height (below the trunk's last station or above its domain) are not read.
 * The least gap grows monotonically with the abduction over the bracket for a
 * convex trunk side and a hanging arm, so bisection on it finds the contact.
 */
export namespace AutoMovieHumanArmContact {
  /** The solved contact. */
  export interface IOutput {
    /** Abduction at GH, rad, positive away from the trunk. */
    angle: number;

    /** Least signed gap at the angle over the read samples, mm. */
    gap: number;

    /** Least signed gap at zero abduction, mm (negative: overlap). */
    neutral: number;

    /** The sample of least gap at the angle, world mm. */
    point: Vec3;

    /** Samples read (with a trunk section at their height). */
    samples: number;
  }

  /**
   * Solve the abduction that leaves the least gap zero.
   *
   * @param input.points Arm skin samples at zero abduction, world mm.
   * @param input.centre The rotation centre (GH), world mm.
   * @param input.axis Unit rotation axis; a positive turn moves the arm away from the trunk.
   * @param input.gap Signed gap of a world point to the trunk skin, mm, or null where no section stands.
   * @param input.limit Bracket half width, rad.
   */
  export function solve(input: { points: readonly Vec3[]; centre: Vec3; axis: Vec3; gap: (p: Vec3) => number | null; limit: number }): IOutput {
    const least: (angle: number) => { gap: number; point: Vec3; samples: number } = (angle: number): { gap: number; point: Vec3; samples: number } => {
      let best: number = Infinity;
      let at: Vec3 = input.centre;
      let samples: number = 0;
      for (const p of input.points) {
        const q: Vec3 = turn(input.centre, input.axis, angle, p);
        const g: number | null = input.gap(q);
        if (g === null) continue;
        ++samples;
        if (g < best) {
          best = g;
          at = q;
        }
      }
      return { gap: best, point: at, samples };
    };
    const zero: { gap: number; point: Vec3; samples: number } = least(0);
    if (zero.samples === 0) return { angle: 0, gap: Infinity, neutral: Infinity, point: input.centre, samples: 0 };
    // The unabducted gap's sign already halves the bracket.
    let lo: number = zero.gap < 0 ? 0 : -input.limit;
    let hi: number = zero.gap < 0 ? input.limit : 0;
    if (!(least(lo).gap < 0 && least(hi).gap >= 0)) throw new Error(`arm contact: the least gap does not change sign over +-${input.limit} rad (at 0: ${zero.gap.toFixed(3)} mm)`);
    // Bisect until the farthest sample moves less than the joins' trace
    // tolerance (1e-6 mm, AutoMovieHumanArmShoulderJoin.LIMITS) across the bracket.
    const lever: number = Math.max(...input.points.map((p: Vec3): number => Math.hypot(p[0] - input.centre[0], p[1] - input.centre[1], p[2] - input.centre[2])));
    while ((hi - lo) * lever > 1e-6) {
      const mid: number = (lo + hi) / 2;
      if (least(mid).gap < 0) lo = mid;
      else hi = mid;
    }
    const solved: { gap: number; point: Vec3; samples: number } = least(hi);
    return { angle: hi, gap: solved.gap, neutral: zero.gap, point: solved.point, samples: solved.samples };
  }

  /**
   * A point turned by `angle` about the line through `centre` along the unit
   * `axis` (Rodrigues' rotation formula).
   *
   * @param centre A point of the axis.
   * @param axis Unit axis direction.
   * @param angle Right-handed angle, rad.
   * @param p The point.
   */
  export function turn(centre: Vec3, axis: Vec3, angle: number, p: Vec3): Vec3 {
    const d: Vec3 = [p[0] - centre[0], p[1] - centre[1], p[2] - centre[2]];
    const c: number = Math.cos(angle);
    const s: number = Math.sin(angle);
    const k: number = (axis[0] * d[0] + axis[1] * d[1] + axis[2] * d[2]) * (1 - c);
    const x: Vec3 = [axis[1] * d[2] - axis[2] * d[1], axis[2] * d[0] - axis[0] * d[2], axis[0] * d[1] - axis[1] * d[0]];
    return [0, 1, 2].map((i: number): number => centre[i]! + d[i]! * c + x[i]! * s + axis[i]! * k) as Vec3;
  }

  /**
   * The signed radial gap of a world point to the trunk skin in the trunk's
   * section plane at the point's height, mm, positive outside.
   *
   * @param field The trunk surface, chart (station, phase about the plane origin).
   * @param course The trunk's course: the station whose plane stands at a height, and that plane.
   * @param scale Calibration millimetres per trunk millimetre.
   */
  export function trunk(field: IAutoMovieSolidSurface, course: Pick<AutoMovieHumanTrunkNeckTurn.IOutput, "station" | "frame">, scale: number): (p: Vec3) => number | null {
    return (world: Vec3): number | null => {
      const p: Vec3 = [world[0] / scale, world[1] / scale, world[2] / scale];
      const station: number = course.station(p[1]);
      if (!Number.isFinite(station) || (field.domain !== undefined && !(station >= field.domain[0] && station <= field.domain[1]))) return null;
      const plane: { origin: readonly number[]; u: readonly number[]; v: readonly number[] } = course.frame(station);
      const d: Vec3 = [p[0] - plane.origin[0]!, p[1] - plane.origin[1]!, p[2] - plane.origin[2]!];
      const a: number = d[0] * plane.u[0]! + d[1] * plane.u[1]! + d[2] * plane.u[2]!;
      const b: number = d[0] * plane.v[0]! + d[1] * plane.v[1]! + d[2] * plane.v[2]!;
      const t: readonly number[] = field.point !== undefined ? field.point(station, Math.atan2(b, a)) : field.jet(station, Math.atan2(b, a)).p;
      const e: Vec3 = [t[0]! - plane.origin[0]!, t[1]! - plane.origin[1]!, t[2]! - plane.origin[2]!];
      const ta: number = e[0] * plane.u[0]! + e[1] * plane.u[1]! + e[2] * plane.u[2]!;
      const tb: number = e[0] * plane.v[0]! + e[1] * plane.v[1]! + e[2] * plane.v[2]!;
      return (Math.hypot(a, b) - Math.hypot(ta, tb)) * scale;
    };
  }
}
