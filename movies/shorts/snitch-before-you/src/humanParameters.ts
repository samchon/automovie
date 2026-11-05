import { AutoMovieHumanSex, type IAutoMovieHumanParameters } from "@automovie/human";

/**
 * Supply authored metric inputs for the low-cost Human skeleton representation.
 * Head dimensions are coarse design controls, not measurements recovered from a
 * portrait. Clinical FK and joint limits remain owned by Human.
 *
 * @evidence contracts/common.md#implementation-and-ownership Uses the public Human parameter record and survey defaults for omitted body tapes; no external mesh or inferred biometric age is claimed.
 * @evidence contracts/common.md#authoring-interface Stature is positive metres, converted to millimetres; sex chooses the public survey prior and does not specify age. Callers own appearance and scene placement.
 */
export function humanParameters(stature: number, female: boolean): IAutoMovieHumanParameters {
  if (!Number.isFinite(stature) || stature < 0.4 || stature > 2.5)
    throw new Error("Human stature must be between 0.4 and 2.5 metres");
  return {
    body: { anatomy: { stature: stature * 1000, sex: female ? AutoMovieHumanSex.Female : AutoMovieHumanSex.Male } },
    head: {
      length: 188, cephalicIndex: 80, circumference: 550, height: 220,
      faceHeight: 112, faceWidth: 130, mandibularWidth: 105,
      minimumFrontalWidth: 100, mouthOpening: 48, mandibularLaterotrusion: 9,
      face: {
        eyePair: {
          left: { palpebralFissureLength: 30, palpebralFissureHeight: 11 },
          right: { palpebralFissureLength: 30, palpebralFissureHeight: 11 },
        },
        intercanthalWidth: 31,
        nose: { width: 34, height: 53, protrusion: 21 },
        mouth: { width: 44, upperVermilionHeight: 8, lowerVermilionHeight: 10 },
      },
      earPair: {
        left: { length: 60, breadth: 26, protrusion: 20 },
        right: { length: 60, breadth: 26, protrusion: 20 },
      },
    },
  };
}
