import type { AutoMovieHumanBodyBoneId } from "../../identity/AutoMovieHumanBodyBoneId";
import type { IAutoMovieHumanBodySourceJointAxis } from "./IAutoMovieHumanBodySourceJointAxis";
import type { IAutoMovieHumanBodySourceJointGoal } from "./IAutoMovieHumanBodySourceJointGoal";
import type { IAutoMovieHumanBodySourceRigInput } from "./IAutoMovieHumanBodySourceRigInput";

/**
 * Select explicit source motion as a distinct alternative; source driver coupling can address a different bone's actual named coordinate.
 *
 * Returns false when local axes are absent. Otherwise a goal addressed to this bone or to an axis's recorded anatomical driver selects local motion, including explicit zero. The predicate only reads caller inputs; subsequent readers admit units, ranges and complete goal consumption.
 *
 * @evidence contracts/common.md#principled-implementation Explicit goals for the current bone or for an anatomical driver coupled to a local axis select the internal-coordinate alternative; absence of axes cannot select it.
 * @evidence contracts/common.md#clear-and-simple-design A predicate owns authority selection independently of transform evaluation, letting public-pose and TT resolvers use identical selection semantics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A driver may legitimately address another bone's named coordinate, so the predicate follows recorded coupling rather than assuming same-bone ownership.
 * @evidence contracts/common.md#meaningful-documentation The description states explicit-alternative selection and cross-bone source coupling; the expanded prose defines absent-axis and caller-mutation semantics.
 * @evidence contracts/performance.md#efficient-algorithms For G authored goals and A local axes, short-circuit searches cost O(GA) worst-case and allocate no proportional temporary collection.
 * @evidence contracts/performance.md#reuse-equivalent-work This predicate shares no completed choice across calls because both authored goals and source driver couplings determine the result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only nested search callbacks live during the predicate call; it retains neither the goal array nor the source-axis array afterward.
 */
export function hasHumanBodySourceLocalGoal(
  bone: AutoMovieHumanBodyBoneId,
  axes: readonly IAutoMovieHumanBodySourceJointAxis[] | undefined,
  input: IAutoMovieHumanBodySourceRigInput,
): boolean {
  return (
    axes !== undefined &&
    input.goals.some(
      (goal: IAutoMovieHumanBodySourceJointGoal): boolean =>
        goal.bone === bone ||
        axes.some(
          (axis: IAutoMovieHumanBodySourceJointAxis): boolean =>
            axis.driver.kind === "anatomical" &&
            goal.bone === axis.driver.bone &&
            goal.axis === axis.driver.axis,
        ),
    )
  );
}
