import { AutoMovieHumanSex } from "../structures/AutoMovieHumanSex";
import { IAutoMovieHumanGrowthCurve } from "./IAutoMovieHumanGrowthCurve";

/**
 * Age-dependent child-survey ratios and the explicitly derived relations used before the adult handover. Values retain their original source grades; extrapolation applies only to the documented birth curves.
 */
export namespace AutoMovieHumanChildLengthSurvey {
  /**
   * Centres of the one-year age bins of the 1977 US child survey (Snyder et al. 1977, UM-HSRI-77-17; individual records published by NIST as AnthroKids), years: bins from 2, 4, ... 16 and the last bin of 17.0 to 18.5.
   */
  const BIN_AGES: number[] = [
    2.5, 4.5, 6.5, 8.5, 10.5, 12.5, 14.5, 16.5, 17.75,
  ];

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
  export type ISexCurve = Record<AutoMovieHumanSex, IAutoMovieHumanGrowthCurve>;

  /**
   * Per-subject ratios to stature of the 1977 US child survey, means by bin, fitted by us from the published individual records (3,900 children). Grade: population-fitted.
   */
  export const SNYDER_1977: Record<
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
  export const SNYDER_1977_HAND: Record<
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
  export const SNYDER_1977_DIGITS: Record<"middle" | "thumb", ISexCurve> = {
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
   * Bicristal over bispinous breadth: the ANSUR II adult bicristal fraction of stature over the 1977 survey's 17-18-year bispinous fraction (women 0.168 / 0.148, men 0.157 / 0.134). The 1977 survey measured the anterior superior iliac spines, not the crests, so children's crest breadth follows the spine breadth's growth at this adult ratio. Grade: derived across two surveys.
   */
  export const BICRISTAL_PER_BISPINOUS: Record<AutoMovieHumanSex, number> = {
    female: 1.135,
    male: 1.172,
  };

  /**
   * Vertex to the jugular notch in head heights, by the 1977 survey's age bins: means of per-subject (stature − suprasternale height) / stature, fitted by us from the individual records (11 to 53 children per bin; Snyder et al. 1977, UM-HSRI-77-17), times the same bin's stature over head height. Heights are read in head heights because the two were measured on different subsets of children. Below the first bin, where the survey has no standing measures, the 2-to-3-year value holds, so an infant's notch stays close under its large head. Grade: population-fitted, derived below 2.5 years.
   *
   * The notch climbs toward the head the younger the child: 0.24 of stature below the vertex at 2 to 3 years against 0.19 at 17 to 18 and 0.18 in ANSUR II adults, so a toddler's shoulders sit high under the head, where an adult-proportioned neck put them far too low.
   */
  export const SUPRASTERNALE_HEAD_HEIGHTS: ISexCurve = {
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
  export const ABOVE_SUPRASTERNALE: Record<
    "cervicale" | "acromion",
    Record<AutoMovieHumanSex, number>
  > = {
    cervicale: { female: 0.322, male: 0.36 },
    acromion: { female: 0.026, male: 0.0096 },
  };
}
