import type { AutoMovieHumanBodyBoneId } from "../../identity/AutoMovieHumanBodyBoneId";
import type { IAutoMovieHumanBodySourceJointAxis } from "./IAutoMovieHumanBodySourceJointAxis";
import type { IAutoMovieHumanBodySourceRigInput } from "./IAutoMovieHumanBodySourceRigInput";

/** Select explicit source motion as a distinct alternative; source driver coupling can address a different bone's actual named coordinate. */
export function hasHumanBodySourceLocalGoal(
  bone: AutoMovieHumanBodyBoneId,
  axes: readonly IAutoMovieHumanBodySourceJointAxis[] | undefined,
  input: IAutoMovieHumanBodySourceRigInput,
): boolean {
  return (
    axes !== undefined &&
    input.goals.some(
      (goal) =>
        goal.bone === bone ||
        axes.some(
          (axis) =>
            axis.driver.kind === "anatomical" &&
            goal.bone === axis.driver.bone &&
            goal.axis === axis.driver.axis,
        ),
    )
  );
}
