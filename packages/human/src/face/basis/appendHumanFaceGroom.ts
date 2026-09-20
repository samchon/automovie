import type { IAutoMovieModel } from "@automovie/interface";

import { buildPortraitHairGroom } from "../anatomy/hair/buildPortraitHairGroom";
import type { IAutoMovieHumanFaceGroom } from "../structures/IAutoMovieHumanFaceGroom";
import { resolveHumanFaceGroom } from "../document/resolveHumanFaceGroom";

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
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Adds the authored scalp locks to the anatomical components a built face carries.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Composes resolved hair strips and their generated finish into the resident model.
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
