import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHighFive,
  IAutoMovieMotionMeeting,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  highFive,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { nclose } from "../../../internal/nclose";

/**
 * `highFive.plan` plans one slapper's role on the meeting both roles read: the
 * hand reaches the meeting's `meet` point by its `ready` instant, holds the
 * slap to `relax` and returns.
 *
 * Scenario, the average man standing at the origin facing +Z, his partner `b`
 * standing still 0.9 m ahead facing him, the meeting (as the performance would
 * compute it) putting the hands' contact 0.2 m above his right shoulder and
 * 0.45 m ahead of it, facing back at him, ready at 0.6 s and relaxed at 0.7 s:
 *
 * 1. `relax` follows `ready` by the meeting's 0.1 s.
 * 2. At `ready` the right wrist lies within a hand's length of the contact.
 * 3. The left wrist stays within a centimetre of where it hung.
 *
 * The body is built whole (`humanFixtureBody`).
 */
export async function test_unit_motions_touch_high_five(): Promise<void> {
  // Plans the arm on the whole body: the rig, the arm chains and the pose resolution.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const shoulder: IAutoMovieVector3 = poseBones(
    body,
    resolveHumanPosture(body, stand.posture(body, { x: 0, y: 0, z: 0 }, 0)),
  ).get("rightUpperArm")!.worldPosition;
  const meet: IAutoMovieVector3 = {
    x: shoulder.x,
    y: shoulder.y + 0.2,
    z: shoulder.z + 0.45,
  };
  const met: IAutoMovieMotionMeeting = {
    kind: "highFive-high",
    // The meeting frame at the world origin, unturned: its contacts are world points.
    frame: { origin: { x: 0, y: 0, z: 0 }, yaw: 0 },
    contacts: { meet },
    normals: { meet: { x: 0, y: 0, z: -1 } },
    instants: { ready: 0.6, stroke: 0.6, relax: 0.7 },
    roles: [
      { name: "slapper", subject: "a" },
      { name: "slapper", subject: "b" },
    ],
    solid: true,
  };
  const params: IAutoMovieMotionHumanHighFive.IParams = { partner: "b" };
  const plan: IAutoMovieMotionHumanActionPlan = highFive.plan(
    motionActionContext(body, params, {
      meeting: () => met,
      partners: [
        {
          subject: "b",
          body,
          plan: stand.plan(
            motionActionContext(
              body,
              { hold: 2, sway: 0 },
              { subject: "b", at: { x: 0, y: 0, z: 0.9 }, yaw: 180 },
            ),
          ),
        },
      ],
    }),
  );
  const at = (name: string): number =>
    plan.duration *
    plan.events.find((e: IAutoMovieMotionEvent): boolean => e.name === name)!
      .share;
  TestValidator.predicate(
    "the hold",
    nclose(at("relax") - at("ready"), 0.1, 1e-9),
  );
  const read = (seconds: number) =>
    poseBones(body, resolveHumanPosture(body, plan.posture(seconds)));
  const slapped = read(at("ready"));
  const hung = read(0);
  TestValidator.predicate(
    "on the meeting",
    Vector3.distance(slapped.get("rightHand")!.worldPosition, meet) <=
      body.measure.hand &&
      Vector3.distance(
        slapped.get("leftHand")!.worldPosition,
        hung.get("leftHand")!.worldPosition,
      ) <= 0.01,
  );
}
