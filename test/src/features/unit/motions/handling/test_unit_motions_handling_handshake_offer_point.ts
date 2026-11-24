import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanRefusal,
  handshakeOffer,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";

/** Rounding of a bisection on the elbows' meeting, metres. */
const ROUNDING: number = 1e-6;

/**
 * `handshakeOffer.point` finds where two offering right hands meet: the point
 * both forearms reach from the elbows of the offering arms. Partners of one
 * size meet with both arms in one shape, so their point lies midway between the
 * acting shoulders across the gap, below them; partners too far apart for any
 * shape are refused on `partner`.
 *
 * Scenarios, two average men facing, their right shoulders read on their quiet
 * stances:
 *
 * 1. 0.9 m apart: the point lies midway between the right shoulders in the floor
 *    plan, below their height, and the same whichever partner comes first.
 * 2. 3 m apart: refused on `partner`.
 *
 * The body is built whole (`humanFixtureBody`): the forearm's length is read to
 * the palm socket on the body's hand.
 */
export async function test_unit_motions_handling_handshake_offer_point(): Promise<void> {
  // Reads the palm socket of the hand (`HumanHand.offset`); the parameter is the whole body record.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const shoulder = (z: number, yaw: number): IAutoMovieVector3 =>
    poseBones(
      body,
      resolveHumanPosture(body, stand.posture(body, { x: 0, y: 0, z }, yaw)),
    ).get("rightUpperArm")!.worldPosition;
  const a: handshakeOffer.ISide = { body, shoulder: shoulder(0, 0) };
  const near: handshakeOffer.ISide = { body, shoulder: shoulder(0.9, 180) };
  const met: handshakeOffer.IMeeting = handshakeOffer.point(
    a,
    near,
    "right",
    0,
  );
  const back: handshakeOffer.IMeeting = handshakeOffer.point(
    near,
    a,
    "right",
    0,
  );
  TestValidator.predicate(
    "midway, below the shoulders",
    Math.abs(met.point.x - (a.shoulder.x + near.shoulder.x) / 2) <= ROUNDING &&
      Math.abs(met.point.z - (a.shoulder.z + near.shoulder.z) / 2) <=
        ROUNDING &&
      met.point.y < a.shoulder.y &&
      Math.hypot(
        met.point.x - back.point.x,
        met.point.y - back.point.y,
        met.point.z - back.point.z,
      ) <= ROUNDING,
  );
  let refused: boolean = false;
  try {
    handshakeOffer.point(a, { body, shoulder: shoulder(3, 180) }, "right", 0);
  } catch (error: unknown) {
    refused = error instanceof HumanRefusal && error.axis === "partner";
  }
  TestValidator.predicate("too far apart", refused);
}
