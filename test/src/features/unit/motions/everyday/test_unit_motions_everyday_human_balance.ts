import type { IAutoMovieMotionHumanBalance, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanPosture, IAutoMovieVector3 } from "@automovie/interface";
import { HumanBalance, HumanBalanceExtrapolated, prepareBearingTrunkBalance } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

namespace part_human_balance_along {
  /** Rounding of a few line intersections, metres. */
  const ROUNDING: number = 1e-12;

  /**
   * `HumanBalance.along` is the margin of stability along one horizontal
   * direction (Hof et al. 2005): how far a point may move that way before it
   * leaves the convex hull of the support points, negative by the distance back
   * to the hull when it is outside; its height and the direction's length are
   * ignored.
   *
   * Scenarios, a 0.3 m square base from (0, 0) to (0.3, 0.3) on the floor:
   *
   * 1. From (0.1, 0.1) the margin is 0.2 m along +X, 0.1 m along -X and 0.2 m
   *    along +Z, the direction's length not counting.
   * 2. Along the diagonal (1, 1) it is the diagonal to the far corner, 0.2 sqrt 2.
   * 3. From (0.5, 0.1), outside, along -X it is the -0.5 m to the far edge's
   *    crossing, negative.
   */
  export function verify(): void {
    const base: IAutoMovieVector3[] = [
      { x: 0, y: 0, z: 0 },
      { x: 0.3, y: 0, z: 0 },
      { x: 0.3, y: 0, z: 0.3 },
      { x: 0, y: 0, z: 0.3 },
    ];
    const inside: IAutoMovieVector3 = { x: 0.1, y: 0.9, z: 0.1 };
    TestValidator.predicate(
      "inside",
      nclose(
        HumanBalance.along(inside, base, { x: 1, y: 0, z: 0 }),
        0.2,
        ROUNDING,
      ) &&
        nclose(
          HumanBalance.along(inside, base, { x: -2, y: 0, z: 0 }),
          0.1,
          ROUNDING,
        ) &&
        nclose(
          HumanBalance.along(inside, base, { x: 0, y: 0, z: 1 }),
          0.2,
          ROUNDING,
        ),
    );
    TestValidator.predicate(
      "diagonal",
      nclose(
        HumanBalance.along(inside, base, { x: 1, y: 0, z: 1 }),
        0.2 * Math.SQRT2,
        ROUNDING,
      ),
    );
    TestValidator.predicate(
      "outside",
      nclose(
        HumanBalance.along({ x: 0.5, y: 0, z: 0.1 }, base, {
          x: -1,
          y: 0,
          z: 0,
        }),
        -0.5,
        ROUNDING,
      ),
    );
  }
}

namespace part_human_balance_centre {
  /** Rounding of a mass-weighted forward-kinematics sum, metres. */
  const ROUNDING: number = 1e-9;

