import { AutoMovieHumanPopulation } from "../structures/AutoMovieHumanPopulation";
import { AutoMovieHumanSex } from "../structures/AutoMovieHumanSex";
import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";
import { IAutoMovieHumanConversionContext } from "./IAutoMovieHumanConversionContext";
import { IAutoMovieHumanGrowthCurve } from "./IAutoMovieHumanGrowthCurve";
import { estimateAutoMovieHumanEar } from "./estimateAutoMovieHumanEar";
import { estimateAutoMovieHumanMedianStature } from "./estimateAutoMovieHumanMedianStature";
import { interpolateAutoMovieHumanGrowthCurve } from "./interpolateAutoMovieHumanGrowthCurve";

/** A curve for each sex. */
type ISexCurve = Record<AutoMovieHumanSex, IAutoMovieHumanGrowthCurve>;

/**
 * Stature over head height (vertex to menton), the 1977 US child survey's means of per-subject ratios at the centres of its one-year bins (Snyder et al. 1977, UM-HSRI-77-17; individual records published by NIST as AnthroKids), fitted by us, with a birth sample of 4: "at birth, head length is approximately one quarter of total body length" (Bogin and Varela-Silva 2010, Int J Environ Res Public Health 7(3):1047-1075). Adults keep the 17-18-year value. Grade: population-fitted, birth value conventional as stated by the review.
 */
const HEADS_PER_STATURE: ISexCurve = {
  male: {
    ages: [0, 2.5, 4.5, 6.5, 8.5, 10.5, 12.5, 14.5, 16.5, 17.75],
    values: [4, 5.29, 5.82, 6.31, 6.79, 7.17, 7.42, 7.76, 8.03, 8.03],
  },
  female: {
    ages: [0, 2.5, 4.5, 6.5, 8.5, 10.5, 12.5, 14.5, 16.5, 17.75],
    values: [4, 5.36, 5.91, 6.36, 6.86, 7.19, 7.63, 7.89, 7.93, 7.95],
  },
};

/**
 * Head circumference medians, millimetres, of the WHO Child Growth Standards head-circumference-for-age workbooks (birth to 5 years). Used only to carry the vault below 3.5 years, where no length and breadth norms were read. Grade: measured, then population-fitted (LMS).
 */
const WHO_HEAD_CIRCUMFERENCE: ISexCurve = {
  male: {
    ages: [0, 0.25, 0.5, 1, 2, 3, 4, 5],
    values: [344.6, 405.1, 433.3, 460.7, 482.5, 494.6, 502.1, 507.4],
  },
  female: {
    ages: [0, 0.25, 0.5, 1, 2, 3, 4, 5],
    values: [338.8, 395.3, 422.0, 449.0, 471.8, 485.1, 493.3, 499.2],
  },
};

/** Age groups of the 3D Facial Norms growth means, at their centres (3-4, 6-7, 10-11, 14-15, 20-40 years). */
const NORM_AGES: number[] = [3.5, 6.5, 10.5, 14.5, 30];

/**
 * Head and face means by age group of US children and adults of European ancestry from the 3D Facial Norms summary data (Weinberg et al. 2016, Cleft Palate Craniofac J 53(6):e185-e197), millimetres. The converter reads them as fractions of the adult value, so they shape growth for every population while the population's own adult means set the size. Minimum frontal width has no growth means here and follows face width. Grade: measured.
 */
const FACIAL_NORMS_GROWTH: Record<
  "headLength" | "headBreadth" | "faceWidth" | "mandibularWidth" | "faceHeight",
  ISexCurve
> = {
  headLength: {
    male: { ages: NORM_AGES, values: [173.6, 178.6, 186.3, 192.5, 198.3] },
    female: { ages: NORM_AGES, values: [171.7, 175.9, 175.6, 187.3, 187.3] },
  },
  headBreadth: {
    male: { ages: NORM_AGES, values: [141.2, 141.7, 143.7, 150.2, 152.3] },
    female: { ages: NORM_AGES, values: [135.4, 138.2, 141.4, 145.6, 145.8] },
  },
  faceWidth: {
    male: { ages: NORM_AGES, values: [114.0, 117.9, 124.5, 131.3, 137.6] },
    female: { ages: NORM_AGES, values: [109.6, 116.0, 122.4, 128.1, 129.8] },
  },
  mandibularWidth: {
    male: { ages: NORM_AGES, values: [80.7, 86.8, 91.2, 98.0, 104.5] },
    female: { ages: NORM_AGES, values: [78.6, 84.9, 88.8, 92.6, 97.0] },
  },
  faceHeight: {
    male: { ages: NORM_AGES, values: [93.1, 103.0, 109.9, 120.8, 127.2] },
    female: { ages: NORM_AGES, values: [93.3, 100.3, 105.7, 109.6, 118.6] },
  },
};

/** Adult head and face means of one population and sex, millimetres. */
interface IAdultHead {
  headLength: number;
  headBreadth: number;
  faceWidth: number;
  mandibularWidth: number;
  minimumFrontalWidth: number;
  faceHeight: number;
  /** Head circumference over the Ramanujan perimeter of the length-breadth ellipse. */
  circumferencePerEllipse: number;
}

