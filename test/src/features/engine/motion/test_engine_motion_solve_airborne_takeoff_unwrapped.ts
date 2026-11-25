import {
  Quaternion,
  integrateAirborneRotation,
  resolveAutoMovieCenterOfMass,
  solveAirborneTakeoff,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieSolveAirborneTakeoff,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { airborneHumanLayout } from "../../internal/airborneHumanLayout";
import type { IHumanFixture } from "../../internal/fixtures/IHumanFixture";
import { humanFixture } from "../../internal/fixtures/humanFixture";

/** One degree, in radians. */
const DEGREE: number = Math.PI / 180;

/** The mirror relation holds to a thousandth of the size of the effect. */
const MIRROR: number = 1e-3;

/**
 * `solveAirborneTakeoff.unwrapped` reads a flight's attitude as a somersault, a
 * tilt and a twist, each unwrapped over the flight.
 *
 * Scenarios, on the stored average man in a layout (arms lowered to the sides)
 * doing a pure somersault of momentum (50, 0, 0) over one second:
 *
 * 1. Raising one arm 60 degrees sideways by a minimum-jerk profile over [0.1, 0.4]
 *    s produces a tilt and a twist of more than a degree each.
 * 2. Raising the other arm instead gives the mirrored tilt and twist, equal and
 *    opposite within a thousandth of their size, and the same somersault: the
 *    metamorphic relation of a sagittally symmetric body (Yeadon 1993 Part III,
 *    twist from asymmetric arm action).
 */
export async function test_engine_motion_solve_airborne_takeoff_unwrapped(): Promise<void> {
  const person: IHumanFixture = await humanFixture("m-average");
  const model: IAutoMovieResolveCenterOfMass.IModel =
    resolveAutoMovieCenterOfMass(person.skeleton, person.profile);
  const layout: (
    left: number,
    right: number,
  ) => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    airborneHumanLayout(person);
  const attitude: (
    side: "left" | "right",
  ) => IAutoMovieSolveAirborneTakeoff.IAngles = (
    side: "left" | "right",
  ): IAutoMovieSolveAirborneTakeoff.IAngles =>
    solveAirborneTakeoff.unwrapped(
      integrateAirborneRotation({
        history: integrateAirborneRotation.history(
          model,
          (
            t: number,
          ): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
            const u: number = Math.max(0, Math.min(1, (t - 0.1) / 0.3));
            const up: number = 60 * (10 * u ** 3 - 15 * u ** 4 + 6 * u ** 5);
            return side === "left" ? layout(up, 0) : layout(0, up);
          },
        ),
        t0: 0,
        t1: 1,
        q0: Quaternion.identity(),
        momentum: { x: 50, y: 0, z: 0 },
      }),
      Quaternion.identity(),
    );
  const left: IAutoMovieSolveAirborneTakeoff.IAngles = attitude("left");
  const right: IAutoMovieSolveAirborneTakeoff.IAngles = attitude("right");
  TestValidator.predicate(
    "one raised arm tilts and twists",
    Math.abs(left.tilt) > DEGREE && Math.abs(left.twist) > DEGREE,
  );
  TestValidator.predicate(
    "the other arm mirrors it",
    Math.abs(left.tilt + right.tilt) <= MIRROR * Math.abs(left.tilt) &&
      Math.abs(left.twist + right.twist) <= MIRROR * Math.abs(left.twist) &&
      Math.abs(left.somersault - right.somersault) <=
        MIRROR * Math.abs(left.somersault),
  );
}
