import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import { seated } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixture } from "../../../internal/fixtures/humanFixture";
import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** Rounding of a few rotations, metres. */
const ROUNDING: number = 1e-12;

/** The knee's clearance off a seat's front edge, metres (`seated`'s own). */
const KNEE_CLEAR: number = 0.05;

/** The socket's clearance off a shallow seat's back, metres (`seated`'s own). */
const DEPTH_CLEAR: number = 0.02;

/**
 * `seated`'s seat socket: `offset` is the socket's place from the root at rest,
 * the hips' rest point plus the socket's own; `root` is the root that puts the
 * socket on a point under a heading, and `socket` the socket a posture puts in
 * the world, so the two undo each other; `point` is where the socket sits on a
 * seat, back from its front edge by the thigh less the knee's clearance (no
 * further than a shallow seat's depth allows) and raised by however far the
 * thigh's underside hangs below the socket.
 *
 * Scenarios, the average man's surfaces, hips resting 0.95 m up and the hip
 * joints 0.9 m up and 5 cm forward of them, a 0.45 m thigh of 0.08 m radius:
 *
 * 1. Rooted for a socket at (1, 0.5, 2) under a heading of 30, a pitch of 10 and a
 *    roll of 5, a posture places its socket back on that point.
 * 2. On a seat facing +Z at the origin, the socket sits on the middle line, behind
 *    the edge by the thigh's 0.45 m less the knee's 0.05 m clearance, plus the
 *    hip joint's 0.05 m lead, less the socket's rest depth.
 * 3. On a seat 0.2 m deep it sits 0.2 - 0.02 behind the edge.
 */
export async function test_unit_motions_everyday_seated_socket(): Promise<void> {
  const body: Parameters<typeof seated.point>[0] = {
    rest: new Map<AutoMovieHumanoidBone, IAutoMovieVector3>([
      ["hips", { x: 0, y: 0.95, z: 0 }],
      ["leftUpperLeg", { x: 0.09, y: 0.9, z: 0.05 }],
    ]),
    surfaces: (await humanFixture("m-average")).surfaces,
    measure: { thigh: 0.45, thighRadius: 0.08 },
  };
  const heading: Pick<IAutoMovieMotionHumanPosture, "yaw" | "pitch" | "roll"> =
    { yaw: 30, pitch: 10, roll: 5 };
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
      seated.point(body, { at: { x: 0, y: 0.45, z: 0 }, yaw: 0, depth: 0.2 }).z,
      -(0.2 - DEPTH_CLEAR),
      ROUNDING,
    ),
  );
}
