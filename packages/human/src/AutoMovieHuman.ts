import type {
  IAutoMovieMesh,
  IAutoMovieModel,
  IAutoMovieModelPart,
} from "@automovie/interface";

import { AutoMovieHumanAppearance } from "./appearance/AutoMovieHumanAppearance";
import { AutoMovieHumanSkin } from "./appearance/AutoMovieHumanSkin";
import { AutoMovieHumanModelParts } from "./AutoMovieHumanModelParts";
import { AutoMovieHumanVermilion } from "./appearance/AutoMovieHumanVermilion";
import type { IAutoMovieHumanAppearanceBody } from "./appearance/IAutoMovieHumanAppearanceBody";
import { AutoMovieHumanBodyConstruction } from "./generation/AutoMovieHumanBodyConstruction";
import { AutoMovieHumanBodyLaw } from "./generation/AutoMovieHumanBodyLaw";
import { AutoMovieHumanBodySurface } from "./generation/AutoMovieHumanBodySurface";
import { AutoMovieHumanOralCavity } from "./generation/AutoMovieHumanOralCavity";
import type { IAutoMovieHumanBodyCalibration } from "./generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanStateAdmission } from "./instance/AutoMovieHumanStateAdmission";
import type { IAutoMovieHumanPrepared } from "./instance/IAutoMovieHumanPrepared";
import { AutoMovieHumanLoftMesh } from "./lofting/AutoMovieHumanLoftMesh";
import type { IAutoMovieHumanHermiteCurve } from "./lofting/IAutoMovieHumanHermiteCurve";
import { AutoMovieHumanRig } from "./skeleton/AutoMovieHumanRig";
import { AutoMovieHumanSkeleton } from "./skeleton/AutoMovieHumanSkeleton";
import type { IAutoMovieHumanGenerated } from "./structures/IAutoMovieHumanGenerated";
import type { IAutoMovieHumanParameters } from "./structures/IAutoMovieHumanParameters";
const { material, part }: typeof AutoMovieHumanModelParts = AutoMovieHumanModelParts;


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
 *   `AutoMovieHumanAppearance`, placed on the generated head;
 * - `human.mouth.<lining|gum.*|teeth.*|tongue>`: the mouth's interior behind
 *   the skin's opening along the lips' contact line
 *   (`AutoMovieHumanOralCavity`); an expression's mouth moves the lips,
 *   cheeks and tongue through `AutoMovieHumanMouthDeformation`.
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
 * settings. The model carries the rig and every skin part's binding
 * (`AutoMovieHumanRig`), so a pose moves the prepared skin without generating
 * it again: {@link AutoMovieHuman.prepare} returns that shape with its rig and
 * evaluator, and `AutoMovieHumanInstance` holds each instance's pose,
 * expression and root. Construction curves ride the same binding, and
 * expression fields are returned unchanged.
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
    return { parameters: params, model: construct(params).model };
  }

  /**
   * Generate the neutral body once and prepare it for independent posing.
   *
   * The returned shape is what {@link generate} returns plus the rig and a
   * clinical evaluator built from the same calibration, so posing it never
   * runs generation or the shape law again. `params.pose` and
   * `params.expression` are not applied to the shape: they are the initial
   * state of each instance (`AutoMovieHumanInstance`), which applies them
   * once.
   *
   * @param params Complete public input; returned unchanged as `parameters`.
   * @returns The prepared shape.
   */
  public static prepare(
    params: IAutoMovieHumanParameters,
  ): IAutoMovieHumanPrepared {
    const built: IConstructed = construct(params);
    const { pose: _pose, expression: _expression, ...shape } = params;
    return {
      parameters: params,
      model: built.model,
      skeleton: built.rig.skeleton,
      evaluate: AutoMovieHumanSkeleton.prepare(params, {
        calibration: built.calibration,
      }),
      key: AutoMovieHumanStateAdmission.key(shape),
    };
  }
}

/** What one construction yields beyond the model. */
interface IConstructed {
  /** The engine model at the bind. */
  model: IAutoMovieModel;

  /** The calibration the model was lofted from, in calibration mm. */
  calibration: IAutoMovieHumanBodyCalibration;

  /** The rig bound to the model. */
  rig: AutoMovieHumanRig.IRig;
}

/**
 * Generate one parameter set's model, keeping the calibration and rig that
 * {@link AutoMovieHuman.prepare} reuses.
 *
 * @param params Complete public input.
 */