/**
 * Adult head and face means by population and sex. Grade: measured; protocols differ between sources (3D surface against caliper), so compare within a source before across.
 *
 * - European: 3D Facial Norms, US adults of European ancestry aged 20 to 40 (Weinberg et al. 2016); circumference over the ellipse 1.04 from the NIOSH baseline of US workers (Zhuang et al. 2010, Ann Occup Hyg 54(4):391-402).
 * - East Asian: Chinese workers aged 18 to 66 by caliper (Du et al. 2008, Ann Occup Hyg 52(8):773-782), circumference over the ellipse 1.051 for men and 1.061 for women derived from the same means. Its face length runs from sellion rather than nasion, so face height keeps the European nasion-to-gnathion mean.
 * - African: Kenyan adults by direct caliper (Virdi et al. 2019) for face, mandibular and minimum frontal widths. No vault length, breadth or nasion-to-gnathion height of an African population was read, so those keep the European means.
 */
const ADULT_HEAD: Record<
  AutoMovieHumanPopulation,
  Record<AutoMovieHumanSex, IAdultHead>
> = {
  european: {
    male: { headLength: 198.3, headBreadth: 152.3, faceWidth: 137.6, mandibularWidth: 104.5, minimumFrontalWidth: 111.4, faceHeight: 127.2, circumferencePerEllipse: 1.04 },
    female: { headLength: 187.3, headBreadth: 145.8, faceWidth: 129.8, mandibularWidth: 97.0, minimumFrontalWidth: 105.5, faceHeight: 118.6, circumferencePerEllipse: 1.04 },
  },
  eastAsian: {
    male: { headLength: 185.7, headBreadth: 157.2, faceWidth: 147.5, mandibularWidth: 119.0, minimumFrontalWidth: 108.7, faceHeight: 127.2, circumferencePerEllipse: 1.051 },
    female: { headLength: 176.7, headBreadth: 150.5, faceWidth: 139.9, mandibularWidth: 114.2, minimumFrontalWidth: 106.6, faceHeight: 118.6, circumferencePerEllipse: 1.061 },
  },
  african: {
    male: { headLength: 198.3, headBreadth: 152.3, faceWidth: 133.8, mandibularWidth: 106.6, minimumFrontalWidth: 115.3, faceHeight: 127.2, circumferencePerEllipse: 1.04 },
    female: { headLength: 187.3, headBreadth: 145.8, faceWidth: 130.1, mandibularWidth: 96.8, minimumFrontalWidth: 111.2, faceHeight: 118.6, circumferencePerEllipse: 1.04 },
  },
};

/**
 * Elasticity of each head dimension with stature among adults of one sex, the slope of our ordinary least squares fit on stature times mean stature over the mean dimension, from the public ANSUR II working databases (Gordon et al. 2014, NATICK/TR-15/007; 1,986 women and 4,082 men), women and men averaged: head length 0.356 and 0.333, head breadth 0.139 and 0.069, menton-sellion length (face height) 0.407 and 0.421, bizygomatic breadth (face width) 0.199 and 0.159. Head height (vertex to menton) is not in ANSUR II; it takes the tragion-to-top-of-head elasticity (0.287 and 0.239) for the 0.6 of head height above tragion and the face's for the rest, 0.32. Head size correlates only weakly with stature (R2 0.01 to 0.14). Holding the adult elasticities for a child that is tall or short for its age is an inference. Grade: population-fitted, head height derived.
 */
const STATURE_ELASTICITY: Record<
  "headLength" | "headBreadth" | "headHeight" | "faceHeight" | "faceWidth",
  number
> = {
  headLength: 0.345,
  headBreadth: 0.104,
  headHeight: 0.32,
  faceHeight: 0.414,
  faceWidth: 0.179,
};

/**
 * Active maximum mouth opening and laterotrusion, millimetres, the mixed-model growth curves of 169 healthy Dutch children aged 6 to 18 (Verkouteren et al. 2022, Eur J Oral Sci 130(3):e12869) at 6 and 18 years. Grade: population-fitted.
 */
const VERKOUTEREN_2022: Record<"mouthOpening" | "mandibularLaterotrusion", ISexCurve> = {
  mouthOpening: {
    male: { ages: [6, 18], values: [45.0, 55.3] },
    female: { ages: [6, 18], values: [42.8, 50.5] },
  },
  mandibularLaterotrusion: {
    male: { ages: [6, 18], values: [9.2, 10.4] },
    female: { ages: [6, 18], values: [9.1, 10.3] },
  },
};

