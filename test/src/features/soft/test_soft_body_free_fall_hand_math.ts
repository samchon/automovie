import { simulateSoftBody } from "../../../../packages/engine/src/soft/simulateSoftBody";
import { TestValidator } from "@nestia/e2e";
import { namedFacts } from "../internal/predicates";
import { softPanel } from "../internal/softFixtures";
import { IAutoMovieSoftBodyDomain, IAutoMovieSoftBodyState } from "@automovie/interface";
/**
 * A panel with no anchor and no collider translates rigidly under gravity, so
 * every distance constraint stays exactly satisfied and the integrator is
 * observable on its own.
 *
 * Every number below is a dyadic rational, so the expectations are exact
 * equalities rather than tolerances.
 */
const freeSheet: (drag: number) => IAutoMovieSoftBodyDomain = (drag: number): IAutoMovieSoftBodyDomain =>
  softPanel({
    columns: 3,
    rows: 3,
    overrides: {
      id: "sheet",
      solver: {
        fixedStepSeconds: 0.015625,
        gravity: { x: 0, y: -8, z: 0 },
        drag,
        iterations: 3,
        stiffness: { structural: 1, shear: 1, bend: 1 },
        referenceSpeed: 4,
        maxSteps: 512,
      },
    },
  });

/** Verify free cloth translation against hand-derived fixed-clock undamped and damped recurrences.
 *
 * Scenarios:
 *
 * 1. Undamped, after 8 steps of `dt = 1/64` under `g = −8`: every velocity is
 *    exactly `−1` and every particle has fallen exactly `72/1024` metres, which
 *    is `g·dt²·n(n+1)/2`.
 * 2. The rigid fall leaves `maxStrain` at exactly zero and `contacts` at zero, so
 *    nothing was corrected or collided on the way down.
 * 3. `maxSpeed` reports exactly the analytic speed, which is the measured evidence
 *    the declared `referenceSpeed` budget is checked against.
 * 4. Damped with `dt·k = 1`, so `r = 1/2`: after 4 steps the velocity is exactly
 *    `−0.125·(1 − 2⁻⁴)` and the drop is exactly `(1/512)·(n − 1 + 2⁻ⁿ)`, the
 *    closed form of the damped sum.
 * 5. Horizontal motion never appears: gravity has no `x` or `z` component, so
 *    those coordinates stay bit-identical to the rest mesh across both runs.

 *
 * @evidence contracts/testing.md#behavioral-verification Real solver particle coordinates, velocities, maxSpeed, strain, contacts and time catch changed prediction, damping or correction ordering while permitting the same rigid dyadic trajectory.
 * @evidence contracts/testing.md#independent-expectations Semi-implicit recurrence closed forms give undamped v=-1/drop=72/1024 and damped four-step speed=.125*(1-1/16), drop=(4-1+1/16)/512. Dyadic witnesses retain exact comparisons rather than an implementation snapshot.
 * @evidence contracts/testing.md#distinguishing-cases Zero drag and r=1/2 drag distinguish the two integration branches, with every transverse coordinate unchanged and no strain/contact; collision and anchored constraints are covered elsewhere.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit discovered as test_soft_body_free_fall_hand_math; the exported test owns all asserted cases and creates no renderer, playback process or foreign-method replacement.
 */
export function test_soft_body_free_fall_hand_math(): void {
  const undamped: IAutoMovieSoftBodyDomain = freeSheet(0);
  const fallen: IAutoMovieSoftBodyState = simulateSoftBody(undamped, 8);
  const drop: number = 72 / 1024;
  TestValidator.equals(
    "an undamped free fall matches the semi-implicit Euler closed form exactly",
    namedFacts([
      [
        "velocity",
        (): boolean =>
          fallen.velocities.every((value: number, index: number): boolean =>
            index % 3 === 1 ? Object.is(value, -1) : Object.is(value, 0),
          ),
      ],
      [
        "positions",
        (): boolean =>
          fallen.positions.every((value: number, index: number): boolean =>
            index % 3 === 1
              ? Object.is(value, undamped.rest[index] - drop)
              : Object.is(value, undamped.rest[index]),
          ),
      ],
      ["strain", (): boolean => Object.is(fallen.maxStrain, 0)],
      ["contacts", (): boolean => fallen.contacts === 0],
      ["speed", (): boolean => Object.is(fallen.maxSpeed, 1)],
      ["time", (): boolean => Object.is(fallen.time, 8 / 64)],
    ]),
    {
      velocity: true,
      positions: true,
      strain: true,
      contacts: true,
      speed: true,
      time: true,
    },
  );

  const damped: IAutoMovieSoftBodyDomain = freeSheet(64);
  const settled: IAutoMovieSoftBodyState = simulateSoftBody(damped, 4);
  const dampedSpeed: number = 0.125 * (1 - 1 / 16);
  const dampedDrop: number = (4 - 1 + 1 / 16) / 512;
  TestValidator.equals(
    "implicit linear drag matches its own closed form exactly",
    namedFacts([
      ["velocity", (): boolean => Object.is(settled.velocities[1], -dampedSpeed)],
      [
        "positions",
        (): boolean =>
          settled.positions.every((value: number, index: number): boolean =>
            index % 3 === 1
              ? Object.is(value, damped.rest[index] - dampedDrop)
              : Object.is(value, damped.rest[index]),
          ),
      ],
      ["speed", (): boolean => Object.is(settled.maxSpeed, dampedSpeed)],
      [
        "slowerThanUndamped",
        (): boolean =>
          dampedDrop <
          undamped.rest[1] - simulateSoftBody(undamped, 4).positions[1],
      ],
    ]),
    {
      velocity: true,
      positions: true,
      speed: true,
      slowerThanUndamped: true,
    },
  );
}
