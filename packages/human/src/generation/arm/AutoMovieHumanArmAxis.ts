import { AutoMovieNaturalSpline, type AutoMovieViewAxis, AutoMovieViewParameter } from "@automovie/engine";

import type { AutoMovieHumanArmBones } from "./AutoMovieHumanArmBones";
import { AutoMovieHumanArmJet } from "./AutoMovieHumanArmJet";

/**
 * The arm's axis: the bone polyline from the shoulder centre through the
 * elbow centre to the wrist centre and on past the wrist, its corner rounded
 * at the elbow.
 *
 * The heading turns from the humerus onto the forearm over a length of twice
 * `softness` elbow radii (generalization.md: scale the elbow's turn with the
 * elbow's radius), by a smoothstep share renormalised; the walk is the
 * integral of that heading, so the axis has no break in position or tangent.
 * Where the turn is centred is solved so the walk's two straight runs, on
 * the humerus and on the forearm, meet exactly at the elbow centre: the
 * turn's walk runs inside the corner, and the joint centres stay the bones'.
 * Positions inside the turn are the cubic Hermite of samples every
 * {@link STEP} mm with the heading as their derivative, so the axis is C1 and
 * its second derivative follows the heading's turn.
 *
 * The parameter is the walk's arclength from the shoulder centre; it runs on
 * above the shoulder centre (negative) and past the wrist along the forearm.
 */
export namespace AutoMovieHumanArmAxis {
  /** One physically observed absolute digit section frame in native world millimetres. */
  export interface IFixedChart {
    /** Distance along the unchanged source course, millimetres. */
    stationMm: number;

    /** Absolute plane origin in native world millimetres. */
    originMm: Vec3;

    /** First observed tangent to the section plane. */
    u: Vec3;

    /** Second observed tangent in the native chart's handedness. */
    v: Vec3;
  }

