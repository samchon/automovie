import { AutoMovieViewChain as Q } from "../../../packages/engine/src/geometry/construction/AutoMovieViewChain";

/**
 * One section of a conic family as a short vector of named shape numbers,
 * read through a layout of anchors.
 *
 * A section is a closed chain of conic arcs through its anchors in
 * increasing phase. Every anchor is a point whose tangent the layout fixes
 * by rule, so no number is spent on a direction that anatomy already gives:
 *
 * - `u`: a point where the section runs parallel to the chart's `v` axis: a
 *   front or back extreme, or the bottom of a midline groove. Its numbers are
 *   its `u` and `v`; a `mid` anchor stands on the median line `v = 0` and has
 *   only `u`.
 * - `v`: a point where the section runs parallel to the `u` axis: a side
 *   extreme. Its numbers are its `u` and `v`.
 * - `m`: the median point of the conic triangle its two neighbours span:
 *   `S = M + f (A - M)` on the segment from the chord midpoint `M` to the
 *   meeting `A` of the neighbours' tangent lines, with the tangent parallel to
 *   the chord, as every conic has at its own median point. Its number is `f`.
 * - `i`: an inflection between two neighbours whose tangents are parallel (a
 *   crest beside a groove). An S-shaped stretch crosses its own chord once,
 *   at the inflection, so the point is `P0 + t (P2 - P0)` and its tangent is
 *   the chord's direction turned by `d`. Its numbers are `t` and `d`.
 *
 * After the anchors come the shoulders, one per arc between consecutive
 * anchors. A `mirror` layout lists the anchors of the half `v >= 0` from the
 * front median anchor to the back median anchor and reflects them, so a
 * bilateral section spends its numbers once.
 *
 * Shares (`f`, `t`, shoulders) are confined to `[EDGE, 1 - EDGE]` inside the
 * model itself, so the fit, the stored text and the runtime read one curve.
 */
export namespace FamilyConicSection {
  /** A planar chart point, millimetres. */
  export type P = [number, number];

  /** One anchor of a layout. */
  export interface IAnchor {
    /** The tangent rule, as the namespace describes. */
    kind: "u" | "v" | "m" | "i";

    /** A `u` anchor on the median line `v = 0`. */
    mid?: boolean;

    /** One of the four anchors the engine takes as its `+u`, `+v`, `-u`, `-v` guides, in that order along the chain. */
    guide?: boolean;

    /** Phase window in radians where the seed looks for this `u` or `v` anchor; absent, the whole turn. */
    window?: [number, number];

    /** Whether the seed takes the window's largest or smallest coordinate; absent, the outermost. */
    pick?: "max" | "min";
  }

  /** The anchors of a section family. */
  export interface ILayout {
    /** Anchors in increasing phase; for a mirror layout the half from phase 0 to pi inclusive. */
    anchors: IAnchor[];

    /** Reflect the listed half in the median line `v = 0`. */
    mirror: boolean;
  }

  /** What a field measures: millimetres, a share in (0, 1), or an angle in radians. */
  export type Unit = "mm" | "share" | "angle";

  /** Bound of every share inside the model. */
  const EDGE: number = 0.03;

  /** The limb layout: four extremes, and with `split` a median anchor inside each quarter. */
  export function limb(split: boolean): ILayout {
    const anchors: IAnchor[] = [];
    for (const [kind, pick] of [["u", "max"], ["v", "max"], ["u", "min"], ["v", "min"]] as const) {
      anchors.push({ kind, guide: true, pick });
      if (split) anchors.push({ kind: "m" });
    }
    return { anchors, mirror: false };
  }

  /** Unit of every field of a layout, in field order: each anchor's numbers, then one shoulder per arc. */
  export function units(layout: ILayout): Unit[] {
    const out: Unit[] = [];
    for (const anchor of layout.anchors) {
      if (anchor.kind === "m") out.push("share");
      else if (anchor.kind === "i") out.push("share", "angle");
      else if (anchor.mid === true) out.push("mm");
      else out.push("mm", "mm");
    }
    const arcs: number = layout.mirror ? layout.anchors.length - 1 : layout.anchors.length;
    for (let k: number = 0; k < arcs; ++k) out.push("share");
    return out;
  }

