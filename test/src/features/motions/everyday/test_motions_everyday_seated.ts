import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  riseSeatOff,
  seated,
  seatedCourse,
  seatedFlatHand,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixture } from "../../internal/fixtures/humanFixture";
import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

namespace part_seated_course {
  /** Rounding of a product of decimal ratios. */
  const ROUNDING: number = 1e-12;

  /**
   * `seatedCourse` times a sit's descent and a rise's ascent as `2 (1 + 0.6 (1
   *
   * - R))`seconds and peaks their trunk flexion at`35 + 50 (1 - r)`degrees,`r`
   *   the seat's height over the popliteal height.
   *
   * Scenarios:
   *
   * 1. A seat at the popliteal height takes 2 s and flexes the trunk 35 degrees.
   * 2. A seat at 0.6 of it takes 2.48 s and flexes 55; one at 1.2 takes 1.76 s and
   *    flexes 25.
   */
  export function verify(): void {
    TestValidator.predicate(
      "the course",
      nclose(seatedCourse.descent(1), 2, ROUNDING) &&
        nclose(seatedCourse.flexion(1), 35, ROUNDING) &&
        nclose(seatedCourse.descent(0.6), 2.48, ROUNDING) &&
        nclose(seatedCourse.flexion(0.6), 55, ROUNDING) &&
        nclose(seatedCourse.descent(1.2), 1.76, ROUNDING) &&
        nclose(seatedCourse.flexion(1.2), 25, ROUNDING),
    );
  }
}

namespace part_seated_flat_hand {
  /** Rounding of a few products, degrees. */
  const ROUNDING: number = 1e-12;

  /**
   * `seatedFlatHand` lays a seated hand flat by a share, and turns its thumb's
   * metacarpal about its long axis by the body's own flat-thumb turn times the
   * share, so the thumb lies on the thigh with the palm; a body whose thumb
   * needs no turn keeps the flat shape as it is.
   *
   * Scenarios, an upright posture with no joint set:
   *
   * 1. With a 12-degree flat thumb, half way flat, the right thumb is turned 6
   *    degrees past the shape a body with no turn gives, its other two angles
   *    alike.
   * 2. The left hand of that body, whose left thumb needs no turn, matches the
   *    shape.
   */
  export function verify(): void {
    const posture: IAutoMovieMotionHumanPosture = {
      root: { x: 0, y: 0.5, z: 0 },
      yaw: 0,
      pitch: 0,
      roll: 0,
      joints: {},
      limbs: {},
    };
    const turned: IAutoMovieMotionHumanPosture = seatedFlatHand(
      { flatThumb: { left: 0, right: 12 } },
      posture,
      "right",
      0.5,
    );
    const plain: IAutoMovieMotionHumanPosture = seatedFlatHand(
      { flatThumb: { left: 0, right: 0 } },
      posture,
      "right",
      0.5,
    );
    const a: readonly [number, number, number] =
      turned.joints.rightThumbMetacarpal!;
    const b: readonly [number, number, number] =
      plain.joints.rightThumbMetacarpal!;
    TestValidator.predicate(
      "the turned thumb",
      nclose(a[2], b[2] + 6, ROUNDING) &&
        nclose(a[0], b[0], ROUNDING) &&
        nclose(a[1], b[1], ROUNDING),
    );
    TestValidator.equals(
      "the left hand",
      seatedFlatHand(
        { flatThumb: { left: 0, right: 12 } },
        posture,
        "left",
        0.5,
      ),
      seatedFlatHand(
        { flatThumb: { left: 0, right: 0 } },
        posture,
        "left",
        0.5,
      ),
    );
  }
}

namespace part_seated_popliteal {
  /** Rounding of a few sums and quotients. */
  const ROUNDING: number = 1e-12;

  /**
   * A seat is judged by the popliteal height, `seated.popliteal`: the ankle
   * height and the shank less the thigh's radius; `ratio` is a seat's height
   * over the floor as a share of it and `high` a seat above `RATIO`'s 1.2 of
   * it. The sit's descent and knee flexion follow the ratio (`seatedCourse`),
   * and the rise leaves the seat a little over a third into rising
   * (`riseSeatOff`).
   *
   * Scenarios, a 0.08 m ankle height, a 0.42 m shank and a 0.07 m thigh radius
   * (a 0.43 m popliteal height):
   *
   * 1. The popliteal height is 0.43 m.
   * 2. A 0.43 m seat is ratio 1 and not high; a 0.6 m seat is high; a 0.6 m seat
   *    on a 0.1 m floor is ratio 0.5 / 0.43.
   * 3. A seat at the popliteal height descends over 2 s with the knees at 35
   *    degrees; at half of it over 2.6 s with 60.
   * 4. Rising for 1 s leaves the seat at 0.36 s.
   */
  export function verify(): void {
    const body: seated.IPopliteal = {
      measure: { ankleHeight: 0.08, shank: 0.42, thighRadius: 0.07 },
    };
    TestValidator.predicate(
      "the popliteal height",
      nclose(seated.popliteal(body), 0.43, ROUNDING),
    );
    const seat: (y: number) => Parameters<typeof seated.ratio>[1] = (
      y: number,
    ): Parameters<typeof seated.ratio>[1] => ({
      at: { x: 0, y, z: 0 },
    });
    TestValidator.predicate(
      "the seat's ratio",
      nclose(seated.ratio(body, seat(0.43)), 1, ROUNDING) &&
        !seated.high(body, seat(0.43)) &&
        seated.high(body, seat(0.6)) &&
        nclose(seated.ratio(body, seat(0.6), 0.1), 0.5 / 0.43, ROUNDING),
    );
    TestValidator.predicate(
      "the sit's course",
      nclose(seatedCourse.descent(1), 2, ROUNDING) &&
        nclose(seatedCourse.flexion(1), 35, ROUNDING) &&
        nclose(seatedCourse.descent(0.5), 2.6, ROUNDING) &&
        nclose(seatedCourse.flexion(0.5), 60, ROUNDING),
    );
    TestValidator.predicate(
      "the seat left",
      nclose(riseSeatOff(1), 0.36, ROUNDING),
    );
  }
}

