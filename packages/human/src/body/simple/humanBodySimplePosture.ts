import type { IAutoMovieJointPose } from "@automovie/interface";

import { HUMAN_BODY_SIMPLE_POSTURE } from "../constants/HUMAN_BODY_SIMPLE_POSTURE";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodySimpleShape } from "../structures/IAutoMovieHumanBodySimpleShape";
import { humanBodySimpleShapeMath } from "./humanBodySimpleShapeMath";

/**
 * The standing posture a body of an age and sex takes over the basis's rest:
 * the kyphosis `HUMAN_BODY_SIMPLE_POSTURE` adds past the source body's, as
 * flexion of the thoracic joints in their shares over their rest angles, and
 * the compensating joint's extension by as much, clamped to its range, so the head keeps its
 * orientation. A body that has added none returns no rows. The rows are a
 * document pose's own, in anatomical degrees; a pose that names the same
 * joints replaces them.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-simple-shape Gives the posture a body's age and sex imply, as the pose rows a document carries.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-simple-shape Implements the kyphosis by age and sex, its thoracic shares and the clamped neck compensation.
 */
export const humanBodySimplePosture = (
  basis: IAutoMovieHumanBodyBasis,
  simple: Pick<IAutoMovieHumanBodySimpleShape, "sex" | "ageYears">,
): IAutoMovieJointPose[] => {
  const table = HUMAN_BODY_SIMPLE_POSTURE;
  const added =
    humanBodySimpleShapeMath.curve(table.kyphosis.ageYears, simple.ageYears) *
    (humanBodySimpleShapeMath.curve(table.kyphosis.oldDegrees, simple.sex) -
      table.kyphosis.youngDegrees);
  if (added <= 0) return [];
  const joint = (bone: string) => {
    const found = basis.joints.find((one) => one.bone === bone);
    if (found === undefined)
      throw new Error("Body posture names a joint the basis lacks: " + bone);
    return found;
  };
  const row = (bone: string, flexion: number): IAutoMovieJointPose => ({
    bone: bone as IAutoMovieJointPose["bone"],
    flexion,
    abduction: null,
    twist: null,
  });
  const compensation = joint(table.compensation);
  const floor = compensation.constraint?.flexion?.min ?? -Infinity;
  return [
    ...table.thoracic.map(([bone, share]) =>
      row(bone, joint(bone).neutral.flexion + added * share),
    ),
    row(
      table.compensation,
      Math.max(floor, compensation.neutral.flexion - added),
    ),
  ];
};
