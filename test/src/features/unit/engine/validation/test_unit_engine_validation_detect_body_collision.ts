import { detectBodyCollision } from "@automovie/engine";
import type {
  IAutoMovieBodyCollisionResult,
  IAutoMovieCollisionActor,
  IAutoMovieKeyframe,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { staticActor } from "../../../internal/collision";
import {
  hasViolation,
  nclose,
  validationHasNoWarnings,
  validationHasWarningCount,
  validationHasWarnings,
  vclose,
} from "../../../internal/predicates";

/**
 * `detectBodyCollision` reports two actors' capsule overlap as advisory
 * warnings with contact events, and suggests a response from their authored
 * bodies; a malformed sample rate is an error.
 *
 * Fixture: actor A's capsule from (0,0,0) to (1,0,0) and actor B's from (0.5,
 * 0.1, 0) to (0.5, 0.5, 0), both of radius 0.2 (overlap 0.3 m), sampled at 1
 * Hz over the two-key clips (`staticActor`).
 *
 * Scenarios:
 *
 * 1. Overlap with 2 kg and 3 kg bodies (restitution 0): one warning and one
 *    `contact` event per frame (two), A naming B, the envelope still succeeds,
 *    and the static response carries a zero impulse. Held 5 m apart: nothing.
 * 2. The same overlap with `physicsIntent`: no warning, no response, the two
 *    events kept.
 * 3. Capsules meeting at a shared endpoint (no derivable normal) still warn and
 *    respond.
 * 4. Sample rate 0: failure with a range finding at `.sampleRate`.
 * 5. A 2 kg capsule rising 0.1 m in 1 s against a static 3 kg one 0.3 m above:
 *    restitutions 0.8 and 0.75 bounce with impulse 0.192 and velocities 0.004
 *    and 0.064 m/s; restitution 0 deflects with impulse 0.12 and both 0.04
 *    m/s; both keep the momentum 2 (0) + 3 (0) + 2 (0.1) = 0.2 kg m/s.
 */
export function test_unit_engine_validation_detect_body_collision(): void {
  const A = (body?: IAutoMovieCollisionActor["body"]): IAutoMovieCollisionActor =>
    staticActor({
      node: "A",
      a: { x: 0, y: 0, z: 0 },
      b: { x: 1, y: 0, z: 0 },
      radius: 0.2,
      ...(body === undefined ? {} : { body }),
    });
  const B = (
    y: number,
    body?: IAutoMovieCollisionActor["body"],
  ): IAutoMovieCollisionActor =>
    staticActor({
      node: "B",
      a: { x: 0.5, y, z: 0 },
      b: { x: 0.5, y: y + 0.4, z: 0 },
      radius: 0.2,
      ...(body === undefined ? {} : { body }),
    });

  // 1.
  const hit: IAutoMovieBodyCollisionResult = detectBodyCollision({
    a: A({ mass: 2, centerOfMass: null, friction: 0.5, restitution: 0 }),
    b: B(0.1, { mass: 3, centerOfMass: null, restitution: 0 }),
    sampleRate: 1,
    gainDegPerImpulse: 5,
  });
  TestValidator.predicate(
    "two warnings",
    validationHasWarningCount("overlap", hit.validation, 2),
  );
  TestValidator.equals(
    "events",
    hit.events.map((e) => [e.kind, e.actor, e.target]),
    [
      ["contact", "A", "B"],
      ["contact", "A", "B"],
    ],
  );
  TestValidator.predicate(
    "zero static impulse",
    hit.response !== null &&
      vclose(hit.response.impact.impulse, { x: 0, y: 0, z: 0 }),
  );
  const apart: IAutoMovieBodyCollisionResult = detectBodyCollision({
    a: A(),
    b: B(5),
  });
  TestValidator.predicate(
    "apart quiet",
    validationHasNoWarnings("apart", apart.validation) &&
      apart.events.length === 0 &&
      apart.response === null,
  );

  // 2.
  const intended: IAutoMovieBodyCollisionResult = detectBodyCollision({
    a: A({ mass: 2, centerOfMass: null, friction: 0.5, restitution: 0 }),
    b: B(0.1),
    sampleRate: 1,
    physicsIntent: "choreographed",
  });
  TestValidator.predicate(
    "intent",
    validationHasNoWarnings("intent", intended.validation) &&
      intended.response === null &&
      intended.events.length === 2,
  );

  // 3.
  const unit: IAutoMovieCollisionActor["body"] = {
    mass: 1,
    centerOfMass: null,
    restitution: 0,
  };
  const shared: IAutoMovieBodyCollisionResult = detectBodyCollision({
    a: A(unit),
    b: staticActor({
      node: "B",
      a: { x: 0, y: 0, z: 0 },
      b: { x: 0, y: 0, z: 1 },
      radius: 0.2,
      body: unit,
    }),
    sampleRate: 1,
  });
  TestValidator.predicate(
    "shared endpoint",
    validationHasWarnings("shared", shared.validation) &&
      shared.response !== null,
  );

  // 4.
  const zero: IAutoMovieBodyCollisionResult = detectBodyCollision({
    a: A(),
    b: B(5),
    sampleRate: 0,
  });
  TestValidator.predicate(
    "rate 0",
    zero.validation.success === false &&
      hasViolation(zero.validation, "range", ".sampleRate"),
  );

  // 5.
  const root = (height: number): IAutoMovieTransform => ({
    translation: { x: 0, y: height, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  });
  for (const [ra, rb, kind, impulse, va, vb] of [
    [0.8, 0.75, "bounce", 0.192, 0.004, 0.064],
    [0, 0, "deflect", 0.12, 0.04, 0.04],
  ] satisfies [number, number, string, number, number, number][]) {
    const moving: IAutoMovieCollisionActor = A({
      mass: 2,
      centerOfMass: null,
      restitution: ra,
    });
    const first: IAutoMovieKeyframe = moving.motion.keyframes[0]!;
    moving.motion = {
      ...moving.motion,
      keyframes: [
        { ...first, time: 0, pose: { ...first.pose, root: root(0) } },
        { ...first, time: 1, pose: { ...first.pose, root: root(0.1) } },
      ],
    };
    const result: IAutoMovieBodyCollisionResult = detectBodyCollision({
      a: moving,
      b: staticActor({
        node: "B",
        a: { x: 0, y: 0.3, z: 0 },
        b: { x: 1, y: 0.3, z: 0 },
        radius: 0.2,
        body: { mass: 3, centerOfMass: null, restitution: rb },
      }),
      sampleRate: 1,
    });
    const r: IAutoMovieBodyCollisionResult["response"] = result.response;
    TestValidator.predicate(
      kind,
      result.validation.success &&
        result.events.length === 2 &&
        r !== null &&
        r.impact.kind === kind &&
        vclose(r.impact.impulse, { x: 0, y: impulse, z: 0 }) &&
        vclose(r.impact.velocityA, { x: 0, y: va, z: 0 }) &&
        vclose(r.impact.velocityB, { x: 0, y: vb, z: 0 }) &&
        nclose(2 * r.impact.velocityA.y + 3 * r.impact.velocityB.y, 0.2),
    );
  }
}
