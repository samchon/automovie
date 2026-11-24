import type {
  IAutoMovieHumanCanonicalBody,
  IAutoMoviePose,
} from "@automovie/interface";
import type {
  IMotionCaptureCase,
  IMotionCaptureProps,
} from "@automovie/motions/internal";
import { planMotionCaptureProps } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import type { IHumanFixture } from "../../../internal/fixtures/IHumanFixture";
import { humanFixture } from "../../../internal/fixtures/humanFixture";

/**
 * `planMotionCaptureProps` plans a capture case's playback props at 32 frames a
 * second: the case's own instants first, then every grid frame up to the last
 * instant that is not one of them, each figure posed at every second, and a
 * ghost keeping its opacity.
 *
 * A case drawn at 0.1 s and 0.05 s with one performer and one ghost of the
 * average man; its grid runs `floor(0.1 · 32) + 1` = 4 frames.
 *
 * Scenarios:
 *
 * 1. The seconds are the two instants then 0, 1/32, 2/32 and 3/32; the props last
 *    4/32 s.
 * 2. The performer is posed at each of those seconds, in order, with no colour;
 *    the ghost keeps its 0.4 opacity and its colour.
 * 3. Absent trails, targets, drift and boxes are empty.
 */
export async function test_unit_motions_executable_plan_motion_capture_props(): Promise<void> {
  const fixture: IHumanFixture = await humanFixture("m-average");
  const body: IAutoMovieHumanCanonicalBody.IBody = {
    skeleton: fixture.skeleton,
    profile: fixture.profile,
    joints: [],
  };
  const asked: number[] = [];
  const pose = (seconds: number): IAutoMoviePose => {
    asked.push(seconds);
    return { skeleton: fixture.skeleton.id, root: null, joints: [] };
  };
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
  const seconds: number[] = [0.1, 0.05, 0, 1 / 32, 2 / 32, 3 / 32];
  TestValidator.equals(
    "the instants and the grid",
    [props.fps, props.seconds, props.durationSeconds],
    [32, seconds, 4 / 32],
  );
  TestValidator.equals(
    "the figures",
    [
      props.performers[0]!.poses.length,
      props.performers[0]!.color,
      props.ghosts[0]!.opacity,
      props.ghosts[0]!.color,
      asked,
    ],
    [6, null, 0.4, 0xff0000, [...seconds, ...seconds]],
  );
  TestValidator.equals(
    "the empty overlays",
    [props.trails, props.targets, props.drift, props.boxes],
    [[], [], [], []],
  );
}
