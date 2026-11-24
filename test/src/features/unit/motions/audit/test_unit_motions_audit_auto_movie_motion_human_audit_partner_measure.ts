import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanAuditPartner,
  IAutoMovieMotionHumanBody,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditPartner,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";

/**
 * How deep a body standing in another's place passes into it, at least,
 * metres: a quarter of the chest's depth, half the depth a probe on one trunk's
 * surface lies inside the other's coinciding trunk at its centre line.
 *
 * @param body The body.
 * @returns Metres.
 */
const deep = (body: IAutoMovieMotionHumanBody): number =>
  body.measure.chestDepth / 4;

/**
 * `AutoMovieMotionHumanAuditPartner.measure` reads how deep two people pass
 * into each other, both directions at every grid instant, every pair at its
 * full depth.
 *
 * Scenarios, two average men in the quiet stance for 1 s:
 *
 * 1. Two metres apart, nothing passes: zero at `none` and no pairs.
 * 2. One walks into the other's place at 1 m/s from 1 m away: by the end they
 *    stand in one place and pass deeper than a quarter of the chest's depth,
 *    read within the last quarter second, with the deepest pair first.
 *
 * The bodies are built whole (`humanFixtureBody`): the reading places their
 * colliders and the tangle model's probes on the displayed bones.
 */
export async function test_unit_motions_audit_auto_movie_motion_human_audit_partner_measure(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const still: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    resolveHumanPosture(body, stand.posture(body, { x: 0, y: 0, z: 0 }, 0)),
  );
  const motion = (x: (t: number) => number): IAutoMovieMotionHumanAuditMotion => ({
    duration: 1,
    segments: () => [],
    bones: (subject: string, t: number) =>
      subject === "a"
        ? still
        : new Map(
            [...still].map(
              ([name, bone]: [
                AutoMovieHumanoidBone,
                IAutoMovieResolvedBone,
              ]): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [
                name,
                {
                  ...bone,
                  worldPosition: Vector3.add(bone.worldPosition, {
                    x: x(t),
                    y: 0,
                    z: 0,
                  }),
                },
              ],
            ),
          ),
  });
  const a: IAutoMovieMotionHumanAuditPartner.IPerson = { subject: "a", body };
  const b: IAutoMovieMotionHumanAuditPartner.IPerson = { subject: "b", body };
  TestValidator.equals(
    "apart",
    AutoMovieMotionHumanAuditPartner.measure(motion(() => 2), a, b, 4),
    { worst: { value: 0, seconds: 0, where: "none" }, pairs: [] },
  );
  const met: IAutoMovieMotionHumanAuditPartner.IResult =
    AutoMovieMotionHumanAuditPartner.measure(
      motion((t: number): number => 1 - t),
      a,
      b,
      4,
    );
  TestValidator.predicate(
    "in one place",
    met.worst.value > deep(body) &&
      met.worst.seconds >= 0.75 &&
      met.pairs[0]!.depth === met.worst.value,
  );
}
