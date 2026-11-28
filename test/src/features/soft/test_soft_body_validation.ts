import { AutoMovieEngineSoftBody } from "@automovie/engine";
import {
  AutoMovieViolationKind,
  IAutoMovieSoftBodyDomain,
  IAutoMovieSoftBodyState,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { assertSoftBodyBoundaryRefusals } from "../internal/assertSoftBodyBoundaryRefusals";
import { hasViolation, namedFacts } from "../internal/predicates";
import { softPanel } from "../internal/softFixtures";

/** A valid 3×3 panel every negative below is one property away from. */
const sound: (
  overrides?: Partial<IAutoMovieSoftBodyDomain>,
) => IAutoMovieSoftBodyDomain = (
  overrides: Partial<IAutoMovieSoftBodyDomain> = {},
): IAutoMovieSoftBodyDomain =>
  softPanel({
    columns: 3,
    rows: 3,
    overrides: {
      anchors: [{ id: "hook", particle: 0, position: { x: 0, y: 0, z: 0 } }],
      states: [
        {
          id: "open",
          anchors: [{ anchor: "hook", position: { x: 0.5, y: 0, z: 0 } }],
        },
      ],
      colliders: [
        {
          kind: "plane",
          id: "floor",
          normal: { x: 0, y: 1, z: 0 },
          offset: -4,
        },
        {
          kind: "sphere",
          id: "ball",
          center: { x: 0, y: -4, z: 0 },
          radius: 0.5,
        },
        {
          kind: "box",
          id: "crate",
          min: { x: -1, y: -6, z: -1 },
          max: { x: 1, y: -5, z: 1 },
        },
      ],
      wind: {
        direction: { x: 1, y: 0, z: 0 },
        acceleration: 1,
        gustAcceleration: 1,
        gustHz: 2,
      },
      ...overrides,
    },
  });

/**
 * True when the changed domain includes a refusal of the named kind at the
 * requested path.
 */
const refuses: (
  overrides: Partial<IAutoMovieSoftBodyDomain>,
  kind: AutoMovieViolationKind,
  path: string,
) => boolean = (
  overrides: Partial<IAutoMovieSoftBodyDomain>,
  kind: AutoMovieViolationKind,
  path: string,
): boolean =>
  hasViolation(
    AutoMovieEngineSoftBody.validateSoftBodyDomain({ domain: sound(overrides) }),
    kind,
    path,
  );

/**
 * Selected soft-body authoring mistakes produce located field refusals, while a
 * complete domain and adjacent valid collider/wind cases remain accepted.
 *
 * A validator that only ever fires is as useless as one that never does, so the
 * complete panel is asserted successful first and each refusal changes the
 * relevant field or annotation group. The pass exists so the solver never has
 * to guess what an inconsistent record meant: an array of the wrong length, a
 * zero mass, two coincident rest particles with no direction between them, two
 * anchors fighting over one particle, a named state citing an anchor nobody
 * declared, or a panel that starts buried in the furniture are all refused
 * rather than quietly clamped.
 *
 * Scenarios:
 *
 * 1. The complete panel — anchors, a named state, all three collider kinds and a
 *    draught — validates clean.
 * 2. Lattice and arrays: a non-integer column count, a lattice past the particle
 *    cap, a lattice holding fewer than two particles, and rest or mass arrays
 *    of the wrong length or holding a non-positive value.
 * 3. Solver: a non-positive step, a negative drag, an iteration count outside its
 *    range, a stiffness outside `[0, 1]`, a non-positive reference speed and a
 *    step budget outside its range.
 * 4. Geometry: two coincident rest particles along a row and along a column. The
 *    refusal is what the pass is for, because a constraint between two points
 *    at the same place has no direction: solving such a panel anyway skips that
 *    constraint and stays finite rather than dividing by zero, which is a
 *    quietly wrong panel and exactly what the refusal exists to prevent.
 * 5. Anchors and states: a duplicated id, an out-of-range particle, two anchors on
 *    one particle, a state citing an unknown anchor, a state posing one anchor
 *    twice, and a budget overflow.
 * 6. Colliders: a duplicated id, a zero plane normal, a non-positive radius, an
 *    inverted box and a collider budget overflow. A panel that starts buried in
 *    a box is refused, while one clear of that box on a single axis is not: the
 *    embedding test reads all three axes rather than concluding from the first
 *    two.
 * 7. Wind: a zero direction, a negative gust amplitude and a negative gust
 *    frequency.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls validateSoftBodyDomain on a valid panel and malformed lattice, array, solver, geometry, anchor/state, collider and wind fields, checking located refusal kinds through refuses/hasViolation. Direct simulation of coincident rest particles remains finite, demonstrating why numerical survival alone does not admit that geometry.
 * @evidence contracts/development/testing.md#independent-expectations Dense three-coordinate particles, positive masses/clock, bounded solver values, unique references, nonzero edges/normals and strict box intervals supply the oracle. Literal oversized values cross the declared budgets of 16384 particles, 64 sweeps/colliders, 32 states and 100000 steps. The finding predicates require presence and location, not an exact singleton finding count or universal malformed-input totality.
 * @evidence contracts/development/common.md#meaningful-documentation A complete panel is admitted. Malformed lattice, solver, rest, state, collider and wind data exercise located refusals, including coincident edges whose direct solve stays finite.
 */
export function test_soft_body_validation(): void {
  TestValidator.equals(
    "a complete panel validates clean",
    AutoMovieEngineSoftBody.validateSoftBodyDomain({ domain: sound() }).success,
    true,
  );

  const oversized: IAutoMovieSoftBodyDomain = {
    ...sound(),
    lattice: { columns: 200, rows: 200 },
  };
  TestValidator.equals(
    "lattice and particle arrays are named",
    namedFacts([
      [
        "fractionalColumns",
        (): boolean =>
          refuses(
            { lattice: { columns: 2.5, rows: 3 } },
            "type",
            "lattice.columns",
          ),
      ],
      [
        "fractionalRows",
        (): boolean =>
          refuses({ lattice: { columns: 3, rows: 0 } }, "type", "lattice.rows"),
      ],
      [
        "tooMany",
        (): boolean =>
          hasViolation(
            AutoMovieEngineSoftBody.validateSoftBodyDomain({ domain: oversized }),
            "range",
            "$input.lattice",
          ),
      ],
      [
        "tooFew",
        (): boolean =>
          hasViolation(
            AutoMovieEngineSoftBody.validateSoftBodyDomain({
              domain: softPanel({ columns: 1, rows: 1 }),
            }),
            "range",
            "$input.lattice",
          ),
      ],
      [
        "restLength",
        (): boolean => refuses({ rest: [0, 0, 0] }, "type", "$input.rest"),
      ],
      [
        "massLength",
        (): boolean => refuses({ mass: [1] }, "type", "$input.mass"),
      ],
      [
        "massValue",
        (): boolean => {
          const mass: number[] = sound().mass.slice();
          mass[2] = 0;
          return refuses({ mass }, "range", "$input.mass[2]");
        },
      ],
    ]),
    {
      fractionalColumns: true,
      fractionalRows: true,
      tooMany: true,
      tooFew: true,
      restLength: true,
      massLength: true,
      massValue: true,
    },
  );

  const solver: (
    patch: Partial<IAutoMovieSoftBodyDomain["solver"]>,
  ) => Partial<IAutoMovieSoftBodyDomain> = (
    patch: Partial<IAutoMovieSoftBodyDomain["solver"]>,
  ): Partial<IAutoMovieSoftBodyDomain> => ({
    solver: { ...sound().solver, ...patch },
  });
  TestValidator.equals(
    "solver settings are named",
    namedFacts([
      [
        "step",
        (): boolean =>
          refuses(
            solver({ fixedStepSeconds: 0 }),
            "range",
            "solver.fixedStepSeconds",
          ),
      ],
      [
        "drag",
        (): boolean => refuses(solver({ drag: -1 }), "range", "solver.drag"),
      ],
      [
        "iterations",
        (): boolean =>
          refuses(solver({ iterations: 0 }), "type", "solver.iterations"),
      ],
      [
        "iterationBudget",
        (): boolean =>
          refuses(solver({ iterations: 65 }), "type", "solver.iterations"),
      ],
      [
        "stiffness",
        (): boolean =>
          refuses(
            solver({ stiffness: { structural: 1.5, shear: 0.5, bend: 0.25 } }),
            "range",
            "solver.stiffness.structural",
          ),
      ],
      [
        "referenceSpeed",
        (): boolean =>
          refuses(
            solver({ referenceSpeed: 0 }),
            "range",
            "solver.referenceSpeed",
          ),
      ],
      [
        "maxSteps",
        (): boolean =>
          refuses(solver({ maxSteps: 100_001 }), "type", "solver.maxSteps"),
      ],
    ]),
    {
      step: true,
      drag: true,
      iterations: true,
      iterationBudget: true,
      stiffness: true,
      referenceSpeed: true,
      maxSteps: true,
    },
  );

  const stacked: () => IAutoMovieSoftBodyDomain =
    (): IAutoMovieSoftBodyDomain => {
      const rest: number[] = sound().rest.slice();
      rest[3] = rest[0];
      rest[4] = rest[1];
      rest[5] = rest[2];
      return sound({ rest, anchors: [], states: [], colliders: [] });
    };
  TestValidator.equals(
    "coincident rest particles are named on both lattice axes",
    namedFacts([
      [
        "solvedAnyway",
        (): boolean => {
          const state: IAutoMovieSoftBodyState = AutoMovieEngineSoftBody.simulateSoftBody(stacked(), 2);
          return Object.is(state.positions[0], state.positions[3]);
        },
      ],
      [
        "row",
        (): boolean => {
          const rest: number[] = sound().rest.slice();
          rest[3] = rest[0];
          rest[4] = rest[1];
          rest[5] = rest[2];
          return refuses({ rest }, "type", "$input.rest[0]");
        },
      ],
      [
        "column",
        (): boolean => {
          const rest: number[] = sound().rest.slice();
          rest[9] = rest[0];
          rest[10] = rest[1];
          rest[11] = rest[2];
          return refuses({ rest }, "type", "$input.rest[0]");
        },
      ],
    ]),
    { solvedAnyway: true, row: true, column: true },
  );

  assertSoftBodyBoundaryRefusals(sound, refuses);
}