  /** The closed chain of a field vector with the positions of the engine's four guides in it. */
  export interface IChain {
    /** The native chain input: points, tangents and shoulders in increasing phase. */
    input: Q.IInput;

    /** Indices of the `+u`, `+v`, `-u`, `-v` guides in the chain. */
    guides: number[];
  }

  /** Resolve a field vector into its closed chain. */
  export function resolve(values: readonly number[], layout: ILayout): IChain {
    const K: number = layout.anchors.length;
    const points: (P | null)[] = new Array<P | null>(K).fill(null);
    const tangents: (P | null)[] = new Array<P | null>(K).fill(null);
    const at: number[] = [];
    let cursor: number = 0;
    for (const anchor of layout.anchors) {
      at.push(cursor);
      cursor += anchor.kind === "m" || anchor.mid === true ? 1 : 2;
    }

    // Extremes first: their tangents follow the counter-clockwise travel of the chain.
    layout.anchors.forEach((anchor: IAnchor, k: number): void => {
      if (anchor.kind !== "u" && anchor.kind !== "v") return;
      const p: P = anchor.mid === true ? [values[at[k]!]!, 0] : [values[at[k]!]!, values[at[k]! + 1]!];
      points[k] = p;
      tangents[k] = anchor.kind === "u" ? [0, p[0] > 0 ? 1 : -1] : [p[1] > 0 ? -1 : 1, 0];
    });

    // Then the anchors that stand on their neighbours' triangle or chord.
    layout.anchors.forEach((anchor: IAnchor, k: number): void => {
      if (anchor.kind !== "m" && anchor.kind !== "i") return;
      const p0: P = points[(k + K - 1) % K]!;
      const p2: P = points[(k + 1) % K]!;
      const share: number = clamp(values[at[k]!]!);
      if (anchor.kind === "i") {
        const angle: number = Math.atan2(p2[1] - p0[1], p2[0] - p0[0]) + values[at[k]! + 1]!;
        points[k] = [p0[0] + share * (p2[0] - p0[0]), p0[1] + share * (p2[1] - p0[1])];
        tangents[k] = [Math.cos(angle), Math.sin(angle)];
        return;
      }
      const t0: P = tangents[(k + K - 1) % K]!;
      const t2: P = tangents[(k + 1) % K]!;
      const a: number = ((p2[0] - p0[0]) * t2[1] - (p2[1] - p0[1]) * t2[0]) / (t0[0] * t2[1] - t0[1] * t2[0]);
      const corner: P = [p0[0] + a * t0[0], p0[1] + a * t0[1]];
      const middle: P = [(p0[0] + p2[0]) / 2, (p0[1] + p2[1]) / 2];
      points[k] = [middle[0] + share * (corner[0] - middle[0]), middle[1] + share * (corner[1] - middle[1])];
      tangents[k] = [p2[0] - p0[0], p2[1] - p0[1]];
    });
    const input: Q.IInput = { points: [], tangents: [], shoulders: [] };
    const guides: number[] = [];
    const rho = (arc: number): number => clamp(values[cursor + arc]!);
    for (let k: number = 0; k < K; ++k) {
      if (layout.anchors[k]!.guide === true) guides.push(input.points.length);
      input.points.push(points[k]!);
      input.tangents.push(tangents[k]!);
      input.shoulders.push(rho(layout.mirror && k === K - 1 ? K - 2 : k));
    }
    if (layout.mirror)
      for (let k: number = K - 2; k >= 1; --k) {
        if (layout.anchors[k]!.kind === "v" && layout.anchors[k]!.guide === true) guides.push(input.points.length);
        input.points.push([points[k]![0], -points[k]![1]]);
        input.tangents.push([-tangents[k]![0], tangents[k]![1]]);
        input.shoulders.push(rho(k - 1));
      }
    return { input, guides };
  }

  /** Build the engine's native conic chain from a field vector. */
  export function chain(values: readonly number[], layout: ILayout): Q.ISection {
    return Q.of(resolve(values, layout).input);
  }

