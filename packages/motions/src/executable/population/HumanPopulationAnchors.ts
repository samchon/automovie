import type {
  IAutoMovieHumanBodyAnatomy,
  IAutoMovieHumanBodyMeasures,
  IAutoMovieHumanParameters,
} from "@automovie/human";

import { HumanPopulationAccess } from "./HumanPopulationAccess";
import { HumanPopulationConditional } from "./HumanPopulationConditional";
import type { HumanPopulationSurvey } from "./HumanPopulationSurvey";

type P = IAutoMovieHumanParameters;
type Sex = HumanPopulationSurvey.Sex;
type Variable = HumanPopulationSurvey.Variable;

/**
 * How a body measure reads from the survey: directly where the survey measures
 * its definition, through an anchor where it does not.
 */
export namespace HumanPopulationAnchors {
  /** A body measure the survey measures by its definition. */
  export type Direct = readonly [
    Exclude<keyof IAutoMovieHumanBodyAnatomy, "sex">,
    Variable,
  ];

  /** A body measure the survey does not measure by its definition. */
  export type Anchored =
    | "backNeckToWaist"
    | "acrossBackShoulderWidth"
    | "highHipCircumference"
    | "upperArmCircumference"
    | "forearmCircumference"
    | "inseam";

  /** An anchored head, ear or hand input. */
  export type Part = "earBreadth" | "thumbLength" | "vertexToNasion";

  /**
   * A course the survey does not measure by its definition, carried by the
   * surveyed measure nearest it: the course is that measure times the ratio the
   * sex's reference people show between their course and the measure the
   * survey expects of them given their own surveyed inputs.
   */
  export interface IAnchor {
    /** The surveyed measure that carries the course. */
    proxy: Variable;

    /** The reference's surveyed inputs the proxy is expected from. */
    given: Variable[];

    /** The course on a reference. */
    read: (p: P) => number;
  }

  /** Body measures whose definition the survey measures: the field and its measure. */
  export const DIRECT: readonly Direct[] = [
    ["stature", "stature"],
    ["chestCircumference", "chest"],
    ["bustPointWidth", "bustSpan"],
    ["underbustCircumference", "underbust"],
    ["sideNeckToBustPoint", "neckToBustPoint"],
    ["waistCircumference", "waist"],
    ["hipCircumference", "buttock"],
    ["neckBaseCircumference", "neckBase"],
    ["neckCircumference", "neck"],
    ["upperArmLength", "acromionRadiale"],
    ["forearmLength", "radialeStylion"],
    ["elbowCircumference", "elbow"],
    ["wristCircumference", "wrist"],
    ["thighCircumference", "thigh"],
    ["kneeCircumference", "knee"],
    ["calfCircumference", "calf"],
    ["handCircumference", "handCircumference"],
  ];

  /** Body measures carried by an anchor. */
  export const ANCHORED: readonly Anchored[] = [
    "backNeckToWaist",
    "acrossBackShoulderWidth",
    "highHipCircumference",
    "upperArmCircumference",
    "forearmCircumference",
    "inseam",
  ];

  /** Each anchored course and its carrier. */
  export const ANCHORS: Record<Anchored | Part, IAnchor> = {
    // Neck to waist over the natural waist back length (cervicale to waist).
    backNeckToWaist: {
      proxy: "waistBackLength",
      given: ["stature"],
      read: (p: P): number => HumanPopulationAccess.measures(p).backNeckToWaist,
    },

    // Across shoulder over the biacromial breadth.
    acrossBackShoulderWidth: {
      proxy: "biacromial",
      given: ["stature", "chest"],
      read: (p: P): number =>
        HumanPopulationAccess.measures(p).acrossBackShoulderWidth,
    },

    // High hip over the omphalion girth, the survey's girth between waist and hip.
    highHipCircumference: {
      proxy: "omphalionWaist",
      given: ["waist", "buttock"],
      read: (p: P): number =>
        HumanPopulationAccess.measures(p).highHipCircumference,
    },

    // Relaxed upper-arm girth over the flexed biceps girth.
    upperArmCircumference: {
      proxy: "bicepsFlexed",
      given: ["elbow", "wrist", "chest"],
      read: (p: P): number =>
        HumanPopulationAccess.measures(p).upperArmCircumference,
    },

    // Relaxed forearm girth over the flexed forearm girth.
    forearmCircumference: {
      proxy: "forearmFlexed",
      given: ["elbow", "wrist"],
      read: (p: P): number =>
        HumanPopulationAccess.measures(p).forearmCircumference,
    },

    // Inseam course over crotch height.
    inseam: {
      proxy: "crotchHeight",
      given: ["stature"],
      read: (p: P): number => HumanPopulationAccess.measures(p).inseam,
    },

    // The ear's breadth from otobasion superius over the survey's ear breadth.
    earBreadth: {
      proxy: "earBreadth",
      given: ["earLength"],
      read: (p: P): number =>
        (p.head.earPair.left.breadth + p.head.earPair.right.breadth) / 2,
    },

    // Thumb length over hand length.
    thumbLength: {
      proxy: "handLength",
      given: ["handLength"],
      read: (p: P): number => HumanPopulationAccess.hands(p)[0]!.thumbLength,
    },

    // The head's height above nasion over head length.
    vertexToNasion: {
      proxy: "headLength",
      given: ["headLength"],
      read: (p: P): number => p.head.height - p.head.faceHeight,
    },
  };

  /**
   * The mean ratio of an anchored course to the survey's expectation of its
   * carrier on the sex's references.
   *
   * @param sex The surveyed sex.
   * @param a The anchor.
   * @returns The ratio the course takes over its carrier.
   */
  export function ratio(sex: Sex, a: IAnchor): number {
    const refs: P[] = HumanPopulationAccess.REFERENCES[sex];

    return (
      refs.reduce((s: number, p: P): number => {
        const known: Map<number, number> = new Map(
          a.given.map((v: Variable): [number, number] => [
            HumanPopulationConditional.index(v),
            surveyed(p, v),
          ]),
        );
        const target: number = HumanPopulationConditional.index(a.proxy);
        const expected: number =
          known.get(target) ??
          HumanPopulationConditional.moments(sex, known, target).mean;

        return s + a.read(p) / expected;
      }, 0) / refs.length
    );
  }

  /**
   * A reference's surveyed input.
   *
   * @param p The reference's inputs.
   * @param v The surveyed measure.
   * @returns The input that stands for the measure.
   */
  function surveyed(p: P, v: Variable): number {
    const k: IAutoMovieHumanBodyMeasures = HumanPopulationAccess.measures(p);
    const table: Partial<Record<Variable, () => number>> = {
      stature: (): number => k.stature,
      chest: (): number => k.chestCircumference,
      waist: (): number => k.waistCircumference,
      buttock: (): number => k.hipCircumference,
      elbow: (): number => k.elbowCircumference,
      wrist: (): number => k.wristCircumference,
      earLength: (): number =>
        (p.head.earPair.left.length + p.head.earPair.right.length) / 2,
      handLength: (): number => HumanPopulationAccess.hands(p)[0]!.handLength,
      headLength: (): number => p.head.length,
    };

    return table[v]!();
  }
}
