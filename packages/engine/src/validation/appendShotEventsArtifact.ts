import type {
  IAutoMovieConstraintViolation,
  IAutoMovieInteractionEvent,
  IAutoMovieVector3,
} from "@automovie/interface";

import { pushViolation } from "./pushViolation";
import { validateVectorArtifact } from "./validateVectorArtifact";

/**
 * The slack the shot-local event clock carries at its upper bound, matching
 * `performShot`'s own landing comparison so the two cannot disagree about an
 * event that lands exactly on the shot end.
 */
const EVENT_TIME_EPSILON: number = 1e-9;

/** Append shot-event findings using the canonical shot-local clock policy. */
export const appendShotEventsArtifact: (
  events: readonly IAutoMovieInteractionEvent[],
  path: string,
  duration: number,
  violations: IAutoMovieConstraintViolation[],
) => void = (
  events: readonly IAutoMovieInteractionEvent[],
  path: string,
  duration: number,
  violations: IAutoMovieConstraintViolation[],
): void => {
  events.forEach((event: IAutoMovieInteractionEvent, i: number): void => {
    const eventPath: string = `${path}[${i}]`;
    // The shot-local clock: `playbackEvents` maps this onto the output timeline,
    // so a time outside the shot lands somewhere no entry plays. The upper bound
    // carries the SAME slack `performShot`'s landing gate allows (it refuses a
    // hit only past `duration + 1e-9`), or a launch that lands exactly on the
    // shot end would produce a shot this validator refuses: validator/engine
    // drift in the direction #1097 warned about.
    const time: number = event.time;
    if (
      !Number.isFinite(time) ||
      time < 0 ||
      time > duration + EVENT_TIME_EPSILON
    )
      pushViolation(
        violations,
        "temporal",
        `${eventPath}.time`,
        `shot event time must be finite and within [0, ${duration}] (the shot), but was ${time}`,
        time,
      );
    // A non-finite point makes `reviewVisualRead`'s contact distance NaN, and
    // `NaN > contactRadius` is false, so a genuine miss reads as a connect.
    if (event.point !== null)
      validateVectorArtifact(
        event.point,
        `${eventPath}.point`,
        "shot event point",
        violations,
      );
    if (event.actionIndex !== null && !Number.isInteger(event.actionIndex))
      pushViolation(
        violations,
        "range",
        `${eventPath}.actionIndex`,
        `shot event actionIndex must be null or an integer, but was ${event.actionIndex}`,
        event.actionIndex,
      );

    // The hit record's optional vectors and mass (#3480) are admitted when
    // present, each finite, so a hit read by a force or a review never
    // carries a NaN; an event without them is admitted as before.
    for (const field of ["velocity", "normal", "impulse", "exit"] as const) {
      const vector: IAutoMovieVector3 | undefined = event[field];
      if (vector !== undefined)
        validateVectorArtifact(
          vector,
          `${eventPath}.${field}`,
          `shot event ${field}`,
          violations,
        );
    }
    const mass: number | undefined = event.mass;
    if (mass !== undefined && !(Number.isFinite(mass) && mass > 0))
      pushViolation(
        violations,
        "range",
        `${eventPath}.mass`,
        `shot event mass must be finite and positive, but was ${mass}`,
        mass,
      );
  });
};
