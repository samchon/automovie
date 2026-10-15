import { AutoMovieHumanSex } from "../structures/AutoMovieHumanSex";
import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";
import { IAutoMovieHumanConversionContext } from "./IAutoMovieHumanConversionContext";
import { IAutoMovieHumanGrowthCurve } from "./IAutoMovieHumanGrowthCurve";
import { estimateAutoMovieHumanMedianStature } from "./estimateAutoMovieHumanMedianStature";
import { interpolateAutoMovieHumanGrowthCurve } from "./interpolateAutoMovieHumanGrowthCurve";

/**
 * Centres of the one-year age bins of the 1977 US child survey (Snyder et al. 1977, UM-HSRI-77-17; individual records published by NIST as AnthroKids), years: bins from 2, 4, ... 16 and the last bin of 17.0 to 18.5.
 */
const BIN_AGES: number[] = [2.5, 4.5, 6.5, 8.5, 10.5, 12.5, 14.5, 16.5, 17.75];

/** Bin ages with a leading birth sample, for the ratios {@link extrapolateToBirth} extends. */
const BIRTH_AND_BIN_AGES: number[] = [0, ...BIN_AGES];

/**
 * Prepend a birth value continuing the slope of the first two bins.
 *
 * Bogin and Varela-Silva (2010, Int J Environ Res Public Health 7(3):1047-1075) state that the legs, especially the tibia, grow faster than every other segment from birth to about 7 years, so the leg and sitting-height ratios keep moving in the same direction below the survey's youngest standing bin. The survey measured infants supine only, so the birth value is this extrapolation. Grade: derived.
 *
 * @param values Ratios at {@link BIN_AGES}
 * @returns Ratios at {@link BIRTH_AND_BIN_AGES}
 */
function extrapolateToBirth(values: number[]): number[] {
  const slope: number =
    (values[1]! - values[0]!) / (BIN_AGES[1]! - BIN_AGES[0]!);
  return [values[0]! - slope * BIN_AGES[0]!, ...values];
}

/** A ratio curve for each sex. */
type ISexCurve = Record<AutoMovieHumanSex, IAutoMovieHumanGrowthCurve>;

/**
 * Per-subject ratios to stature of the 1977 US child survey, means by bin, fitted by us from the published individual records (3,900 children). Grade: population-fitted.
 */
const SNYDER_1977: Record<
  | "sittingHeight"
  | "trochanterion"
  | "tibiale"
  | "biacromial"
  | "bispinous"
  | "upperArm"
  | "forearm",
  ISexCurve
> = {
  sittingHeight: {
    male: {
      ages: BIRTH_AND_BIN_AGES,
      values: extrapolateToBirth([
        0.593, 0.566, 0.548, 0.532, 0.522, 0.512, 0.511, 0.518, 0.52,
      ]),
    },
    female: {
      ages: BIRTH_AND_BIN_AGES,
      values: extrapolateToBirth([
        0.585, 0.56, 0.548, 0.531, 0.521, 0.519, 0.522, 0.527, 0.529,
      ]),
    },
  },
  trochanterion: {
    male: {
      ages: BIRTH_AND_BIN_AGES,
      values: extrapolateToBirth([
        0.438, 0.468, 0.493, 0.498, 0.514, 0.524, 0.519, 0.515, 0.513,
      ]),
    },
    female: {
      ages: BIRTH_AND_BIN_AGES,
      values: extrapolateToBirth([
        0.447, 0.475, 0.491, 0.507, 0.515, 0.515, 0.513, 0.505, 0.503,
      ]),
    },
  },
  tibiale: {
    male: {
      ages: BIRTH_AND_BIN_AGES,
      values: extrapolateToBirth([
        0.23, 0.241, 0.252, 0.261, 0.264, 0.27, 0.265, 0.263, 0.264,
      ]),
    },
    female: {
      ages: BIRTH_AND_BIN_AGES,
      values: extrapolateToBirth([
        0.234, 0.244, 0.253, 0.259, 0.262, 0.262, 0.259, 0.258, 0.259,
      ]),
    },
  },
  biacromial: {
    male: {
      ages: BIN_AGES,
      values: [0.228, 0.226, 0.223, 0.218, 0.217, 0.216, 0.217, 0.218, 0.222],
    },
    female: {
      ages: BIN_AGES,
      values: [0.235, 0.226, 0.225, 0.22, 0.219, 0.217, 0.218, 0.22, 0.221],
    },
  },
  bispinous: {
    male: {
      ages: BIN_AGES,
      values: [0.149, 0.146, 0.138, 0.133, 0.134, 0.13, 0.132, 0.134, 0.134],
    },
    female: {
      ages: BIN_AGES,
      values: [0.157, 0.145, 0.142, 0.143, 0.136, 0.142, 0.141, 0.145, 0.148],
    },
  },
  upperArm: {
    male: {
      ages: BIN_AGES,
      values: [0.182, 0.179, 0.184, 0.186, 0.188, 0.19, 0.19, 0.19, 0.191],
    },
    female: {
      ages: BIN_AGES,
      values: [0.175, 0.178, 0.176, 0.181, 0.181, 0.184, 0.186, 0.186, 0.184],
    },
  },
  forearm: {
    male: {
      ages: BIN_AGES,
      values: [0.142, 0.144, 0.149, 0.149, 0.148, 0.152, 0.153, 0.153, 0.152],
    },
    female: {
      ages: BIN_AGES,
      values: [0.141, 0.145, 0.143, 0.143, 0.144, 0.146, 0.144, 0.143, 0.144],
    },
  },
};

