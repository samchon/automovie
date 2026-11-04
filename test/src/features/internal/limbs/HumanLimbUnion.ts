import { AutoMovieHumanLoftChain } from "../../../../../packages/human/src/lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanRelief } from "../../../../../packages/human/src/network/IAutoMovieHumanRelief";
import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";

type IRow = HumanAnatomyAudit.IRow;
type Vec3 = [number, number, number];

/**
 * A protruding piece attached to its base by volume only: the same chain built
 * without its reliefs (the base envelope) and with them (the merged surface),
 * sampled at the same stations and phases and compared point by point.
 *
 * A protrusion such as a malleolus, a patella or a pulp adds volume: the merged
 * surface never lies inside the base, it leaves the base unchanged outside the
 * piece's window, it meets the base there with the base's own tangent plane
 * (G1), and its blend is wide for its height, so the protrusion reads as part
 * of the skin rather than a lump set on it. A recess belongs to the base or to a
 * declared subtractive piece, so a merged point inside the base is a defect of
 * the union, whichever piece made it.
 */
export namespace HumanLimbUnion {
  /** Phases a ring is read at. */
  export const PHASES: number = 256;

  /** Station step of the comparison, mm. */
  export const STEP: number = 0.5;

  /** Station step away from every window, mm. */
  export const COARSE: number = 5;

  /** Margin either side of a window read at the fine step, mm. */
  export const MARGIN: number = 10;

  /** Rounding allowance of a point that moves by nothing, mm. */
  export const ROUNDING: number = 1e-6;

  /** Largest step into the base a merged point may take, mm: one hundredth of a millimetre, below any rendered vertex's place. */
  export const INSIDE: number = 0.01;

  /**
   * Largest slope of the edge of the blend against the base: class A
   * surfacing's 0.1 degree normal mismatch along a seam, read as the
   * displacement's rise per mm across the window's edge.
   */
  export const EDGE: number = Math.tan((0.1 * Math.PI) / 180);

  /**
   * Largest slope of the protrusion over its base anywhere in the window: one,
   * 45 degrees. A smooth bump of height h over half width r, such as the
   * relief nets' `(1 - x^2)^3`, rises at most about 1.6 h / r, so this asks for
   * a blend at least 1.6 times as wide as the piece is tall.
   */
  export const STEEPEST: number = 1;

  /** One comparison. */
  export interface IInput {
    /** Person, in findings. */
    person: string;

    /** Label of the union, such as `left foot malleoli`. */
    label: string;

    /** The base chain, built without the reliefs. */
    base: IAutoMovieHumanLoftChain;

    /** The merged chain, the same with the reliefs. */
    merged: IAutoMovieHumanLoftChain;

    /** The reliefs attached; their station windows bound where the base may move. */
    reliefs: readonly IAutoMovieHumanRelief[];
  }

  /** A piece given as its added height over a window of its base. */
  export interface IHeights {
    /** Person, in findings. */
    person: string;

    /** The piece, in findings. */
    label: string;

    /** The piece's height over its base at window coordinates `(s, t)`, mm, along the base's outward normal. */
    height: (s: number, t: number) => number;

    /** The window along its first coordinate, mm. */
    s: readonly [number, number];

    /** The window along its second coordinate, mm; `[0, 0]` for a piece that is the same all round. */
    t: readonly [number, number];
  }

  /**
   * A piece's rows from its height alone, before it is attached: it adds
   * volume everywhere in its window (no negative height), is zero on the
   * window's edge, leaves the edge with the base's tangent plane, and rises no
   * steeper than {@link STEEPEST}.
   */
  export function heights(input: IHeights): IRow[] {
    const n: number = 60;
    const delta: number = 0.01;
    const [s0, s1]: readonly [number, number] = input.s;
    const [t0, t1]: readonly [number, number] = input.t;
    const round: boolean = t1 === t0;
    let least: number = 0;
    let edge: number = 0;
    let rise: number = 0;
    let steepest: number = 0;
    for (let i: number = 0; i <= n; i++)
      for (let j: number = 0; j <= (round ? 0 : n); j++) {
        const s: number = s0 + ((s1 - s0) * i) / n;
        const t: number = round ? t0 : t0 + ((t1 - t0) * j) / n;
        const h: number = input.height(s, t);
        least = Math.min(least, h);
        const ds: number = (input.height(s + delta, t) - input.height(s - delta, t)) / (2 * delta);
        const dt: number = round ? 0 : (input.height(s, t + delta) - input.height(s, t - delta)) / (2 * delta);
        steepest = Math.max(steepest, Math.abs(ds), Math.abs(dt));
        const onEdge: boolean = i === 0 || i === n || (!round && (j === 0 || j === n));
        if (onEdge) {
          edge = Math.max(edge, Math.abs(h));
          rise = Math.max(rise, Math.abs(ds), Math.abs(dt));
        }
      }
    return [
      { person: input.person, site: `${input.label}: least height over its base (a negative one carves into the base), mm`, value: least, low: -ROUNDING, high: Infinity, unit: "mm" },
      { person: input.person, site: `${input.label}: height on its window's edge, mm`, value: edge, low: 0, high: ROUNDING, unit: "mm" },
      { person: input.person, site: `${input.label}: rise across its window's edge, per mm`, value: rise, low: 0, high: EDGE, unit: "" },
      { person: input.person, site: `${input.label}: steepest rise over the base, per mm`, value: steepest, low: 0, high: STEEPEST, unit: "" },
    ];
  }

