import { DEFAULT_HUMANOID_ROM } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieVector3,
} from "@automovie/interface";
import { GymnasticsPalmRise } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `GymnasticsPalmRise` lifts a laid palm's heel off its support where the
 * forearm stands steeper than the wrist's extension range allows, less a 5
 * degree margin: the palm turns about its knuckle line by the excess, up to
 * the fingers' proximal range, and those joints extend by the same so the
 * fingers stay flat (the thumb's tip joint as far as its range allows). The
 * ranges are the default humanoid ROM's.
 *
 * The palm lies at the origin, fingers along +Z, its knuckles 8 cm ahead.
 *
 * Scenarios:
 *
 * 1. A forearm standing straight up extends the wrist 90 degrees: the rise is
 *    `min(knuckle range, 90 - (wrist range - 5))` and the fingers extend by it.
 * 2. A forearm lying back along the support extends it none: no rise.
 * 3. A goal with no hand rotation is left as it is.
 */
export function test_unit_motions_sport_gymnastics_palm_rise(): void {
  const wrist: number = -DEFAULT_HUMANOID_ROM.leftHand!.flexion!.min;
  const range: number = -DEFAULT_HUMANOID_ROM.leftIndexProximal!.flexion!.min;
  const thumb: number = -DEFAULT_HUMANOID_ROM.leftThumbDistal!.flexion!.min;
  const goal: IAutoMovieHumanLimbGoal = {
    point: { x: 0, y: 0, z: 0 },
    bend: { x: 0, y: 0.3, z: -0.2 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const rise = (
    shoulder: IAutoMovieVector3,
  ): GymnasticsPalmRise.IRise =>
    GymnasticsPalmRise(
      "left",
      goal,
      shoulder,
      { x: 0, y: 0, z: 0.08 },
      { x: 0, y: 0, z: 1 },
    );
  const expected: number = Math.min(range, Math.max(0, 90 - (wrist - 5)));
  const up: GymnasticsPalmRise.IRise = rise({ x: 0, y: 0.6, z: 0 });
  TestValidator.predicate(
    "the steep forearm's rise",
    expected > 0 &&
      nclose(up.joints.leftIndexProximal![0], -expected, 1e-9) &&
      nclose(up.joints.leftLittleProximal![0], -expected, 1e-9) &&
      nclose(up.joints.leftThumbDistal![0], -Math.min(expected, thumb), 1e-9),
  );
  TestValidator.equals(
    "no rise, and no rotation",
    [
      rise({ x: 0, y: 0, z: -0.6 }),
      GymnasticsPalmRise(
        "left",
        { ...goal, rotation: undefined },
        { x: 0, y: 0.6, z: 0 },
        { x: 0, y: 0, z: 0.08 },
        { x: 0, y: 0, z: 1 },
      ),
    ],
    [
      { goal, joints: {} },
      { goal: { ...goal, rotation: undefined }, joints: {} },
    ],
  );
}
