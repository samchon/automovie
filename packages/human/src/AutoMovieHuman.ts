import type { IAutoMovieModel } from "@automovie/interface";

import { AutoMovieHumanBodyCalibration } from "./generation/AutoMovieHumanBodyCalibration";
import { AutoMovieHumanBodySurface } from "./generation/AutoMovieHumanBodySurface";
import type { IAutoMovieHumanGenerated } from "./structures/IAutoMovieHumanGenerated";
import type { IAutoMovieHumanParameters } from "./structures/IAutoMovieHumanParameters";

/**
 * Public Human generator: typed parameters in, engine model out.
 *
 * The skin is a set of lofted section chains (see
 * `packages/human/docs/techniques/section-chain-lofting.md`) whose shared
 * coefficients are calibrated from saved Recovery/Hermite sections. The
 * generator reads only `params` and those shared coefficients.
 *
 * Current parameter consumption: `body.controls.height` scales the whole
 * calibrated body uniformly. Every other field is accepted and returned
 * unchanged without a shape response yet; girths, lengths, head, face and
 * extremity inputs get their laws in later campaign stages.
 */
export class AutoMovieHuman {
  /**
   * Generate the neutral body for one parameter set.
   *
   * @param params Complete public input; returned unchanged as `parameters`.
   * @returns The parameters used and the generated model in metres.
   */
  public static generate(
    params: IAutoMovieHumanParameters,
  ): IAutoMovieHumanGenerated {
    const surface: AutoMovieHumanBodySurface.IOutput =
      AutoMovieHumanBodySurface.generate(AutoMovieHumanBodyCalibration);

    // Stature is required: an unknown height would otherwise be silently
    // replaced by the calibration specimen's.
    const height: number | null = params.body.controls.height.value;
    if (height === null || !(height > 0))
      throw new Error("Human generation requires a positive height control");

    // Uniform stature scale about the floor origin, then mm -> m for the
    // engine, whose model units are metres.
    const scale: number = height / AutoMovieHumanBodyCalibration.stature / 1000;

    const model: IAutoMovieModel = {
      id: "automovie-human",
      name: "Human",
      origin: "generated",
      parts: [
        {
          id: "human.skin",
          name: "skin",
          geometry: {
            type: "mesh",
            mesh: {
              positions: surface.positions.map((v: number): number => v * scale),
              normals: surface.normals,
              uvs: null,
              indices: surface.indices,
              skin: null,
            },
          },
          material: "human.skin",
          attachedBone: null,
          transform: null,
        },
      ],
      skeleton: null,
      body: null,

      // Neutral inspection material: linear gray 0.8, the same as the
      // reference photographs, so form is compared without appearance.
      materials: [
        {
          id: "human.skin",
          name: "skin",
          baseColor: { r: 0.8, g: 0.8, b: 0.8, a: 1, hex: null },
          metallic: 0,
          roughness: 0.9,
          emissive: null,
          opacity: 1,
          baseColorTexture: null,
        },
      ],
      asset: null,
    };
    return { parameters: params, model };
  }
}
