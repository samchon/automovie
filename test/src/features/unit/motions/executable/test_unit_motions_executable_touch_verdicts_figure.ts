import type {
  IAutoMovieHumanCanonicalBody,
  IAutoMoviePose,
} from "@automovie/interface";
import type { IMotionCaptureCase } from "@automovie/motions/internal";
import { TouchVerdicts } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import type { IHumanFixture } from "../../../internal/fixtures/IHumanFixture";
import { humanFixture } from "../../../internal/fixtures/humanFixture";

/**
 * `TouchVerdicts.figure` draws a performer: its subject's id, the polygon man's
 * canonical body, its displayed pose read from the performance at each second,
 * and its colour only when one is given.
 *
 * Scenarios:
 *
 * 1. Subject `b` is drawn with the man's body and posed through the performance at
 *    the second asked.
 * 2. A colour is carried when given, and absent otherwise.
 */
export async function test_unit_motions_executable_touch_verdicts_figure(): Promise<void> {
  const fixture: IHumanFixture = await humanFixture("m-average");
  const body: IAutoMovieHumanCanonicalBody.IBody = {
    skeleton: fixture.skeleton,
    profile: fixture.profile,
    joints: [],
  };
  const asked: [string, number][] = [];
  const shown: Pick<Parameters<typeof TouchVerdicts.figure>[0], "pose"> = {
    pose: (subject: string, seconds: number): IAutoMoviePose => {
      asked.push([subject, seconds]);
      return { skeleton: fixture.skeleton.id, root: null, joints: [] };
    },
  };
  const plain: IMotionCaptureCase.IPerformer = TouchVerdicts.figure(
    shown,
    "b",
    {
      body,
    },
  );
  const red: IMotionCaptureCase.IPerformer = TouchVerdicts.figure(
    shown,
    "b",
    { body },
    0xff0000,
  );
  plain.pose(1.25);
  TestValidator.equals(
    "the drawn figure",
    [plain.id, plain.body === body, asked, plain.color, red.color],
    ["b", true, [["b", 1.25]], undefined, 0xff0000],
  );
}
