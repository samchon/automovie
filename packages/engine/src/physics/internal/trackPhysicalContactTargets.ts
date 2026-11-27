import type {
  IAutoMovieContactReceipt,
  IAutoMoviePhysicalRecoveryState,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieRigidTransform,
  IAutoMovieSamplePhysicalTarget,
} from "@automovie/interface";

import type { IAutoMoviePhysicalBinding as Bound } from "../IAutoMoviePhysicalBinding";
import type { IPhysicalContactTargetSeed } from "./IPhysicalContactTargetSeed";
import { PhysicalTargetInterval as Interval } from "../PhysicalTargetInterval";
import { physicalContactSupportGoals } from "./physicalContactSupportGoals";
import { planPhysicalContactTargets } from "./planPhysicalContactTargets";
import { preparePhysicalContactTargetSeed } from "./preparePhysicalContactTargetSeed";
import { readPhysicalScene } from "./readPhysicalScene";
import { trackPhysicalCoupledTargets } from "./trackPhysicalCoupledTargets";

/**
 * Resolve collider relationships once per cached interval from the actual
 * simultaneous scene. Only motor goals change; root/support forces have already
 * used their independently declared goals. A target in an admitted coupled
 * group takes its plan from one group fit, which `peers` lets read the other
 * members.
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
