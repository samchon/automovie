import { AutoMovieLoftContract, AutoMovieSplineCurve, type IAutoMovieLoftChain } from "@automovie/engine";

/**
 * A chain of horizontal layers from rings of world points.
 *
 * A generated ring need not lie in a plane: its layer sits at the station it
 * was cut at, or at the ring's mean height when no station is given, and
 * `lift` carries the rest. The layers' stations and rings are checked by
 * `AutoMovieLoftContract`: each layer at least the least gap over the
 * last, each ring finite with a non-zero area, or the build throws naming the
 * chain and the layer. Station slopes are the three-point derivative over the
 * neighbouring layers, on both sides of a layer.
 */
export namespace AutoMovieHumanHorizontalChain {
  /** The chain's identity. */
  export interface IShape {
    /** Chain name. */
    name: string;

    /** Control points of a section. */
    order: number;

    /** Uniform phases of the chain's rings. */
    samples: number;

    /** Phase correspondence rule. */
    rule: IAutoMovieLoftChain["rule"];
  }

  /**
   * Build a chain.
   *
   * @param shape Name and section size.
   * @param rings Per layer from the bottom, one `[x, y, z]` per control point.
   * @param beyond Ring past the top, when the surface runs on into the next
   *   chain: the top layer's slope then reads both sides, as the next chain's
   *   own does, and no layer stands for it.
   * @param stations The station of every ring (and of `beyond`), for rings cut
   *   on tilted planes: such a ring's mean height need not rise with the
   *   station it was cut at. Absent, each layer stands at its ring's mean height.
   * @throws When a ring is not finite or encloses no area, or a layer stands
   *   less than the least gap over the last (`AutoMovieLoftContract`),
   *   naming the chain and the layer.
   */
  export function build(
    shape: IShape,
    rings: readonly (readonly (readonly [number, number, number])[])[],
    beyond?: readonly (readonly [number, number, number])[],
    stations?: readonly number[],
  ): IAutoMovieLoftChain {
    const all: readonly (readonly (readonly [number, number, number])[])[] =
      beyond === undefined ? rings : [...rings, beyond];
    if (stations !== undefined && stations.length !== all.length)
      throw new Error(`${shape.name}: ${all.length} rings and ${stations.length} stations`);
    all.forEach((ring: readonly (readonly [number, number, number])[], k: number): void => {
      AutoMovieLoftContract.ring(shape.name, k, ring);
    });
    const heights: AutoMovieLoftContract.Stations = AutoMovieLoftContract.stations(
      shape.name,
      all.map(
        (ring: readonly (readonly [number, number, number])[], k: number): number =>
          stations !== undefined
            ? stations[k]!
            : ring.reduce((s: number, p: readonly [number, number, number]): number => s + p[1], 0) / ring.length,
      ),
      AutoMovieLoftContract.LEAST_LAYER_GAP,
    );
    const controls = all.map(
      (
        ring: readonly (readonly [number, number, number])[],
        k: number,
      ): { coefficients: number[]; lift: number[] } => ({
        coefficients: AutoMovieSplineCurve.interpolate(
          ring.map(
            (p: readonly [number, number, number]): [number, number] => [
              p[0],
              p[2],
            ],
          ),
        ),
        lift: AutoMovieSplineCurve.interpolate(
          ring.map(
            (p: readonly [number, number, number]): [number, number] => [
              p[1] - heights[k]!,
              0,
            ],
          ),
        ).slice(0, shape.order),
      }),
    );
    return {
      ...shape,
      basis: "spline",
      layers: heights.slice(0, rings.length).map(
        (y: number, k: number): IAutoMovieLoftChain.ILayer => ({
          y,
          coefficients: controls[k]!.coefficients,
          slopes: derivative(
            heights,
            controls.map((c): number[] => c.coefficients),
            k,
          ),
          lift: controls[k]!.lift,
          liftSlopes: derivative(
            heights,
            controls.map((c): number[] => c.lift),
            k,
          ),
        }),
      ),
    };
  }

  /** Three-point derivative of a list of arrays over unequal stations. */
  function derivative(
    s: readonly number[],
    values: readonly (readonly number[])[],
    k: number,
  ): number[] {
    const a: number = Math.max(0, k - 1);
    const b: number = Math.min(s.length - 1, k + 1);
    if (a === k || b === k)
      return values[k]!.map(
        (_: number, i: number): number =>
          (values[b]![i]! - values[a]![i]!) / (s[b]! - s[a]!),
      );
    const h0: number = s[k]! - s[a]!;
    const h1: number = s[b]! - s[k]!;
    return values[k]!.map(
      (v: number, i: number): number =>
        ((values[b]![i]! - v) * h0 * h0 + (v - values[a]![i]!) * h1 * h1) /
        (h0 * h1 * (h0 + h1)),
    );
  }
}
