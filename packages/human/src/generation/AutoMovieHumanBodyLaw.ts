import type { IAutoMovieHumanHermiteCurve } from "../lofting/IAutoMovieHumanHermiteCurve";
import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import type { IAutoMovieHumanExtremityDimensions } from "../structures/body/IAutoMovieHumanExtremityDimensions";
import type { IAutoMovieHumanLegIdentity } from "../structures/body/IAutoMovieHumanLegIdentity";
import { AutoMovieHumanSkeletonLaw } from "./AutoMovieHumanSkeletonLaw";
import { AutoMovieHumanArmConstruction } from "./AutoMovieHumanArmConstruction";
import { AutoMovieHumanEventJoin } from "./AutoMovieHumanEventJoin";
import { AutoMovieHumanBodyEvents } from "./AutoMovieHumanBodyEvents";
import { AutoMovieHumanFootConstruction } from "./AutoMovieHumanFootConstruction";
import { AutoMovieHumanHeadConstruction } from "./AutoMovieHumanHeadConstruction";
import { AutoMovieHumanLegConstruction } from "./AutoMovieHumanLegConstruction";
import { AutoMovieHumanLegPrior } from "./AutoMovieHumanLegPrior";
import { AutoMovieHumanNeckConstruction } from "./AutoMovieHumanNeckConstruction";
import { AutoMovieHumanTrunkConstruction } from "./AutoMovieHumanTrunkConstruction";

import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanBodySpecimenCalibration } from "./calibration/AutoMovieHumanBodySpecimenCalibration";

/**
 * The law from the public parameters to the body the generator lofts.
 *
 * Every chain is generated, from the top down, each from its neighbour's ring
 * and the person's inputs, in world millimetres: the head's rise sets where the
 * neck ends, the neck carries the shoulders, and the column runs from them to
 * the crotch's height. The skeleton then stands in that root, and the limbs are
 * lofted on it. The event join settles every shared ring, once for all of them.
 *
 * An unknown input keeps the reference person's value.
 */
export namespace AutoMovieHumanBodyLaw {
  /** Calibrations for one parameter set. */
  export interface IOutput {
    /** Body chains, events, poles, apertures and globes in calibration mm. */
    body: IAutoMovieHumanBodyCalibration;

    /** Exterior lip boundary in the same frame. */
    vermilion: IAutoMovieHumanHermiteCurve;

    /** Unaccepted head construction findings retained beside the geometry. */
    headDiagnostics: AutoMovieHumanHeadConstruction.IConstructionDiagnostics;
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
    const head: AutoMovieHumanHeadConstruction.IInputs = {
      head: params.head,
      height,
      neckLength: known(params.body.controls.neckLength.value, "neckLength"),
      neck: known(params.body.controls.neck.value, "neck"),
      sex: inputs.sex,
      fat: inputs.fat,
    };
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
          events: AutoMovieHumanBodyEvents.create(),
          poles: [],
          apertures: [],
          eyes: [],
        },
        LIPS,
        head,
      );
    const standing: IAutoMovieHumanBodyCalibration =
      AutoMovieHumanTrunkConstruction.apply(
        headed.body,
        trunkInputs,
        crotch(params, inputs),
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
    return {
      body: {
        ...AutoMovieHumanEventJoin.reconcile(
          AutoMovieHumanLegConstruction.add(stood, inputs, skeleton),
        ),
        skeleton,
      },
      vermilion: headed.vermilion,
      headDiagnostics: headed.diagnostics,
    };
  }
}

/** The lip boundary before the head's spans. */
const LIPS: IAutoMovieHumanHermiteCurve = {
  name: "vermilion",
  chain: "head.lower",
  closed: true,
  spans: [],
};

/** Height of the crotch, by the leg prior's line, calibration mm. */
function crotch(
  params: IAutoMovieHumanParameters,
  inputs: AutoMovieHumanLegConstruction.IInputs,
): number {
  const line: AutoMovieHumanLegPrior.ICrotch =
    AutoMovieHumanLegPrior.PRIOR.crotch;
  const inseam: number | null = params.body.controls.inseam.value;
  return (
    (line.offset +
      line.height * statureOf(params) +
      line.inseam *
        (inseam === null
          ? AutoMovieHumanBodySpecimenCalibration.controls.inseam!
          : inseam) +
      line.thigh * (inputs.thigh / inputs.scale) +
      line.sex * inputs.sex) *
    inputs.scale
  );
}