function construct(params: IAutoMovieHumanParameters): IConstructed {
  // Stature is required: an unknown height would otherwise be silently
  // replaced by the calibration specimen's.
  const height: number | null = params.body.controls.height.value;
  if (height === null || !(height > 0))
    throw new Error("Human generation requires a positive height control");

  // The shape stages: calibration, skin pieces, construction, mouth and
  // rig, reused while the shape fields are unchanged (see `shaped`).
  const shapes: IShape = shaped(params, height);
  const {
    calibration,
    scale,
    skin,
    vermilion,
    interior,
    construction,
    rig,
  }: IShape = shapes;

  // Skin appearance is computed on the final pieces in calibration mm:
  // texture coordinates, regional albedo and relief weights. It reads the
  // shape and only `appearance.skin` and `pigmentation` besides, so a
  // dressing of this shape with the same two fields is reused.
  const dressing: string = AutoMovieHumanStateAdmission.key({
    skin: params.appearance?.skin,
    pigmentation: params.pigmentation,
  });
  const dressings: IShape["dressings"] = shapes.dressings;
  const reused: number = dressings.findIndex(
    (entry: IShape["dressings"][number]): boolean => entry.key === dressing,
  );
  const dressed: AutoMovieHumanSkin.IOutput =
    reused >= 0
      ? dressings.splice(reused, 1)[0]!.output
      : AutoMovieHumanSkin.generate({
          vermilion,
          params,
          pieces: skin,
          eyes: calibration.eyes,
          apertures: calibration.apertures,
          stature: calibration.stature,
          scale,
        });
  dressings.unshift({ key: dressing, output: dressed });
  dressings.length = Math.min(dressings.length, SHAPES_KEPT);

  const body: IAutoMovieModelPart[] = [
    ...dressed.parts,
    ...(interior?.parts ?? []),
    ...construction,
  ];

  // Appearance is placed on the generated body. Eye frames are the
  // calibrated eyeball globes behind the eyelid apertures, scaled with the
  // body into metres; the line of sight is forward (+X) and up is +Y.
  const eye: (side: "left" | "right") => IAutoMovieHumanAppearanceBody.IEye = (
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
    parts: bind([...body, ...appearance.parts], shapes),
    skeleton: rig.skeleton,
    body: null,
    materials: [
      ...dressed.materials,
      ...(interior?.materials ?? []),

      // Construction colours only separate the two layers on screen.
      material("construction.sections", [0.1, 0.35, 0.9], true),
      material("construction.axes", [0.9, 0.15, 0.1], true),
      material("construction.guides", [0.1, 0.6, 0.25], true),
      ...appearance.materials,
    ],
    images: [...dressed.images, ...appearance.images],
    asset: null,
  };
  return { model, calibration, rig };
}

/** The shape stages of one person: everything the shape fields decide. */
interface IShape {
  /** Calibration in calibration mm. */
  calibration: IAutoMovieHumanBodyCalibration;

  /** Calibration mm to model metres, including the stature scale. */
  scale: number;

  /** Skin pieces before dressing, calibration mm. */
  skin: AutoMovieHumanLoftMesh.IPiece[];

  /** Lips' colour boundary. */
  vermilion: AutoMovieHumanVermilion.IBoundary;

  /** Mouth interior, or null without a mouth aperture. */
  interior: AutoMovieHumanOralCavity.IOutput | null;

  /** Construction parts in model metres. */
  construction: IAutoMovieModelPart[];

  /** Rig bound to the calibration. */
  rig: AutoMovieHumanRig.IRig;

  /**
   * Skin dressings of this shape, most recently used first, by the
   * canonical text of `appearance.skin` and `pigmentation`; at most
   * {@link SHAPES_KEPT}.
   */
  dressings: { key: string; output: AutoMovieHumanSkin.IOutput }[];

  /**
   * Rig-bound meshes by source mesh and part id. A mesh reused by a later
   * generation (a kept dressing, construction or haircut) keeps its
   * binding; weak keys drop the binding with the mesh.
   */
  bound: WeakMap<IAutoMovieMesh, Map<string, IAutoMovieMesh>>;
}

/**
 * Bind every part to the shape's rig (`AutoMovieHumanRig.dress`), reusing
 * the binding of a mesh this shape has bound before under the same part id:
 * the binding reads only the rig, the positions and the id, all fixed for
 * that mesh object, so the same object proves the same work.
 *
 * @param parts Parts at the bind
 * @param shape Shape whose rig binds them
 * @returns Bound parts
 */
function bind(
  parts: IAutoMovieModelPart[],
  shape: IShape,
): IAutoMovieModelPart[] {
  const fresh: IAutoMovieModelPart[] = [];
  const out: (IAutoMovieModelPart | null)[] = parts.map(
    (part: IAutoMovieModelPart): IAutoMovieModelPart | null => {
      if (part.geometry.type !== "mesh") return part;
      const mesh: IAutoMovieMesh | undefined = shape.bound
        .get(part.geometry.mesh)
        ?.get(part.id);
      if (mesh === undefined) {
        fresh.push(part);
        return null;
      }
      return { ...part, geometry: { ...part.geometry, mesh } };
    },
  );
  const dressed: IAutoMovieModelPart[] = AutoMovieHumanRig.dress(
    fresh,
    shape.rig,
  );
  dressed.forEach((part: IAutoMovieModelPart, k: number): void => {
    const source: IAutoMovieModelPart = fresh[k]!;
    if (part.geometry.type !== "mesh" || source.geometry.type !== "mesh")
      return;
    let byId: Map<string, IAutoMovieMesh> | undefined = shape.bound.get(
      source.geometry.mesh,
    );
    if (byId === undefined) {
      byId = new Map();
      shape.bound.set(source.geometry.mesh, byId);
    }
    byId.set(part.id, part.geometry.mesh);
  });
  let next: number = 0;
  return out.map(
    (part: IAutoMovieModelPart | null): IAutoMovieModelPart => {
      if (part !== null) return part;
      return dressed[next++]!;
    },
  );
}

