import type { IAutoMovieModel } from "@automovie/interface";

import { buildPortraitHairGroom } from "../anatomy/hair/buildPortraitHairGroom";
import { resolveHumanFaceGroom } from "../document/resolveHumanFaceGroom";
import type { IAutoMovieHumanFaceGroom } from "../structures/IAutoMovieHumanFaceGroom";

/**
 * Give a built connected face the hair authored against its own surfaces.
 *
 * A connected facial basis carries skin, brows, lashes, eyes, teeth and tongue
 * and nothing above the hairline, so a face built from it is bald whatever the
 * subject looked like. The groom is the missing surface, and it is composed
 * here rather than inside the builder because the basis and the groom are
 * separately authored, separately licensed resources: one face may have several
 * grooms and a groom is meaningless without the face it was seated on.
 *
 * The result is a new model. Neither input is mutated, the resident parts keep
 * their order and identity, and the hair follows as additional parts with their
 * own generated finish, so an export that ignored hair before still finds the
 * same face in the same place.
 *
 * This composes geometry and asserts nothing about it. Locks are placed where
 * they were seated, which is the right answer for the face they were seated on
 * and an approximation for any other; whether the result reads as that person's
 * hair is a judgement no measurement here makes.
 *
 * @evidence contracts/common.md#principled-implementation The hair is composed as additional parts after the resident face parts with its own finish, so the face keeps its order and identity and an export that ignored hair still finds the same face. Locks are placed where they were seated, which the docs state is right for the seated face only.
 * @evidence contracts/common.md#clear-and-simple-design Composition only: identity collision check, hair build, concatenation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A finish identity that collides refuses; no input is mutated.
 * @evidence contracts/common.md#meaningful-documentation States why the groom is a separate resource, that the result is a new model and what is not asserted about it.
 * @evidence contracts/modeling.md#part-identity-and-grouping It is a group composer: it appends the hair part group to the face's parts without copying any member's geometry.
 * @evidenceExclude contracts/anatomy.md#anatomical-source appendHumanFaceGroom carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range appendHumanFaceGroom admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority appendHumanFaceGroom defines no input through which a caller shapes a human form.
 * @author Samchon
 */
export function appendHumanFaceGroom(props: {
  model: IAutoMovieModel;
  groom: IAutoMovieHumanFaceGroom;
}): IAutoMovieModel {
  if (props.model.materials.some((item) => item.id === props.groom.finish.id))
    throw new Error(
      "A groom finish collides with a finish this face already carries: " +
        props.groom.finish.id,
    );
  const { parts, materials } = buildPortraitHairGroom({
    hair: resolveHumanFaceGroom({ groom: props.groom, model: props.model }),
    materials: [...props.model.materials, props.groom.finish],
  });
  return {
    ...props.model,
    parts: [...props.model.parts, ...parts],
    materials,
  };
}
