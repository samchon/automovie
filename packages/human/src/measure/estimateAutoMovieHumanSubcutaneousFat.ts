import { AutoMovieHumanSex } from "../structures/AutoMovieHumanSex";
import { IAutoMovieHumanSubcutaneousFat } from "../structures/IAutoMovieHumanSubcutaneousFat";

/** A skinfold regression `ln skinfold = intercept + fat·ln(body fat %) + age·years`, skinfold in millimetres. */
interface IRegression {
  intercept: number;
  fat: number;
  age: number;
}

/**
 * Triceps and subscapular skinfolds from whole-body DXA fat and age: our least squares fits on NHANES 1999-2002 (National Center for Health Statistics public-use files DXX, first imputation, BMX and DEMO), children 8 to 17 (2,332 boys, 2,187 girls) and adults 18 to 85 (4,143 men, 3,570 women). R² 0.82 and 0.70 in boys, 0.73 and 0.65 in girls, 0.64 and 0.54 in men, 0.57 and 0.45 in women; residual standard deviation 0.21 to 0.32 in log units. At 20 years a man of 10% fat has a triceps skinfold of 3.2 mm, a woman of 35% 21.3 mm. Grade: population-fitted.
 */
const NHANES: Record<
  "child" | "adult",
  Record<AutoMovieHumanSex, Record<"triceps" | "subscapular", IRegression>>
> = {
  child: {
    male: {
      triceps: { intercept: -2.9588, fat: 1.5322, age: 0.04308 },
      subscapular: { intercept: -3.2816, fat: 1.3811, age: 0.09202 },
    },
    female: {
      triceps: { intercept: -3.0516, fat: 1.6121, age: 0.02086 },
      subscapular: { intercept: -4.0073, fat: 1.748, age: 0.03855 },
    },
  },
  adult: {
    male: {
      triceps: { intercept: -2.3236, fat: 1.5619, age: -0.00572 },
      subscapular: { intercept: -1.3328, fat: 1.3186, age: -0.0028 },
    },
    female: {
      triceps: { intercept: -2.5756, fat: 1.6071, age: -0.00408 },
      subscapular: { intercept: -3.171, fat: 1.7469, age: -0.00553 },
    },
  },
};

/** Ages bounding the NHANES DXA sample, years; the fits are read inside them. */
const SAMPLE_AGES: [number, number] = [8, 85];

/** Ages over which the child fits hand over to the adult fits, years. Conventional. */
const ADULT_FROM: [number, number] = [17, 19];

/**
 * Skinfolds at other sites over the triceps or subscapular skinfold of the same person.
 *
 * - Biceps over triceps and supra-iliac over subscapular: Durnin and Womersley (1974, Br J Nutr 32(1):77-97, Table 2), 92 men and 100 women aged 20 to 29, Harpenden caliper: biceps 4.8 and 11 mm against triceps 9.8 and 21, supra-iliac 16 and 18 against subscapular 12 and 18. Grade: measured.
 * - Abdominal over subscapular, front thigh and medial calf over triceps: Esparza-Ros et al. (2022, Nutrients 14(10):2085, Table 3, Harpenden column), 69 men and 69 women aged 18 to 25 measured to the ISAK protocol and reported pooled: abdominal 14.85, subscapular 9.84, front thigh 17.95, medial calf 10.76, triceps 12.97 mm. Grade: measured, pooled over sex.
 */
const SKINFOLD_RATIO: Record<
  "biceps" | "supraIliac" | "abdominal" | "thigh" | "calf",
  Record<AutoMovieHumanSex, number>
> = {
  biceps: { male: 4.8 / 9.8, female: 11 / 21 },
  supraIliac: { male: 16 / 12, female: 18 / 18 },
  abdominal: { male: 14.85 / 9.84, female: 14.85 / 9.84 },
  thigh: { male: 17.95 / 12.97, female: 17.95 / 12.97 },
  calf: { male: 10.76 / 12.97, female: 10.76 / 12.97 },
};

/**
 * Uncompressed fat thickness by MRI over half the caliper skinfold at the same site: Hoffmann et al. (2022, Sci Rep 12:15798, Table 2), 50 adults aged 19 to 81 of BMI 17.7 to 31.7: biceps 6.2 against 5.4 mm, abdomen 25.2 against 12.6, mid front thigh 11.5 against 10.7. A caliper squeezes the soft abdominal fat to half; over the limbs it reads nearly true. Sites with no MRI comparison take 1. Grade: measured.
 */
