import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { martialArt } from "@automovie/motions/internal";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

export async function test_unit_motions_compose_zz_profile(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const t0: number = performance.now();
  const plan = martialArt.plan(
    motionActionContext(body, { kind: "chokuZuki", count: 2 }),
  );
  const t1: number = performance.now();
  for (let i = 0; i <= 30; ++i) plan.posture((plan.duration * i) / 30);
  const t2: number = performance.now();
  const push = martialArt.plan(motionActionContext(body, { kind: "taiChiPush" }));
  const t3: number = performance.now();
  for (let i = 0; i <= 30; ++i) push.posture((push.duration * i) / 30);
  const t4: number = performance.now();
  throw new Error(
    "DBG" +
      JSON.stringify({
        chokuPlan: t1 - t0,
        chokuReads: t2 - t1,
        pushPlan: t3 - t2,
        pushReads: t4 - t3,
        durations: [plan.duration, push.duration],
      }),
  );
}
