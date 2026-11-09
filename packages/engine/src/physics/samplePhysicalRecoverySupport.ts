import type { IAutoMovieVector3 } from "@automovie/interface";

import type { advancePhysicalBalance } from "./advancePhysicalBalance";

/**
 * Replay a support's actual controller ownership and accepted goal adjustment at one second. Completed future landings cannot alter an earlier sample; authored handoffs end endpoint ownership while retaining the independently adopted body displacement.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Replay a support's actual controller ownership and accepted goal adjustment at one second) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Replay a support's actual controller ownership and accepted goal adjustment at one second) directly over its typed inputs (`state`, `bone`, `seconds`) as 4 sequential passes (filter over state?.landings; find over [...landings] .reverse(); some over state?.handoffs), delegating to `landings.at`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 45 lines and 6 top-level statements that reuses `landings.at` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `state`, `bone`, `seconds`; the dominant cost is 4 sequential passes (filter over state?.landings; find over [...landings] .reverse(); some over state?.handoffs), performed once per call with 6 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 6 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function samplePhysicalRecoverySupport(
  state: advancePhysicalBalance.IState | undefined,
  bone: string,
  seconds: number,
): { active: boolean; offset: IAutoMovieVector3 } {
  const landings: NonNullable<advancePhysicalBalance.IState["landings"]> =
    state?.landings?.filter(
      (
        landing: NonNullable<advancePhysicalBalance.IState["landings"]>[number],
      ): boolean => landing.seconds <= seconds,
    ) ?? [];
  const root: IAutoMovieVector3 = landings.at(-1)?.rootOffset ?? {
    x: 0,
    y: 0,
    z: 0,
  };
  const last: (typeof landings)[number] | undefined = [...landings]
    .reverse()
    .find(
      (landing: (typeof landings)[number]): boolean => landing.bone === bone,
    );
  const handed: boolean =
    state?.handoffs?.some(
      (
        handoff: NonNullable<advancePhysicalBalance.IState["handoffs"]>[number],
      ): boolean =>
        handoff.bone === bone &&
        handoff.seconds <= seconds &&
        handoff.seconds >= (last?.seconds ?? -Infinity),
    ) ?? false;
  const step: NonNullable<typeof state>["steps"][number] | undefined =
    state &&
    [...state.steps]
      .reverse()
      .find(
        (candidate: NonNullable<typeof state>["steps"][number]): boolean =>
          candidate.bone === bone && candidate.start <= seconds,
      );
  return {
    active:
      !!step &&
      seconds <
        (step.resolved?.seconds ??
          (state?.swing?.bone === bone && state.swing.start === step.start
            ? Infinity
            : step.end)),
    offset: { ...(!handed && last?.offset ? last.offset : root) },
  };
}
