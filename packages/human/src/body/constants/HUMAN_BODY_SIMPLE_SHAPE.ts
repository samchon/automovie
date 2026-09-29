import type { IAutoMovieHumanBodySimpleShapeTable } from "../structures/IAutoMovieHumanBodySimpleShapeTable";
import { HUMAN_BODY_SIMPLE_SHAPE_DEVELOPMENT } from "./simple-shape/HUMAN_BODY_SIMPLE_SHAPE_DEVELOPMENT";
import { HUMAN_BODY_SIMPLE_SHAPE_GLUTEAL } from "./simple-shape/HUMAN_BODY_SIMPLE_SHAPE_GLUTEAL";
import { HUMAN_BODY_SIMPLE_SHAPE_ABDOMINAL_FAT } from "./simple-shape/HUMAN_BODY_SIMPLE_SHAPE_ABDOMINAL_FAT";
import { HUMAN_BODY_SIMPLE_SHAPE_OUTER_THIGH_FAT } from "./simple-shape/HUMAN_BODY_SIMPLE_SHAPE_OUTER_THIGH_FAT";
import { HUMAN_BODY_SIMPLE_SHAPE_MUSCLE_RELIEF } from "./simple-shape/HUMAN_BODY_SIMPLE_SHAPE_MUSCLE_RELIEF";
import { HUMAN_BODY_SIMPLE_SHAPE_BREAST } from "./simple-shape/HUMAN_BODY_SIMPLE_SHAPE_BREAST";
import { HUMAN_BODY_SIMPLE_SHAPE_ABDOMEN } from "./simple-shape/HUMAN_BODY_SIMPLE_SHAPE_ABDOMEN";
import { HUMAN_BODY_SIMPLE_SHAPE_NECK } from "./simple-shape/HUMAN_BODY_SIMPLE_SHAPE_NECK";
import { HUMAN_BODY_SIMPLE_SHAPE_UPPER_ARM_FAT_LEFT } from "./simple-shape/HUMAN_BODY_SIMPLE_SHAPE_UPPER_ARM_FAT_LEFT";
import { HUMAN_BODY_SIMPLE_SHAPE_UPPER_LEG_FAT_LEFT } from "./simple-shape/HUMAN_BODY_SIMPLE_SHAPE_UPPER_LEG_FAT_LEFT";
import { HUMAN_BODY_SIMPLE_SHAPE_UPPER_ARM_FAT_RIGHT } from "./simple-shape/HUMAN_BODY_SIMPLE_SHAPE_UPPER_ARM_FAT_RIGHT";
import { HUMAN_BODY_SIMPLE_SHAPE_UPPER_LEG_FAT_RIGHT } from "./simple-shape/HUMAN_BODY_SIMPLE_SHAPE_UPPER_LEG_FAT_RIGHT";
import { HUMAN_BODY_SIMPLE_SHAPE_DEFINITION } from "./simple-shape/HUMAN_BODY_SIMPLE_SHAPE_DEFINITION";
import { HUMAN_BODY_SIMPLE_SHAPE_SURVEY_HIP_SECTION } from "./simple-shape/HUMAN_BODY_SIMPLE_SHAPE_SURVEY_HIP_SECTION";
import { HUMAN_BODY_SIMPLE_SHAPE_SURVEY_LEG_FAT } from "./simple-shape/HUMAN_BODY_SIMPLE_SHAPE_SURVEY_LEG_FAT";
import { HUMAN_BODY_SIMPLE_SHAPE_SURVEY_BREAST_POSITION } from "./simple-shape/HUMAN_BODY_SIMPLE_SHAPE_SURVEY_BREAST_POSITION";
import { HUMAN_BODY_SIMPLE_SHAPE_SURVEY_HIP_HEIGHT } from "./simple-shape/HUMAN_BODY_SIMPLE_SHAPE_SURVEY_HIP_HEIGHT";
import { HUMAN_BODY_SIMPLE_SHAPE_SURVEY_DISTAL } from "./simple-shape/HUMAN_BODY_SIMPLE_SHAPE_SURVEY_DISTAL";
import { HUMAN_BODY_SIMPLE_SHAPE_SURVEY_TORSO_SECTION } from "./simple-shape/HUMAN_BODY_SIMPLE_SHAPE_SURVEY_TORSO_SECTION";
import { HUMAN_BODY_SIMPLE_SHAPE_SURVEY_LEG_LENGTH } from "./simple-shape/HUMAN_BODY_SIMPLE_SHAPE_SURVEY_LEG_LENGTH";
import { HUMAN_BODY_SIMPLE_SHAPE_SURVEY_TORSO_MASS_SECTION } from "./simple-shape/HUMAN_BODY_SIMPLE_SHAPE_SURVEY_TORSO_MASS_SECTION";
import { HUMAN_BODY_SIMPLE_SHAPE_SURVEY_HIP_HEIGHT_MALE } from "./simple-shape/HUMAN_BODY_SIMPLE_SHAPE_SURVEY_HIP_HEIGHT_MALE";

