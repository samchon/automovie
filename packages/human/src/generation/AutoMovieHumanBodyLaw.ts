import type { IAutoMovieHumanHermiteCurve } from "../lofting/IAutoMovieHumanHermiteCurve";
import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import type { IAutoMovieHumanExtremityDimensions } from "../structures/body/IAutoMovieHumanExtremityDimensions";
import type { IAutoMovieHumanLegIdentity } from "../structures/body/IAutoMovieHumanLegIdentity";
import { AutoMovieHumanSkeletonLaw } from "./AutoMovieHumanSkeletonLaw";
import { AutoMovieHumanBodyAnatomy } from "./AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanBodyBox } from "./AutoMovieHumanBodyBox";
import { AutoMovieHumanSex } from "../typings/AutoMovieHumanSex";
import { AutoMovieHumanArmConstruction } from "./AutoMovieHumanArmConstruction";
import { AutoMovieHumanBodyLane } from "./AutoMovieHumanBodyLane";
import { AutoMovieHumanBodyLaneInterim } from "./AutoMovieHumanBodyLaneInterim";
import { AutoMovieHumanFootConstruction } from "./AutoMovieHumanFootConstruction";
import type { IAutoMovieHumanHeadInputs } from "./IAutoMovieHumanHeadInputs";
import { AutoMovieHumanHeadLane } from "./head/AutoMovieHumanHeadLane";
import { AutoMovieHumanHeadPrior } from "./AutoMovieHumanHeadPrior";
import { AutoMovieHumanLegConstruction } from "./AutoMovieHumanLegConstruction";
import { AutoMovieHumanLegCrotchHeight } from "./leg/AutoMovieHumanLegCrotchHeight";
import { AutoMovieHumanNeckConstruction } from "./AutoMovieHumanNeckConstruction";
import { AutoMovieHumanNeckSource } from "./AutoMovieHumanNeckSource";
import { AutoMovieHumanTrunkConstruction } from "./AutoMovieHumanTrunkConstruction";

import type { AutoMovieLoftContract, IAutoMovieLoftChain } from "@automovie/engine";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanBodyMeasures } from "./IAutoMovieHumanBodyMeasures";
import { AutoMovieHumanHeadAnatomy } from "./AutoMovieHumanHeadAnatomy";
import type { AutoMovieHumanHandBones } from "./hand/AutoMovieHumanHandBones";

/**
 * The law from the public parameters to the body the generator lofts.
 *
 * Every chain is generated, from the top down, each from its neighbour's ring
 * and the person's inputs, in world millimetres: the head's rise sets where the
 * neck ends, the neck carries the shoulders, and the column runs from them to
 * the crotch's height. The skeleton then stands in that root, and the limbs are
 * lofted on it. The event join settles every shared ring, once for all of them.
 *
 * An unknown input takes the default `AutoMovieHumanBodyAnatomy.resolve`
 * derives from the person's own inputs and the surveys.
 */
export namespace AutoMovieHumanBodyLaw {
  /** Public limb definitions shared by construction and source-curve inspection, before any skin. */
  export interface ILimbInputs {
    /** Stature in calibration mm. */
    stature: number;
    /** Leg tapes, anatomical controls and calibration scale. */
    legs: AutoMovieHumanLegConstruction.IInputs;
    /** Arm tapes and each hand's own dimensions, calibration mm. */
    arms: AutoMovieHumanArmConstruction.IInputs;
    /** Each foot's own dimensions, calibration mm. */
    feet: AutoMovieHumanFootConstruction.IInputs;
    /** Crotch height by the inseam definition, calibration mm. */
    crotch: number;
  }

