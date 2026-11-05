import { AutoMovieHumanSex, type IAutoMovieHumanParameters } from "@automovie/human";

/**
 * Supply explicit uncalibrated cartoon dimensions to the one public Human construction.
 *
 * @evidence contracts/common.md#implementation-and-ownership Human derives omitted anatomy from its public parameters. Head lengths are project-authored coarse proportions in millimetres, not recovered measurements or a numerical proof of age. No portrait, person-specific mesh or second skeleton is substituted.
 * @evidence contracts/common.md#authoring-interface Caller chooses survey sex and stature in millimetres for the cast instance. The complete head record supplies every public required field; constructing a rendered actor remains separate. Reject nonfinite/out-of-domain stature before generation.
 */
export function createDuelHumanParameters(stature: number, sex: AutoMovieHumanSex): IAutoMovieHumanParameters {
  if (!Number.isFinite(stature) || stature < 400 || stature > 2500)
    throw new Error("Human stature must be 400–2500 millimetres");
  const eye: { palpebralFissureLength: number; palpebralFissureHeight: number } = { palpebralFissureLength: 29, palpebralFissureHeight: 10 };
  const ear: { length: number; breadth: number; protrusion: number } = { length: 59, breadth: 28, protrusion: 17 };
  return {
    body: { anatomy: { sex, stature } },
    head: {
      length: 180, cephalicIndex: 79, circumference: 545, height: 219,
      faceHeight: 111, faceWidth: 134, mandibularWidth: 99, minimumFrontalWidth: 103,
      mouthOpening: 48, mandibularLaterotrusion: 9,
      face: { eyePair: { left: eye, right: eye }, intercanthalWidth: 32, nose: { width: 31, height: 48, protrusion: 17 }, mouth: { width: 46, upperVermilionHeight: 6, lowerVermilionHeight: 8 } },
      earPair: { left: ear, right: ear },
    },
  };
}