/**
 * The expansion of the simple body tier into channel weights, as numbers.
 *
 * Each relation the expansion applies is an ordered row in the neighbouring
 * simple-shape files: a channel, a gain and
 * the piecewise-linear curves over the simple parameters (and two derived
 * ones) whose product the gain scales. A curve is `[x, y]` points in
 * ascending `x`, held flat outside its ends. The rows encode, with their
 * sources described beside their owning rows, MakeHuman's age nodes (child
 * 11 years, young 25, old 90), and an authored 30% muscle loss from age 30
 * to 80 (six percentage points per decade, within the broad 3–8% per decade
 * range discussed by Volpi et al., doi:10.1097/01.mco.0000134362.76653.b2).
 * The gluteal-ptosis age and mass curve is an authored hypothesis: Gonzalez
 * 2006 associated both with ptosis (doi:10.1007/s00266-005-0051-y), while
 * Babuccu et al. 2004 found weight, not age, explained the adult groups in
 * their female sample (doi:10.1007/s00266-004-4010-9). Gluteal mass and
 * pelvic tone muscle raises and age
 * takes, the adolescent maturity before which training builds no muscle, the
 * redistribution of fat from the limbs to the trunk with age, the WHO
 * android/gynoid split by sex, Deurenberg's age-specific body fat estimates
 * from BMI, age and sex, and the body fat bands below which the rectus,
 * deltoid and scapular relief show (ACE essential fat by sex, visible-abs
 * bands), and the ANSUR II people rows: gluteal projection, hip breadth and
 * depth, thigh and calf fat and a woman's breast position by sex over the
 * body mass index, fitted so that people of the 2012 US Army survey
 * reproduced from their own sex, age, stature, mass and chest and buttock
 * girths read their own buttock depth, waist breadth, depth and girth at the
 * omphalion, thigh and calf girths and bust point height.
 * Stature, mass, six exterior girths and the rig shoulder-centre distance are
 * not rows: they are
 * solved by measurement against the basis, with the head allowance, the mass
 * model and the channel each measurement is solved on given here. The body
 * mass index the fat rows read is mass over stature squared.
 *
 */
