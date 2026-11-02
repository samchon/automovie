import { AutoMovieHumanSplineCurve } from "./AutoMovieHumanSplineCurve";
import type { IAutoMovieHumanLoftChain } from "./IAutoMovieHumanLoftChain";

/**
 * A chain of horizontal layers from rings of world points.
 *
 * A generated ring need not lie in a plane: its layer sits at the ring's mean
 * height, keeping each height strictly above the last, and `lift` carries the
 * rest. Station slopes are the three-point derivative over the neighbouring
 * layers, on both sides of a layer.
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
    rule: IAutoMovieHumanLoftChain["rule"];
  }

  /**
   * Build a chain.
   *
   * @param shape Name and section size.
   * @param rings Per layer from the bottom, one `[x, y, z]` per control point.
   * @param beyond Ring past the top, when the surface runs on into the next
   *   chain: the top layer's slope then reads both sides, as the next chain's
   *   own does, and no layer stands for it.
   * @param stations Optional declared material station of every supplied ring,
   *   including beyond. Strictly increasing finite authored addresses are
   *   retained exactly; lift carries their physical Y difference. Without
   *   them the existing mean-height/minimum-gap convention is unchanged.
   */
  export function build(
    shape: IShape,
    rings: readonly (readonly (readonly [number, number, number])[])[],
    beyond?: readonly (readonly [number, number, number])[],
    stations?: readonly number[],
  ): IAutoMovieHumanLoftChain {
    const all: readonly (readonly (readonly [number, number, number])[])[] =
      beyond === undefined ? rings : [...rings, beyond];
    let last: number = -Infinity;
    const heights: number[] = stations === undefined ? all.map(
      (ring: readonly (readonly [number, number, number])[]): number => {
        const y: number = Math.max(
          ring.reduce(
            (s: number, p: readonly [number, number, number]): number =>
              s + p[1],
            0,
          ) / ring.length,
          last + MINIMUM_GAP,
        );
        last = y;
        return y;
      },
    ) : [...stations];
    if (heights.length !== all.length || heights.some((height: number, index: number): boolean => !Number.isFinite(height) || index > 0 && height <= heights[index - 1]!))
      throw new Error("Horizontal rings need one finite strictly increasing material station each", { cause: { chain: shape.name, observed: heights, expectedRings: all.length, units: "mm and count" } });
    // A periodic cubic basis partitions unity exactly in real arithmetic.
    // Preserve a constant axial field directly: the finite inverse-filter
    // convolution otherwise perturbs it, including chart-only translations.
    const controls = all.map(
      (
        ring: readonly (readonly [number, number, number])[],
        k: number,
      ): { coefficients: number[]; lift: number[] } => ({
        coefficients: AutoMovieHumanSplineCurve.interpolate(
          ring.map(
            (p: readonly [number, number, number]): [number, number] => [
              p[0],
              p[2],
            ],
          ),
        ),
        lift: ring.every((point: readonly [number, number, number]): boolean => point[1] - heights[k]! === ring[0]![1] - heights[k]!)
          ? new Array<number>(shape.order).fill(ring[0]![1] - heights[k]!)
          : AutoMovieHumanSplineCurve.interpolate(
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
        (y: number, k: number): IAutoMovieHumanLoftChain.ILayer => ({
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

/** Smallest gap between two layers' heights, mm. */
const MINIMUM_GAP: number = 0.05;
