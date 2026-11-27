import type {
  IAutoMovieHumanBodyLane,
  IAutoMovieHumanBodyLaw,
  IAutoMovieHumanBodyMeasures,
  IAutoMovieHumanBodyPreparation,
  IAutoMovieHumanBodySources,
  IAutoMovieHumanExtremityDimensions,
  IAutoMovieHumanFootConstruction,
  IAutoMovieHumanFootFrame,
  IAutoMovieHumanHandMeasures,
  IAutoMovieHumanHeadInputs,
  IAutoMovieHumanHeadLane,
  IAutoMovieHumanLegConstruction,
  IAutoMovieHumanLegIdentity,
  IAutoMovieHumanParameters,
  IAutoMovieHumanSourceDefinition,
  IAutoMovieHumanSourceRealization,
  IAutoMovieHumanTrunkBuild,
  IAutoMovieHumanTrunkInputs,
} from "@automovie/interface";

import { AutoMovieHumanArmConstruction } from "./AutoMovieHumanArmConstruction";
import { AutoMovieHumanBodyAnatomy } from "./AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanBodyLane } from "./AutoMovieHumanBodyLane";
import { AutoMovieHumanBodyPreparation } from "./AutoMovieHumanBodyPreparation";
import { AutoMovieHumanFootConstruction } from "./AutoMovieHumanFootConstruction";
import { AutoMovieHumanHeadInputs } from "./AutoMovieHumanHeadInputs";
import { AutoMovieHumanHeadLane } from "./AutoMovieHumanHeadLane";
import { AutoMovieHumanLegCrotchHeight } from "./AutoMovieHumanLegCrotchHeight";

/**
 * The law from the public parameters to the body the generator lofts.
 *
 * Each original is authored in its own local section/parameter frame. Shared
 * anatomical datum and complete boundary descriptors place adjoining sources
 * without acquiring a completed neighbour. Assembly, actual raw lofts and final
 * calibration are separate explicit consumers.
 *
 * An unknown input takes the default `AutoMovieHumanBodyAnatomy.resolve`
 * derives from the person's own inputs and the surveys.
 */
export namespace AutoMovieHumanBodyLaw {
  /**
   * Resolve the exact production limb inputs without generating a body. This
   * lets source-curve checks read the same identity/units as calibration.
   *
   * @evidence contracts/common.md#principled-implementation Uses the same anatomy resolver and input conversion functions as calibrate; no generated geometry is queried.
   * @evidence contracts/common.md#clear-and-simple-design One record exposes the actual pre-skin definitions to production and curve inspection.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Supplied bilateral dimensions retain their own side and units without fixture overrides.
   * @evidence contracts/common.md#meaningful-documentation Separates input resolution from construction and states calibration units.
   * @evidence contracts/performance.md#efficient-algorithms Resolves fixed-size records without lofting any part or realizing a skin.
   * @evidence contracts/performance.md#reuse-equivalent-work Calibrate consumes this exact record instead of repeating a parallel input definition.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns owned input records and retains no person or generated object.
   */
  export function limbInputs(
    params: IAutoMovieHumanParameters,
  ): IAutoMovieHumanBodyLaw.ILimbInputs {
    const stature: number = statureOf(params);
    const legs: IAutoMovieHumanLegConstruction.IInputs = tapes(params, stature);
    return {
      stature,
      legs,
      arms: arms(params, legs.scale, legs.sex),
      feet: feet(params, legs),
      crotch: crotch(params, legs),
    };
  }

  /**
   * Resolve direct common anatomical definitions and explicit original
   * factories. Required neck constraints remain inside this call; requesting a
   * head, trunk constraint, raw chain or production assembly owns its
   * additional work.
   *
   * @param params Public input.
   * @returns Common local boundary/world frame and explicit family requests; no
   *   completed head, whole bind or tree.
   * @evidence contracts/common.md#principled-implementation Shares actual input/datum/section definitions with both original factories and explicit production completion.
   * @evidence contracts/common.md#clear-and-simple-design Separates common constraints, requested original families, placement completion and solid realization.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses actual production inputs and builders without substitute geometry, fixtures or fake completion.
   * @evidence contracts/common.md#meaningful-documentation Separates source diagnostics and anatomical placement from final joins and skin.
   * @evidence contracts/performance.md#efficient-algorithms Prepares actual common neck controls and their complete boundary; head calipers, trunk solve, body bones and raw remain explicit requests with separately observed costs.
   * @evidence contracts/performance.md#reuse-equivalent-work Full production completes these same definitions and explicit factories; no original reader acquires a whole neighbour to obtain a boundary.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns call-owned records and retains no person or generated body globally.
   */
  export function prepareSources(
    params: IAutoMovieHumanParameters,
  ): IAutoMovieHumanBodySources.IOriginal {
    const definitions: IAutoMovieHumanBodyLaw.ILimbInputs = limbInputs(params);
    const inputs: IAutoMovieHumanLegConstruction.IInputs = definitions.legs;
    const head: IAutoMovieHumanHeadInputs = headInputs(params);
    const trunkInputs: IAutoMovieHumanTrunkInputs =
      AutoMovieHumanBodyPreparation.trunkInputs(params, inputs);
    return AutoMovieHumanBodyPreparation.prepareSources({
      params,
      limbs: definitions,
      headInputs: head,
      trunkInputs,
    });
  }

