import type { IAutoMovieHumanParameters } from "@automovie/interface";

/**
 * One synthetic neutral adult. ANSUR II male means supply stature, the limb
 * lengths, landmark heights, skeletal breadth, neck/hip/ankle/calf tapes and
 * head length, breadth and circumference (NATICK/TR-15/007). ANSUR 1988
 * supplies the natural waist, chest, back length, neck base and elbow tapes
 * (NATICK/TR-89/044). Omitted measures use the normal generation rules. The
 * face uses the pooled adult male FaceBase means, with vertical lid opening
 * from Park et al. (2008, PMID 18349663). Head height comes from ARC R&M 3772,
 * table 52. Jaw excursions use Verkouteren et al.'s age-18 male estimates
 * (2022, e12869) as an adult estimate for this neutral subject. The two ears
 * use Cho et al.'s male means by side (2025, e107).
 */
export const AutoMovieHumanNeutralParameters: IAutoMovieHumanParameters = {
  body: {
    anatomy: {
      sex: "male",
      stature: 1756.2,
      chestCircumference: 991.4,
      waistCircumference: 839.9,
      hipCircumference: 1019.5,
      backNeckToWaist: 412,
      neckBaseCircumference: 408.4,
      neckCircumference: 397.6,
      upperArmLength: 335.2,
      forearmLength: 267.9,
      elbowCircumference: 277.1,
      wristCircumference: 175.9,
      calfCircumference: 392.3,
      ankleCircumference: 229.3,
      biacromialBreadth: 415.7,
      acromialHeight: 1440.7,
      cervicaleHeight: 1517.3,
      suprasternaleHeight: 1438.6,
      axillaHeight: 1329.1,
      midpatellaHeight: 488.4,
    },
  },
  head: {
    length: 199.5,
    cephalicIndex: (100 * 154.3) / 199.5,
    circumference: 574.4,
    height: 229.5,
    faceHeight: 127.2,
    faceWidth: 137.6,
    mandibularWidth: 104.5,
    minimumFrontalWidth: 111.4,
    mouthOpening: 55.3,
    mandibularLaterotrusion: 10.4,
    face: {
      eyePair: {
        left: { palpebralFissureLength: 28.8, palpebralFissureHeight: 8 },
        right: { palpebralFissureLength: 28.8, palpebralFissureHeight: 8 },
      },
      intercanthalWidth: 32.7,
      nose: { width: 36.1, height: 56.6, protrusion: 21 },
      mouth: {
        width: 50.9,
        upperVermilionHeight: 7.5,
        lowerVermilionHeight: 8.7,
      },
    },
    earPair: {
      left: { length: 66.8, breadth: 28.9, protrusion: 19.5 },
      right: { length: 67.1, breadth: 29.2, protrusion: 19.5 },
    },
  },
};
