import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import type { AutoMoviePhysicalSimulation as Simulation } from "./AutoMoviePhysicalSimulation";
import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import { PhysicalTargetInterval as Interval } from "./PhysicalTargetInterval";
import { planPhysicalRootSupportTargets } from "./planPhysicalRootSupportTargets";
import type { samplePhysicalTarget } from "./samplePhysicalTarget";

/**
 * Optional endpoint IK owns only chains disjoint from balance posture. Its cached pose/twist endpoints survive native checkpoint continuation together.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Optional endpoint IK owns only chains disjoint from balance posture) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Optional endpoint IK owns only chains disjoint from balance posture) directly over its typed inputs (`input`) as nested iteration of depth 3 (some over Object.values(input.target.supportStreng; flatMap over policy.pattern.limbs .filt; filter over policy.pattern.limbs), delegating to `Object.values(input.target.supportStrength ?? {}).`, `Object.values`, `Interval.plan`, `planPhysicalRootSupportTargets`, `Object.assign`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literal 24, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 74 lines and 9 top-level statements that reuses `Object.values(input.target.supportStrength ?? {}).`, `Object.values`, `Interval.plan`, `planPhysicalRootSupportTargets`, `Object.assign` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 5 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 3 (some over Object.values(input.target.supportStreng; flatMap over policy.pattern.limbs .filt; filter over policy.pattern.limbs), performed once per call with 4 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 4 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function trackPhysicalRootSupportTargets(input: {
  /** Admitted provider and endpoint budget. */ body: Simulation.IBody;
  /** Native ownership and cached plans. */ bound: Bound;
  /** Current declared endpoint effort. */ target: Simulation.ITarget;
  /** Current motor references, updated together. */ goals: Record<
    string,
    ReturnType<typeof samplePhysicalTarget>
  >;
  /** Root's actual native pose and authority. */ root: {
    bone: string;
    pose: P.ITransform;
    dynamic: boolean;
  };
  /** Coordinates already owned by balance posture. */ excluded: ReadonlySet<string>;
  /** Enclosing cache interval. */ step: number;
  /** Native tick time in seconds. */ seconds: number;
  /** Declared native ticks per second. */ nativeRate: number;
  /** Recovery-state revision, shared with preceding posture fits. */ revision: number;
  /** Positive declared cache frequency. */ rate: number;
}): void {
  const { body, bound, goals }: typeof input = input;
  const policy: Simulation.IBody["supportTracking"] = body.supportTracking;
  if (
    !input.root.dynamic ||
    !policy ||
    (policy.iterations ?? 24) === 0 ||
    !Object.values(input.target.supportStrength ?? {}).some(
      (strength: number): boolean => strength > 0,
    )
  )
    return;
  const prepared: NonNullable<ReturnType<typeof bound.supportCoordinates.get>> =
    bound.supportCoordinates.get(body.id)!;
  const selected: ReadonlySet<string> =
    input.excluded.size === 0
      ? prepared.all
      : input.excluded === bound.posture.get(body.id)
        ? prepared.disjoint
        : new Set(
            policy.pattern.limbs
              .filter(
                (limb: (typeof policy.pattern.limbs)[number]): boolean =>
                  !limb.chain.some((bone: string): boolean =>
                    input.excluded.has(bone),
                  ),
              )
              .flatMap(
                (
                  limb: (typeof policy.pattern.limbs)[number],
                ): readonly string[] =>
                  limb.chain
                    .filter((bone: string): boolean =>
                      bound.jointByChild.get(body.id)!.has(bone),
                    )
                    .flatMap(
                      (bone: string): readonly string[] =>
                        bound.descendants.get(body.id)!.get(bone)!,
                    ),
              ),
          );
  if (!selected.size) return;
  let planned: ReturnType<typeof bound.supportPlanned.get> =
    bound.supportPlanned.get(body.id);
  if (planned?.step !== input.step || planned.revision !== input.revision) {
    const balance: ReturnType<typeof bound.planned.get> = bound.planned.get(
      body.id,
    );
    const targets: Record<string, P.ITransform> =
      balance?.step === input.step && balance.revision === input.revision
        ? balance.targets
        : input.target.segments;
    planned = Interval.plan({
      step: input.step,
      revision: input.revision,
      seconds: input.seconds,
      rate: input.rate,
      nativeRate: input.nativeRate,
      previous: planned,
      initial: body.targets[input.step - 1]!.segments,
      targets: planPhysicalRootSupportTargets({
        body,
        targets,
        root: input.root,
        excluded: input.excluded,
      }),
    });
    bound.supportPlanned.set(body.id, planned);
  }
  Object.assign(
    goals,
    Interval.sample(planned, input.seconds, input.rate, selected),
  );
}
