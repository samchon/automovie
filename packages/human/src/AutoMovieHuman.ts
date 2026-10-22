import type {
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";

import { AutoMovieHumanAppearance } from "./appearance/AutoMovieHumanAppearance";
import { AutoMovieHumanEyeProbe } from "./appearance/AutoMovieHumanEyeProbe";
import { AutoMovieHumanBodyCalibration } from "./generation/AutoMovieHumanBodyCalibration";
import { AutoMovieHumanBodyConstruction } from "./generation/AutoMovieHumanBodyConstruction";
import { AutoMovieHumanBodySurface } from "./generation/AutoMovieHumanBodySurface";
import { AutoMovieHumanLoftMesh } from "./lofting/AutoMovieHumanLoftMesh";
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
 * Parts are addressable by the lofting curve that generated them:
 *
 * - `human.skin.<chain>/<k>`: the skin between principal layers k and k+1
 *   of a chain, shaped by the sections `<chain>/<k>` and `<chain>/<k+1>`;
 * - `human.construction.<chain>/<k>`: the principal section curve itself;
 * - `human.construction.<chain>/axis`: the chain's central axis;
 * - `human.eye.<side>.<sclera|iris|cornea>`: appearance parts from
 *   `AutoMovieHumanAppearance`, placed on the generated head.
 *
 * Skin normals are computed on the whole closed skin before it is split,
 * so the parts render as one continuous surface. The viewer's overlay and
 * construction passes show the `human.construction.` parts.
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
    // Stature is required: an unknown height would otherwise be silently
    // replaced by the calibration specimen's.
    const height: number | null = params.body.controls.height.value;
    if (height === null || !(height > 0))
      throw new Error("Human generation requires a positive height control");

    // Uniform stature scale about the floor origin, then mm -> m for the
    // engine, whose model units are metres.
    const scale: number = height / AutoMovieHumanBodyCalibration.stature / 1000;

    const surface: AutoMovieHumanBodySurface.IOutput =
      AutoMovieHumanBodySurface.generate(AutoMovieHumanBodyCalibration);
    const skin: AutoMovieHumanLoftMesh.IPiece[] = AutoMovieHumanLoftMesh.split(
      surface.mesh,
      surface.normals,
    );
    const curves: AutoMovieHumanBodyConstruction.ICurve[] =
      AutoMovieHumanBodyConstruction.generate(AutoMovieHumanBodyCalibration);

    const body: IAutoMovieModelPart[] = [
      ...skin.map(
          (piece: AutoMovieHumanLoftMesh.IPiece): IAutoMovieModelPart =>
            part("human.skin." + piece.name, "skin", piece, piece.normals, scale),
        ),
        ...curves.map(
          (curve: AutoMovieHumanBodyConstruction.ICurve): IAutoMovieModelPart =>
            part(
              "human.construction." + curve.id,
              curve.kind === "axis"
                ? "construction.axes"
                : "construction.sections",
              curve.mesh,
              AutoMovieHumanLoftMesh.normals(curve.mesh),
              scale,
            ),
        ),
    ];

    // Appearance (eyes now; hair, brows, lashes and skin detail later) is
    // placed on the generated body. Eye frames come from a provisional probe
    // of the head skin until the eye apertures publish them.
    const appearance: AutoMovieHumanAppearance.IOutput =
      AutoMovieHumanAppearance.generate(
        params,
        AutoMovieHumanEyeProbe.estimate(params, body),
      );

    const model: IAutoMovieModel = {
      id: "automovie-human",
      name: "Human",
      origin: "generated",
      parts: [...body, ...appearance.parts],
      skeleton: null,
      body: null,
      materials: [
        // Neutral inspection material: linear gray 0.8, the same as the
        // reference photographs, so form is compared without appearance.
        material("skin", [0.8, 0.8, 0.8], false),

        // Construction colours only separate the two layers on screen.
        material("construction.sections", [0.1, 0.35, 0.9], true),
        material("construction.axes", [0.9, 0.15, 0.1], true),
        ...appearance.materials,
      ],
      images: appearance.images,
      asset: null,
    };
    return { parameters: params, model };
  }
}

/**
 * Mesh part from millimetre buffers, scaled into metres.
 *
 * @param id Part id: `human.skin.<chain>/<k>` or `human.construction.<curve id>`.
 * @param name Material name; the material id is `human.<name>`.
 * @param mesh Positions and indices in mm.
 * @param normals Unit vertex normals, unchanged by the uniform scale.
 * @param scale Millimetre-to-model factor including the stature scale.
 */
function part(
  id: string,
  name: string,
  mesh: { positions: number[]; indices: number[] },
  normals: number[],
  scale: number,
): IAutoMovieModelPart {
  return {
    id,
    name: id,
    geometry: {
      type: "mesh",
      mesh: {
        positions: mesh.positions.map((v: number): number => v * scale),
        normals,
        uvs: null,
        indices: mesh.indices,
        skin: null,
      },
    },
    material: "human." + name,
    attachedBone: null,
    transform: null,
  };
}

/** Opaque dielectric material of one linear colour. */
function material(
  name: string,
  colour: [number, number, number],
  doubleSided: boolean,
): IAutoMovieMaterial {
  return {
    id: "human." + name,
    name,
    baseColor: { r: colour[0], g: colour[1], b: colour[2], a: 1, hex: null },
    metallic: 0,
    roughness: 0.9,
    emissive: null,
    opacity: 1,
    baseColorTexture: null,
    doubleSided,
  };
}
