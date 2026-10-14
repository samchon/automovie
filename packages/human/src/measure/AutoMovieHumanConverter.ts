import { AutoMovieHumanSex } from "../structures/AutoMovieHumanSex";
import { IAutoMovieHumanAppearance } from "../structures/IAutoMovieHumanAppearance";
import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";
import { IAutoMovieHumanTraits } from "../structures/IAutoMovieHumanTraits";
import { AutoMovieHumanAdmissionError } from "./AutoMovieHumanAdmissionError";
import { IAutoMovieHumanConverter } from "./IAutoMovieHumanConverter";

/**
 * Adult body means by sex from the 2012 US Army Anthropometric Survey working databases (ANSUR II; Gordon et al. 2014, NATICK/TR-15/007; Paquette and Parham 2017), 1,986 women and 4,082 men aged 17 to 58, millimetres, right side, standing. Thigh and shank lengths are differences of the published trochanterion, tibiale and lateral malleolus height means. Grade: measured.
 */
const ANSUR_II: Record<AutoMovieHumanSex, IAnsurMeans> = {
  female: {
    stature: 1628.5,
    sittingHeight: 856.6,
    cervicaleHeight: 1395.7,
    acromialHeight: 1335.1,
    biacromialBreadth: 365.3,
    bicristalBreadth: 273.3,
    hipBreadth: 353.8,
    neckCircumference: 329.8,
    chestCircumference: 946.9,
    buttockCircumference: 1021.2,
    upperArmLength: 311.2,
    forearmLength: 241.3,
    handLength: 181.1,
    handBreadth: 78.2,
    forearmCircumference: 264.1,
    wristCircumference: 154.8,
    thighLength: 845.4 - 437.8,
    shankLength: 437.8 - 62.7,
    ankleHeight: 62.7,
    footLength: 246.3,
    footBreadth: 92.7,
    thighCircumference: 616.1,
    calfCircumference: 373.3,
    ankleCircumference: 215.7,
  },
  male: {
    stature: 1756.2,
    sittingHeight: 918.3,
    cervicaleHeight: 1517.3,
    acromialHeight: 1440.7,
    biacromialBreadth: 415.7,
    bicristalBreadth: 275.4,
    hipBreadth: 345.7,
    neckCircumference: 397.6,
    chestCircumference: 1058.7,
    buttockCircumference: 1019.5,
    upperArmLength: 335.2,
    forearmLength: 267.9,
    handLength: 193.3,
    handBreadth: 88.3,
    forearmCircumference: 310.1,
    wristCircumference: 175.9,
    thighLength: 900.9 - 468.2,
    shankLength: 468.2 - 72.9,
    ankleHeight: 72.9,
    footLength: 271.2,
    footBreadth: 101.9,
    thighCircumference: 625.1,
    calfCircumference: 392.3,
    ankleCircumference: 229.3,
  },
};

/**
 * Natural (narrowest) waist over hip circumference at 17 to 18 years in the 1977 US child survey (Snyder et al. 1977, UM-HSRI-77-17): 0.717 for girls, 0.848 for boys. ANSUR II measures its waist at the navel, so the placeholder takes the natural waist as this ratio of the ANSUR II buttock circumference. Grade: derived across two surveys.
 */
const NATURAL_WAIST_TO_HIP: Record<AutoMovieHumanSex, number> = {
  female: 0.717,
  male: 0.848,
};

/**
 * Relaxed mid-upper arm circumference, the NHANES 2015-2018 means at 40 to 49 years, the only adult ages read: 333 mm for women, 356 mm for men (Fryar et al. 2021, Vital Health Stat 3(46)). Grade: measured.
 */
const UPPER_ARM_CIRCUMFERENCE: Record<AutoMovieHumanSex, number> = {
  female: 333,
  male: 356,
};

/**
 * Stature over head height at 17 to 18 years in the 1977 US child survey: 7.95 for girls, 8.03 for boys. Grade: population-fitted.
 */
const HEADS_PER_STATURE: Record<AutoMovieHumanSex, number> = {
  female: 7.95,
  male: 8.03,
};

