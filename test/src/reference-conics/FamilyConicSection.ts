import type { AutoMovieViewChain as Q } from "@automovie/engine";
import { AutoMovieHumanConicSection as S } from "@automovie/human";
import { FamilyConicExcursion as X } from "./FamilyConicExcursion";

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

  /**
   * The limb layout of the given median depth with a groove after each listed anchor: two inflections and the groove's own median between
   * them, `[i, m, i]`, the inflections a level deeper than every median and the groove's median a level deeper again, so each inflection
   * stands on the chord of the anchors round it and the groove's floor on the triangle of its two inflections. Across a family the
   * inflections' shares and turns are fields like every other (natural cubics on the family's knots), so each groove's two inflection lines
   * run along the stations as smooth curves, the way an aircraft's lofting draws a concavity with one more control line.
   *
   * @param depth The limb's median depth.
   * @param after Indices into `limb(depth).anchors` after which a groove stands, each at most once.
   */
  export function inflected(depth: number, after: readonly number[]): ILayout {
    const base: ILayout = limb(depth);
    return {
      mirror: false,
      anchors: base.anchors.flatMap((anchor: IAnchor, k: number): IAnchor[] =>
        after.includes(k) ? [anchor, { kind: "i", level: depth + 1 }, { kind: "m", level: depth + 2 }, { kind: "i", level: depth + 1 }] : [anchor],
      ),
    };
  }

  /**
   * A layout whose anchors stand on the part's named feature lines: after each listed anchor of `base`, the given feature anchors (`f`), each
   * a point with its own tangent whose numbers are fields along the stations, so every feature line (a tip's ridge, a wing's top, a groove's
   * floor and the inflections beside it) is a smooth longitudinal control curve, as an aircraft's lofting draws them. A groove is three of
   * them, an inflection, the concave floor and an inflection, each seeded on its own section in its phase window (`feature`); where the
   * groove fades the three lie on a smooth stretch, which no `i` anchor allows, since an `i` forces an S on every section.
   *
   * @param base The layout the features go into.
   * @param features After which anchor of `base` each run of feature anchors stands.
   */
  export function featured(base: ILayout, features: readonly { after: number; anchors: IAnchor[] }[]): ILayout {
    return {
      mirror: base.mirror,
      anchors: base.anchors.flatMap((anchor: IAnchor, k: number): IAnchor[] => [anchor, ...features.filter((f): boolean => f.after === k).flatMap((f): IAnchor[] => f.anchors)]),
    };
  }
  /** Unit of every field of a layout. */
  export const units: (layout: ILayout) => Unit[] = S.units;

  /** Resolve a field vector into its closed chain. */
  export const resolve: (values: readonly number[], layout: ILayout) => IChain = S.resolve;

  /** Build the engine's native conic chain from a field vector. */
  export const chain: (values: readonly number[], layout: ILayout) => Q.ISection = S.chain;

  /** The field vector with the two arcs at an anchor given the shoulders that make the curvature continuous there. */
  export const continuous: (values: readonly number[], layout: ILayout, k: number) => number[] = S.continuous;

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

  /** Arclength either side over which a feature anchor's turning is read, mm, and the least turning, radians, that counts as a feature. */
  const FEATURE_SPAN: number = 1.5;
  const FEATURE_LEAST: number = 0.05;

  /** Step of the headings a feature's seed tangent is searched in where its reading does not make both its arcs conics, radians. */
  const FEATURE_STEP: number = 0.01;

  /**
   * Where a feature anchor (`f`) stands on an observed counter-clockwise polygon, between the polygon's points `from` and `to` (its
   * resolved neighbours, in order): within the share `window` of the arclength between them, the point of largest convex turning
   * (`convex`), of largest concave turning (`concave`), or the sign change of turning nearest the window's middle (`inflection`,
   * `FamilyConicExcursion.inflections`), turning read over `FEATURE_SPAN` mm either side; without a reading, the window's middle, so a
   * feature that fades away seeds on its smooth stretch. Its tangent is the direction across the same span.
   */
  function feature(points: readonly P[], anchor: IAnchor, from: number, to: number): { index: number; heading: number } {
    const n: number = points.length;
    const run: number[] = [];
    for (let i: number = from; ; i = (i + 1) % n) {
      run.push(i);
      if (i === to || run.length > n) break;
    }
    const along: number[] = [0];
    for (let k: number = 1; k < run.length; ++k) along.push(along[k - 1]! + Math.hypot(points[run[k]!]![0] - points[run[k - 1]!]![0], points[run[k]!]![1] - points[run[k - 1]!]![1]));
    const total: number = along.at(-1)! || 1;
    const window: [number, number] = anchor.window ?? [0.1, 0.9];
    const inside: number[] = run.filter((_: number, k: number): boolean => along[k]! / total >= window[0] && along[k]! / total <= window[1]);
    const middle: number = ((window[0] + window[1]) / 2) * total;
    const nearest = (candidates: number[]): number => candidates.reduce((a: number, b: number): number => (Math.abs(along[run.indexOf(b)]! - middle) < Math.abs(along[run.indexOf(a)]! - middle) ? b : a));
    const step = (i: number, direction: 1 | -1): number => {
      let k: number = i;
      let length: number = 0;
      while (length < FEATURE_SPAN) {
        const next: number = (k + direction + n) % n;
        length += Math.hypot(points[next]![0] - points[k]![0], points[next]![1] - points[k]![1]);
        k = next;
        if (k === i) break;
      }
      return k;
    };
    const turn = (i: number): number => {
      const a: P = points[step(i, -1)]!;
      const p: P = points[i]!;
      const b: P = points[step(i, 1)]!;
      const d: number = Math.atan2(b[1] - p[1], b[0] - p[0]) - Math.atan2(p[1] - a[1], p[0] - a[0]);
      return Math.atan2(Math.sin(d), Math.cos(d));
    };
    const heading = (i: number): number => {
      const a: P = points[step(i, -1)]!;
      const b: P = points[step(i, 1)]!;
      return Math.atan2(b[1] - a[1], b[0] - a[0]);
    };
    if (inside.length === 0) {
      const index: number = nearest(run);
      return { index, heading: heading(index) };
    }
    let index: number;
    if (anchor.feature === "inflection") {
      const bends: number[] = X.inflections(points).filter((i: number): boolean => inside.includes(i));
      index = nearest(bends.length === 0 ? inside : bends);
    } else {
      const sign: number = anchor.feature === "concave" ? -1 : 1;
      const best: number = inside.reduce((a: number, b: number): number => (sign * turn(b) > sign * turn(a) ? b : a));
      index = sign * turn(best) > FEATURE_LEAST ? best : nearest(inside);
    }
    return { index, heading: heading(index) };
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
      else if (anchor.kind === "f") values.push(0, 0, 0);
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
    // Feature anchors in order, each between its resolved neighbours on the polygon: the anchor before it (an extreme or the feature just
    // placed) and the next extreme, so a run of features stands in order along the stretch between two extremes.
    const closest = (q: P): number => points.reduce((best: number, p: P, i: number): number => (Math.hypot(p[0] - q[0], p[1] - q[1]) < Math.hypot(points[best]![0] - q[0], points[best]![1] - q[1]) ? i : best), 0);
    layout.anchors.forEach((anchor: IAnchor, k: number): void => {
      if (anchor.kind !== "f") return;
      let before: number = (k + K - 1) % K;
      while (found[before] === null) before = (before + K - 1) % K;
      let after: number = (k + 1) % K;
      while (found[after] === null || layout.anchors[after]!.kind === "f") after = (after + 1) % K;
      const from: number = (closest(found[before]!) + 1) % points.length;
      const reading: { index: number; heading: number } = feature(points, anchor, from, closest(found[after]!));
      const p: P = points[reading.index]!;
      found[k] = p;
      tangent[k] = [Math.cos(reading.heading), Math.sin(reading.heading)];
      values[at[k]!] = p[0];
      values[at[k]! + 1] = p[1];
      values[at[k]! + 2] = reading.heading;
    });    // A conic arc's tangent lines meet ahead of its start and behind its end, on one side of its chord. Where a feature fades, its reading
    // is a straight stretch whose tangent need not make both its arcs conics; each feature's tangent is then the heading nearest its
    // reading, in steps of `FEATURE_STEP`, with which the arcs to the anchors before and after it are both conics, in order round the
    // resolved anchors, so the seed is a chain of conics.
    const resolved: number[] = layout.anchors.map((_: IAnchor, k: number): number => k).filter((k: number): boolean => found[k] !== null);
    const conic = (a: number, tA: P, b: number, tB: P): boolean => {
      const c: P = [found[b]![0] - found[a]![0], found[b]![1] - found[a]![1]];
      const side = (d: P): number => c[0] * d[1] - c[1] * d[0];
      const det: number = tA[0] * tB[1] - tA[1] * tB[0];
      if (det === 0 || side(tA) * side(tB) >= 0) return false;
      const s: number = (c[0] * tB[1] - c[1] * tB[0]) / det;
      const q: number = (tA[0] * c[1] - tA[1] * c[0]) / det;
      return s > 0 && q > 0;
    };
    resolved.forEach((k: number, r: number): void => {
      if (layout.anchors[k]!.kind !== "f") return;
      const before: number = resolved[(r + resolved.length - 1) % resolved.length]!;
      const after: number = resolved[(r + 1) % resolved.length]!;
      const reading: number = values[at[k]! + 2]!;
      for (let step: number = 0; step <= Math.PI / FEATURE_STEP; ++step) {
        const tried: number[] = step === 0 ? [reading] : [reading + step * FEATURE_STEP, reading - step * FEATURE_STEP];
        const fit: number | undefined = tried.find((h: number): boolean => {
          const d: P = [Math.cos(h), Math.sin(h)];
          return conic(before, tangent[before]!, k, d) && conic(k, d, after, tangent[after]!);
        });
        if (fit === undefined) continue;
        tangent[k] = [Math.cos(fit), Math.sin(fit)];
        values[at[k]! + 2] = fit;
        return;
      }
    });    for (const k of dependents(layout)) {
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
      const chordAngle: number = Math.atan2(p2[1] - p0[1], p2[0] - p0[0]);

      // Where the section's own turning changes sign between the two neighbours (the skin's inflection, read by `inflections`), the one
      // nearest the chord's crossing, seeds the anchor: its share is its projection on the chord, its turn its tangent's angle to the chord.
      const reading: { t: number; d: number } | null = inflection(points, p0, p2, crossing(points, p0, p2));
      if (reading !== null) {
        found[k] = [p0[0] + reading.t * (p2[0] - p0[0]), p0[1] + reading.t * (p2[1] - p0[1])];
        values[at[k]!] = reading.t;
        values[at[k]! + 1] = reading.d;
        tangent[k] = [Math.cos(chordAngle + reading.d), Math.sin(chordAngle + reading.d)];
        continue;
      }
      const t: number = crossing(points, p0, p2);
      found[k] = [p0[0] + t * (p2[0] - p0[0]), p0[1] + t * (p2[1] - p0[1])];

      // An S-shaped stretch turns from its end tangent through its chord's direction and past it before turning back (a symmetric cubic S crosses its chord at one and a half times the chord's slope), so the seed turns the chord by half the angle from the end tangent to the chord.
      const end: number = Math.atan2(tangent[before]![1], tangent[before]![0]);
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

  /**
   * The skin's inflection between two anchors as an `i` anchor's share and turn: of the points where the polygon's turning changes sign
   * (`FamilyConicExcursion.inflections`) that project onto the chord from `p0` to `p2` strictly inside it, the one nearest the share `near`;
   * its turn is its tangent's angle to the chord, read over its neighbours. Null when no sign change projects inside the chord.
   */
  function inflection(points: readonly P[], p0: P, p2: P, near: number): { t: number; d: number } | null {
    const chord: P = [p2[0] - p0[0], p2[1] - p0[1]];
    const length2: number = chord[0] * chord[0] + chord[1] * chord[1];
    if (!(length2 > 0)) return null;
    let best: { t: number; d: number } | null = null;
    const n: number = points.length;
    for (const i of X.inflections(points)) {
      const p: P = points[i]!;
      const t: number = ((p[0] - p0[0]) * chord[0] + (p[1] - p0[1]) * chord[1]) / length2;
      if (!(t > 0.08 && t < 0.92)) continue;
      // Only a point near the chord: an inflection elsewhere round the section belongs to another groove.
      const off: number = Math.abs((p[0] - p0[0]) * chord[1] - (p[1] - p0[1]) * chord[0]) / Math.sqrt(length2);
      if (off > 0.5 * Math.sqrt(length2)) continue;
      const a: P = points[(i + n - 2) % n]!;
      const b: P = points[(i + 2) % n]!;
      let d: number = Math.atan2(b[1] - a[1], b[0] - a[0]) - Math.atan2(chord[1], chord[0]);
      d = Math.atan2(Math.sin(d), Math.cos(d));
      if (best === null || Math.abs(t - near) < Math.abs(best.t - near)) best = { t, d };
    }
    return best;
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
