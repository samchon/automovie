import { DEFAULT_HUMANOID_ROM } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCarry,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanTrunk,
  carry,
  carryPlace,
  loadedWalkPace,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

namespace part_carry_place {
  /** Rounding of a forward-kinematics chain, metres. */
  const ROUNDING: number = 1e-9;

  /**
   * `carryPlace` is a hand's hold place in the performer's floor frame: a box
   * held in both hands 0.8 of the shoulders' half width either side at the
   * waist's height, ahead by a third of the arm or just clear of the abdomen; a
   * pushed handle with the upper arm hanging and the forearm level from the
   * shoulder (Hoozemans et al. 1998); a child on the loaded hip only; nothing in
   * one hand's free hand.
   *
   * The body is built whole (`humanFixtureBody`): the shoulder and the abdomen
   * are placed by forward kinematics.
   *
   * Scenarios, the average man upright at (1, 0, 2) facing +Z:
   *
   * 1. Both hands hold the box at x = 1 +/- 0.8 shoulder half widths, the waist's
   *    height, ahead by the larger of a third of the arm and the abdomen's front
   *    plus the forearm's radius, palms facing in.
   * 2. The right hand pushes from its shoulder down the upper arm and ahead the
   *    forearm, a forearm's radius out, its palm up.
   * 3. A hip carry places only the loaded hand; one-handed carrying places none.
   */
  export async function verify(): Promise<void> {
    const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const posture: IAutoMovieMotionHumanPosture = {
      root: { x: 1, y: 0.95, z: 2 },
      yaw: 0,
      pitch: 0,
      roll: 0,
      joints: {},
      limbs: {},
    };
    const abdomen: number =
      HumanTrunk.region(body, posture, "abdomen").point.z - 2;
    const ahead: number = Math.max(
      (m.upperArm + m.forearm) / 3,
      abdomen + m.forearmRadius,
    );
    const left: IAutoMovieMotionHumanCarry.IPlaceResult = carryPlace(
      body,
      posture,
      "twoHands",
      "left",
      "left",
    );
    const right: IAutoMovieMotionHumanCarry.IPlaceResult = carryPlace(
      body,
      posture,
      "twoHands",
      "right",
      "left",
    );
    TestValidator.predicate(
      "the box",
      vclose(
        left!.point,
        { x: 1 + 0.8 * m.shoulderHalfWidth, y: m.waistHeight, z: 2 + ahead },
        ROUNDING,
      ) &&
        vclose(
          right!.point,
          { x: 1 - 0.8 * m.shoulderHalfWidth, y: m.waistHeight, z: 2 + ahead },
          ROUNDING,
        ) &&
        vclose(left!.normal, { x: -1, y: 0, z: 0 }, ROUNDING) &&
        vclose(right!.normal, { x: 1, y: 0, z: 0 }, ROUNDING),
    );
    const shoulder: IAutoMovieVector3 = HumanTrunk.resolve(body, posture).get(
      "rightUpperArm",
    )!.worldPosition;
    const pushed: IAutoMovieMotionHumanCarry.IPlaceResult = carryPlace(
      body,
      posture,
      "push",
      "right",
      "right",
    );
    TestValidator.predicate(
      "the handle",
      vclose(
        pushed!.point,
        {
          x: shoulder.x - m.forearmRadius,
          y: shoulder.y - m.upperArm,
          z: shoulder.z + m.forearm,
        },
        ROUNDING,
      ) && nclose(pushed!.normal.y, 1, ROUNDING),
    );
    TestValidator.predicate(
      "the hip and one hand",
      carryPlace(body, posture, "hip", "left", "left") !== undefined &&
        carryPlace(body, posture, "hip", "right", "left") === undefined &&
        carryPlace(body, posture, "oneHand", "left", "left") === undefined,
    );
  }
}

namespace part_carry_tilt {
  /** Rounding of a few trigonometric products, degrees and shares. */
  const ROUNDING: number = 1e-9;

