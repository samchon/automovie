import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import type { AutoMoviePhysicalSimulation as Simulation } from "./AutoMoviePhysicalSimulation";
import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import { PhysicalTargetInterval as Interval } from "./PhysicalTargetInterval";
import type { advancePhysicalBalance as Balance } from "./advancePhysicalBalance";
import { physicalContactSupportGoals } from "./physicalContactSupportGoals";
import { planPhysicalContactTargets } from "./planPhysicalContactTargets";
import { projectPhysicalTargets } from "./projectPhysicalTargets";
import { readPhysicalScene } from "./readPhysicalScene";
import type { samplePhysicalTarget } from "./samplePhysicalTarget";

/** Resolve collider relationships once per cached interval from the actual simultaneous scene. Only motor goals change; root/support forces have already used their independently declared goals. */
export function trackPhysicalContactTargets(
  input: Simulation.IInput,
  body: Simulation.IBody,
  target: Simulation.ITarget,
  bound: Bound,
  step: number,
  goals: Record<string, ReturnType<typeof samplePhysicalTarget>>,
  seconds: number,
  revision: number = 0,
  scene?: ReturnType<typeof readPhysicalScene>,
  state?: Balance.IState,
): ReturnType<typeof readPhysicalScene> | undefined {
  if (
    (!target.bindings?.length &&
      !target.pointBounds?.length &&
      !body.selfAvoidance) ||
    (target.strength === 0 && body.mode.kind !== "kinematic")
  )
    return scene;
  let planned: ReturnType<typeof bound.contactTargets.get> =
    bound.contactTargets.get(body.id);
  if (planned?.step !== step || planned.revision !== revision) {
    const previous: typeof planned = planned;
    scene ??= readPhysicalScene(bound);
    let actual: typeof scene = scene;
    const root: string = bound.order.get(body.id)![0]!.bone;
    const authoredRoot: boolean =
      body.mode.kind === "kinematic" ||
      (target.dynamicSegments !== undefined &&
        !target.dynamicSegments.includes(root));
    const balance: ReturnType<typeof bound.planned.get> = bound.planned.get(
      body.id,
    );
    const support: ReturnType<typeof bound.supportPlanned.get> =
      bound.supportPlanned.get(body.id);
    const poses: Record<string, P.ITransform> = authoredRoot
      ? target.segments
      : support?.step === step && support.revision === revision
        ? support.targets
        : balance?.step === step && balance.revision === revision
          ? balance.targets
          : target.segments;
    if (authoredRoot)
      actual = {
        ...scene,
        [body.id]: { ...scene[body.id], [root]: poses[root]! },
      };
    planned = Interval.plan({
      step,
      revision,
      seconds,
      rate: input.rate,
      nativeRate: input.rate * input.substeps!,
      previous,
      initial: authoredRoot
        ? projectPhysicalTargets(body.profile, body.targets[step - 1]!.segments)
            .targets
        : actual[body.id]!,
      targets: planPhysicalContactTargets({
        body: body.id,
        profiles: bound.profiles,
        targets: poses,
        actual,
        bindings: target.bindings ?? [],
        pointBounds: target.pointBounds,
        selfAvoidance: body.selfAvoidance,
        supports: physicalContactSupportGoals(
          body,
          target,
          input.floor,
          input.contactTolerance!,
          step / input.rate,
          input.rate,
          step,
          state,
        ),
        geometry: bound.geometry!,
        floor: input.floor - input.contactTolerance!,
      }).targets,
    });
    bound.contactTargets.set(body.id, planned);
  }
  Object.assign(goals, Interval.sample(planned, seconds, input.rate));
  return scene;
}