/** Centres of the two-year hand and foot bins of the 1977 survey (2-4, 6-8, 10-12, 16-18 years). */
const HAND_AGES: number[] = [3, 7, 11, 17];

/**
 * Hand and foot proportions of the 1977 survey by two-year bin. Hand length over stature is derived from the bin's mean hand length and the mean of the stature means of the one-year bins it spans; the others are means of per-subject ratios. Grade: population-fitted, hand-to-stature derived.
 */
const SNYDER_1977_HAND: Record<
  "handToStature" | "breadthToHand" | "handToFoot" | "footBreadthToFoot",
  ISexCurve
> = {
  handToStature: {
    male: { ages: HAND_AGES, values: [0.1107, 0.1075, 0.1068, 0.1075] },
    female: { ages: HAND_AGES, values: [0.1102, 0.1062, 0.1061, 0.1057] },
  },
  breadthToHand: {
    male: { ages: HAND_AGES, values: [0.484, 0.47, 0.462, 0.47] },
    female: { ages: HAND_AGES, values: [0.479, 0.459, 0.447, 0.439] },
  },
  handToFoot: {
    male: { ages: HAND_AGES, values: [0.713, 0.703, 0.692, 0.712] },
    female: { ages: HAND_AGES, values: [0.715, 0.7, 0.7, 0.725] },
  },
  footBreadthToFoot: {
    male: { ages: HAND_AGES, values: [0.414, 0.399, 0.387, 0.391] },
    female: { ages: HAND_AGES, values: [0.408, 0.388, 0.381, 0.385] },
  },
};

/**
 * Middle and thumb lengths from the crease at their base over hand length, the 1977 survey's means of per-subject ratios by two-year bin (Snyder et al. 1977, UM-HSRI-77-17), fitted by us. The middle finger lengthens against the palm through childhood, 0.416 to 0.435 in boys and 0.428 to 0.439 in girls, and the thumb 0.341 to 0.356 and 0.335 to 0.359. Grade: population-fitted.
 */
const SNYDER_1977_DIGITS: Record<"middle" | "thumb", ISexCurve> = {
  middle: {
    male: { ages: HAND_AGES, values: [0.416, 0.43, 0.43, 0.435] },
    female: { ages: HAND_AGES, values: [0.428, 0.434, 0.437, 0.439] },
  },
  thumb: {
    male: { ages: HAND_AGES, values: [0.341, 0.347, 0.354, 0.356] },
    female: { ages: HAND_AGES, values: [0.335, 0.352, 0.358, 0.359] },
  },
};

/**
 * A linear regression `intercept + stature·S + mass·m + bmi·B + age·a` in millimetres, with stature in millimetres, body mass in kilograms, body mass index in kilograms per square metre and age in years; absent terms are zero.
 */
interface IRegression {
  intercept: number;
  stature: number;
  mass?: number;
  bmi?: number;
  age?: number;
}

