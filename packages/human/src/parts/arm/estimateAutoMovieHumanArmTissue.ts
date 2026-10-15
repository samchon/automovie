import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";

/**
 * Adult means the subcutaneous fat relation is fitted through: NHANES III triceps skinfold of all adults 20 and over, 13.1 mm in men and 23.5 mm in women (McDowell et al. 2009, Vital Health Stat 11(249), Tables 29 and 30), against the adult body fat of the NHANES DXA reference, about 28 percent in men (medians 23.4 at 20, 27.5 at 40, 30.5 at 60 and 31.6 at 80) and 40 percent in women (36.0 at 25, 42.5 at 80; Kelly et al. 2009, PLoS ONE 4(9):e7038). Grade: derived, a two-point power fit across the sexes.
 */
const SKINFOLD: { male: [number, number]; female: [number, number] } = {
  male: [28, 13.1],
  female: [40, 23.5],
};

/**
 * Biepicondylar breadth of the humerus over wrist circumference: NHANES III adult elbow breadth (7.4 cm men, 6.5 cm women; McDowell et al. 2009, Vital Health Stat 11(249), Tables 63 and 64) over the ANSUR II mean wrist circumference (175.9 and 154.8 mm; Gordon et al. 2014, NATICK/TR-15/007). Both sexes give 0.42 to within 0.001, and the 1988-1994 children's elbow-to-wrist breadth ratio (1.23 at 10 years, Tables 50 and 62) matches the adults' 1.25, so the wrist's skeletal girth carries the elbow's breadth. Grade: derived across two surveys.
 */
const ELBOW_PER_WRIST: number = 0.42;

/**
 * Girth each body mass index unit adds, flexed biceps 7.45 mm, flexed forearm 4.00 mm and wrist 1.16 mm in ANSUR II women (7.06, 4.07 and 1.22 in men), our ordinary least squares fits. Adiposity is what a BMI unit adds at constant stature, so the ratios are how thick the fat over each level is against the upper arm: 0.54 over the forearm and 0.16 at the wrist. Grade: derived.
 */
const FAT_ALONG: { forearm: number; wrist: number } = {
  forearm: 0.54,
  wrist: 0.16,
};

/**
 * Appendicular lean mass index at which muscle relief is neutral, kilograms per square metre: midway between the NHANES DXA medians at 20 years, 6.81 for women and 8.87 for men (Kelly et al. 2009). Grade: conventional reference on measured values.
 */
const NEUTRAL_LEAN_INDEX: number = 7.84;

/**
 * Arm muscle circumference over wrist circumference at which muscle relief is neutral: NHANES III adults have mid-upper arm circumferences of 330 mm (men) and 307 mm (women; Tables 42 and 43) with triceps skinfolds of 13.1 and 23.5 mm, so arm muscle circumferences of 289 and 233 mm, against ANSUR II wrists of 175.9 and 154.8 mm: 1.64 and 1.51, midway 1.57. Grade: derived across two surveys.
 */
const NEUTRAL_MUSCLE_PER_WRIST: number = 1.57;

/**
 * Estimate the soft tissue and the elbow's bony breadth that shape one arm's surface from its identity.
 *
 * Subcutaneous fat over the triceps is half the triceps skinfold, the convention of arm anthropometry in which arm muscle circumference is the arm circumference less pi times the skinfold (Jelliffe 1966, WHO Monograph 53; Frisancho 1981, Am J Clin Nutr 34(11):2540-2545). The skinfold follows body fat by a power law through the adult means of both sexes, so the sex difference in limb fat arrives through body fat alone: `skinfold = 13.1 (fat / 28)^1.64`. The forearm and wrist carry the fractions of that thickness that their per-BMI girth slopes give.
 *
 * Muscularity scales the relief of every superficial muscle; the girths already carry how much tissue there is, this decides how much of it shows as muscle. It is the product of two ratios to their neutral values: the square root of the whole body's appendicular lean mass index, and this arm's muscle circumference (arm circumference less pi times the skinfold) over its wrist circumference, the muscle the arm carries for its skeletal frame. The arm's own ratio leads because it is measured where the relief shows; the body's lean index separates a trained arm from a fat one at equal girth.
 *
 * @param identity The person
 * @param arm The arm being shaped
 * @returns Fat thicknesses, muscularity and bony breadths of that arm
 */
export function estimateAutoMovieHumanArmTissue(
  identity: IAutoMovieHumanIdentity,
  arm: IAutoMovieHumanIdentity.IArm,
): estimateAutoMovieHumanArmTissue.IOutput {
  const exponent: number =
    Math.log(SKINFOLD.female[1] / SKINFOLD.male[1]) /
    Math.log(SKINFOLD.female[0] / SKINFOLD.male[0]);
  const skinfold: number =
    SKINFOLD.male[1] *
    Math.pow(
      identity.composition.bodyFatPercentage / SKINFOLD.male[0],
      exponent,
    );
  const triceps: number = skinfold / 2;
  const muscle: number = arm.upperArmCircumference - Math.PI * skinfold;
  return {
    upperArmFat: triceps,
    forearmFat: triceps * FAT_ALONG.forearm,
    wristFat: triceps * FAT_ALONG.wrist,
    muscularity:
      Math.sqrt(
        identity.composition.appendicularLeanMassIndex / NEUTRAL_LEAN_INDEX,
      ) *
      (muscle / arm.wristCircumference / NEUTRAL_MUSCLE_PER_WRIST),
    elbowBreadth: ELBOW_PER_WRIST * arm.wristCircumference,
  };
}
/** Output type of {@link estimateAutoMovieHumanArmTissue}. */
export namespace estimateAutoMovieHumanArmTissue {
  /**
   * Soft tissue and bony breadths of one arm, millimetres unless stated.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** Subcutaneous fat over the triceps at mid upper arm, half the triceps skinfold. */
    upperArmFat: number;

    /** Subcutaneous fat over the forearm at its maximum girth. */
    forearmFat: number;

    /** Subcutaneous fat at the wrist over the styloids. */
    wristFat: number;

    /** Relief scale of the superficial muscles, dimensionless; 1 is neutral. */
    muscularity: number;

    /** Biepicondylar breadth of the humerus, bone only. */
    elbowBreadth: number;
  }
}
