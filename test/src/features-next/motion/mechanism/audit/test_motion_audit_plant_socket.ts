import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditGround,
  HumanFoot,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { motionHumanStance } from "../../../../features/internal/motionHumanStance";
import { nclose } from "../../../../features/internal/nclose";

/** The heel's rise over the second, degrees of foot pitch about the ball. */
const RISE: number = 30;

/** How far the sliding ball travels forward over the second, metres. */
const SLIDE: number = 0.03;

/**
 * The slip audit reads a planted foot at the point its window declares held
 * (`IAutoMovieMotionHumanContactWindow.socket`), and at its lowest sole
 * socket otherwise.
 *
 * The right foot (with its toes, rigidly) rises 30 degrees about its ball's
 * floor point over one second; in the sliding case the ball also travels
 * 30 mm forward.
 *
 * Scenarios:
 * 1. The ball declared held by name: no slip.
 * 2. The same ball declared as the leg goal's rest-frame contact: no slip.
 * 3. The ball declared held while it slides 30 mm: a 30 mm slip, by name and by rest-frame contact.
 * 4. Control: with no declared socket, the toe tip rolling under the held ball reads as a slip.
 *
 * @evidence contracts/development/testing.md#behavioral-verification The slip reading on a heel rise about a held ball, with and without the declared point.
 * @evidence contracts/development/testing.md#independent-expectations The rise and the 30 mm slide are written into the bones in closed form; the expected slips are zero and 30 mm.
 * @evidence contracts/development/testing.md#distinguishing-cases A held ball against a sliding one, and the declared point against the lowest socket.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public audit directly on hand-made motions in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States each scenario and its expected value.
 */
export function test_motion_audit_plant_socket(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const stance: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    motionHumanStance(body);
  const ball: IAutoMovieVector3 = HumanFoot.sockets(body, stance, "right").find(
    (socket: IAutoMovieMotionHumanFoot.ISocket): boolean =>
      socket.socket === "ball",
  )!.point;
  const foot: IAutoMovieResolvedBone = stance.get("rightFoot")!;
  const contact: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.inverse(foot.worldRotation),
    Vector3.subtract(ball, foot.worldPosition),
  );
  const rising =
    (slide: number): IAutoMovieMotionHumanAuditMotion["bones"] =>
    (
      _subject: string,
      seconds: number,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
      // Heel up is toes down: a turn about the foot's lateral axis (+X at
      // the stance's zero heading).
      const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
        { x: 1, y: 0, z: 0 },
        RISE * seconds,
      );
      const by: IAutoMovieVector3 = { x: 0, y: 0, z: slide * seconds };
      const out: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map();
      for (const [bone, resolved] of stance) {
        if (!bone.startsWith("rightFoot") && !bone.startsWith("rightToes")) {
          out.set(bone, resolved);
          continue;
        }
        out.set(bone, {
          ...resolved,
          worldPosition: Vector3.add(
            Vector3.add(
              ball,
              Quaternion.rotateVector(
                turn,
                Vector3.subtract(resolved.worldPosition, ball),
              ),
            ),
            by,
          ),
          worldRotation: Quaternion.multiply(turn, resolved.worldRotation),
        });
      }
      return out;
    };
  const motion = (
    slide: number,
    socket?: IAutoMovieMotionHumanContactWindow.Socket,
  ): IAutoMovieMotionHumanAuditMotion => ({
    duration: 1,
    segments: (): readonly IAutoMovieMotionHumanAuditMotion.ISpan[] => [
      {
        name: "rise",
        start: 0,
        entryTime: 0,
        end: 1,
        plan: {
          duration: 1,
          contacts: [
            {
              part: "rightFoot",
              kind: "plant",
              from: 0,
              to: 1,
              support: { kind: "ground" },
              ...(socket === undefined ? {} : { socket }),
            },
          ],
        },
      },
    ],
    bones: rising(slide),
  });
  const slip = (
    slide: number,
    socket?: IAutoMovieMotionHumanContactWindow.Socket,
  ): number =>
    AutoMovieMotionHumanAuditGround.slip(motion(slide, socket), "a", body)
      .value;

  // 1. and 2. A heel rising about its held ball.
  TestValidator.predicate(
    "a heel rising about its declared ball does not slip",
    slip(0, "ball") < 1e-9,
  );
  TestValidator.predicate(
    "a heel rising about its declared rest-frame contact does not slip",
    slip(0, contact) < 1e-9,
  );

  // 3. The held ball sliding.
  TestValidator.predicate(
    "a declared ball that slides slips by its travel",
    nclose(slip(SLIDE, "ball"), SLIDE, 1e-9),
  );
  TestValidator.predicate(
    "a declared rest-frame contact that slides slips by its travel",
    nclose(slip(SLIDE, contact), SLIDE, 1e-9),
  );

  // 4. Control: the lowest socket rolls.
  TestValidator.predicate(
    "with no declared point the toe tip's roll reads as a slip",
    slip(0) > 1e-3,
  );
}
