import type { AutoMovieHumanBodyBoneId } from "../../identity/AutoMovieHumanBodyBoneId";
import type { IAutoMovieHumanBodySourceJointAxis } from "./IAutoMovieHumanBodySourceJointAxis";
import type { IAutoMovieHumanBodySourceRigInput } from "./IAutoMovieHumanBodySourceRigInput";
import { readHumanBodySourceProfile } from "./readHumanBodySourceProfile";

/**
 * Read one absolute source coordinate from its sole authored goal authority.
 * Omission retains the source driver's neutral; explicit zero remains authored.
 * Direct source coordinates and their public driver cannot silently override
 * each other. This helper consumes source bounds, not a universal ROM table.
 *
 * @evidence contracts/common.md#principled-implementation Direct and driven coordinates are distinguished before one value is admitted against its source range.
 * @evidence contracts/common.md#clear-and-simple-design One reader owns authority conflict, units, profile conversion and final scalar admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Duplicate authored authorities refuse; neither goal is silently discarded or clamped.
 * @evidence contracts/common.md#meaningful-documentation States absolute coordinates, explicit zero, omission and the source-bound qualification.
 * @evidence contracts/modeling.md#parameter-channels Each bone/axis address retains its own neutral, side, unit and source driver.
 * @evidence contracts/modeling.md#spatial-conventions Joint rotations use degrees and translations metres, with conversion delegated to the recorded profile.
 * @evidence contracts/anatomy.md#anatomical-source Reads the axis author's declared account and support rather than creating anatomical defaults.
 * @evidence contracts/anatomy.md#permitted-range Finite coordinates outside their source interval refuse unchanged; coupled support belongs to the source/assembly admission owner.
 * @evidence contracts/anatomy.md#parametric-authority Goals address closed anatomical bone/motion names, with no raw geometry authoring inputs.
 * @author Samchon
 */
export function readHumanBodySourceAxis(
  bone: AutoMovieHumanBodyBoneId,
  axis: IAutoMovieHumanBodySourceJointAxis,
  input: IAutoMovieHumanBodySourceRigInput,
  used: Set<string>,
): number {
  const direct = input.goals.find((goal) => goal.bone === bone && goal.axis === axis.id);
  const driver = axis.driver;
  let authored: number | undefined;
  if (driver.kind === "public-pose") {
    authored = input.pose.find((goal) => goal.bone === driver.bone)?.[driver.axis] ?? undefined;
    if (authored !== undefined) used.add(`public-pose.${driver.bone}.${driver.axis}`);
  } else if (driver.kind === "public-shoulder") {
    authored = input.shoulders.find((goal) => goal.bone === driver.bone)?.[driver.axis];
    if (authored !== undefined) used.add(`public-shoulder.${driver.bone}.${driver.axis}`);
  } else if (driver.kind === "public-toe") {
    authored = input.toes?.find((goal) => goal.bone === driver.bone)?.[driver.axis];
    if (authored !== undefined) used.add(`public-toe.${driver.bone}.${driver.axis}`);
  } else {
    const goal = input.goals.find((one) => one.bone === driver.bone && one.axis === driver.axis);
    if (goal !== undefined) {
      if (goal.unit !== driver.unit)
        throw new Error(`Source motion unit disagrees with its driver: ${goal.bone}.${goal.axis}`);
      used.add(`${goal.bone}.${goal.axis}`);
      authored = goal.value;
    }
  }
  let value: number;
  if (direct !== undefined) {
    const same = driver.kind === "anatomical" && driver.bone === bone && driver.axis === axis.id;
    const explicit = driver.kind === "public-pose"
      ? (input.authoredPose ?? input.pose).some((goal) => goal.bone === driver.bone && goal[driver.axis] !== null && goal[driver.axis] !== undefined)
      : authored !== undefined;
    if (!same && explicit)
      throw new Error(`Source motion has duplicate goal authorities: ${bone}.${axis.id}`);
    if (direct.unit !== (axis.kind === "rotation" ? "degrees" : "metres"))
      throw new Error(`Source motion unit disagrees with its joint axis: ${bone}.${axis.id}`);
    used.add(`${bone}.${axis.id}`);
    value = direct.value;
  } else value = readHumanBodySourceProfile(axis, authored ?? driver.neutral);
  if (!Number.isFinite(value) || value < axis.range[0] || value > axis.range[1])
    throw new Error(`Source motion exceeds its supported coordinate: ${bone}.${axis.id}`);
  return value;
}
