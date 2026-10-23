import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanLoftMesh } from "../lofting/AutoMovieHumanLoftMesh";
import { AutoMovieHumanLoftTube } from "../lofting/AutoMovieHumanLoftTube";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
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
 * - `<chain>/g<j>`: a guide, the Hermite curve the loft follows along the
 *   chain at the fixed phase `2 pi j / G`, from the bottom layer to the top
 *   one. Guides are the curves that carry each section to the next, so
 *   together with the sections they draw the whole lofting net; each shapes
 *   every interval of its chain.
 *
 * Ids are deterministic for a given calibration: chain names come from the
 * calibration tree and layer indices from its sorted principal layers.
 * Intermediate bisection stations are not drawn; they carry no shape
 * evidence of their own, and the guides already pass through them.
 */
export namespace AutoMovieHumanBodyConstruction {
  /** One construction curve drawn as a thin tube. */
  export interface ICurve {
    /** Curve id, `<chain>/<k>`, `<chain>/axis` or `<chain>/g<j>`. */
    id: string;

    /** Whether the curve is a principal section, a chain axis or a guide. */
    kind: "section" | "axis" | "guide";

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

  /** Guides per chain: one every GUIDE_SPACING mm of its largest section, 8 to 32. */
  const GUIDE_SPACING: number = 30;

  /** Tube radius of guide curves in mm. */
  const GUIDE_RADIUS: number = 0.45;

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
          out.push({
            id: chain.name + "/" + k.toString(),
            kind: "section",
            mesh,
          });
        },
      );

      // The central axis: section centroids at evenly spaced heights.
      const mesh: AutoMovieHumanLoftMesh.IContext =
        AutoMovieHumanLoftMesh.create();
      AutoMovieHumanLoftTube.sweep(mesh, axis(chain), false, AXIS_RADIUS);
      out.push({ id: chain.name + "/axis", kind: "axis", mesh });

      // Guides: fixed-phase curves along the chain.
      guides(chain).forEach(
        (points: [number, number, number][], j: number): void => {
          const tube: AutoMovieHumanLoftMesh.IContext =
            AutoMovieHumanLoftMesh.create();
          AutoMovieHumanLoftTube.sweep(tube, points, false, GUIDE_RADIUS);
          out.push({
            id: chain.name + "/g" + j.toString(),
            kind: "guide",
            mesh: tube,
          });
        },
      );
    }
    return out;
  }

  /**
   * Fixed-phase curves of a chain, one per guide phase, each sampled at
   * about one station per millimetre between its end layers.
   */
  function guides(
    chain: IAutoMovieHumanLoftChain,
  ): [number, number, number][][] {
    const bottom: number = chain.layers[0]!.y;
    const top: number = chain.layers[chain.layers.length - 1]!.y;
    const probe: [number, number, number][] = chain.layers.flatMap(
      (layer: IAutoMovieHumanLoftChain.ILayer): [number, number, number][] =>
        AutoMovieHumanLoftChain.ring(chain, layer.y, [
          0,
          Math.PI / 2,
          Math.PI,
          (3 * Math.PI) / 2,
        ]),
    );
    let extent: number = 0;
    for (let i: number = 0; i + 4 <= probe.length; i += 4)
      extent = Math.max(
        extent,
        Math.hypot(
          probe[i]![0] - probe[i + 2]![0],
          probe[i]![2] - probe[i + 2]![2],
        ) +
          Math.hypot(
            probe[i + 1]![0] - probe[i + 3]![0],
            probe[i + 1]![2] - probe[i + 3]![2],
          ),
      );
    const count: number = Math.min(
      32,
      Math.max(8, 4 * Math.round((Math.PI * extent) / 2 / GUIDE_SPACING / 4)),
    );
    const phases: number[] = Array.from(
      { length: count },
      (_: unknown, j: number): number => (2 * Math.PI * j) / count,
    );
    const steps: number = Math.min(600, Math.max(16, Math.round(top - bottom)));
    const rings: [number, number, number][][] = Array.from(
      { length: steps + 1 },
      (_: unknown, i: number): [number, number, number][] =>
        AutoMovieHumanLoftChain.ring(
          chain,
          bottom + ((top - bottom) * i) / steps,
          phases,
        ),
    );
    return phases.map((_: number, j: number): [number, number, number][] =>
      rings.map(
        (ring: [number, number, number][]): [number, number, number] =>
          ring[j]!,
      ),
    );
  }

  /** Axis points from the chain's bottom to its top layer. */
  function axis(chain: IAutoMovieHumanLoftChain): [number, number, number][] {
    const bottom: number = chain.layers[0]!.y;
    const top: number = chain.layers[chain.layers.length - 1]!.y;

    return Array.from(
      { length: AXIS_POINTS },
      (_: unknown, i: number): [number, number, number] => {
        const s: number = bottom + ((top - bottom) * i) / (AXIS_POINTS - 1);
        return AutoMovieHumanLoftChain.axis(chain, s);
      },
    );
  }
}
