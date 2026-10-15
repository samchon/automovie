import {
  IAutoMovieSurfaceNetwork,
  IAutoMovieSweepSurface,
  compileAutoMovieSweep,
} from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanLimbPlan } from "./IAutoMovieHumanLimbPlan";

/**
 * Rounding of a muscle belly's border under the skin with no fat over it, millimetres: the fascia and the skin alone. Grade: conventional.
 */
const FASCIA: number = 3;

/**
 * Blur the subcutaneous fat adds to a border, per millimetre of fat over it: the layer spreads a step under it over more than its own depth. The reference bodies available for calibration do not model fat-dependent sharpness, so the value stays conventional until a measured source is read. Grade: conventional, judged in the viewer on the lean and median adults.
 */
const BLUR_PER_FAT: number = 1.5;

/** Smallest deep half-width of a belly as a share of its tabulated spread, for a form so narrow that the reference fat alone would account for its width. Grade: conventional. */
const LEAST_DEEP_SHARE: number = 0.4;

/**
 * Share of the tabulated heights the skin shows. The relief tables' heights were fitted as bands of the cage, whose sampling averaged them over a cell, so at render resolution they stand far higher than they did and read as lumps; the share is held at zero, the limbs showing their block-out, until the tables are rebuilt from cited muscle anatomy with heights for the surface itself. Grade: conventional.
 */
const SHOWN: number = 0;

/** Rows along the limb of the arc-length table and of the row means. Grade: numerical. */
const ROWS: number = 240;

/** Directions round the limb of the arc-length table and of the row means. Grade: numerical. */
const AROUND: number = 128;

/**
 * The superficial relief of a limb as a displacement of its subdivided surface along the normal, millimetres, at a point of the limb's chart `(u, v)`.
 *
 * The cage carries the limb's gross form only; this field carries the plan's reliefs, the muscle bellies, furrows and bony landmarks, at whatever resolution the surface is refined to. Each relief is a belly along its course: a flat-topped belly running between the half-maximum levels of its tabulated height profile, whose rim falls to the skin by a raised cosine as wide as its border: the fascia (3 mm) with the fat over it on this person (1.5 times its thickness), so a thin layer shows a steep border and a thick one a long slope. The tables describe each form on the average adult as a Gaussian of spread `s` at height `h`; the deep belly is that form with the average adult's own fat blur taken away, of half-width `2 √(s² − 3² − (1.5 f_ref)²)` (at least `0.8 s`), and its crest is set so the area across is about the table's. A lean person shows the same belly with sharp borders, a fat one as a soft swell, at the same area, so belly size follows the lean mass the plan's heights carry and visibility follows the fat.
 *
 * Every width and distance is in millimetres on the surface: along the limb by the spine's length, round it by the arc length of the sweep's own section at that `u`, read from a table of the compiled sweep, so a muscle keeps its width whatever the section's girth or the cage's columns. The field vanishes from each ring to its collar and rises by a smoothstep over the next two gaps between stations, so the junctions keep their shape exactly, and each row's mean round the limb is taken away, so the relief reshapes a section without changing the girth the loft holds there.
 *
 * @param plan The limb's plan, its relief carrying the tabulated forms and the fat over them
 * @param network The limb's calibrated surface network, whose sweep `limb` the chart addresses
 * @returns The displacement at chart `(u, v)` and the forms' curves for inspection
 */
