import { DEFAULT_HUMANOID_ROM } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { GymnasticsPalmRise } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** The scenarios of `test_unit_motions_sport_gymnastics_palm_rise`. */
namespace ScenarioGymnasticsPalmRise {
  /**
   * `GymnasticsPalmRise` lifts a laid palm's heel off its support where the
   * forearm stands steeper than the wrist's extension range allows, less a 5
   * degree margin: the palm turns about its knuckle line by the excess, up to the
   * fingers' proximal range, and those joints extend by the same so the fingers
   * stay flat (the thumb's tip joint as far as its range allows). The ranges are
   * the default humanoid ROM's.
   *
   * The palm lies at the origin, fingers along +Z, its knuckles 8 cm ahead.
   *
   * Scenarios:
   *
   * 1. A forearm standing straight up extends the wrist 90 degrees: the rise is
   *    `min(knuckle range, 90 - (wrist range - 5))` and the fingers extend by
   *    it.
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
    const rise = (shoulder: IAutoMovieVector3): GymnasticsPalmRise.IRise =>
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
}

/** The scenarios of `test_unit_motions_sport_gymnastics_palm_rise_knuckle`. */
namespace ScenarioGymnasticsPalmRiseKnuckle {
  /**
   * `GymnasticsPalmRise.knuckle` is the middle knuckle's offset from the wrist in
   * the hand's own frame.
   *
   * Scenarios:
   *
   * 1. An unturned hand at (1, 1, 0) with its knuckle at (1, 1, 0.08) has the
   *    knuckle 8 cm along its +Z.
   * 2. The same hand turned a quarter about +Y, its knuckle 8 cm along world +X,
   *    still has it 8 cm along its own +Z.
   */
  export function test_unit_motions_sport_gymnastics_palm_rise_knuckle(): void {
    const bone = (
      worldPosition: IAutoMovieResolvedBone["worldPosition"],
      worldRotation: IAutoMovieResolvedBone["worldRotation"],
    ): IAutoMovieResolvedBone => ({
      bone: "leftHand",
      localRotation: worldRotation,
      worldPosition,
      worldRotation,
    });
    const level: IAutoMovieResolvedBone["worldRotation"] = {
      x: 0,
      y: 0,
      z: 0,
      w: 1,
    };
    const quarter: IAutoMovieResolvedBone["worldRotation"] = {
      x: 0,
      y: Math.SQRT1_2,
      z: 0,
      w: Math.SQRT1_2,
    };
    TestValidator.predicate(
      "in the hand's frame",
      vclose(
        GymnasticsPalmRise.knuckle(
          bone({ x: 1, y: 1, z: 0 }, level),
          bone({ x: 1, y: 1, z: 0.08 }, level),
        ),
        { x: 0, y: 0, z: 0.08 },
        1e-12,
      ) &&
        vclose(
          GymnasticsPalmRise.knuckle(
            bone({ x: 1, y: 1, z: 0 }, quarter),
            bone({ x: 1.08, y: 1, z: 0 }, quarter),
          ),
          { x: 0, y: 0, z: 0.08 },
          1e-12,
        ),
    );
  }
}

/**
 * The `gymnastics_palm` family's own logic, one scenario group per namespace
 * above: each group's scenarios are documented on it.
 */
export function test_unit_motions_sport_gymnastics_palm(): void {
  ScenarioGymnasticsPalmRise.test_unit_motions_sport_gymnastics_palm_rise();
  ScenarioGymnasticsPalmRiseKnuckle.test_unit_motions_sport_gymnastics_palm_rise_knuckle();
}