/**
 * Adult lengths and bony breadths, our ordinary least squares fits per sex on the public ANSUR II working databases (Gordon et al. 2014, NATICK/TR-15/007; Paquette and Parham 2017), 1,986 women and 4,082 men aged 17 to 58. Heights and long bones regress on stature alone, hand and foot on stature and body mass, bony breadths and the soft-tissue hip breadth on stature, BMI and age; every fit passes through the sample means. Valid within about 1,400 to 2,000 mm stature, BMI 17 to 40 and age 17 to 58. Grade: population-fitted.
 */
const ANSUR_II: Record<
  | "sittingHeight"
  | "cervicaleHeight"
  | "suprasternaleHeight"
  | "acromialHeight"
  | "upperArm"
  | "forearm"
  | "tibiale"
  | "trochanterion"
  | "hand"
  | "handBreadth"
  | "foot"
  | "ankle"
  | "biacromial"
  | "bicristal"
  | "hipBreadth",
  Record<AutoMovieHumanSex, IRegression>
> = {
  sittingHeight: {
    female: { intercept: 215.8, stature: 0.3935 },
    male: { intercept: 205.8, stature: 0.4057 },
  },
  cervicaleHeight: {
    female: { intercept: -90.4, stature: 0.9126 },
    male: { intercept: -78.1, stature: 0.9084 },
  },
  suprasternaleHeight: {
    female: { intercept: -93.6, stature: 0.874 },
    male: { intercept: -101.4, stature: 0.8769 },
  },
  acromialHeight: {
    female: { intercept: -96.9, stature: 0.8793 },
    male: { intercept: -126.9, stature: 0.8926 },
  },
  upperArm: {
    female: { intercept: -34.0, stature: 0.212 },
    male: { intercept: -20.9, stature: 0.2028 },
  },
  forearm: {
    female: { intercept: -24.5, stature: 0.1632 },
    male: { intercept: -14.4, stature: 0.1608 },
  },
  tibiale: {
    female: { intercept: -103.6, stature: 0.3325 },
    male: { intercept: -119.1, stature: 0.3344 },
  },
  trochanterion: {
    female: { intercept: -126.9, stature: 0.597 },
    male: { intercept: -169.9, stature: 0.6098 },
  },
  hand: {
    female: { intercept: 30.8, stature: 0.0847, mass: 0.181 },
    male: { intercept: 30.0, stature: 0.0883, mass: 0.097 },
  },
  handBreadth: {
    female: { intercept: 41.6, stature: 0.0176, mass: 0.118 },
    male: { intercept: 46.6, stature: 0.0176, mass: 0.126 },
  },
  foot: {
    female: { intercept: 37.9, stature: 0.118, mass: 0.239 },
    male: { intercept: 44.9, stature: 0.12, mass: 0.173 },
  },
  ankle: {
    female: { intercept: 6.0, stature: 0.0348 },
    male: { intercept: 5.0, stature: 0.0387 },
  },
  biacromial: {
    female: { intercept: 84.8, stature: 0.1583, bmi: 1.08, age: -0.17 },
    male: { intercept: 106.3, stature: 0.1482, bmi: 1.91, age: -0.12 },
  },
  bicristal: {
    female: { intercept: -22.7, stature: 0.1229, bmi: 3.5, age: 0.23 },
    male: { intercept: -8.4, stature: 0.1291, bmi: 2.19, age: -0.11 },
  },
  hipBreadth: {
    female: { intercept: -25.7, stature: 0.1443, bmi: 5.59, age: 0.07 },
    male: { intercept: -14.9, stature: 0.1345, bmi: 4.59, age: -0.09 },
  },
};

/**
 * Adult ratios of ANSUR II means (measured): palm length over hand length, foot breadth over foot length and lateral malleolus height over foot length. The last stands in for children, whose ankle height the 1977 survey did not measure.
 */
const ANSUR_II_RATIOS: Record<
  "palm" | "footBreadth" | "ankle",
  Record<AutoMovieHumanSex, number>
> = {
  palm: { female: 0.601, male: 0.603 },
  footBreadth: { female: 0.376, male: 0.376 },
  ankle: { female: 0.255, male: 0.269 },
};

/**
 * Bicristal over bispinous breadth: the ANSUR II adult bicristal fraction of stature over the 1977 survey's 17-18-year bispinous fraction (women 0.168 / 0.148, men 0.157 / 0.134). The 1977 survey measured the anterior superior iliac spines, not the crests, so children's crest breadth follows the spine breadth's growth at this adult ratio. Grade: derived across two surveys.
 */
