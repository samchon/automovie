import type {
  IAutoMovieContactReceipt,
  IAutoMoviePhysicalRecoveryState,
  IAutoMoviePhysicalSimulationInput,
  IAutoMoviePoses,
} from "@automovie/interface";

import { AutoMoviePhysicalCoupledTargetError } from "../AutoMoviePhysicalCoupledTargetError";
import type { IAutoMoviePhysicalBinding as Bound } from "../IAutoMoviePhysicalBinding";
import type { IPhysicalContactTargetSeed } from "./IPhysicalContactTargetSeed";
import type { IPhysicalCoupledTargetGroup } from "./IPhysicalCoupledTargetGroup";
import { PhysicalTargetInterval as Interval } from "../PhysicalTargetInterval";
import { fitPhysicalCoupledTargetGroup } from "./fitPhysicalCoupledTargetGroup";
import { physicalContactSupportGoals } from "./physicalContactSupportGoals";
import { preparePhysicalContactTargetSeed } from "./preparePhysicalContactTargetSeed";
import { samplePhysicalTrackingTarget } from "./samplePhysicalTrackingTarget";

/*
 * Fit every member of the caller's admitted group against the same native scene
 * snapshot, then replace each member's interval plan together. The caller
 * samples its own plan afterwards; later members reuse theirs.
 */
export function trackPhysicalCoupledTargets(props: {
  readonly input: IAutoMoviePhysicalSimulationInput.IInput;
  /*
   * Member whose tracking requested the fit.
   */
  readonly body: Body;
  /*
   * That member's sampled target for this substep.
   */
  readonly target: Target;
  readonly bound: Bound;
  readonly step: number;
  /*
   * Native substep time, film seconds.
   */
  readonly seconds: number;
  /*
   * That member's balance revision.
   */
  readonly revision: number;
  /*
   * Simultaneous world poses of every scene body.
   */
  readonly scene: Readonly<Record<string, IAutoMoviePoses>>;
  readonly contacts: readonly IAutoMovieContactReceipt[];
  readonly recovery: Readonly<Record<string, IAutoMoviePhysicalRecoveryState>>;
}): void {
  const { input, bound, step } = props;
  const label: string = props.target.coupledGroup!;
  const group: IPhysicalCoupledTargetGroup | undefined =
    bound.coupling?.schedule
      .get(step)
      ?.find(
        (candidate: IPhysicalCoupledTargetGroup): boolean =>
          candidate.group === label,
      );
  if (group === undefined || !group.bodies.includes(props.body))
    throw new AutoMoviePhysicalCoupledTargetError({
      step,
      group: label,
      members: [props.body.id],
      kind: "refused",
      reason: "declaration",
      detail: "The frame requires an admitted coupled target group.",
    });

  // Every member reads the caller's snapshot, with authored roots in place.
  const actual: Record<string, IAutoMoviePoses> = { ...props.scene };
  const members: {
    body: Body;
    target: Target;
    revision: number;
    seed: IPhysicalContactTargetSeed;
  }[] = group.bodies.map(
    (
      body: Body,
    ): {
      body: Body;
      target: Target;
      revision: number;
      seed: IPhysicalContactTargetSeed;
    } => {
      const target: Target =
        body === props.body
          ? props.target
          : samplePhysicalTrackingTarget(
              body,
              body.targets[step]!,
              props.contacts,
              props.seconds,
              bound.contactReleased,
            );
      const revision: number =
        body === props.body
          ? props.revision
          : (props.recovery[body.id]?.revision ?? 0);
      const seed: IPhysicalContactTargetSeed = preparePhysicalContactTargetSeed(
        body,
        target,
        bound,
        step,
        revision,
        props.scene,
      );
      actual[body.id] = seed.actual;
      return { body, target, revision, seed };
    },
  );
  const fit: ReturnType<typeof fitPhysicalCoupledTargetGroup> =
    fitPhysicalCoupledTargetGroup(group, {
      scene: input,
      actual,
      geometry: bound.geometry!,
      floor: input.floor - input.contactTolerance!,
      members: members.map(
        (
          member: (typeof members)[number],
        ): Parameters<
          typeof fitPhysicalCoupledTargetGroup
        >[1]["members"][number] => ({
          body: member.body.id,
          target: { ...member.target, segments: member.seed.targets },
          supports: physicalContactSupportGoals(
            member.body,
            member.target,
            input.floor,
            input.contactTolerance!,
            step / input.rate,
            input.rate,
            step,
            props.recovery[member.body.id],
          ),
        }),
      ),
    });

  // Publish only after the whole group converged.
  for (const member of members)
    bound.contactTargets.set(
      member.body.id,
      Interval.plan({
        step,
        revision: member.revision,
        seconds: props.seconds,
        rate: input.rate,
        nativeRate: input.rate * input.substeps!,
        previous: bound.contactTargets.get(member.body.id),
        initial: member.seed.initial,
        targets: fit.targets[member.body.id]!,
      }),
    );
  bound.coupling!.record([fit.report]);
}
type Body = IAutoMoviePhysicalSimulationInput.IBody;

type Target = IAutoMoviePhysicalSimulationInput.ITarget;
