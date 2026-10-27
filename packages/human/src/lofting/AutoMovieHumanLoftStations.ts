import { AutoMovieHumanLoftChain } from "./AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "./IAutoMovieHumanLoftChain";

/**
 * Tessellation stations of a chain: where its rings are generated.
 *
 * Every principal layer inside the range is always a station, since it is a
 * shape event. Each remaining interval is split at its midpoint while the
 * section at the midpoint deviates from the straight chord between its two
 * end sections by more than `tolerance` mm at any probe phase; both halves
 * are then examined the same way. The chord deviation is the physical
 * error a flat band of triangles would make there, so the rule refines
 * curved stretches and leaves straight ones coarse. `depth` bounds the
 * recursion, so a pathological interval yields an explicit coarse band
 * instead of unbounded work.
 */
export namespace AutoMovieHumanLoftStations {
  /**
   * Stations between `from` and `to` by recursive bisection.
   *
   * @param chain Chain to tessellate.
   * @param from First station.
   * @param to Last station.
   * @param tolerance Largest chord deviation of a band, mm.
   * @param depth Largest bisection depth.
   * @returns Increasing stations including both ends.
   */
  export function bisect(
    chain: IAutoMovieHumanLoftChain,
    from: number,
    to: number,
    tolerance: number,
    depth: number = 8,
  ): number[] {
    // Probe phases for the chord test; 48 resolve every harmonic up to the
    // orders used by the body chains.
    const probes: number[] = Array.from(
      { length: 48 },
      (_: unknown, i: number): number => (2 * Math.PI * i) / 48,
    );

    // Principal layers strictly inside the range split it unconditionally.
    const marks: number[] = [
      from,
      ...chain.layers
        .map((l: IAutoMovieHumanLoftChain.ILayer): number => l.y)
        .filter((y: number): boolean => y > from && y < to),
      to,
    ];

    const out: number[] = [from];
    const split = (a: number, b: number, level: number): void => {
      const m: number = (a + b) / 2;

      if (level < depth) {
        const ra: [number, number, number][] = AutoMovieHumanLoftChain.ring(chain, a, probes);
        const rb: [number, number, number][] = AutoMovieHumanLoftChain.ring(chain, b, probes);
        const rm: [number, number, number][] = AutoMovieHumanLoftChain.ring(chain, m, probes);

        // Largest distance between the midpoint section and the average of
        // its end sections, i.e. the flat band's sagitta. For horizontal
        // layers the height component of this difference is zero.
        let error: number = 0;
        rm.forEach((p: [number, number, number], i: number): void => {
          error = Math.max(
            error,
            Math.hypot(
              p[0] - (ra[i]![0] + rb[i]![0]) / 2,
              p[1] - (ra[i]![1] + rb[i]![1]) / 2,
              p[2] - (ra[i]![2] + rb[i]![2]) / 2,
            ),
          );
        });

        if (error > tolerance) {
          split(a, m, level + 1);
          split(m, b, level + 1);
          return;
        }
      }
      out.push(b);
    };

    for (let i: number = 1; i < marks.length; i++)
      split(marks[i - 1]!, marks[i]!, 0);
    return out;
  }
}
