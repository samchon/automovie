import { createAxillaryCrutch } from "@automovie/archetypes";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCrutchSit,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSeated,
} from "@automovie/interface";
import { AutoMovieMotionHumanSeat, HumanObject } from "@automovie/motions";
import { HumanCrutchSit } from "@automovie/motions/internal";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

export async function test_unit_motions_compose_zz_probe(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const height: number = AutoMovieMotionHumanSeat.seated.popliteal(body);
  const half: number =
    body.measure.hipHalfWidth + body.measure.thighRadius + 0.05;
  const seat: IAutoMovieMotionHumanSeated.ISeat = {
    at: { x: 0, y: height, z: 0.15 },
    yaw: 180,
    depth: 0.45,
    back: 0.5,
    armrests: {
      left: { x: -half, y: height + 0.2, z: 0.4 },
      right: { x: half, y: height + 0.2, z: 0.4 },
    },
  };
  const params: IAutoMovieMotionHumanCrutchSit = {
    left: "leftCrutch",
    right: "rightCrutch",
    injured: "left",
    seat,
  };
  const props: IAutoMovieMotionHumanProp[] = (["left", "right"] as const).map(
    (side: AutoMovieHumanSide): IAutoMovieMotionHumanProp => {
      const local: number =
        body.rest.get(`${side}Foot`)!.x + (side === "left" ? 0.15 : -0.15);
      return HumanObject.prop(
        side === "left" ? "leftCrutch" : "rightCrutch",
        createAxillaryCrutch({ length: 0.77 * body.measure.stature }),
        { at: { x: -local, y: 0, z: -0.15 }, yaw: 180 },
      );
    },
  );
  const t0: number = performance.now();
  let result: string = "ok";
  try {
    HumanCrutchSit.plan(motionActionContext(body, params, { props, yaw: 180 }));
  } catch (error) {
    result = String(error).slice(0, 300);
  }
  throw new Error(
    "DBG" + JSON.stringify([result, Math.round(performance.now() - t0)]),
  );
}