/**
 * The head of one person: vault, face frame and jaw mobility.
 *
 * Head size grows on its own curve, not with the body: head height is the median stature for age over the 1977 survey's stature-to-head-height ratio (4 at birth, 5.3 at 2, 8.0 at 18), so a child's large head comes from growth data rather than from shrinking an adult. Vault and face dimensions are the population's adult means times the 3D Facial Norms growth fractions for the age, which keeps the child's face small under a nearly grown vault (face height 73% and vault length 88% of adult at 3 to 4 years). Below 3.5 years, where no face norms were read, the vault follows the WHO head circumference and the face follows head height.
 *
 * Every head dimension then scales with the person's stature over the median stature for age raised to its own allometric exponent ({@link STATURE_ELASTICITY}), so a tall adult's head is relatively smaller and a short adult's relatively larger, as ANSUR II measures: a 12% taller woman has a head 4% longer and 1% broader, not 12%. Head circumference follows the vault through the population's circumference-to-ellipse ratio, so it always lies within the bounds admission checks. Cuteness is not read yet: it shapes the face features, whose generators define it.
 *
 * Mouth opening and laterotrusion follow the 6-to-18-year growth curves, hold the 18-year value in adults (no adult norm was read) and scale with face height below 6. Both ears take {@link estimateAutoMovieHumanEar}.
 *
 * @param context Resolved person
 * @returns The head group of the identity
 */
export function estimateAutoMovieHumanHead(
  context: IAutoMovieHumanConversionContext,
): IAutoMovieHumanIdentity.IHead {
  const { sex, age }: IAutoMovieHumanConversionContext = context;
  const read: (curve: ISexCurve, at: number) => number = (
    curve: ISexCurve,
    at: number,
  ): number => interpolateAutoMovieHumanGrowthCurve(curve[sex], at);
  const adult: IAdultHead = ADULT_HEAD[context.population][sex];
  const relative: number = context.peakStature / context.medianStature;
  const size: (dimension: keyof typeof STATURE_ELASTICITY) => number = (
    dimension: keyof typeof STATURE_ELASTICITY,
  ): number => relative ** STATURE_ELASTICITY[dimension];
  const firstNorm: number = NORM_AGES[0]!;

  // head height at the median stature for age, the head's own growth curve
  const medianHeadHeight: (at: number) => number = (at: number): number =>
    estimateAutoMovieHumanMedianStature(sex, at) / read(HEADS_PER_STATURE, at);

  // vault and face below the first norm age follow head circumference and head height
  const vaultCarry: number =
    age < firstNorm
      ? read(WHO_HEAD_CIRCUMFERENCE, age) /
        read(WHO_HEAD_CIRCUMFERENCE, firstNorm)
      : 1;
  const faceCarry: (at: number) => number = (at: number): number =>
    at < firstNorm ? medianHeadHeight(at) / medianHeadHeight(firstNorm) : 1;
  const fraction: (
    norm: keyof typeof FACIAL_NORMS_GROWTH,
    at: number,
  ) => number = (norm: keyof typeof FACIAL_NORMS_GROWTH, at: number): number => {
    const curve: IAutoMovieHumanGrowthCurve = FACIAL_NORMS_GROWTH[norm][sex];
    return (
      interpolateAutoMovieHumanGrowthCurve(curve, at) /
      curve.values[curve.values.length - 1]!
    );
  };

  const headLength: number =
    adult.headLength * fraction("headLength", age) * vaultCarry * size("headLength");
  const headBreadth: number =
    adult.headBreadth * fraction("headBreadth", age) * vaultCarry * size("headBreadth");
  const faceScale: number = faceCarry(age) * size("faceWidth");
  const faceHeight: number =
    adult.faceHeight * fraction("faceHeight", age) * faceCarry(age) * size("faceHeight");
  const faceWidth: number = adult.faceWidth * fraction("faceWidth", age) * faceScale;

  // the auricle grows on its own curves (see estimateAutoMovieHumanEar)
  const ear: IAutoMovieHumanIdentity.IEar = estimateAutoMovieHumanEar(context);

  // jaw mobility, scaled by face height below the youngest measured age
  const jawAge: number = Math.max(age, 6);
  const jawScale: number =
    age < 6
      ? (fraction("faceHeight", age) * faceCarry(age)) / fraction("faceHeight", 6)
      : 1;
  return {
    headLength,
    cephalicIndex: (100 * headBreadth) / headLength,
    headCircumference:
      adult.circumferencePerEllipse *
      ellipsePerimeter(headLength / 2, headBreadth / 2),
    headHeight: medianHeadHeight(age) * size("headHeight"),
    faceHeight,
    faceWidth,
    mandibularWidth:
      adult.mandibularWidth * fraction("mandibularWidth", age) * faceScale,
    minimumFrontalWidth:
      adult.minimumFrontalWidth * fraction("faceWidth", age) * faceScale,
    mouthOpening: read(VERKOUTEREN_2022.mouthOpening, jawAge) * jawScale,
    mandibularLaterotrusion:
      read(VERKOUTEREN_2022.mandibularLaterotrusion, jawAge) * jawScale,
    leftEar: ear,
    rightEar: { ...ear },
  };
}

/**
 * Ramanujan's first approximation of an ellipse perimeter, π(3(a + b) − √((3a + b)(a + 3b))), exact for a circle and within a fraction of a percent at head proportions.
 *
 * @param a Semi-axis
 * @param b Other semi-axis
 * @returns Perimeter in the unit of the semi-axes
 */
function ellipsePerimeter(a: number, b: number): number {
  return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
}
