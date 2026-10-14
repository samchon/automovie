import type { IAutoMovieJointPose } from "@automovie/interface";

import type { IAutoMovieHumanBodyShoulderPose } from "../../../structures/IAutoMovieHumanBodyShoulderPose";
import type { IAutoMovieHumanBodyToePose } from "../../../structures/IAutoMovieHumanBodyToePose";
import type { AutoMovieHumanBodyBoneId } from "../../identity/AutoMovieHumanBodyBoneId";
import type { AutoMovieHumanBodySourceDriver } from "./AutoMovieHumanBodySourceDriver";
import type { IAutoMovieHumanBodySourceJointAxis } from "./IAutoMovieHumanBodySourceJointAxis";
import type { IAutoMovieHumanBodySourceJointGoal } from "./IAutoMovieHumanBodySourceJointGoal";
import type { IAutoMovieHumanBodySourceRigInput } from "./IAutoMovieHumanBodySourceRigInput";
import { readHumanBodySourceProfile } from "./readHumanBodySourceProfile";

/**
 * Read one absolute source coordinate from its sole authored goal authority. Omission retains the source driver's neutral; explicit zero remains authored. Direct source coordinates and their public driver cannot silently override each other. This helper consumes source bounds, not a universal ROM table.
 *
 * The caller owns used, which records consumed goal addresses and can gain entries before a later refusal. Direct requests use the axis's own degree/metre unit; mapped requests use the registered driver's unit and optional profile. The source graph must already have admitted its directions, bounds and profile order; goals and source definitions remain unchanged.
 *
 * @evidence contracts/common.md#principled-implementation The reader selects the sole direct or registered-driver authority, maps omission through source neutral, and refuses nonfinite, out-of-range or mismatched-unit coordinates.
 * @evidence contracts/common.md#clear-and-simple-design Authority selection, profile mapping and consumed-goal bookkeeping remain together so unsupported authored requests can be refused by the graph owner afterward.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Explicit zero remains an authored coordinate, and a direct coordinate cannot silently override an independently authored public or coupled source goal.
 * @evidence contracts/common.md#meaningful-documentation The comment states omission, duplicate-authority refusal and source-owned bounds; expanded prose identifies the caller-owned consumed-goal set mutation.
 * @evidence contracts/performance.md#efficient-algorithms Linear searches follow the authored goal populations and one optional knot profile; auxiliary space is constant except entries added to the caller's consumed-goal set.
 * @evidence contracts/performance.md#reuse-equivalent-work Direct and driver lookup reuse one axis definition and its profile reader; prior resolved values are not cached because authored rows and source neutral may differ.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the used-address set, which can gain entries before a later refusal; the function retains no input or profile after returning.
 */
export function readHumanBodySourceAxis(
  bone: AutoMovieHumanBodyBoneId,
  axis: IAutoMovieHumanBodySourceJointAxis,
  input: IAutoMovieHumanBodySourceRigInput,
  used: Set<string>,
): number {
  const direct: IAutoMovieHumanBodySourceJointGoal | undefined =
    input.goals.find(
      (goal: IAutoMovieHumanBodySourceJointGoal): boolean =>
        goal.bone === bone && goal.axis === axis.id,
    );
  const driver: AutoMovieHumanBodySourceDriver = axis.driver;
  let authored: number | undefined;
  if (driver.kind === "public-pose") {
    authored =
      input.pose.find(
        (goal: IAutoMovieJointPose): boolean => goal.bone === driver.bone,
      )?.[driver.axis] ?? undefined;
    if (authored !== undefined)
      used.add(`public-pose.${driver.bone}.${driver.axis}`);
  } else if (driver.kind === "public-shoulder") {
    authored = input.shoulders.find(
      (goal: IAutoMovieHumanBodyShoulderPose): boolean =>
        goal.bone === driver.bone,
    )?.[driver.axis];
    if (authored !== undefined)
      used.add(`public-shoulder.${driver.bone}.${driver.axis}`);
  } else if (driver.kind === "public-toe") {
    authored = input.toes?.find(
      (goal: IAutoMovieHumanBodyToePose): boolean => goal.bone === driver.bone,
    )?.[driver.axis];
    if (authored !== undefined)
      used.add(`public-toe.${driver.bone}.${driver.axis}`);
  } else {
    const goal: IAutoMovieHumanBodySourceJointGoal | undefined =
      input.goals.find(
        (one: IAutoMovieHumanBodySourceJointGoal): boolean =>
          one.bone === driver.bone && one.axis === driver.axis,
      );
    if (goal !== undefined) {
      if (goal.unit !== driver.unit)
        throw new Error(
          `Source motion unit disagrees with its driver: ${goal.bone}.${goal.axis}`,
        );
      used.add(`${goal.bone}.${goal.axis}`);
      authored = goal.value;
    }
  }
  let value: number;
  if (direct !== undefined) {
    const same: boolean =
      driver.kind === "anatomical" &&
      driver.bone === bone &&
      driver.axis === axis.id;
    const explicit: boolean =
      driver.kind === "public-pose"
        ? (input.authoredPose ?? input.pose).some(
            (goal: IAutoMovieJointPose): boolean =>
              goal.bone === driver.bone &&
              goal[driver.axis] !== null &&
              goal[driver.axis] !== undefined,
          )
        : authored !== undefined;
    if (!same && explicit)
      throw new Error(
        `Source motion has duplicate goal authorities: ${bone}.${axis.id}`,
      );
    if (direct.unit !== (axis.kind === "rotation" ? "degrees" : "metres"))
      throw new Error(
        `Source motion unit disagrees with its joint axis: ${bone}.${axis.id}`,
      );
    used.add(`${bone}.${axis.id}`);
    value = direct.value;
  } else value = readHumanBodySourceProfile(axis, authored ?? driver.neutral);
  if (!Number.isFinite(value) || value < axis.range[0] || value > axis.range[1])
    throw new Error(
      `Source motion exceeds its supported coordinate: ${bone}.${axis.id}`,
    );
  return value;
}