  /**
   * Complete production metadata from the same common context; head and whole
   * bind records are explicitly requested here.
   */
  export function prepare(
    params: IAutoMovieHumanParameters,
    original?: IAutoMovieHumanBodySources.IOriginal,
  ): IAutoMovieHumanBodyPreparation.IOutput {
    return AutoMovieHumanBodyPreparation.complete(
      original ?? prepareSources(params),
    );
  }

  /**
   * Compose the complete production definition from one canonical preparation.
   * Regional exceptions remain original failures; callers observing only an
   * independent source use prepareSources and its actual original factories
   * instead.
   */
  export function define(
    params: IAutoMovieHumanParameters,
    prepared?: IAutoMovieHumanBodyPreparation.IOutput,
  ): IAutoMovieHumanBodyLaw.IDefinition {
    const context: IAutoMovieHumanBodyPreparation.IOutput =
      prepared ?? prepare(params);
    const headLane: IAutoMovieHumanHeadLane.IOutput =
      AutoMovieHumanHeadLane.create(
        context.headInputs,
        AutoMovieHumanBodyAnatomy.sexOf(params),
        context.neckSource,
        context.head,
      );
    const rawSources: Map<string, IAutoMovieHumanSourceRealization> =
      context.rawSources ?? new Map();
    context.rawSources = rawSources;
    const lane: IAutoMovieHumanBodyLane.IDefinition =
      AutoMovieHumanBodyLane.define({
        ...bodyInput(context),
        preparedTrunk: trunkSource(context),
        preparedSources: rawSources,
        head: headLane,
      });
    for (const source of lane.sources)
      if (source.result.loft !== null)
        rawSources.set(source.name, source.result);
    return {
      lane,
      prepared: context,
      standing: context.standing,
      head: headLane,
      skeleton: context.anatomy.bones,
      hands: context.anatomy.hands,
      stature: headLane.stature,
      neckRaw: context.neckRaw,
      diagnostics: [
        ...(context.standing.diagnostics ?? []),
        ...lane.diagnostics,
      ],
    };
  }

  /**
   * The same call-owned lazy body input consumed by full production and
   * selected original-source readers.
   */
  export function bodyInput(
    context: IAutoMovieHumanBodySources.IOriginal,
  ): IAutoMovieHumanBodyLane.IInput {
    return AutoMovieHumanBodyPreparation.bodyInput(context);
  }

  /**
   * Read the production trunk and its actual tape-pass parents without face
   * composition, raw lofts or unrelated limb/digit originals. Actual original
   * world2 preserves the old mass exterior clock without a raw parent surface.
   */
  export function trunkSource(
    context: IAutoMovieHumanBodySources.IOriginal,
  ): IAutoMovieHumanTrunkBuild.IOutput {
    return AutoMovieHumanBodyPreparation.trunkSource(context);
  }

  /**
   * Loft one requested final original once in this production context; no other
   * part or operator is realized.
   */
  export function trunkLoft(
    context: IAutoMovieHumanBodySources.IOriginal,
    name: string,
  ): IAutoMovieHumanSourceRealization | null {
    return AutoMovieHumanBodyPreparation.loft(context, name);
  }

  /**
   * Read a selected production original from this same context, without a raw
   * loft or unrelated regional composition.
   */
  export function original(
    context: IAutoMovieHumanBodySources.IOriginal,
    name: string,
  ): IAutoMovieHumanSourceDefinition | null {
    return AutoMovieHumanBodyPreparation.original(context, name);
  }

