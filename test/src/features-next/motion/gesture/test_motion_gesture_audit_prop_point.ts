import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanAuditGround } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionAuditMoved } from "../../../features/internal/motionAuditMoved";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionHumanStance } from "../../../features/internal/motionHumanStance";
import { nclose } from "../../../features/internal/nclose";

/** The crank's radius, metres. */
const CRANK: number = 0.17;

/** Where the pedal stands on its crank over the second, a half turn: the pedal's offset from its start, world metres. */
const pedal = (seconds: number): IAutoMovieVector3 => ({
  x: 0,
  y: CRANK * (1 - Math.cos(Math.PI * seconds)),
  z: CRANK * Math.sin(Math.PI * seconds),
});

/**
 * A plant on a prop's named point (`IAutoMovieMotionHumanContactWindow`'s
 * prop `point`) is read in that point's frame, so a foot on a turning pedal
 * holds its place on the pedal while the prop itself stands still.
 *
 * The right foot rides a pedal a half turn round a 0.17 m crank over one
 * second; the bike's own frame does not move.
 *
 * Scenarios:
 * 1. The foot planted on the pedal's point reads no slip.
 * 2. Control: the same foot planted on the bike as a whole slips by the pedal's greatest horizontal travel, the crank's radius at the quarter turn.
 *
 * @evidence contracts/development/testing.md#behavioral-verification The slip reading of a plant on a moving part, with and without the part named.
 * @evidence contracts/development/testing.md#independent-expectations The pedal's half turn is written into the bones and the support in closed form; the expected slips are zero and the crank's radius.
 * @evidence contracts/development/testing.md#distinguishing-cases The point named against the whole prop.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public audit directly on hand-made motions in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States each scenario and its expected value.
 */
export function test_motion_gesture_audit_prop_point(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const stance = motionHumanStance(body);
  const motion = (
    support: IAutoMovieMotionHumanContactWindow.Support,
  ): IAutoMovieMotionHumanAuditMotion => ({
    ...motionAuditMoved(
      stance,
      1,
      (bone: AutoMovieHumanoidBone, seconds: number): IAutoMovieVector3 =>
        bone.startsWith("rightFoot") || bone.startsWith("rightToes")
          ? pedal(seconds)
          : { x: 0, y: 0, z: 0 },
      [
        {
          name: "pedal",
          start: 0,
          entryTime: 0,
          end: 1,
          plan: {
            duration: 1,
            contacts: [
              { part: "rightFoot", kind: "plant", from: 0, to: 1, support },
            ],
          },
        },
      ],
    ),
    support: (
      on: IAutoMovieMotionHumanContactWindow.Support,
      seconds: number,
    ): IAutoMovieRigidTransform => ({
      position:
        on.kind === "prop" && on.point === "pedalRight"
          ? pedal(seconds)
          : { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    }),
  });

  // 1. On the pedal.
  TestValidator.predicate(
    "a foot planted on the turning pedal does not slip",
    AutoMovieMotionHumanAuditGround.slip(
      motion({ kind: "prop", subject: "bike", point: "pedalRight" }),
      "a",
      body,
    ).value < 1e-9,
  );

  // 2. On the bike as a whole.
  TestValidator.predicate(
    "the same foot planted on the bike slips by the pedal's horizontal travel",
    nclose(
      AutoMovieMotionHumanAuditGround.slip(
        motion({ kind: "prop", subject: "bike" }),
        "a",
        body,
      ).value,
      CRANK,
      1e-6,
    ),
  );
}
