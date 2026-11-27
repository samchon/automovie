import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditTangle
} from "../../../../../packages/motions/src/audit/internal/AutoMovieMotionHumanAuditTangle";
import {
  poseBones
} from "../../../../../packages/motions/src/posture/internal/poseBones";
import {
  resolveHumanPosture
} from "../../../../../packages/motions/src/posture/internal/resolveHumanPosture";
import {
  stand
} from "../../../../../packages/motions/src/actions/internal/stand";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";

/** The forearm and the hand with its fingers, which move as one. */
const FOREARM: RegExp = /^left(LowerArm|Hand|Thumb|Index|Middle|Ring|Little)/;

/**
 * `AutoMovieMotionHumanAuditTangle.arm` scores how far one arm's probes lie
 * inside the rest of the body beyond their depths at rest and in the quiet
 * stance, in degrees of the shoulder's turn, so a law that keeps an arm clear
 * keeps it clear by the tangle audit's measure.
 *
 * Scenarios, the average man:
 *
 * 1. In the quiet stance each arm scores 0.
 * 2. With the left forearm and hand carried so the wrist lies at the chest's
 *    joint, inside the trunk, the left arm scores more than 0 and the right arm
 *    still 0.
 *
 * The body is built whole (`humanFixtureBody`): the score reads the body's
 * tangle model and colliders on the posed bones.
 */
export async function test_motions_audit_auto_movie_motion_human_audit_tangle_arm(): Promise<void> {
  // Reads every segment's colliders and tangle probes (`body.tangle`), a whole-body read.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const still: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    resolveHumanPosture(body, stand.posture(body, { x: 0, y: 0, z: 0 }, 0)),
  );
  TestValidator.equals(
    "the quiet stance",
    [
      AutoMovieMotionHumanAuditTangle.arm(body, still, "left"),
      AutoMovieMotionHumanAuditTangle.arm(body, still, "right"),
    ],
    [0, 0],
  );
  const by: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
    still.get("chest")!.worldPosition,
    still.get("leftHand")!.worldPosition,
  );
  const inside: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map(
    [...still].map(
      ([name, bone]: [AutoMovieHumanoidBone, IAutoMovieResolvedBone]): [
        AutoMovieHumanoidBone,
        IAutoMovieResolvedBone,
      ] => [
        name,
        FOREARM.test(name)
          ? { ...bone, worldPosition: AutoMovieEngineVector3.add(bone.worldPosition, by) }
          : bone,
      ],
    ),
  );
  TestValidator.predicate(
    "the wrist in the chest",
    AutoMovieMotionHumanAuditTangle.arm(body, inside, "left") > 0 &&
      AutoMovieMotionHumanAuditTangle.arm(body, inside, "right") === 0,
  );
}