  /**
   * Keep the original section planes at their archived stations. Natural
   * splines continue their origins and directions between measurements; the
   * analytic jet differentiates the orthonormalized chart actually used.
   */
  export function observed(planes: readonly IFixedChart[]): AutoMovieViewAxis.IAxis {
    const stations: number[] = planes.map((plane: IFixedChart): number => plane.stationMm);

    /** Reflect the native chart once into capture-world millimetres. */
    const world: (point: Vec3) => Vec3 = ([x, y, z]: Vec3): Vec3 => [x, y, -z];
    const J: typeof AutoMovieHumanArmJet = AutoMovieHumanArmJet;

    /** Preserve the observed station parameter when continuing one chart vector. */
    const vector: (read: (p: IFixedChart) => Vec3) => (s: number) => AutoMovieHumanArmJet.V = (read: (p: IFixedChart) => Vec3): ((s: number) => AutoMovieHumanArmJet.V) => {
      const components: Vec3[] = planes.map(read);
      const splines: AutoMovieNaturalSpline.ISpline[] = [0, 1, 2].map((k: number): AutoMovieNaturalSpline.ISpline =>
        AutoMovieNaturalSpline.create(stations, components.map((p: Vec3): number => p[k]!)));
      return (s: number): AutoMovieHumanArmJet.V => [
        AutoMovieNaturalSpline.read(splines[0]!, s),
        AutoMovieNaturalSpline.read(splines[1]!, s),
        AutoMovieNaturalSpline.read(splines[2]!, s),
      ];
    };
    const origin: (s: number) => AutoMovieHumanArmJet.V = vector((p: IFixedChart): Vec3 => world(p.originMm));
    const across: (s: number) => AutoMovieHumanArmJet.V = vector((p: IFixedChart): Vec3 => world(p.u));
    const up: (s: number) => AutoMovieHumanArmJet.V = vector((p: IFixedChart): Vec3 => {
      const [x, y, z]: Vec3 = world(p.v);
      return [-x, -y, -z];
    });

    /** Orthonormalize the continued frame and retain its analytic derivatives. */
    const frame: (s: number) => { origin: AutoMovieHumanArmJet.V; u: AutoMovieHumanArmJet.V; v: AutoMovieHumanArmJet.V } = (s: number): { origin: AutoMovieHumanArmJet.V; u: AutoMovieHumanArmJet.V; v: AutoMovieHumanArmJet.V } => {
      const u: AutoMovieHumanArmJet.V = J.unit(across(s));
      const normal: AutoMovieHumanArmJet.V = J.unit(J.cross(up(s), u));
      return { origin: origin(s), u, v: J.cross(u, normal) };
    };
    return {
      at: (s: number): ReturnType<AutoMovieViewAxis.IAxis["at"]> => {
        const f: ReturnType<typeof frame> = frame(s);
        return { origin: J.value(f.origin), u: J.value(f.u), v: J.value(f.v) };
      },
      jet: (s: number, parameter?: Parameters<NonNullable<AutoMovieViewAxis.IAxis['jet']>>[1]): ReturnType<NonNullable<AutoMovieViewAxis.IAxis['jet']>> => {
        const f: ReturnType<typeof frame> = frame(s);
        const inverse: [number, number] | null = parameter === undefined ? [1, 0] : AutoMovieViewParameter.inverseJet(parameter, s);
        if (inverse === null) return null;

        /** Apply the caller's parameter jet without changing the physical frame. */
        const derivatives: (vector: AutoMovieHumanArmJet.V) => AutoMovieHumanArmJet.V = (vector: AutoMovieHumanArmJet.V): AutoMovieHumanArmJet.V =>
          vector.map(([value, first, second]: AutoMovieHumanArmJet.J): AutoMovieHumanArmJet.J =>
            [value, first * inverse[0], second * inverse[0] * inverse[0] + first * inverse[1]]) as AutoMovieHumanArmJet.V;
        const origin: AutoMovieHumanArmJet.V = derivatives(f.origin);
        const u: AutoMovieHumanArmJet.V = derivatives(f.u);
        const v: AutoMovieHumanArmJet.V = derivatives(f.v);
        return {
          value: { origin: J.value(origin), u: J.value(u), v: J.value(v) },
          first: { origin: J.first(origin), u: J.first(u), v: J.first(v) },
          second: { origin: J.second(origin), u: J.second(u), v: J.second(v) },
        };
      },
    };
  }

  /** The walk. */
  export interface IAxis {
    /** Point at a walk length. */
    at(s: number): Vec3;

    /** Unit heading at a walk length, away from the shoulder. */
    heading(s: number): Vec3;

    /** Walk length of the turn's middle, where the heading bisects the corner. */
    elbow: number;

    /**
     * Walk length of a station a distance down the forearm from the elbow
     * centre, along it; inside the turn, the share of the way from the
     * turn's middle to its end.
     */
    fore(d: number): number;

    /**
     * Walk length of a station a distance down the humerus from the shoulder
     * centre; inside the turn, the share of the way from its start to its
     * middle.
     */
    upper(d: number): number;

    /** Half the turn's length, mm. */
    soft: number;
  }

