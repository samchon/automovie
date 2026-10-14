import { detectFreeFall } from "@automovie/engine";
import { IAutoMovieBody, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { validationHasNoWarnings } from "../internal/predicates";

const BODY: IAutoMovieBody = {
  mass: 1,
  centerOfMass: null,
  friction: 0.5,
  restitution: 0.5,
};
const COM: IAutoMovieVector3 = { x: 0, y: 5, z: 0 };

/**
 * Declared body, attachment, active fall and physics intent have distinct effects on gravity advice and the returned fall event.
 *
 * Scenarios:
 *
 * 1. A `body: null` object (no declared physics) never falls.
 * 2. An attached / driven body does not fall (something holds it).
 * 3. A body already on a falling trajectory is not re-warned.
 * 4. A defies-gravity intent suppresses the warning and proposed arc while retaining one fall event.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual detection for bodyless, attached, already-falling and intent-marked inputs; checks clean validation for each and the explicitly selected event/trajectory results, catching advice that ignores these policy boundaries.
 * @evidence contracts/testing.md#independent-expectations The declared detector contract excludes bodyless, attached and actively falling candidates; physics intent suppresses advice but preserves its candidate event. Expected absence/presence and count are literal policy facts rather than implementation snapshots.
 * @evidence contracts/testing.md#distinguishing-cases Keeps all four suppression reasons distinct; unsupported ordinary proposals and malformed configuration are separate entries. The attached/already-falling cases do not assert every returned field.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit owns local numerical inputs and returned reports without a physics process, renderer, asset pipeline or native artifact.
 */
export function test_validation_free_fall_suppressed(): void {
  const noBody: ReturnType<typeof detectFreeFall> = detectFreeFall({
    node: "ghost",
    body: null,
    centerOfMass: COM,
    support: [],
    attached: false,
    falling: false,
  });
  TestValidator.predicate(
    "null body never falls",
    validationHasNoWarnings("bodyless free fall", noBody.validation),
  );
  TestValidator.equals("null body has no event", noBody.events.length, 0);

  const attached: ReturnType<typeof detectFreeFall> = detectFreeFall({
    node: "sword",
    body: BODY,
    centerOfMass: COM,
    support: [],
    attached: true,
    falling: false,
  });
  TestValidator.predicate(
    "attached body never falls",
    validationHasNoWarnings("attached free fall", attached.validation),
  );
  TestValidator.equals("attached body has no arc", attached.trajectory, null);

  const falling: ReturnType<typeof detectFreeFall> = detectFreeFall({
    node: "crate",
    body: BODY,
    centerOfMass: COM,
    support: [],
    attached: false,
    falling: true,
  });
  TestValidator.predicate(
    "already-falling not re-warned",
    validationHasNoWarnings("active free fall", falling.validation),
  );

  const levitating: ReturnType<typeof detectFreeFall> = detectFreeFall({
    node: "orb",
    body: BODY,
    centerOfMass: COM,
    support: [],
    attached: false,
    falling: false,
    physicsIntent: "defies-gravity",
  });
  TestValidator.predicate(
    "intent suppresses the warning",
    validationHasNoWarnings("defies-gravity free fall", levitating.validation),
  );
  TestValidator.equals(
    "intent still surfaces the event",
    levitating.events.length,
    1,
  );
  TestValidator.equals(
    "intent suppresses the arc",
    levitating.trajectory,
    null,
  );
}
