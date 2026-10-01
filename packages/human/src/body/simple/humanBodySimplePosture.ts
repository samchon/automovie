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
 * @evidence contracts/common.md#principled-implementation The kyphosis added past the source body's is the age curve's share of the sex-dependent growth beyond the young angle, applied as flexion to the two thoracic joints by their table shares and as an equal extension of the compensating joint, so the head keeps its orientation. A body that has added none returns no rows, and a joint the basis lacks is refused. The numbers come from the table, which states which parts are measured and which are authored approximations.
 * @evidence contracts/common.md#clear-and-simple-design One pure function from the table, age and sex to document pose rows; the curve evaluation and the table have their own owners and a document pose that names the same joints replaces these rows.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No person or photograph is selected and every joint and share comes from the table; a missing joint is refused instead of skipped.
 * @evidence contracts/common.md#meaningful-documentation States the rows' meaning, the joints and units, the neck clamp, the empty result for a body that adds nothing and the replacement rule for a pose that names the same joints.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It defines no part or group; it returns pose rows for existing joints.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines and consumes no morph channel; it returns joint pose rows.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits pose rows and no geometry.
 * @evidence contracts/modeling.md#spatial-conventions Rows are in anatomical degrees about each named joint of the basis, added to that joint's own neutral flexion; no frame or unit is converted here.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no surface or boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation It owns no displayed part or joint; the builder poses and displays the rows.
 * @evidence contracts/anatomy.md#parametric-authority It converts the named simple inputs age and sex deterministically into pose rows of named thoracic and neck joints in anatomical degrees, so no input addresses a vertex or surface. It has no inverse because the rows are a document pose's own authored data and a pose that names the same joints replaces them.
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
