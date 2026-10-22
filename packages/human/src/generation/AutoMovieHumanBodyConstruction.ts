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
 * Two layers are emitted, both evaluated from the same chain functions the
 * skin uses, so a defect in the surface can be traced to the curve or axis
 * that produced it:
 *
 * - `sections`: every principal-layer section curve of every chain;
 * - `axes`: every chain's central axis, the Hermite curve of its section
 *   centroids from bottom to top.
 *
 * Intermediate bisection stations are not drawn; they carry no shape
 * evidence of their own.
 */
export namespace AutoMovieHumanBodyConstruction {
  /** Construction meshes in millimetres, registered frame. */
  export interface IOutput {
    /** Principal-layer section tubes. */
    sections: AutoMovieHumanLoftMesh.IContext;

    /** Central-axis tubes. */
    axes: AutoMovieHumanLoftMesh.IContext;
  }

  /** Points evaluated along each section curve. */
  const SECTION_POINTS: number = 128;

  /** Points evaluated along each axis curve. */
  const AXIS_POINTS: number = 96;

  /**
   * Draw the principal sections and central axes of every calibrated chain.
   *
   * @param calibration Shared chain coefficients.
   */
  export function generate(
    calibration: IAutoMovieHumanBodyCalibration,
  ): IOutput {
    const sections: AutoMovieHumanLoftMesh.IContext =
      AutoMovieHumanLoftMesh.create();
    const axes: AutoMovieHumanLoftMesh.IContext =
      AutoMovieHumanLoftMesh.create();

    const phases: number[] = Array.from(
      { length: SECTION_POINTS },
      (_: unknown, i: number): number => (2 * Math.PI * i) / SECTION_POINTS,
    );

    for (const chain of calibration.chains) {
      // One closed tube per principal layer.
      for (const layer of chain.layers)
        AutoMovieHumanLoftTube.sweep(
          sections,
          AutoMovieHumanLoftChain.ring(chain, layer.y, phases),
          true,
          0.6,
        );

      // The central axis: centroid of the Hermite section at evenly spaced heights.
      AutoMovieHumanLoftTube.sweep(axes, axis(chain), false, 1.2);
    }
    return { sections, axes };
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
