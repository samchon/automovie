import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditTangle,
  IAutoMovieMotionHumanBody,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditTangle,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";

/**
 * `AutoMovieMotionHumanAuditTangle.across` lists every segment of one body
 * that passes into a segment of another in one pose, at its full depth, since
 * two bodies share no joint and no rest pose.
 *
 * Scenarios, two average men in the quiet stance:
 *
 * 1. Two metres apart, nothing passes.
 * 2. In one place, the trunks pass into each other: the hips are among the
 *    parts read, every depth positive, each pair read at second 0.
 *
 * The bodies are built whole (`humanFixtureBody`): the reading places the
 * tangle model's probes and colliders on the displayed bones.
 */
export async function test_unit_motions_audit_auto_movie_motion_human_audit_tangle_across(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const still: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    resolveHumanPosture(body, stand.posture(body, { x: 0, y: 0, z: 0 }, 0)),
  );
  const away: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map(
    [...still].map(
      ([name, bone]: [AutoMovieHumanoidBone, IAutoMovieResolvedBone]): [
        AutoMovieHumanoidBone,
        IAutoMovieResolvedBone,
      ] => [
        name,
        {
          ...bone,
          worldPosition: Vector3.add(bone.worldPosition, { x: 2, y: 0, z: 0 }),
        },
      ],
    ),
  );
  TestValidator.equals(
    "apart",
    AutoMovieMotionHumanAuditTangle.across(body, still, body, away),
    [],
  );
  const met: IAutoMovieMotionHumanAuditTangle.IPair[] =
    AutoMovieMotionHumanAuditTangle.across(body, still, body, still);
  TestValidator.predicate(
    "in one place",
    met.some(
      (pair: IAutoMovieMotionHumanAuditTangle.IPair): boolean =>
        pair.a === "hips",
    ) &&
      met.every(
        (pair: IAutoMovieMotionHumanAuditTangle.IPair): boolean =>
          pair.depth > 0 && pair.seconds === 0,
      ),
  );
}