/**
 * The shape stages, reused across generations whose shape fields are equal.
 *
 * Dependencies: these stages read only `body`, `head`, `extremities` and
 * `supplement` (the shape law, the surface, its construction, the mouth
 * interior and the rig); `appearance.skin` and `pigmentation` reach the
 * skin's dressing, kept per shape in {@link IShape.dressings}; the rest of
 * `appearance` reaches the appearance layer, which runs every time and
 * reuses its own stages (`AutoMovieHumanHairStage`); and `pose` and
 * `expression` reach none of them. A generation whose shape fields have the
 * same canonical text (`AutoMovieHumanStateAdmission.key`, object keys
 * sorted) therefore reuses the calibration, skin pieces, construction,
 * interior and rig of the earlier one instead of lofting the body again, so
 * a hair, skin or garment edit costs only its own stages. The text is the
 * full input of these stages, so equal text proves equal work.
 *
 * Retention: the last {@link SHAPES_KEPT} shapes, most recent first. Every
 * model built from one shape shares its construction parts, skin pieces
 * and calibration, which no consumer may mutate.
 *
 * @param params Complete public input
 * @param height Stature, millimetres
 * @returns The shape stages
 */
function shaped(params: IAutoMovieHumanParameters, height: number): IShape {
  const key: string = AutoMovieHumanStateAdmission.key({
    body: params.body,
    head: params.head,
    extremities: params.extremities,
    supplement: params.supplement,
  });
  const at: number = SHAPES.findIndex(
    (entry: { key: string; shape: IShape }): boolean => entry.key === key,
  );
  const found: { key: string; shape: IShape } | undefined =
    at < 0 ? undefined : SHAPES.splice(at, 1)[0];
  const entry: { key: string; shape: IShape } = found ?? {
    key,
    shape: shape(params, height),
  };
  SHAPES.unshift(entry);
  SHAPES.length = Math.min(SHAPES.length, SHAPES_KEPT);
  return entry.shape;
}

/** Shapes kept for reuse: the current person and the one before. */
const SHAPES_KEPT: number = 2;

/** Shapes, most recently used first; see {@link shaped}. */
const SHAPES: { key: string; shape: IShape }[] = [];

/**
 * Compute the shape stages of one parameter set.
 *
 * @param params Complete public input
 * @param height Stature, millimetres
 * @returns The shape stages
 */
function shape(params: IAutoMovieHumanParameters, height: number): IShape {
  // The shape law gives this person's calibration in calibration mm; the
  // skin, its construction, the lips, eyes and apertures all read it.
  const law: AutoMovieHumanBodyLaw.IOutput =
    AutoMovieHumanBodyLaw.calibrate(params);
  const calibration: IAutoMovieHumanBodyCalibration = law.body;
  const lips: IAutoMovieHumanHermiteCurve = law.vermilion;

  // Uniform stature scale about the floor origin, then mm -> m for the
  // engine, whose model units are metres.
  const scale: number = height / calibration.stature / 1000;

  // The lips' colour boundary is drawn per vertex, so the skin is refined
  // in a box 3 mm around it.
  const ends: [number, number, number][] = lips.spans.flatMap(
    (
      s: IAutoMovieHumanHermiteCurve["spans"][number],
    ): [number, number, number][] => [s.start, s.end],
  );
  const box: [[number, number, number], [number, number, number]] = [
    [0, 1, 2].map(
      (k: number): number =>
        Math.min(...ends.map((p: [number, number, number]): number => p[k]!)) -
        3,
    ) as [number, number, number],
    [0, 1, 2].map(
      (k: number): number =>
        Math.max(...ends.map((p: [number, number, number]): number => p[k]!)) +
        3,
    ) as [number, number, number],
  ];
  const surface: AutoMovieHumanBodySurface.IOutput =
    AutoMovieHumanBodySurface.generate(calibration, [box]);
  const skin: AutoMovieHumanLoftMesh.IPiece[] = AutoMovieHumanLoftMesh.split(
    surface.mesh,
    surface.normals,
  );
  const curves: AutoMovieHumanBodyConstruction.ICurve[] =
    AutoMovieHumanBodyConstruction.generate(calibration, surface.construction);

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

  // The mouth's interior behind the rim the `mouth` aperture cut.
  const opening = calibration.apertures.find((a): boolean => a.name === "mouth");
  const interior: AutoMovieHumanOralCavity.IOutput | null =
    calibration.mouth === undefined || opening === undefined
      ? null
      : AutoMovieHumanOralCavity.generate(
          surface.mesh,
          calibration.mouth,
          opening,
          scale,
        );

  const construction: IAutoMovieModelPart[] = curves.map(
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

  const rig: AutoMovieHumanRig.IRig = AutoMovieHumanRig.prepare(
    calibration,
    scale,
  );
  return {
    calibration,
    scale,
    skin,
    vermilion,
    interior,
    construction,
    rig,
    dressings: [],
    bound: new WeakMap(),
  };
}
