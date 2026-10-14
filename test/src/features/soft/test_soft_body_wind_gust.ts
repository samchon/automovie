import { simulateSoftBody } from "@automovie/engine";
import {
  IAutoMovieSoftBodyDomain,
  IAutoMovieSoftBodyState,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "../internal/predicates";
import { softPanel } from "../internal/softFixtures";

/** A weightless two-particle strip pushed only by the declared draught. */
const breeze: (props: {
  direction: IAutoMovieVector3;
  acceleration: number;
  gustAcceleration: number;
  gustHz: number;
}) => IAutoMovieSoftBodyDomain = (props: {
  direction: IAutoMovieVector3;
  acceleration: number;
  gustAcceleration: number;
  gustHz: number;
}): IAutoMovieSoftBodyDomain =>
  softPanel({
    columns: 1,
    rows: 2,
    overrides: {
      id: "streamer",
      solver: {
        fixedStepSeconds: 0.015625,
        gravity: { x: 0, y: 0, z: 0 },
        drag: 0,
        iterations: 2,
        stiffness: { structural: 1, shear: 1, bend: 1 },
        referenceSpeed: 4,
        maxSteps: 256,
      },
      wind: {
        direction: props.direction,
        acceleration: props.acceleration,
        gustAcceleration: props.gustAcceleration,
        gustHz: props.gustHz,
      },
    },
  });

/** Verify the declared triangle gust through exact hand sums and direction normalization controls.
 *
 * Scenarios:
 *
 * 1. Four steps of the gust reproduce `v₄ = 5/64` and `p₄ = 15/4096` exactly, on
 *    both particles, with the transverse coordinates untouched.
 * 2. A non-unit direction is normalized rather than scaling the force: `(2,0,0)`
 *    reproduces the first particle's X velocity and X position from `(1,0,0)`.
 * 3. The gust is genuinely signed: by step 12 the draught has reversed, so the
 *    strip is slower than it was at its peak rather than monotonically faster.
 * 4. `gustHz = 0` holds the gust at its peak, so the acceleration is exactly the
 *    steady component plus the full amplitude and the motion is a plain
 *    constant-acceleration ramp.
 * 5. A panel with no declared draught does not move at all, which pins the
 *    contribution as the draught's rather than the integrator's.

 *
 * @evidence contracts/testing.md#behavioral-verification Solver coordinates and velocities catch changed phase, sign, force scaling or integration order; no wind must remain still and the later signed gust must slow the strip.
 * @evidence contracts/testing.md#independent-expectations The first four accelerations 2,1.5,1,.5 integrate to v=5/64 and displacement=15/4096; zero frequency supplies a constant acceleration sum. Dyadic fixtures pin exact local values without claiming universal cross-host floating proof.
 * @evidence contracts/testing.md#distinguishing-cases Preserve ordinary/scaled direction, signed later phase, zero gust frequency and absent wind, with untouched transverse coordinates and zero strain; arbitrary collider motion is another test's responsibility.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit discovered as test_soft_body_wind_gust; plain domain records and real solver output supply every case without a frame sampler, host process or replaced math API.
 */
export function test_soft_body_wind_gust(): void {
  const gusting: IAutoMovieSoftBodyDomain = breeze({
    direction: { x: 1, y: 0, z: 0 },
    acceleration: 0,
    gustAcceleration: 2,
    gustHz: 4,
  });
  const blown: IAutoMovieSoftBodyState = simulateSoftBody(gusting, 4);
  TestValidator.equals(
    "a triangular gust integrates to its own closed form exactly",
    namedFacts([
      [
        "velocity",
        (): boolean =>
          blown.velocities.every((value: number, index: number): boolean =>
            index % 3 === 0 ? Object.is(value, 5 / 64) : Object.is(value, 0),
          ),
      ],
      [
        "positions",
        (): boolean =>
          blown.positions.every((value: number, index: number): boolean =>
            index % 3 === 0
              ? Object.is(value, gusting.rest[index] + 15 / 4096)
              : Object.is(value, gusting.rest[index]),
          ),
      ],
      ["strain", (): boolean => Object.is(blown.maxStrain, 0)],
    ]),
    { velocity: true, positions: true, strain: true },
  );

  const scaled: IAutoMovieSoftBodyState = simulateSoftBody(
    breeze({
      direction: { x: 2, y: 0, z: 0 },
      acceleration: 0,
      gustAcceleration: 2,
      gustHz: 4,
    }),
    4,
  );
  TestValidator.equals(
    "a non-unit draught direction is normalized, not amplified",
    namedFacts([
      ["velocity", (): boolean => Object.is(scaled.velocities[0], 5 / 64)],
      [
        "position",
        (): boolean => Object.is(scaled.positions[0], blown.positions[0]),
      ],
    ]),
    { velocity: true, position: true },
  );

  TestValidator.equals(
    "the gust reverses rather than pushing forever",
    simulateSoftBody(gusting, 12).velocities[0] <
      simulateSoftBody(gusting, 4).velocities[0],
    true,
  );

  const steady: IAutoMovieSoftBodyDomain = breeze({
    direction: { x: 1, y: 0, z: 0 },
    acceleration: 1,
    gustAcceleration: 2,
    gustHz: 0,
  });
  const ramp: IAutoMovieSoftBodyState = simulateSoftBody(steady, 4);
  TestValidator.equals(
    "a zero gust frequency holds the gust at its peak",
    namedFacts([
      ["velocity", (): boolean => Object.is(ramp.velocities[0], (3 * 4) / 64)],
      [
        "position",
        (): boolean =>
          Object.is(
            ramp.positions[0],
            steady.rest[0] + (3 * (1 + 2 + 3 + 4)) / 4096,
          ),
      ],
    ]),
    { velocity: true, position: true },
  );

  const still: IAutoMovieSoftBodyState = simulateSoftBody(
    softPanel({
      columns: 1,
      rows: 2,
      overrides: {
        id: "still",
        solver: {
          fixedStepSeconds: 0.015625,
          gravity: { x: 0, y: 0, z: 0 },
          drag: 0,
          iterations: 2,
          stiffness: { structural: 1, shear: 1, bend: 1 },
          referenceSpeed: 4,
          maxSteps: 256,
        },
      },
    }),
    4,
  );
  TestValidator.equals(
    "still air moves nothing",
    still.velocities.every((value: number): boolean => Object.is(value, 0)),
    true,
  );
}