  /**
   * Carry a plain limb section to the split limb layout without changing its
   * curve: a conic of middle weight `w = rho / (1 - rho)` cut at its median
   * point leaves two conics of middle weight `sqrt((1 + w) / 2)` (the
   * rational de Casteljau step at `t = 1/2` with the end weights renormalised
   * to one; Farin, "Curves and Surfaces for CAGD", rational subdivision), and
   * the median point stands at the share `rho`.
   */
  export function refine(values: readonly number[]): number[] {
    const out: number[] = [];
    const halves: number[] = [];
    for (let q: number = 0; q < 4; ++q) {
      const rho: number = values[8 + q]!;
      const w: number = Math.sqrt((1 + rho / (1 - rho)) / 2);
      out.push(values[2 * q]!, values[2 * q + 1]!, rho);
      halves.push(w / (1 + w), w / (1 + w));
    }
    return [...out, ...halves];
  }

  /**
   * Radius of a closed polygon along one ray from the chart origin.
   *
   * A star-shaped section meets every ray once. Where a faceted source meets
   * it more than once the outermost hit is returned and `folds` counts the
   * event, so the caller reports the non-star interval instead of losing it.
   */
  export function radius(points: readonly P[], phi: number, folds?: { count: number }): number {
    const d: P = [Math.cos(phi), Math.sin(phi)];
    let best: number = NaN;
    let hits: number = 0;
    for (let i: number = 0; i < points.length; ++i) {
      const a: P = points[i]!;
      const b: P = points[(i + 1) % points.length]!;
      const sa: number = a[0] * d[1] - a[1] * d[0];
      const sb: number = b[0] * d[1] - b[1] * d[0];
      if ((sa > 0) === (sb > 0)) continue;
      const t: number = sa / (sa - sb);
      const r: number = (1 - t) * (a[0] * d[0] + a[1] * d[1]) + t * (b[0] * d[0] + b[1] * d[1]);
      if (!(r > 0)) continue;
      ++hits;
      if (!(best >= r)) best = r;
    }
    if (hits > 1 && folds !== undefined) ++folds.count;
    return best;
  }

