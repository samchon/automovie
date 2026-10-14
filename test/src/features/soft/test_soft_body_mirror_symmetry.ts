import { simulateSoftBody } from "../../../../packages/engine/src/soft/simulateSoftBody";
import { IAutoMovieSoftBodyDomain, IAutoMovieSoftBodyState } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { namedFacts, nclose } from "../internal/predicates";
import { softPanel } from "../internal/softFixtures";
const COLUMNS: number = 5;
const ROWS: number = 4;

/**
 * A curtain whose rest mesh, masses, anchors, colliders and draught are all
 * mirror images of themselves about the plane `x = 0`.
 *
 * The odd column count puts a particle exactly on the mirror plane, which is
 * the strictest case: its own left and right corrections must cancel to exactly
 * zero rather than to an ulp.
 */
const symmetric: () => IAutoMovieSoftBodyDomain = (): IAutoMovieSoftBodyDomain =>
  softPanel({
    columns: COLUMNS,
    rows: ROWS,
    origin: { x: -0.5, y: 0, z: 0 },
    overrides: {
      id: "mirror",
      solver: {
        fixedStepSeconds: 0.015625,
        gravity: { x: 0, y: -8, z: 0 },
        drag: 0.5,
        iterations: 3,
        stiffness: { structural: 1, shear: 0.5, bend: 0.25 },
        referenceSpeed: 4,
        maxSteps: 512,
      },
      anchors: [
        { id: "hook-left", particle: 0, position: null },
        { id: "hook-right", particle: COLUMNS - 1, position: null },
      ],
      colliders: [
        {
          kind: "plane",
          id: "floor",
          normal: { x: 0, y: 2, z: 0 },
          offset: -0.78125,
        },
        {
          kind: "sphere",
          id: "bolster",
          center: { x: 0, y: -1, z: 0 },
          radius: 0.25,
        },
      ],
      wind: {
        direction: { x: 0, y: 0, z: 1 },
        acceleration: 0.5,
        gustAcceleration: 2,
        gustHz: 4,
      },
    },
  });

/** True when the two mirror partners of every particle are exact reflections. */
const reflected: (values: number[]) => boolean = (values: number[]): boolean => {
  for (let row: number = 0; row < ROWS; ++row)
    for (let column: number = 0; column < COLUMNS; ++column) {
      const here: number = (row * COLUMNS + column) * 3;
      const there: number = (row * COLUMNS + (COLUMNS - 1 - column)) * 3;
      if (!nclose(values[there], -values[here], 0)) return false;
      if (!nclose(values[there + 1], values[here + 1], 0)) return false;
      if (!nclose(values[there + 2], values[here + 2], 0)) return false;
    }
  return true;
};

/** Verify exact reflection of a symmetric cloth's positions and velocities after the preserved 128-step active solve.
 *
 * Scenarios:
 *
 * 1. After 128 steps every particle's position is the exact negation in `x`, and
 *    the exact equal in `y` and `z`, of its mirror partner's.
 * 2. The same holds for velocities, so the symmetry is a property of the state and
 *    not only of where the particles happened to land.
 * 3. The particle on the mirror plane keeps `x` exactly zero rather than a
 *    residual, which is what the two-term fold buys over a running total.
 * 4. The panel really did move and really did touch a collider, so the symmetry is
 *    being asserted about a live solve and not about an untouched rest mesh.
 * 5. Breaking the authored symmetry by one anchor breaks the reflection, which
 *    proves the check can fail.

 *
 * @evidence contracts/testing.md#behavioral-verification Mirror partners and the centre column expose changed neighbour/fold ordering; motion and contact facts prevent untouched rest from satisfying the property, while an asymmetric anchor must break it.
 * @evidence contracts/testing.md#independent-expectations Geometric reflection x->-x with equal y/z follows the authored symmetric field independently of computed trajectory values. Zero-tolerance nclose preserves exact finite numeric equality, with Object.is additionally distinguishing centre-column signed zero; this 128-step witness proves neither every duration nor cross-host bit identity.
 * @evidence contracts/testing.md#distinguishing-cases Odd-width centre particles, gravity/drag/gust, paired anchors and symmetric contacts exercise the active fold; the asymmetric-anchor control distinguishes intended preserved symmetry from a forced output mirror.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit discovered as test_soft_body_mirror_symmetry; the exported test owns both symmetric and broken-symmetry cases and installs no visual/GPU consumer.
 */
export function test_soft_body_mirror_symmetry(): void {
  const domain: IAutoMovieSoftBodyDomain = symmetric();
  const solved: IAutoMovieSoftBodyState = simulateSoftBody(domain, 128);
  TestValidator.equals(
    "a symmetric panel stays exactly symmetric",
    namedFacts([
      ["positions", (): boolean => reflected(solved.positions)],
      ["velocities", (): boolean => reflected(solved.velocities)],
      [
        "centreColumn",
        (): boolean =>
          [0, 1, 2, 3].every((row: number): boolean =>
            Object.is(solved.positions[(row * COLUMNS + 2) * 3], 0),
          ),
      ],
      ["moved", (): boolean => solved.maxSpeed > 0],
      ["touched", (): boolean => solved.contacts > 0],
    ]),
    {
      positions: true,
      velocities: true,
      centreColumn: true,
      moved: true,
      touched: true,
    },
  );

  const lopsided: IAutoMovieSoftBodyDomain = symmetric();
  lopsided.anchors[1] = {
    id: "hook-right",
    particle: COLUMNS - 1,
    position: { x: 0.25, y: 0, z: 0 },
  };
  TestValidator.equals(
    "breaking the authored symmetry breaks the reflection",
    reflected(simulateSoftBody(lopsided, 128).positions),
    false,
  );
}