  /**
   * `HumanBalance`'s readings of a posture: the whole-body centre of mass
   * (`centre`), the base of support's points under it (`support`), the margin
   * by which the centre lies inside the base (`margin`) and its offset ahead of
   * the base's middle along the heading (`offset`). They move with the body: a
   * translation moves the centre and the base alike and changes neither the
   * margin nor the offset, and a turn of the heading turns the centre's offset
   * from the root.
   *
   * The body is built whole (`humanFixtureBody`): the centre weighs every
   * segment's mass placed by forward kinematics.
   *
   * Scenarios, the average man upright:
   *
   * 1. The body being left-right symmetric, the centre lies on its midline, x = 0,
   *    between the hips and the shoulders in height.
   * 2. Moved 1 m along +X and 2 m along +Z, the centre and every support point
   *    move by that, and the margin and the offset are unchanged.
   * 3. Turned 90 degrees, the centre's offset from the root turns from (x, z) to
   *    (z, -x).
   */
  export async function verify(): Promise<void> {
    const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
    const posture: (
      root: IAutoMovieVector3,
      yaw: number,
    ) => IAutoMovieMotionHumanPosture = (
      root: IAutoMovieVector3,
      yaw: number,
    ): IAutoMovieMotionHumanPosture => ({
      root,
      yaw,
      pitch: 0,
      roll: 0,
      joints: {},
      limbs: {},
    });
    const here: IAutoMovieMotionHumanPosture = posture({ x: 0, y: 0, z: 0 }, 0);
    const there: IAutoMovieMotionHumanPosture = posture(
      { x: 1, y: 0, z: 2 },
      0,
    );
    const centre: IAutoMovieVector3 = HumanBalance.centre(body, here);
    const margin: number = HumanBalance.margin(body, here);
    TestValidator.predicate(
      "on the midline",
      Math.abs(centre.x) < ROUNDING &&
        centre.y > body.measure.hipHeight &&
        centre.y < body.measure.shoulderHeight,
    );
    const support: ReturnType<typeof HumanBalance.support> =
      HumanBalance.support(body, here);
    const moved: ReturnType<typeof HumanBalance.support> = HumanBalance.support(
      body,
      there,
    );
    TestValidator.predicate(
      "moved",
      vclose(
        HumanBalance.centre(body, there),
        { x: centre.x + 1, y: centre.y, z: centre.z + 2 },
        ROUNDING,
      ) &&
        moved.points.length === support.points.length &&
        support.points.every((p: IAutoMovieVector3, i: number): boolean =>
          vclose(
            moved.points[i]!,
            { x: p.x + 1, y: p.y, z: p.z + 2 },
            ROUNDING,
          ),
        ) &&
        nclose(HumanBalance.margin(body, there), margin, ROUNDING) &&
        nclose(
          HumanBalance.offset(body, there),
          HumanBalance.offset(body, here),
          ROUNDING,
        ),
    );
    TestValidator.predicate(
      "turned",
      vclose(
        HumanBalance.centre(body, posture({ x: 0, y: 0, z: 0 }, 90)),
        { x: centre.z, y: centre.y, z: -centre.x },
        ROUNDING,
      ),
    );
  }
}

namespace part_human_balance_extrapolated {
  /** Rounding of a mass-weighted forward-kinematics sum, metres. */
  const ROUNDING: number = 1e-9;

  /**
   * Rounding of a margin read through a central difference over 1/240 s,
   * metres: the sum's rounding divided by the step.
   */
  const DIFFERENCE: number = 1e-6;

  /** How far a 0.5 m/s glide's margin lies from the still one at least, metres. */
  const MOVED: number = 1e-3;

  /**
   * `HumanBalanceExtrapolated` is the dynamic margin of stability at an instant
   * (Hof et al. 2005): the support margin of the centre of mass extrapolated by
   * its velocity, read by a central difference over a tenth of a 24 Hz frame,
   * over the pendulum's time constant. A still movement's margin is the static
   * one, and a movement gliding at a constant velocity keeps one margin at
   * every instant, its extrapolation moving with it; a glide forward moves the
   * extrapolated centre forward, so its margin differs from the still one.
   *
   * The body is built whole (`humanFixtureBody`): the centre weighs every
   * segment's mass placed by forward kinematics.
   *
   * Scenarios, the average man upright:
   *
   * 1. Standing still, the dynamic margin equals `HumanBalance.margin`.
   * 2. Gliding along +Z at 0.5 m/s, the margin at 1 s equals the margin at 3 s,
   *    and differs from the still margin.
   * 3. `prepare` reads the same margin as the one-shot reader.
   */
  export async function verify(): Promise<void> {
    const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
    const at: (z: number) => IAutoMovieMotionHumanPosture = (
      z: number,
    ): IAutoMovieMotionHumanPosture => ({
      root: { x: 0, y: 0, z },
      yaw: 0,
      pitch: 0,
      roll: 0,
      joints: {},
      limbs: {},
    });
    const still: number = HumanBalanceExtrapolated(
      body,
      (): IAutoMovieMotionHumanPosture => at(0),
      1,
    );
    TestValidator.predicate(
      "still",
      nclose(still, HumanBalance.margin(body, at(0)), ROUNDING),
    );
    const glide: (seconds: number) => IAutoMovieMotionHumanPosture = (
      seconds: number,
    ): IAutoMovieMotionHumanPosture => at(0.5 * seconds);
    const early: number = HumanBalanceExtrapolated(body, glide, 1);
    TestValidator.predicate(
      "gliding",
      nclose(early, HumanBalanceExtrapolated(body, glide, 3), DIFFERENCE) &&
        Math.abs(early - still) > MOVED &&
        nclose(
          HumanBalanceExtrapolated.prepare(body)(glide, 1),
          early,
          ROUNDING,
        ),
    );
  }
}

