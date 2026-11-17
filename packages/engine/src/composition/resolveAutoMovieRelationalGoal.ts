import type {
  IAutoMovieFitPhysicalWholeBodyTarget,
  IAutoMoviePhysicalProfile,
  IAutoMovieResolveRelationalGoal,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { fitPhysicalWholeBodyTarget } from "../physics/fitPhysicalWholeBodyTarget";

/**
 * Realize a relational goal at one instant: read the target subject's region
 * from its actual pose (at the window's start for `freeze`, at the instant
 * for `track`), then bend the performer's prior pose toward it by the
 * whole-body fit ({@link fitPhysicalWholeBodyTarget}) from its held support,
 * inside every declared ROM, with an optional approach for the effector.
 * Outside the window the prior is returned unchanged with no residual.
 *
 * Bodies are engine-level: a physical profile, a pose at any instant (the
 * production's shape prior, such as an authored or keyed pose) and named
 * regions; no figure package is needed.
 *
 * @param input The performer, the goal, the bodies and the instant.
 * @returns The performer's fitted pose and residual report.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Realize a relational goal at one instant: read the target subject's region from its actual pose (at the window's start for `freeze`, at the instant for `track`), then bend the performer's prior pose toward it by the whole-body fit () from its held support, inside every declared ROM, with an optional approach for the effector) and documents parameter `input`, the returned value as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Realize a relational goal at one instant: read the target subject's region from its actual pose (at the window's start for `freeze`, at the instant for `track`), then bend the performer's prior pose toward it by the whole-body fit () from its held support, inside every declared ROM, with an optional approach for the effector) directly over its typed inputs (`input`) as a fixed number of statements with no loop or recursion in the body, delegating to `performer.pose`, `target.pose`, `Vector3.add`, `Quaternion.rotateVector`, `performer.support`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Beyond structural 0, 1 and 2 the body uses the literals 0.05, 32, 0.0001, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 69 lines and 15 top-level statements that reuses `performer.pose`, `target.pose`, `Vector3.add`, `Quaternion.rotateVector`, `performer.support` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 2 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is a fixed number of statements with no loop or recursion in the body, performed once per call with 10 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 10 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function resolveAutoMovieRelationalGoal(
  input: IAutoMovieResolveRelationalGoal.IInput,
): IAutoMovieResolveRelationalGoal.IResult {
  const performer: IAutoMovieResolveRelationalGoal.IBody | undefined =
    input.bodies[input.performer];
  const target: IAutoMovieResolveRelationalGoal.IBody | undefined =
    input.bodies[input.goal.target.subject];
  if (!performer || !target)
    throw new Error(`Unknown relational subject of ${input.performer}`);
  const prior: Record<string, IAutoMoviePhysicalProfile.ITransform> =
    performer.pose(input.seconds);
  const { start, end }: { start: number; end: number } = input.goal.window;
  if (input.seconds < start || input.seconds > end)
    return {
      targets: prior,
      point: null,
      active: false,
      residual: 0,
      position: 0,
      approach: 0,
    };
  const region: IAutoMovieResolveRelationalGoal.IRegion | undefined =
    target.regions[input.goal.target.region];
  if (!region)
    throw new Error(
      `Unknown region ${input.goal.target.subject}.${input.goal.target.region}`,
    );
  const read: Record<string, IAutoMoviePhysicalProfile.ITransform> =
    target.pose(input.goal.lock === "freeze" ? start : input.seconds);
  const pose: IAutoMoviePhysicalProfile.ITransform = read[region.bone]!;
  const point: IAutoMovieVector3 = Vector3.add(
    pose.position,
    Quaternion.rotateVector(pose.rotation, region.localPoint),
  );
  const support: IAutoMovieResolveRelationalGoal.ISupport = performer.support(
    input.seconds,
  );
  const held: IAutoMoviePhysicalProfile.ITransform = prior[support.bone]!;
  const fit: IAutoMovieFitPhysicalWholeBodyTarget.IResult =
    fitPhysicalWholeBodyTarget({
      profile: performer.profile,
      targets: prior,
      support: {
        bone: support.bone,
        point: Vector3.add(
          held.position,
          Quaternion.rotateVector(held.rotation, support.localPoint),
        ),
        normal: support.normal,
        minimum: support.minimum,
        maximum: support.maximum,
      },
      bones: performer.bones,
      goal: {
        bone: input.goal.surface.bone,
        localPoint: input.goal.surface.localPoint,
        point,
        ...(input.goal.approach && input.goal.surface.localDirection
          ? {
              approach: {
                localDirection: input.goal.surface.localDirection,
                direction: input.goal.approach,
                weight: input.approachWeight ?? 0.05,
              },
            }
          : {}),
      },
      iterations: input.iterations ?? 32,
      tolerance: input.tolerance ?? 1e-4,
    });
  return { ...fit, point, active: true };
}
