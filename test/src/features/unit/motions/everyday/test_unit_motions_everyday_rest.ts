import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRest,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanBend,
  poseBones,
  resolveHumanPosture,
  restCrossedArms,
  restElbowSupport,
  restForearm,
  restGoals,
  stand,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

namespace part_rest_forearm {
  /** Rounding of a square root and a normalization. */
  const ROUNDING: number = 1e-12;

  /**
   * `restForearm` lays a resting arm's forearm by the two-link closed form:
   * `across` is a vector's unit component across a normal, and `direction` puts
   * the elbow on the circle the upper arm `u` and forearm `l` allow about the
   * shoulder-to-wrist line `d`, `(u^2 - l^2 + d^2) / 2d` along it and the rest of
   * `u` across it toward the bend hint, and points from it to the wrist.
   *
   * Scenarios, a 0.3 m upper arm and a 0.25 m forearm from a shoulder at the
   * origin:
   *
   * 1. `across` of (1, 1, 0) about +X is +Y.
   * 2. To a wrist at (0.4, 0, 0) with the hint ahead along +Z, the elbow lies at
   *    (0.234375, 0, sqrt(0.09 - 0.234375^2)) and the forearm points from it to
   *    the wrist, its length the forearm's.
   * 3. A wrist beyond the arm's reach straightens the arm along the line.
   */
  export function run(): void {
    const p: (x: number, y: number, z: number) => IAutoMovieVector3 = (
      x: number,
      y: number,
      z: number,
    ): IAutoMovieVector3 => ({ x, y, z });
    TestValidator.predicate(
      "across",
      vclose(restForearm.across(p(1, 0, 0), p(1, 1, 0)), p(0, 1, 0), ROUNDING),
    );
    const along: number = (0.09 - 0.0625 + 0.16) / 0.8;
    const off: number = Math.sqrt(0.09 - along * along);
    TestValidator.predicate(
      "the bent forearm",
      vclose(
        restForearm.direction(0.3, 0.25, p(0, 0, 0), p(0.4, 0, 0), p(0, 0, 1)),
        p((0.4 - along) / 0.25, 0, -off / 0.25),
        ROUNDING,
      ),
    );
    TestValidator.predicate(
      "straight beyond reach",
      vclose(
        restForearm.direction(0.3, 0.25, p(0, 0, 0), p(1, 0, 0), p(0, 0, 1)),
        p(1, 0, 0),
        1e-6,
      ),
    );
  }
}

namespace part_rest_goals {
  /** Rounding of a few posed metres. */
  const ROUNDING: number = 1e-9;

  /**
   * `restGoals` sets both hands' rest goals on a standing posture.
   *
   * - Hands at the side set no goal.
   * - A pocketed hand lays its flat palm on the front pocket and an akimbo hand on
   *   the hip, raised half the waist's height over the hip joint's, each moved
   *   along the region's normal onto the posed surface; their elbows take the
   *   `tucked` and `akimbo` bends.
   * - A chin rest on both fists moves each fist off the one-fist place by its own
   *   depth on the palm side, the left one toward +X.
   * - Crossed arms are `restCrossedArms`'s goals, and a hand under the other elbow
   *   is `restElbowSupport`'s, laid against the other hand's goal.
   *
   * The body is built whole (`humanFixtureBody`): the goals read the posed
   * surfaces and colliders.
   *
   * Scenarios, the average man standing at the origin facing +Z:
   *
   * 1. Both hands at the side set no goal.
   * 2. A left pocket and a right hip: each contact lies on its region's normal line
   *    through the region's point (the hip's raised), and each elbow is its
   *    bend's.
   * 3. A left chin rest alone and with the right: the left fist moves along +X
   *    alone.
   * 4. Crossed arms equal `restCrossedArms`; a right hand under the left elbow of a
   *    left chin rest equals `restElbowSupport` on the left fist.
   */
  export async function run(): Promise<void> {
    const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const posture: IAutoMovieMotionHumanPosture = stand.posture(
      body,
      { x: 0, y: 0, z: 0 },
      0,
    );
    const goals = (
      left: IAutoMovieMotionHumanRest.Place,
      right: IAutoMovieMotionHumanRest.Place,
    ): Partial<Record<AutoMovieHumanSide, IAutoMovieMotionHumanRest.IGoal>> =>
      restGoals(body, posture, { left, right });
    TestValidator.equals("at the side", goals("side", "side"), {});
    const bones = poseBones(body, resolveHumanPosture(body, posture));
    const onNormal = (
      goal: IAutoMovieMotionHumanRest.IGoal,
      region: "pocketFrontLeft" | "hipRight",
      up: number,
    ): boolean => {
      const frame = body.surfaces.regions[region];
      const surface = resolveAutoMovieHumanoidSurfaces.pointNormal(
        frame,
        bones.get(frame.bone)!,
      );
      const off: IAutoMovieVector3 = Vector3.subtract(
        goal.point,
        Vector3.add(surface.point, { x: 0, y: up, z: 0 }),
      );
      return (
        Vector3.length(Vector3.cross(off, Vector3.normalize(surface.normal))) <
        ROUNDING
      );
    };
    const elbow = (
      side: AutoMovieHumanSide,
      bend: "tucked" | "akimbo",
    ): IAutoMovieVector3 =>
      AutoMovieMotionHumanBend.arm(
        body,
        { root: posture.root, yaw: posture.yaw },
        side,
        bend,
      );
    const laid = goals("pocket", "hip");
    TestValidator.predicate(
      "a pocket and a hip",
      laid.left!.shape === "flat" &&
        laid.right!.surface === "palm" &&
        onNormal(laid.left!, "pocketFrontLeft", 0) &&
        onNormal(
          laid.right!,
          "hipRight",
          0.5 * (m.waistHeight - m.hipHeight),
        ) &&
        vclose(laid.left!.elbow!, elbow("left", "tucked"), ROUNDING) &&
        vclose(laid.right!.elbow!, elbow("right", "akimbo"), ROUNDING),
    );
    const one: IAutoMovieVector3 = goals("chinRest", "side").left!.point;
    const both: IAutoMovieVector3 = goals("chinRest", "chinRest").left!.point;
    TestValidator.predicate(
      "the chin on both fists",
      both.x > one.x &&
        nclose(both.y, one.y, ROUNDING) &&
        nclose(both.z, one.z, ROUNDING),
    );
    const chin = goals("chinRest", "elbowSupport");
    TestValidator.equals(
      "crossed and supported",
      [goals("crossed", "crossed"), chin.right],
      [
        restCrossedArms(body, posture),
        restElbowSupport(
          body,
          posture,
          "right",
          chin.left!,
          AutoMovieMotionHumanBend.arm(
            body,
            { root: posture.root, yaw: posture.yaw },
            "right",
            "folded",
          ),
        ),
      ],
    );
  }
}

/**
 * `rest`'s unit contract: its goals and forearm.
 *
 * Its parts, each documented with its own scenarios:
 *
 * - `rest_forearm`: `restForearm` lays a resting arm's forearm by the two-link
 *   closed form:
 * - `rest_goals`: `restGoals` sets both hands' rest goals on a standing posture.
 */
export async function test_unit_motions_everyday_rest(): Promise<void> {
  part_rest_forearm.run();
  await part_rest_goals.run();
}
