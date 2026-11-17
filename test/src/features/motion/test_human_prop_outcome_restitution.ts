import type { IAutoMovieMotionHumanProp, IAutoMovieBody } from "@automovie/interface";

import { HumanPropOutcome, HumanRefusal } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * A physical continuation distinguishes an unknown rebound coefficient from explicit inelastic rest.
 *
 * Scenarios:
 * 1. A body with friction and a spherical collider refuses a potential
 *    rebound when restitution is unknown, naming the prop and coefficient.
 *    Nonfinite and outside-interval authored ratios also refuse.
 * 2. Explicit zero rests, while 0.6 bounces with kinetic friction 0.1;
 *    removing the kinetic declaration uses static friction 0.4.
 * 3. Explicit embedding, passage through a person and ground rolling retain
 *    their own declared data without inventing a rebound coefficient.
 * 4. No body, absent friction and no supported collider retain the existing
 *    absence of a rebound capability rather than demanding invented data.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the maintained outcome decision used by HumanPropFlight and checks its returned policy or structured refusal; it catches unknown-as-zero, invalid ratios entering a bounce, coefficient replacement and changed embed/pass/roll precedence.
 * @evidence contracts/development/testing.md#independent-expectations This analytic fixture explicitly authors 0.6 restitution, 0.4 static and 0.1 kinetic friction, 0.03 m embedding, 0.2 passage loss and 0.02 rolling resistance. Expectations preserve those independent inputs and the declared outcome precedence, without claiming a calibrated material experiment or integrated flight.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers unknown/zero/positive/NaN/infinite/outside coefficients, kinetic versus static, ground versus person, embedding versus passage, explicit rolling and missing body/friction/shape. Existing engine projectile tests own integration and rebound trajectories; this test owns decision admission.
 * @evidence contracts/development/testing.md#execution-ownership One synchronous portable test entry builds a single analytic collider and body records in memory and calls the real outcome owner, without a Human build, renderer, compiler or host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists four numbered scenarios, authored fixture units and the boundary between policy admission and integrated physical verification.
 */
export function test_human_prop_outcome_restitution(): void {
  const findings: string[] = [];

  /** One analytic sphere supplies a radius without constructing a Human. */
  const prop: (body?: IAutoMovieBody, shaped?: boolean) => IAutoMovieMotionHumanProp = (
    body?: IAutoMovieBody,
    shaped: boolean = true,
  ): IAutoMovieMotionHumanProp => ({
    subject: "analytic sphere",
    frame: {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
    points: {},
    body,
    shapes: shaped
      ? [
          {
            id: "sphere",
            kind: "sphere",
            radius: 0.1,
            material: "authored fixture",
            transform: {
              position: { x: 0, y: 0, z: 0 },
              rotation: { x: 0, y: 0, z: 0, w: 1 },
            },
          },
        ]
      : [],
  });
  const body: IAutoMovieBody = {
    mass: 1,
    centerOfMass: null,
    friction: 0.4,
    kineticFriction: 0.1,
  };
  for (const restitution of [undefined, NaN, Infinity, -0.1, 1.1]) {
    try {
      HumanPropOutcome.decide(prop({ ...body, restitution }), {
        kind: "ground",
      });
      findings.push(
        `coefficient ${restitution}: physical rebound was admitted`,
      );
    } catch (error) {
      if (
        !(error instanceof HumanRefusal) ||
        error.axis !== "restitution" ||
        !error.reason.includes("analytic sphere")
      )
        findings.push(
          `coefficient ${restitution}: wrong refusal ${String(error)}`,
        );
    }
  }
  if (
    HumanPropOutcome.decide(prop({ ...body, restitution: 0 }), {
      kind: "ground",
    }) !== undefined
  )
    findings.push("explicit inelastic zero did not rest");
  const bounce: ReturnType<typeof HumanPropOutcome.decide> =
    HumanPropOutcome.decide(prop({ ...body, restitution: 0.6 }), {
      kind: "ground",
    });
  if (
    bounce?.kind !== "bounce" ||
    !nclose(bounce.restitution, 0.6, 0) ||
    !nclose(bounce.friction, 0.1, 0)
  )
    findings.push(
      "bounce replaced the authored restitution or kinetic friction",
    );
  const fallback: ReturnType<typeof HumanPropOutcome.decide> =
    HumanPropOutcome.decide(
      prop({
        mass: 1,
        centerOfMass: null,
        friction: 0.4,
        restitution: 0.6,
      }),
      { kind: "ground" },
    );
  if (fallback?.kind !== "bounce" || !nclose(fallback.friction, 0.4, 0))
    findings.push(
      "an absent kinetic coefficient did not use the declared static one",
    );
  const embedded: ReturnType<typeof HumanPropOutcome.decide> =
    HumanPropOutcome.decide(
      prop({
        ...body,
        contact: { embed: 0.03, passLoss: 0.2 },
      }),
      { kind: "person", subject: "target", bone: "hips" },
    );
  const passed: ReturnType<typeof HumanPropOutcome.decide> =
    HumanPropOutcome.decide(
      prop({
        ...body,
        contact: { passLoss: 0.2 },
      }),
      { kind: "person", subject: "target", bone: "hips" },
    );
  const rolled: ReturnType<typeof HumanPropOutcome.decide> =
    HumanPropOutcome.decide(
      prop({
        ...body,
        contact: { rolling: 0.02 },
      }),
      { kind: "ground" },
    );
  if (
    embedded?.kind !== "stick" ||
    !nclose(embedded.depth, 0.03, 0) ||
    passed?.kind !== "pass" ||
    !nclose(passed.loss, 0.2, 0) ||
    rolled?.kind !== "roll" ||
    !nclose(rolled.resistance, 0.02, 0)
  )
    findings.push(
      "explicit embedding, passage or ground roll required an unrelated coefficient",
    );
  if (
    HumanPropOutcome.decide(prop(), { kind: "ground" }) !== undefined ||
    HumanPropOutcome.decide(prop({ mass: 1, centerOfMass: null }), {
      kind: "ground",
    }) !== undefined ||
    HumanPropOutcome.decide(prop(body, false), { kind: "ground" }) !== undefined
  )
    findings.push(
      "a missing rebound capability acquired an invented continuation",
    );
  TestValidator.equals(
    "rebound admission preserves explicit contact decisions",
    findings,
    [],
  );
}
