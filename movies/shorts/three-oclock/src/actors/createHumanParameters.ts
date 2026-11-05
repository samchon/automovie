import { AutoMovieHumanSex, type IAutoMovieHumanParameters } from "@automovie/human";

/**
 * Project-owned metric blockout inputs for the two student performers.
 * Lengths use the public Human millimetre contract. These are authored coarse
 * proportions, not measurements recovered from the optional portrait images.
 *
 * @evidence contracts/common.md#implementation-and-ownership Supplies the existing Human construction with the adopted 1660/1700 mm statures and slim proportions; no second anatomy generator or unsupported age/mode switch is introduced.
 * @evidence contracts/common.md#authoring-interface Selects only the two commissioned identities; the returned independent parameter record can be prepared once and posed through the public Human skeleton API.
 */
export function createHumanParameters(person: "carina" | "harry"): IAutoMovieHumanParameters {
  const female: boolean = person === "carina";
  return {
    body: {
      anatomy: {
        sex: female ? AutoMovieHumanSex.Female : AutoMovieHumanSex.Male,
        stature: female ? 1660 : 1700,
        chestCircumference: female ? 790 : 825,
        underbustCircumference: female ? 740 : 790,
        waistCircumference: female ? 640 : 680,
        hipCircumference: female ? 875 : 855,
        acrossBackShoulderWidth: female ? 355 : 375,
        neckCircumference: female ? 305 : 325,
        upperArmCircumference: 235,
        forearmCircumference: 215,
      },
    },
    head: {
      length: female ? 184 : 190,
      cephalicIndex: 80,
      circumference: female ? 535 : 550,
      height: female ? 214 : 220,
      faceHeight: female ? 110 : 115,
      faceWidth: female ? 125 : 132,
      mandibularWidth: female ? 95 : 100,
      minimumFrontalWidth: 100,
      mouthOpening: 48,
      mandibularLaterotrusion: 9,
      face: {
        eyePair: {
          left: { palpebralFissureLength: 30, palpebralFissureHeight: 11 },
          right: { palpebralFissureLength: 30, palpebralFissureHeight: 11 },
        },
        intercanthalWidth: 30,
        nose: { width: 31, height: 48, protrusion: 19 },
        mouth: { width: 43, upperVermilionHeight: 8, lowerVermilionHeight: 10 },
      },
      earPair: {
        left: { length: 58, breadth: 26, protrusion: 18 },
        right: { length: 58, breadth: 26, protrusion: 18 },
      },
    },
  };
}
