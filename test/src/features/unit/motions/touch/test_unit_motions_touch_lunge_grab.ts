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
  HumanRefusal,
  lungeGrab,
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
 * `lungeGrab.plan` lunges toward a partner and grabs a region of theirs: the
 * front foot strides in and the hand closes on the region at `ready`.
 *
 * Scenario, two average men facing 1 m apart, the region within the longest
 * lunge, `a` lunging to grab `b`'s left upper arm with the right hand: at
 * `ready` `a`'s right wrist lies within a hand's length of the region's surface
 * point on `b`'s displayed body, and the root has moved toward `b`.
 *
 * The bodies are built whole (`humanFixtureBody`).
 */ export async function test_unit_motions_touch_lunge_grab(): Promise<void> {
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
  const near: motionActionContext.IPartner = partner(1);
  const plan: IAutoMovieMotionHumanActionPlan = lungeGrab.plan(
    motionActionContext(
      body,
      { partner: "b", region: "upperArmLeft", side: "right" },
      { partners: [near] },
    ),
  );
  const t: number = ready(plan);
  const grabbed = read(plan, t);
  TestValidator.predicate(
    "the grab",
    Vector3.distance(
      grabbed.get("rightHand")!.worldPosition,
      surface(read(near.plan, t), "upperArmLeft"),
    ) <= body.measure.hand && plan.posture(t).root.z > plan.posture(0).root.z,
  );
}
