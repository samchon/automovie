import type { IAutoMovieJointPose } from "@automovie/interface";

import { HUMAN_BODY_SIMPLE_POSTURE } from "../constants/HUMAN_BODY_SIMPLE_POSTURE";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodySimpleShape } from "../structures/IAutoMovieHumanBodySimpleShape";
import { humanBodySimpleShapeMath } from "./humanBodySimpleShapeMath";

/**
 * The standing posture a body of an age and sex takes over the basis's rest:
 * the kyphosis `HUMAN_BODY_SIMPLE_POSTURE` adds past the source body's, as
 * flexion of the thoracic joints in their shares over their rest angles, and
 * the compensating joint's extension by as much, clamped at its minimum.
 * Full compensation preserves head orientation; that clamp can leave a remainder.
 * A body that has added none returns no rows. The rows are a
 * document pose's own, in anatomical degrees; a pose that names the same
 * joints replaces them.
 *
 * @evidence contracts/common.md#principled-implementation The authored age and sex curves supply added kyphosis distributed over thoracic rest flexions; compensation subtracts it subject to the compensating joint's minimum, so clamping can leave uncompensated orientation.
 * @evidence contracts/common.md#clear-and-simple-design This owner translates the posture table into pose rows; joint neutral angles and limits remain with the supplied basis and a later document pose owns replacement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing named joint throws and a nonpositive addition returns no rows; the code adds no viewer-specific correction or new anatomical range.
 * @evidence contracts/common.md#meaningful-documentation Rows use anatomical degrees over rest; null abduction and twist leave those axes unspecified, and the result owns fresh rows without editing the basis.
 * @evidence contracts/performance.md#efficient-algorithms For T thoracic entries and J basis joints, repeated lookup costs O(T*J) with O(T) output; both tables are bounded and no skin is rebuilt.
 * @evidence contracts/performance.md#reuse-equivalent-work The immutable posture table is shared, while rows are recomputed from the current age, sex and basis rest angles; no candidate-dependent cache exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary lookup closures are call-local and the fresh pose rows transfer to the caller; no handles, background tasks or retained model state are acquired.
 */
export function humanBodySimplePosture(
  basis: IAutoMovieHumanBodyBasis,
  simple: Pick<IAutoMovieHumanBodySimpleShape, "sex" | "ageYears">,
): IAutoMovieJointPose[] {
  const table: typeof HUMAN_BODY_SIMPLE_POSTURE = HUMAN_BODY_SIMPLE_POSTURE;
  const added: number =
    humanBodySimpleShapeMath.curve(table.kyphosis.ageYears, simple.ageYears) *
    (humanBodySimpleShapeMath.curve(table.kyphosis.oldDegrees, simple.sex) -
      table.kyphosis.youngDegrees);
  if (added <= 0) return [];
  const joint: (bone: string) => IAutoMovieHumanBodyBasis["joints"][number] = (bone: string): IAutoMovieHumanBodyBasis["joints"][number] => {
    const found: IAutoMovieHumanBodyBasis["joints"][number] | undefined = basis.joints.find((one: IAutoMovieHumanBodyBasis["joints"][number]): boolean => one.bone === bone);
    if (found === undefined)
      throw new Error("Body posture names a joint the basis lacks: " + bone);
    return found;
  };
  const row: (bone: string, flexion: number) => IAutoMovieJointPose = (bone: string, flexion: number): IAutoMovieJointPose => ({
    bone: bone as IAutoMovieJointPose["bone"],
    flexion,
    abduction: null,
    twist: null,
  });
  const compensation: IAutoMovieHumanBodyBasis["joints"][number] = joint(table.compensation);
  const floor: number = compensation.constraint?.flexion?.min ?? -Infinity;
  return [
    ...table.thoracic.map(([bone, share]: [string, number]): IAutoMovieJointPose =>
      row(bone, joint(bone).neutral.flexion + added * share),
    ),
    row(
      table.compensation,
      Math.max(floor, compensation.neutral.flexion - added),
    ),
  ];
}
