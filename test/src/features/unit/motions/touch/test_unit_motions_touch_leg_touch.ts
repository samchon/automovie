import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanLegTouch,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  legTouch,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `legTouch.plan` touches a point with a foot: the leg lifts and the foot comes
 * onto the point by `ready`, the other foot standing.
 *
 * Scenario, the average man standing at the origin facing +Z, touching a floor
 * point 0.3 m ahead of his right foot with it: at `ready` the right ankle lies
 * nearer the point than it stood, within a foot's length of it, and the left
 * ankle has not moved by more than a centimetre.
 *
 * The body is built whole (`humanFixtureBody`).
 */
export async function test_unit_motions_touch_leg_touch(): Promise<void> {
  // Plans the touching leg and the standing one on the whole body.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const context0 = motionActionContext(body, {});
  const foot: IAutoMovieVector3 = context0.entry.feet.right.ankle;
  const point: IAutoMovieVector3 = { x: foot.x, y: 0, z: foot.z + 0.3 };
  const params: IAutoMovieMotionHumanLegTouch.IParams = {
    target: { kind: "point", frame: "world", at: point },
    side: "right",
  };
  const plan: IAutoMovieMotionHumanActionPlan = legTouch.plan(
    motionActionContext(body, params),
  );
  const ready: number =
    plan.duration *
    plan.events.find((e: IAutoMovieMotionEvent): boolean => e.name === "ready")!
      .share;
  const bones = poseBones(body, resolveHumanPosture(body, plan.posture(ready)));
  const right: IAutoMovieVector3 = bones.get("rightFoot")!.worldPosition;
  TestValidator.predicate(
    "the foot on the point",
    Vector3.distance(right, point) < Vector3.distance(foot, point) &&
      Vector3.distance(right, point) <= body.measure.footLength &&
      Vector3.distance(
        bones.get("leftFoot")!.worldPosition,
        context0.entry.feet.left.ankle,
      ) <= 0.01,
  );
}