namespace part_seated_socket {
  /** Rounding of a few rotations, metres. */
  const ROUNDING: number = 1e-12;

  /** The knee's clearance off a seat's front edge, metres (`seated`'s own). */
  const KNEE_CLEAR: number = 0.05;

  /** The socket's clearance off a shallow seat's back, metres (`seated`'s own). */
  const DEPTH_CLEAR: number = 0.02;

  /**
   * `seated`'s seat socket: `offset` is the socket's place from the root at
   * rest, the hips' rest point plus the socket's own; `root` is the root that
   * puts the socket on a point under a heading, and `socket` the socket a
   * posture puts in the world, so the two undo each other; `point` is where the
   * socket sits on a seat, back from its front edge by the thigh less the
   * knee's clearance (no further than a shallow seat's depth allows) and raised
   * by however far the thigh's underside hangs below the socket.
   *
   * Scenarios, the average man's surfaces, hips resting 0.95 m up and the hip
   * joints 0.9 m up and 5 cm forward of them, a 0.45 m thigh of 0.08 m radius:
   *
   * 1. Rooted for a socket at (1, 0.5, 2) under a heading of 30, a pitch of 10 and
   *    a roll of 5, a posture places its socket back on that point.
   * 2. On a seat facing +Z at the origin, the socket sits on the middle line,
   *    behind the edge by the thigh's 0.45 m less the knee's 0.05 m clearance,
   *    plus the hip joint's 0.05 m lead, less the socket's rest depth.
   * 3. On a seat 0.2 m deep it sits 0.2 - 0.02 behind the edge.
   */
  export async function verify(): Promise<void> {
    const body: Parameters<typeof seated.point>[0] = {
      rest: new Map<AutoMovieHumanoidBone, IAutoMovieVector3>([
        ["hips", { x: 0, y: 0.95, z: 0 }],
        ["leftUpperLeg", { x: 0.09, y: 0.9, z: 0.05 }],
      ]),
      surfaces: (await humanFixture("m-average")).surfaces,
      measure: { thigh: 0.45, thighRadius: 0.08 },
    };
    const heading: Pick<
      IAutoMovieMotionHumanPosture,
      "yaw" | "pitch" | "roll"
    > = { yaw: 30, pitch: 10, roll: 5 };
    const at: IAutoMovieVector3 = { x: 1, y: 0.5, z: 2 };
    const posture: IAutoMovieMotionHumanPosture = {
      root: seated.root(body, at, heading),
      ...heading,
      joints: {},
      limbs: {},
    };
    TestValidator.predicate(
      "rooted",
      vclose(seated.socket(body, posture), at, ROUNDING),
    );
    const socket: IAutoMovieVector3 = seated.offset(body);
    const sat: IAutoMovieVector3 = seated.point(body, {
      at: { x: 0, y: 0.45, z: 0 },
      yaw: 0,
    });
    TestValidator.predicate(
      "on the seat",
      nclose(sat.x, 0, ROUNDING) &&
        nclose(sat.z, -(0.45 - KNEE_CLEAR + 0.05 - socket.z), ROUNDING) &&
        sat.y >= 0.45,
    );
    TestValidator.predicate(
      "a shallow seat",
      nclose(
        seated.point(body, { at: { x: 0, y: 0.45, z: 0 }, yaw: 0, depth: 0.2 })
          .z,
        -(0.2 - DEPTH_CLEAR),
        ROUNDING,
      ),
    );
  }
}

/**
 * `seated`'s unit contract: its course, popliteal height, sockets and flat
 * hand.
 *
 * Its parts, each documented with its own scenarios:
 *
 * - `seated_course`: `seatedCourse` times a sit's descent and a rise's ascent as
 *   `2 (1 + 0.6 (1 - r))` seconds and peaks their trunk flexion at `35 + 50 (1
 *
 *   - R)`degrees,`r` the seat's height over the popliteal height.
 * - `seated_flat_hand`: `seatedFlatHand` lays a seated hand flat by a share, and
 *   turns its thumb's metacarpal about its long axis by the body's own
 *   flat-thumb turn times the share, so the thumb lies on the thigh with the
 *   palm;
 * - `seated_popliteal`: A seat is judged by the popliteal height,
 *   `seated.popliteal`:
 * - `seated_socket`: `seated`'s seat socket:
 */
export async function test_motions_everyday_seated(): Promise<void> {
  part_seated_course.verify();
  part_seated_flat_hand.verify();
  part_seated_popliteal.verify();
  await part_seated_socket.verify();
}
