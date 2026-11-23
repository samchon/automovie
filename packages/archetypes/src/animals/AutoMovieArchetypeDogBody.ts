import { AutoMovieArchetypeUnits } from "../core";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";

/**
 * A coarse Husky control rig from one whole morphometric cohort mean.
 *
 * Huson, Srikanth and Ellis 2025, Genes 16:1355, Table 1 reports tape-measured
 * surface landmarks, not skeletal lengths
 * (https://doi.org/10.3390/genes16111355). Pet, show and sled means remain
 * separate. The foot measurement is divided equally into two control bars;
 * their historical Cannon/Pastern names do not turn that discretization into
 * measured canine metapodial or digit lengths. Hind angles are the two-link
 * triangle reaching the measured tail-base height with a vertical foot. Initial
 * fore controls are vertical; the shared AutoMovieArchetypeQuadrupedBody
 * parent-solid construction connects an outside-body root by articulating its
 * two proximal controls with unchanged lengths and foot. That neutral
 * construction is authored geometry, not measured canine pose. Circular cross
 * sections, straight neck/tail and the head's eye-width radius are construction
 * proxies. No canine segment masses or paw material are known here.
 *
 * @param cohort The complete measured cohort, never a blend of its traits.
 * @returns Its coarse control proportions; no anatomical or visual validation
 *   is claimed.
 */
export function AutoMovieArchetypeDogBody(
  cohort: AutoMovieArchetypeDogBody.Cohort,
): AutoMovieArchetypeQuadrupedBody.IBody {
  const m: AutoMovieArchetypeDogBody.IMeasures =
    AutoMovieArchetypeDogBody.MEASURES[cohort];
  const h: number = m.withers;
  const foot: number = m.hindFoot;
  const reach: number = m.tailBase - foot;
  const a: number = m.upperHind;
  const b: number = m.lowerHind;
  const upper: number =
    Math.acos((reach * reach + a * a - b * b) / (2 * reach * a)) /
    AutoMovieArchetypeUnits.DEGREE;
  const lower: number =
    -Math.acos((reach * reach + b * b - a * a) / (2 * reach * b)) /
    AutoMovieArchetypeUnits.DEGREE;
  const barrel: number = m.girth / (2 * Math.PI);
  const neck: number = m.neck / (2 * Math.PI);
  const radius: number = m.foreCircumference / (2 * Math.PI * h);
  const withers: number = (h - m.upperFore - m.lowerFore - m.foreFoot) / h;
  return {
    lengths: {
      fore: [
        m.upperFore / h,
        m.lowerFore / h,
        m.foreFoot / (2 * h),
        m.foreFoot / (2 * h),
      ],
      hind: [a / h, b / h, foot / (2 * h), foot / (2 * h)],
      trunk: m.body / h,
    },
    stance: { fore: [0, 0, 0, 0], hind: [upper, lower, 0, 0] },
    back: 1 - withers,
    buttock: (m.body + barrel) / h,
    withers,
    neck: { root: 0, radius: neck / h },
    head: {
      poll: { rise: neck / h, ahead: neck / h },
      nose: { drop: 0, ahead: m.snout / h },
      radius: m.eyes / (2 * h),
      mouth: 0,
    },
    tail: { radius, drop: 0, back: m.tail / h, dock: 0 },
    bones: [radius, radius, radius, radius],
    inset: (barrel - m.chestWidth / 2) * AutoMovieArchetypeUnits.CENTIMETRE,
    colors: { coat: "#8a8c90", tail: "#d5d6d8" },
  };
}

/** The measured Husky cohorts and their surface landmarks in centimetres. */
export namespace AutoMovieArchetypeDogBody {
  /** Huson et al.'s three usage cohorts, not separate breeds. */
  export type Cohort = "pet" | "show" | "sled";

  /** Source measurements, all centimetres; no body mass occurs in this table. */
  export interface IMeasures {
    /** Eye separation. */
    eyes: number;
    /** Snout length. */
    snout: number;
    /** Outer ear length. */
    ear: number;
    /** Chest width. */
    chestWidth: number;
    /** Neck circumference. */
    neck: number;
    /** Chest circumference. */
    girth: number;
    /** Withers height. */
    withers: number;
    /** Tail-base height. */
    tailBase: number;
    /** Withers-to-tail-base surface length. */
    body: number;
    /** Tail length. */
    tail: number;
    /** Upper forelimb surface segment. */
    upperFore: number;
    /** Lower forelimb surface segment. */
    lowerFore: number;
    /** Whole forefoot surface length, before control-bar discretization. */
    foreFoot: number;
    /** Forefoot circumference, used as a uniform bar cross-section proxy. */
    foreCircumference: number;
    /** Upper hindlimb surface distance, not true femur length. */
    upperHind: number;
    /** Lower hindlimb surface segment. */
    lowerHind: number;
    /** Whole hindfoot surface length, including the entire pes. */
    hindFoot: number;
  }

  /**
   * Table 1 cohort means, without the standard deviations being treated as
   * independent trait bands.
   */
  export const MEASURES: Readonly<Record<Cohort, Readonly<IMeasures>>> = {
    pet: {
      eyes: 4.45,
      snout: 9.45,
      ear: 8.79,
      chestWidth: 13.94,
      neck: 35.99,
      girth: 67.23,
      withers: 56.92,
      tailBase: 55.32,
      body: 61.85,
      tail: 35.71,
      upperFore: 20.04,
      lowerFore: 21.41,
      foreFoot: 13.56,
      foreCircumference: 9.91,
      upperHind: 30.51,
      lowerHind: 24.21,
      hindFoot: 21.23,
    },
    show: {
      eyes: 4.42,
      snout: 9.19,
      ear: 8.43,
      chestWidth: 12.29,
      neck: 37.41,
      girth: 62.56,
      withers: 56.85,
      tailBase: 54.03,
      body: 54.69,
      tail: 35.84,
      upperFore: 19.1,
      lowerFore: 20.93,
      foreFoot: 12.5,
      foreCircumference: 10.24,
      upperHind: 27.3,
      lowerHind: 23.6,
      hindFoot: 20.8,
    },
    sled: {
      eyes: 4.11,
      snout: 9.42,
      ear: 8.38,
      chestWidth: 12.65,
      neck: 36.42,
      girth: 64.85,
      withers: 60.22,
      tailBase: 58.37,
      body: 57.68,
      tail: 34.42,
      upperFore: 17.83,
      lowerFore: 21.29,
      foreFoot: 12.83,
      foreCircumference: 10.13,
      upperHind: 30.15,
      lowerHind: 22.0,
      hindFoot: 20.24,
    },
  };
}
