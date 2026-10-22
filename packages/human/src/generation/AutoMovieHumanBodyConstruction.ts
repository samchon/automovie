import {
  AutoMovieHumanLoftChain,
  type IAutoMovieHumanLoftChain,
} from "../lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanLoftMesh } from "../lofting/AutoMovieHumanLoftMesh";
import { AutoMovieHumanLoftTube } from "../lofting/AutoMovieHumanLoftTube";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/**
 * Construction of the body surface: what generated the skin, drawn beside it.
 *
 * Every lofting curve is emitted as its own addressable piece, evaluated
 * from the same chain functions the skin uses, so a defect in the surface
 * can be traced to the curve that produced it.
 *
 * ## Curve ids
 *
 * - `<chain>/<k>`: the principal section at layer index k of the chain,
 *   counted from the chain's bottom. It shapes the skin intervals
 *   `<chain>/<k-1>` and `<chain>/<k>`, the Hermite intervals that use it as
 *   an endpoint.
 * - `<chain>/axis`: the chain's central axis, the Hermite curve of its
 *   section centroids, which shapes every interval of the chain.
 *
 * Ids are deterministic for a given calibration: chain names come from the
 * calibration tree and layer indices from its sorted principal layers.
 * Intermediate bisection stations are not drawn; they carry no shape
 * evidence of their own.
 */
export namespace AutoMovieHumanBodyConstruction {
  /** One construction curve drawn as a thin tube. */
  export interface ICurve {
    /** Curve id, `<chain>/<k>` or `<chain>/axis`. */
    id: string;

    /** Whether the curve is a principal section or a chain axis. */
    kind: "section" | "axis";

    /** Tube mesh in mm, registered frame. */
    mesh: AutoMovieHumanLoftMesh.IContext;
  }

  /** Points evaluated along each section curve. */
  const SECTION_POINTS: number = 128;

  /** Points evaluated along each axis curve. */
  const AXIS_POINTS: number = 96;

  /** Tube radius of section curves in mm. */
  const SECTION_RADIUS: number = 0.6;

  /** Tube radius of axis curves in mm. */
  const AXIS_RADIUS: number = 1.2;

  /**
   * Draw every principal section and central axis of every calibrated chain.
   *
   * @param calibration Shared chain coefficients.
   */
  export function generate(
    calibration: IAutoMovieHumanBodyCalibration,
  ): ICurve[] {
    const phases: number[] = Array.from(
      { length: SECTION_POINTS },
      (_: unknown, i: number): number => (2 * Math.PI * i) / SECTION_POINTS,
    );
    const out: ICurve[] = [];

    for (const chain of calibration.chains) {
      // One closed tube per principal layer.
      chain.layers.forEach(
        (layer: IAutoMovieHumanLoftChain.ILayer, k: number): void => {
          const mesh: AutoMovieHumanLoftMesh.IContext =
            AutoMovieHumanLoftMesh.create();
          AutoMovieHumanLoftTube.sweep(
            mesh,
            AutoMovieHumanLoftChain.ring(chain, layer.y, phases),
            true,
            SECTION_RADIUS,
          );
          out.push({ id: chain.name + "/" + k.toString(), kind: "section", mesh });
        },
      );

      // The central axis: section centroids at evenly spaced heights.
      const mesh: AutoMovieHumanLoftMesh.IContext =
        AutoMovieHumanLoftMesh.create();
      AutoMovieHumanLoftTube.sweep(mesh, axis(chain), false, AXIS_RADIUS);
      out.push({ id: chain.name + "/axis", kind: "axis", mesh });
    }
    return out;
  }

  /** Axis points from the chain's bottom to its top layer. */
  function axis(chain: IAutoMovieHumanLoftChain): [number, number, number][] {
    const bottom: number = chain.layers[0]!.y;
    const top: number = chain.layers[chain.layers.length - 1]!.y;

    return Array.from(
      { length: AXIS_POINTS },
      (_: unknown, i: number): [number, number, number] => {
        const y: number = bottom + ((top - bottom) * i) / (AXIS_POINTS - 1);
        const p: [number, number] = AutoMovieHumanLoftChain.axis(chain, y);
        return [p[0], y, p[1]];
      },
    );
  }
}
