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
 * - `human.cavity.<chain>/<k>`: that interval's skin deep in a closed
 *   pocket such as a nostril, under its own dim material;
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
    const height: number = stature(params);

    // The shape law gives this person's calibration in calibration mm; the
    // skin, its construction, the lips, eyes and apertures all read it.
    const law: AutoMovieHumanBodyLaw.IOutput =
      AutoMovieHumanBodyLaw.calibrate(params);
    const calibration: IAutoMovieHumanBodyCalibration = law.body;
    const scale: number = height / calibration.stature / 1000;
    const lofted: ILofted = loft(calibration, law.vermilion);

    // Skin appearance is computed on the final pieces in calibration mm:
    // texture coordinates, regional albedo and relief weights.
    const dressed: AutoMovieHumanSkin.IOutput = AutoMovieHumanSkin.generate({
      vermilion: lofted.vermilion!,
      params,
      pieces: lofted.pieces,
      eyes: calibration.eyes,
      apertures: calibration.apertures,
      stature: calibration.stature,
      scale,
    });

    const body: IAutoMovieModelPart[] = [
      ...dressed.parts,
      ...construction(lofted.curves, scale),
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
        ...CONSTRUCTION_MATERIALS,
        ...appearance.materials,
      ],
      images: [...dressed.images, ...appearance.images],
      asset: null,
    };
    return { parameters: params, model };
  }

  /**
   * Loft a given calibration's skin and lofting curves, without skin
   * dressing or appearance, to inspect a calibration other than the shape
   * law's, such as the modules fitted so far.
   *
   * The skin, its construction curves and the lip path are lofted by the
   * same stage as {@link generate} and scaled by the height control. The skin
   * parts `human.skin.<chain>/<k>` share one plain `human.skin` material of
   * the viewer's clay grey; no `human.cavity.` part, eye, hair or garment is
   * made, since skin dressing and appearance read the whole body by chain
   * name and the eye globes, which a partial calibration lacks.
   *
   * @param params Complete public input; only the height control is read.
   * @param calibration Calibration to loft, in calibration mm.
   * @param lips The lips' colour boundary in the calibration's world, or
   *   null when the calibration has no lips.
   * @returns The parameters and the skin-and-curves model in metres.
   */
  public static generateBody(
    params: IAutoMovieHumanParameters,
    calibration: IAutoMovieHumanBodyCalibration,
    lips: IAutoMovieHumanHermiteCurve | null,
  ): IAutoMovieHumanGenerated {
    const scale: number = stature(params) / calibration.stature / 1000;
    const lofted: ILofted = loft(calibration, lips);
    const model: IAutoMovieModel = {
      id: "automovie-human",
      name: "Human",
      origin: "generated",
      parts: [
        ...lofted.pieces.map(
          (piece: AutoMovieHumanLoftMesh.IPiece): IAutoMovieModelPart =>
            part(
              "human.skin." + piece.name,
              "skin",
              piece,
              piece.normals,
              scale,
            ),
        ),
        ...construction(lofted.curves, scale),
      ],
      skeleton: null,
      body: null,
      materials: [
        material("skin", [0.5, 0.5, 0.5], false),
        ...CONSTRUCTION_MATERIALS,
      ],
      images: [],
      asset: null,
    };
    return { parameters: params, model };
  }
}

/** The skin pieces, construction curves and lip boundary of one calibration. */
interface ILofted {
  /** Skin pieces `<chain>/<k>` in calibration mm. */
  pieces: AutoMovieHumanLoftMesh.IPiece[];

  /** Construction curves, the lip path included, in calibration mm. */
  curves: AutoMovieHumanBodyConstruction.ICurve[];

  /** The lips' prepared boundary, or null without lips. */
  vermilion: AutoMovieHumanVermilion.IBoundary | null;
}

/**
 * The height control in mm, the uniform stature scale's numerator (scaled
 * about the floor origin, then mm -> m for the engine, whose model units are
 * metres). Stature is required, since an unknown height would otherwise be
 * silently replaced by the calibration specimen's.
 */
function stature(params: IAutoMovieHumanParameters): number {
  const height: number | null = params.body.controls.height.value;
  if (height === null || !(height > 0))
    throw new Error("Human generation requires a positive height control");
  return height;
}

/**
 * Loft a calibration: the surface, its pieces by curve interval, the
 * construction curves and the lip path. The lips' colour boundary is drawn
 * per vertex, so the skin is refined in a box 3 mm around it.
 *
 * @param calibration Calibration to loft, in calibration mm.
 * @param lips The lips' colour boundary, or null for no lips and no box.
 */
function loft(
  calibration: IAutoMovieHumanBodyCalibration,
  lips: IAutoMovieHumanHermiteCurve | null,
): ILofted {
  const ends: [number, number, number][] = (lips?.spans ?? []).flatMap(
    (
      s: IAutoMovieHumanHermiteCurve["spans"][number],
    ): [number, number, number][] => [s.start, s.end],
  );
  const boxes: [[number, number, number], [number, number, number]][] =
    ends.length === 0
      ? []
      : [
          [
            [0, 1, 2].map(
              (k: number): number =>
                Math.min(
                  ...ends.map((p: [number, number, number]): number => p[k]!),
                ) - 3,
            ) as [number, number, number],
            [0, 1, 2].map(
              (k: number): number =>
                Math.max(
                  ...ends.map((p: [number, number, number]): number => p[k]!),
                ) + 3,
            ) as [number, number, number],
          ],
        ];
  const surface: AutoMovieHumanBodySurface.IOutput =
    AutoMovieHumanBodySurface.generate(calibration, boxes);
  const pieces: AutoMovieHumanLoftMesh.IPiece[] = AutoMovieHumanLoftMesh.split(
    surface.mesh,
    surface.normals,
  );
  const curves: AutoMovieHumanBodyConstruction.ICurve[] =
    AutoMovieHumanBodyConstruction.generate(calibration, surface.construction);
  if (lips === null) return { pieces, curves, vermilion: null };

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
  return { pieces, curves, vermilion };
}

/** Construction parts of lofting curves, scaled into metres. */
function construction(
  curves: readonly AutoMovieHumanBodyConstruction.ICurve[],
  scale: number,
): IAutoMovieModelPart[] {
  return curves.map(
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
  );
}

/** Construction colours; they only separate the two layers on screen. */
const CONSTRUCTION_MATERIALS: IAutoMovieMaterial[] = [
  material("construction.sections", [0.1, 0.35, 0.9], true),
  material("construction.axes", [0.9, 0.15, 0.1], true),
  material("construction.guides", [0.1, 0.6, 0.25], true),
];

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