  /**
   * Resolve the exact production limb inputs without generating a body.
   * This lets source-curve checks read the same identity/units as calibration.
   *
   * @evidence contracts/common.md#principled-implementation Uses the same anatomy resolver and input conversion functions as calibrate; no generated geometry is queried.
   * @evidence contracts/common.md#clear-and-simple-design One record exposes the actual pre-skin definitions to production and curve inspection.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Supplied bilateral dimensions retain their own side and units without fixture overrides.
   * @evidence contracts/common.md#meaningful-documentation Separates input resolution from construction and states calibration units.
   * @evidence contracts/performance.md#efficient-algorithms Resolves fixed-size records without lofting any part or realizing a skin.
   * @evidence contracts/performance.md#reuse-equivalent-work Calibrate consumes this exact record instead of repeating a parallel input definition.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns owned input records and retains no person or generated object.
   */
  export function limbInputs(params: IAutoMovieHumanParameters): ILimbInputs {
    const stature: number = statureOf(params);
    const legs: AutoMovieHumanLegConstruction.IInputs = tapes(params, stature);
    return { stature, legs, arms: arms(params, legs.scale, legs.sex), feet: feet(params, legs), crotch: crotch(params, legs) };
  }

  /** Calibrations for one parameter set. */
  export interface IOutput {
    /** Body chains, events, poles, apertures and globes in calibration mm. */
    body: IAutoMovieHumanBodyCalibration;

    /** Exterior lip boundary in the same frame. */
    vermilion: IAutoMovieHumanHermiteCurve;
  }

  /** The shared production source assembly, explicitly before final solid realization. */
  export interface IDefinition {
    /** The exact body tree and source premises consumed by calibration. */
    lane: AutoMovieHumanBodyLane.IDefinition;
    /** Existing neck/trunk metadata retained for the completed calibration. */
    standing: IAutoMovieHumanBodyCalibration;
    /** The actual generating head, including its identical composer source. */
    head: AutoMovieHumanHeadLane.IOutput;
    /** Anatomically placed bind joints used by these same source parts. */
    skeleton: AutoMovieHumanSkeletonLaw.IBone[];
    /** Identical hand definitions shared by bind joints and original digit curves. */
    hands: Record<"left" | "right", AutoMovieHumanHandBones.IOutput>;
    /** Stature in the calibration's millimetres. */
    stature: number;
    /** Engine-evaluated internal interval of this head's actual source, for remaining trunk readers. */
    neckChain: IAutoMovieLoftChain;
    /** Anatomy and source assembly diagnostics; final joins have not run. */
    diagnostics: AutoMovieLoftContract.IDiagnostic[];
  }

