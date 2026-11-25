import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanClasp,
  handshakeOffer,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";

/**
 * `HumanClasp.choose` turns both shaking hands about their palms' normals, each
 * palm socket on the meeting point, the pair whose open hands keep their
 * phalanges clear of the other's forearm; `HumanClasp.close` closes this
 * person's digits on the chosen clasp.
 *
 * Scenario, two average men facing 0.9 m apart shaking right hands at the point
 * their offering arms meet (`handshakeOffer.point`), `a`'s palm toward his left
 * (+X) and `b`'s toward his (-X), the fingers along the meeting's line:
 *
 * 1. The chosen clasp leaves the open hands clear of the other's forearm: a
 *    positive clearance.
 * 2. `a`'s closed hand moves only his right digits, flexing at least one joint.
 *
 * The body is built whole (`humanFixtureBody`): the fits solve the arm and the
 * digits on the whole body record.
 */
export async function test_unit_motions_handling_human_clasp(): Promise<void> {
  // Fits both arms and curls the digits on the whole body against the other's colliders.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const posture = (z: number, yaw: number): IAutoMovieMotionHumanPosture =>
    stand.posture(body, { x: 0, y: 0, z }, yaw);
  const shoulder = (of: IAutoMovieMotionHumanPosture): IAutoMovieVector3 =>
    poseBones(body, resolveHumanPosture(body, of)).get("rightUpperArm")!
      .worldPosition;
  const mine: IAutoMovieMotionHumanPosture = posture(0, 0);
  const theirs: IAutoMovieMotionHumanPosture = posture(0.9, 180);
  const met: handshakeOffer.IMeeting = handshakeOffer.point(
    { body, shoulder: shoulder(mine) },
    { body, shoulder: shoulder(theirs) },
    "right",
    0,
  );
  const a: HumanClasp.IHand = {
    subject: "a",
    body,
    posture: mine,
    palm: { x: 1, y: 0, z: 0 },
    fingers: met.fingers,
  };
  const b: HumanClasp.IHand = {
    subject: "b",
    body,
    posture: theirs,
    palm: { x: -1, y: 0, z: 0 },
    fingers: Vector3.scale(met.fingers, -1),
  };
  const choice: HumanClasp.IChoice = HumanClasp.choose(
    "right",
    met.point,
    0.03,
    a,
    b,
  );
  TestValidator.predicate("clear of the forearms", choice.clearance > 0);
  const closed = HumanClasp.close("right", choice, a, b);
  const bones: string[] = Object.keys(closed);
  TestValidator.predicate(
    "the right digits close",
    bones.length > 0 &&
      bones.every((bone: string): boolean => bone.startsWith("right")) &&
      Object.values(closed).some(
        (angles: readonly [number, number, number] | undefined): boolean =>
          angles !== undefined && angles[0] > 0,
      ),
  );
}
