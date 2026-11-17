import type {
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropOutcome,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanPropOutcome } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../internal/vclose";

/** The maintained continuation seam's callback and clock types. */
type Input = Parameters<typeof HumanPropOutcome.legs>[0];

/**
 * A low rebound settles only when gravity accelerates it back toward the surface.
 *
 * Scenarios:
 * 1. A 0.1 m/s rebound over an upward-facing surface under 9.80665 m/s²
 *    downward gravity rises only 0.000509858 m, below the declared 0.1 m
 *    radius, so the existing radius-based policy settles it.
 * 2. The same low rebound from a ceiling falls away from it: after 0.5 s
 *    its y is 8.72416875 m and velocity -5.003325 m/s, rather than attaching
 *    to the ceiling through an absolute-value normal acceleration.
 * 3. Tangential gravity beside a vertical wall and zero gravity over a
 *    surface likewise retain their actual departing flights.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls actual continuation planning and its public leg reader on supplied analytic contacts, distinguishing bounded floor settlement from ceiling, wall and zero-gravity departure. A sign-lost gravity projection, artificial attachment or changed flight vector fails.
 * @evidence contracts/development/testing.md#independent-expectations With outward normal n, normal acceleration is g dot n. The maximum u²/(2*(-g dot n)) exists only for inward acceleration; nonnegative normal acceleration cannot return a positive outgoing normal velocity. Literal expected positions and velocities use p=p0+v*t+g*t²/2 and v=v0+g*t at t=0.5, with unit authored restitution and zero friction. Shared finite-aware vclose uses its existing 1e-6 tolerance. This verifies the settlement law after a supplied contact, not collider geometry or empirical materials.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts inward, outward, tangential and absent gravity on the same small-radius policy; the nearby clock test owns malformed contact clocks and engine departure queries, and engine projectile tests own collision geometry and integration.
 * @evidence contracts/development/testing.md#execution-ownership One portable synchronous entry supplies in-memory body/contact vectors and an explicit no-further-contact callback; it constructs no Human and starts no host or compiler.
 * @evidence contracts/development/common.md#meaningful-documentation Lists three scenarios, the signed normal-gravity premise, independent SI values, unchanged radius settlement policy and scope of the analytic contact fixture.
 */
export function test_human_prop_outcome_normal_gravity(): void {
  const findings: string[] = [];
  const prop: IAutoMovieMotionHumanProp = {
    subject: "normal-gravity sphere",
    frame: {
      position: { x: 0, y: 10, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
    points: {},
    body: { mass: 1, centerOfMass: null, friction: 0, restitution: 1 },
    shapes: [
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
    ],
  };
  const down: IAutoMovieVector3 = { x: 0, y: -9.80665, z: 0 };
  const rows: readonly [
    string,
    IAutoMovieVector3,
    IAutoMovieVector3,
    IAutoMovieVector3,
    IAutoMovieVector3 | null,
    IAutoMovieVector3 | null,
  ][] = [
    ["floor", { x: 0, y: -0.1, z: 0 }, down, { x: 0, y: 1, z: 0 }, null, null],
    [
      "ceiling",
      { x: 0, y: 0.1, z: 0 },
      down,
      { x: 0, y: -1, z: 0 },
      { x: 0, y: 8.72416875, z: 0 },
      { x: 0, y: -5.003325, z: 0 },
    ],
    [
      "wall",
      { x: -0.1, y: 0, z: 0 },
      down,
      { x: 1, y: 0, z: 0 },
      { x: 0.05, y: 8.77416875, z: 0 },
      { x: 0.1, y: -4.903325, z: 0 },
    ],
    [
      "zero gravity",
      { x: 0, y: -0.1, z: 0 },
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: 10.05, z: 0 },
      { x: 0, y: 0.1, z: 0 },
    ],
  ];
  for (const [name, velocity, gravity, normal, position, exit] of rows) {
    let sweeps: number = 0;
    const input: Input = {
      prop,
      projectile: { origin: prop.frame.position, velocity, gravity },
      meeting: {
        hit: { time: 0, point: prop.frame.position, normal },
        collider: name,
        struck: { kind: "prop", subject: name },
      },
      horizon: 0.5,
      meet: (): null => {
        sweeps++;
        return null;
      },
      settle: (): ReturnType<Input["settle"]> => {
        throw new Error("an absent later contact cannot settle");
      },
    };
    try {
      const legs: IAutoMovieMotionHumanPropOutcome.ILeg[] =
        HumanPropOutcome.legs(input);
      if (position === null || exit === null) {
        if (legs.length !== 0 || sweeps !== 0)
          findings.push(`${name}: bounded small rebound did not settle`);
      } else if (legs.length !== 1 || sweeps !== 1 || legs[0]?.end !== Infinity)
        findings.push(`${name}: a departing flight was falsely attached`);
      else {
        const state: ReturnType<typeof HumanPropOutcome.at> =
          HumanPropOutcome.at(legs[0]!, 0.5);
        if (!vclose(state.position, position) || !vclose(state.velocity, exit))
          findings.push(
            `${name}: departing flight disagrees with independent kinematics`,
          );
      }
    } catch (error) {
      findings.push(`${name}: unexpected refusal ${String(error)}`);
    }
  }
  TestValidator.equals(
    "normal gravity retains its direction in rebound settlement",
    findings,
    [],
  );
}
