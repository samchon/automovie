import {
  AutoMovieHumanSex,
  type IAutoMovieHumanParameters,
} from "@automovie/human";

/**
 * Authored adult dimensions in millimetres; character weight stays metadata.
 * Omitted physical measurements take Human's survey defaults. These inputs establish no measured likeness.
 *
 * @evidence contracts/common.md#implementation-and-ownership One independent record uses public Human anatomy and explicit fictional dimensions; no mesh-volume mass estimate is made.
 * @evidence contracts/common.md#authoring-interface Height is millimetres; athletic selects independently authored circumferences and shoulder width. Sex selects the public male survey defaults for omitted measures.
 */
export function createPersonParameters(
  height: number,
  athletic: boolean,
): IAutoMovieHumanParameters {
  return {
    body: {
      anatomy: {
        sex: AutoMovieHumanSex.Male,
        stature: height,
        chestCircumference: athletic ? 1060 : 990,
        acrossBackShoulderWidth: athletic ? 465 : 440,
        waistCircumference: athletic ? 820 : 840,
        hipCircumference: 980,
        neckCircumference: athletic ? 410 : 390,
        upperArmCircumference: athletic ? 355 : 325,
        thighCircumference: athletic ? 590 : 550,
      },
    },
    head: {
      length: 195,
      cephalicIndex: 78,
      circumference: 575,
      height: 230,
      faceHeight: 120,
      faceWidth: 145,
      mandibularWidth: 110,
      minimumFrontalWidth: 110,
      mouthOpening: 48,
      mandibularLaterotrusion: 10,
      face: {
        eyePair: {
          left: { palpebralFissureLength: 29, palpebralFissureHeight: 10 },
          right: { palpebralFissureLength: 29, palpebralFissureHeight: 10 },
        },
        intercanthalWidth: 33,
        nose: { width: 36, height: 52, protrusion: 20 },
        mouth: { width: 50, upperVermilionHeight: 7, lowerVermilionHeight: 9 },
      },
      earPair: {
        left: { length: 66, breadth: 29, protrusion: 18 },
        right: { length: 66, breadth: 29, protrusion: 18 },
      },
    },
  };
}
