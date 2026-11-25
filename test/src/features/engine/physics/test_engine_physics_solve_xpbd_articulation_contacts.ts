import {
  AutoMovieXpbdCollider,
  AutoMovieXpbdWorld,
  solveXpbdArticulationContacts,
  solveXpbdContacts,
  solveXpbdSupportCascade,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** How far a solved impulse may miss its closed form, N s. */
const IMPULSE: number = 1e-6;

/** How far an infeasible hold's nearest point may miss it, N s. */
const NEAREST: number = 1e-4;

/** The origin. */
const ORIGIN: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

/**
 * One floor patch at the origin, its normal row and two tangential rows, with
 * its friction and the normal the contact passes already gave.
 */
function patch(
  friction: number,
  given: number,
): solveXpbdSupportCascade.IInput["set"] {
  const world: AutoMovieXpbdWorld = new AutoMovieXpbdWorld(ORIGIN);
  const identity = { position: ORIGIN, rotation: { x: 0, y: 0, z: 0, w: 1 } };
  const floor: AutoMovieXpbdCollider = world.createCollider(
    world.createBody(false, identity),
    {
      id: "floor",
      material: "floor",
      kind: "box",
      halfExtents: { x: 1, y: 0.1, z: 1 },
      transform: identity,
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
    localA: ORIGIN,
    localB: ORIGIN,
    friction,
    restitution: 0,
    normalLambda: 0,
    tangentLambda: ORIGIN,
    tangentImpulse: 0,
    frictionImpulse: ORIGIN,
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
    point: ORIGIN,
    direction,
    ...(lower === undefined ? {} : { lower }),
    velocity: 0,
    contact,
  });
  return {
    rows: [
      row({ x: 0, y: 1, z: 0 }, -given),
      row({ x: 1, y: 0, z: 0 }),
      row({ x: 0, y: 0, z: 1 }),
    ],
    patches: [
      {
        friction,
        normal: given,
        prior: { first: 0, second: 0 },
        normals: [0],
        tangents: [1, 2],
      },
    ],
  };
}

/**
 * `solveXpbdArticulationContacts` and the support cascade it feeds
 * (`solveXpbdSupportCascade`): the room an entering foot's bound leaves, and
 * the cascade's levels, the wrench above the posture's motion, each kept
 * feasible as nearly as it can be.
 *
 * Scenarios:
 *
 * 1. A landing foot whose 3 N s impact exceeds its bound of 100 N over 1/480 s:
 *    asked 0 or 2 N s, the normal row adds nothing and never takes the impact
 *    back.
 * 2. A patch of friction 0.5 asked 8 N s normally, twice its 4 N s bound, and 10 N
 *    s tangentially gets its bound and its cone's edge, 2 N s.
 * 3. One normal row carrying two axes' impulses, `lambda = tau_a + tau_b`, asked 5
 *    N s, with a motion row asking `tau_a - tau_b = 1`: `tau_a = 3` and `tau_b
 *    = 2` (Herzog et al. 2016).
 * 4. The same hold 10 N s short of rest with caps of 2 N s: both axes at their
 *    caps and the floor pulling nothing, the nearest feasible point (Escande,
 *    Mansard and Wieber 2014).
 */
export function test_engine_physics_solve_xpbd_articulation_contacts(): void {
  // 1-2. The bound's seams, three own axes of cap 100.
  const bounded = (input: {
    given: number;
    bound: number;
    normal: number;
    tangent: number;
  }): number[] | null =>
    solveXpbdSupportCascade({
      k: [
        [1, 0, 0, -1, 0, 0],
        [0, 1, 0, 0, -1, 0],
        [0, 0, 1, 0, 0, -1],
      ],
      u: [0, 0, 0],
      columns: [
        [0, 1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0, 0],
        [0, 0, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
      ],
      target: [input.tangent, input.normal, 0, 0, 0, 0],
      set: patch(0.5, input.given),
      actuators: [0, 1, 2].map((edge: number) => ({
        edge,
        axis: 0,
        cap: 100,
        reverse: 100,
      })),
      motion: [],
      bounds: [{ rows: [0], impulse: input.bound }],
      warm: { first: [], second: [] },
    });
  const room: number = solveXpbdArticulationContacts.room({
    force: 100,
    h: 1 / 480,
    given: 3,
  });
  TestValidator.predicate(
    "an entering bound keeps the impact",
    [0, 2].every((asked: number): boolean => {
      const x = bounded({ given: 3, bound: room, normal: asked, tangent: 0 });
      return x !== null && Math.abs(x[0]!) <= IMPULSE;
    }),
  );
  const held = bounded({ given: 0, bound: 4, normal: 8, tangent: 10 });
  TestValidator.predicate(
    "a hold at its bound and its cone's edge",
    held !== null &&
      Math.abs(held[0]! - 4) <= IMPULSE &&
      Math.abs(held[1]! - 2) <= IMPULSE,
  );

  // 3-4. The levels, two axes on one normal row.
  const shared = (gap: number, cap: number): number[] | null =>
    solveXpbdSupportCascade({
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
      set: patch(1, 0),
      actuators: [0, 1].map((edge: number) => ({
        edge,
        axis: 0,
        cap,
        reverse: cap,
      })),
      motion: [{ weights: [0, 0, 0, 1, -1], value: 1 }],
      warm: { first: [], second: [] },
    });
  const free = shared(0, 100);
  TestValidator.predicate(
    "the motion within the wrench's freedom",
    free !== null &&
      Math.abs(free[0]! - 5) <= IMPULSE &&
      Math.abs(free[3]! - 3) <= IMPULSE &&
      Math.abs(free[4]! - 2) <= IMPULSE,
  );
  const capped = shared(10, 2);
  TestValidator.predicate(
    "an unmeetable hold kept as nearly as it can be",
    capped !== null &&
      Math.abs(capped[0]!) <= NEAREST &&
      Math.abs(capped[3]! - 2) <= NEAREST &&
      Math.abs(capped[4]! - 2) <= NEAREST,
  );
}
