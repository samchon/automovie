import type {
  IAutoMovieMotionClockPhase,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanLieDown,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  floorArmRoom,
  floorSeat,
  lieDown,
  lieDownBlend,
  lieDownPhases,
  lieDownRollSide,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import type { IHumanFixture } from "../../../internal/fixtures/IHumanFixture";
import { humanFixture } from "../../../internal/fixtures/humanFixture";
import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

namespace part_lie_down_blend {
  /** Rounding of one product and sum per angle, degrees. */
  const ROUNDING: number = 1e-12;

  /**
   * `lieDownBlend` prepares one linear joint blend from each route key to the
   * next (`prepareHumanShapeBlend`): one fewer blend than keys, the `i`th from
   * key `i` to key `i + 1`.
   *
   * Scenarios:
   *
   * 1. Three keys give two blends.
   * 2. The first blend at a quarter is a quarter of the way from the first key to
   *    the second.
   * 3. The second blend at its ends is the second and the third key.
   */
  export function verify(): void {
    const key = (hips: number): IAutoMovieMotionHumanLieDown.IPose => ({
      pitch: 0,
      roll: 0,
      joints: { hips: [hips, 0, 0] },
    });
    const blends: ((
      weight: number,
    ) => IAutoMovieMotionHumanPosture["joints"])[] = lieDownBlend({
      keys: [key(0), key(40), key(100)],
    });
    TestValidator.equals("one blend between each two keys", blends.length, 2);
    TestValidator.predicate(
      "a quarter of the first",
      nclose(blends[0]!(0.25).hips![0], 10, ROUNDING),
    );
    TestValidator.predicate(
      "the second's ends",
      nclose(blends[1]!(0).hips![0], 40, ROUNDING) &&
        nclose(blends[1]!(1).hips![0], 100, ROUNDING),
    );
  }
}

namespace part_lie_down_phases {
  /**
   * `lieDownPhases` lays the lie's clock out: `getDown` and each route arrival
   * but the last take `lieDown.PHASE` seconds, the last arrival takes none, and
   * the settled hold takes the authored hold.
   *
   * Scenarios:
   *
   * 1. A three-key route held 2 s has `getDown`, the first two arrivals at `PHASE`
   *    each, the last arrival at 0 and `settled` at 2.
   * 2. A one-key route has `getDown`, its arrival at 0 and the hold.
   */
  export function verify(): void {
    const phase: number = lieDown.PHASE;
    TestValidator.equals(
      "a three-key route",
      lieDownPhases({
        route: [
          ["sit", "seatContact"],
          ["lean", "elbowsDown"],
          ["supine", "supine"],
        ],
        hold: 2,
      }),
      [
        { name: "getDown", seconds: phase },
        { name: "seatContact", seconds: phase },
        { name: "elbowsDown", seconds: phase },
        { name: "supine", seconds: 0 },
        { name: "settled", seconds: 2 },
      ] satisfies IAutoMovieMotionClockPhase[],
    );
    TestValidator.equals(
      "a one-key route",
      lieDownPhases({ route: [["prone", "prone"]], hold: 0.5 }),
      [
        { name: "getDown", seconds: phase },
        { name: "prone", seconds: 0 },
        { name: "settled", seconds: 0.5 },
      ] satisfies IAutoMovieMotionClockPhase[],
    );
  }
}

namespace part_lie_down_roll_side {
  /**
   * `lieDownRollSide` names the side a lateral lie rolls onto, and none for a
   * position that does not roll.
   *
   * Scenarios:
   *
   * 1. `lateralLeft` rolls left and `lateralRight` right.
   * 2. Supine and prone roll onto no side.
   */
  export function verify(): void {
    TestValidator.equals(
      "the lateral positions",
      [
        lieDownRollSide({ position: "lateralLeft" }),
        lieDownRollSide({ position: "lateralRight" }),
      ],
      ["left", "right"],
    );
    TestValidator.equals(
      "no roll",
      [
        lieDownRollSide({ position: "supine" }),
        lieDownRollSide({ position: "prone" }),
      ],
      [undefined, undefined],
    );
  }
}

namespace part_floor_seat {
  /** Rounding of a forward-kinematics chain, metres. */
  const ROUNDING: number = 1e-9;

  /**
   * `floorSeat.place` moves a posture's legs a share of the way to a folded floor
   * sitting: each ankle to its place in the pelvis's floor frame, in thigh
   * lengths from the floor under the hips' middle, raised half the standing
   * ankle's height, and each knee toward its bend point; side sitting also sets
   * the left hand down, planted once it is there.
   *
   * The body is built whole (`humanFixtureBody`): the legs start from the
   * posture's own joints, placed by forward kinematics.
   *
   * Scenarios, the average man upright:
   *
   * 1. At no share the posture is returned as it is.
   * 2. Tailor sitting facing +Z puts the left ankle `(-0.55 - 0.55, 0, 0.45 - 0.25)`
   *    thighs from the right one: 1.1 thighs to its right and 0.2 ahead, both
   *    half an ankle's height up.
   * 3. Facing +X, that offset turns with the pelvis: 1.1 thighs along +Z and 0.2
   *    along +X.
   * 4. Side sitting plants the left hand at the end, not half way.
   */
  export async function verify(): Promise<void> {
    const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
    const posture: (yaw: number) => IAutoMovieMotionHumanPosture = (
      yaw: number,
    ): IAutoMovieMotionHumanPosture => ({
      root: { x: 0, y: 0.5, z: 0 },
      yaw,
      pitch: 0,
      roll: 0,
      joints: {},
      limbs: {},
    });
    const upright: IAutoMovieMotionHumanPosture = posture(0);
    TestValidator.predicate(
      "no share",
      floorSeat.place(body, upright, "crossed", 0) === upright,
    );
    const thigh: number = body.measure.thigh;
    const apart: (p: IAutoMovieMotionHumanPosture) => IAutoMovieVector3 = (
      p: IAutoMovieMotionHumanPosture,
    ): IAutoMovieVector3 => {
      const left: IAutoMovieVector3 = p.limbs.leftLeg!.point;
      const right: IAutoMovieVector3 = p.limbs.rightLeg!.point;
      return { x: left.x - right.x, y: left.y - right.y, z: left.z - right.z };
    };
    const crossed: IAutoMovieMotionHumanPosture = floorSeat.place(
      body,
      upright,
      "crossed",
      1,
    );
    TestValidator.predicate(
      "tailor sitting",
      vclose(
        apart(crossed),
        { x: -1.1 * thigh, y: 0, z: 0.2 * thigh },
        ROUNDING,
      ) &&
        nclose(
          crossed.limbs.leftLeg!.point.y,
          floorSeat.ANKLE * body.measure.ankleHeight,
          ROUNDING,
        ),
    );
    TestValidator.predicate(
      "turned",
      vclose(
        apart(floorSeat.place(body, posture(90), "crossed", 1)),
        { x: 0.2 * thigh, y: 0, z: 1.1 * thigh },
        ROUNDING,
      ),
    );
    TestValidator.predicate(
      "side sitting",
      floorSeat.place(body, upright, "side", 1).limbs.leftArm?.planted ===
        true &&
        floorSeat.place(body, upright, "side", 0.5).limbs.leftArm?.planted ===
          false,
    );
  }
}

namespace part_floor_arm_room_count {
  /** The fewest intervals a blend's scan reads (`floorArmRoom`'s `SCAN`). */
  const SCAN: number = 16;

  /**
   * `floorArmRoom.count` is the number of evenly spaced intervals that keep any
   * arm within the audit's self-penetration allowance between two readings of a
   * blend: the joints' turns times their reaches, summed, over twice the
   * allowance, and never fewer than `SCAN`. It reads only the body's physical
   * profile, the stored one here.
   *
   * Scenarios:
   *
   * 1. A blend that turns no joint needs only `SCAN`.
   * 2. A half-turn of the shoulder needs more than `SCAN`.
   * 3. The count does not depend on the blend's direction.
   * 4. A larger turn needs no fewer intervals.
   */
  export async function verify(): Promise<void> {
    const stored: IHumanFixture = await humanFixture("m-average");
    const body: Parameters<typeof floorArmRoom.count>[0] = {
      profile: stored.profile,
    };
    const posture = (shoulder: number): IAutoMovieMotionHumanPosture => ({
      root: { x: 0, y: 0, z: 0 },
      yaw: 0,
      pitch: 0,
      roll: 0,
      joints: { leftUpperArm: [shoulder, 0, 0] },
      limbs: {},
    });
    TestValidator.equals(
      "no turn",
      floorArmRoom.count(body, posture(30), posture(30)),
      SCAN,
    );
    const half: number = floorArmRoom.count(body, posture(0), posture(180));
    TestValidator.predicate(`a half turn (${half})`, half > SCAN);
    TestValidator.equals(
      "either direction",
      floorArmRoom.count(body, posture(180), posture(0)),
      half,
    );
    TestValidator.predicate(
      "a larger turn",
      floorArmRoom.count(body, posture(-90), posture(180)) >= half,
    );
  }
}

/**
 * `lieDown`'s unit contract: its phases, roll side, blend, floor seat and arm
 * room.
 *
 * Its parts, each documented with its own scenarios:
 *
 * - `lie_down_blend`: `lieDownBlend` prepares one linear joint blend from each
 *   route key to the next (`prepareHumanShapeBlend`):
 * - `lie_down_phases`: `lieDownPhases` lays the lie's clock out:
 * - `lie_down_roll_side`: `lieDownRollSide` names the side a lateral lie rolls
 *   onto, and none for a position that does not roll.
 * - `floor_seat`: `floorSeat.place` moves a posture's legs a share of the way to
 *   a folded floor sitting:
 * - `floor_arm_room_count`: `floorArmRoom.count` is the number of evenly spaced
 *   intervals that keep any arm within the audit's self-penetration allowance
 *   between two readings of a blend:
 */
export async function test_unit_motions_floor_lie_down(): Promise<void> {
  part_lie_down_blend.verify();
  part_lie_down_phases.verify();
  part_lie_down_roll_side.verify();
  await part_floor_seat.verify();
  await part_floor_arm_room_count.verify();
}
