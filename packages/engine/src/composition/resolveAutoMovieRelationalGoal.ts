import type {
  IAutoMovieFitPhysicalWholeBodyTarget,
  IAutoMovieResolveRelationalGoal,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { fitPhysicalWholeBodyTarget } from "../physics/fitPhysicalWholeBodyTarget";

/**
 * Realize a relational goal at one instant: read the target subject's region
 * from its actual pose (at the window's start for `freeze`, at the instant for
 * `track`), then bend the performer's prior pose toward it by the whole-body
 * fit ({@link fitPhysicalWholeBodyTarget}) from its held support, inside every
 * declared ROM, with an optional approach for the effector. Outside the window
 * the prior is returned unchanged with no residual.
 *
 * Bodies are engine-level: a physical profile, a pose at any instant (the
 * production's shape prior, such as an authored or keyed pose) and named
 * regions; no figure package is needed.
 *
 * @param input The performer, the goal, the bodies and the instant.
 * @returns The performer's fitted pose and residual report.
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
  const prior: Record<string, IAutoMovieRigidTransform> = performer.pose(
    input.seconds,
  );
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
  const read: Record<string, IAutoMovieRigidTransform> = target.pose(
    input.goal.lock === "freeze" ? start : input.seconds,
  );
  const pose: IAutoMovieRigidTransform = read[region.bone]!;
  const point: IAutoMovieVector3 = Vector3.add(
    pose.position,
    Quaternion.rotateVector(pose.rotation, region.localPoint),
  );
  const support: IAutoMovieResolveRelationalGoal.ISupport = performer.support(
    input.seconds,
  );
  const held: IAutoMovieRigidTransform = prior[support.bone]!;
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