const BICRISTAL_PER_BISPINOUS: Record<AutoMovieHumanSex, number> = {
  female: 1.135,
  male: 1.172,
};

/**
 * Vertex to the jugular notch in head heights, by the 1977 survey's age bins: means of per-subject (stature − suprasternale height) / stature, fitted by us from the individual records (11 to 53 children per bin; Snyder et al. 1977, UM-HSRI-77-17), times the same bin's stature over head height. Heights are read in head heights because the two were measured on different subsets of children. Below the first bin, where the survey has no standing measures, the 2-to-3-year value holds, so an infant's notch stays close under its large head. Grade: population-fitted, derived below 2.5 years.
 *
 * The notch climbs toward the head the younger the child: 0.24 of stature below the vertex at 2 to 3 years against 0.19 at 17 to 18 and 0.18 in ANSUR II adults, so a toddler's shoulders sit high under the head, where an adult-proportioned neck put them far too low.
 */
const SUPRASTERNALE_HEAD_HEIGHTS: ISexCurve = {
  male: {
    ages: BIN_AGES,
    values: [1.283, 1.301, 1.341, 1.384, 1.4, 1.407, 1.467, 1.488, 1.521],
  },
  female: {
    ages: BIN_AGES,
    values: [1.265, 1.319, 1.364, 1.387, 1.389, 1.457, 1.503, 1.51, 1.522],
  },
};

/**
 * Children's cervicale and acromion above the jugular notch, in head heights: the ANSUR II mean differences of cervicale and acromial height from suprasternale height (women 66.0 and 5.4 mm, men 78.7 and 2.1 mm; Gordon et al. 2014, NATICK/TR-15/007) over the late-adolescent head height of the 1977 survey at the ANSUR mean statures (204.8 and 218.7 mm). The acromion stands level with the notch in adults, the clavicle running nearly horizontal from the sternum, as Gray (1918, "Anatomy of the Human Body") describes it with the arm hanging. Holding both relations at every age is an inference: the 1977 survey measured neither cervicale nor acromial height. The 1975 survey's sitting mid-shoulder height (Snyder et al. 1975, UM-HSRI-BI-75-5) agrees, putting the top of the shoulder about 1.2 head heights below the vertex at 2 to 2.5 years. Grade: derived.
 */
const ABOVE_SUPRASTERNALE: Record<
  "cervicale" | "acromion",
  Record<AutoMovieHumanSex, number>
> = {
  cervicale: { female: 0.322, male: 0.36 },
  acromion: { female: 0.026, male: 0.0096 },
};

/**
 * One unit of slimness as a share of stature: two residual standard deviations of the ANSUR II sitting-height fit (21.3 mm women, 22.4 mm men, about 0.013 of mean stature) and of the biacromial and bicristal fits (14.6 and 16.1 mm women, 14.4 and 12.4 mm men, about 0.0086 of stature). Grade: conventional mapping onto population-fitted spreads.
 */
const SLIMNESS: Record<"sittingHeight" | "breadth", number> = {
  sittingHeight: 2 * 0.013,
  breadth: 2 * 0.0086,
};

/**
 * The last value of a growth curve, its adult hold.
 *
 * @param curve Growth curve
 * @returns Value at the curve's oldest age
 */
function lastValue(curve: IAutoMovieHumanGrowthCurve): number {
  return curve.values[curve.values.length - 1]!;
}

/** Ages over which the child ratios hand over to the adult fits, years. */
const ADULT_FROM: [number, number] = [17.75, 20];

/** Age at which a child's hip breadth takes the adult ratio of hip breadth to bicristal breadth, years. */
const HIP_REFERENCE_AGE: number = 19.5;

