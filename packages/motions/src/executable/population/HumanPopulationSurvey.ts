import type { IAutoMovieHumanBodyAnatomy } from "@automovie/interface";

import { HUMAN_POPULATION_SURVEY } from "./HUMAN_POPULATION_SURVEY";

/**
 * The published statistics every test person is built from and checked against:
 * the ANSUR 1988 summary statistics per sex (Gordon et al. 1989;
 * `packages/human/docs/sources/ansur-1988-boundary-people.md`), the FaceBase
 * adult facial means (Weinberg et al. 2016), ANSUR II palm over hand length,
 * and the body domain the Human score declares for adult people.
 */
export namespace HumanPopulationSurvey {
  /** A surveyed sex; each has its own statistics table. */
  export type Sex = "female" | "male";

  /** The surveyed measures, in the order of {@link SURVEY}'s vectors. */
  export const VARIABLES: readonly Variable[] = [
    "stature",
    "mass",
    "chest",
    "bustSpan",
    "underbust",
    "neckToBustPoint",
    "waist",
    "omphalionWaist",
    "buttock",
    "neckBase",
    "neck",
    "interscye",
    "waistBackLength",
    "biacromial",
    "acromionRadiale",
    "radialeStylion",
    "bicepsFlexed",
    "elbow",
    "forearmFlexed",
    "wrist",
    "crotchHeight",
    "thigh",
    "knee",
    "calf",
    "handCircumference",
    "handLength",
    "handBreadth",
    "footLength",
    "footBreadth",
    "malleolusHeight",
    "headLength",
    "headBreadth",
    "headCircumference",
    "bizygomatic",
    "mentonSellion",
    "earLength",
    "earBreadth",
    "earProtrusion",
  ];

  /** One surveyed measure, a name of {@link VARIABLES}. */
  export type Variable =
    | "stature"
    | "mass"
    | "chest"
    | "bustSpan"
    | "underbust"
    | "neckToBustPoint"
    | "waist"
    | "omphalionWaist"
    | "buttock"
    | "neckBase"
    | "neck"
    | "interscye"
    | "waistBackLength"
    | "biacromial"
    | "acromionRadiale"
    | "radialeStylion"
    | "bicepsFlexed"
    | "elbow"
    | "forearmFlexed"
    | "wrist"
    | "crotchHeight"
    | "thigh"
    | "knee"
    | "calf"
    | "handCircumference"
    | "handLength"
    | "handBreadth"
    | "footLength"
    | "footBreadth"
    | "malleolusHeight"
    | "headLength"
    | "headBreadth"
    | "headCircumference"
    | "bizygomatic"
    | "mentonSellion"
    | "earLength"
    | "earBreadth"
    | "earProtrusion";

  /** One sex's summary statistics. */
  export interface ISurvey {
    /** Subjects with every measure. */
    n: number;

    /** Means, mm (mass in kg). */
    mean: number[];

    /** Standard deviations. */
    sd: number[];

    /** Least value any subject has. */
    min: number[];

    /** Greatest value any subject has. */
    max: number[];

    /** Lower triangle of the correlation matrix: row i holds r(i + 1, 0..i). */
    r: number[][];
  }

  /** Normal deviate of the 1st and 99th percentiles. */
  export const Z: number = 2.326;

  /**
   * Half-width of a population relation's band in standard deviations: the
   * normal 99.73 % range. A real adult falls outside one of twenty relations by
   * chance in about 5 % of cases, while the combinations this guard exists for
   * lie further out: a man with a woman's natural waist over buttock of 0.68 is
   * 4.2 SD below the men's mean.
   */
  export const BAND: number = 3;

  /**
   * ANSUR 1988 working databases, every subject with all 38 measures (2,208
   * women, 1,774 men; `ansur-1988-boundary-people.md` lists each column). Mass
   * is the survey's weight in kg.
   */
  export const SURVEY: Record<Sex, ISurvey> = HUMAN_POPULATION_SURVEY;

  /** ANSUR 1988 body-mass index, kg/m2, mean and SD per sex. */
  export const BMI: Record<Sex, readonly [number, number]> = {
    female: [23.3357, 2.649],
    male: [25.4194, 3.0004],
  };

  /**
   * Adult facial means, mm, of the 3D Facial Norms database, ages 20 to 40
   * (Weinberg et al. 2016; `weinberg-2016-3d-facial-norms.md`), for the face
   * inputs the body survey does not measure.
   */
  export const FACE: Record<Sex, Readonly<Record<EntryItemEntry, number>>> = {
    female: {
      faceHeight: 118.6,
      mandibularWidth: 97.0,
      minimumFrontalWidth: 105.5,
      intercanthalWidth: 31.3,
      fissureLength: 27.8,
      noseWidth: 32.6,
      noseHeight: 54.7,
      noseProtrusion: 20.2,
      mouthWidth: 48.1,
      upperVermilion: 7.4,
      lowerVermilion: 8.5,
    },
    male: {
      faceHeight: 127.2,
      mandibularWidth: 104.5,
      minimumFrontalWidth: 111.4,
      intercanthalWidth: 32.7,
      fissureLength: 28.8,
      noseWidth: 36.1,
      noseHeight: 56.6,
      noseProtrusion: 21.0,
      mouthWidth: 50.9,
      upperVermilion: 7.5,
      lowerVermilion: 8.7,
    },
  };

  /**
   * ANSUR II palm length over hand length, the ratio of the sex's means (108.7
   * / 181.1 and 116.5 / 193.3; `ansur-ii.md`).
   */
  export const PALM: Record<Sex, number> = {
    female: 108.7 / 181.1,
    male: 116.5 / 193.3,
  };

  /**
   * The declared range of each body measure for adult people: a statement of
   * what the generator supports, not a measurement. `HumanPopulation.audit`
   * holds every person's measures inside it and every tape inside the surveyed
   * extremes of its sex (ANSUR 1988,
   * `packages/human/docs/sources/ansur-1988-boundary-people.md`); the public
   * type declares no range.
   */
  export const DOMAIN: Readonly<
    Partial<
      Record<
        Exclude<keyof IAutoMovieHumanBodyAnatomy, "sex">,
        readonly [number, number]
      >
    >
  > = {
    stature: [1450, 2000],
    chestCircumference: [720, 1300],
    bustPointWidth: [140, 260],
    underbustCircumference: [640, 1200],
    backNeckToWaist: [290, 450],
    acrossBackShoulderWidth: [260, 470],
    sideNeckToBustPoint: [200, 330],
    waistCircumference: [560, 1250],
    hipCircumference: [800, 1350],
    highHipCircumference: [720, 1300],
    neckBaseCircumference: [310, 520],
    neckCircumference: [280, 480],
    upperArmLength: [270, 410],
    forearmLength: [200, 310],
    upperArmCircumference: [210, 460],
    elbowCircumference: [190, 370],
    wristCircumference: [125, 215],
    forearmCircumference: [190, 370],
    inseam: [640, 920],
    thighCircumference: [440, 780],
    kneeCircumference: [290, 500],
    calfCircumference: [280, 480],
    handCircumference: [160, 250],
  };
}

/** The alternatives of `EntryItemEntry`'s site. */
type EntryItemEntry =
  | "faceHeight"
  | "mandibularWidth"
  | "minimumFrontalWidth"
  | "intercanthalWidth"
  | "fissureLength"
  | "noseWidth"
  | "noseHeight"
  | "noseProtrusion"
  | "mouthWidth"
  | "upperVermilion"
  | "lowerVermilion";
