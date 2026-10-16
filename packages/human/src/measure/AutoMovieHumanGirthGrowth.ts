import { AutoMovieHumanSex } from "../structures/AutoMovieHumanSex";
import { IAutoMovieHumanGrowthCurve } from "./IAutoMovieHumanGrowthCurve";

/** Measured age curves and the transition between child scaling and adult girth fits. Each curve keeps its original survey protocol and is read as a ratio except the relaxed upper arm, whose absolute mean seeds the arm regression. */
export namespace AutoMovieHumanGirthGrowth {
  /** A curve for each sex. */
  export type ISexCurve = Record<AutoMovieHumanSex, IAutoMovieHumanGrowthCurve>;

  /**
   * Mean waist circumference at the iliac crest, millimetres, of the 2015-2018 US NHANES (Fryar et al. 2021, Vital Health Stat 3(46), Tables 18, 19 and 20), at the centres of its one-year child ages and ten-year adult groups. Read only as a ratio between ages: it carries how trunk girths grow in children and change in old age. Grade: measured.
   */
  export const NHANES_WAIST: ISexCurve = {
    male: {
      ages: [2.5, 5.5, 10.5, 15.5, 19.5, 25, 35, 45, 55, 65, 75, 85],
      values: [488, 550, 704, 850, 895, 942, 1026, 1041, 1051, 1073, 1074, 1043],
    },
    female: {
      ages: [2.5, 5.5, 10.5, 15.5, 19.5, 25, 35, 45, 55, 65, 75, 85],
      values: [480, 559, 700, 804, 880, 921, 972, 995, 998, 1017, 1015, 983],
    },
  };

  /**
   * Mean relaxed mid-upper arm circumference, millimetres, of the same NHANES report (Tables 21, 22 and 23), the first sample at 2 to 5 months. It is the upper arm girth itself, and its ratio between ages carries how the other limb girths grow and thin. Grade: measured.
   */
  export const NHANES_ARM: ISexCurve = {
    male: {
      ages: [0.29, 1.5, 5.5, 10.5, 15.5, 19.5, 25, 35, 45, 55, 65, 75, 85],
      values: [140, 157, 180, 236, 300, 325, 341, 359, 356, 348, 344, 332, 308],
    },
    female: {
      ages: [0.29, 1.5, 5.5, 10.5, 15.5, 19.5, 25, 35, 45, 55, 65, 75, 85],
      values: [136, 154, 185, 236, 278, 306, 315, 328, 333, 328, 324, 320, 296],
    },
  };

  /**
   * Natural (narrowest) waist over hip circumference, the 1977 US child survey's means of per-subject ratios at its one-year bin centres (Snyder et al. 1977, UM-HSRI-77-17; individual records published by NIST as AnthroKids), fitted by us. Girls fall from 0.92 to 0.72 as the pelvis and hips widen at puberty, boys only to about 0.85. Grade: population-fitted.
   */
  export const NATURAL_WAIST_TO_HIP: ISexCurve = {
    male: {
      ages: [2.5, 4.5, 6.5, 8.5, 10.5, 12.5, 14.5, 16.5, 17.75],
      values: [0.908, 0.921, 0.888, 0.878, 0.874, 0.867, 0.861, 0.839, 0.848],
    },
    female: {
      ages: [2.5, 4.5, 6.5, 8.5, 10.5, 12.5, 14.5, 16.5, 17.75],
      values: [0.92, 0.9, 0.854, 0.834, 0.81, 0.766, 0.736, 0.732, 0.717],
    },
  };

  /**
   * Mean relaxed limb girths by age, millimetres, from the 1977 US child survey's individual records (Snyder et al. 1977, UM-HSRI-77-17; NIST AnthroKids), our means at the centres of one-year bins (the last spanning 17 to 18.5 years; 12 to 157 children per bin), all standing: the wrist the minimum above the ulnar styloid, the thigh horizontal at the gluteal furrow, the calf the maximum and the ankle the minimum above the malleoli. Read only as ratios between ages, they carry how each girth grows: the wrist and ankle grow far less than the arm through childhood (wrist 112 to 149 mm in girls against an upper arm of 156 to 248), so scaling them by the arm's growth would make a child's wrist and ankle too thin. Grade: measured.
   */
  export const SNYDER_LIMB: Record<"wrist" | "thigh" | "calf" | "ankle", ISexCurve> = {
    wrist: {
      male: {
        ages: [
          2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5,
          15.5, 16.5, 17.75,
        ],
        values: [
          115, 114, 118, 119, 124, 126, 128, 132, 136, 138, 146, 151, 156, 162,
          170, 171,
        ],
      },
      female: {
        ages: [
          2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5,
          15.5, 16.5, 17.75,
        ],
        values: [
          112, 112, 117, 120, 120, 127, 133, 133, 135, 140, 144, 146, 149, 153,
          151, 149,
        ],
      },
    },
    thigh: {
      male: {
        ages: [
          2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5,
          15.5, 16.5, 17.75,
        ],
        values: [
          282, 296, 312, 325, 344, 363, 382, 407, 425, 437, 455, 477, 497, 519,
          538, 554,
        ],
      },
      female: {
        ages: [
          2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5,
          15.5, 16.5, 17.75,
        ],
        values: [
          287, 306, 325, 343, 356, 382, 404, 422, 439, 464, 483, 498, 527, 538,
          545, 543,
        ],
      },
    },
    calf: {
      male: {
        ages: [
          2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5,
          15.5, 16.5, 17.75,
        ],
        values: [
          204, 208, 218, 224, 237, 249, 262, 273, 284, 291, 305, 321, 331, 349,
          359, 365,
        ],
      },
      female: {
        ages: [
          2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5,
          15.5, 16.5, 17.75,
        ],
        values: [
          202, 209, 218, 227, 236, 247, 262, 271, 282, 295, 306, 314, 329, 335,
          339, 338,
        ],
      },
    },
    ankle: {
      male: {
        ages: [
          2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5,
          15.5, 16.5, 17.75,
        ],
        values: [
          150, 148, 155, 155, 163, 167, 173, 181, 182, 189, 203, 209, 212, 219,
          227, 227,
        ],
      },
      female: {
        ages: [
          2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5, 13.5, 14.5,
          15.5, 16.5, 17.75,
        ],
        values: [
          147, 146, 154, 158, 162, 172, 181, 183, 186, 193, 199, 206, 209, 212,
          212, 208,
        ],
      },
    },
  };

  /** Ages over which the child scaling hands over to the adult fits, years. */
  export const ADULT_FROM: [number, number] = [17.75, 20];

  /** Age whose adult girths the child scaling starts from, the last NHANES child sample, years. */
  export const REFERENCE_AGE: number = 19.5;
}
