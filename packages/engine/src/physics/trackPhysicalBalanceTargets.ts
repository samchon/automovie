import type {
  IAutoMoviePhysicalBalanceReference,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalRecoveryState,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalSimulationInput,
  IAutoMoviePhysicalTargetInterval,
  IAutoMoviePlanPhysicalSupportTargets,
  IAutoMovieRigidTransform,
  IAutoMovieSamplePhysicalTarget,
  IAutoMovieTrackPhysicalBalanceTargets,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import { PhysicalTargetInterval as Interval } from "./PhysicalTargetInterval";
import { choosePhysicalSupportFit } from "./choosePhysicalSupportFit";
import { physicalBalanceReference } from "./physicalBalanceReference";
import { physicalRecoverySupportGoals } from "./physicalRecoverySupportGoals";
import { physicalStanceBalance } from "./physicalStanceBalance";
import { physicalSwingReference } from "./physicalSwingReference";
import { planPhysicalBalanceTargets } from "./planPhysicalBalanceTargets";
import { rebasePhysicalTargets } from "./rebasePhysicalTargets";
import { warmPhysicalSupportTargets } from "./warmPhysicalSupportTargets";

/**
 * Balance owns a coherent support posture independently of optional Cartesian endpoint actuators. Fitted interval poses and twists travel together; actual stationary stance takes priority over an incompatible authored-root posture.
 */
export function trackPhysicalBalanceTargets(input: {
  /** Admitted settings and provider. */ settings: IAutoMoviePhysicalSimulationInput.IInput;
  /** Body with an active balance policy. */ body: IAutoMoviePhysicalSimulationInput.IBody;
  /** Native wrappers and transient interval plans. */ bound: Bound;
  /** Enclosing interval and native substep clock. */ step: number;
  /** Current exact native tick time. */ seconds: number;
  /** Actual root selector. */ root: IAutoMoviePhysicalSegment;
  /** Full sampled motor references, updated together. */ goals: Record<
    string,
    IAutoMovieSamplePhysicalTarget.IResult
  >;
  /** Current declared ownership and effort. */ target: IAutoMoviePhysicalSimulationInput.ITarget;
  /** Measured stance owners. */ planted: readonly string[];
  /** Causal recovery trajectory and accepted placements; revisions invalidate an in-interval plan. */ state: IAutoMoviePhysicalRecoveryState;
  /** A lifted swing's path as its drive takes it (`advancePhysicalBalance`). */ path?: {
    height: number;
    hang: number;
  };
}): IAutoMovieTrackPhysicalBalanceTargets.IResult {
  const { body, bound, goals }: typeof input = input;
  const policy: NonNullable<
    IAutoMoviePhysicalSimulationInput.IBody["balance"]
  > = body.balance!;
  let planned: ReturnType<typeof bound.planned.get> = bound.planned.get(
    body.id,
  );
  const revision: number = input.state.revision ?? 0;
  if (planned?.step !== input.step || planned.revision !== revision) {
    const previous: typeof planned = planned;
    const targets: Record<string, IAutoMovieRigidTransform> = {
      ...input.target.segments,
    };
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
        input.path,
      );
    const base: AutoMovieXpbdBody = bound.segments
      .get(body.id)!
      .get(input.root.bone)!;
    const root: { bone: string; pose: IAutoMovieRigidTransform } = {
      bone: input.root.bone,
      pose: { position: base.translation(), rotation: base.rotation() },
    };
    // A fresh fit restarts from the authored posture; a warm fit continues
    // the completed reference. The fit's own contract chooses between them.
    const nativeRate: number = input.settings.rate * input.settings.substeps!;
    const reference: IAutoMoviePhysicalBalanceReference.IResult =
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
      seed?: Record<string, IAutoMovieRigidTransform>,
    ) => IAutoMoviePlanPhysicalSupportTargets.IResult = (
      seed?: Record<string, IAutoMovieRigidTransform>,
    ): IAutoMoviePlanPhysicalSupportTargets.IResult =>
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
    const joints: ReadonlyMap<string, IAutoMoviePhysicalJoint> =
      bound.jointByChild.get(body.id)!;
    // A lifted swing keeps one joint-space reference, continuous through the
    // swing (design-4017-edge, S1): its fit is seeded from the previous one
    // alone, never restarted from the authored pose, whose solution, when
    // neither fit meets the tolerance, can win on residual one frame and
    // lose the next and throw the leg between two branches.
    const lifting: boolean =
      !!input.state.swing && !input.state.seating?.[input.state.swing.bone];
    const warm: Record<string, IAutoMovieRigidTransform> | undefined = reference
      ? warmPhysicalSupportTargets({
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
        })
      : undefined;
    const result: IAutoMoviePlanPhysicalSupportTargets.IResult =
      choosePhysicalSupportFit({
        candidates: [
          ...(lifting && warm ? [] : [fit()]),
          ...(warm ? [fit(warm)] : []),
        ],
        tolerance,
        reference: reference?.completed,
        joints: [...posture]
          .map((bone: string): IAutoMoviePhysicalJoint | undefined =>
            joints.get(bone),
          )
          .filter(
            (
              joint: IAutoMoviePhysicalJoint | undefined,
            ): joint is IAutoMoviePhysicalJoint => !!joint,
          ),
      });
    // The lifted swing's chain is fitted to its foot's full pose, the path's
    // endpoint and the planned level attitude, from the previous reference
    // (`physicalSwingReference.pose`).
    const liftedLimb: (typeof policy.pattern.limbs)[number] | undefined =
      lifting && warm
        ? policy.pattern.limbs.find(
            (candidate: (typeof policy.pattern.limbs)[number]): boolean =>
              candidate.bone === input.state.swing!.bone,
          )
        : undefined;
    const liftedJoint: IAutoMoviePhysicalJoint | undefined = liftedLimb
      ? body.profile.joints.find(
          (joint: IAutoMoviePhysicalJoint): boolean =>
            joint.child === liftedLimb.chain[0],
        )
      : undefined;
    if (
      liftedLimb &&
      liftedJoint &&
      warm &&
      result.targets[liftedJoint.parent] &&
      endpoints[liftedLimb.bone] &&
      targets[liftedLimb.bone]
    )
      Object.assign(
        result.targets,
        physicalSwingReference.pose({
          profile: body.profile,
          chain: liftedLimb.chain,
          base: result.targets[liftedJoint.parent]!,
          seed: warm,
          authored: targets,
          goal: endpoints[liftedLimb.bone]!,
          ...(liftedLimb.localPoint ? { localPoint: liftedLimb.localPoint } : {}),
          rotation: targets[liftedLimb.bone]!.rotation,
          iterations: policy.iterations ?? 24,
          tolerance,
        }).targets,
      );
    // A lifted swing's chain starts its references where its joints stand at
    // lift-off and is drawn toward the fit over the fade
    // (`physicalSwingReference`), so its joints' references do not jump.
    const swing: IAutoMoviePhysicalRecoveryState["swing"] = input.state.swing;
    const limb: (typeof policy.pattern.limbs)[number] | undefined =
      swing && !input.state.seating?.[swing.bone]
        ? policy.pattern.limbs.find(
            (candidate: (typeof policy.pattern.limbs)[number]): boolean =>
              candidate.bone === swing.bone,
          )
        : undefined;
    // The limb's whole subtree from its first joint, parent before child.
    const chain: IAutoMoviePhysicalJoint[] = [];
    const subtree: Set<string> = new Set(limb ? [limb.chain[0]!] : []);
    for (const joint of limb ? body.profile.joints : [])
      if (subtree.has(joint.child) || subtree.has(joint.parent)) {
        subtree.add(joint.child);
        chain.push(joint);
      }
    const share: number =
      swing && chain.length > 0
        ? (input.step / input.settings.rate - swing.start) /
          physicalStanceBalance.FADE
        : 1;
    const actual: Record<string, IAutoMovieRigidTransform> = {};
    if (share < 1) {
      const segments: ReadonlyMap<string, AutoMovieXpbdBody> =
        bound.segments.get(body.id)!;
      for (const bone of [chain[0]!.parent, ...chain.map((j) => j.child)]) {
        const rigid: AutoMovieXpbdBody = segments.get(bone)!;
        actual[bone] = {
          position: rigid.translation(),
          rotation: rigid.rotation(),
        };
      }
    }
    const fitted: Record<string, IAutoMovieRigidTransform> =
      share < 1 && result.targets[chain[0]!.parent]
        ? {
            ...result.targets,
            ...physicalSwingReference({
              joints: chain,
              base: result.targets[chain[0]!.parent]!,
              actual,
              fit: result.targets,
              share,
            }),
          }
        : result.targets;
    const interval: IAutoMoviePhysicalTargetInterval.IPlan = Interval.plan({
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
      targets: fitted,
    });
    if (
      share < 1 &&
      swing &&
      Math.abs(input.seconds - swing.start) < 0.5 / nativeRate &&
      interval.from[chain[0]!.parent]
    )
      interval.from = {
        ...interval.from,
        ...physicalSwingReference({
          joints: chain,
          base: interval.from[chain[0]!.parent]!,
          actual,
          fit: actual,
          share: 0,
        }),
      };
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
