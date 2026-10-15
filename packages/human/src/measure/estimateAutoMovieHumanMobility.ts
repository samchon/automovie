import { AutoMovieHumanSex } from "../structures/AutoMovieHumanSex";
import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";
import { IAutoMovieHumanGrowthCurve } from "./IAutoMovieHumanGrowthCurve";
import { interpolateAutoMovieHumanGrowthCurve } from "./interpolateAutoMovieHumanGrowthCurve";

/**
 * Centres of the four age groups of the CDC normal joint range of motion study, years: 2-8, 9-19, 20-44 and 45-69.
 */
const GROUP_CENTRES: number[] = [5, 14, 32, 57];

/**
 * Mean range of one motion in each age group of the CDC normal joint range of motion study, degrees (Soucie et al. 2011, Haemophilia 17(3); the reference table published at archive.cdc.gov/www_cdc_gov/ncbddd/jointrom), more than 600 US people without joint conditions measured by goniometry. Grade: measured.
 */
type IMotion = Record<AutoMovieHumanSex, [number, number, number, number]>;

/** The eleven motions of the study, female and male means for the groups in {@link GROUP_CENTRES}. */
const SOUCIE_2011: Record<
  | keyof estimateAutoMovieHumanMobility.IOutput["arm"]
  | keyof estimateAutoMovieHumanMobility.IOutput["leg"],
  IMotion
> = {
  hipExtension: { female: [26.2, 20.5, 18.1, 16.7], male: [28.3, 18.2, 17.4, 13.5] },
  hipFlexion: { female: [140.8, 134.9, 133.8, 130.8], male: [131.1, 135.2, 130.4, 127.2] },
  kneeFlexion: { female: [152.6, 142.3, 141.9, 137.8], male: [147.8, 142.2, 137.7, 132.9] },
  kneeHyperextension: { female: [5.4, 2.4, 1.6, 1.2], male: [1.6, 1.8, 1.0, 0.5] },
  ankleDorsiflexion: { female: [24.8, 17.3, 13.8, 11.6], male: [22.8, 16.3, 12.7, 11.9] },
  anklePlantarFlexion: { female: [67.1, 57.3, 62.1, 56.5], male: [55.8, 52.8, 54.6, 49.4] },
  shoulderFlexion: { female: [178.6, 171.8, 172.0, 168.1], male: [177.8, 170.9, 168.8, 164.0] },
  elbowFlexion: { female: [152.9, 149.7, 150.0, 148.3], male: [151.4, 148.3, 144.6, 143.5] },
  elbowHyperextension: { female: [6.8, 6.4, 4.7, 3.6], male: [2.2, 5.3, 0.8, -0.7] },
  forearmPronation: { female: [84.6, 81.2, 82.0, 80.8], male: [79.6, 79.8, 76.9, 77.7] },
  forearmSupination: { female: [93.7, 90.0, 90.6, 87.2], male: [86.4, 87.8, 85.0, 82.4] },
};

/**
 * Joint mobility of one person by age and sex, the goniometric means of the CDC normal joint range of motion study.
 *
 * Fitting: the four group means are placed at the group centres and read by straight lines between them, holding the 2-8 mean below age 5 and the 45-69 mean above 57. Children under 2 and adults over 69 were not measured, so they keep the nearest group's value; the decline of mobility with age and the larger ranges of women and of young children come from the study itself. Both sides get the same values. Population and build are not read: the study reports no breakdown by them.
 *
 * @param sex Sex whose means are read
 * @param age Age in years
 * @returns Mobility fields of an arm and of a leg
 */
export function estimateAutoMovieHumanMobility(
  sex: AutoMovieHumanSex,
  age: number,
): estimateAutoMovieHumanMobility.IOutput {
  const read: (motion: IMotion) => number = (motion: IMotion): number => {
    const curve: IAutoMovieHumanGrowthCurve = {
      ages: GROUP_CENTRES,
      values: [...motion[sex]],
    };
    return interpolateAutoMovieHumanGrowthCurve(curve, age);
  };
  return {
    arm: {
      shoulderFlexion: read(SOUCIE_2011.shoulderFlexion),
      elbowFlexion: read(SOUCIE_2011.elbowFlexion),
      elbowHyperextension: read(SOUCIE_2011.elbowHyperextension),
      forearmPronation: read(SOUCIE_2011.forearmPronation),
      forearmSupination: read(SOUCIE_2011.forearmSupination),
    },
    leg: {
      hipFlexion: read(SOUCIE_2011.hipFlexion),
      hipExtension: read(SOUCIE_2011.hipExtension),
      kneeFlexion: read(SOUCIE_2011.kneeFlexion),
      kneeHyperextension: read(SOUCIE_2011.kneeHyperextension),
      ankleDorsiflexion: read(SOUCIE_2011.ankleDorsiflexion),
      anklePlantarFlexion: read(SOUCIE_2011.anklePlantarFlexion),
    },
  };
}
/** Output type of {@link estimateAutoMovieHumanMobility}. */
export namespace estimateAutoMovieHumanMobility {
  /**
   * Mobility of one arm and one leg, degrees.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** Shoulder, elbow and forearm ranges. */
    arm: Pick<
      IAutoMovieHumanIdentity.IArm,
      | "shoulderFlexion"
      | "elbowFlexion"
      | "elbowHyperextension"
      | "forearmPronation"
      | "forearmSupination"
    >;

    /** Hip, knee and ankle ranges. */
    leg: Pick<
      IAutoMovieHumanIdentity.ILeg,
      | "hipFlexion"
      | "hipExtension"
      | "kneeFlexion"
      | "kneeHyperextension"
      | "ankleDorsiflexion"
      | "anklePlantarFlexion"
    >;
  }
}