/**
 * Adult head and face means of US adults of European ancestry aged 20 to 40 from the 3D Facial Norms summary data (Weinberg et al. 2016, Cleft Palate Craniofac J 53(6):e185-e197), millimetres; the cephalic index is derived from the length means and the breadth means (145.8 mm for women, 152.3 mm for men). Grade: measured, index derived.
 */
const FACIAL_NORMS: Record<AutoMovieHumanSex, IHeadMeans> = {
  female: {
    headLength: 187.3,
    cephalicIndex: (100 * 145.8) / 187.3,
    faceHeight: 118.6,
    faceWidth: 129.8,
    mandibularWidth: 97.0,
    minimumFrontalWidth: 105.5,
  },
  male: {
    headLength: 198.3,
    cephalicIndex: (100 * 152.3) / 198.3,
    faceHeight: 127.2,
    faceWidth: 137.6,
    mandibularWidth: 104.5,
    minimumFrontalWidth: 111.4,
  },
};

/**
 * Head circumference over the Ramanujan perimeter of the ellipse with the head's length and breadth, derived from the NIOSH baseline means of US workers (Zhuang et al. 2010, Ann Occup Hyg 54(4):391-402). Grade: derived.
 */
const CIRCUMFERENCE_OVER_ELLIPSE: number = 1.04;

/**
 * Dual-energy X-ray absorptiometry reference values from NHANES (Kelly et al. 2009, PLoS ONE 4(9):e7038): body fat percentage of White adults at 25 years and appendicular lean mass index at 20 years. Grade: measured.
 */
const COMPOSITION: Record<AutoMovieHumanSex, IAutoMovieHumanIdentity.IComposition> = {
  female: { bodyFatPercentage: 36.0, appendicularLeanMassIndex: 6.81 },
  male: { bodyFatPercentage: 24.6, appendicularLeanMassIndex: 8.87 },
};

/** Youngest age in ANSUR II, years. */
const MIN_AGE: number = 17;

/** Oldest age in ANSUR II, years. */
const MAX_AGE: number = 58;

/**
 * The default converter: a placeholder that maps traits to adult population means until the regressions of the published growth and anthropometric surveys replace it.
 *
 * What it does, exactly:
 *
 * - Body: the ANSUR II mean of the given sex, every length, breadth and girth scaled by stature over the mean stature. Isometric scaling ignores that taller adults have relatively longer legs; the regressions correct it.
 * - Head and face: the 3D Facial Norms means of the given sex, unscaled; head height is stature over the 1977 survey's late-adolescent heads-per-stature ratio, and head circumference follows head length and breadth through the NIOSH-derived ellipse ratio.
 * - Composition: NHANES DXA means of the given sex.
 * - Pigmentation: a moderately pigmented skin within the melanin fractions Jacques (1998) reports, the eumelanin share Donner and Jensen (2006) illustrate, a mid-range haemoglobin fraction and a brown iris. Grade: conventional.
 * - Population and build offsets are not read yet: every population and build gives the same mean adult.
 *
 * Ages outside the 17 to 58 years ANSUR II measured are refused rather than scaled from an adult, because a child's proportions are not an adult's: head height over stature falls from about 1/5.3 at age 2 to 1/8 at 18.
 *
 * @author Samchon
 */
