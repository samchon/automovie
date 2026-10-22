import { AutoMovieHumanHarmonicCurve } from "./AutoMovieHumanHarmonicCurve";
import type { AutoMovieHumanLoftParameter } from "./AutoMovieHumanLoftParameter";

/**
 * Evaluation of one tube of the body surface: a family of horizontal
 * harmonic sections indexed by world height y.
 *
 * ## Representation
 *
 * A chain stores only its **principal layers** ({@link IAutoMovieHumanLoftChain}).
 * Each layer holds, at height `y` (mm), the harmonic section coefficients `c`
 * (see {@link AutoMovieHumanHarmonicCurve}) and their height derivative
 * `m = dc/dy` (mm per mm). Principal layers sit where the observed shape
 * changes character: silhouette extrema, volume extrema, feature onsets and
 * topology events. The observation fitter chooses them by recursive
 * bisection: it starts from the chain ends, interpolates the interval and
 * inserts a principal layer only where the interpolated section misses the
 * recovered section by more than its physical tolerance.
 *
 * ## Intermediate sections
 *
 * Between adjacent principal layers `i` and `i+1` every coefficient follows
 * the cubic Hermite polynomial of its two end values and two end slopes:
 *
 * ```text
 * u    = (y - y_i) / H,   H = y_{i+1} - y_i
 * c(y) = h00(u) c_i + h10(u) H m_i + h01(u) c_{i+1} + h11(u) H m_{i+1}
 * ```
 *
 * The slope is multiplied by the interval width H because the Hermite basis
 * is written in the unit parameter u, and `dc/du = H dc/dy` by the chain
 * rule. Each layer has one slope shared by both of its intervals, so the
 * family is C1 in y across principal layers and analytic in phase.
 *
 * The constant terms `(x0(y), z0(y))` are the section centroids, so the
 * chain's central axis is the Hermite curve `(x0(y), y, z0(y))` of the same
 * function rather than a separate polyline.
 */
export namespace AutoMovieHumanLoftChain {
  /**
   * Section coefficients at height y by the Hermite rule above.
   *
   * Heights outside the chain are refused rather than extrapolated, because
   * a chain's polynomial carries no shape evidence beyond its end layers.
   */
  export function coefficients(
    chain: IAutoMovieHumanLoftChain,
    y: number,
  ): number[] {
    const layers: readonly IAutoMovieHumanLoftChain.ILayer[] = chain.layers;
    const bottom: number = layers[0]!.y;
    const top: number = layers[layers.length - 1]!.y;
    if (y < bottom - 1e-9 || y > top + 1e-9)
      throw new Error(`Height ${y} is outside chain ${chain.name}`);

    // Binary search for the interval [lo, hi] containing y; the last
    // interval also owns the top layer itself.
    let lo: number = 0;
    let hi: number = layers.length - 1;
    while (hi - lo > 1) {
      const mid: number = (lo + hi) >> 1;
      if (layers[mid]!.y <= y) lo = mid;
      else hi = mid;
    }

    const a: IAutoMovieHumanLoftChain.ILayer = layers[lo]!;
    const b: IAutoMovieHumanLoftChain.ILayer = layers[hi]!;
    const H: number = b.y - a.y;
    const u: number = Math.min(1, Math.max(0, (y - a.y) / H));

    // Cubic Hermite basis on the unit interval.
    const h00: number = 2 * u ** 3 - 3 * u ** 2 + 1;
    const h10: number = u ** 3 - 2 * u ** 2 + u;
    const h01: number = -2 * u ** 3 + 3 * u ** 2;
    const h11: number = u ** 3 - u ** 2;

    // Slopes are per mm of height; H converts them to the unit parameter.
    return a.coefficients.map(
      (c: number, k: number): number =>
        h00 * c +
        h10 * H * a.slopes[k]! +
        h01 * b.coefficients[k]! +
        h11 * H * b.slopes[k]!,
    );
  }

  /** Central-axis point `[x, z]` in mm at height y: the section centroid. */
  export function axis(
    chain: IAutoMovieHumanLoftChain,
    y: number,
  ): [number, number] {
    const c: number[] = coefficients(chain, y);
    return [c[0]!, c[AutoMovieHumanHarmonicCurve.width(chain.order)]!];
  }

  /**
   * Ring of world points `[x, y, z]` at height y and the given phases.
   *
   * @param chain Chain to evaluate.
   * @param y Height in mm within the chain.
   * @param phases Correspondence phases in radians.
   */
  export function ring(
    chain: IAutoMovieHumanLoftChain,
    y: number,
    phases: readonly number[],
  ): [number, number, number][] {
    const c: number[] = coefficients(chain, y);

    return phases.map((t: number): [number, number, number] => {
      const p: [number, number, number, number] =
        AutoMovieHumanHarmonicCurve.evaluate(c, chain.order, t);
      return [p[0], y, p[1]];
    });
  }

  /**
   * Tessellation heights between `from` and `to` by recursive bisection.
   *
   * Every principal layer inside the range is always a station, since it is
   * a shape event. Each remaining interval is split at its midpoint while the
   * Hermite section at the midpoint deviates from the straight chord between
   * its two end sections by more than `tolerance` mm at any probe phase; both
   * halves are then examined the same way. The chord deviation is the
   * physical error a flat band of triangles would make there, so the rule
   * refines curved stretches and leaves straight ones coarse. `depth` bounds
   * the recursion, so a pathological interval yields an explicit coarse band
   * instead of unbounded work.
   *
   * @returns Increasing heights including both ends.
   */
  export function stations(
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
        const ra: [number, number, number][] = ring(chain, a, probes);
        const rb: [number, number, number][] = ring(chain, b, probes);
        const rm: [number, number, number][] = ring(chain, m, probes);

        // Largest horizontal distance between the midpoint section and the
        // average of its end sections, i.e. the flat band's sagitta.
        let error: number = 0;
        rm.forEach((p: [number, number, number], i: number): void => {
          error = Math.max(
            error,
            Math.hypot(
              p[0] - (ra[i]![0] + rb[i]![0]) / 2,
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

/**
 * Principal-layer data of one chain, as published by the observation fitter
 * and consumed by {@link AutoMovieHumanLoftChain}.
 */
export interface IAutoMovieHumanLoftChain {
  /** Stable chain name used for part ids and diagnostics. */
  name: string;

  /** Highest harmonic K of every section in this chain. */
  order: number;

  /** Phase correspondence rule; see {@link AutoMovieHumanLoftParameter}. */
  rule: AutoMovieHumanLoftParameter.Rule;

  /**
   * Number of uniform phases of the chain's own rings.
   *
   * Chosen by the fitter from the chain's largest perimeter so vertices are a
   * few millimetres apart; a child switches from its inherited ring to this
   * phase set in its first band.
   */
  samples: number;

  /** Principal layers ordered by strictly increasing height, at least two. */
  layers: IAutoMovieHumanLoftChain.ILayer[];
}
export namespace IAutoMovieHumanLoftChain {
  /** One principal layer: a shape event of the chain. */
  export interface ILayer {
    /** World height of the layer in mm. */
    y: number;

    /** Harmonic section coefficients in mm, layout of {@link AutoMovieHumanHarmonicCurve}. */
    coefficients: number[];

    /** Height derivative of every coefficient in mm per mm, shared by both adjacent intervals. */
    slopes: number[];
  }
}
