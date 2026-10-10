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