export class AutoMovieHumanConverter implements IAutoMovieHumanConverter {
  public toIdentity(traits: IAutoMovieHumanTraits): IAutoMovieHumanIdentity {
    if (traits.age < MIN_AGE || traits.age > MAX_AGE)
      throw new AutoMovieHumanAdmissionError("traits", [
        {
          path: "$input.age",
          value: traits.age,
          expected: `between ${MIN_AGE} and ${MAX_AGE} years`,
          description:
            "the default converter holds adult survey means only and refuses to scale an adult to another age",
        },
      ]);
    const means: IAnsurMeans = ANSUR_II[traits.sex];
    const stature: number = traits.stature ?? means.stature;
    const scale: (value: number) => number = (value: number): number =>
      (value * stature) / means.stature;
    const arm: IAutoMovieHumanIdentity.IArm = {
      upperArmLength: scale(means.upperArmLength),
      forearmLength: scale(means.forearmLength),
      handLength: scale(means.handLength),
      handBreadth: scale(means.handBreadth),
      upperArmCircumference: scale(UPPER_ARM_CIRCUMFERENCE[traits.sex]),
      forearmCircumference: scale(means.forearmCircumference),
      wristCircumference: scale(means.wristCircumference),
    };
    const leg: IAutoMovieHumanIdentity.ILeg = {
      thighLength: scale(means.thighLength),
      shankLength: scale(means.shankLength),
      ankleHeight: scale(means.ankleHeight),
      footLength: scale(means.footLength),
      footBreadth: scale(means.footBreadth),
      thighCircumference: scale(means.thighCircumference),
      calfCircumference: scale(means.calfCircumference),
      ankleCircumference: scale(means.ankleCircumference),
    };
    const face: IHeadMeans = FACIAL_NORMS[traits.sex];
    return {
      version: 1,
      body: {
        stature,
        sittingHeight: scale(means.sittingHeight),
        cervicaleHeight: scale(means.cervicaleHeight),
        acromialHeight: scale(means.acromialHeight),
        biacromialBreadth: scale(means.biacromialBreadth),
        bicristalBreadth: scale(means.bicristalBreadth),
        hipBreadth: scale(means.hipBreadth),
        neckCircumference: scale(means.neckCircumference),
        chestCircumference: scale(means.chestCircumference),
        waistCircumference: scale(
          NATURAL_WAIST_TO_HIP[traits.sex] * means.buttockCircumference,
        ),
        buttockCircumference: scale(means.buttockCircumference),
        leftArm: { ...arm },
        rightArm: { ...arm },
        leftLeg: { ...leg },
        rightLeg: { ...leg },
      },
      head: {
        headLength: face.headLength,
        cephalicIndex: face.cephalicIndex,
        headCircumference:
          CIRCUMFERENCE_OVER_ELLIPSE *
          ellipsePerimeter(
            face.headLength / 2,
            (face.headLength * face.cephalicIndex) / 200,
          ),
        headHeight: stature / HEADS_PER_STATURE[traits.sex],
        faceHeight: face.faceHeight,
        faceWidth: face.faceWidth,
        mandibularWidth: face.mandibularWidth,
        minimumFrontalWidth: face.minimumFrontalWidth,
      },
      composition: { ...COMPOSITION[traits.sex] },
      pigmentation: {
        melanin: 0.12,
        eumelaninShare: 0.7,
        haemoglobin: 0.05,
        iris: "brown",
      },
    };
  }

  /**
   * Default appearance: underwear by sex (briefs for a male person, briefs and a bra for a female person) in white, dark brown hair, brows and lashes, a lash length below the 12 mm natural lashes rarely exceed, mid-range skin oil, and a round hairline with a gently waved curl. Hair length is a short cut for a male person and shoulder length for a female person. Grade: conventional defaults, not population statistics.
   */
  public toAppearance(traits: IAutoMovieHumanTraits): IAutoMovieHumanAppearance {
    const female: boolean = traits.sex === "female";
    return {
      version: 1,
      skin: { oiliness: 0.5 },
      hair: {
        color: "darkBrown",
        length: female ? 400 : 40,
        curl: "II",
        hairline: "round",
      },
      brows: { color: "darkBrown" },
      lashes: { color: "darkBrown", length: 10 },
      underwear: {
        bottom: "briefs",
        top: female ? "bra" : "none",
        color: "#FFFFFF",
      },
    };
  }
}

/** Body means the placeholder scales, millimetres. */
interface IAnsurMeans {
  stature: number;
  sittingHeight: number;
  cervicaleHeight: number;
  acromialHeight: number;
  biacromialBreadth: number;
  bicristalBreadth: number;
  hipBreadth: number;
  neckCircumference: number;
  chestCircumference: number;
  buttockCircumference: number;
  upperArmLength: number;
  forearmLength: number;
  handLength: number;
  handBreadth: number;
  forearmCircumference: number;
  wristCircumference: number;
  thighLength: number;
  shankLength: number;
  ankleHeight: number;
  footLength: number;
  footBreadth: number;
  thighCircumference: number;
  calfCircumference: number;
  ankleCircumference: number;
}

/** Head and face means the placeholder copies, millimetres except the index. */
interface IHeadMeans {
  headLength: number;
  cephalicIndex: number;
  faceHeight: number;
  faceWidth: number;
  mandibularWidth: number;
  minimumFrontalWidth: number;
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
