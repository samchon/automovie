import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanSplineCurve } from "../lofting/AutoMovieHumanSplineCurve";
import type { IAutoMovieHumanHermiteCurve } from "../lofting/IAutoMovieHumanHermiteCurve";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/**
 * Low-pass of the lip sections around the external vermilion.
 *
 * The lower head's tilted sections through the lips ring at the front: on
 * the f1 calibration they change curvature sign 10 to 18 times per section
 * from 1518 to 1532 mm, with combs crossing at both commissures, where the
 * upper lip steps over the lower one as a notch whose upward face catches
 * a white highlight. The ringing is the fitter's response to the sharp lip
 * borders and the closed oral line, not lip anatomy.
 *
 * The region is the calibration's own vermilion boundary: its box in the
 * frontal plane (height and lateral extent) grown by {@link MARGIN} mm,
 * and its depth window in front of the face. Each control point of a
 * section of the boundary's chain moves to `c + w (F c - c)`, F a periodic
 * cubic P-spline projection keeping detail longer than {@link WAVELENGTH}
 * mm along the section, and w the product of smoothsteps of the control
 * point's distance inside the grown box and the depth window, so the
 * filter fades out over the margin and leaves the cheeks, chin and nose
 * as fitted. Station slopes take the same filter, the region being fixed
 * in the world while the section plane moves.
 *
 * The wavelength keeps the lip borders' width (several millimetres) and
 * removes the 2 to 3 mm combs. The rule reads only the boundary, so it
 * follows the lips of any calibration. The oral line is a crease across
 * the layers, which this along-section filter leaves; its ends at the
 * commissures are tapered by `AutoMovieHumanCornerSmoothing`.
 */
export namespace AutoMovieHumanLipSmoothing {
  /**
   * Calibration with the lip sections filtered.
   *
   * @param calibration Merged calibration; not modified.
   * @param lips External vermilion boundary in the same frame.
   * @returns A copy with the boundary chain's lip layers filtered.
   */
  export function apply(
    calibration: IAutoMovieHumanBodyCalibration,
    lips: IAutoMovieHumanHermiteCurve,
  ): IAutoMovieHumanBodyCalibration {
    const points: [number, number, number][] = lips.spans.flatMap(
      (
        s: IAutoMovieHumanHermiteCurve["spans"][number],
      ): [number, number, number][] => [s.start, s.end],
    );
    const lo: [number, number, number] = [0, 1, 2].map((k: number): number =>
      Math.min(...points.map((p: [number, number, number]): number => p[k]!)),
    ) as [number, number, number];
    const hi: [number, number, number] = [0, 1, 2].map((k: number): number =>
      Math.max(...points.map((p: [number, number, number]): number => p[k]!)),
    ) as [number, number, number];

    // Weight of a point: inside the grown frontal box and the depth window
    // in front of the boundary's deepest point.
    const weight: (p: readonly [number, number, number]) => number = (
      p: readonly [number, number, number],
    ): number =>
      inside(p[1], lo[1], hi[1]) *
      inside(p[2], lo[2], hi[2]) *
      smooth((p[0] - (lo[0] - DEPTH)) / MARGIN);

    return {
      ...calibration,
      chains: calibration.chains.map(
        (chain: IAutoMovieHumanLoftChain): IAutoMovieHumanLoftChain =>
          chain.name === lips.chain ? filter(chain, weight) : chain,
      ),
    };
  }
}

/** Detail kept along a lip section, mm. */
const WAVELENGTH: number = 5;

/** Fade width outside the vermilion box, mm. */
const MARGIN: number = 6;

/** Depth behind the boundary's deepest point still filtered, mm. */
const DEPTH: number = 4;

/** Filter weight of a coordinate against a range grown by the margin. */
function inside(v: number, lo: number, hi: number): number {
  return (
    smooth((v - (lo - MARGIN)) / MARGIN) * smooth((hi + MARGIN - v) / MARGIN)
  );
}

/** Smoothstep on [0, 1], clamped. */
function smooth(x: number): number {
  const t: number = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}

/** One chain's layers filtered by a world-space weight. */
function filter(
  chain: IAutoMovieHumanLoftChain,
  weight: (p: readonly [number, number, number]) => number,
): IAutoMovieHumanLoftChain {
  if (chain.basis !== "spline") return chain;
  const N: number = chain.order;
  const lowpass: (values: readonly number[], cycles: number) => number[] = (
    values: readonly number[],
    cycles: number,
  ): number[] =>
    AutoMovieHumanSplineCurve.project(
      Array.from(
        { length: 4 * N },
        (_: unknown, i: number): [number, number] => {
          const p: [number, number, number, number] =
            AutoMovieHumanSplineCurve.evaluate(
              values,
              N,
              (2 * Math.PI * i) / (4 * N),
            );
          return [p[0], p[1]];
        },
      ),
      N,
      cycles,
    );
  const phases: number[] = Array.from(
    { length: N },
    (_: unknown, j: number): number => (2 * Math.PI * j) / N,
  );
  return {
    ...chain,
    layers: chain.layers.map(
      (
        layer: IAutoMovieHumanLoftChain.ILayer,
      ): IAutoMovieHumanLoftChain.ILayer => {
        const points: [number, number, number][] = AutoMovieHumanLoftChain.ring(
          chain,
          layer.y,
          phases,
        );
        const w: number[] = points.map(weight);
        if (w.every((v: number): boolean => v === 0)) return layer;
        let perimeter: number = 0;
        points.forEach((p: [number, number, number], j: number): void => {
          const q: [number, number, number] = points[(j + 1) % N]!;
          perimeter += Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
        });
        const cycles: number = perimeter / WAVELENGTH;
        const fc: number[] = lowpass(layer.coefficients, cycles);
        const fm: number[] = lowpass(layer.slopes, cycles);
        return {
          ...layer,
          coefficients: layer.coefficients.map(
            (c: number, k: number): number => c + w[k % N]! * (fc[k]! - c),
          ),
          slopes: layer.slopes.map(
            (m: number, k: number): number => m + w[k % N]! * (fm[k]! - m),
          ),
        };
      },
    ),
  };
}
