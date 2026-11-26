import { projectileFirstContact, AutoMovieAir } from "@automovie/engine";
import type {
  IAutoMovieBody,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropOutcome,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanRefusal } from "@automovie/motions";
import { HumanPropOutcome } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../internal/vclose";

type Input = Parameters<typeof HumanPropOutcome.legs>[0];

/**
 * A bouncing sphere distinguishes arrival from departure, accumulates relative
 * time and settles only under inward normal gravity.
 *
 * Scenarios:
 *
 * 1. Compute the subsequent plane crossings under a constant acceleration; inspect
 *    an exactly radius-high arc and its adjacent representable velocities.
 */
function scenario_test_motions_perform_prop_outcome_continuation(): void {
  const zero = { x: 0, y: 0, z: 0 },
    up = { ...zero, y: 1 };
  const frame = { position: zero, rotation: { x: 0, y: 0, z: 0, w: 1 } };
  const prop: IAutoMovieMotionHumanProp = {
    subject: "ball",
    frame,
    points: {},
    body: { mass: 1, centerOfMass: null, friction: 0, restitution: 1 },
    shapes: [
      {
        id: "ball",
        kind: "sphere",
        radius: 0.1,
        material: "elastic",
        transform: frame,
      },
    ],
  };
  const plane = projectileFirstContact.plane("floor", zero, up);
  const meeting = (
    time: number,
    normal: IAutoMovieVector3 = up,
  ): IAutoMovieMotionHumanPropOutcome.IMeeting => ({
    collider: plane.id,
    struck: { kind: "ground" },
    hit: { time, point: zero, normal },
  });
  const base: Input = {
    prop,
    horizon: 2.25,
    meeting: meeting(0),
    projectile: { origin: zero, velocity: { ...zero, y: -1 }, gravity: zero },
    meet: () => null,
    settle: (m, p) => ({
      struck: m.struck,
      point: m.hit.point,
      normal: m.hit.normal!,
      velocity: AutoMovieAir.projectileAt(p, m.hit.time).velocity,
      offset: frame,
      outcome: "bounce",
    }),
  };
  for (const [g, count] of [
    [0, 1],
    [-2, 3],
  ] as const) {
    let queries = 0;
    const legs = HumanPropOutcome.legs({
      ...base,
      projectile: { ...base.projectile, gravity: { ...zero, y: g } },
      meet: (p, t, leave, departing) => {
        TestValidator.predicate(
          "sweep excludes only the departing contact",
          ++queries <= 3 && leave === undefined && departing === plane.id,
        );
        const hit = projectileFirstContact(
          p,
          [plane],
          { from: 0, to: base.horizon - t },
          { radius: 0, thickness: Number.MAX_VALUE, departing },
        );
        return hit === null ? null : { ...meeting(hit.time), hit };
      },
    });
    TestValidator.predicate(
      "returns at whole seconds or escapes",
      legs.length === count &&
        queries === count &&
        legs.at(-1)!.end === Infinity &&
        legs.every((leg, i) => leg.from === i),
    );
    for (const leg of legs) {
      const state = HumanPropOutcome.at(leg, leg.from + 0.5);
      TestValidator.predicate(
        "independent midpoint",
        vclose(state.position, { ...zero, y: 0.5 + g / 8 }) &&
          vclose(state.velocity, { ...zero, y: 1 + g / 2 }),
      );
    }
  }
  for (const [g, speed, normal, settles] of [
    [-5, 1 - Number.EPSILON / 2, 1, true],
    [-5, 1, 1, false],
    [-5, 1 + Number.EPSILON, 1, false],
    [-5, 0.1, -1, false],
    [0, 0.1, 1, false],
  ] as const) {
    const legs = HumanPropOutcome.legs({
      ...base,
      meeting: meeting(0, { ...zero, y: normal }),
      projectile: {
        origin: zero,
        velocity: { ...zero, y: -speed * normal },
        gravity: { ...zero, y: g },
      },
    });
    TestValidator.equals(
      "normal acceleration and strict radius cutoff",
      legs.length,
      settles ? 0 : 1,
    );
    if (!settles) {
      const state = HumanPropOutcome.at(legs[0]!, 0.5);
      TestValidator.predicate(
        "rebound from the actual face",
        vclose(state.position, { ...zero, y: (speed * normal) / 2 + g / 8 }),
      );
    }
  }
  const reads = (input: Input, axis: string): boolean => {
    try {
      HumanPropOutcome.legs(input);
      return false;
    } catch (error) {
      return error instanceof HumanRefusal && error.axis === axis;
    }
  };
  const wall = HumanPropOutcome.legs({
    ...base,
    meeting: meeting(0, { ...zero, x: 1 }),
    projectile: {
      origin: zero,
      velocity: { ...zero, x: -0.1 },
      gravity: { ...zero, y: -5 },
    },
  });
  TestValidator.predicate(
    "tangential gravity does not attach the ball to a wall",
    wall.length === 1 &&
      vclose(HumanPropOutcome.at(wall[0]!, 0.5).position, {
        x: 0.05,
        y: -0.625,
        z: 0,
      }),
  );
  let sweeps = 0;
  const across = HumanPropOutcome.legs({
    ...base,
    meeting: meeting(0.25),
    meet: () => (++sweeps === 1 ? meeting(0.5, { ...zero, y: -1 }) : null),
  });
  TestValidator.predicate(
    "relative half-second contact ends the outgoing interval at three quarters",
    across.length === 2 &&
      across[0]!.from === 0.25 &&
      across[0]!.end === 0.75 &&
      across[1]!.from === 0.75 &&
      across[1]!.end === Infinity,
  );
  for (const value of [-1, NaN]) {
    TestValidator.predicate(
      "nonnegative initial clocks",
      reads({ ...base, horizon: value }, "horizon") &&
        reads({ ...base, meeting: meeting(value) }, "contact.time"),
    );
  }
  for (const next of [0, -1, NaN, Number.MIN_VALUE]) {
    let calls = 0;
    TestValidator.predicate(
      "later contact advances in absolute time",
      reads(
        {
          ...base,
          meeting: meeting(0.25),
          meet: () => {
            if (++calls > 1) throw new Error("duplicate sweep");
            return meeting(next);
          },
        },
        "contact.time",
      ) && calls === 1,
    );
  }
  TestValidator.equals(
    "terminal contact has no visible outgoing interval",
    HumanPropOutcome.legs({ ...base, meeting: meeting(base.horizon) }),
    [],
  );
}

/**
 * A spherical prop's contact material determines its ground continuation.
 *
 * Scenarios:
 *
 * 1. Read ground outcomes for absent material, static and kinetic friction,
 *    restitution bounds and explicit rolling resistance.
 */
function scenario_test_motions_perform_prop_outcome_material(): void {
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

/**
 * A prop outcome's refusals: its continuation and its material, each scenario
 * below.
 */
export function test_motions_perform_prop_outcome(): void {
  scenario_test_motions_perform_prop_outcome_continuation();
  scenario_test_motions_perform_prop_outcome_material();
}