namespace part_prepare_bearing_trunk_balance {
  /**
   * `prepareBearingTrunkBalance` prepares a lumbar balance over the contacts
   * that bear inside its window: the bearing contacts, their surfaces' bones
   * and the trunk balance over them are all read when it is prepared; no
   * window, or a second outside it, leaves the posture as it is.
   *
   * The body is built whole (`humanFixtureBody`): the balance reads the trunk's
   * rig and the bearing surfaces.
   *
   * Scenarios, a 1 s action whose left foot plants through it:
   *
   * 1. With no window, the write returns its posture.
   * 2. With a hips window over 0.2 to 0.8 s, a write at 0.1 s, outside it, returns
   *    its posture.
   * 3. Over a body whose surface regions count their reads, preparing the window
   *    reads the left sole's frame once, and a write outside the window reads
   *    it no more.
   */
  export async function verify(): Promise<void> {
    const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
    const contacts: IAutoMovieMotionHumanContactWindow[] = [
      {
        part: "leftFoot",
        kind: "plant",
        from: 0,
        to: 1,
        support: { kind: "ground" },
      },
    ];
    const posture: IAutoMovieMotionHumanPosture = {
      root: { x: 0, y: 0, z: 0 },
      yaw: 0,
      pitch: 0,
      roll: 0,
      joints: {},
      limbs: {},
    };
    const window: IAutoMovieMotionHumanBalance.IWindow = {
      from: 0.2,
      to: 0.8,
      by: "hips",
      weight: 1,
      ramp: { in: 0.1, out: 0.1 },
    };
    TestValidator.predicate(
      "outside the window",
      prepareBearingTrunkBalance(body, null, 1, contacts)(posture, 0.5) ===
        posture &&
        prepareBearingTrunkBalance(body, window, 1, contacts)(posture, 0.1) ===
          posture,
    );
    let reads: number = 0;
    const counted: IAutoMovieMotionHumanBody = {
      ...body,
      surfaces: {
        ...body.surfaces,
        get regions() {
          ++reads;
          return body.surfaces.regions;
        },
      },
    };
    const write = prepareBearingTrunkBalance(counted, window, 1, contacts);
    const prepared: number = reads;
    write(posture, 0.1);
    TestValidator.equals("read when prepared", [prepared, reads], [1, 1]);
  }
}

/**
 * `HumanBalance`'s unit contract: its centre, support line, extrapolation and
 * the bearing trunk balance.
 *
 * Its parts, each documented with its own scenarios:
 *
 * - `human_balance_along`: `HumanBalance.along` is the margin of stability along
 *   one horizontal direction (Hof et al.
 * - `human_balance_centre`: `HumanBalance`'s readings of a posture:
 * - `human_balance_extrapolated`: Rounding of a margin read through a central
 *   difference over 1/240 s, metres:
 * - `prepare_bearing_trunk_balance`: `prepareBearingTrunkBalance` prepares a
 *   lumbar balance over the contacts that bear inside its window:
 */
export async function test_unit_motions_everyday_human_balance(): Promise<void> {
  part_human_balance_along.verify();
  await part_human_balance_centre.verify();
  await part_human_balance_extrapolated.verify();
  await part_prepare_bearing_trunk_balance.verify();
}
