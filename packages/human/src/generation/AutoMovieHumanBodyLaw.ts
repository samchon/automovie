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
import { AutoMovieHumanEventJoin } from "./AutoMovieHumanEventJoin";
import { AutoMovieHumanFootConstruction } from "./AutoMovieHumanFootConstruction";
import { AutoMovieHumanHeadConstruction } from "./AutoMovieHumanHeadConstruction";
import { AutoMovieHumanHeadPrior } from "./AutoMovieHumanHeadPrior";
import { AutoMovieHumanLegConstruction } from "./AutoMovieHumanLegConstruction";
import { AutoMovieHumanLegCrotchHeight } from "./leg/AutoMovieHumanLegCrotchHeight";
import { AutoMovieHumanNeckConstruction } from "./AutoMovieHumanNeckConstruction";
import { AutoMovieHumanTrunkConstruction } from "./AutoMovieHumanTrunkConstruction";

import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanBodyMeasures } from "./IAutoMovieHumanBodyMeasures";
import { AutoMovieHumanHeadAnatomy } from "./AutoMovieHumanHeadAnatomy";

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
  /** Calibrations for one parameter set. */
  export interface IOutput {
    /** Body chains, events, poles, apertures and globes in calibration mm. */
    body: IAutoMovieHumanBodyCalibration;

    /** Exterior lip boundary in the same frame. */
    vermilion: IAutoMovieHumanHermiteCurve;
  }

  /**
   * Calibrations for one parameter set.
   *
   * @param params Public input.
   * @returns New calibrations.
   */
  export function calibrate(params: IAutoMovieHumanParameters): IOutput {
    const height: number = statureOf(params);
    const inputs: AutoMovieHumanLegConstruction.IInputs = tapes(params, height);
    const head: AutoMovieHumanHeadConstruction.IInputs = headInputs(params);
    const trunkInputs: AutoMovieHumanTrunkConstruction.IInputs = column(
      params,
      inputs,
    );
    const headed: AutoMovieHumanHeadConstruction.IOutput =
      AutoMovieHumanHeadConstruction.apply(
        {
          stature: height,
          chains: [
            AutoMovieHumanNeckConstruction.generate({
              top: AutoMovieHumanHeadConstruction.seat(head),
              neck: head.neck,
              neckBase: trunkInputs.neckBase,
              sex: inputs.sex,
              scale: inputs.scale,
            }),
          ],
          events: EVENTS,
          poles: [],
          apertures: [],
          eyes: [],

          // A contradiction among the person's trunk measures is reported at
          // the input (`AutoMovieHumanBodyBox.diagnose`); the figure is still
          // made, each section at the nearest end of its box's range.
          diagnostics: AutoMovieHumanBodyBox.diagnose(AutoMovieHumanBodyAnatomy.resolve(params)),
        },
        LIPS,
        head,
      );
    const crotchHeight: number = crotch(params, inputs);
    const standing: IAutoMovieHumanBodyCalibration =
      AutoMovieHumanTrunkConstruction.apply(
        headed.body,
        trunkInputs,
        crotchHeight,
      );

    // The skeleton stands in the head, neck and trunk before any limb exists,
    // and the limbs are lofted on it.
    const armInputs: AutoMovieHumanArmConstruction.IInputs = arms(
      params,
      inputs.scale,
      inputs.sex,
    );
    const footInputs: AutoMovieHumanFootConstruction.IInputs = feet(
      params,
      inputs,
    );
    const skeleton: AutoMovieHumanSkeletonLaw.IBone[] =
      AutoMovieHumanSkeletonLaw.derive(standing, {
        arms: armInputs,
        feet: footInputs,
        legs: inputs,
        ...(standing.trunk !== undefined ? { trunk: standing.trunk } : {}),
      });
    const stood: IAutoMovieHumanBodyCalibration =
      AutoMovieHumanLegConstruction.stand(
        AutoMovieHumanFootConstruction.add(
          AutoMovieHumanArmConstruction.add(standing, armInputs, skeleton),
          footInputs,
        ),
        inputs,
        skeleton,
      );
    // Today's body, kept as the interim source of the body lane's owed values
    // and of the skeleton (`AutoMovieHumanBodyLaneInterim`).
    const today: IAutoMovieHumanBodyCalibration = AutoMovieHumanEventJoin.reconcile(
      AutoMovieHumanLegConstruction.add(stood, inputs, skeleton),
    );
    const neck: IAutoMovieHumanLoftChain | undefined = headed.body.chains.find(
      (c: IAutoMovieHumanLoftChain): boolean => c.name === "head",
    );
    if (neck === undefined) throw new Error("The body lane stands under the neck chain `head`");

    // The body lane: every body part from its views, joined by solid merges
    // (#3047 to #3051), the trunk taking the neck's bottom ring by the head's
    // down event at its far end.
    const lane: AutoMovieHumanBodyLane.IOutput = AutoMovieHumanBodyLane.create(
      AutoMovieHumanBodyLaneInterim.of({
        params,
        scale: inputs.scale,
        stature: today.stature,
        crotch: crotchHeight,
        trunk: trunkInputs,
        neck,
        feet: footInputs,
        skeleton,
        old: today,
      }),
    );
    const headChains: Set<string> = new Set(
      headed.body.chains.map((c: IAutoMovieHumanLoftChain): string => c.name),
    );
    const ownedByHead = (e: IAutoMovieHumanBodyCalibration.IEvent): boolean =>
      headChains.has(e.parent) && e.splits.every((s: IAutoMovieHumanBodyCalibration.ISplit): boolean => headChains.has(s.child));
    return {
      body: {
        ...today,
        chains: [
          ...today.chains.filter((c: IAutoMovieHumanLoftChain): boolean => headChains.has(c.name)),
          ...lane.chains,
        ],
        events: [
          ...today.events.filter(ownedByHead),
          { parent: "head", direction: "down", splits: [{ child: "trunk", arcs: [[0, 2 * Math.PI]] }] },
        ],
        poles: today.poles.filter((p: IAutoMovieHumanBodyCalibration.IPole): boolean => headChains.has(p.chain)),
        merges: lane.merges,
        appendages: undefined,

        // Interim: today's nail windows name stations of today's digit
        // chains, which the body lane replaces (remaining, `log-body.md`).
        nails: undefined,
        diagnostics: [...(today.diagnostics ?? []), ...lane.diagnostics],
        skeleton,
      },
      vermilion: headed.vermilion,
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
   * cervicale height), neck girth and the sex and fat sliders. A standalone head
   * piece reads this, so it is built from what the figure reads.
   *
   * @param params Public input.
   * @returns The head construction's inputs, world mm.
   */
  export function headInputs(params: IAutoMovieHumanParameters): AutoMovieHumanHeadConstruction.IInputs {
    const height: number = statureOf(params);

    return {
      head: AutoMovieHumanHeadAnatomy.resolve(params),
      height,
      neckLength: neckLength(params, height),
      neck: AutoMovieHumanBodyAnatomy.resolve(params).neckCircumference,
      sex: slider(params, "masculineFeminine"),
      fat: slider(params, "fat"),
    };
  }
}