/** A control's value, or the specimen's when unknown. */
function known(
  value: number | null,
  name: "neckLength" | "neck" | "masculineFeminine",
): number {
  return value === null
    ? AutoMovieHumanBodySpecimenCalibration.controls[name]!
    : value;
}

/** The person's height input, or the specimen's when unknown, mm. */
function statureOf(params: IAutoMovieHumanParameters): number {
  const value: number | null = params.body.controls.height.value;
  return value === null
    ? AutoMovieHumanBodySpecimenCalibration.controls.height!
    : value;
}

/**
 * The person's leg tapes in calibration millimetres: the world tape over the
 * stature scale the generator applies afterwards. An unknown tape or height
 * keeps the specimen's.
 */
function tapes(
  params: IAutoMovieHumanParameters,
  stature: number,
): AutoMovieHumanLegConstruction.IInputs {
  const scale: number = stature / statureOf(params);
  const tape = (name: "calf" | "knee" | "thigh" | "hip"): number => {
    const value: number | null = params.body.controls[name].value;
    const known: number =
      value === null
        ? AutoMovieHumanBodySpecimenCalibration.controls[name]!
        : value;
    return known * scale;
  };
  const free = (name: "fat" | "muscularity" | "masculineFeminine"): number => {
    const value: number | null = params.body.controls[name].value;
    return value === null
      ? AutoMovieHumanBodySpecimenCalibration.controls[name]!
      : value;
  };
  return {
    calf: tape("calf"),
    knee: tape("knee"),
    thigh: tape("thigh"),
    hip: tape("hip"),
    sex: free("masculineFeminine"),
    fat: free("fat"),
    muscularity: free("muscularity"),
    scale,
  };
}

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
      inputs.fat,
      inputs.muscularity,
      inputs.scale,
    );
  const side = (
    given:
      | Pick<
          IAutoMovieHumanLegIdentity,
          "footLength" | "footBreadth" | "ankleHeight"
        >
      | undefined,
  ): AutoMovieHumanFootConstruction.IDimensions =>
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
  const tape = (
    name:
      | "highHip"
      | "waist"
      | "underbust"
      | "chest"
      | "bustSpan"
      | "neckBase"
      | "acrossShoulder"
      | "bicep"
      | "neckToWaist"
      | "shoulderToApex"
      | "frontInterscyeLength",
  ): number => {
    const value: number | null = params.body.controls[name].value;
    return (
      (value === null
        ? AutoMovieHumanBodySpecimenCalibration.controls[name]!
        : value) * inputs.scale
    );
  };
  return {
    hip: inputs.hip,
    thigh: inputs.thigh,
    highHip: tape("highHip"),
    waist: tape("waist"),
    underbust: tape("underbust"),
    chest: tape("chest"),
    bustSpan: tape("bustSpan"),
    neckBase: tape("neckBase"),
    acrossShoulder: tape("acrossShoulder"),
    bicep: tape("bicep"),
    neckToWaist: tape("neckToWaist"),
    shoulderToApex: tape("shoulderToApex"),
    frontInterscyeLength: tape("frontInterscyeLength"),
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
  const tape = (
    name:
      | "upperArmLength"
      | "lowerArmLength"
      | "bicep"
      | "elbow"
      | "forearm"
      | "wrist"
      | "handCircumference",
  ): number => {
    const value: number | null = params.body.controls[name].value;
    return (
      (value === null
        ? AutoMovieHumanBodySpecimenCalibration.controls[name]!
        : value) * scale
    );
  };
  const expected: AutoMovieHumanArmConstruction.IHand =
    AutoMovieHumanArmConstruction.expected(
      statureOf(params),
      tape("handCircumference") / scale,
      scale,
    );
  const side = (
    given: IAutoMovieHumanExtremityDimensions["hands"] extends infer P
      ? P extends { left: infer H }
        ? H | undefined
        : never
      : never,
  ): AutoMovieHumanArmConstruction.IHand =>
    given === undefined
      ? expected
      : {
          length: given.handLength * scale,
          palm: given.palmLength * scale,
          breadth: given.handBreadth * scale,
          thumb: given.thumbLength * scale,
        };
  return {
    upper: tape("upperArmLength"),
    lower: tape("lowerArmLength"),
    bicep: tape("bicep"),
    elbow: tape("elbow"),
    forearm: tape("forearm"),
    wrist: tape("wrist"),
    circumference: tape("handCircumference"),
    sex,
    left: side(params.extremities?.hands?.left),
    right: side(params.extremities?.hands?.right),
    scale,
  };
}
