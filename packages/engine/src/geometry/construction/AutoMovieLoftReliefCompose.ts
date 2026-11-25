import type {
  AutoMovieVector3Tuple,
  IAutoMovieLoftRelief,
  IAutoMovieLoftSurfaceJet,
} from "@automovie/interface";

import { AutoMovieConicFieldJet } from "./AutoMovieConicFieldJet";
import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";
import { AutoMovieLoftRelief } from "./AutoMovieLoftRelief";
import { AutoMovieSolidVector as Vec } from "./AutoMovieSolidVector";

/** A fresh mutable world vector, in mm per the named derivative order. */
type V = AutoMovieVector3Tuple;

/**
 * Shared relief addition for native originals and existing chain consumers.
 * Each operation preserves the original consumer's arithmetic order. Height,
 * shift and phase-turn evaluation remain owned by AutoMovieLoftRelief.
 */
export namespace AutoMovieLoftReliefCompose {
  /** Read the unchanged height nets and exact graphs in source order. */
  export function sources({
    reliefs,
    originalGraphs,
  }: {
    reliefs?: IAutoMovieLoftRelief[];
    originalGraphs?: IAutoMovieLoftRelief.IGraph[];
  }): readonly IAutoMovieLoftRelief.ISource[] {
    if (
      originalGraphs?.some(
        ({ stations: [lo, hi] }) =>
          !(Number.isFinite(lo) && Number.isFinite(hi) && lo < hi),
      ) === true
    )
      throw new AutoMovieLoftAdmissionError(
        "An original graph has no finite increasing station support.",
      );
    return originalGraphs === undefined || originalGraphs.length === 0
      ? (reliefs ?? [])
      : [...(reliefs ?? []), ...originalGraphs];
  }

  /** Strict exclusion establishes an open neighborhood with no graph. */
  export function excludesStation(
    { stations: [lo, hi] }: IAutoMovieLoftRelief.IGraph,
    s: number,
  ): boolean {
    return (
      Number.isFinite(lo) &&
      Number.isFinite(hi) &&
      lo < hi &&
      (s < lo || s > hi)
    );
  }

  /**
   * Add relief values to a fresh Point0; collapsed selects the existing pole
   * refusal.
   */
  export function point(
    p: V,
    reliefs: readonly IAutoMovieLoftRelief.ISource[],
    s: number,
    t: number,
    collapsed: boolean = false,
  ): void {
    for (const relief of reliefs) {
      if ("target" in relief) {
        if (excludesStation(relief, s)) continue;
        const weight = relief.weight(s, t);
        if (weight === 0) continue;
        if (collapsed) admitPole([weight], true);
        const height = (relief.target - Vec.dot(p, relief.axis)) * weight;
        for (let k = 0; k < 3; k++) p[k]! += height * relief.axis[k]!;
        continue;
      }
      const h: [number, number, number] = AutoMovieLoftRelief.height(
        relief,
        s,
        t,
      );
      admitPole(h, collapsed);
      const d: number = h[0];
      if (d === 0) continue;
      const e: V = AutoMovieLoftRelief.direction(relief, t)[0];
      for (let k: number = 0; k < 3; k++) p[k]! += d * e[k]!;
    }
  }

  /** Add relief value/phase data to fresh p/t vectors without station2. */
  export function phase(
    value: { p: V; t: V },
    reliefs: readonly IAutoMovieLoftRelief.ISource[],
    s: number,
    t: number,
    collapsed: boolean = false,
  ): void {
    for (const relief of reliefs) {
      if ("target" in relief) {
        if (excludesStation(relief, s)) continue;
        const weight = relief.phase(s, t);
        if (weight === null) continue;
        admitPole(weight, collapsed);
        const offset = relief.target - Vec.dot(value.p, relief.axis);
        const first =
          offset * weight[1] - Vec.dot(value.t, relief.axis) * weight[0];
        for (let k = 0; k < 3; k++) {
          value.p[k]! += offset * weight[0] * relief.axis[k]!;
          value.t[k]! += first * relief.axis[k]!;
        }
        continue;
      }
      const h: [number, number, number] = AutoMovieLoftRelief.height(
        relief,
        s,
        t,
      );
      admitPole(h, collapsed);
      const [e, e1]: [V, V, V] = AutoMovieLoftRelief.direction(relief, t);
      for (let k: number = 0; k < 3; k++) {
        value.p[k]! += h[0] * e[k]!;
        value.t[k]! += h[2] * e[k]! + h[0] * e1[k]!;
      }
    }
  }

  /**
   * Add full relief physical2 to a fresh world jet in station mm and phase
   * radians.
   */
  export function jet(
    value: IAutoMovieLoftSurfaceJet,
    reliefs: readonly IAutoMovieLoftRelief.ISource[],
    s: number,
    t: number,
  ): void {
    for (const relief of reliefs) {
      if ("target" in relief) {
        if (excludesStation(relief, s)) continue;
        const weight = relief.jet(s, t);
        if (weight === null) continue;
        const offset = AutoMovieConicFieldJet.AD.multiply(weight, [
          relief.target - Vec.dot(value.p, relief.axis),
          -Vec.dot(value.s, relief.axis),
          -Vec.dot(value.t, relief.axis),
          -Vec.dot(value.ss, relief.axis),
          -Vec.dot(value.st, relief.axis),
          -Vec.dot(value.tt, relief.axis),
        ]);
        value.p = sum(value.p, scale(relief.axis, offset[0]));
        value.s = sum(value.s, scale(relief.axis, offset[1]));
        value.t = sum(value.t, scale(relief.axis, offset[2]));
        value.ss = sum(value.ss, scale(relief.axis, offset[3]));
        value.st = sum(value.st, scale(relief.axis, offset[4]));
        value.tt = sum(value.tt, scale(relief.axis, offset[5]));
        continue;
      }
      const h: number[] = AutoMovieLoftRelief.jet(relief, s, t);
      if (h.every((x: number): boolean => x === 0)) continue;
      const [e, e1, e2]: [V, V, V] = AutoMovieLoftRelief.direction(relief, t);
      value.p = sum(value.p, scale(e, h[0]!));
      value.s = sum(value.s, scale(e, h[1]!));
      value.t = sum(sum(value.t, scale(e, h[2]!)), scale(e1, h[0]!));
      value.ss = sum(value.ss, scale(e, h[3]!));
      value.st = sum(sum(value.st, scale(e, h[4]!)), scale(e1, h[1]!));
      value.tt = sum(
        sum(sum(value.tt, scale(e, h[5]!)), scale(e1, 2 * h[2]!)),
        scale(e2, h[0]!),
      );
    }
  }
}

/**
 * A retained collapsed pole requires every feature's value/first orders to
 * vanish.
 */
function admitPole(height: readonly number[], collapsed: boolean): void {
  if (collapsed && height.some((x: number): boolean => x !== 0))
    throw new AutoMovieLoftAdmissionError(
      "A deformed pole has no retained collapsed cap value.",
    );
}

/** Preserve LoftJet's left-associated zero-initialized vector sum exactly. */
function sum(...vectors: V[]): V {
  const out: V = [0, 0, 0];
  for (const vector of vectors)
    for (let k: number = 0; k < 3; k++) out[k] += vector[k]!;
  return out;
}

/** The original component-wise scalar multiplication, without regrouping. */
function scale(vector: readonly number[], factor: number): V {
  return [vector[0]! * factor, vector[1]! * factor, vector[2]! * factor];
}
