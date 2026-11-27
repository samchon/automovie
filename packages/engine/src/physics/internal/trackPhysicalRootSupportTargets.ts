import type {
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieRigidTransform,
  IAutoMovieSamplePhysicalTarget,
} from "@automovie/interface";

import type { IAutoMovieEnginePhysicalBinding as Bound } from "../IAutoMovieEnginePhysicalBinding";
import { AutoMovieEnginePhysicalTargetInterval as Interval } from "../AutoMovieEnginePhysicalTargetInterval";
import { planPhysicalRootSupportTargets } from "./planPhysicalRootSupportTargets";

/*
 * Optional endpoint IK owns only chains disjoint from balance posture. Its
 * cached pose/twist endpoints survive native checkpoint continuation together.
 */
export function trackPhysicalRootSupportTargets(input: {
  /*
   * Admitted provider and endpoint budget.
   */ body: IAutoMoviePhysicalSimulationInput.IBody;
  /*
   * Native ownership and cached plans.
   */ bound: Bound;
  /*
   * Current declared endpoint effort.
   */ target: IAutoMoviePhysicalSimulationInput.ITarget;
  /*
   * Current motor references, updated together.
   */ goals: Record<
    string,
    IAutoMovieSamplePhysicalTarget.IResult
  >;
  /*
   * Root's actual native pose and authority.
   */ root: {
    bone: string;
    pose: IAutoMovieRigidTransform;
    dynamic: boolean;
  };
  /*
   * Coordinates already owned by balance posture.
   */ excluded: ReadonlySet<string>;
  /*
   * Enclosing cache interval.
   */ step: number;
  /*
   * Native tick time in seconds.
   */ seconds: number;
  /*
   * Declared native ticks per second.
   */ nativeRate: number;
  /*
   * Recovery-state revision, shared with preceding posture fits.
   */ revision: number;
  /*
   * Positive declared cache frequency.
   */ rate: number;
}): void {
  const { body, bound, goals }: typeof input = input;
  const policy: IAutoMoviePhysicalSimulationInput.IBody["supportTracking"] =
    body.supportTracking;
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
    const targets: Record<string, IAutoMovieRigidTransform> =
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
