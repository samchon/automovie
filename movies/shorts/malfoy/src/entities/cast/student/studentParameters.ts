import {
  AutoMovieHumanSex,
  type IAutoMovieHumanParameters,
} from "@automovie/human";

/**
 * Human body and head controls of a fifteen-to-seventeen-year-old student
 * from the settings' measures: stature and the tapes the record gives, with
 * every omitted tape left to Human's survey default. The head is one coarse
 * adolescent design shared by every student (length 188 mm, cephalic index
 * 80, circumference 550 mm, height 220 mm): stature over head height is then
 * 7.4–8.4 across the cast, the late-adolescent ratio Human's head-height
 * field cites, and no beat reads a face.
 *
 * ```ts
 * studentParameters({ female: true, stature: 1.63, chest: 0.8, waist: 0.66, hip: 0.87, shoulders: 0.355, arm: 0.235 });
 * ```
 *
 * @param measures Sex and the settings' measures in metres.
 * @returns Human's parameter record in millimetres.
 * @evidence docs/body/settings/cast/carina-malfoy.md#measures Carina's stature and tapes.
 * @evidence docs/body/settings/cast/harry-potter.md#measures Harry's stature and tapes.
 * @evidence docs/body/settings/crowds/practice-teams.md#players The players' statures.
 * @evidence contracts/development/common.md#meaningful-documentation States the units and the shared head.
 * @evidence contracts/development/implementation.md#principled-implementation Converts metres to Human's millimetres; omitted tapes take Human's survey defaults.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One literal.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing is retained.
 * @evidence contracts/development/entities.md#settings-realization Stature and tapes from the settings; the head is a stated production design.
 */
export function studentParameters(measures: {
  female: boolean;
  stature: number;
  chest?: number;
  waist?: number;
  hip?: number;
  shoulders?: number;
  arm?: number;
}): IAutoMovieHumanParameters {
  const mm = (m: number): number => Math.round(m * 1000);
  const anatomy: IAutoMovieHumanParameters["body"]["anatomy"] = {
    sex: measures.female ? AutoMovieHumanSex.Female : AutoMovieHumanSex.Male,
    stature: mm(measures.stature),
    ...(measures.chest === undefined ? {} : { chestCircumference: mm(measures.chest) }),
    ...(measures.waist === undefined ? {} : { waistCircumference: mm(measures.waist) }),
    ...(measures.hip === undefined ? {} : { hipCircumference: mm(measures.hip) }),
    ...(measures.shoulders === undefined
      ? {}
      : { acrossBackShoulderWidth: mm(measures.shoulders) }),
    ...(measures.arm === undefined ? {} : { upperArmCircumference: mm(measures.arm) }),
  };
  return {
    body: { anatomy },
    head: {
      length: 188,
      cephalicIndex: 80,
      circumference: 550,
      height: 220,
      faceHeight: 112,
      faceWidth: 130,
      mandibularWidth: 105,
      minimumFrontalWidth: 100,
      mouthOpening: 48,
      mandibularLaterotrusion: 9,
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