  /**
   * A carry's closed forms: `carry.tilt` leans the head, arms and trunk by
   * `asin(s d / (0.678 h))` (Winter's 67.8 % head-arms-trunk mass, its centre
   * 62.6 % of the way from the hips to the shoulders) for a load of mass share
   * `s` held `d` off the hips' midline, a pushed handle by 40 degrees a share;
   * `carry.hang` abducts a loaded straight arm just enough that its wrist clears
   * the thigh; `loadedWalkPace` slows the walk linearly from a fifth of the
   * body's mass to two fifths (4.75 to 4.6 km/h, Middleton et al. 2022).
   *
   * Scenarios, shoulders 0.2 m and hips 0.09 m in half width, a 0.3 m upper arm
   * and a 0.27 m forearm, shoulders 1.45 m and hips 0.9 m up, a 0.08 m thigh and
   * a 0.04 m forearm in radius:
   *
   * 1. A tenth of the mass in one hand leans `asin(0.1 x 0.2 / (0.678 x 0.626 x
   *    0.55))`; on the hip, with 0.09 m; held ahead in both hands, a third of the
   *    arm, 0.19 m; pushed, 4 degrees.
   * 2. The hanging arm is abducted `asin(0.01 / 0.57)`, its elbow straight at its
   *    range's least flexion; shoulders 0.3 m wide hang it plumb.
   * 3. The walk keeps its pace up to a fifth of the mass, is half way down at three
   *    tenths, and holds 4.6 / 4.75 from two fifths on.
   */
  export function verify(): void {
    const measure: Pick<
      IAutoMovieMotionHumanBody["measure"],
      | "shoulderHalfWidth"
      | "hipHalfWidth"
      | "upperArm"
      | "forearm"
      | "shoulderHeight"
      | "hipHeight"
      | "thighRadius"
      | "forearmRadius"
    > = {
      shoulderHalfWidth: 0.2,
      hipHalfWidth: 0.09,
      upperArm: 0.3,
      forearm: 0.27,
      shoulderHeight: 1.45,
      hipHeight: 0.9,
      thighRadius: 0.08,
      forearmRadius: 0.04,
    };
    const body: { measure: typeof measure } = { measure };
    const lean: (offset: number) => number = (offset: number): number =>
      (Math.asin((0.1 * offset) / (0.678 * 0.626 * 0.55)) * 180) / Math.PI;
    TestValidator.predicate(
      "the lean",
      nclose(carry.tilt(body, "oneHand", 0.1), lean(0.2), ROUNDING) &&
        nclose(carry.tilt(body, "hip", 0.1), lean(0.09), ROUNDING) &&
        nclose(carry.tilt(body, "twoHands", 0.1), lean(0.19), ROUNDING) &&
        nclose(carry.tilt(body, "push", 0.1), 4, ROUNDING),
    );
    const hung: ReturnType<typeof carry.hang> = carry.hang(body, "right");
    TestValidator.predicate(
      "the hanging arm",
      nclose(
        hung.upper[1],
        (Math.asin(0.01 / 0.57) * 180) / Math.PI,
        ROUNDING,
      ) &&
        hung.lower[0] === DEFAULT_HUMANOID_ROM.rightLowerArm!.flexion!.min &&
        carry.hang({ measure: { ...measure, shoulderHalfWidth: 0.3 } }, "left")
          .upper[1] === 0,
    );
    TestValidator.predicate(
      "the pace",
      loadedWalkPace(0) === 1 &&
        loadedWalkPace(0.2) === 1 &&
        nclose(loadedWalkPace(0.3), 1 + 0.5 * (4.6 / 4.75 - 1), ROUNDING) &&
        nclose(loadedWalkPace(0.5), 4.6 / 4.75, ROUNDING),
    );
  }
}

namespace part_loaded_walk_pace {
  /** Rounding of one quotient and product, unitless. */
  const ROUNDING: number = 1e-12;

  /**
   * `loadedWalkPace` is the share of the unloaded walking speed kept under a load
   * of a share of the body's mass (Middleton et al. 2022, Table 2): unchanged to
   * a fifth, 4.6 / 4.75 at two fifths, linear between and held beyond.
   *
   * Scenarios:
   *
   * 1. No load and a fifth keep the whole speed.
   * 2. Two fifths and more keep 4.6 / 4.75.
   * 3. Three tenths, half way, keep the mean of the two.
   */
  export function verify(): void {
    const loaded: number = 4.6 / 4.75;
    TestValidator.predicate(
      "light loads",
      nclose(loadedWalkPace(0), 1, ROUNDING) &&
        nclose(loadedWalkPace(0.2), 1, ROUNDING),
    );
    TestValidator.predicate(
      "two fifths and more",
      nclose(loadedWalkPace(0.4), loaded, ROUNDING) &&
        nclose(loadedWalkPace(0.9), loaded, ROUNDING),
    );
    TestValidator.predicate(
      "half way",
      nclose(loadedWalkPace(0.3), (1 + loaded) / 2, ROUNDING),
    );
  }
}

/**
 * `carry`'s unit contract: its place, tilt and loaded pace.
 *
 * Its parts, each documented with its own scenarios:
 *
 * - `carry_place`: `carryPlace` is a hand's hold place in the performer's floor
 *   frame:
 * - `carry_tilt`: A carry's closed forms:
 * - `loaded_walk_pace`: `loadedWalkPace` is the share of the unloaded walking
 *   speed kept under a load of a share of the body's mass (Middleton et al.
 */
export async function test_unit_motions_carrying_carry(): Promise<void> {
  await part_carry_place.verify();
  part_carry_tilt.verify();
  part_loaded_walk_pace.verify();
}
