import type { IAutoMovieMotionHumanBody, IAutoMovieMotionHumanMartialArt } from "@automovie/interface";
import { martialArt } from "@automovie/motions/internal";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

export async function test_unit_motions_compose_zz_probe(): Promise<void> {
  const out: unknown[] = [];
  for (const [name, lead] of [["f-small", "right"], ["m-average", "left"]] as const) {
    const body: IAutoMovieMotionHumanBody = await humanFixtureBody(name);
    for (const kind of ["karateStanceTransfer", "taekwondoStanceReset"] as const) {
      const params: IAutoMovieMotionHumanMartialArt.IParams = { kind, lead, hold: 0.24 };
      const t0: number = performance.now();
      try {
        const plan = martialArt.plan(motionActionContext(body, params, { seed: "same-camera-forms", subject: "form" }));
        out.push([name, kind, "ok", plan.duration, Math.round(performance.now() - t0)]);
      } catch (error) {
        out.push([name, kind, String(error).slice(0, 260), Math.round(performance.now() - t0)]);
      }
    }
  }
  throw new Error("DBG" + JSON.stringify(out));
}