  /**
   * The walk for a side's bones.
   *
   * @param bones The bones, left frame.
   * @param soft Half the turn's length, mm.
   */
  export function walk(bones: AutoMovieHumanArmBones.IBones, soft: number): IAxis {
    const u: Vec3 = bones.upper;
    const l: Vec3 = bones.lower;

    // The heading turns from the humerus' direction onto the forearm's by a
    // smoothstep share over 2 soft, centred at `middle`.
    const blend = (s: number, middle: number): Vec3 => {
      const w: number = smooth((s - middle + soft) / (2 * soft));
      return unit([u[0] + w * (l[0] - u[0]), u[1] + w * (l[1] - u[1]), u[2] + w * (l[2] - u[2])]);
    };

    // The turn's samples for a middle, from its start on the humerus to its
    // end on the forearm, integrating the heading by Simpson's rule over each
    // step: the walk's position is the integral of its heading.
    const count: number = Math.max(8, Math.ceil((2 * soft) / STEP));
    const sampled = (middle: number): Vec3[] => {
      const start: number = middle - soft;
      const out: Vec3[] = [plus(bones.shoulder, scale(u, start))];
      const h: number = (2 * soft) / count;

      for (let i: number = 1; i <= count; i++) {
        const a: Vec3 = blend(start + (i - 1) * h, middle);
        const m: Vec3 = blend(start + (i - 0.5) * h, middle);
        const b: Vec3 = blend(start + i * h, middle);
        const d: Vec3 = scale(plus(plus(a, scale(m, 4)), b), h / 6);
        out.push(plus(out[i - 1]!, d));
      }

      return out;
    };

    // Place the middle so the forearm's run meets the humerus' line at the
    // elbow centre: the corner's distance along the humerus moves one for one
    // with the middle, so a few passes close the miss.
    let middle: number = bones.humerus;
    let points: Vec3[] = sampled(middle);
    for (let pass: number = 0; pass < PASSES; pass++) {
      const corner: number = cornerAlong(bones.shoulder, u, points[count]!, l);
      middle += bones.humerus - corner;
      points = sampled(middle);
    }

    const end: Vec3 = points[count]!;
    const start: number = middle - soft;
    const finish: number = middle + soft;

    // The forearm's run past the turn: from the turn's end along the forearm,
    // measured from the elbow centre, which the corner has been placed on.
    const beyond: number = dot(sub(end, bones.elbow), l);
    const heading = (s: number): Vec3 => (s <= start ? u : s >= finish ? l : blend(s, middle));
    const at = (s: number): Vec3 => {
      if (s <= start) return plus(bones.shoulder, scale(u, s));
      if (s >= finish) return plus(end, scale(l, s - finish));

      // Inside the turn the axis is the cubic Hermite of its samples with the
      // heading as their derivative, so it is C1 with the straight runs.
      const h: number = (2 * soft) / count;
      const x: number = (s - start) / h;
      const i: number = Math.min(count - 1, Math.floor(x));
      const t: number = x - i;
      const a: Vec3 = points[i]!;
      const b: Vec3 = points[i + 1]!;
      const ta: Vec3 = scale(blend(start + i * h, middle), h);
      const tb: Vec3 = scale(blend(start + (i + 1) * h, middle), h);
      const h00: number = 2 * t ** 3 - 3 * t ** 2 + 1;
      const h10: number = t ** 3 - 2 * t ** 2 + t;
      const h01: number = -2 * t ** 3 + 3 * t ** 2;
      const h11: number = t ** 3 - t ** 2;

      return [0, 1, 2].map((k: number): number => h00 * a[k]! + h10 * ta[k]! + h01 * b[k]! + h11 * tb[k]!) as Vec3;
    };

    return {
      at,
      heading,
      elbow: middle,
      fore: (d: number): number => (d >= beyond ? finish + (d - beyond) : middle + ((finish - middle) * Math.max(0, d)) / beyond),
      upper: (d: number): number =>
        d <= start ? d : start + ((middle - start) * (Math.min(bones.humerus, d) - start)) / (bones.humerus - start),
      soft,
    };
  }
}

/** A point or direction. */
type Vec3 = [number, number, number];

/** Spacing of the turn's samples, mm. */
const STEP: number = 0.25;

/** Passes placing the turn's middle; each leaves a fraction of the last miss. */
const PASSES: number = 4;

/**
 * Where, along the humerus' line from the shoulder centre, it passes closest
 * to the forearm's line through a point.
 */
function cornerAlong(origin: Vec3, u: Vec3, point: Vec3, l: Vec3): number {
  const w: Vec3 = sub(origin, point);
  const p: number = dot(u, l);
  const q: number = dot(u, w);
  const r: number = dot(l, w);
  return (p * r - q) / (1 - p * p);
}

function smooth(x: number): number {
  const t: number = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function plus(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function scale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function unit(a: Vec3): Vec3 {
  const l: number = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
}