/**
 * Lengths, heights and breadths of one person: the skeleton's dimensions and the hip breadth over them.
 *
 * Children take per-subject ratios to stature from the 1977 US child survey, so a child is built from its own age's proportions (sitting height 0.59 of stature at 2 against 0.52 in adults, the legs growing fastest), never from a scaled adult. Adults take our ANSUR II regressions, so taller adults have relatively longer legs (sitting height slope 0.39 against a mean fraction of 0.52). A child's soft-tissue hip breadth follows its pelvis, at the ANSUR II ratio of hip to bicristal breadth for the same BMI at 19.5 years, so it always covers the bony crests. Between 17.75 and 20 years the two hand over linearly, so every age gets one continuous value. Lengths regress on the peak stature, so old age keeps its limbs; the converter subtracts the spinal loss afterwards.
 *
 * Slimness lengthens the legs and arms and shortens the trunk at constant stature, and narrows the bony shoulders and pelvis and the hips over them, one unit being two residual standard deviations of the adult fits. Population is not read: no population-specific body survey was read, so every population gets the same body.
 *
 * @param context Resolved person
 * @param headHeight Head height already estimated, millimetres
 * @returns Body heights and breadths before spinal loss, and the lengths of one arm and one leg
 */
export function estimateAutoMovieHumanLengths(
  context: IAutoMovieHumanConversionContext,
  headHeight: number,
): estimateAutoMovieHumanLengths.IOutput {
  const { sex, age }: IAutoMovieHumanConversionContext = context;
  const stature: number = context.peakStature;
  const mass: number = (context.bmi * stature * stature) / 1e6;
  const regressionAge: number = Math.min(58, Math.max(17, age));
  const fitAt: (
    regression: Record<AutoMovieHumanSex, IRegression>,
    atStature: number,
    atAge: number,
  ) => number = (
    regression: Record<AutoMovieHumanSex, IRegression>,
    atStature: number,
    atAge: number,
  ): number => {
    const r: IRegression = regression[sex];
    return (
      r.intercept +
      r.stature * atStature +
      (r.mass ?? 0) * mass +
      (r.bmi ?? 0) * context.bmi +
      (r.age ?? 0) * atAge
    );
  };
  const fit: (regression: Record<AutoMovieHumanSex, IRegression>) => number = (
    regression: Record<AutoMovieHumanSex, IRegression>,
  ): number => fitAt(regression, stature, regressionAge);
  const ratio: (curve: ISexCurve) => number = (curve: ISexCurve): number =>
    interpolateAutoMovieHumanGrowthCurve(curve[sex], age);
  const weight: number = Math.min(
    1,
    Math.max(0, (age - ADULT_FROM[0]) / (ADULT_FROM[1] - ADULT_FROM[0])),
  );
  const blend: (child: () => number, adult: () => number) => number = (
    child: () => number,
    adult: () => number,
  ): number =>
    weight === 0
      ? child()
      : weight === 1
        ? adult()
        : (1 - weight) * child() + weight * adult();

  const childSuprasternale: number =
    stature - ratio(SUPRASTERNALE_HEAD_HEIGHTS) * headHeight;
  const suprasternaleHeight: number = blend(
    (): number => childSuprasternale,
    (): number => fit(ANSUR_II.suprasternaleHeight),
  );
  const cervicaleHeight: number = blend(
    (): number =>
      childSuprasternale + ABOVE_SUPRASTERNALE.cervicale[sex] * headHeight,
    (): number => fit(ANSUR_II.cervicaleHeight),
  );
  const childHand: number = ratio(SNYDER_1977_HAND.handToStature) * stature;
  const handLength: number = blend(
    (): number => childHand,
    (): number => fit(ANSUR_II.hand),
  );
  const footLength: number = blend(
    (): number => childHand / ratio(SNYDER_1977_HAND.handToFoot),
    (): number => fit(ANSUR_II.foot),
  );
  const sittingHeight: number = blend(
    (): number => ratio(SNYDER_1977.sittingHeight) * stature,
    (): number => fit(ANSUR_II.sittingHeight),
  );
  const trochanterion: number = blend(
    (): number => ratio(SNYDER_1977.trochanterion) * stature,
    (): number => fit(ANSUR_II.trochanterion),
  );
  const tibiale: number = blend(
    (): number => ratio(SNYDER_1977.tibiale) * stature,
    (): number => fit(ANSUR_II.tibiale),
  );
  const ankleHeight: number = blend(
    (): number => ANSUR_II_RATIOS.ankle[sex] * footLength,
    (): number => fit(ANSUR_II.ankle),
  );
  const acromialHeight: number = blend(
    (): number =>
      childSuprasternale + ABOVE_SUPRASTERNALE.acromion[sex] * headHeight,
    (): number => fit(ANSUR_II.acromialHeight),
  );

  // slimness: a longer subischial leg and longer arms at constant stature
  const slimness: number = context.build.slimness;
  const slimSittingHeight: number =
    sittingHeight - SLIMNESS.sittingHeight * stature * slimness;
  const limbScale: number =
    (stature - slimSittingHeight) / (stature - sittingHeight);
  const narrowing: number = SLIMNESS.breadth * stature * slimness;
  const childBicristal: () => number = (): number =>
    ratio(SNYDER_1977.bispinous) * BICRISTAL_PER_BISPINOUS[sex] * stature;
  const bicristalBreadth: number = blend(childBicristal, (): number =>
    fit(ANSUR_II.bicristal),
  );
  // a child's soft hip breadth grows with its pelvis at the young adult's ratio for the same BMI
  const referenceStature: number = estimateAutoMovieHumanMedianStature(
    sex,
    HIP_REFERENCE_AGE,
  );
  const hipBreadth: number = blend(
    (): number =>
      (childBicristal() *
        fitAt(ANSUR_II.hipBreadth, referenceStature, HIP_REFERENCE_AGE)) /
      fitAt(ANSUR_II.bicristal, referenceStature, HIP_REFERENCE_AGE),
    (): number => fit(ANSUR_II.hipBreadth),
  );
  return {
    sittingHeight: slimSittingHeight,
    cervicaleHeight,
    suprasternaleHeight,
    acromialHeight,
    biacromialBreadth:
      blend(
        (): number => ratio(SNYDER_1977.biacromial) * stature,
        (): number => fit(ANSUR_II.biacromial),
      ) - narrowing,
    bicristalBreadth: bicristalBreadth - narrowing,
    hipBreadth: hipBreadth - narrowing,
    arm: {
      upperArmLength:
        limbScale *
        blend(
          (): number => ratio(SNYDER_1977.upperArm) * stature,
          (): number => fit(ANSUR_II.upperArm),
        ),
      forearmLength:
        limbScale *
        blend(
          (): number => ratio(SNYDER_1977.forearm) * stature,
          (): number => fit(ANSUR_II.forearm),
        ),
      handLength: limbScale * handLength,
      handBreadth: blend(
        (): number => handLength * ratio(SNYDER_1977_HAND.breadthToHand),
        (): number => fit(ANSUR_II.handBreadth),
      ),
      // the adult palm share, with the finger beyond it grown along the survey's curve
      palmLength:
        limbScale *
        handLength *
        (1 -
          (1 - ANSUR_II_RATIOS.palm[sex]) *
            (ratio(SNYDER_1977_DIGITS.middle) /
              lastValue(SNYDER_1977_DIGITS.middle[sex]))),
      thumbLength: limbScale * handLength * ratio(SNYDER_1977_DIGITS.thumb),
    },
    leg: {
      thighLength: limbScale * (trochanterion - tibiale),
      shankLength: limbScale * (tibiale - ankleHeight),
      ankleHeight: limbScale * ankleHeight,
      footLength,
      footBreadth:
        footLength *
        blend(
          (): number => ratio(SNYDER_1977_HAND.footBreadthToFoot),
          (): number => ANSUR_II_RATIOS.footBreadth[sex],
        ),
    },
  };
}
/** Output type of {@link estimateAutoMovieHumanLengths}. */
export namespace estimateAutoMovieHumanLengths {
  /**
   * Skeletal dimensions before old-age spinal loss, millimetres.
   *
   * @author Samchon
   */
  export interface IOutput {
    /** Sitting height. */
    sittingHeight: number;

    /** Cervicale height. */
    cervicaleHeight: number;

    /** Suprasternale height. */
    suprasternaleHeight: number;

    /** Acromial height. */
    acromialHeight: number;

    /** Biacromial breadth. */
    biacromialBreadth: number;

    /** Bicristal breadth. */
    bicristalBreadth: number;

    /** Soft-tissue hip breadth. */
    hipBreadth: number;

    /** Lengths of one arm. */
    arm: Pick<
      IAutoMovieHumanIdentity.IArm,
      | "upperArmLength"
      | "forearmLength"
      | "handLength"
      | "handBreadth"
      | "palmLength"
      | "thumbLength"
    >;

    /** Lengths of one leg. */
    leg: Pick<
      IAutoMovieHumanIdentity.ILeg,
      "thighLength" | "shankLength" | "ankleHeight" | "footLength" | "footBreadth"
    >;
  }
}
