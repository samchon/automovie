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
import { physicalSupportPoint } from "./physicalSupportPoint";
import { planPhysicalBalanceTargets } from "./planPhysicalBalanceTargets";
import { rebasePhysicalTargets } from "./rebasePhysicalTargets";
import { samplePhysicalRecoveryGoal } from "./samplePhysicalRecoveryGoal";
import type { samplePhysicalTarget } from "./samplePhysicalTarget";

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
    const targets: Record<string, P.ITransform> = structuredClone(
      input.target.segments,
    );
    for (const pose of Object.values(targets))
      if (input.state.rootOffset)
        pose.position = Vector3.add(pose.position, input.state.rootOffset);
    const endpoints: Record<string, IAutoMovieVector3> = Object.fromEntries(
      policy.pattern.limbs.map(
        (
          limb: (typeof policy.pattern.limbs)[number],
        ): [string, IAutoMovieVector3] => {
          const point: IAutoMovieVector3 = physicalSupportPoint(
            input.target.segments[limb.bone]!,
            limb.localPoint,
          );
          return [
            limb.bone,
            input.state.swing?.bone === limb.bone
              ? samplePhysicalRecoveryGoal({
                  swing: input.state.swing,
                  point,
                  velocity: { x: 0, y: 0, z: 0 },
                  height: policy.height,
                  seconds: input.step / input.settings.rate,
                }).point
              : Vector3.add(
                  point,
                  input.state.offsets[limb.bone] ?? { x: 0, y: 0, z: 0 },
                ),
          ];
        },
      ),
    );
    const base: RigidBody = bound.segments.get(body.id)!.get(input.root.bone)!;
    const root: { bone: string; pose: P.ITransform } = {
      bone: input.root.bone,
      pose: { position: base.translation(), rotation: base.rotation() },
    };
    const result: ReturnType<typeof planPhysicalBalanceTargets> =
      planPhysicalBalanceTargets({
        profile: body.profile,
        pattern: policy.pattern,
        targets,
        goals: endpoints,
        root,
        intent: targets[input.root.bone]!,
        planted: input.planted.filter(
          (bone: string): boolean =>
            !input.target.unavailableSupports?.includes(bone),
        ),
        floor: input.settings.floor,
        maximumRootDrop: policy.maximumRootDrop ?? 0.15,
        iterations: policy.iterations ?? 24,
        tolerance: policy.targetTolerance ?? 0.001,
      });
    const interval: Interval.IPlan = Interval.plan({
      step: input.step,
      revision,
      seconds: input.seconds,
      rate: input.settings.rate,
      nativeRate: input.settings.rate * input.settings.substeps!,
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
