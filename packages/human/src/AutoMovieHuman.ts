import type { IAutoMovieModel, IAutoMovieModelPart } from "@automovie/interface";

import { AutoMovieHumanAppearance } from "./appearance/AutoMovieHumanAppearance";
import { AutoMovieHumanSkin } from "./appearance/AutoMovieHumanSkin";
import type { IAutoMovieHumanAppearanceBody } from "./appearance/IAutoMovieHumanAppearanceBody";
import { AutoMovieHumanModelParts } from "./AutoMovieHumanModelParts";
import { AutoMovieHumanShapeStages } from "./AutoMovieHumanShapeStages";
import type { IAutoMovieHumanBodyCalibration } from "./generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanStateAdmission } from "./instance/AutoMovieHumanStateAdmission";
import type { IAutoMovieHumanPrepared } from "./instance/IAutoMovieHumanPrepared";
import type { AutoMovieHumanLoftContract } from "./lofting/AutoMovieHumanLoftContract";
import type { AutoMovieHumanRig } from "./skeleton/AutoMovieHumanRig";
import { AutoMovieHumanSkeleton } from "./skeleton/AutoMovieHumanSkeleton";
import type { IAutoMovieHumanGenerated } from "./structures/IAutoMovieHumanGenerated";
import type { IAutoMovieHumanParameters } from "./structures/IAutoMovieHumanParameters";
import { AutoMovieHumanBodyAnatomy } from "./generation/AutoMovieHumanBodyAnatomy";
const { material }: typeof AutoMovieHumanModelParts = AutoMovieHumanModelParts;


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
 * the stature (`AutoMovieHumanBodyAnatomy.resolve`) then scales it uniformly. `pigmentation` and
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
   * The contracts optional pieces broke while this person's figure was made,
   * each piece replaced by its base (`construction-levels.md`, totality): the
   * calibration's (body pieces), the mouth's and the appearance's (hair,
   * brows, lashes, garments). Empty for a sound figure; the universality test
   * fails on any entry.
   *
   * @param params Complete public input.
   * @returns The diagnostics, in the order the stages recorded them.
   */
  public static diagnose(params: IAutoMovieHumanParameters): AutoMovieHumanLoftContract.IDiagnostic[] {
    return construct(params).diagnostics;
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

  /**
   * Contracts optional pieces broke while the figure was made, each piece
   * replaced by its base: the shape's (mouth, body pieces) and the
   * appearance's (hair, brows, lashes). Empty for a sound figure.
   */
  diagnostics: AutoMovieHumanLoftContract.IDiagnostic[];
}

/**
 * Generate one parameter set's model, keeping the calibration and rig that
 * {@link AutoMovieHuman.prepare} reuses.
 *
 * @param params Complete public input.
 */
function construct(params: IAutoMovieHumanParameters): IConstructed {
  // Stature is the person's, or its survey mean by sex when unknown
  // (`AutoMovieHumanBodyAnatomy.resolve`).
  const height: number = AutoMovieHumanBodyAnatomy.resolve(params).stature;
  if (!(height > 0)) throw new Error("Human generation requires a positive stature");

  // The shape stages: calibration, skin pieces, construction, mouth and
  // rig, reused while the shape fields are unchanged (see `AutoMovieHumanShapeStages.shaped`).
  const shapes: AutoMovieHumanShapeStages.IShape = AutoMovieHumanShapeStages.shaped(params, height);
  const {
    calibration,
    scale,
    skin,
    vermilion,
    interior,
    construction,
    rig,
  }: AutoMovieHumanShapeStages.IShape = shapes;

  // Skin appearance is computed on the final pieces in calibration mm:
  // texture coordinates, regional albedo and relief weights. It reads the
  // shape and only `appearance.skin` and `pigmentation` besides, so a
  // dressing of this shape with the same two fields is reused.
  const dressing: string = AutoMovieHumanStateAdmission.key({
    skin: params.appearance?.skin,
    pigmentation: params.pigmentation,
  });
  const dressings: AutoMovieHumanShapeStages.IShape["dressings"] = shapes.dressings;
  const reused: number = dressings.findIndex(
    (entry: AutoMovieHumanShapeStages.IShape["dressings"][number]): boolean => entry.key === dressing,
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
          chains: calibration.chains,
          nails: calibration.nails ?? [],
        });
  dressings.unshift({ key: dressing, output: dressed });
  dressings.length = Math.min(dressings.length, AutoMovieHumanShapeStages.KEPT);

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
    parts: AutoMovieHumanShapeStages.bind([...body, ...appearance.parts], shapes),
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
  return { model, calibration, rig, diagnostics: [...shapes.diagnostics, ...appearance.diagnostics] };
}
