import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionContactArmFixture as fixture } from "../internal/motionContactArmFixture";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanLaw } from "../internal/motionHumanLaw";

/**
 * Two differently proportioned performers observe the same moving handshake through contact and release.
 *
 * Scenarios:
 * 1. Align the shoulders of an unequal pair at the original 0.729 m separation.
 * 2. Compare right-hand grip sites at clasp, mid-hold and release, and confirm the hands part again.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Two differently proportioned performers observe the same moving handshake through contact and release.
 * @evidence contracts/development/testing.md#independent-expectations Each grip uses its own skeleton, bone transform and hand socket. Agreement is measured in world metres, without using the planner's intended meeting point.
 * @evidence contracts/development/testing.md#distinguishing-cases Align the shoulders of an unequal pair at the original 0.729 m separation. Compare right-hand grip sites at clasp, mid-hold and release, and confirm the hands part again.
 * @evidence contracts/development/testing.md#execution-ownership Runs the named public operation in memory and samples its observable outputs.
 * @evidence contracts/development/common.md#meaningful-documentation States the phase, coordinate frame and quantitative basis of the check.
 */
export function test_motion_contact_partner_observation(): void {
  const a: IAutoMovieMotionHumanBody = motionHumanBody("f-small");
  const b: IAutoMovieMotionHumanBody = motionHumanBody("m-large");
  const at = (body: IAutoMovieMotionHumanBody): IAutoMovieVector3 =>
    poseBones(
      body,
      resolveHumanPosture(body, stand.posture(body, { x: 0, y: 0, z: 0 }, 0)),
    ).get("rightUpperArm")!.worldPosition;
  const sa: IAutoMovieVector3 = at(a);
  const sb: IAutoMovieVector3 = at(b);
  const film: motionHumanLaw.IFilm = motionHumanLaw.perform(
    "shake",
    [
      { subject: "a", body: a },
      {
        subject: "b",
        body: b,
        at: { x: sa.x + sb.x, y: 0, z: sa.z + sb.z + 0.729 },
        yaw: 180,
      },
    ],
    HumanChain.pair(HumanChain.subject("a"), HumanChain.subject("b")).handshake(
      { pumps: 2 },
    ),
  );
  const closed: number = motionHumanLaw.event(film, "gripClosed");
  const release: number = motionHumanLaw.event(film, "release");
  const hand: RegExp = /^right(Hand|Thumb|Index|Middle|Ring|Little)/;
  const gap = (t: number): number =>
    fixture.separation(
      a,
      film.bones("a", t),
      hand,
      b,
      film.bones("b", t),
      hand,
    );
  const all: motionComplaints.IGatherer = motionComplaints();
  all.check("the hands begin apart", gap(0) > 0.01);
  for (const t of [closed, (closed + release) / 2, release])
    all.check(
      `the two displayed hand skins at ${t} s are ${gap(t)} m apart`,
      Math.abs(gap(t)) <= 0.01,
    );
  all.check(
    "the released hands leave the shared grip",
    gap(film.duration) > 0.01,
  );
  all.assert("a handshake follows the partner throughout its hold");
}