  /**
   * The production source assembly for one parameter set.
   *
   * @param params Public input.
   * @returns The real definition, not a completed calibration.
   * @evidence contracts/common.md#principled-implementation Shares the existing input, head, neck, trunk and skeleton assembly with full calibration.
   * @evidence contracts/common.md#clear-and-simple-design Defines one typed boundary before the body's solid realization.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses actual production inputs and builders without substitute geometry, fixtures or fake completion.
   * @evidence contracts/common.md#meaningful-documentation Separates source diagnostics and anatomical placement from final joins and skin.
   * @evidence contracts/performance.md#efficient-algorithms Builds one set of source parts and one production tree.
   * @evidence contracts/performance.md#reuse-equivalent-work Calibration realizes this same definition instead of maintaining parallel source assembly.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns call-owned records and retains no person or generated body globally.
   */
  export function define(params: IAutoMovieHumanParameters): IDefinition {
    const definitions: ILimbInputs = limbInputs(params);
    const inputs: AutoMovieHumanLegConstruction.IInputs = definitions.legs;
    const head: IAutoMovieHumanHeadInputs = headInputs(params);
    const trunkInputs: AutoMovieHumanTrunkConstruction.IInputs = column(
      params,
      inputs,
    );
    const neckSource: AutoMovieHumanNeckSource.IOutput = AutoMovieHumanNeckSource.of(head, inputs.scale);

    // The one head lane owns its construction, eyes and attachments. The
    // eye frames now use its orbit socket definition; this deliberately
    // changes the old globe seat, rather than preserving a second head.
    const headLane: AutoMovieHumanHeadLane.IOutput = AutoMovieHumanHeadLane.create(head, AutoMovieHumanBodyAnatomy.sexOf(params), neckSource);
    const neck: AutoMovieHumanNeckConstruction.IOutput = AutoMovieHumanNeckConstruction.generate(headLane.source.massPart, neckSource);
    if (neck.loft.chain === null) throw new Error(`The actual head-source neck interval made no chain: ${JSON.stringify(neck.loft.diagnostics)}`);
    const neckRing: IAutoMovieLoftChain = neck.loft.chain;
    const headed: IAutoMovieHumanBodyCalibration = {
      stature: headLane.stature,
      chains: [neckRing],
      events: [],
      poles: [],
      apertures: [],
      eyes: headLane.eyes,
      head: headLane.landmarks,
      diagnostics: [...AutoMovieHumanBodyBox.diagnose(AutoMovieHumanBodyAnatomy.resolve(params)), ...neck.loft.diagnostics],
    };
    const crotchHeight: number = definitions.crotch;
    const standing: IAutoMovieHumanBodyCalibration =
      AutoMovieHumanTrunkConstruction.apply(
        headed,
        trunkInputs,
        crotchHeight,
      );

    // The skeleton stands in the head, neck and trunk before any limb exists,
    // and the limbs are lofted on it.
    const armInputs: AutoMovieHumanArmConstruction.IInputs = definitions.arms;
    const footInputs: AutoMovieHumanFootConstruction.IInputs = definitions.feet;
    if (standing.trunk === undefined) throw new Error("The body definition lacks trunk landmarks");
    const anatomical: AutoMovieHumanSkeletonLaw.IOutput =
      AutoMovieHumanSkeletonLaw.define(standing, {
        arms: armInputs,
        feet: footInputs,
        legs: inputs,
        trunk: standing.trunk,
        head: headLane,
        sex: AutoMovieHumanBodyAnatomy.sexOf(params),
      });
    const skeleton: AutoMovieHumanSkeletonLaw.IBone[] = anatomical.bones;

    // The body lane: every body part from its views, joined by solid merges
    // (#3047 to #3051), the trunk taking the neck's bottom ring by the head's
    // down event at its far end.
    // The head: its construction subtree (`AutoMovieHumanHeadLane`) on the
    // neck ring, merged onto the trunk inside the body's one realization.
    const lane: AutoMovieHumanBodyLane.IDefinition = AutoMovieHumanBodyLane.define({
      ...AutoMovieHumanBodyLaneInterim.of({
        params,
        scale: inputs.scale,
        stature: standing.stature,
        crotch: crotchHeight,
        trunk: trunkInputs,
        neck: neckRing,
        feet: footInputs,
        skeleton,
        hands: anatomical.hands,
        arms: armInputs,
      }),
      head: headLane,
    });
    return { lane, standing, head: headLane, skeleton, hands: anatomical.hands, stature: headLane.stature, neckChain: neckRing, diagnostics: [...(standing.diagnostics ?? []), ...lane.diagnostics] };
  }

