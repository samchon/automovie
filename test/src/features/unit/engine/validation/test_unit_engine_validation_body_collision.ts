import { detectBodyCollision } from "@automovie/engine";
import type { IAutoMovieBodyCollisionResult } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { staticActor } from "../../../internal/collision";
import {
  namedFacts,
  validationHasNoWarnings,
  validationHasWarningCount,
  vclose,
} from "../../../internal/predicates";

/**
 * Inter-body collision is advisory: overlapping capsules produce
 * warning-severity feedback that still succeeds, plus contact events and a
 * suggested response when physical quantities are authored. Bodies that stay
 * apart produce nothing.
 *
 * Scenarios:
 *
 * 1. Two actors with authored 2 kg and 3 kg bodies and explicit zero restitution
 *    whose capsules overlap by 0.3m produce a warning per sampled frame, one
 *    contact event per frame, and a non-null suggested response; the envelope
 *    still succeeds (a warning does not fail).
 * 2. The first contact event has kind `contact` and names the two actors.
 * 3. A static collision transfers no momentum, so the suggested impulse is zero.
 * 4. Bodies held far apart produce no warnings, events, or response.
 */
export function test_unit_engine_validation_body_collision(): void {
  const hit: IAutoMovieBodyCollisionResult = detectBodyCollision({
    a: staticActor({
      node: "A",
      a: { x: 0, y: 0, z: 0 },
      b: { x: 1, y: 0, z: 0 },
      radius: 0.2,
      body: { mass: 2, centerOfMass: null, friction: 0.5, restitution: 0 },
    }),
    b: staticActor({
      node: "B",
      a: { x: 0.5, y: 0.1, z: 0 },
      b: { x: 0.5, y: 0.5, z: 0 },
      radius: 0.2,
      body: { mass: 3, centerOfMass: null, restitution: 0 },
    }),
    sampleRate: 1,
    gainDegPerImpulse: 5,
  });
  TestValidator.predicate(
    "one warning per sampled frame",
    validationHasWarningCount("sampled body collision", hit.validation, 2),
  );
  TestValidator.equals("one contact event per frame", hit.events.length, 2);
  TestValidator.equals("event is a contact", hit.events[0]?.kind, "contact");
  TestValidator.equals("event names actor A", hit.events[0]?.actor, "A");
  TestValidator.equals("event names target B", hit.events[0]?.target, "B");
  TestValidator.predicate("response suggested", hit.response !== null);
  TestValidator.equals(
    "static collision transfers no impulse",
    namedFacts([
      ["hitResponse", (): boolean => hit.response !== null],
      [
        "vcloseHitResponse",
        (): boolean =>
          hit.response !== null &&
          vclose(hit.response.impact.impulse, { x: 0, y: 0, z: 0 }),
      ],
    ]),
    { hitResponse: true, vcloseHitResponse: true },
  );

  const apart: IAutoMovieBodyCollisionResult = detectBodyCollision({
    a: staticActor({
      node: "A",
      a: { x: 0, y: 0, z: 0 },
      b: { x: 1, y: 0, z: 0 },
      radius: 0.2,
    }),
    b: staticActor({
      node: "B",
      a: { x: 0.5, y: 5, z: 0 },
      b: { x: 0.5, y: 5.5, z: 0 },
      radius: 0.2,
    }),
  });
  TestValidator.predicate(
    "apart has no warnings",
    validationHasNoWarnings("apart body collision", apart.validation),
  );
  TestValidator.equals("apart has no events", apart.events.length, 0);
  TestValidator.equals("apart has no response", apart.response, null);
}
