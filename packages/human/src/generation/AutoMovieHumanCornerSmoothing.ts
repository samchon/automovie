import { AutoMovieHumanLoftAperture } from "../lofting/AutoMovieHumanLoftAperture";
import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanHermiteCurve } from "../lofting/IAutoMovieHumanHermiteCurve";
import type { IAutoMovieHumanLoftAperture } from "../lofting/IAutoMovieHumanLoftAperture";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/**
 * Station low-pass around the corners where a facial crease ends.
 *
 * Two creases of the fitted head run across its layers and stop abruptly
 * at a corner. The oral line is 2.5 mm deep 3 mm inside each commissure of
 * f1's mouth, still 1.4 mm deep at the commissure and gone 2 mm beyond, so
 * each corner shades as a black pit whose upper face catches a white
 * highlight. The upper-lid crease runs on past each lateral canthus
 * as a 1 to 3 mm ledge with a 0.5 mm groove above it for about 6 mm,
 * which shades as a blade beside the eye. A real face tapers both into a
 * shallow fold.
 *
 * At each corner (the vermilion boundary's two lateral extremes and each
 * eye aperture's lateral extreme), every interior layer's values and
 * station slopes move toward the Gaussian weighted least-squares line
 * through the neighbouring layers of the same chain,
 * `exp(-d^2 / (2 s^2))` with s = {@link SIGMA} mm of station, read at the
 * layer, with full weight for control points within {@link CORE} mm
 * of the corner, fading to none at {@link CORE} + {@link FADE} mm. Past
 * each commissure the oral line ran on across the cheek for 10 to 22 mm,
 * a dark line beside the mouth in colour, so on the lateral side of a
 * commissure the filter reaches {@link CHEEK} mm from it in the frontal
 * plane, fully within {@link BAND} mm of its height and fading out by twice
 * that. End
 * layers, which events share, are kept, and the rest of each crease (the
 * closed oral line across the mouth, the lid crease over the eye) stays as
 * fitted. Measured on f1, the oral line's depth 2 mm inside the
 * commissure falls from 2.4 to 1.0 mm and at the commissure from 1.4 to
 * 0.2 mm, and the groove above the lateral canthus from 0.5 to 0.1 mm.
 */
export namespace AutoMovieHumanCornerSmoothing {
  /**
   * Calibration with its crease corners tapered.
   *
   * @param calibration Merged calibration; not modified.
   * @param lips External vermilion boundary in the same frame.
   * @returns A copy with the layers round the corners averaged.
   */
  export function apply(
    calibration: IAutoMovieHumanBodyCalibration,
    lips: IAutoMovieHumanHermiteCurve,
  ): IAutoMovieHumanBodyCalibration {
    const corners: [number, number, number][] = [
      ...commissures(lips),
      ...calibration.apertures
        .filter((a: IAutoMovieHumanLoftAperture): boolean =>
          a.name.startsWith("eye."),
        )
        .map(canthus),
    ];
    const mouth: [number, number, number][] = commissures(lips);
    const weight: (p: readonly [number, number, number]) => number = (
      p: readonly [number, number, number],
    ): number =>
      Math.max(
        ...corners.map(
          (c: [number, number, number]): number =>
            1 -
            smooth(
              (Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]) - CORE) / FADE,
            ),
        ),
        // Past each commissure the oral line runs on across the cheek, so
        // the filter reaches further on the lateral side, within a band of
        // the commissure's height.
        ...mouth.map(
          (c: [number, number, number]): number =>
            smooth((Math.abs(p[2]) - Math.abs(c[2]) + 1) / 3) *
            (1 - smooth((Math.abs(p[1] - c[1]) - BAND) / BAND)) *
            (1 -
              smooth(
                (Math.hypot(p[0] - c[0], p[2] - c[2]) - CORE) / (CHEEK - CORE),
              )),
        ),
      );
    return {
      ...calibration,
      chains: calibration.chains.map(
        (chain: IAutoMovieHumanLoftChain): IAutoMovieHumanLoftChain =>
          station(chain, weight),
      ),
    };
  }
}

/** Station width of the low-pass, mm. */
const SIGMA: number = 1.5;

/** Distance from a corner filtered fully, mm. */
const CORE: number = 2;