  /**
   * Complete the normal calibration by realizing its exact shared source definition.
   * @evidence contracts/common.md#principled-implementation Realizes the identical definition root and preserves the existing complete calibration fields.
   * @evidence contracts/common.md#clear-and-simple-design Keeps source assembly and full realization sequential and explicit.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Always performs full realization; the source inspection path is a separate typed definition.
   * @evidence contracts/common.md#meaningful-documentation Names the shared stage without presenting it as a completed body.
   * @evidence contracts/performance.md#efficient-algorithms Builds the source once and realizes it once.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses source metadata, head composition and bind joints directly.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Publishes fresh calibration records without retaining the definition globally.
   */
  export function calibrate(params: IAutoMovieHumanParameters): IOutput {
    const definition: IDefinition = define(params);
    const { standing, head: headLane, skeleton } = definition;
    const lane: AutoMovieHumanBodyLane.IOutput = AutoMovieHumanBodyLane.realize(definition.lane);
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
   * A shape prior's coordinate, derived from the person's measures: the shape
   * priors were fitted on three coordinates with no published definition, which
   * are no longer inputs. `masculineFeminine` is the end of the person's sex
   * ({@link AutoMovieHumanBodyAnatomy.sexCoordinate}), `fat` the adiposity the
   * measured fat percentage implies ({@link AutoMovieHumanBodyAnatomy.adiposity}),
   * and `muscularity` the priors' mean body, zero: no published measure of lean
   * mass is an input, and the limbs' muscle follows their measured girths.
   *
   * @param params Public input.
   * @param name The coordinate.
   * @returns Its value, -1 to 1.
   */
  export function slider(params: IAutoMovieHumanParameters, name: "fat" | "muscularity" | "masculineFeminine"): number {
    const measures: IAutoMovieHumanBodyMeasures = AutoMovieHumanBodyAnatomy.resolve(params);
    if (name === "masculineFeminine") return AutoMovieHumanBodyAnatomy.sexCoordinate(measures);
    if (name === "fat") return AutoMovieHumanBodyAnatomy.adiposity(measures);
    return 0;
  }

  /**
   * The head's inputs of a person, as {@link calibrate} builds the head: the
   * head identity, stature, neck length (the control, else its default from the
   * cervicale height), infrathyroid girth, base tape and three resolved neck
   * landmark heights, and the sex and fat sliders. These named heights do not
   * assert a horizontal base section. A standalone head piece reads this, so
   * it is built from what the figure reads.
   *
   * @param params Public input.
   * @returns The head construction's inputs, world mm.
   */
  export function headInputs(params: IAutoMovieHumanParameters): IAutoMovieHumanHeadInputs {
    const anatomy: IAutoMovieHumanBodyMeasures = AutoMovieHumanBodyAnatomy.resolve(params);
    const height: number = anatomy.stature;

    return {
      head: AutoMovieHumanHeadAnatomy.resolve(params),
      height,
      neckLength: neckLength(params, height),
      neck: anatomy.neckCircumference,
      neckBase: {
        girth: anatomy.neckBaseCircumference,
        cervicaleHeight: anatomy.cervicaleHeight,
        sideNeckPointHeight: anatomy.sideNeckPointHeight,
        suprasternaleHeight: anatomy.suprasternaleHeight,
      },
      sex: slider(params, "masculineFeminine"),
      fat: slider(params, "fat"),
    };
  }
}

/** Height of the crotch by the inseam's definition (ISO 8559-1 5.7.6), calibration mm. */
function crotch(
  params: IAutoMovieHumanParameters,
  inputs: AutoMovieHumanLegConstruction.IInputs,
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
        : ((feet.left.ankleHeight + feet.right.ankleHeight) / 2) *
          inputs.scale,
  });
}

/**
 * The neck length the head's seat is placed by: the length that stands the
 * head's seat (the neck chain's top, `ratios.neck` times the length under the
 * menton) at the person's cervicale height (ANSUR II cervicale height,
 * standing), since on the ANSUR II means the menton stands only a few
 * millimetres over the cervicale; never below the menton. This internal
 * parameter inverts the seat equation; published C7-to-tragion and anterior
 * neck lengths have different endpoints and are not this parameter.
 *
 * @param params Public input.
 * @param height Stature, mm.
 * @returns The neck length, mm.
 */
function neckLength(params: IAutoMovieHumanParameters, height: number): number {
  const menton: number = height - AutoMovieHumanHeadAnatomy.resolve(params).height;
  const cervicale: number = AutoMovieHumanBodyAnatomy.resolve(params).cervicaleHeight;

  return Math.max(0, (menton - cervicale) / AutoMovieHumanHeadPrior.PRIOR.ratios.neck);
}

/** The person's stature, mm. */
function statureOf(params: IAutoMovieHumanParameters): number {
  return AutoMovieHumanBodyAnatomy.resolve(params).stature;
}

/**
 * The person's leg tapes in calibration millimetres: the world tape over the
 * stature scale the generator applies afterwards. An unknown tape or height
 * takes its default from `AutoMovieHumanBodyAnatomy.resolve`, an unknown
 * slider its neutral ({@link AutoMovieHumanBodyLaw.slider}).
 */
