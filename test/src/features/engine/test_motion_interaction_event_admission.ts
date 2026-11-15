import { appendShotEventsArtifact } from "@automovie/engine";
import type {
  IAutoMovieConstraintViolation,
  IAutoMovieInteractionEvent,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * The shot artifact admits the hit record's new fields (#3480) when they are
 * finite, and refuses them when they are not, without changing the
 * admission of records that carry none.
 *
 * Scenarios:
 * 1. A record without the new fields is admitted with no violation.
 * 2. The same record with velocity, normal, impulse, exit, mass, bone,
 *    region and outcome, all finite, is admitted with no violation.
 * 3. A non-finite velocity is refused at `.velocity`.
 * 4. A non-finite exit is refused at `.exit`.
 * 5. A mass of zero is refused at `.mass`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the artifact admission on five records; a gate that refuses the plain record, admits a NaN or a zero mass fails.
 * @evidence contracts/development/testing.md#independent-expectations Finite and positive are #3480's admission rule.
 * @evidence contracts/development/testing.md#distinguishing-cases With and without the fields; three kinds of bad value.
 * @evidence contracts/development/testing.md#execution-ownership Calls the admission directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the five numbered scenarios.
 */
export function test_motion_interaction_event_admission(): void {
  const plain: IAutoMovieInteractionEvent = {
    id: "hit:a:b:1",
    kind: "hit",
    source: "collisionSolver",
    time: 1,
    actor: "a",
    target: "b",
    object: null,
    point: { x: 0, y: 1, z: 0 },
    actionIndex: 0,
    reaction: null,
  };
  const full: IAutoMovieInteractionEvent = {
    ...plain,
    velocity: { x: 0, y: 0, z: 9 },
    normal: { x: 0, y: 0, z: -1 },
    impulse: { x: 0, y: 0, z: 2 },
    exit: { x: 0, y: 0, z: 0 },
    mass: 0.4,
    bone: "chest",
    region: "sternum",
    outcome: "stick",
  };
  const check = (event: IAutoMovieInteractionEvent): IAutoMovieConstraintViolation[] => {
    const violations: IAutoMovieConstraintViolation[] = [];
    appendShotEventsArtifact([event], "events", 2, violations);
    return violations;
  };
  TestValidator.equals("a plain record is admitted", check(plain).length, 0);
  TestValidator.equals("a full finite record is admitted", check(full).length, 0);
  TestValidator.predicate(
    "a non-finite velocity is refused",
    check({ ...full, velocity: { x: NaN, y: 0, z: 0 } }).some((v) => v.path.includes(".velocity")),
  );
  TestValidator.predicate(
    "a non-finite exit is refused",
    check({ ...full, exit: { x: 0, y: Infinity, z: 0 } }).some((v) => v.path.includes(".exit")),
  );
  TestValidator.predicate(
    "a zero mass is refused",
    check({ ...full, mass: 0 }).some((v) => v.path.includes(".mass")),
  );
}
