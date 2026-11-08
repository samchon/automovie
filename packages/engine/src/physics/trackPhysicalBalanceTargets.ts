import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import type { RigidBody } from "@dimforge/rapier3d-compat";

import { Vector3 } from "../math/Vector3";
import type { AutoMoviePhysicalSimulation as Simulation } from "./AutoMoviePhysicalSimulation";
import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import { PhysicalTargetInterval as Interval } from "./PhysicalTargetInterval";
import type { advancePhysicalBalance as AdvanceBalance } from "./advancePhysicalBalance";
import { choosePhysicalSupportFit } from "./choosePhysicalSupportFit";
import { physicalBalanceReference } from "./physicalBalanceReference";
import { physicalRecoverySupportGoals } from "./physicalRecoverySupportGoals";
import { planPhysicalBalanceTargets } from "./planPhysicalBalanceTargets";
import { rebasePhysicalTargets } from "./rebasePhysicalTargets";
import type { samplePhysicalTarget } from "./samplePhysicalTarget";
import { warmPhysicalSupportTargets } from "./warmPhysicalSupportTargets";

/** Balance owns a coherent support posture independently of optional Cartesian endpoint actuators. Fitted interval poses and twists travel together; actual stationary stance takes priority over an incompatible authored-root posture. */
export function trackPhysicalBalanceTargets(input: {
  /** Admitted settings and provider. */ settings: Simulation.IInput;
  /** Body with an active balance policy. */ body: Simulation.IBody;
  /** Native wrappers and transient interval plans. */ bound: Bound;
  /** Enclosing interval and native substep clock. */ step: number;
  /** Current exact native tick time. */ seconds: number;
  /** Actual root selector. */ root: P.ISegment;
  /** Full sampled motor references, updated together. */ goals: Record<
    string,
    ReturnType<typeof samplePhysicalTarget>
  >;
  /** Current declared ownership and effort. */ target: Simulation.ITarget;
  /** Measured stance owners. */ planted: readonly string[];
  /** Causal recovery trajectory and accepted placements; revisions invalidate an in-interval plan. */ state: AdvanceBalance.IState;
}): { rootDrop: number; rootDropVelocity: number } {
  const { body, bound, goals }: typeof input = input;
  const policy: NonNullable<Simulation.IBody["balance"]> = body.balance!;
  let planned: ReturnType<typeof bound.planned.get> = bound.planned.get(
    body.id,
  );
  const revision: number = input.state.revision ?? 0;
  if (planned?.step !== input.step || planned.revision !== revision) {
    const previous: typeof planned = planned;
    const targets: Record<string, P.ITransform> = { ...input.target.segments };
    if (input.state.rootOffset)
      for (const [bone, pose] of Object.entries(targets))
        targets[bone] = {
          ...pose,
          position: Vector3.add(pose.position, input.state.rootOffset),
        };
    const endpoints: Record<string, IAutoMovieVector3> =
      physicalRecoverySupportGoals(
        body,
        input.target,
        policy.pattern,
        input.state,
        input.step / input.settings.rate,
      );
    const base: RigidBody = bound.segments.get(body.id)!.get(input.root.bone)!;
    const root: { bone: string; pose: P.ITransform } = {
      bone: input.root.bone,
      pose: { position: base.translation(), rotation: base.rotation() },
    };
    // A fresh fit restarts from the authored posture; a warm fit continues
    // the completed reference. The fit's own contract chooses between them.
    const nativeRate: number = input.settings.rate * input.settings.substeps!;
    const reference: ReturnType<typeof physicalBalanceReference> =
      physicalBalanceReference({
        body,
        target: input.target,
        previous,
        step: input.step,
        start: (Math.round(input.seconds * nativeRate) - 1) / nativeRate,
        rate: input.settings.rate,
      });
    const planted: string[] = input.planted.filter(
      (bone: string): boolean =>
        !input.target.unavailableSupports?.includes(bone),
    );
    const tolerance: number = policy.targetTolerance ?? 0.001;
    const fit: (
      seed?: Record<string, P.ITransform>,
    ) => ReturnType<typeof planPhysicalBalanceTargets> = (
      seed?: Record<string, P.ITransform>,
    ): ReturnType<typeof planPhysicalBalanceTargets> =>
      planPhysicalBalanceTargets({
        profile: body.profile,
        pattern: policy.pattern,
        targets,
        seed,
        goals: endpoints,
        root,
        intent: targets[input.root.bone]!,
        planted,
        floor: input.settings.floor,
        maximumRootDrop: policy.maximumRootDrop ?? 0.15,
        iterations: policy.iterations ?? 24,
        tolerance,
      });
    const posture: ReadonlySet<string> = bound.posture.get(body.id)!;
    const joints: ReadonlyMap<string, P.IJoint> = bound.jointByChild.get(
      body.id,
    )!;
    const result: ReturnType<typeof planPhysicalBalanceTargets> =
      choosePhysicalSupportFit({
        candidates: [
          fit(),
          ...(reference
            ? [
                fit(
                  warmPhysicalSupportTargets({
                    order: bound.order.get(body.id)!,
                    joints,
                    descendants: bound.descendants.get(body.id)!,
                    selected: posture,
                    targets,
                    before: reference.before,
                    previous: reference.completed,
                    pattern: policy.pattern,
                    planted: new Set(planted),
                    tolerance,
                  }),
                ),
              ]
            : []),
        ],
        tolerance,
        reference: reference?.completed,
        joints: [...posture]
          .map((bone: string): P.IJoint | undefined => joints.get(bone))
          .filter((joint: P.IJoint | undefined): joint is P.IJoint => !!joint),
      });
    const interval: Interval.IPlan = Interval.plan({
      step: input.step,
      revision,
      seconds: input.seconds,
      rate: input.settings.rate,
      nativeRate,
      previous,
      initial: rebasePhysicalTargets(
        body.targets[input.step - 1]!.segments,
        root.bone,
        root.pose,
      ),
      targets: result.targets,
    });
    planned = {
      ...interval,
      rootDrop: result.rootDrop,
      residuals: result.residuals,
      fromRootDrop:
        previous?.step === input.step
          ? previous.fromRootDrop +
            (previous.rootDrop - previous.fromRootDrop) *
              Interval.fraction(previous, interval.start, input.settings.rate)
          : previous?.step === input.step - 1
            ? previous.rootDrop
            : 0,
    };
    bound.planned.set(body.id, planned);
  }
  const fraction: number = Interval.fraction(
    planned,
    input.seconds,
    input.settings.rate,
  );
  Object.assign(
    goals,
    Interval.sample(planned, input.seconds, input.settings.rate),
  );
  const from: number = planned.fromRootDrop;
  return {
    rootDrop: from + (planned.rootDrop - from) * fraction,
    rootDropVelocity:
      (planned.rootDrop - from) /
      (input.step / input.settings.rate - planned.start),
  };
}
