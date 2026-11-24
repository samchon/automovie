import { detectFreeFall } from "@automovie/engine";
import { IAutoMovieBody, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { validationHasNoWarnings } from "../../../internal/predicates";

const BODY: IAutoMovieBody = {
  mass: 1,
  centerOfMass: null,
  friction: 0.5,
  restitution: 0.5,
};
const COM: IAutoMovieVector3 = { x: 0, y: 5, z: 0 };

/**
 * Declared body, attachment, active fall and physics intent have distinct
 * effects on gravity advice and the returned fall event.
 *
 * Scenarios:
 *
 * 1. A `body: null` object (no declared physics) never falls.
 * 2. An attached / driven body does not fall (something holds it).
 * 3. A body already on a falling trajectory is not re-warned.
 * 4. A defies-gravity intent suppresses the warning and proposed arc while
 *    retaining one fall event.
 */
export function test_unit_engine_validation_free_fall_suppressed(): void {
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