  /**
   * The union's rows: the deepest merged point inside the base, the largest
   * move outside every relief's window, the steepest rise at a window's edge
   * and anywhere in it.
   */
  export function rows(input: IInput): IRow[] {
    const low: number = input.base.layers[0]!.y;
    const high: number = input.base.layers[input.base.layers.length - 1]!.y;
    const phases: number[] = Array.from({ length: PHASES }, (_: unknown, k: number): number => (2 * Math.PI * k) / PHASES);

    // Fine steps across each window and its margin, coarse steps elsewhere: the
    // base is read everywhere, the blend's rise only between fine steps.
    const stations: number[] = [];
    for (let s: number = low; s <= high + 1e-9; ) {
      stations.push(s);
      const near: boolean = input.reliefs.some((r: IAutoMovieHumanRelief): boolean => s >= r.stations[0] - MARGIN && s <= r.stations[1] + MARGIN);
      s += near ? STEP : COARSE;
    }
    const lift: number[][] = [];
    let inside: number = 0;
    let outside: number = 0;
    let insideAt: string = "nowhere";
    let outsideAt: string = "nowhere";
    for (const s of stations) {
      const base: Vec3[] = AutoMovieHumanLoftChain.ring(input.base, s, phases) as Vec3[];
      const merged: Vec3[] = AutoMovieHumanLoftChain.ring(input.merged, s, phases) as Vec3[];
      const c: Vec3 = centroid(base);
      const row: number[] = [];
      base.forEach((p: Vec3, k: number): void => {
        const d: Vec3 = sub(merged[k]!, p);

        // A point is inside a window only by that relief's own stations and
        // phases: two windows sharing stations (the two malleoli) cover
        // different phases.
        const within: boolean = input.reliefs.some((r: IAutoMovieHumanRelief): boolean => covers(r, s, phases[k]!));

        // The base's outward direction in its section: across the ring's
        // tangent, away from the section's centroid.
        const t: Vec3 = sub(base[(k + 1) % PHASES]!, base[(k + PHASES - 1) % PHASES]!);
        const r: Vec3 = sub(p, c);
        const along: number = dot(r, t) / Math.max(dot(t, t), 1e-12);
        const n: Vec3 = unit(sub(r, scale(t, along)));
        const out: number = dot(d, n);
        row.push(out);
        if (-out > inside) {
          inside = -out;
          insideAt = `station ${s.toFixed(1)} phase ${k}`;
        }
        if (!within && Math.hypot(...d) > outside) {
          outside = Math.hypot(...d);
          outsideAt = `station ${s.toFixed(1)} phase ${k}`;
        }
      });
      lift.push(row);
    }

    // The rise of the protrusion along the stations: at the first and last
    // step of each window and anywhere between.
    let edge: number = 0;
    let steepest: number = 0;
    for (let i: number = 1; i < stations.length; i++)
      for (let k: number = 0; k < PHASES; k++) {
        if (stations[i]! - stations[i - 1]! > STEP + 1e-9) continue;
        const slope: number = Math.abs(lift[i]![k]! - lift[i - 1]![k]!) / STEP;
        steepest = Math.max(steepest, slope);
        const s: number = stations[i]!;

        // The step across a window's station edge, at a phase of that same
        // window, so one relief's slope is never read at another's edge.
        const atEdge: boolean = input.reliefs.some(
          (r: IAutoMovieHumanRelief): boolean =>
            inPhase(r, phases[k]!) && (Math.abs(s - r.stations[0]) <= STEP || Math.abs(s - STEP - r.stations[1]) <= STEP),
        );
        if (atEdge) edge = Math.max(edge, slope);
      }
    const site: string = `${input.label} on ${input.base.name}`;
    return [
      { person: input.person, site: `${site}: deepest merged point inside the base (at ${insideAt}), mm`, value: inside, low: 0, high: INSIDE, unit: "mm" },
      { person: input.person, site: `${site}: largest move of the base outside every window (at ${outsideAt}), mm`, value: outside, low: 0, high: ROUNDING, unit: "mm" },
      { person: input.person, site: `${site}: rise of the blend across a window's edge, per mm`, value: edge, low: 0, high: EDGE, unit: "" },
      { person: input.person, site: `${site}: steepest rise of the protrusion over its base, per mm`, value: steepest, low: 0, high: STEEPEST, unit: "" },
    ];
  }
}

/** Whether a relief's phase window holds a phase, the window read round the ring from its first phase. */
function inPhase(r: IAutoMovieHumanRelief, t: number): boolean {
  const two: number = 2 * Math.PI;
  const width: number = r.phases[1] - r.phases[0];
  const from: number = (((t - r.phases[0]) % two) + two) % two;
  return width >= two || from <= width + 1e-9;
}

/** Whether a relief's window holds a station and a phase. */
function covers(r: IAutoMovieHumanRelief, s: number, t: number): boolean {
  return s >= r.stations[0] - 1e-6 && s <= r.stations[1] + 1e-6 && inPhase(r, t);
}

/** Difference. */
function sub(a: readonly number[], b: readonly number[]): Vec3 {
  return [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
}

/** Dot product. */
function dot(a: readonly number[], b: readonly number[]): number {
  return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
}

/** Scaled vector. */
function scale(a: readonly number[], k: number): Vec3 {
  return [a[0]! * k, a[1]! * k, a[2]! * k];
}

/** Unit vector, or zero for a null one. */
function unit(a: Vec3): Vec3 {
  const l: number = Math.hypot(...a);
  return l > 0 ? scale(a, 1 / l) : [0, 0, 0];
}

/** Mean of a ring's points. */
function centroid(ring: readonly Vec3[]): Vec3 {
  const s: Vec3 = [0, 0, 0];
  for (const p of ring) for (let i: number = 0; i < 3; i++) s[i]! += p[i]!;
  return scale(s, 1 / ring.length);
}