/**
 * Phases on the left where the arm's arc of the shoulder ring starts and ends,
 * radians, from the first to the second going round the left side from the
 * front midline. The trunk's ring places the same two guides at these knots;
 * the right side's arc is derived from it by reflection rather than written
 * again. The anterior and posterior axillary guides' knots of the
 * 256-control shoulder ring (`AutoMovieHumanTrunkGuides.KNOT.anteriorAxillary`,
 * `AutoMovieHumanTrunkGuides.KNOT.posteriorAxillary`).
 */
const ARM_ARC: readonly [number, number] = [(2 * Math.PI * 46) / 256, (2 * Math.PI * 94) / 256];

/** Shared rings of the trunk: the rest come with their chains. */
const EVENTS: IAutoMovieHumanBodyCalibration.IEvent[] = [
  {
    parent: "head",
    direction: "down",
    splits: [{ child: "upper", arcs: [[0, 2 * Math.PI]] }],
  },
  {
    parent: "upper",
    direction: "down",
    fillet: 1,
    splits: [
      {
        child: "trunk",
        arcs: [
          [ARM_ARC[1], 2 * Math.PI - ARM_ARC[1]],
          [2 * Math.PI - ARM_ARC[0], ARM_ARC[0]],
        ],
      },

      // Each arm leaves the ring by its root strip, which copies the shoulders'
      // jet down across it, so the join leaves the arms as built.
      { child: "arm.left", arcs: [[ARM_ARC[0], ARM_ARC[1]]], shared: true },

      // The right arm's arc is the left's reflection (rule J6): phase t on
      // the left is 2 pi - t on the right, so the two sides are one construction.
      {
        child: "arm.right",
        arcs: [[2 * Math.PI - ARM_ARC[1], 2 * Math.PI - ARM_ARC[0]]],
        shared: true,
      },
    ],
  },
  {
    parent: "head",
    direction: "up",
    splits: [{ child: "head.lower", arcs: [[0, 2 * Math.PI]] }],
  },
  { parent: "trunk", direction: "down", splits: [] },
];

/** The lip boundary before the head's spans. */
const LIPS: IAutoMovieHumanHermiteCurve = {
  name: "vermilion",
  chain: "head.lower",
  closed: true,
  spans: [],
};

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
 * millimetres over the cervicale; never below the menton. No published
 * definition of a neck length exists, so it is no input.
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