  /**
   * Complete the normal calibration by realizing its exact shared source
   * definition.
   *
   * @evidence contracts/common.md#principled-implementation Realizes the identical definition root and preserves the existing complete calibration fields.
   * @evidence contracts/common.md#clear-and-simple-design Keeps source assembly and full realization sequential and explicit.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Always performs full realization; the source inspection path is a separate typed definition.
   * @evidence contracts/common.md#meaningful-documentation Names the shared stage without presenting it as a completed body.
   * @evidence contracts/performance.md#efficient-algorithms Builds the source once and realizes it once.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses source metadata, head composition and bind joints directly.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Publishes fresh calibration records without retaining the definition globally.
   */
  export function calibrate(
    params: IAutoMovieHumanParameters,
  ): IAutoMovieHumanBodyLaw.IOutput {
    const definition: IAutoMovieHumanBodyLaw.IDefinition = define(params);
    const { standing, head: headLane, skeleton } = definition;
    const lane: IAutoMovieHumanBodyLane.IOutput =
      AutoMovieHumanBodyLane.realize(definition.lane);
    return {
      body: {
        ...standing,
        chains: lane.chains,
        events: [],
        poles: [],

        // Eye frames and attachments belong to the same generating head.

        // The lane's tree owns its trims; no old aperture assembly survives.
        apertures: [],
        eyes: headLane.eyes,
        head: headLane.landmarks,
        stature: headLane.stature,
        merges: undefined,
        bodies: lane.bodies,
        appendages: undefined,

        // The nail windows named stations of the old digit chains; nail

        // plates on the new digits remain (`log-body.md`).
        nails: undefined,
        diagnostics: [...(standing.diagnostics ?? []), ...lane.diagnostics],
        skeleton,
      },
      vermilion: headLane.vermilion,
    };
  }

  /**
   * Resolve the same foot dimensions as construction, in world millimetres,
   * without generating skin.
   */
  export function footDimensions(
    params: IAutoMovieHumanParameters,
  ): IAutoMovieHumanFootConstruction.IInputs {
    return feet(params, tapes(params, statureOf(params)));
  }

  /**
   * A shape prior's coordinate, derived from the person's measures: the shape
   * priors were fitted on three coordinates with no published definition, which
   * are no longer inputs. `masculineFeminine` is the end of the person's sex
   * ({@link AutoMovieHumanBodyAnatomy.sexCoordinate}), `fat` the adiposity the
   * measured fat percentage implies
   * ({@link AutoMovieHumanBodyAnatomy.adiposity}), and `muscularity` the priors'
   * mean body, zero: no published measure of lean mass is an input, and the
   * limbs' muscle follows their measured girths.
   *
   * @param params Public input.
   * @param name The coordinate.
   * @returns Its value, -1 to 1.
   */
  export function slider(
    params: IAutoMovieHumanParameters,
    name: "fat" | "muscularity" | "masculineFeminine",
  ): number {
    const measures: IAutoMovieHumanBodyMeasures =
      AutoMovieHumanBodyAnatomy.resolve(params);
    if (name === "masculineFeminine")
      return AutoMovieHumanBodyAnatomy.sexCoordinate(measures);
    if (name === "fat") return AutoMovieHumanBodyAnatomy.adiposity(measures);
    return 0;
  }

  /**
   * The head's inputs of a person, as {@link calibrate} builds the head: the
   * head identity, stature, neck length (the control, else its default from the
   * cervicale height), infrathyroid girth, base tape and three resolved neck
   * landmark heights, common ankle-relative C7 and the sex and fat sliders.
   * These direct inputs need no crotch/leg construction. Front neck X is a
   * dependent point of the shared base-course family, not a supplied section
   * maximum. Named heights do not assert a horizontal base section. The
   * standalone head and body consume this same generating input boundary.
   *
   * @param params Public input.
   * @returns The head construction's inputs, world mm.
   */
  export function headInputs(
    params: IAutoMovieHumanParameters,
  ): IAutoMovieHumanHeadInputs {
    const anatomy: IAutoMovieHumanBodyMeasures =
      AutoMovieHumanBodyAnatomy.resolve(params);
    return AutoMovieHumanHeadInputs.of(
      params,
      anatomy,
      slider(params, "masculineFeminine"),
      slider(params, "fat"),
    );
  }
}

/**
 * Height of the crotch by the inseam's definition (ISO 8559-1 5.7.6),
 * calibration mm.
 */
function crotch(
  params: IAutoMovieHumanParameters,
  inputs: IAutoMovieHumanLegConstruction.IInputs,
): number {
  const feet: NonNullable<IAutoMovieHumanParameters["extremities"]>["feet"] =
    params.extremities?.feet;
  const expected: number = AutoMovieHumanFootConstruction.expected(
    statureOf(params),
    inputs.sex,
    inputs.scale,
  ).ankle;
  return AutoMovieHumanLegCrotchHeight.of({
    inseam: AutoMovieHumanBodyAnatomy.resolve(params).inseam * inputs.scale,
    ankleHeight:
      feet === undefined
        ? expected
        : ((feet.left.ankleHeight + feet.right.ankleHeight) / 2) * inputs.scale,
  });
}

