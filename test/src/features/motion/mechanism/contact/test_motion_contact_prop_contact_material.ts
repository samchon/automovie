import type {
  IAutoMovieBody,
  IAutoMovieMotionHumanProp,
} from "@automovie/interface";
import { HumanRefusal } from "@automovie/motions";
import { HumanPropOutcome } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * A spherical prop's contact material determines its ground continuation.
 *
 * Scenarios:
 * 1. Read ground outcomes for absent material, static and kinetic friction, restitution bounds and explicit rolling resistance.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A spherical prop's contact material determines its ground continuation.
 * @evidence contracts/development/testing.md#independent-expectations An elastic bounce preserves the prescribed restitution; a material with zero restitution dissipates its normal speed.
 * @evidence contracts/development/testing.md#distinguishing-cases Unavailable collision geometry has no material continuation, while a supplied but invalid restitution is refused.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_contact_prop_contact_material(): void {
  const frame = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const material: IAutoMovieBody = {
    mass: 1,
    centerOfMass: null,
    friction: 0.4,
    kineticFriction: 0.1,
  };
  const prop = (
    body?: IAutoMovieBody,
    shaped = true,
  ): IAutoMovieMotionHumanProp => ({
    subject: "sphere",
    frame,
    points: {},
    body,
    shapes: shaped
      ? [
          {
            id: "sphere",
            kind: "sphere",
            radius: 0.1,
            material: "rubber",
            transform: frame,
          },
        ]
      : [],
  });
  const decision = (body?: IAutoMovieBody, shaped = true) =>
    HumanPropOutcome.decide(prop(body, shaped), { kind: "ground" });
  for (const restitution of [undefined, NaN, Infinity, -0.1, 1.1]) {
    let refused = false;
    try {
      decision({ ...material, restitution });
    } catch (error) {
      refused =
        error instanceof HumanRefusal &&
        error.axis === "restitution" &&
        error.reason.includes("sphere");
    }
    TestValidator.predicate(
      "unusable restitution is a declared physical refusal",
      refused,
    );
  }
  for (const [kinetic, expected] of [
    [0.1, 0.1],
    [undefined, 0.4],
  ] as const) {
    const bounce = decision({
      ...material,
      kineticFriction: kinetic,
      restitution: 0.6,
    });
    TestValidator.predicate(
      "bounce preserves coefficients",
      bounce?.kind === "bounce" &&
        bounce.restitution === 0.6 &&
        bounce.friction === expected,
    );
  }
  const roll = decision({ ...material, contact: { rolling: 0.02 } });
  TestValidator.predicate(
    "declared rolling resistance",
    roll?.kind === "roll" && roll.resistance === 0.02,
  );
  TestValidator.predicate(
    "dissipative contact has no outgoing leg",
    decision({ ...material, restitution: 0 }) === undefined,
  );
  TestValidator.predicate(
    "no body, friction or shape has no default bounce",
    decision() === undefined &&
      decision({ mass: 1, centerOfMass: null }) === undefined &&
      decision(material, false) === undefined,
  );
}
