import type {
  IAutoMovieConstraintViolation,
  IAutoMovieInteractionEvent,
} from "@automovie/interface";

import { pushViolation } from "./pushViolation";

/*
 * Append shot-event findings using the canonical shot-local clock policy.
 */
export function appendShotEventsArtifact(
  events: readonly IAutoMovieInteractionEvent[],
  path: string,
  duration: number,
  violations: IAutoMovieConstraintViolation[],
): void {
  events.forEach((event: IAutoMovieInteractionEvent, i: number): void => {
    const eventPath: string = `${path}[${i}]`;
    // The shot-local clock: `playbackEvents` maps this onto the output timeline,
    // so a time outside the shot lands somewhere no entry plays. The upper bound
    // carries the SAME slack `performShot`'s landing gate allows (it refuses a
    // hit only past `duration + 1e-9`), or a launch that lands exactly on the
    // shot end would produce a shot this validator refuses: validator/engine
    // drift in the direction #1097 warned about.
    const time: number = event.time;
    if (time < 0 || time > duration + EVENT_TIME_EPSILON)
      pushViolation(
        violations,
        "temporal",
        `${eventPath}.time`,
        `shot event time must be finite and within [0, ${duration}] (the shot), but was ${time}`,
        time,
      );
    // The hit record's optional mass (#3480) is admitted when present.
    const mass: number | undefined = event.mass;
    if (mass !== undefined && !(mass > 0))
      pushViolation(
        violations,
        "range",
        `${eventPath}.mass`,
        `shot event mass must be finite and positive, but was ${mass}`,
        mass,
      );
  });
}

/*
 * The slack the shot-local event clock carries at its upper bound, matching
 * `performShot`'s own landing comparison so the two cannot disagree about an
 * event that lands exactly on the shot end.
 */
const EVENT_TIME_EPSILON: number = 1e-9;
