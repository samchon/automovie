import { detectBodyCollision, validateModel } from "@automovie/engine";
import type {
  IAutoMovieBody,
  IAutoMovieBodyCollisionResult,
  IAutoMovieCollisionActor,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createModel } from "../../../internal/fixtures";
import { hasViolation } from "../../../internal/hasViolation";
import { staticActor } from "../../../internal/staticActor";

/**
 * Unknown restitution permits construction and observation, then refuses a
 * requested collision response.
 *
 * Scenarios:
 *
 * 1. A positive-mass body with no restitution remains a valid model.
 * 2. Two overlapping declared bodies without coefficients produce both
 *    missing-coefficient errors, two observed contacts and no response.
 * 3. The same unknown bodies with physicsIntent retain their contacts and succeed
 *    without a response; separated unknown bodies also succeed.
 * 4. Null bodies on either or both sides refuse response generation at the missing
 *    body paths while retaining contacts; intent and non-contact observations
 *    need no fabricated body, mass or coefficient.
 * 5. Invalid masses and coefficients on either side produce located range findings
 *    and no response; simultaneous faults are all reported. A missing mass from
 *    an untyped payload is also refused.
 * 6. Explicit restitution endpoints zero and one on both overlapping bodies permit
 *    the physical response and preserve both geometric observations.
 */
export function test_unit_engine_validation_body_restitution_unknown(): void {
  const findings: string[] = [];
  if (
    !validateModel({
      model: {
        ...createModel(),
        body: { mass: 1, centerOfMass: null },
      },
    }).success
  )
    findings.push("unknown restitution blocked kinematic construction");

  /**
   * The physical declaration varies independently of identical capsule
   * geometry.
   */
  const actor: (
    node: string,
    y: number,
    restitution?: number,
  ) => IAutoMovieCollisionActor = (
    node: string,
    y: number,
    restitution?: number,
  ): IAutoMovieCollisionActor =>
    staticActor({
      node,
      a: { x: 0, y, z: 0 },
      b: { x: 1, y, z: 0 },
      radius: 0.2,
      body: {
        mass: 1,
        centerOfMass: null,
        ...(restitution === undefined ? {} : { restitution }),
      },
    });
  const a: IAutoMovieCollisionActor = actor("unknown A", 0);
  const b: IAutoMovieCollisionActor = actor("unknown B", 0.1);
  const requested: IAutoMovieBodyCollisionResult = detectBodyCollision({
    a,
    b,
    sampleRate: 1,
  });
  if (
    !hasViolation(requested.validation, "type", ".a.body.restitution") ||
    !hasViolation(requested.validation, "type", ".b.body.restitution") ||
    requested.response !== null ||
    requested.events.length !== 2
  )
    findings.push(
      "physical response manufactured coefficients or lost contacts/one refusal",
    );
  const suppressed: IAutoMovieBodyCollisionResult = detectBodyCollision({
    a,
    b,
    sampleRate: 1,
    physicsIntent: "authored contact",
  });
  if (
    !suppressed.validation.success ||
    suppressed.events.length !== 2 ||
    suppressed.response !== null
  )
    findings.push(
      "observational contact required an unrequested physical coefficient",
    );
  const separated: IAutoMovieBodyCollisionResult = detectBodyCollision({
    a,
    b: actor("separated", 2),
    sampleRate: 1,
  });
  if (
    !separated.validation.success ||
    separated.events.length !== 0 ||
    separated.response !== null
  )
    findings.push("a non-contact required a coefficient");
  const knownA: IAutoMovieCollisionActor = actor("declared A", 0, 0);
  const knownB: IAutoMovieCollisionActor = actor("declared B", 0.1, 0);
  for (const [missingA, missingB] of [
    [true, false],
    [false, true],
    [true, true],
  ] as const) {
    const missing: IAutoMovieBodyCollisionResult = detectBodyCollision({
      a: { ...knownA, body: missingA ? null : knownA.body },
      b: { ...knownB, body: missingB ? null : knownB.body },
      sampleRate: 1,
    });
    if (
      (missingA && !hasViolation(missing.validation, "type", ".a.body")) ||
      (missingB && !hasViolation(missing.validation, "type", ".b.body")) ||
      missing.response !== null ||
      missing.events.length !== 2
    )
      findings.push(
        `null bodies ${missingA}/${missingB}: missing body was guessed or contact lost`,
      );
  }
  const observational: IAutoMovieBodyCollisionResult = detectBodyCollision({
    a: { ...knownA, body: null },
    b: { ...knownB, body: null },
    sampleRate: 1,
    physicsIntent: "geometry only",
  });
  const noContact: IAutoMovieBodyCollisionResult = detectBodyCollision({
    a: { ...knownA, body: null },
    b: { ...actor("apart", 2), body: null },
    sampleRate: 1,
  });
  if (
    !observational.validation.success ||
    observational.response !== null ||
    observational.events.length !== 2 ||
    !noContact.validation.success ||
    noContact.response !== null ||
    noContact.events.length !== 0
  )
    findings.push(
      "geometry-only observations required fabricated physical bodies",
    );

  const invalid: readonly [string, IAutoMovieBody][] = [
    ...[0, -1].map((mass: number): [string, IAutoMovieBody] => [
      "mass",
      { mass, centerOfMass: null, restitution: 0 },
    ]),
    ...[-0.1, 1.1].map((restitution: number): [string, IAutoMovieBody] => [
      "restitution",
      { mass: 1, centerOfMass: null, restitution },
    ]),
  ];
  for (const side of ["a", "b"] as const)
    for (const [field, body] of invalid) {
      const malformed: IAutoMovieBodyCollisionResult = detectBodyCollision({
        a: side === "a" ? { ...knownA, body } : knownA,
        b: side === "b" ? { ...knownB, body } : knownB,
        sampleRate: 1,
      });
      if (
        !hasViolation(
          malformed.validation,
          "range",
          `.${side}.body.${field}`,
        ) ||
        malformed.response !== null ||
        malformed.events.length !== 2
      )
        findings.push(
          `${side}.${field}: malformed response data escaped admission`,
        );
    }
  const simultaneous: IAutoMovieBodyCollisionResult = detectBodyCollision({
    a: { ...knownA, body: { mass: 0, centerOfMass: null, restitution: -1 } },
    b: {
      ...knownB,
      body: { mass: -1, centerOfMass: null, restitution: 2 },
    },
    sampleRate: 1,
  });
  for (const side of ["a", "b"] as const)
    for (const field of ["mass", "restitution"] as const)
      if (
        !hasViolation(
          simultaneous.validation,
          "range",
          `.${side}.body.${field}`,
        )
      )
        findings.push(`${side}.${field}: simultaneous fault was suppressed`);
  for (const restitution of [0, 1]) {
    const declared: IAutoMovieBodyCollisionResult = detectBodyCollision({
      a: actor("declared A", 0, restitution),
      b: actor("declared B", 0.1, restitution),
      sampleRate: 1,
    });
    if (
      !declared.validation.success ||
      declared.response === null ||
      declared.events.length !== 2
    )
      findings.push(
        `explicit coefficient ${restitution} was mistaken for missing data`,
      );
  }
  TestValidator.equals(
    "only requested response requires authored body facts",
    findings,
    [],
  );
}