function tapes(
  params: IAutoMovieHumanParameters,
  stature: number,
): AutoMovieHumanLegConstruction.IInputs {
  const scale: number = stature / statureOf(params);
  const measures: IAutoMovieHumanBodyMeasures = AutoMovieHumanBodyAnatomy.resolve(params);
  const free: (name: "fat" | "muscularity" | "masculineFeminine") => number = (name: "fat" | "muscularity" | "masculineFeminine"): number => AutoMovieHumanBodyLaw.slider(params, name);
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
type FootGiven = Pick<IAutoMovieHumanLegIdentity, "footLength" | "footBreadth" | "ankleHeight"> | undefined;

/** One hand's given measures, or none. */
type HandGiven = IAutoMovieHumanExtremityDimensions["hands"] extends infer P ? (P extends { left: infer H } ? H | undefined : never) : never;

/**
 * The person's foot dimensions in calibration millimetres. A side without
 * measures takes what the body's own inputs expect.
 */
function feet(
  params: IAutoMovieHumanParameters,
  inputs: AutoMovieHumanLegConstruction.IInputs,
): AutoMovieHumanFootConstruction.IInputs {
  const expected: AutoMovieHumanFootConstruction.IDimensions =
    AutoMovieHumanFootConstruction.expected(
      statureOf(params),
      inputs.sex,
      inputs.scale,
    );
  const side: (given: FootGiven) => AutoMovieHumanFootConstruction.IDimensions = (given: FootGiven): AutoMovieHumanFootConstruction.IDimensions =>
    given === undefined
      ? expected
      : {
          length: given.footLength * inputs.scale,
          breadth: given.footBreadth * inputs.scale,
          ankle: given.ankleHeight * inputs.scale,
        };
  return {
    left: side(params.extremities?.feet?.left),
    right: side(params.extremities?.feet?.right),
    fat: inputs.fat,
    muscularity: inputs.muscularity,
    scale: inputs.scale,
  };
}

/** The person's trunk tapes in calibration millimetres. */
function column(
  params: IAutoMovieHumanParameters,
  inputs: AutoMovieHumanLegConstruction.IInputs,
): AutoMovieHumanTrunkConstruction.IInputs {
  const anatomy: IAutoMovieHumanBodyMeasures = AutoMovieHumanBodyAnatomy.resolve(params);

  return {
    hip: inputs.hip,
    highHip: anatomy.highHipCircumference * inputs.scale,
    waist: anatomy.waistCircumference * inputs.scale,
    underbust: anatomy.underbustCircumference * inputs.scale,
    chest: anatomy.chestCircumference * inputs.scale,
    bustSpan: anatomy.bustPointWidth * inputs.scale,
    neckBase: anatomy.neckBaseCircumference * inputs.scale,
    acrossShoulder: anatomy.acrossBackShoulderWidth * inputs.scale,
    bicep: anatomy.upperArmCircumference * inputs.scale,
    neckToWaist: anatomy.backNeckToWaist * inputs.scale,
    shoulderToApex: anatomy.sideNeckToBustPoint * inputs.scale,
    upperArm: anatomy.upperArmLength * inputs.scale,
    biacromial: anatomy.biacromialBreadth * inputs.scale,
    acromion: anatomy.acromialHeight * inputs.scale,
    cervicale: anatomy.cervicaleHeight * inputs.scale,
    axilla: anatomy.axillaHeight * inputs.scale,
    female: anatomy.sex === AutoMovieHumanSex.Female,
    sex: inputs.sex,
    fat: inputs.fat,
    muscularity: inputs.muscularity,
    scale: inputs.scale,
  };
}

/**
 * The person's arm lengths, tapes and hand measures in calibration
 * millimetres. A side without measures takes what the body expects.
 */
function arms(
  params: IAutoMovieHumanParameters,
  scale: number,
  sex: number,
): AutoMovieHumanArmConstruction.IInputs {
  const measures: IAutoMovieHumanBodyMeasures = AutoMovieHumanBodyAnatomy.resolve(params);
  const expected: AutoMovieHumanArmConstruction.IHand =
    AutoMovieHumanArmConstruction.expected(
      statureOf(params),
      measures.handCircumference,
      scale,
    );
  const side: (given: HandGiven) => AutoMovieHumanArmConstruction.IHand = (given: HandGiven): AutoMovieHumanArmConstruction.IHand =>
    given === undefined
      ? expected
      : {
          length: given.handLength * scale,
          palm: given.palmLength * scale,
          breadth: given.handBreadth * scale,
          thumb: given.thumbLength * scale,
        };
  return {
    upper: measures.upperArmLength * scale,
    lower: measures.forearmLength * scale,
    bicep: measures.upperArmCircumference * scale,
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
