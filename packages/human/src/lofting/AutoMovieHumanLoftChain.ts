import { AutoMovieHumanHarmonicCurve } from "./AutoMovieHumanHarmonicCurve";
import { AutoMovieHumanLoftFrame } from "./AutoMovieHumanLoftFrame";
import type { IAutoMovieHumanLoftChain } from "./IAutoMovieHumanLoftChain";

/**
 * Evaluation of one tube of the body surface: a family of harmonic sections
 * indexed by a station s along the chain.
 *
 * Each principal layer's section lies in its frame (see
 * {@link AutoMovieHumanLoftFrame}). Without a frame the section is horizontal
 * at world height s, which is how every chain recovered from the saved
 * height-sliced loft is stored; in this note "height" therefore means the
 * station of such a chain.
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
    return hermite(chain, y, false);
  }

  /**
   * Station derivative of the section coefficients at s, mm per mm.
   *
   * The derivative of the same Hermite rule; a region calibration that trims
   * a chain uses it to give the new end layer the slope of the original
   * function, so trimming changes no shape.
   */
  export function derivative(
    chain: IAutoMovieHumanLoftChain,
    s: number,
  ): number[] {
    return hermite(chain, s, true);
  }

  /**
   * Indices `[lo, hi]` of the principal interval containing station s.
   *
   * Stations outside the chain are refused. The last interval also owns the
   * top layer itself.
   */
  export function bracket(
    chain: IAutoMovieHumanLoftChain,
    s: number,
  ): [number, number] {
    const layers: readonly IAutoMovieHumanLoftChain.ILayer[] = chain.layers;
    const bottom: number = layers[0]!.y;
    const top: number = layers[layers.length - 1]!.y;
    if (s < bottom - 1e-9 || s > top + 1e-9)
      throw new Error(`Station ${s} is outside chain ${chain.name}`);

    // Binary search over the sorted layer stations.
    let lo: number = 0;
    let hi: number = layers.length - 1;
    while (hi - lo > 1) {
      const mid: number = (lo + hi) >> 1;
      if (layers[mid]!.y <= s) lo = mid;
      else hi = mid;
    }
    return [lo, hi];
  }

  /** Hermite coefficients (or their station derivative) at s. */
  function hermite(
    chain: IAutoMovieHumanLoftChain,
    y: number,
    differentiate: boolean,
  ): number[] {
    const layers: readonly IAutoMovieHumanLoftChain.ILayer[] = chain.layers;
    const [lo, hi] = bracket(chain, y);

    const a: IAutoMovieHumanLoftChain.ILayer = layers[lo]!;
    const b: IAutoMovieHumanLoftChain.ILayer = layers[hi]!;
    const H: number = b.y - a.y;
    const u: number = Math.min(1, Math.max(0, (y - a.y) / H));

    // Cubic Hermite basis on the unit interval, or its derivative divided by
    // H, which converts d/du back to d/ds.
    const h00: number = differentiate
      ? (6 * u ** 2 - 6 * u) / H
      : 2 * u ** 3 - 3 * u ** 2 + 1;
    const h10: number = differentiate
      ? (3 * u ** 2 - 4 * u + 1) / H
      : u ** 3 - 2 * u ** 2 + u;
    const h01: number = differentiate
      ? (-6 * u ** 2 + 6 * u) / H
      : -2 * u ** 3 + 3 * u ** 2;
    const h11: number = differentiate
      ? (3 * u ** 2 - 2 * u) / H
      : u ** 3 - u ** 2;

    // Slopes are per mm of height; H converts them to the unit parameter.
    return a.coefficients.map(
      (c: number, k: number): number =>
        h00 * c +
        h10 * H * a.slopes[k]! +
        h01 * b.coefficients[k]! +
        h11 * H * b.slopes[k]!,
    );
  }

  /**
   * Section plane at station s.
   *
   * Two unframed layers bound a horizontal interval and give the horizontal
   * frame at s exactly. Otherwise the frame interpolates the two layers'
   * frames, an unframed layer counting as horizontal at its station; origin
   * tangents are Catmull-Rom differences of the neighbouring origins, scaled
   * from per-station to per-unit-parameter by the interval width.
   */
  export function frame(
    chain: IAutoMovieHumanLoftChain,
    s: number,
  ): AutoMovieHumanLoftFrame.IFrame {
    const layers: readonly IAutoMovieHumanLoftChain.ILayer[] = chain.layers;
    const [lo, hi] = bracket(chain, s);
    const a: IAutoMovieHumanLoftChain.ILayer = layers[lo]!;
    const b: IAutoMovieHumanLoftChain.ILayer = layers[hi]!;
    if (a.frame === undefined && b.frame === undefined)
      return AutoMovieHumanLoftFrame.horizontal(s);

    const frameOf = (k: number): AutoMovieHumanLoftFrame.IFrame =>
      layers[k]!.frame ?? AutoMovieHumanLoftFrame.horizontal(layers[k]!.y);
    const H: number = b.y - a.y;

    // Catmull-Rom tangent at layer k, per unit parameter of this interval.
    const tangent = (k: number): [number, number, number] => {
      const p: number = Math.max(0, k - 1);
      const n: number = Math.min(layers.length - 1, k + 1);
      const op: [number, number, number] = frameOf(p).origin;
      const on: [number, number, number] = frameOf(n).origin;
      const span: number = layers[n]!.y - layers[p]!.y;
      return [0, 1, 2].map(
        (i: number): number => ((on[i]! - op[i]!) / span) * H,
      ) as [number, number, number];
    };

    return AutoMovieHumanLoftFrame.interpolate(
      frameOf(lo),
      frameOf(hi),
      tangent(lo),
      tangent(hi),
      Math.min(1, Math.max(0, (s - a.y) / H)),
    );
  }

  /** Central-axis point `[x, y, z]` in mm at station s: the section centroid. */
  export function axis(
    chain: IAutoMovieHumanLoftChain,
    s: number,
  ): [number, number, number] {
    const c: number[] = coefficients(chain, s);
    return AutoMovieHumanLoftFrame.place(
      frame(chain, s),
      c[0]!,
      c[AutoMovieHumanHarmonicCurve.width(chain.order)]!,
    );
  }

  /**
   * Planar section coordinates of world points in the frame at station s.
   *
   * Used to give inherited ring vertices phases by the chain's own rule.
   */
  export function local(
    chain: IAutoMovieHumanLoftChain,
    s: number,
    points: readonly (readonly [number, number, number])[],
  ): [number, number][] {
    const f: AutoMovieHumanLoftFrame.IFrame = frame(chain, s);
    return points.map(
      (p: readonly [number, number, number]): [number, number] =>
        AutoMovieHumanLoftFrame.local(f, p),
    );
  }

  /**
   * Ring of world points `[x, y, z]` at station s and the given phases.
   *
   * @param chain Chain to evaluate.
   * @param s Station within the chain; world height for horizontal layers.
   * @param phases Correspondence phases in radians.
   */
  export function ring(
    chain: IAutoMovieHumanLoftChain,
    s: number,
    phases: readonly number[],
  ): [number, number, number][] {
    const c: number[] = coefficients(chain, s);
    const f: AutoMovieHumanLoftFrame.IFrame = frame(chain, s);

    return phases.map((t: number): [number, number, number] => {
      const p: [number, number, number, number] =
        AutoMovieHumanHarmonicCurve.evaluate(c, chain.order, t);
      return AutoMovieHumanLoftFrame.place(f, p[0], p[1]);
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