export const HUMAN_BODY_SIMPLE_SHAPE: IAutoMovieHumanBodySimpleShapeTable = {
  /** Inclusive envelope of each simple parameter; outside it the expansion refuses. */
  limits: {
    sex: [-1, 1],
    ageYears: [11, 90],
    statureMetres: [1.2, 2.2],
    massKilograms: [25, 250],
    // to 2: the source's competition node, a fat-free mass index near the
    // natural limit of 25 (Kouri et al. 1995) at an athlete's mass index
    muscle: [-1, 2],
    waistMetres: [0.4, 2],
    hipsMetres: [0.5, 2],
    bustMetres: [0.5, 2],
    shoulderMetres: [0.2, 0.7],
    thighMetres: [0.2, 1.2],
    upperArmMetres: [0.12, 0.7],
    calfMetres: [0.15, 0.8],
  },
  identity: { sex: "macroGender", ageYears: "macroAge", muscle: "macroMuscle" },
  solved: {
    stature: "macroHeight",
    // a kilogram is the weight macro's field, which covers the whole skin
    // smoothly; the regional fat fields, stacked on it past their authored
    // reach, stood as shelves at the knee and the elbow on the sheet
    mass: {
      range: "macroWeight",
      direction: [{ channel: "macroWeight", gain: 1, curves: [] }],
    },
  },
  measurements: [
    { parameter: "waistMetres", channel: "measureWaistCirc" },
    { parameter: "hipsMetres", channel: "measureHipsCirc" },
    { parameter: "bustMetres", channel: "measureBustCirc" },
    { parameter: "shoulderMetres", channel: "measureShoulderDist" },
    { parameter: "thighMetres", channel: "measureThighCirc" },
    { parameter: "upperArmMetres", channel: "measureUpperarmCirc" },
    { parameter: "calfMetres", channel: "measureCalfCirc" },
  ],
  /**
   * Stature is the basis's height rule (its clip ring above the ground) plus
   * the head above the ring, measured on the face basis this body is cut
   * from: crown 0.1388 m over the ring's highest vertex at -0.0808 m
   * (`mpfb-connected-head-2026-09-17-clipped`).
   */
  stature: { headAboveRingMetres: 0.2196 },
  /**
   * Body mass from the skin volume: density from the body fat fraction by
   * Siri's equation `fat = 4.95 / density - 4.50`, and the head and neck
   * segment, which lies above the ring. Jensen's 1989 polynomial regression
   * (12 boys ages 4–20, 89 annual observations) supplies its child share;
   * Dempster's adult table as given by Winter supplies 8.1% for adults. The
   * Jensen curve (R² 0.76, regression error 0.0094 fraction) gives 8.1158%
   * at 15, almost the adult value. The small 15–16 interpolation joins
   * distinct study populations for a continuous
   * editor response; it is an authored bridge, not a measured growth curve.
   * The boy-only pediatric data also approximate girls here. Segment
   * boundaries may not coincide exactly with this basis's clip ring.
   * Source: https://doi.org/10.1016/0021-9290(89)90004-3, Table 1.
   */
  mass: {
    siri: { numerator: 4.95, offset: 4.5 },
    headAndNeck: {
      pediatric: {
        intercept: 0.27881,
        ageYearsCoefficient: -0.021152,
        ageYearsSquaredCoefficient: 0.00053168,
      },
      adultFraction: 0.081,
      transitionAgeYears: [15, 16],
      // Both segments end at the suprasternal notch and C7, but this basis's
      // clip ring stands 9 to 11 cm above the sternoclavicular joint, so the
      // skin keeps that neck. Measured on 24 simple-tier bodies (both sexes,
      // 11 to 70 years, body mass index 18 to 32) it is 1.7 to 3.0 % of the
      // volume, 2.35 % at an index of 24 and inversely with the index, with
      // little dependence on age or sex; the volume share stands for the
      // mass share (the difference, about a tenth of a point, is the neck's
      // density against the body's and the head outside the volume)
      keptNeck: { fraction: 0.0235, bodyMassIndex: 24 },
    },
    /** The fat fraction the density model is trusted over. */
    fatFraction: [0.05, 0.5],
  },
  /**
   * Deurenberg, Weststrate and Seidell 1991, with sex01 one for men: children
   * through 15 use `1.51 BMI - 0.70 age - 3.6 sex01 + 1.4`; ages 16 and above
   * use `1.20 BMI + 0.23 age - 10.8 sex01 - 5.4`. Between 15 and 16, blend
   * both equations' predictions at the requested age to avoid a jump. That
   * blend is an authored continuity rule, not a third fitted equation. The
   * child fit has R² 0.38 and SEE 4.4 percentage points (adult: R² 0.79,
   * SEE 4.1); neither predicts an individual's measured composition. The
   * sex-specific essential fat (ACE) is subtracted for the definition gates.
   * Source: https://doi.org/10.1079/BJN19910073.
   */
  fat: {
    pediatric: {
      bodyMassIndex: 1.51,
      ageYears: -0.7,
      male: -3.6,
      intercept: 1.4,
    },
    adult: {
      bodyMassIndex: 1.2,
      ageYears: 0.23,
      male: -10.8,
      intercept: -5.4,
    },
    transitionAgeYears: [15, 16],
    essentialBySex: [
      [-1, 13],
      [1, 5],
    ],
    // a trained body carries more fat-free mass at the same mass index: the
    // median young man's fat-free mass index is 18.9 and the young woman's
    // 15.4 (Schutz et al. 2002), natural male athletes average 21.8 (Kouri
    // et al. 1995); a unit of muscle takes an average young man at a mass
    // index of 24 to that 21.8, and a woman by the same share of her median
    muscleFatFreeMassIndex: [
      [-1, 1.8],
      [1, 2.2],
    ],
  },
  /**
   * Training builds little muscle before puberty: children's strength gains
   * are neural rather than hypertrophic (Faigenbaum et al. 2009; Lloyd et al.
   * 2014), and the muscle spurt follows peak height velocity, at 11.8 years
   * in girls and 13.5 in boys (Baxter-Jones et al. 2008), the lean mass
   * gained fastest in the year after it and the spurt lasting about two years
   * (Tanner et al. 1981). The ramp runs from a year before peak height
   * velocity to three years after it: an authored bridge over those
   * findings, not a fitted curve.
   */
  maturity: {
    startAgeYears: [
      [-1, 10.8],
      [1, 12.5],
    ],
    endAgeYears: [
      [-1, 14.8],
      [1, 16.5],
    ],
  },
  /** Channel weight = Σ rows gain · Π curve(parameter); missing channels are skipped. */
  terms: [
    ...HUMAN_BODY_SIMPLE_SHAPE_DEVELOPMENT,
    ...HUMAN_BODY_SIMPLE_SHAPE_GLUTEAL,
    ...HUMAN_BODY_SIMPLE_SHAPE_ABDOMINAL_FAT,
    ...HUMAN_BODY_SIMPLE_SHAPE_OUTER_THIGH_FAT,
    ...HUMAN_BODY_SIMPLE_SHAPE_MUSCLE_RELIEF,
    ...HUMAN_BODY_SIMPLE_SHAPE_BREAST,
    ...HUMAN_BODY_SIMPLE_SHAPE_ABDOMEN,
    ...HUMAN_BODY_SIMPLE_SHAPE_NECK,
    ...HUMAN_BODY_SIMPLE_SHAPE_UPPER_ARM_FAT_LEFT,
    ...HUMAN_BODY_SIMPLE_SHAPE_UPPER_LEG_FAT_LEFT,
    ...HUMAN_BODY_SIMPLE_SHAPE_UPPER_ARM_FAT_RIGHT,
    ...HUMAN_BODY_SIMPLE_SHAPE_UPPER_LEG_FAT_RIGHT,
    ...HUMAN_BODY_SIMPLE_SHAPE_DEFINITION,
    ...HUMAN_BODY_SIMPLE_SHAPE_SURVEY_HIP_SECTION,
    ...HUMAN_BODY_SIMPLE_SHAPE_SURVEY_LEG_FAT,
    ...HUMAN_BODY_SIMPLE_SHAPE_SURVEY_BREAST_POSITION,
    ...HUMAN_BODY_SIMPLE_SHAPE_SURVEY_HIP_HEIGHT,
    ...HUMAN_BODY_SIMPLE_SHAPE_SURVEY_DISTAL,
    ...HUMAN_BODY_SIMPLE_SHAPE_SURVEY_TORSO_SECTION,
    ...HUMAN_BODY_SIMPLE_SHAPE_SURVEY_LEG_LENGTH,
    ...HUMAN_BODY_SIMPLE_SHAPE_SURVEY_TORSO_MASS_SECTION,
    ...HUMAN_BODY_SIMPLE_SHAPE_SURVEY_HIP_HEIGHT_MALE,
    {
      // firmness falls with age
      channel: "macroFirmness",
      gain: -1,
      curves: [
        {
          parameter: "ageYears",
          points: [
            [25, 0],
            [50, 0.5],
            [80, 1],
          ],
        },
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [1, 0.3],
          ],
        },
      ],
    },
  ],
};