  /**
   * A starting field vector read from one observed polygon: each extreme in
   * its window, each median and inflection where the polygon crosses its
   * segment, and each shoulder where the polygon crosses its arc's median.
   * The joint fit owns the final values; this only has to be admissible.
   */
  export function seed(points: readonly P[], layout: ILayout): number[] {
    const K: number = layout.anchors.length;
    const values: number[] = [];
    const found: (P | null)[] = new Array<P | null>(K).fill(null);
    const tangent: (P | null)[] = new Array<P | null>(K).fill(null);
    const at: number[] = [];
    layout.anchors.forEach((anchor: IAnchor, k: number): void => {
      at.push(values.length);
      if (anchor.kind === "m") values.push(0.5);
      else if (anchor.kind === "i") values.push(0.5, 0);
      else {
        const axis: 0 | 1 = anchor.kind === "u" ? 0 : 1;
        let p: P;
        if (anchor.mid === true) {
          const front: boolean = anchor.window === undefined || Math.cos((anchor.window[0] + anchor.window[1]) / 2) > 0;
          p = [(front ? 1 : -1) * radius(points, front ? 0 : Math.PI), 0];
        } else {
          const inside: P[] = points.filter((q: P): boolean => {
            if (anchor.window === undefined) return true;
            let phi: number = Math.atan2(q[1], q[0]);
            while (phi < anchor.window[0]) phi += 2 * Math.PI;
            return phi <= anchor.window[1];
          });
          const sign: number = anchor.pick === "max" ? 1 : anchor.pick === "min" ? -1 : 0;
          p = inside.reduce((a: P, b: P): P => ((sign === 0 ? Math.abs(b[axis]) > Math.abs(a[axis]) : sign * b[axis] > sign * a[axis]) ? b : a));
        }
        found[k] = p;
        tangent[k] = axis === 0 ? [0, p[0] > 0 ? 1 : -1] : [p[1] > 0 ? -1 : 1, 0];
        if (anchor.mid === true) values.push(p[0]);
        else values.push(p[0], p[1]);
      }
    });
    layout.anchors.forEach((anchor: IAnchor, k: number): void => {
      if (anchor.kind !== "m" && anchor.kind !== "i") return;
      const p0: P = found[(k + K - 1) % K]!;
      const p2: P = found[(k + 1) % K]!;
      if (anchor.kind === "m") {
        const corner: P = meet(p0, tangent[(k + K - 1) % K]!, p2, tangent[(k + 1) % K]!);
        const f: number = crossing(points, [(p0[0] + p2[0]) / 2, (p0[1] + p2[1]) / 2], corner);
        values[at[k]!] = f;
        found[k] = [(p0[0] + p2[0]) / 2 + f * (corner[0] - (p0[0] + p2[0]) / 2), (p0[1] + p2[1]) / 2 + f * (corner[1] - (p0[1] + p2[1]) / 2)];
        tangent[k] = [p2[0] - p0[0], p2[1] - p0[1]];
        return;
      }
      const t: number = crossing(points, p0, p2);
      found[k] = [p0[0] + t * (p2[0] - p0[0]), p0[1] + t * (p2[1] - p0[1])];

      // An S-shaped stretch turns from its end tangent through its chord's direction and past it before turning back (a symmetric cubic S crosses its chord at one and a half times the chord's slope), so the seed turns the chord by half the angle from the end tangent to the chord.
      const end: number = Math.atan2(tangent[(k + K - 1) % K]![1], tangent[(k + K - 1) % K]![0]);
      const chordAngle: number = Math.atan2(p2[1] - p0[1], p2[0] - p0[0]);
      const turn: number = Math.atan2(Math.sin(chordAngle - end), Math.cos(chordAngle - end));
      values[at[k]!] = t;
      values[at[k]! + 1] = turn / 2;
      tangent[k] = [Math.cos(chordAngle + turn / 2), Math.sin(chordAngle + turn / 2)];
    });
    const arcs: number = layout.mirror ? K - 1 : K;
    for (let k: number = 0; k < arcs; ++k) {
      const p0: P = found[k]!;
      const p2: P = found[(k + 1) % K]!;
      const corner: P = meet(p0, tangent[k]!, p2, tangent[(k + 1) % K]!);
      values.push(crossing(points, [(p0[0] + p2[0]) / 2, (p0[1] + p2[1]) / 2], corner));
    }
    return values;
  }

  /** Confine a share to the model's bounds. */
  function clamp(share: number): number {
    return Math.min(1 - EDGE, Math.max(EDGE, share));
  }

  /** Meeting point of two tangent lines. */
  function meet(p0: P, t0: P, p2: P, t2: P): P {
    const den: number = t0[0] * t2[1] - t0[1] * t2[0];
    if (den === 0) return [(p0[0] + p2[0]) / 2, (p0[1] + p2[1]) / 2];
    const a: number = ((p2[0] - p0[0]) * t2[1] - (p2[1] - p0[1]) * t2[0]) / den;
    return [p0[0] + a * t0[0], p0[1] + a * t0[1]];
  }

  /** Share of the segment from `from` to `to` where the polygon first crosses it; one half when it does not. */
  function crossing(points: readonly P[], from: P, to: P): number {
    const dir: P = [to[0] - from[0], to[1] - from[1]];
    let best: number = Infinity;
    for (let i: number = 0; i < points.length; ++i) {
      const s: P = points[i]!;
      const e: P = points[(i + 1) % points.length]!;
      const edge: P = [e[0] - s[0], e[1] - s[1]];
      const div: number = dir[0] * edge[1] - dir[1] * edge[0];
      if (div === 0) continue;
      const delta: P = [s[0] - from[0], s[1] - from[1]];
      const share: number = (delta[0] * edge[1] - delta[1] * edge[0]) / div;
      const along: number = (delta[0] * dir[1] - delta[1] * dir[0]) / div;
      if (share > 0.05 && share < 0.95 && along >= 0 && along <= 1 && share < best) best = share;
    }
    return Number.isFinite(best) ? best : 0.5;
  }
}
