import type { AutoMovieViewChain as Q } from "@automovie/engine";
import { AutoMovieHumanConicSection as S } from "@automovie/human";

/**
 * The offline side of `AutoMovieHumanConicSection`: reading a starting field
 * vector from an observed polygon and carrying a limb section one median
 * level deeper. The model itself (layouts, units, resolution into the
 * engine's chain) is the Human package's, re-exported here so the fit and
 * the generated figure cannot drift apart.
 */
export namespace FamilyConicSection {
  /** A planar chart point, millimetres. */
  export type P = S.P;

  /** One anchor of a layout. */
  export type IAnchor = S.IAnchor;

  /** The anchors of a section family. */
  export type ILayout = S.ILayout;

  /** What a field measures. */
  export type Unit = S.Unit;

  /** The closed chain of a field vector. */
  export type IChain = S.IChain;

  /** The limb layout of the given median depth. */
  export const limb: (depth: number) => ILayout = S.limb;

  /** The bilateral layout of the given median depth. */
  export const bilateral: (depth: number) => ILayout = S.bilateral;

  /** Unit of every field of a layout. */
  export const units: (layout: ILayout) => Unit[] = S.units;

  /** Resolve a field vector into its closed chain. */
  export const resolve: (values: readonly number[], layout: ILayout) => IChain = S.resolve;

  /** Build the engine's native conic chain from a field vector. */
  export const chain: (values: readonly number[], layout: ILayout) => Q.ISection = S.chain;

  const offsets: typeof S.offsets = S.offsets;
  const dependents: typeof S.dependents = S.dependents;
  const neighbours: typeof S.neighbours = S.neighbours;
  const clamp: typeof S.clamp = S.clamp;
  const meet: typeof S.meet = S.meet;

  /**
   * Carry a limb section one median level deeper without changing its curve:
   * a conic of middle weight `w = rho / (1 - rho)` cut at its median point
   * leaves two conics of middle weight `sqrt((1 + w) / 2)` (the rational de
   * Casteljau step at `t = 1/2` with the end weights renormalised to one;
   * Farin, "Curves and Surfaces for CAGD", rational subdivision), and the
   * median point stands at the share `rho`.
   *
   * @param values A field vector of `limb(depth)`.
   * @param depth That depth.
   * @returns The same curve as a field vector of `limb(depth + 1)`.
   */
  export function refine(values: readonly number[], depth: number): number[] {
    const from: ILayout = limb(depth);
    const { at, shoulders }: { at: number[]; shoulders: number } = offsets(from);
    const out: number[] = [];
    const halves: number[] = [];
    from.anchors.forEach((anchor: IAnchor, k: number): void => {
      const rho: number = clamp(values[shoulders + k]!);
      const w: number = Math.sqrt((1 + rho / (1 - rho)) / 2);
      out.push(...values.slice(at[k]!, at[k]! + (anchor.kind === "m" ? 1 : 2)), rho);
      halves.push(w / (1 + w), w / (1 + w));
    });
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
    for (const k of dependents(layout)) {
      const [before, after]: [number, number] = neighbours(k, found);
      const p0: P = found[before]!;
      const p2: P = found[after]!;
      if (layout.anchors[k]!.kind === "m") {
        const corner: P = meet(p0, tangent[before]!, p2, tangent[after]!);
        const middle: P = [(p0[0] + p2[0]) / 2, (p0[1] + p2[1]) / 2];
        const f: number = crossing(points, middle, corner);
        values[at[k]!] = f;
        found[k] = [middle[0] + f * (corner[0] - middle[0]), middle[1] + f * (corner[1] - middle[1])];
        tangent[k] = [p2[0] - p0[0], p2[1] - p0[1]];
        continue;
      }
      const t: number = crossing(points, p0, p2);
      found[k] = [p0[0] + t * (p2[0] - p0[0]), p0[1] + t * (p2[1] - p0[1])];

      // An S-shaped stretch turns from its end tangent through its chord's direction and past it before turning back (a symmetric cubic S crosses its chord at one and a half times the chord's slope), so the seed turns the chord by half the angle from the end tangent to the chord.
      const end: number = Math.atan2(tangent[before]![1], tangent[before]![0]);
      const chordAngle: number = Math.atan2(p2[1] - p0[1], p2[0] - p0[0]);
      const turn: number = Math.atan2(Math.sin(chordAngle - end), Math.cos(chordAngle - end));
      values[at[k]!] = t;
      values[at[k]! + 1] = turn / 2;
      tangent[k] = [Math.cos(chordAngle + turn / 2), Math.sin(chordAngle + turn / 2)];
    }
    const arcs: number = layout.mirror ? K - 1 : K;
    for (let k: number = 0; k < arcs; ++k) {
      const p0: P = found[k]!;
      const p2: P = found[(k + 1) % K]!;
      const corner: P = meet(p0, tangent[k]!, p2, tangent[(k + 1) % K]!);
      values.push(crossing(points, [(p0[0] + p2[0]) / 2, (p0[1] + p2[1]) / 2], corner));
    }
    return values;
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
