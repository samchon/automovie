import type { IAutoMovieHumanBodyControls } from "../../../../packages/human/src/structures/body/IAutoMovieHumanBodyControls";
import type { IAutoMovieHumanParameters } from "../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { HumanPopulationAccess } from "./HumanPopulationAccess";
import { HumanPopulationConditional } from "./HumanPopulationConditional";
import type { HumanPopulationSurvey } from "./HumanPopulationSurvey";

type P = IAutoMovieHumanParameters;
type Sex = HumanPopulationSurvey.Sex;
type Variable = HumanPopulationSurvey.Variable;

/**
 * How a body control reads from the survey: directly where the survey measures
 * its definition, through an anchor where it does not.
 */
export namespace HumanPopulationAnchors {
  /** A body control the survey measures by its definition. */
  export type Direct = readonly [keyof IAutoMovieHumanBodyControls, Variable];

  /** A body control the survey does not measure by its definition. */
  export type Anchored = "frontInterscyeLength" | "neckToWaist" | "acrossShoulder" | "highHip" | "bicep" | "forearm" | "inseam" | "neckLength";

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

  /** Body controls whose definition the survey measures: the control and its measure. */
  export const DIRECT: readonly Direct[] = [
    ["height", "stature"],
    ["chest", "chest"],
    ["bustSpan", "bustSpan"],
    ["underbust", "underbust"],
    ["shoulderToApex", "neckToBustPoint"],
    ["waist", "waist"],
    ["hip", "buttock"],
    ["neckBase", "neckBase"],
    ["neck", "neck"],
    ["upperArmLength", "acromionRadiale"],
    ["lowerArmLength", "radialeStylion"],
    ["elbow", "elbow"],
    ["wrist", "wrist"],
    ["thigh", "thigh"],
    ["knee", "knee"],
    ["calf", "calf"],
    ["handCircumference", "handCircumference"],
  ];

  /** Body controls carried by an anchor. */
  export const ANCHORED: readonly Anchored[] = [
    "frontInterscyeLength",
    "neckToWaist",
    "acrossShoulder",
    "highHip",
    "bicep",
    "forearm",
    "inseam",
    "neckLength",
  ];

  /** Each anchored course and its carrier. */
  export const ANCHORS: Record<Anchored | Part, IAnchor> = {
    // Front interscye over the back interscye (INTRSCY_DIST).
    frontInterscyeLength: { proxy: "interscye", given: ["stature", "chest"], read: (p: P): number => HumanPopulationAccess.controls(p).frontInterscyeLength.value! },

    // Neck to waist over the natural waist back length (cervicale to waist).
    neckToWaist: { proxy: "waistBackLength", given: ["stature"], read: (p: P): number => HumanPopulationAccess.controls(p).neckToWaist.value! },

    // Across shoulder over the biacromial breadth.
    acrossShoulder: { proxy: "biacromial", given: ["stature", "chest"], read: (p: P): number => HumanPopulationAccess.controls(p).acrossShoulder.value! },

    // High hip over the omphalion girth, the survey's girth between waist and hip.
    highHip: { proxy: "omphalionWaist", given: ["waist", "buttock"], read: (p: P): number => HumanPopulationAccess.controls(p).highHip.value! },

    // Relaxed upper-arm girth over the flexed biceps girth.
    bicep: { proxy: "bicepsFlexed", given: ["elbow", "wrist", "chest"], read: (p: P): number => HumanPopulationAccess.controls(p).bicep.value! },

    // Relaxed forearm girth over the flexed forearm girth.
    forearm: { proxy: "forearmFlexed", given: ["elbow", "wrist"], read: (p: P): number => HumanPopulationAccess.controls(p).forearm.value! },

    // Inseam course over crotch height.
    inseam: { proxy: "crotchHeight", given: ["stature"], read: (p: P): number => HumanPopulationAccess.controls(p).inseam.value! },

    // Neck length over stature.
    neckLength: { proxy: "stature", given: ["stature"], read: (p: P): number => HumanPopulationAccess.controls(p).neckLength.value! },

    // The ear's breadth from otobasion superius over the survey's ear breadth.
    earBreadth: { proxy: "earBreadth", given: ["earLength"], read: (p: P): number => (p.head.earPair.left.breadth + p.head.earPair.right.breadth) / 2 },

    // Thumb length over hand length.
    thumbLength: { proxy: "handLength", given: ["handLength"], read: (p: P): number => HumanPopulationAccess.hands(p)[0]!.thumbLength },

    // The head's height above nasion over head length.
    vertexToNasion: { proxy: "headLength", given: ["headLength"], read: (p: P): number => p.head.height - p.head.faceHeight },
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
          a.given.map((v: Variable): [number, number] => [HumanPopulationConditional.index(v), surveyed(p, v)]),
        );
        const target: number = HumanPopulationConditional.index(a.proxy);
        const expected: number = known.get(target) ?? HumanPopulationConditional.moments(sex, known, target).mean;

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
    const k: IAutoMovieHumanBodyControls = HumanPopulationAccess.controls(p);
    const table: Partial<Record<Variable, () => number>> = {
      stature: (): number => k.height.value!,
      chest: (): number => k.chest.value!,
      waist: (): number => k.waist.value!,
      buttock: (): number => k.hip.value!,
      elbow: (): number => k.elbow.value!,
      wrist: (): number => k.wrist.value!,
      earLength: (): number => (p.head.earPair.left.length + p.head.earPair.right.length) / 2,
      handLength: (): number => HumanPopulationAccess.hands(p)[0]!.handLength,
      headLength: (): number => p.head.length,
    };

    return table[v]!();
  }
}
