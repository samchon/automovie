import { resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanKiss,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanRefusal,
  kiss,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * How near the kissing lips come to the kissed skin, metres: 20 mm, the skin's
 * 10 mm give plus 10 mm (`HumanSignature.CONTACT`'s bound for a contact).
 */
const CONTACT: number = 0.02;

/**
 * `kiss.plan` brings the lips onto a partner's region: the body rises, leans
 * from the hips and turns the head, the lips meeting the skin as the kiss is
 * held; beyond what that reach can close, the kiss is refused on the region.
 *
 * Scenarios, two average men facing, `b` standing still 0.35 m ahead of `a` (a
 * quiet `stand`):
 *
 * 1. `a` kissing `b`'s right cheek: at `ready` `a`'s mouth lies on the cheek,
 *    within 20 mm of its surface point on `b`'s displayed body.
 * 2. With `b` two statures away the kiss is refused on `region` as a reach.
 *
 * The bodies are built whole (`humanFixtureBody`).
 */
export async function test_unit_motions_touch_kiss(): Promise<void> {
  // Plans the lean and the head on the whole body, and reads the partner's displayed surfaces.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const partner = (z: number): motionActionContext.IPartner => ({
    subject: "b",
    body,
    plan: stand.plan(
      motionActionContext(
        body,
        { hold: 6, sway: 0 },
        { subject: "b", at: { x: 0, y: 0, z }, yaw: 180 },
      ),
    ),
  });
  const params: IAutoMovieMotionHumanKiss.IParams = {
    partner: "b",
    region: "cheekRight",
  };
  const near: motionActionContext.IPartner = partner(0.35);
  const plan: IAutoMovieMotionHumanActionPlan = kiss.plan(
    motionActionContext(body, params, { partners: [near] }),
  );
  const ready: number =
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
  const mine = poseBones(body, resolveHumanPosture(body, plan.posture(ready)));
  const theirs = poseBones(
    body,
    resolveHumanPosture(body, near.plan.posture(ready)),
  );
  const mouth: IAutoMovieVector3 = surface(mine, "mouth");
  const cheek: IAutoMovieVector3 = surface(theirs, "cheekRight");
  TestValidator.predicate(
    "on the cheek",
    Math.hypot(mouth.x - cheek.x, mouth.y - cheek.y, mouth.z - cheek.z) <=
      CONTACT,
  );
  let refused: boolean = false;
  try {
    kiss.plan(
      motionActionContext(body, params, {
        partners: [partner(2 * body.measure.stature)],
      }),
    );
  } catch (error: unknown) {
    refused =
      error instanceof HumanRefusal &&
      error.kind === "reach" &&
      error.axis === "region";
  }
  TestValidator.predicate("beyond reach", refused);
}
