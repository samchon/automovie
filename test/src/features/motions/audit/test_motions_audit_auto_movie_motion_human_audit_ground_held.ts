import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditGround,
  HumanFoot,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { vclose } from "../../internal/vclose";

/** Rounding of a rotation and a sum, metres. */
const ROUNDING: number = 1e-12;

/**
 * `AutoMovieMotionHumanAuditGround.held` names a planted foot's contact: a
 * declared rest-frame point placed by the displayed foot bone (`position +
 * rotation * point`, keyed `contact`), a declared sole socket, or else the
 * lowest sole socket, the heel winning a tie within a micrometre.
 *
 * Scenarios, the average man's quiet stance:
 *
 * 1. A declared point 0.1 m ahead of and 0.05 m below the left ankle is placed by
 *    the left foot's displayed frame.
 * 2. A declared ball is the ball socket.
 * 3. Undeclared, the contact is a sole socket no higher than any other within a
 *    micrometre.
 *
 * The body is built whole (`humanFixtureBody`): the sole sockets are placed on
 * the body's displayed foot bones.
 */
export async function test_motions_audit_auto_movie_motion_human_audit_ground_held(): Promise<void> {
  // Reads the body's foot sole geometry (`HumanFoot.sockets`); the parameter is the whole body record, which has no stored or partial typed form without a cast.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    resolveHumanPosture(body, stand.posture(body, { x: 0, y: 0, z: 0 }, 0)),
  );
  const foot: IAutoMovieResolvedBone = bones.get("leftFoot")!;
  const declared: IAutoMovieVector3 = { x: 0, y: -0.05, z: 0.1 };
  const point: AutoMovieMotionHumanAuditGround.IHeld =
    AutoMovieMotionHumanAuditGround.held(body, bones, "left", declared);
  TestValidator.predicate(
    "a declared point",
    point.key === "contact" &&
      vclose(
        point.point,
        Vector3.add(
          foot.worldPosition,
          Quaternion.rotateVector(foot.worldRotation, declared),
        ),
        ROUNDING,
      ),
  );
  const sole: IAutoMovieMotionHumanFoot.ISocket[] = HumanFoot.sockets(
    body,
    bones,
    "left",
  );
  const ball: AutoMovieMotionHumanAuditGround.IHeld =
    AutoMovieMotionHumanAuditGround.held(body, bones, "left", "ball");
  TestValidator.predicate(
    "a declared ball",
    ball.key === "ball" &&
      vclose(
        ball.point,
        sole.find(
          (s: IAutoMovieMotionHumanFoot.ISocket): boolean =>
            s.socket === "ball",
        )!.point,
        ROUNDING,
      ),
  );
  const lowest: AutoMovieMotionHumanAuditGround.IHeld =
    AutoMovieMotionHumanAuditGround.held(body, bones, "left", undefined);
  TestValidator.predicate(
    "the lowest socket",
    sole.some(
      (s: IAutoMovieMotionHumanFoot.ISocket): boolean =>
        s.socket === lowest.key,
    ) &&
      sole.every(
        (s: IAutoMovieMotionHumanFoot.ISocket): boolean =>
          lowest.point.y <= s.point.y + 1e-6,
      ),
  );
}
