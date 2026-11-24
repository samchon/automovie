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
 * The seams between the stance's force bounds and the support solve hold
 * their contracts: an entering foot's bound never takes back the floor's
 * impact, and every hold stays within its bound and its friction cone.
 *
 * Scenarios:
 *
 * 1. Entering: a landing foot whose impact exceeds its ramped bound keeps the
 *    impact; the bound leaves the rows no room to add, never a demand to take
 *    the impact back, so a task asking the impact or more keeps it whole.
 * 2. Holds: a patch asked twice its bound normally and more tangentially than
 *    its cone allows gets its bound, 4 N s, and its cone's edge, 2 N s.
 */
export function test_unit_engine_physics_physical_support_bound_seams(): void {
  const failures: string[] = [];

  // 1. An entering bound keeps the landing's impact.
  const h: number = 1 / 480;
  const impact: number = 3;
  const entering: number = solveXpbdArticulationContacts.room({
    force: 100,
    h,
    given: impact,
  });
  for (const asked of [0, 2]) {
    const x: number[] | null = solveXpbdSupportCascade(
      program({ given: impact, bound: entering, normal: asked, tangent: 0 }),
    );
    if (x === null) failures.push(`entering: no solution asking ${asked}`);
    else if (Math.abs(x[0]!) > 1e-6)
      failures.push(
        `entering: asking ${asked} N s more than the impact moves it by ${x[0]} N s`,
      );
  }

  // 2. A hold stays within its bound and its friction cone.
  const held: number[] | null = solveXpbdSupportCascade(
    program({ given: 0, bound: 4, normal: 8, tangent: 10 }),
  );
  if (held === null) failures.push("holds: no solution");
  else {
    if (held[0]! > 4 + 1e-6)
      failures.push(`holds: the normal ${held[0]} N s passes its 4 N s bound`);
    if (Math.abs(held[1]!) > FRICTION * held[0]! + 1e-6)
      failures.push(
        `holds: the tangent ${held[1]} N s leaves the cone of ${held[0]} N s`,
      );
    if (!(Math.abs(held[0]! - 4) < 1e-6) || !(Math.abs(held[1]! - 2) < 1e-6))
      failures.push(
        `holds: the patch gives ${held[0]} and ${held[1]} N s, not its bound and cone's edge`,
      );
  }
  TestValidator.equals("support bound seams", failures, []);
}

/** The test patch's friction coefficient. */
const FRICTION: number = 0.5;

/**
 * One patch at the origin, a normal row and two tangential rows, each held
 * by an actuated axis of its own whose cap the program never reaches; the
 * contact passes already gave `given` normally, a bound caps what the normal
 * row adds, and the task asks `normal` and `tangent` along x beyond the
 * passes.
 */
function program(input: {
  given: number;
  bound: number;
  normal: number;
  tangent: number;
}): solveXpbdSupportCascade.IInput {
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
    friction: FRICTION,
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
    set: {
      rows: [
        row({ x: 0, y: 1, z: 0 }, -input.given),
        row({ x: 1, y: 0, z: 0 }),
        row({ x: 0, y: 0, z: 1 }),
      ],
      patches: [
        {
          friction: FRICTION,
          normal: input.given,
          prior: { first: 0, second: 0 },
          normals: [0],
          tangents: [1, 2],
        },
      ],
    },
    actuators: [
      { edge: 0, axis: 0, cap: 100, reverse: 100 },
      { edge: 1, axis: 0, cap: 100, reverse: 100 },
      { edge: 2, axis: 0, cap: 100, reverse: 100 },
    ],
    motion: [],
    bounds: [{ rows: [0], impulse: input.bound }],
    warm: { first: [], second: [] },
  };
}
