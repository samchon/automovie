import type {
  IAutoMoviePhysicalRecoveryState,
  IAutoMovieSamplePhysicalRecoverySupport,
  IAutoMovieVector3,
} from "@automovie/interface";

import { physicalRecoveryLimbSwing } from "./physicalRecoveryLimbSwing";

/**
 * Replay a support's actual controller ownership and accepted goal adjustment
 * at one second. Completed future landings cannot alter an earlier sample;
 * authored handoffs end endpoint ownership while retaining the independently
 * adopted body displacement.
 */
export function samplePhysicalRecoverySupport(
  state: IAutoMoviePhysicalRecoveryState | undefined,
  bone: string,
  seconds: number,
): IAutoMovieSamplePhysicalRecoverySupport.IResult {
  const landings: NonNullable<IAutoMoviePhysicalRecoveryState["landings"]> =
    state?.landings?.filter(
      (
        landing: NonNullable<
          IAutoMoviePhysicalRecoveryState["landings"]
        >[number],
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
        handoff: NonNullable<
          IAutoMoviePhysicalRecoveryState["handoffs"]
        >[number],
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
          (physicalRecoveryLimbSwing(state, bone)?.start === step.start
            ? Infinity
            : step.end)),
    offset: { ...(!handed && last?.offset ? last.offset : root) },
  };
}