/** Fade width beyond the core, mm. */
const FADE: number = 6;

/** Lateral reach of the filter past each commissure, mm. */
const CHEEK: number = 22;

/** Height half-band of the lateral reach about the commissure, mm. */
const BAND: number = 4;

/** The vermilion boundary's two lateral extremes. */
function commissures(
  lips: IAutoMovieHumanHermiteCurve,
): [number, number, number][] {
  const points: [number, number, number][] = lips.spans.flatMap(
    (
      s: IAutoMovieHumanHermiteCurve["spans"][number],
    ): [number, number, number][] => [s.start, s.end],
  );
  return [
    points.reduce(
      (
        a: [number, number, number],
        b: [number, number, number],
      ): [number, number, number] => (b[2] < a[2] ? b : a),
    ),
    points.reduce(
      (
        a: [number, number, number],
        b: [number, number, number],
      ): [number, number, number] => (b[2] > a[2] ? b : a),
    ),
  ];
}

/** An eye aperture's lateral extreme. */
function canthus(
  aperture: IAutoMovieHumanLoftAperture,
): [number, number, number] {
  return AutoMovieHumanLoftAperture.polyline(aperture).reduce(
    (
      a: [number, number, number],
      b: [number, number, number],
    ): [number, number, number] => (Math.abs(b[2]) > Math.abs(a[2]) ? b : a),
  );
}

/** Smoothstep on [0, 1], clamped. */
function smooth(x: number): number {
  const t: number = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}

/** One chain's interior layers averaged over station where a world-space weight allows. */
function station(
  chain: IAutoMovieHumanLoftChain,
  weight: (p: readonly [number, number, number]) => number,
): IAutoMovieHumanLoftChain {
  if (chain.basis !== "spline") return chain;
  const N: number = chain.order;
  const layers: readonly IAutoMovieHumanLoftChain.ILayer[] = chain.layers;
  const phases: number[] = Array.from(
    { length: N },
    (_: unknown, j: number): number => (2 * Math.PI * j) / N,
  );
  const reach: number = 3 * SIGMA;
  let changed: boolean = false;
  const out: IAutoMovieHumanLoftChain.ILayer[] = layers.map(
    (
      layer: IAutoMovieHumanLoftChain.ILayer,
      k: number,
    ): IAutoMovieHumanLoftChain.ILayer => {
      if (k === 0 || k === layers.length - 1) return layer;
      const w: number[] = AutoMovieHumanLoftChain.ring(
        chain,
        layer.y,
        phases,
      ).map(weight);
      if (w.every((v: number): boolean => v === 0)) return layer;
      changed = true;
      // Gaussian weighted least-squares line through the neighbours, read
      // at the layer: its value and its slope. A plain average of a window
      // cut short by the chain's end (the canthus lies 1 mm below the
      // middle head's top) would pull the layer off the chain's trend and
      // shelve the last interval.
      let w0: number = 0;
      let w1: number = 0;
      let w2: number = 0;
      const s0: number[] = new Array<number>(layer.coefficients.length).fill(0);
      const s1: number[] = new Array<number>(layer.coefficients.length).fill(0);
      for (const other of layers) {
        const d: number = other.y - layer.y;
        if (Math.abs(d) > reach) continue;
        const g: number = Math.exp(-(d * d) / (2 * SIGMA * SIGMA));
        w0 += g;
        w1 += g * d;
        w2 += g * d * d;
        other.coefficients.forEach((c: number, i: number): void => {
          s0[i]! += g * c;
          s1[i]! += g * d * c;
        });
      }
      const det: number = w0 * w2 - w1 * w1;
      const line: boolean = det > 1e-12 * w0 * w2;
      return {
        ...layer,
        coefficients: layer.coefficients.map(
          (c: number, i: number): number =>
            c +
            w[i % N]! *
              ((line ? (w2 * s0[i]! - w1 * s1[i]!) / det : s0[i]! / w0) - c),
        ),
        slopes: layer.slopes.map((m: number, i: number): number =>
          line ? m + w[i % N]! * ((w0 * s1[i]! - w1 * s0[i]!) / det - m) : m,
        ),
      };
    },
  );
  return changed ? { ...chain, layers: out } : chain;
}
