import type {
  AutoMovieVector3Tuple,
  IAutoMovieLoftRelief,
  IAutoMovieLoftSurfaceJet,
} from "@automovie/interface";

import { AutoMovieEngineLoftAdmissionError } from "./AutoMovieEngineLoftAdmissionError";
import { AutoMovieEngineLoftRelief } from "./AutoMovieEngineLoftRelief";

/**
 * Shared relief addition for native originals and existing chain consumers.
 * Each operation preserves the original consumer's arithmetic order. Height,
 * shift and phase-turn evaluation remain owned by AutoMovieEngineLoftRelief.
 */
export namespace AutoMovieEngineLoftReliefCompose {
  /**
   * Add relief values to a fresh Point0; collapsed selects the existing pole
   * refusal.
   */
  export function point(
    p: V,
    reliefs: readonly IAutoMovieLoftRelief[],
    s: number,
    t: number,
    collapsed: boolean = false,
  ): void {
    for (const relief of reliefs) {
      const h: [number, number, number] = AutoMovieEngineLoftRelief.height(
        relief,
        s,
        t,
      );
      admitPole(h, collapsed);
      const d: number = h[0];
      if (d === 0) continue;
      const e: V = AutoMovieEngineLoftRelief.direction(relief, t)[0];
      for (let k: number = 0; k < 3; k++) p[k]! += d * e[k]!;
    }
  }

  /** Add relief value/phase data to fresh p/t vectors without station2. */
  export function phase(
    value: { p: V; t: V },
    reliefs: readonly IAutoMovieLoftRelief[],
    s: number,
    t: number,
    collapsed: boolean = false,
  ): void {
    for (const relief of reliefs) {
      const h: [number, number, number] = AutoMovieEngineLoftRelief.height(
        relief,
        s,
        t,
      );
      admitPole(h, collapsed);
      const [e, e1]: [V, V, V] = AutoMovieEngineLoftRelief.direction(relief, t);
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
    reliefs: readonly IAutoMovieLoftRelief[],
    s: number,
    t: number,
  ): void {
    for (const relief of reliefs) {
      const h: number[] = AutoMovieEngineLoftRelief.jet(relief, s, t);
      if (h.every((x: number): boolean => x === 0)) continue;
      const [e, e1, e2]: [V, V, V] = AutoMovieEngineLoftRelief.direction(relief, t);
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

/** A fresh mutable world vector, in mm per the named derivative order. */
type V = AutoMovieVector3Tuple;

/*
 * A retained collapsed pole requires every feature's value/first orders to
 * vanish.
 */
function admitPole(height: readonly number[], collapsed: boolean): void {
  if (collapsed && height.some((x: number): boolean => x !== 0))
    throw new AutoMovieEngineLoftAdmissionError(
      "A deformed pole has no retained collapsed cap value.",
    );
}

/*
 * Preserve LoftJet's left-associated zero-initialized vector sum exactly.
 */
function sum(...vectors: V[]): V {
  const out: V = [0, 0, 0];
  for (const vector of vectors)
    for (let k: number = 0; k < 3; k++) out[k] += vector[k]!;
  return out;
}

/*
 * The original component-wise scalar multiplication, without regrouping.
 */
function scale(vector: readonly number[], factor: number): V {
  return [vector[0]! * factor, vector[1]! * factor, vector[2]! * factor];
}
