import { AutoMovieArchetypeUnits } from "../../core/AutoMovieArchetypeUnits";
import type { AutoMovieArchetypeQuadrupedBody } from "../AutoMovieArchetypeQuadrupedBody";
import { DOG_BODY_MEASURES } from "./constants/DOG_BODY_MEASURES";
import type { IDogBodyMeasures } from "./structures/IDogBodyMeasures";
import type { DogCohort } from "./typings/DogCohort";

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
export function buildDogBody(
  cohort: DogCohort,
): AutoMovieArchetypeQuadrupedBody.IBody {
  const m: Readonly<IDogBodyMeasures> = DOG_BODY_MEASURES[cohort];
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
    bones: {
      upperLimb: radius,
      lowerLimb: radius,
      cannon: radius,
      pastern: radius,
    },
    inset: (barrel - m.chestWidth / 2) * AutoMovieArchetypeUnits.CENTIMETRE,
    colors: { coat: "#8a8c90", tail: "#d5d6d8" },
  };
}
