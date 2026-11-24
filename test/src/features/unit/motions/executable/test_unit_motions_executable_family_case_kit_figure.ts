import type {
  IAutoMovieHumanCanonicalBody,
  IAutoMoviePose,
} from "@automovie/interface";
import type { IMotionCaptureCase } from "@automovie/motions/internal";
import { FamilyCaseKit } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import type { IHumanFixture } from "../../../internal/fixtures/IHumanFixture";
import { humanFixture } from "../../../internal/fixtures/humanFixture";

/**
 * `FamilyCaseKit.figure` draws a performer: its subject's id, the polygon man's
 * canonical body, its displayed pose read from the performance at each second.
 *
 * Scenarios:
 *
 * 1. The default subject `a` is drawn with the man's body and posed through the
 *    performance at the second asked.
 */
export async function test_unit_motions_executable_family_case_kit_figure(): Promise<void> {
  const fixture: IHumanFixture = await humanFixture("m-average");
  const body: IAutoMovieHumanCanonicalBody.IBody = {
    skeleton: fixture.skeleton,
    profile: fixture.profile,
    joints: [],
  };
  const asked: [string, number][] = [];
  const shown: Pick<Parameters<typeof FamilyCaseKit.figure>[0], "pose"> = {
    pose: (subject: string, seconds: number): IAutoMoviePose => {
      asked.push([subject, seconds]);
      return { skeleton: fixture.skeleton.id, root: null, joints: [] };
    },
  };
  const figure: IMotionCaptureCase.IPerformer = FamilyCaseKit.figure(shown, {
    body,
  });
  figure.pose(0.5);
  TestValidator.equals(
    "the drawn figure",
    [figure.id, figure.body === body, asked],
    ["a", true, [["a", 0.5]]],
  );
}
