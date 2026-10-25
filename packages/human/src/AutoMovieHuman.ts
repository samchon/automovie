import type {
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";

import { AutoMovieHumanAppearance } from "./appearance/AutoMovieHumanAppearance";
import { AutoMovieHumanSkin } from "./appearance/AutoMovieHumanSkin";
import { AutoMovieHumanVermilion } from "./appearance/AutoMovieHumanVermilion";
import type { IAutoMovieHumanAppearanceBody } from "./appearance/IAutoMovieHumanAppearanceBody";
import { AutoMovieHumanBodyConstruction } from "./generation/AutoMovieHumanBodyConstruction";
import { AutoMovieHumanBodyLaw } from "./generation/AutoMovieHumanBodyLaw";
import { AutoMovieHumanBodySurface } from "./generation/AutoMovieHumanBodySurface";
import type { IAutoMovieHumanBodyCalibration } from "./generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanLoftMesh } from "./lofting/AutoMovieHumanLoftMesh";
import type { IAutoMovieHumanHermiteCurve } from "./lofting/IAutoMovieHumanHermiteCurve";
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
 * - `human.construction.<chain>/g<j>`: a guide, the fixed-phase Hermite curve
 *   carrying the sections along the chain;
 * - `human.eye.<side>.<sclera|iris|cornea>`: appearance parts from
 *   `AutoMovieHumanAppearance`, placed on the generated head.
 *
 * Skin normals are computed on the whole closed skin before it is split,
 * so the parts render as one continuous surface. `AutoMovieHumanSkin` then
 * dresses the split pieces with texture coordinates, per-vertex albedo and
 * relief weights and supplies the `human.skin` material and its generated
 * images. The viewer's overlay and construction passes show the
 * `human.construction.` parts.
 *
 * Current parameter consumption: `AutoMovieHumanBodyLaw` maps the body
 * controls it reads to this person's calibration, and
 * `body.controls.height` then scales it uniformly. `pigmentation` and
 * `appearance.skin` drive the skin material (see `AutoMovieHumanSkin`), and
 * the appearance layer consumes its eye, hair, brow, lash and underwear
 * settings. Body controls the law does not read, pose and expression fields
 * are returned unchanged without a skin shape or deformation response yet;
 * their laws belong to later campaign stages.
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

    // The shape law gives this person's calibration in calibration mm; the
    // skin, its construction, the lips, eyes and apertures all read it.
    const law: AutoMovieHumanBodyLaw.IOutput =
      AutoMovieHumanBodyLaw.calibrate(params);
    const calibration: IAutoMovieHumanBodyCalibration = law.body;
    const lips: IAutoMovieHumanHermiteCurve = law.vermilion;

    // Uniform stature scale about the floor origin, then mm -> m for the
    // engine, whose model units are metres.
    const scale: number = height / calibration.stature / 1000;

    const surface: AutoMovieHumanBodySurface.IOutput =
      AutoMovieHumanBodySurface.generate(calibration);
    const skin: AutoMovieHumanLoftMesh.IPiece[] = AutoMovieHumanLoftMesh.split(
      surface.mesh,
      surface.normals,
    );
    const curves: AutoMovieHumanBodyConstruction.ICurve[] =
      AutoMovieHumanBodyConstruction.generate(
        calibration,
        surface.construction,
      );

    const vermilion: AutoMovieHumanVermilion.IBoundary =
      AutoMovieHumanVermilion.prepare(lips);
    curves.push(
      ...AutoMovieHumanBodyConstruction.paths([
        {
          id: lips.chain + "/" + lips.name.replaceAll(".", "_"),
          points: vermilion.points,
          closed: true,
        },
      ]),
    );

    // Skin appearance is computed on the final pieces in calibration mm:
    // texture coordinates, regional albedo and relief weights.
    const dressed: AutoMovieHumanSkin.IOutput = AutoMovieHumanSkin.generate({
      vermilion,
      params,
      pieces: skin,
      eyes: calibration.eyes,
      apertures: calibration.apertures,
      stature: calibration.stature,
      scale,
    });

    const body: IAutoMovieModelPart[] = [
      ...dressed.parts,
      ...curves.map(
        (curve: AutoMovieHumanBodyConstruction.ICurve): IAutoMovieModelPart =>
          part(
            "human.construction." + curve.id,
            curve.kind === "axis"
              ? "construction.axes"
              : curve.kind === "guide"
                ? "construction.guides"
                : "construction.sections",
            curve.mesh,
            AutoMovieHumanLoftMesh.normals(curve.mesh),
            scale,
          ),
      ),
    ];

    // Appearance is placed on the generated body. Eye frames are the
    // calibrated eyeball globes behind the eyelid apertures, scaled with the
    // body into metres; the line of sight is forward (+X) and up is +Y.
    const eye: (
      side: "left" | "right",
    ) => IAutoMovieHumanAppearanceBody.IEye = (
      side: "left" | "right",
    ): IAutoMovieHumanAppearanceBody.IEye => {
      const found: IAutoMovieHumanBodyCalibration.IEye | undefined =
        calibration.eyes.find(
          (e: IAutoMovieHumanBodyCalibration.IEye): boolean => e.side === side,
        );
      if (found === undefined)
        throw new Error(`Calibration lacks the ${side} eye`);
      return {
        centre: [
          found.centre[0] * scale,
          found.centre[1] * scale,
          found.centre[2] * scale,
        ],
        forward: [1, 0, 0],
        up: [0, 1, 0],

        // Radius of the sphere fitted to the visible eye surface; the
        // appearance layer seats its globe against it.
        radius: found.radius * scale,
      };
    };
    const appearance: AutoMovieHumanAppearance.IOutput =
      AutoMovieHumanAppearance.generate(params, {
        eyePair: { left: eye("left"), right: eye("right") },
        parts: body,
        calibration,
      });

    const model: IAutoMovieModel = {
      id: "automovie-human",
      name: "Human",
      origin: "generated",
      parts: [...body, ...appearance.parts],
      skeleton: null,
      body: null,
      materials: [
        ...dressed.materials,

        // Construction colours only separate the two layers on screen.
        material("construction.sections", [0.1, 0.35, 0.9], true),
        material("construction.axes", [0.9, 0.15, 0.1], true),
        material("construction.guides", [0.1, 0.6, 0.25], true),
        ...appearance.materials,
      ],
      images: [...dressed.images, ...appearance.images],
      asset: null,
    };
    return { parameters: params, model };
  }
}

/**
 * Mesh part from millimetre buffers, scaled into metres.
 *
 * @param id Part id: `human.construction.<curve id>`.
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