export function fieldAutoMovieHumanLimbRelief(
  plan: IAutoMovieHumanLimbPlan,
  network: IAutoMovieSurfaceNetwork,
): fieldAutoMovieHumanLimbRelief.IOutput {
  const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
  const stations: IAutoMovieHumanLimbPlan.IStation[] = plan.stations;
  const n: number = stations.length;
  const lengths: number[] = [0];
  for (let k: number = 1; k < n; ++k)
    lengths.push(
      lengths[k - 1]! +
        V.distance(stations[k - 1]!.centre, stations[k]!.centre),
    );
  const total: number = lengths[n - 1]!;
  const at: number[] = lengths.map((l: number): number => l / total);
  const share = (index: number): number => {
    const i: number = Math.min(n - 2, Math.max(0, Math.floor(index)));
    return (
      at[i]! + (at[i + 1]! - at[i]!) * Math.min(1, Math.max(0, index - i))
    );
  };
  const smooth = (x: number): number => {
    const t: number = Math.min(1, Math.max(0, x));
    return t * t * (3 - 2 * t);
  };
  const window = (u: number): number =>
    smooth((u - at[1]!) / (at[3]! - at[1]!)) *
    smooth((at[n - 2]! - u) / (at[n - 2]! - at[n - 4]!));

  // arc length round each row of the sweep, millimetres, from v = 0
  const surface: IAutoMovieSweepSurface = compileAutoMovieSweep(
    network.sweeps["limb"]!,
  );
  const arcs: Float64Array[] = Array.from(
    { length: ROWS + 1 },
    (_: unknown, i: number): Float64Array => {
      const row: Float64Array = new Float64Array(AROUND + 1);
      let previous: IAutoMovieVector3 = surface.point(i / ROWS, 0);
      for (let j: number = 1; j <= AROUND; ++j) {
        const p: IAutoMovieVector3 = surface.point(i / ROWS, j / AROUND);
        row[j] = row[j - 1]! + 1000 * V.distance(previous, p);
        previous = p;
      }
      return row;
    },
  );
  const rowOf = (u: number): [number, number] => {
    const x: number = Math.min(ROWS, Math.max(0, u * ROWS));
    const i: number = Math.min(ROWS - 1, Math.floor(x));
    return [i, x - i];
  };
  const arc = (u: number, v: number): number => {
    const [i, t] = rowOf(u);
    const y: number = (v - Math.floor(v)) * AROUND;
    const j: number = Math.min(AROUND - 1, Math.floor(y));
    const read = (r: Float64Array): number =>
      r[j]! + (y - j) * (r[j + 1]! - r[j]!);
    const a: number = read(arcs[i]!);
    return a + t * (read(arcs[i + 1]!) - a);
  };
  const perimeter = (u: number): number => {
    const [i, t] = rowOf(u);
    return arcs[i]![AROUND]! + t * (arcs[i + 1]![AROUND]! - arcs[i]![AROUND]!);
  };
  // signed arc length from the crest's direction to v at u, the shorter way round
  const across = (u: number, v: number, crest: number): number => {
    const p: number = perimeter(u);
    let d: number = arc(u, v) - arc(u, crest);
    d -= p * Math.round(d / p);
    return d;
  };
  const lerp = (xs: number[], ys: number[], x: number): number => {
    if (x <= xs[0]!) return ys[0]!;
    for (let k: number = 1; k < xs.length; ++k)
      if (x <= xs[k]!)
        return (
          ys[k - 1]! +
          ((x - xs[k - 1]!) / (xs[k]! - xs[k - 1]!)) * (ys[k]! - ys[k - 1]!)
        );
    return ys[ys.length - 1]!;
  };

  const forms: IForm[] = plan.relief.map(
    (r: IAutoMovieHumanLimbPlan.IRelief): IForm => {
      const form: IForm = {
        us: [],
        turns: [],
        half: [],
        border: [],
        spread: r.spread,
        crest: 0,
        centre: 0,
        length: 0,
      };
      const heights: number[] = [];
      let previous: number | null = null;
      for (const p of r.points) {
        const deep: number = Math.max(
          LEAST_DEEP_SHARE * r.spread,
          Math.sqrt(
            Math.max(
              0,
              r.spread ** 2 - FASCIA ** 2 - (BLUR_PER_FAT * p.reference) ** 2,
            ),
          ),
        );
        let turn: number = p.angle / (2 * Math.PI);
        if (previous !== null) turn -= Math.round(turn - previous);
        previous = turn;
        form.us.push(share(p.at));
        form.turns.push(turn);
        form.half.push(2 * deep);
        form.border.push(Math.hypot(FASCIA, BLUR_PER_FAT * p.fat));
        heights.push(p.height);
      }
      // the belly's ends: the half-maximum crossings of its height profile, mirrored past a cut end
      const k: number = heights.reduce(
        (best: number, h: number, i: number): number =>
          Math.abs(h) > Math.abs(heights[best]!) ? i : best,
        0,
      );
      const peak: number = heights[k]!;
      const cross = (step: number): number => {
        for (
          let i: number = k;
          i + step >= 0 && i + step < form.us.length;
          i += step
        ) {
          const a: number = heights[i]! / peak;
          const b: number = heights[i + step]! / peak;
          if (b <= 0.5)
            return (
              form.us[i]! +
              ((a - 0.5) / (a - b)) * (form.us[i + step]! - form.us[i]!)
            );
        }
        const end: number = form.us[step > 0 ? form.us.length - 1 : 0]!;
        return end + (end - form.us[k]!);
      };
      const low: number = cross(-1);
      const high: number = cross(1);
      form.crest = peak;
      form.centre = ((low + high) / 2) * total;
      form.length = (2 / Math.PI) * (high - low) * total;
      return form;
    },
  );

  const raw = (u: number, v: number): number => {
    const w: number = window(u);
    if (w === 0) return 0;
    const x: number = u * total;
    let sum: number = 0;
    for (const f of forms) {
      if (f.crest === 0 || f.length <= 0) continue;
      const b: number = lerp(f.us, f.border, u);
      if (Math.abs(x - f.centre) > f.length + 3 * b) continue;
      const a: number = lerp(f.us, f.half, u);
      const y: number = across(u, v, lerp(f.us, f.turns, u));
      if (Math.abs(y) > a + 3 * b) continue;
      const rho: number = Math.hypot((x - f.centre) / f.length, y / a);
      if (rho >= 1 + (3 * b) / Math.min(a, f.length)) continue;
      // a raised-cosine belly, flat-topped and meeting the skin tangentially, its rim tightened toward a step by the fascia and widened by the fat
      const span: number = Math.min(a, f.length);
      const edge: number = Math.min(1, b / span);
      const t: number = Math.min(1, Math.max(0, (rho - (1 - edge)) / (2 * edge)));
      const shape: number = rho <= 1 - edge ? 1 : Math.cos((Math.PI / 2) * t) ** 2;
      // across, the belly's area is its crest times its width less its rims, the table's Gaussian √(2π) s h
      sum +=
        ((SHOWN * f.crest * Math.sqrt(2 * Math.PI) * f.spread) / (2 * a)) *
        shape;
    }
    return w * sum;
  };
  // the row means, computed on the first evaluation
  let means: Float64Array | null = null;
  const mean = (u: number): number => {
    if (means === null) {
      means = new Float64Array(ROWS + 1);
      for (let i: number = 0; i <= ROWS; ++i) {
        let s: number = 0;
        for (let j: number = 0; j < AROUND; ++j) s += raw(i / ROWS, j / AROUND);
        means[i] = s / AROUND;
      }
    }
    const [i, t] = rowOf(u);
    return means[i]! + t * (means[i + 1]! - means[i]!);
  };
  // the turn at which the arc length from the crest's direction is y, millimetres, at u
  const turnAt = (u: number, crest: number, y: number): number => {
    const target: number = arc(u, crest) + y;
    const p: number = perimeter(u);
    const wrapped: number = ((target % p) + p) % p;
    let low: number = 0;
    let high: number = 1;
    for (let k: number = 0; k < 40; ++k) {
      const middle: number = (low + high) / 2;
      if (arc(u, middle) < wrapped) low = middle;
      else high = middle;
    }
    return (low + high) / 2;
  };
  const model = (u: number, v: number): IAutoMovieVector3 => {
    const p: IAutoMovieVector3 = surface.point(u, v);
    return { x: p.x * 1000, y: p.y * 1000, z: p.z * 1000 };
  };
  return {
    at: (u: number, v: number): number => raw(u, v) - mean(u),
    curves: (): fieldAutoMovieHumanLimbRelief.ICurve[] =>
      forms.flatMap(
        (f: IForm, k: number): fieldAutoMovieHumanLimbRelief.ICurve[] => {
          if (f.crest === 0 || f.length <= 0) return [];
          const name: string = plan.relief[k]!.name;
          const u0: number = Math.max(0, (f.centre - f.length) / total);
          const u1: number = Math.min(1, (f.centre + f.length) / total);
          const STEPS: number = 32;
          const centre: IAutoMovieVector3[] = Array.from(
            { length: STEPS + 1 },
            (_: unknown, i: number): IAutoMovieVector3 => {
              const u: number = u0 + ((u1 - u0) * i) / STEPS;
              return model(u, lerp(f.us, f.turns, u));
            },
          );
          // the border: where the belly's height is half its crest, the ellipse rho = 1 on the unrolled surface
          const border: IAutoMovieVector3[] = [];
          for (let i: number = 0; i < 2 * STEPS; ++i) {
            const phi: number = (Math.PI * i) / STEPS;
            const u: number = (f.centre + f.length * Math.cos(phi)) / total;
            if (u < 0 || u > 1) continue;
            const y: number = lerp(f.us, f.half, u) * Math.sin(phi);
            border.push(model(u, turnAt(u, lerp(f.us, f.turns, u), y)));
          }
          return [
            { name: `${name} centre`, closed: false, points: centre },
            { name: `${name} border`, closed: true, points: border },
          ];
        },
      ),
  };
}
/** Output types of {@link fieldAutoMovieHumanLimbRelief}. */
export namespace fieldAutoMovieHumanLimbRelief {
  /**
   * A limb's relief field and its forms for inspection.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** Displacement, millimetres, outward positive, at chart `(u, v)`. */
    at: (u: number, v: number) => number;

    /** Each form's centre line and its half-height border on the limb's gross surface, model frame, millimetres. */
    curves: () => ICurve[];
  }

  /**
   * One curve of a relief form.
   *
   * @author Samchon
   */
  export interface ICurve {
    /** The form and which of its lines this is. */
    name: string;

    /** Whether the curve closes on itself. */
    closed: boolean;

    /** Its points, model frame, millimetres. */
    points: IAutoMovieVector3[];
  }
}

/** One relief resolved for evaluation: its course in chart terms and its belly in millimetres. */
interface IForm {
  /** Chart `u` of each course point. */
  us: number[];

  /** Crest direction of each course point, turns, unwrapped along the course. */
  turns: number[];

  /** Deep half-width across the course at each point, millimetres. */
  half: number[];

  /** Border rounding at each point, millimetres: the fascia with the fat over it. */
  border: number[];

  /** The tabulated spread, millimetres. */
  spread: number;

  /** The tabulated greatest height, millimetres. */
  crest: number;

  /** Centre of the belly along the limb, millimetres. */
  centre: number;

  /** Half-length of the belly along the limb, millimetres. */
  length: number;
}
