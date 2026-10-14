import type { IAutoMovieHumanFaceBasisDocument } from "../../face/structures/IAutoMovieHumanFaceBasisDocument";
import { HUMAN_PERSON_POPULATION } from "../constants/HUMAN_PERSON_POPULATION";
import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";

/**
 * Derive legacy linked face population coefficients from the body's age/sex shape axes; unlinked documents return the original face unchanged.
 *
 * Linked sex retains the body's signed macro coefficient. Negative body age w maps through macro=0.5+w*(0.5-0.1875), then face=(macro-0.5)/(0.5-0.25) with lower clamp -1; the nonnegative branch retains body age. These source interpolation conventions do not assign measured chronological age, biological sex or clinical head/body proportions. Any explicit face population axis, including zero, refuses duplicate authorship. Missing body axes read zero.
 *
 * Linked output owns a copied shape and shallow face wrapper, borrowing other members unchanged. Registered generation alias/driver derivation has a separate branch and does not call this conversion when registrations are nonempty.
 *
 * @evidence contracts/common.md#principled-implementation One declared linked body population authority projects its actual signed coefficients through the existing source macro-node mapping before face evaluation.
 * @evidence contracts/common.md#clear-and-simple-design This helper owns linked legacy coefficient conversion only; registered generation drivers and anatomy measurement/geometry have separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Explicit duplicate face axes refuse and the authored youngest-face clamp stays visible; interpolation coefficients are not claimed clinical demographics or measured proportions.
 * @evidence contracts/common.md#meaningful-documentation Prose states exact macro-node arithmetic, omission, branch ownership and borrowed versus copied output.
 * @evidence contracts/performance.md#efficient-algorithms Unlinked access is constant work; linked conversion checks two keys and copies K shape properties before fixed scalar arithmetic.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each mutable document supplies distinct population weights; the projection owns no evaluated-face cache or request coordinator.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the linked wrapper/shape escape, or the original face for omission; no source geometry, palette handle or task is retained.
 */
export function deriveHumanPersonFace(
  document: IAutoMovieHumanPersonDocument,
): IAutoMovieHumanFaceBasisDocument {
  if (document.population !== "linked") return document.face;
  const {
    ageChannel,
    sexChannel,
    bodyChildNode,
    faceChildNode,
  }: typeof HUMAN_PERSON_POPULATION = HUMAN_PERSON_POPULATION;
  for (const channel of [ageChannel.face, sexChannel.face])
    if (Object.hasOwn(document.face.shape, channel))
      throw new Error(
        "A linked person states age and sex in the body: the face document must not state " +
          channel +
          ".",
      );
  const age: number = document.body.shape[ageChannel.body] ?? 0;
  const macro: number =
    age < 0 ? 0.5 + age * (0.5 - bodyChildNode) : 0.5 + age * 0.5;
  const face: number =
    macro < 0.5 ? Math.max(-1, (macro - 0.5) / (0.5 - faceChildNode)) : age;
  return {
    ...document.face,
    shape: {
      ...document.face.shape,
      [ageChannel.face]: face,
      [sexChannel.face]: document.body.shape[sexChannel.body] ?? 0,
    },
  };
}
