import type { IAutoMovieHumanFaceBasisDocument } from "../../face/structures/IAutoMovieHumanFaceBasisDocument";
import { HUMAN_PERSON_POPULATION } from "../constants/HUMAN_PERSON_POPULATION";
import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";

/**
 * The face document a person evaluates: the person's face, with its age and
 * sex axes taken from the body when the person states them once.
 *
 * Without `population: "linked"` the face is returned as it is. With it, the
 * face's `globalSexualDimorphism` is the body's `macroGender` (the same signed
 * unit) and its `globalAgeStructure` is the body's `macroAge` carried through
 * the shared age macro (`HUMAN_PERSON_POPULATION`): equal above the macro one
 * half, and a negative body weight `w` at the macro `0.5 + w * (0.5 - 0.1875)`,
 * which is the face weight `(macro - 0.5) / (0.5 - 0.25)`, held at -1 where the
 * body is younger than the face's youngest end. A weight the body does not state
 * is zero, as the body evaluates it, so an omitted axis stays neutral on the
 * face too. A face document that already states either axis is refused: two
 * values for one person's age or sex have no answer.
 *
 * The result is a new document and the person's are not modified.
 *
 * @evidence contracts/common.md#principled-implementation The two axes are affine in the same macro on each side of its middle, so the map is exact where both reach and a stated clamp where the face's axis ends; refusing a face that states an axis keeps one source of truth.
 * @evidence contracts/common.md#clear-and-simple-design One branch on the link, one refusal and two channel writes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No value is supplied; the node positions are the studies' named constants and the clamp is stated.
 * @evidence contracts/common.md#meaningful-documentation The comment states the mapping, the clamp, the omission rule and the refusal.
 * @evidence contracts/modeling.md#parameter-channels Both target channels are the face's own signed axes with zero at neutral; the function writes them from the body's axes, whose zero is the same macro one half, and documents that a face stating either is refused.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function relates two documents and defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The values are dimensionless axes.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing; the linked person is observed in the viewer.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The age macro is the source's own axis, not a measured growth curve, and the function adds no value beyond the two studies' node positions.
 * @evidenceExclude contracts/anatomy.md#permitted-range The ranges of both axes are the bases' and are checked by the builders.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function adds no input; it removes the face's duplicate of two body inputs.
 */
export function deriveHumanPersonFace(
  document: IAutoMovieHumanPersonDocument,
): IAutoMovieHumanFaceBasisDocument {
  if (document.population !== "linked") return document.face;
  const { ageChannel, sexChannel, bodyChildNode, faceChildNode } =
    HUMAN_PERSON_POPULATION;
  for (const channel of [ageChannel.face, sexChannel.face])
    if (Object.hasOwn(document.face.shape, channel))
      throw new Error(
        "A linked person states age and sex in the body: the face document must not state " +
          channel +
          ".",
      );
  const age = document.body.shape[ageChannel.body] ?? 0;
  const macro = age < 0 ? 0.5 + age * (0.5 - bodyChildNode) : 0.5 + age * 0.5;
  const face =
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
