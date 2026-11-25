import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditMeasure,
  IAutoMovieMotionHumanBody,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import { AutoMovieMotionHumanAuditBalance } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { auditStanceMotion } from "../../internal/auditStanceMotion";
import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";

/** How far the body above the feet is carried forward, metres. */
const LEAN: number = 0.5;

/**
 * `AutoMovieMotionHumanAuditBalance.measure` reads how far the extrapolated
 * centre of mass (Hof, Gazendam and Sinke 2005) leaves the hull of both feet
 * over the instants both planted feet alone bear the body, inside an action
 * whose balance it judges.
 *
 * Scenarios, the average man's quiet stance for 1 s, both feet planted:
 *
 * 1. Judged and still, the centre stays over the feet: nothing is read.
 * 2. Judged, with every bone but the feet and toes carried 0.5 m forward, the
 *    centre lies ahead of the toes: more than nothing outside the hull, and
 *    less than the 0.5 m it was carried, from which the heel-to-ankle half of
 *    the hull's length at least is taken back.
 * 3. The same pose in an action whose balance is not judged is not read.
 *
 * The body is built whole (`humanFixtureBody`): the reading places the body's
 * mass model and its soles on the displayed bones.
 */
export async function test_motions_audit_auto_movie_motion_human_audit_balance_measure(): Promise<void> {
  // Reads the whole-body centre of mass (`body.massModel`, every segment's mass) and the soles.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const leaned = (
    still: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
    new Map(
      [...still].map(
        ([name, bone]: [AutoMovieHumanoidBone, IAutoMovieResolvedBone]): [
          AutoMovieHumanoidBone,
          IAutoMovieResolvedBone,
        ] => [
          name,
          /(Foot|Toes)$/.test(name)
            ? bone
            : {
                ...bone,
                worldPosition: Vector3.add(bone.worldPosition, {
                  x: 0,
                  y: 0,
                  z: LEAN,
                }),
              },
        ],
      ),
    );
  const read = (
    physical: boolean,
    lean: boolean,
  ): IAutoMovieMotionHumanAuditMeasure =>
    AutoMovieMotionHumanAuditBalance.measure(
      auditStanceMotion(body, {
        physical,
        contacts: auditStanceMotion.plants(),
        ...(lean ? { pose: leaned } : {}),
      }),
      "a",
      body,
      4,
    );
  TestValidator.equals("still", read(true, false).value, 0);
  const forward: IAutoMovieMotionHumanAuditMeasure = read(true, true);
  TestValidator.predicate(
    "carried forward",
    forward.value > 0 && forward.value < LEAN - body.measure.footLength / 4,
  );
  TestValidator.equals("not judged", read(false, true).value, 0);
}
