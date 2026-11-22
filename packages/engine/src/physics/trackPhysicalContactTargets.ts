import type {
  IAutoMovieContactReceipt,
  IAutoMoviePhysicalRecoveryState,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieRigidTransform,
  IAutoMovieSamplePhysicalTarget,
} from "@automovie/interface";

import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import type { IPhysicalContactTargetSeed } from "./IPhysicalContactTargetSeed";
import { PhysicalTargetInterval as Interval } from "./PhysicalTargetInterval";
import { physicalContactSupportGoals } from "./physicalContactSupportGoals";
import { planPhysicalContactTargets } from "./planPhysicalContactTargets";
import { preparePhysicalContactTargetSeed } from "./preparePhysicalContactTargetSeed";
import { readPhysicalScene } from "./readPhysicalScene";
import { trackPhysicalCoupledTargets } from "./trackPhysicalCoupledTargets";

/**
 * Resolve collider relationships once per cached interval from the actual simultaneous scene. Only motor goals change; root/support forces have already used their independently declared goals.
 * A target in an admitted coupled group takes its plan from one group fit, which `peers` lets read the other members.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the per-interval replan condition, the simultaneous scene, the coupled delegation and the role of `peers`.
 * @evidence contracts/development/implementation.md#principled-implementation Replans only when the body's stored plan has another step or revision. A coupled target delegates to the group fit; any other target fits alone from the shared seed against the same scene.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One replan branch chooses the group or individual fit, then the stored plan is sampled. Seed selection, fitting, support goals and interval planning stay with their owners.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No `any` or type assertion. Non-null assertions read admitted defaults (`substeps`, `contactTolerance`), geometry prepared for every relationship target, and the plan written in the branch above. A coupled target without `peers` throws instead of reading empty peers.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work outside the fit; one fit per body interval and revision, or one group fit for all members.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the stored interval plan across substeps until its step or revision changes. Group members reuse the plans their group fit wrote.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Keeps one serializable plan per body on the run binding, replaced each interval and captured by controller checkpoints.
 */
export function trackPhysicalContactTargets(
  input: IAutoMoviePhysicalSimulationInput.IInput,
  body: IAutoMoviePhysicalSimulationInput.IBody,
  target: IAutoMoviePhysicalSimulationInput.ITarget,
  bound: Bound,
  step: number,
  goals: Record<string, IAutoMovieSamplePhysicalTarget.IResult>,
  seconds: number,
  revision: number = 0,
  scene?: Record<string, Record<string, IAutoMovieRigidTransform>>,
  state?: IAutoMoviePhysicalRecoveryState,
  peers?: {
    /** Receipts that can withdraw another group member's target. */
    readonly contacts: readonly IAutoMovieContactReceipt[];
    /** Every body's balance state, for the other group members. */
    readonly recovery: Readonly<
      Record<string, IAutoMoviePhysicalRecoveryState>
    >;
  },
): Record<string, Record<string, IAutoMovieRigidTransform>> | undefined {
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
    scene ??= readPhysicalScene(bound);

    // A coupled member's plan is written with every other member's plan.
    if (target.coupledGroup !== undefined) {
      if (peers === undefined)
        throw new Error(
          "Coupled tracking requires every member's receipts and balance state.",
        );
      trackPhysicalCoupledTargets({
        input,
        body,
        target,
        bound,
        step,
        seconds,
        revision,
        scene,
        contacts: peers.contacts,
        recovery: peers.recovery,
      });
    } else {
      const seed: IPhysicalContactTargetSeed = preparePhysicalContactTargetSeed(
        body,
        target,
        bound,
        step,
        revision,
        scene,
      );
      bound.contactTargets.set(
        body.id,
        Interval.plan({
          step,
          revision,
          seconds,
          rate: input.rate,
          nativeRate: input.rate * input.substeps!,
          previous: planned,
          initial: seed.initial,
          targets: planPhysicalContactTargets({
            body: body.id,
            profiles: bound.profiles,
            targets: seed.targets,
            actual: { ...scene, [body.id]: seed.actual },
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
        }),
      );
    }
    planned = bound.contactTargets.get(body.id)!;
  }
  Object.assign(goals, Interval.sample(planned, seconds, input.rate));
  return scene;
}
