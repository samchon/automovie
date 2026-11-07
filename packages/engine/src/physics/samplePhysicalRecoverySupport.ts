import type { IAutoMovieVector3 } from "@automovie/interface";

import type { advancePhysicalBalance } from "./advancePhysicalBalance";

/** Replay a support's actual controller ownership and accepted goal adjustment at one second. Completed future landings cannot alter an earlier sample; authored handoffs end endpoint ownership while retaining the independently adopted body displacement. */
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
