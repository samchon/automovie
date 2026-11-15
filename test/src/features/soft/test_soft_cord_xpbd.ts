import {
  type IAutoMovieSoftBodyObserver,
  simulateSoftBodyCore,
  softBodyBudget,
} from "@automovie/engine";
import type {
  IAutoMovieSoftBodyDomain,
  IAutoMovieSoftBodyState,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { softPanel } from "../internal/softPanel";

/** Standard gravity, m/s^2 (CGPM 1901). */
const G: number = 9.80665;

/** A straight cord of `links` segments and `length` metres along +X from the origin, its ends free. */
const cord = (
  links: number,
  length: number,
  overrides: Partial<IAutoMovieSoftBodyDomain>,
): IAutoMovieSoftBodyDomain =>
  softPanel({
    columns: 1,
    rows: links + 1,
    spacing: { u: 0, v: length / links },
    axisV: { x: 1, y: 0, z: 0 },
    overrides: {
      id: "cord",
      solver: {
        fixedStepSeconds: 1 / 240,
        gravity: { x: 0, y: -G, z: 0 },
        drag: 4,
        iterations: 16,
        stiffness: { structural: 1, shear: 1, bend: 0 },
        compliance: { structural: 0, shear: 0, bend: 1e3 },
        referenceSpeed: 4,
        maxSteps: 2_400,
      },
      ...overrides,
    },
  });

/** The sag of a hanging cord: the anchors' height less the lowest particle's. */
const sag = (state: IAutoMovieSoftBodyState, top: number): number => {
  let low: number = Infinity;
  for (let i: number = 1; i < state.positions.length; i += 3)
    low = Math.min(low, state.positions[i]!);
  return top - low;
};

/**
 * The sag of a uniform inextensible cord of length `l` hung between two
 * points `s` apart at one height: the catenary y = a cosh(x / a) with
 * l = 2 a sinh(s / 2a), sag = a (cosh(s / 2a) - 1), `a` found by bisection
 * (l / s grows monotonically as a falls).
 */
const catenary = (l: number, s: number): number => {
  let lo: number = 1e-6;
  let hi: number = 1e6;
  for (let k: number = 0; k < 200; k++) {
    const a: number = Math.sqrt(lo * hi);
    if (2 * a * Math.sinh(s / (2 * a)) > l) lo = a;
    else hi = a;
  }
  const a: number = Math.sqrt(lo * hi);
  return a * (Math.cosh(s / (2 * a)) - 1);
};

/** The least distance between two segments, by Ericson's clamped closed form (Real-Time Collision Detection, 5.1.9). */
const segments = (p: readonly number[], i: number, j: number): number => {
  const v = (k: number): number[] => [p[k * 3]!, p[k * 3 + 1]!, p[k * 3 + 2]!];
  const [a0, a1, b0, b1] = [v(i), v(i + 1), v(j), v(j + 1)];
  const d1: number[] = a1.map((x: number, k: number): number => x - a0[k]!);
  const d2: number[] = b1.map((x: number, k: number): number => x - b0[k]!);
  const r: number[] = a0.map((x: number, k: number): number => x - b0[k]!);
  const dot = (u: number[], w: number[]): number =>
    u[0]! * w[0]! + u[1]! * w[1]! + u[2]! * w[2]!;
  const a: number = dot(d1, d1);
  const e: number = dot(d2, d2);
  const f: number = dot(d2, r);
  const c: number = dot(d1, r);
  const b: number = dot(d1, d2);
  const clamp = (x: number): number => Math.max(0, Math.min(1, x));
  const denom: number = a * e - b * b;
  let s: number = denom !== 0 ? clamp((b * f - c * e) / denom) : 0;
  let t: number = (b * s + f) / e;
  if (t < 0) {
    t = 0;
    s = clamp(-c / a);
  } else if (t > 1) {
    t = 1;
    s = clamp((b - c) / a);
  }
  return Math.hypot(
    ...[0, 1, 2].map(
      (k: number): number => a0[k]! + d1[k]! * s - (b0[k]! + d2[k]! * t),
    ),
  );
};

/**
 * The compliant cord: XPBD's constraints, a cord's self-contact and
 * Coulomb friction (#3450).
 *
 * Scenarios:
 *
 * 1. An inextensible cord of 1 m hung between two anchors 0.8 m apart
 *    settles to the catenary's sag within 2 % (closed form), solved at a
 *    quarter of the cord's step so the residual stretch of its fixed sweeps
 *    (quadratic in the step) stays a small part of the bound.
 * 2. An elastic cord's settled sag is the same at 4 and at 16 sweeps within
 *    2 %, XPBD's independence of the iteration count (Macklin, Müller and
 *    Chentanez 2016, section 4).
 * 3. A coil dropped on the floor never brings two segments that share no
 *    particle closer than twice the cord's radius less the step's travel
 *    bound, at any step.
 * 4. A cord over a fixed round bar with unequal end masses holds while the
 *    ratio stays under the capstan bound exp(mu theta) (theta = pi) and
 *    slides above it.
 * 5. The observer's every step is the state an absolute seek to that step
 *    gives, to the bit, and the budget counts the cord's segment pairs.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Solves cords through the engine's core and asserts the settled sag, the iteration independence, the least segment separation at every step, the capstan threshold and the observer's agreement with seeks.
 * @evidence contracts/development/testing.md#independent-expectations The catenary's closed form, XPBD's stated property, the capsule radius with the admitted travel bound, the capstan equation and absolute replay are independent of the solver; the discrete chain's own error against the continuous catenary is under the 2 % bound for 40 links.
 * @evidence contracts/development/testing.md#distinguishing-cases Inextensible and elastic cords, 4 and 16 sweeps, a held and a sliding load ratio either side of the bound, and early and late steps.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit test of the engine's CPU solver with in-memory domains; no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the five scenarios and the behaviour each pins.
 */
export function test_soft_cord_xpbd(): void {
  const complaints: string[] = [];
  const check = (label: string, ok: boolean): void => {
    if (!ok) complaints.push(label);
  };
  // 1. The catenary. A zero-compliance chain swept a fixed number of times
  // per step keeps a residual stretch that falls with the square of the
  // step (Macklin et al. 2019, "Small steps in physics simulation", SCA):
  // at 1/240 s the 40 links stretched about 1 %, which lengthens the sag by
  // about 2 %, so the step is quartered (a sixteenth of the stretch) and the
  // steps quadrupled to settle over the same 10 s.
  const links: number = 40;
  const base: IAutoMovieSoftBodyDomain = cord(links, 1, {});
  const quarter: number = 4;
  const hung: IAutoMovieSoftBodyDomain = cord(links, 1, {
    anchors: [
      { id: "a", particle: 0, position: { x: -0.4, y: 1, z: 0 } },
      { id: "b", particle: links, position: { x: 0.4, y: 1, z: 0 } },
    ],
    solver: {
      ...base.solver,
      fixedStepSeconds: base.solver.fixedStepSeconds / quarter,
      maxSteps: base.solver.maxSteps * quarter,
    },
  });
  const settled: IAutoMovieSoftBodyState = simulateSoftBodyCore(
    hung,
    hung.solver.maxSteps,
    null,
    null,
  );
  const expected: number = catenary(1, 0.8);
  check(
    `the hung cord's sag ${sag(settled, 1).toFixed(4)} m is the catenary's ${expected.toFixed(4)} m within 2 %`,
    Math.abs(sag(settled, 1) - expected) <= 0.02 * expected,
  );

  // 2. Iteration independence of an elastic cord.
  const elastic = (iterations: number): number =>
    sag(
      simulateSoftBodyCore(
        {
          ...hung,
          solver: {
            ...hung.solver,
            iterations,
            compliance: { structural: 1e-3, shear: 0, bend: 1e3 },
          },
        },
        hung.solver.maxSteps,
        null,
        null,
      ),
      1,
    );
  const few: number = elastic(4);
  const many: number = elastic(16);
  check(
    `an elastic cord sags ${few.toFixed(4)} m at 4 sweeps and ${many.toFixed(4)} m at 16, within 2 %`,
    Math.abs(few - many) <= 0.02 * many,
  );

  // 3. A coil dropped on the floor keeps its segments apart.
  const turns: number = 60;
  const radius: number = 0.01;
  const coilRest: number[] = [];
  for (let k: number = 0; k <= turns; k++) {
    const angle: number = (k / 12) * 2 * Math.PI;
    coilRest.push(
      0.05 * Math.cos(angle),
      0.2 + k * 0.0012,
      0.05 * Math.sin(angle),
    );
  }
  const coil: IAutoMovieSoftBodyDomain = {
    ...cord(turns, 1, {}),
    id: "coil",
    rest: coilRest,
    mass: new Array(turns + 1).fill(0.01),
    colliders: [
      { kind: "plane", id: "floor", normal: { x: 0, y: 1, z: 0 }, offset: 0 },
    ],
    selfCollision: true,
    contact: { thickness: radius, friction: 0.3 },
  };
  coil.solver = { ...coil.solver, referenceSpeed: 2, maxSteps: 480 };
  let least: number = Infinity;
  const watch: IAutoMovieSoftBodyObserver = {
    step: (_step: number, positions: Float64Array): void => {
      const p: number[] = Array.from(positions);
      for (let i: number = 0; i < turns; i++)
        for (let j: number = i + 2; j < turns; j++)
          least = Math.min(least, segments(p, i, j));
    },
  };
  simulateSoftBodyCore(coil, coil.solver.maxSteps, null, null, watch);
  const travel: number =
    coil.solver.fixedStepSeconds * coil.solver.referenceSpeed;
  check(
    `the dropped coil's least segment separation ${least.toFixed(5)} m stays above ${(2 * radius - travel).toFixed(5)} m`,
    least >= 2 * radius - travel,
  );

  // 4. The capstan.
  const bar: number = 0.1;
  const half: number = 20;
  const drape: number[] = [];
  for (let k: number = 0; k <= 2 * half; k++) {
    const u: number = (k / (2 * half)) * Math.PI;
    drape.push(
      -(bar + radius) * Math.cos(u),
      (bar + radius) * Math.sin(u) + 1,
      0,
    );
  }
  const slid = (ratio: number, mu: number): number => {
    const mass: number[] = new Array(2 * half + 1).fill(0.002);
    mass[0] = 0.05 * ratio;
    mass[2 * half] = 0.05;
    const domain: IAutoMovieSoftBodyDomain = {
      ...cord(2 * half, 1, {}),
      id: "capstan",
      rest: drape,
      mass,
      colliders: [
        {
          kind: "sphere",
          id: "bar",
          center: { x: 0, y: 1, z: 0 },
          radius: bar,
        },
      ],
      contact: { thickness: radius, friction: mu },
    };
    domain.solver = { ...domain.solver, maxSteps: 480 };
    const end: IAutoMovieSoftBodyState = simulateSoftBodyCore(
      domain,
      480,
      null,
      null,
    );
    return drape[1]! - end.positions[1]!;
  };
  const mu: number = 0.3;
  const bound: number = Math.exp(mu * Math.PI);
  const held: number = slid(0.8 * bound, mu);
  const slipped: number = slid(1.5 * bound, mu);
  check(
    `under the capstan bound ${bound.toFixed(3)} the heavy end moves ${held.toFixed(4)} m, above it ${slipped.toFixed(4)} m`,
    held < radius && slipped > 10 * radius,
  );

  // 5. The observer agrees with absolute seeks, and the budget counts pairs.
  const seen: Map<number, number[]> = new Map();
  simulateSoftBodyCore(coil, 120, null, null, {
    step: (step: number, positions: Float64Array): void => {
      if (step % 40 === 0) seen.set(step, Array.from(positions));
    },
  });
  check(
    "every observed step is the absolute seek's state to the bit",
    [40, 80, 120].every((step: number): boolean => {
      const seek: number[] = simulateSoftBodyCore(
        coil,
        step,
        null,
        null,
      ).positions;
      return seek.every((v: number, i: number): boolean =>
        Object.is(v, seen.get(step)![i]),
      );
    }),
  );
  check(
    "the budget counts every pair of segments that share no particle",
    softBodyBudget(coil).worstCaseSelfContactPairs ===
      (((turns - 1) * (turns - 2)) / 2) *
        coil.solver.iterations *
        coil.solver.maxSteps,
  );
  TestValidator.equals("the compliant cord", complaints, []);
}
