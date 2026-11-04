import { AutoMovieHumanSex } from "../typings/AutoMovieHumanSex";
import type { IAutoMovieHumanBodyMeasures } from "./IAutoMovieHumanBodyMeasures";

/**
 * The suprapatella's height: the patella's superior point above the floor,
 * the site of ANSUR II's lower thigh circumference
 * (`IAutoMovieHumanBodyAnatomy.lowerThighCircumference`).
 *
 * Derivation: the suprapatella stands half the patella's length above
 * mid-patella. Mid-patella stands at ANSUR II's share of stature, 0.276 in
 * women and 0.278 in men (midpatella height 449.0 and 488.4 mm,
 * `docs/sources/ansur-ii.md`). The patella's length, its superior to its
 * inferior pole, is 38.83 mm (SD 3.47) over 168 dry adult patellae (Kafa B.
 * et al., "Evaluation of patella anatomy for total knee arthroplasty
 * approaches", Cureus 16(5):e59852, 2024, PMC11157160, CC BY); the other
 * studies that paper tabulates run from 35.7 to 46.1 mm.
 *
 * Limits: one patella length for every person, sexes pooled and dry bone
 * (the skin over the superior pole adds little); mid-patella by its mean
 * share rather than the person's own height, which no input takes.
 */
export namespace AutoMovieHumanSuprapatella {
  /** Mid-patella height per stature, women and men, ANSUR II (means). */
  export const MIDPATELLA: readonly [number, number] = [0.276, 0.278];

  /** The patella's length, superior to inferior pole, mm (Kafa et al. 2024, mean of 168). */
  export const PATELLA_LENGTH: number = 38.83;

  /**
   * The suprapatella's height above the floor.
   *
   * @param measures A person's resolved measures, for stature and sex.
   * @returns Height, mm.
   */
  export function height(measures: IAutoMovieHumanBodyMeasures): number {
    return MIDPATELLA[measures.sex === AutoMovieHumanSex.Female ? 0 : 1] * measures.stature + PATELLA_LENGTH / 2;
  }
}
