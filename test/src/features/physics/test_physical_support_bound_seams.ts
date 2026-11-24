import {
  AutoMovieXpbdCollider,
  AutoMovieXpbdWorld,
  physicalBalanceUnload,
  physicalRootBounds,
  physicalStanceBalance,
  solveXpbdArticulationContacts,
  solveXpbdContacts,
  solveXpbdSupportCascade,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalRecoveryState,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalBalanceReplay } from "../internal/PhysicalBalanceReplay";

/**
 * The seams between the stance's force bounds and the support solve hold
 * their contracts: a leaving foot's bound ramps its whole force out before it
 * lifts, an entering foot's bound never takes back the floor's impact, and
 * every hold stays within its bound and its friction cone.
 *
 * Scenarios:
 *
 * 1. Leaving: from each disturbance case's first recorded request, the unload
 *    phase ramps the asked foot's bearing to zero; at every substep the total
 *    normal impulse its bound admits, the contact passes' impulse plus the
 *    rows' room (`solveXpbdArticulationContacts.room`), is at most the bound
 *    over the substep (Herzog et al. 2016, Section 5.3), so once the bearing
 *    is out the foot carries at most `RELEASE` of the weight and may lift
 *    (`physicalStanceBalance.release`).
 * 2. Entering: a landing foot whose impact exceeds its ramped bound keeps the
 *    impact; the bound leaves the rows no room to add, never a demand to take
 *    the impact back, so a task asking the impact or more keeps it whole.
 * 3. Holds: a patch asked twice its bound normally and more tangentially than
 *    its cone allows gets its bound, 4 N s, and its cone's edge, 2 N s.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each seam's contract and its source.
 * @evidence contracts/development/testing.md#behavioral-verification Runs `physicalBalanceUnload`, `physicalRootBounds`, `solveXpbdArticulationContacts.room` and `solveXpbdSupportCascade` and reads their results.
 * @evidence contracts/development/testing.md#independent-expectations The bound over the substep, `RELEASE` of the weight, the impact and the cone's mu N are the contracts' own figures, not values the code computes.
 * @evidence contracts/development/testing.md#distinguishing-cases A room clamped at zero for a leaving bound keeps the passes' impulse above the bound (scenario 1); a negative room for an entering bound takes the impact back (scenario 2); a bound or cone left out of the cascade lets the hold follow the task (scenario 3).
 * @evidence contracts/development/testing.md#execution-ownership Pure computation over the replay fixtures and in-memory programs; no native world, viewer or simulation run.
 */
export function test_physical_support_bound_seams(): void {
  const failures: string[] = [];

  // 1. A leaving bound ramps the foot's whole force out.
  const profiles: Partial<Record<string, IAutoMoviePhysicalProfile>> = {};
  for (const name of PhysicalBalanceReplay.list()) {
    const fixture: PhysicalBalanceReplay.IFixture =
      PhysicalBalanceReplay.load(name);
    const record: PhysicalBalanceReplay.IRecord | undefined =
      fixture.records.find(
        (candidate: PhysicalBalanceReplay.IRecord): boolean =>
          candidate.kind === "advance" &&
          !!candidate.input.state?.swing &&
          !!candidate.input.state?.seating?.[candidate.input.state.swing.bone],
      );
    if (!record) continue;
    const built: IAutoMoviePhysicalProfile = (profiles[fixture.subject] ??=
      PhysicalBalanceReplay.profile(fixture.subject));
    const { sense, state: start } = PhysicalBalanceReplay.sense(
      fixture,
      record,
      built,
    );
    const bone: string = start.swing!.bone;
    const given: number = sense.load(bone) * sense.dt;
    let state: IAutoMoviePhysicalRecoveryState = start;
    for (let k: number = 0; k < 1000; k++) {
      const bearing: number = state.seating![bone]!.bearing ?? 1;
      const bound: number =
        physicalRootBounds({
          force: sense.weight,
          requested: [bone],
          stance: sense.limbs.map((limb) => limb.bone),
          seating: state.seating!,
        }).find((entry) => entry.bone === bone)?.force ?? Infinity;
      const total: number =
        given +
        solveXpbdArticulationContacts.room({
          force: bound,
          h: sense.dt,
          given,
        });
      if (total > bound * sense.dt + 1e-12) {
        failures.push(
          `${fixture.case}: at bearing ${bearing.toFixed(3)} the leaving bound admits ${(total / sense.dt).toFixed(1)} N over its ${bound.toFixed(1)} N`,
        );
        break;
      }
      if (bearing <= 0) {
        if (total > physicalStanceBalance.RELEASE * sense.weight * sense.dt)
          failures.push(
            `${fixture.case}: the bearing is out but ${(total / sense.dt).toFixed(1)} N remain`,
          );
        break;
      }
      state = physicalBalanceUnload({ state, sense });
    }
  }

  // 2. An entering bound keeps the landing's impact.
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

  // 3. A hold stays within its bound and its friction cone.
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
