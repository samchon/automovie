import {
  IAutoMovieBodyCollisionResult,
  IAutoMovieCollisionActor,
  detectBodyCollision,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { staticActor } from "../internal/collision";
import { hasViolation } from "../internal/predicates";

/** Two actors whose hips→spine capsules overlap at the origin. */
const overlapping: () => {
  a: IAutoMovieCollisionActor;
  b: IAutoMovieCollisionActor;
} = (): { a: IAutoMovieCollisionActor; b: IAutoMovieCollisionActor } => ({
  a: staticActor({
    node: "A",
    a: { x: 0, y: 0, z: 0 },
    b: { x: 1, y: 0, z: 0 },
    radius: 0.5,
  }),
  b: staticActor({
    node: "B",
    a: { x: 0, y: 0, z: 0 },
    b: { x: 1, y: 0, z: 0 },
    radius: 0.5,
  }),
});

const withCapsule: (
  actor: IAutoMovieCollisionActor,
  capsule: IAutoMovieCollisionActor["capsules"][number],
) => IAutoMovieCollisionActor = (
  actor: IAutoMovieCollisionActor,
  capsule: IAutoMovieCollisionActor["capsules"][number],
): IAutoMovieCollisionActor => ({ ...actor, capsules: [capsule] });

/**
 * A malformed capsule is a structural integrity error, not a physics warning:
 * an endpoint bone off the rig, two non-distinct endpoints, or a non-positive
 * radius each fail with an `error`-severity violation before any sampling
 * runs.
 *
 * This is the silent-drop the capsule validation closes: a bad-bone capsule
 * used to resolve to an undefined world position and a NaN centerline distance,
 * and `NaN < minimum` is `false`, so `detectBodyCollision` reported the two
 * clearly-overlapping bodies as a clean `success` with no warning at all. The
 * sanity block confirms the geometry overlaps when the capsule is well-formed.
 *
 * Scenarios:
 *
 * 1. Well-formed overlap succeeds and emits contact events.
 * 2. An endpoint bone absent from the rig fails with a type violation: the overlap
 *    is no longer silently dropped.
 * 3. Non-distinct endpoints fail with a type violation.
 * 4. A non-positive radius fails with a range violation.
 * 5. Both actors malformed: violations name each actor's capsule and the response is null.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises capsule admission through detectBodyCollision, checking a valid overlap's success and events, located structural failures for absent endpoints, repeated endpoints and bad radius, no events for the absent-bone run, and both actors' findings with a null response.
 * @evidence contracts/testing.md#independent-expectations Identical unit centerlines with positive radii must intersect; an absent head cannot resolve on the two-bone fixture, hips-to-hips lacks distinct endpoints, and radius -1 is outside the finite positive domain. Explicit kind/path checks distinguish structural refusal from generic failure; the sanity case does not itself assert warning severity.
 * @evidence contracts/testing.md#distinguishing-cases A valid control, three independent malformed capsule fields, and faults on both actors guard against silent overlap loss and first-actor-only admission. Detached endpoints have a separate totality test; zero/non-finite radii and multiple capsules are outside this case.
 * @evidence contracts/testing.md#execution-ownership The named test_validation_body_collision_bad_capsule entry uses portable admission and sampled collision arithmetic with shared staticActor fixtures, without a host or dynamically registered cases.
 */
export function test_validation_body_collision_bad_capsule(): void {
  // 1. sanity: the well-formed geometry overlaps, so a real warning exists.
  const clean: IAutoMovieBodyCollisionResult =
    detectBodyCollision(overlapping());
  TestValidator.equals(
    "well-formed overlap warns (success stays true, warning-only)",
    clean.validation.success,
    true,
  );
  TestValidator.predicate(
    "overlap emits a contact event",
    clean.events.length > 0,
  );

  // 2. bone off the rig: previously a silent success, now an error.
  const badBone: { a: IAutoMovieCollisionActor; b: IAutoMovieCollisionActor } =
    overlapping();
  const nan: IAutoMovieBodyCollisionResult = detectBodyCollision({
    ...badBone,
    a: withCapsule(badBone.a, { from: "head", to: "spine", radius: 0.5 }),
  });
  TestValidator.equals("bad bone fails", nan.validation.success, false);
  TestValidator.predicate(
    "type violation on the off-rig endpoint",
    hasViolation(nan.validation, "type", ".a.capsules[0].from"),
  );
  TestValidator.equals(
    "no silent overlap: malformed run emits no events",
    nan.events.length,
    0,
  );

  // 3. non-distinct endpoints.
  const same: { a: IAutoMovieCollisionActor; b: IAutoMovieCollisionActor } =
    overlapping();
  const distinct: IAutoMovieBodyCollisionResult = detectBodyCollision({
    ...same,
    a: withCapsule(same.a, { from: "hips", to: "hips", radius: 0.5 }),
  });
  TestValidator.equals(
    "non-distinct fails",
    distinct.validation.success,
    false,
  );
  TestValidator.predicate(
    "type violation on the non-distinct capsule",
    hasViolation(distinct.validation, "type", ".a.capsules[0]"),
  );

  // 4. non-positive radius.
  const badRadius: {
    a: IAutoMovieCollisionActor;
    b: IAutoMovieCollisionActor;
  } = overlapping();
  const radius: IAutoMovieBodyCollisionResult = detectBodyCollision({
    ...badRadius,
    a: withCapsule(badRadius.a, { from: "hips", to: "spine", radius: -1 }),
  });
  TestValidator.equals("bad radius fails", radius.validation.success, false);
  TestValidator.predicate(
    "range violation on the radius",
    hasViolation(radius.validation, "range", ".a.capsules[0].radius"),
  );

  // 5. both actors malformed: every fault reported, nothing sampled.
  const both: { a: IAutoMovieCollisionActor; b: IAutoMovieCollisionActor } =
    overlapping();
  const pair: IAutoMovieBodyCollisionResult = detectBodyCollision({
    ...both,
    a: withCapsule(both.a, { from: "head", to: "spine", radius: 0.5 }),
    b: withCapsule(both.b, { from: "hips", to: "hips", radius: 0.5 }),
  });
  TestValidator.equals("both malformed fails", pair.validation.success, false);
  TestValidator.predicate(
    "actor A fault reported",
    hasViolation(pair.validation, "type", ".a.capsules[0].from"),
  );
  TestValidator.predicate(
    "actor B fault reported",
    hasViolation(pair.validation, "type", ".b.capsules[0]"),
  );
  TestValidator.equals("no response when malformed", pair.response, null);
}
