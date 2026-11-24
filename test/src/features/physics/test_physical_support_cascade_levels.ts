import {
  AutoMovieXpbdCollider,
  AutoMovieXpbdWorld,
  solveXpbdArticulationContacts,
  solveXpbdContacts,
  solveXpbdSupportCascade,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * The support cascade ranks the posture as motion below the wrench, and keeps
 * every level feasible when the holds are not.
 *
 * Scenarios:
 *
 * 1. One held normal row carries the impulse of two actuated axes, `lambda = tau_a
 *    + tau_b`, and the task asks 5 N s of it: the wrench fixes only the sum. A
 *    motion row asking the joint rate `tau_a - tau_b` to be 1 is met exactly
 *    within that freedom, `tau_a = 3`, `tau_b = 2`, the torques coming out of
 *    the solve (Herzog et al. 2016; TSID's `TaskJointPosture`).
 * 2. The same hold needing 10 N s more than the axes' caps of 2 N s each can give
 *    has no feasible point: the cascade does not give up but keeps the hold as
 *    nearly as it can, both axes at their caps and the floor pulling nothing
 *    (hierarchical least squares, Escande, Mansard and Wieber 2014).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each program and its solution in closed form.
 * @evidence contracts/development/testing.md#behavioral-verification Solves `solveXpbdSupportCascade` programs and reads the impulses it returns.
 * @evidence contracts/development/testing.md#independent-expectations `tau_a + tau_b = 5` with `tau_a - tau_b = 1`, and the hold's least residual at the caps, solved by hand.
 * @evidence contracts/development/testing.md#distinguishing-cases A posture tracking the motors' impulses leaves the split to them and misses scenario 1's rate; a strict cascade returns null in scenario 2 and hands the tree to a solve without its task.
 * @evidence contracts/development/testing.md#execution-ownership Pure arithmetic in memory; no native world, viewer or file host.
 */
export function test_physical_support_cascade_levels(): void {
  const findings: string[] = [];

  // 1. The posture's rate is met within the wrench's freedom.
  const free: number[] | null = solveXpbdSupportCascade(program(0, 100));
  if (free === null) findings.push("a feasible program has no solution");
  else if (
    !(Math.abs(free[0]! - 5) < 1e-6) ||
    !(Math.abs(free[3]! - 3) < 1e-6) ||
    !(Math.abs(free[4]! - 2) < 1e-6)
  )
    findings.push(
      `the motion row splits the hold as ${free[3]} and ${free[4]} for ${free[0]}`,
    );

  // 2. An unmeetable hold is kept as nearly as the caps allow.
  const held: number[] | null = solveXpbdSupportCascade(program(10, 2));
  if (held === null) findings.push("an unmeetable hold has no solution");
  else if (
    !(Math.abs(held[0]!) < 1e-4) ||
    !(Math.abs(held[3]! - 2) < 1e-4) ||
    !(Math.abs(held[4]! - 2) < 1e-4)
  )
    findings.push(
      `an unmeetable hold gives normal ${held[0]} and axes ${held[3]}, ${held[4]}`,
    );

  TestValidator.equals("support cascade levels", findings, []);
}

/**
 * One patch: a normal row whose velocity two axes' impulses take back one for
 * one, short of rest by `gap`, and its two tangential rows; the task asks the
 * normal for 5 N s and the motion asks `tau_a - tau_b = 1`.
 */
function program(gap: number, cap: number): solveXpbdSupportCascade.IInput {
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const world: AutoMovieXpbdWorld = new AutoMovieXpbdWorld(origin);
  const floor: AutoMovieXpbdCollider = world.createCollider(
    world.createBody(false, {
      position: origin,
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    }),
    {
      id: "floor",
      material: "floor",
      kind: "box",
      halfExtents: { x: 1, y: 0.1, z: 1 },
      transform: { position: origin, rotation: { x: 0, y: 0, z: 0, w: 1 } },
    },
    1,
    0,
    false,
  );
  const contact: solveXpbdContacts.IContact = {
    a: floor,
    b: floor,
    pair: 0,
    normal: { x: 0, y: 1, z: 0 },
    localA: origin,
    localB: origin,
    friction: 1,
    restitution: 0,
    normalLambda: 0,
    tangentLambda: origin,
    tangentImpulse: 0,
    frictionImpulse: origin,
    approach: 0,
    separation: 0,
    detected: 0,
    velocityImpulse: 0,
  };
  const row = (
    direction: IAutoMovieVector3,
    lower?: number,
  ): solveXpbdArticulationContacts.IRow => ({
    state: 1,
    point: origin,
    direction,
    ...(lower !== undefined ? { lower } : {}),
    velocity: 0,
    contact,
  });
  return {
    k: [
      [1, 0, 0, -1, -1],
      [0, 1, 0, 0, 0],
      [0, 0, 1, 0, 0],
    ],
    u: [gap, 0, 0],
    columns: [
      [0, 1, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
    ],
    target: [0, 5, 0, 0, 0, 0],
    set: {
      rows: [
        row({ x: 0, y: 1, z: 0 }, 0),
        row({ x: 1, y: 0, z: 0 }),
        row({ x: 0, y: 0, z: 1 }),
      ],
      patches: [
        {
          friction: 1,
          normal: 0,
          prior: { first: 0, second: 0 },
          normals: [0],
          tangents: [1, 2],
        },
      ],
    },
    actuators: [
      { edge: 0, axis: 0, cap, reverse: cap },
      { edge: 1, axis: 0, cap, reverse: cap },
    ],
    motion: [{ weights: [0, 0, 0, 1, -1], value: 1 }],
    warm: { first: [], second: [] },
  };
}
