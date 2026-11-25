import type {
  IAutoMoviePhysicalSimulationInput,
  IAutoMoviePoses,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import type { IPhysicalContactTargetSeed } from "./IPhysicalContactTargetSeed";
import { projectPhysicalTargets } from "./projectPhysicalTargets";

/**
 * Select one body's fit seed at a cached interval from its current plans. A
 * support or balance plan applies only at the same step and revision.
 */
export function preparePhysicalContactTargetSeed(
  body: IAutoMoviePhysicalSimulationInput.IBody,
  target: IAutoMoviePhysicalSimulationInput.ITarget,
  bound: Bound,
  step: number,
  revision: number,
  scene: Readonly<Record<string, IAutoMoviePoses>>,
): IPhysicalContactTargetSeed {
  const root: string = bound.order.get(body.id)![0]!.bone;
  const authoredRoot: boolean =
    body.mode.kind === "kinematic" ||
    (target.dynamicSegments !== undefined &&
      !target.dynamicSegments.includes(root));
  if (authoredRoot)
    return {
      targets: target.segments,
      actual: { ...scene[body.id], [root]: target.segments[root]! },
      initial: projectPhysicalTargets(
        body.profile,
        body.targets[step - 1]!.segments,
      ).targets,
    };

  // Root forces already used these plans earlier in the same substep.
  const balance: ReturnType<typeof bound.planned.get> = bound.planned.get(
    body.id,
  );
  const support: ReturnType<typeof bound.supportPlanned.get> =
    bound.supportPlanned.get(body.id);
  const targets: Record<string, IAutoMovieRigidTransform> =
    support?.step === step && support.revision === revision
      ? support.targets
      : balance?.step === step && balance.revision === revision
        ? balance.targets
        : target.segments;
  return { targets, actual: scene[body.id]!, initial: scene[body.id]! };
}
