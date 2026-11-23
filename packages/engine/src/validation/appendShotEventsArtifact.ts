import { IAutoMovieConstraintViolation } from "@automovie/interface";

import { pushViolation } from "./pushViolation";
import { validateArrayArtifact } from "./validateArrayArtifact";
import { validateNonEmptyId } from "./validateNonEmptyId";
import { validateObjectArtifact } from "./validateObjectArtifact";
import { validateVectorArtifact } from "./validateVectorArtifact";

/** The closed event-kind union, gated the way the engine's compilers emit it. */
const EVENT_KINDS: Set<string> = new Set([
  "contact",
  "hit",
  "grab",
  "release",
  "attach",
  "detach",
  "fall",
]);

/**
 * The slack the shot-local event clock carries at its upper bound, matching
 * `performShot`'s own landing comparison so the two cannot disagree about an
 * event that lands exactly on the shot end.
 */
const EVENT_TIME_EPSILON: number = 1e-9;

/** The closed event-source union. */
const EVENT_SOURCES: Set<string> = new Set([
  "collisionSolver",
  "scriptedCue",
  "sampledProximity",
  "impactOutput",
]);

/**
 * Append structural shot-event findings using the canonical shot-local clock policy.
 */
export const appendShotEventsArtifact: (
  events: unknown,
  path: string,
  duration: number,
  violations: IAutoMovieConstraintViolation[],
) => void = (
  events: unknown,
  path: string,
  duration: number,
  violations: IAutoMovieConstraintViolation[],
): void => {
  if (!validateArrayArtifact(events, path, "shot events", violations)) return;
  for (let i: number = 0, iLimit: number = events.length; i < iLimit; ++i) {
    const event: unknown = events[i];
    const eventPath: string = `${path}[${i}]`;
    if (!validateObjectArtifact(event, eventPath, "shot event", violations))
      continue;
    validateNonEmptyId(
      event.id,
      `${eventPath}.id`,
      "shot event id",
      violations,
    );
    if (typeof event.kind !== "string" || !EVENT_KINDS.has(event.kind))
      pushViolation(
        violations,
        "type",
        `${eventPath}.kind`,
        `shot event kind must be one of ${[...EVENT_KINDS].join(", ")}, but was "${String(event.kind)}"`,
        event.kind,
      );
    if (typeof event.source !== "string" || !EVENT_SOURCES.has(event.source))
      pushViolation(
        violations,
        "type",
        `${eventPath}.source`,
        `shot event source must be one of ${[...EVENT_SOURCES].join(", ")}, but was "${String(event.source)}"`,
        event.source,
      );
    // The shot-local clock: `playbackEvents` maps this onto the output timeline,
    // so a time outside the shot lands somewhere no entry plays. The upper bound
    // carries the SAME slack `performShot`'s landing gate allows (it refuses a
    // hit only past `duration + 1e-9`), or a launch that lands exactly on the
    // shot end would produce a shot this validator refuses: validator/engine
    // drift in the direction #1097 warned about.
    const time: unknown = event.time;
    if (
      typeof time !== "number" ||
      !Number.isFinite(time) ||
      time < 0 ||
      time > duration + EVENT_TIME_EPSILON
    )
      pushViolation(
        violations,
        "temporal",
        `${eventPath}.time`,
        `shot event time must be finite and within [0, ${duration}] (the shot), but was ${String(time)}`,
        time,
      );
    for (const field of ["actor", "target", "object", "reaction"] as const)
      if (event[field] !== null)
        validateNonEmptyId(
          event[field],
          `${eventPath}.${field}`,
          `shot event ${field}`,
          violations,
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
        `shot event actionIndex must be null or an integer, but was ${String(event.actionIndex)}`,
        event.actionIndex,
      );

    // The hit record's optional vectors and mass (#3480) are admitted when
    // present, each finite, so a hit read by a force or a review never
    // carries a NaN; an event without them is admitted as before.
    for (const field of ["velocity", "normal", "impulse", "exit"] as const) {
      const vector: unknown = event[field];
      if (vector !== undefined)
        validateVectorArtifact(
          vector,
          `${eventPath}.${field}`,
          `shot event ${field}`,
          violations,
        );
    }
    const mass: unknown = event.mass;
    if (
      mass !== undefined &&
      !(typeof mass === "number" && Number.isFinite(mass) && mass > 0)
    )
      pushViolation(
        violations,
        "range",
        `${eventPath}.mass`,
        `shot event mass must be finite and positive, but was ${String(mass)}`,
        mass,
      );
  }
};