/** The person's stature, mm. */
function statureOf(params: IAutoMovieHumanParameters): number {
  return AutoMovieHumanBodyAnatomy.resolve(params).stature;
}

/**
 * The person's leg tapes in calibration millimetres: the world tape over the
 * stature scale the generator applies afterwards. An unknown tape or height
 * takes its default from `AutoMovieHumanBodyAnatomy.resolve`, an unknown slider
 * its neutral ({@link AutoMovieHumanBodyLaw.slider}).
 */
function tapes(
  params: IAutoMovieHumanParameters,
  stature: number,
): IAutoMovieHumanLegConstruction.IInputs {
  const scale: number = stature / statureOf(params);
  const measures: IAutoMovieHumanBodyMeasures =
    AutoMovieHumanBodyAnatomy.resolve(params);
  function free(name: "fat" | "muscularity" | "masculineFeminine"): number {
    return AutoMovieHumanBodyLaw.slider(params, name);
  }
  return {
    calf: measures.calfCircumference * scale,
    knee: measures.kneeCircumference * scale,
    thigh: measures.thighCircumference * scale,
    hip: measures.hipCircumference * scale,
    sex: free("masculineFeminine"),
    fat: free("fat"),
    muscularity: free("muscularity"),
    scale,
    furrow: measures.glutealFurrowHeight * scale,
  };
}

/** One foot's given measures, or none. */
type FootGiven =
  | Pick<
      IAutoMovieHumanLegIdentity,
      "footLength" | "footBreadth" | "ankleHeight"
    >
  | undefined;

/** One hand's given measures, or none. */
type HandGiven = IAutoMovieHumanExtremityDimensions["hands"] extends infer P
  ? P extends { left: infer H }
    ? H | undefined
    : never
  : never;

/**
 * The person's foot dimensions in calibration millimetres. A side without
 * measures takes what the body's own inputs expect.
 */
function feet(
  params: IAutoMovieHumanParameters,
  inputs: IAutoMovieHumanLegConstruction.IInputs,
): IAutoMovieHumanFootConstruction.IInputs {
  const expected: IAutoMovieHumanFootFrame.IDimensions =
    AutoMovieHumanFootConstruction.expected(
      statureOf(params),
      inputs.sex,
      inputs.scale,
    );
  function side(given: FootGiven): IAutoMovieHumanFootFrame.IDimensions {
    return given === undefined
      ? expected
      : {
          length: given.footLength * inputs.scale,
          breadth: given.footBreadth * inputs.scale,
          ankle: given.ankleHeight * inputs.scale,
        };
  }
  return {
    left: side(params.extremities?.feet?.left),
    right: side(params.extremities?.feet?.right),
    fat: inputs.fat,
    muscularity: inputs.muscularity,
    scale: inputs.scale,
  };
}

/**
 * The person's arm lengths, tapes and hand measures in calibration millimetres.
 * A side without measures takes what the body expects.
 */
function arms(
  params: IAutoMovieHumanParameters,
  scale: number,
  sex: number,
): IAutoMovieHumanBodyLaw.ILimbInputs["arms"] {
  const measures: IAutoMovieHumanBodyMeasures =
    AutoMovieHumanBodyAnatomy.resolve(params);
  const expected: IAutoMovieHumanHandMeasures =
    AutoMovieHumanArmConstruction.expected(
      statureOf(params),
      measures.handCircumference,
      scale,
    );
  function side(given: HandGiven): IAutoMovieHumanHandMeasures {
    return given === undefined
      ? expected
      : {
          length: given.handLength * scale,
          palm: given.palmLength * scale,
          breadth: given.handBreadth * scale,
          thumb: given.thumbLength * scale,
        };
  }
  return {
    upper: measures.upperArmLength * scale,
    lower: measures.forearmLength * scale,
    bicep: measures.upperArmCircumference * scale,
    bideltoid: measures.bideltoidBreadth * scale,
    elbow: measures.elbowCircumference * scale,
    forearm: measures.forearmCircumference * scale,
    wrist: measures.wristCircumference * scale,
    circumference: measures.handCircumference * scale,
    sex,
    left: side(params.extremities?.hands?.left),
    right: side(params.extremities?.hands?.right),
    scale,
  };
}
