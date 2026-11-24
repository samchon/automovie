import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  headRest,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * How near a touching part comes to the touched skin, metres: a hand's length
 * from the wrist joint to the palm, or 20 mm of skin and tolerance for a
 * surface on a surface (`HumanSignature.CONTACT`).
 */
const CONTACT: number = 0.02;
/**
 * `headRest.plan` rests the head on a partner's region: the cheek comes onto it
 * by `ready` and stays the authored seconds.
 *
 * Scenario, two average men facing 0.35 m apart, `a` resting his head on `b`'s
 * right shoulder for 1 s: at `ready` `a`'s left cheek lies within 20 mm of the
 * shoulder's surface point on `b`'s displayed body.
 *
 * The bodies are built whole (`humanFixtureBody`).
 */ export async function test_unit_motions_touch_head_rest(): Promise<void> {
  // Plans the reach on the whole body and reads the partner's displayed surfaces.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const read = (
    plan: IAutoMovieMotionHumanActionPlan,
    seconds: number,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
    poseBones(body, resolveHumanPosture(body, plan.posture(seconds)));
  const ready = (plan: IAutoMovieMotionHumanActionPlan): number =>
    plan.duration *
    plan.events.find((e: IAutoMovieMotionEvent): boolean => e.name === "ready")!
      .share;
  const surface = (
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    region: AutoMovieHumanoidRegion,
  ): IAutoMovieVector3 => {
    const frame = body.surfaces.regions[region];
    return resolveAutoMovieHumanoidSurfaces.place(frame, bones.get(frame.bone)!)
      .point;
  };
  const partner = (z: number): motionActionContext.IPartner => ({
    subject: "b",
    body,
    plan: stand.plan(
      motionActionContext(
        body,
        { hold: 8, sway: 0 },
        { subject: "b", at: { x: 0, y: 0, z }, yaw: 180 },
      ),
    ),
  });
  // The small woman rests on the average man: her temple near his shoulder.
  const small: IAutoMovieMotionHumanBody = await humanFixtureBody("f-small");
  const near: motionActionContext.IPartner = partner(0.3);
  const plan: IAutoMovieMotionHumanActionPlan = headRest.plan(
    motionActionContext(
      small,
      { partner: "b", region: "shoulderRight", hold: 1 },
      { partners: [near], at: { x: 0.1, y: 0, z: 0 } },
    ),
  );
  const t: number = ready(plan);
  const frame = small.surfaces.regions.templeLeft;
  const temple: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
    frame,
    poseBones(small, resolveHumanPosture(small, plan.posture(t))).get(
      frame.bone,
    )!,
  ).point;
  TestValidator.predicate(
    "on the shoulder",
    Vector3.distance(temple, surface(read(near.plan, t), "shoulderRight")) <=
      CONTACT,
  );
}
