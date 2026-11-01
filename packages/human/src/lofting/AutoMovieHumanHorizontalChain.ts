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
   */
  export function build(
    shape: IShape,
    rings: readonly (readonly (readonly [number, number, number])[])[],
  ): IAutoMovieHumanLoftChain {
    let last: number = -Infinity;
    const heights: number[] = rings.map(
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
    );
    const controls = rings.map(
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
        lift: AutoMovieHumanSplineCurve.interpolate(
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
      layers: heights.map(
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
