import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieHumanPostureRotation,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import { jumpAirborneTurning } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** A declared flight. */
type Flight = NonNullable<jumpAirborneTurning.ITurning["declared"]["flight"]>;

/** Rounding of a quaternion's angle, degrees. */
const ROUNDING: number = 1e-9;

/**
 * `jumpAirborneTurning` declares a jump's flight rotation to the performance,
 * which solves the airborne turn from the momentum and hands it back, and then
 * settles the attitude the flight lands on over the ground phase.
 *
 * Scenarios, a flight from 0.4 s to 1 s of a 1.6 s plan settling at 1.3 s:
 *
 * 1. A jump that turns neither way declares no flight.
 * 2. 2¼ twists declare the flight over its shares, 0.25 to 0.625, as turns: no
 *    somersault and the 2¼ twists.
 * 3. A backward somersault declares its turns negative; a sideways one turns its
 *    frame a quarter about the vertical.
 * 4. Handed a flight that ends turned 30 degrees about the vertical, the landing
 *    starts from that turn just after touchdown and has settled it away by 1.3
 *    s.
 */
export function test_unit_motions_actions_jump_airborne_turning(): void {
  // 1. No turn.
  TestValidator.equals(
    "no flight",
    jumpAirborneTurning(undefined, 0.4, 1, 1.6, 1.3).declared,
    {},
  );

  // 2. Twists.
  const twisting: jumpAirborneTurning.ITurning = jumpAirborneTurning(
    { twist: 2.25 },
    0.4,
    1,
    1.6,
    1.3,
  );
  const flight: Flight = twisting.declared.flight!;
  TestValidator.predicate(
    "the twisting flight",
    nclose(flight.from, 0.25, ROUNDING) &&
      nclose(flight.to, 0.625, ROUNDING) &&
      flight.momentum.kind === "turns" &&
      flight.momentum.somersault === 0 &&
      flight.momentum.twist === 2.25,
  );

  // 3. Somersaults.
  const back: Flight = jumpAirborneTurning(
    { somersault: 1, way: "backward" },
    0.4,
    1,
    1.6,
    1.3,
  ).declared.flight!;
  const aside: Flight = jumpAirborneTurning(
    { somersault: 1, way: "left" },
    0.4,
    1,
    1.6,
    1.3,
  ).declared.flight!;
  TestValidator.predicate(
    "the somersaults",
    back.momentum.kind === "turns" &&
      back.momentum.somersault === -1 &&
      aside.momentum.kind === "turns" &&
      aside.momentum.frame !== undefined &&
      nclose(
        Quaternion.angle(
          aside.momentum.frame,
          Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
        ),
        0,
        ROUNDING,
      ),
  );

  // 4. The landing's settle.
  const turned: IAutoMovieHumanPostureRotation = {
    about: { x: 0, y: 1, z: 0 },
    turn: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 30),
  };
  twisting.declared.airborne!((): IAutoMovieHumanPostureRotation => turned);
  const still: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0.9, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  const just: IAutoMovieMotionHumanPosture = twisting.landed(still, 1 + 1e-6);
  TestValidator.predicate(
    "the landing starts turned",
    just.rotation !== undefined &&
      Math.abs(Quaternion.angle(just.rotation.turn, turned.turn)) < 1e-3,
  );
  TestValidator.predicate(
    "and settles it away",
    twisting.landed(still, 1.3) === still,
  );
}