const UNCOMPRESSED: Record<"biceps" | "abdomen" | "thigh", number> = {
  biceps: 0.62 / 0.54,
  abdomen: 2.52 / 1.26,
  thigh: 1.15 / 1.07,
};

/**
 * Mean fat thickness of the forearms over that of the upper arms, and of the lateral over the front mid-thigh. The forearm ratio is from ultrasound at 216 random sites in ten young men (Störchle et al. 2018, Sci Rep 8:16268, Table 5: 1.15 against 3.00 mm, fibrous structures included); the thigh ratio from MRI in Hoffmann et al. (Table 2: 10.3 against 11.5 mm), which the back of the thigh takes, no posterior thigh having been measured. Grade: measured for men and transferred to women for the forearm; conventional transfer to the back of the thigh.
 */
const SEGMENT_RATIO: Record<"forearm" | "thighBack", number> = {
  forearm: 1.15 / 3.0,
  thighBack: 1.03 / 1.15,
};

/**
 * Subcutaneous fat thickness over each region of one person.
 *
 * Two anchor sites follow the person's whole-body fat, sex and age by NHANES fits: the triceps skinfold for the limbs and the subscapular for the trunk. Every other site takes its measured ratio to one of them, and a fat thickness is half a caliper skinfold, the convention of arm anthropometry (Jelliffe 1966, WHO Monograph 53), corrected to the uncompressed layer where MRI measured both. The chest takes the back's thickness: no pectoral thickness was read. Below 8 years, where NHANES scanned no one, the 8-year relation holds for the child's own body fat; past 85 the 85-year relation holds.
 *
 * Women's thicker limb and hip fat comes through their higher body fat and the sex-specific anchor fits; the abdominal, thigh and calf ratios were reported pooled over sex.
 *
 * @param props Sex, age in years and whole-body fat percentage
 * @returns Thickness over each region, millimetres
 */
export function estimateAutoMovieHumanSubcutaneousFat(props: {
  sex: AutoMovieHumanSex;
  age: number;
  bodyFatPercentage: number;
}): IAutoMovieHumanSubcutaneousFat {
  const { sex }: { sex: AutoMovieHumanSex } = props;
  const age: number = Math.min(
    SAMPLE_AGES[1],
    Math.max(SAMPLE_AGES[0], props.age),
  );
  const weight: number = Math.min(
    1,
    Math.max(0, (age - ADULT_FROM[0]) / (ADULT_FROM[1] - ADULT_FROM[0])),
  );
  const skinfold: (site: "triceps" | "subscapular") => number = (
    site: "triceps" | "subscapular",
  ): number => {
    const read: (r: IRegression) => number = (r: IRegression): number =>
      Math.exp(
        r.intercept + r.fat * Math.log(props.bodyFatPercentage) + r.age * age,
      );
    return (
      (1 - weight) * read(NHANES.child[sex][site]) +
      weight * read(NHANES.adult[sex][site])
    );
  };
  const triceps: number = skinfold("triceps");
  const subscapular: number = skinfold("subscapular");
  const upperArmFront: number =
    (triceps * SKINFOLD_RATIO.biceps[sex] * UNCOMPRESSED.biceps) / 2;
  const upperArmBack: number = triceps / 2;
  const thighFront: number =
    (triceps * SKINFOLD_RATIO.thigh[sex] * UNCOMPRESSED.thigh) / 2;
  return {
    abdomen:
      (subscapular * SKINFOLD_RATIO.abdominal[sex] * UNCOMPRESSED.abdomen) / 2,
    flank: (subscapular * SKINFOLD_RATIO.supraIliac[sex]) / 2,
    chest: subscapular / 2,
    back: subscapular / 2,
    upperArmFront,
    upperArmBack,
    forearm: (SEGMENT_RATIO.forearm * (upperArmFront + upperArmBack)) / 2,
    thighFront,
    thighBack: thighFront * SEGMENT_RATIO.thighBack,
    calf: (triceps * SKINFOLD_RATIO.calf[sex]) / 2,
  };
}
