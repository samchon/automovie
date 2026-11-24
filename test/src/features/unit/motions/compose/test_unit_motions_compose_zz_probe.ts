import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { martialArt } from "@automovie/motions/internal";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

export async function test_unit_motions_compose_zz_probe(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  martialArt.plan(motionActionContext(body, { kind: "chokuZuki" }, { subject: "form" }));
}