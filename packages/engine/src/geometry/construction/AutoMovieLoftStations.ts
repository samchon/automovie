import { AutoMovieLoftChain } from "./AutoMovieLoftChain";
import type { IAutoMovieLoftChain } from "./IAutoMovieLoftChain";

/**
 * Tessellation stations of a chain: where a face's grid rings stand.
 *
 * Every principal layer inside the range is a station, since it is a shape event. Each remaining interval is split at its midpoint while the section there departs from the straight band between the interval's end sections by more than the chord tolerance at any probe phase, and both halves are examined the same way. That departure is the error a flat band of triangles makes there, so curved stretches refine and straight ones stay coarse; `depth` bounds the recursion, so a pathological interval yields an explicit coarse band instead of unbounded work.
 */
export namespace AutoMovieLoftStations {
  /** Probe phases of the band test, enough to resolve a section of the orders the view loft emits. */
  export const PROBES: number = 48;

  /**
   * Stations between two stations by recursive bisection.
   *
   * @param chain The chain.
   * @param from First station, mm.
   * @param to Last station, mm.
   * @param tolerance Largest departure of a band from its sections, mm.
   * @param depth Largest bisection depth.
   * @returns Increasing stations including both ends.
   */
  export function bisect(chain: IAutoMovieLoftChain, from: number, to: number, tolerance: number, depth: number = 8): number[] {
    const probes: number[] = Array.from({ length: PROBES }, (_: unknown, i: number): number => (2 * Math.PI * i) / PROBES);
    const marks: number[] = [from, ...chain.layers.map((l: IAutoMovieLoftChain.ILayer): number => l.y).filter((y: number): boolean => y > from && y < to), to];
    const out: number[] = [from];
    const at = (s: number): Ring => AutoMovieLoftChain.ring(chain, s, probes);
    const split = (a: number, b: number, level: number, ra: Ring, rb: Ring): void => {
      if (level < depth) {
        const m: number = (a + b) / 2;
        const rm: Ring = at(m);
        let error: number = 0;
        rm.forEach((p: [number, number, number], i: number): void => {
          error = Math.max(error, Math.hypot(p[0] - (ra[i]![0] + rb[i]![0]) / 2, p[1] - (ra[i]![1] + rb[i]![1]) / 2, p[2] - (ra[i]![2] + rb[i]![2]) / 2));
        });
        if (error > tolerance) {
          split(a, m, level + 1, ra, rm);
          split(m, b, level + 1, rm, rb);
          return;
        }
      }
      out.push(b);
    };
    let last: Ring = at(marks[0]!);
    for (let i: number = 1; i < marks.length; i++) {
      const next: Ring = at(marks[i]!);
      split(marks[i - 1]!, marks[i]!, 0, last, next);
      last = next;
    }
    return out;
  }
}

/** A section's points at the probe phases, mm. */
type Ring = [number, number, number][];
