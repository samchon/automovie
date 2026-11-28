import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import {
  motionCaseSocket
} from "../../../../../packages/motions/src/executable/cases/internal/motionCaseSocket";
import { TestValidator } from "@nestia/e2e";

import { humanFixture } from "../../internal/fixtures/humanFixture";
import { vclose } from "../../internal/vclose";

/**
 * `motionCaseSocket` places a body socket on its bone as the performance shows
 * the subject at a second.
 *
 * The average man's right grip socket, its bone shown at (1, 2, 3) unturned.
 *
 * Scenarios:
 *
 * 1. The socket lands at (1, 2, 3) plus its bone-local point, the subject and the
 *    second asked of the performance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines reading a declared body socket through the requested subject's displayed bone frame and time.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the socket helper with a stored grip socket and a controlled playback bone reader.
 * @evidence contracts/development/testing.md#independent-expectations The controlled bone at (1, 2, 3) is unrotated, so the result is its position plus the authored local offset. The observed query retains subject and second.
 */
export async function test_motions_executable_motion_case_socket(): Promise<void> {
  const surfaces: IAutoMovieHumanoidSurfaces.ISurfaces = (
    await humanFixture("m-average")
  ).surfaces;
  const grip: IAutoMovieHumanoidSurfaces.IFrame = surfaces.sockets.gripRight;
  const asked: [string, number][] = [];
  const bones = (
    subject: string,
    seconds: number,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
    asked.push([subject, seconds]);
    return new Map([
      [
        grip.bone,
        {
          bone: grip.bone,
          localRotation: { x: 0, y: 0, z: 0, w: 1 },
          worldPosition: { x: 1, y: 2, z: 3 },
          worldRotation: { x: 0, y: 0, z: 0, w: 1 },
        },
      ],
    ]);
  };
  TestValidator.predicate(
    "the socket on its shown bone",
    vclose(
      motionCaseSocket({ surfaces }, { bones }, "b", 0.5, "gripRight"),
      { x: 1 + grip.point.x, y: 2 + grip.point.y, z: 3 + grip.point.z },
      1e-12,
    ),
  );
  TestValidator.equals("asked of the performance", asked, [["b", 0.5]]);
}
