import type { IAutoMovieHumanCanonicalBody, IAutoMovieMark, IAutoMoviePose, IAutoMovieVector3 } from "@automovie/interface";
import type {
  IMotionCaptureCase
} from "../../../../../packages/motions/src/executable/internal/IMotionCaptureCase";
import type {
  IMotionCaptureProps
} from "../../../../../packages/motions/src/executable/internal/IMotionCaptureProps";
import {
  planMotionCaptureProps
} from "../../../../../packages/motions/src/executable/internal/planMotionCaptureProps";
import {
  markMotionCaptureCase
} from "../../../../../packages/motions/src/capture/internal/markMotionCaptureCase";
import {
  planMotionCaptureInstants
} from "../../../../../packages/motions/src/capture/internal/planMotionCaptureInstants";
import { TestValidator } from "@nestia/e2e";

import type { IHumanFixture } from "../../internal/fixtures/IHumanFixture";
import { humanFixture } from "../../internal/fixtures/humanFixture";

/** A point. */
const at = (x: number, y: number, z: number): IAutoMovieVector3 => ({
  x,
  y,
  z,
});

/**
 * The motion capture harness: a case's playback props, its drawn instants and
 * its inspection marks.
 *
 * Scenarios:
 *
 * 1. A case drawn at 0.1 s and 0.05 s plans its two instants then the 32 Hz grid
 *    up to the last, 0 to 3/32 s, lasting 4/32 s, its ghost keeping its 0.4
 *    opacity.
 * 2. Two instants 5e-16 s apart, `grip closed` and `release starts`, become one
 *    named by both; instants a millisecond apart stay two.
 * 3. A red trail, a green target and drift of 2 mm and 9 mm against a 5 mm limit
 *    give a polyline, a point and two drift marks, the 9 mm one flagged; a
 *    trail and a target sharing red are one kind, `trail and target d04040`.
 */
export async function test_motions_executable_motion_capture(): Promise<void> {
  // 1. The props.
  const fixture: IHumanFixture = await humanFixture("m-average");
  const body: IAutoMovieHumanCanonicalBody.IBody = {
    skeleton: fixture.skeleton,
    profile: fixture.profile,
    joints: [],
  };
  const pose = (): IAutoMoviePose => ({
    skeleton: fixture.skeleton.id,
    root: null,
    joints: [],
  });
  const capture: IMotionCaptureCase = {
    name: "probe",
    times: [
      { seconds: 0.1, label: "a" },
      { seconds: 0.05, label: "b" },
    ],
    performers: [{ id: "a", body, pose }],
    ghosts: [{ id: "g", body, pose, opacity: 0.4, color: 0xff0000 }],
  };
  const props: IMotionCaptureProps = planMotionCaptureProps(capture, {
    width: 720,
    height: 720,
  });
  TestValidator.equals(
    "the instants, the grid and the ghost",
    [props.seconds, props.durationSeconds, props.ghosts[0]!.opacity],
    [[0.1, 0.05, 0, 1 / 32, 2 / 32, 3 / 32], 4 / 32, 0.4],
  );

  // 2. The instants.
  TestValidator.equals(
    "coinciding instants named by both",
    [
      planMotionCaptureInstants([
        { seconds: 1.886634915062088, label: "grip closed" },
        { seconds: 1.8866349150620885, label: "release starts" },
      ]),
      planMotionCaptureInstants([
        { seconds: 1, label: "a" },
        { seconds: 1.001, label: "b" },
      ]).length,
    ],
    [
      [{ seconds: 1.886634915062088, label: "grip closed / release starts" }],
      2,
    ],
  );

  // 3. The marks.
  const marks: IAutoMovieMark[] = markMotionCaptureCase({
    trails: [
      { color: 0xd04040, points: [at(0, 0, 0), at(0.5, 0, 0), at(1, 0, 0)] },
    ],
    targets: [{ at: at(1, 1, 0), radius: 0.03, color: 0x40a040 }],
    drift: [
      {
        samples: [
          { at: at(0.1, 0, 0.2), drift: 0.002 },
          { at: at(0.3, 0, 0.2), drift: 0.009 },
        ],
        limit: 0.005,
      },
    ],
  });
  const shared: IAutoMovieMark[] = markMotionCaptureCase({
    trails: [{ color: 0xd04040, points: [at(0, 0, 0), at(1, 0, 0)] }],
    targets: [{ at: at(1, 0, 0), radius: 0.02, color: 0xd04040 }],
    drift: [],
  });
  TestValidator.equals(
    "shapes, flags and a shared kind",
    [
      marks.map((mark: IAutoMovieMark): [string, string, boolean] => [
        mark.path,
        mark.shape.type,
        mark.flagged,
      ]),
      [...new Set(shared.map((mark: IAutoMovieMark): string => mark.label))],
    ],
    [
      [
        ["case/trail/0", "polyline", false],
        ["case/target/0", "points", false],
        ["case/drift/0/within", "points", false],
        ["case/drift/0/beyond", "points", true],
      ],
      ["trail and target d04040"],
    ],
  );
}
