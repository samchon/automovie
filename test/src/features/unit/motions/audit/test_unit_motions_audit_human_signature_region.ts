import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanSignature } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { auditStanceMotion } from "../../../internal/auditStanceMotion";
import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { throwsError } from "../../../internal/throwsError";
import { vclose } from "../../../internal/vclose";

/**
 * `HumanSignature.region` places a named body region on the displayed bones,
 * and refuses where the rig lacks the region's bone.
 *
 * Scenarios, the average man's quiet stance facing +Z:
 *
 * 1. The sternum lies on the front of the chest: ahead of the hips, between the
 *    hips' height and the head's.
 * 2. Carried 1 m along +X, it moves 1 m with the body.
 * 3. Without its bone the region is refused.
 *
 * The body is built whole (`humanFixtureBody`): the region reads the body's
 * surface frames.
 */
export async function test_unit_motions_audit_human_signature_region(): Promise<void> {
  // Reads the body's surface frames (`body.surfaces`); the parameter is the whole body record, which has no stored or partial typed form without a cast.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const at = (x: number): IAutoMovieVector3 =>
    HumanSignature.region(
      HumanSignature(
        auditStanceMotion(body, { shift: () => ({ x, y: 0, z: 0 }) }),
        "a",
        body,
        0,
      ),
      "sternum",
      0,
    );
  const sternum: IAutoMovieVector3 = at(0);
  const hips: IAutoMovieVector3 = auditStanceMotion(body)
    .bones("a", 0)
    .get("hips")!.worldPosition;
  TestValidator.predicate(
    "on the chest",
    sternum.z > hips.z &&
      sternum.y > hips.y &&
      sternum.y < body.measure.headHeight,
  );
  TestValidator.predicate(
    "carried",
    vclose(at(1), { ...sternum, x: sternum.x + 1 }, 1e-9),
  );
  TestValidator.predicate(
    "no bone",
    throwsError(() =>
      HumanSignature.region(
        HumanSignature(
          {
            duration: 1,
            bones: () =>
              new Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>(),
          },
          "a",
          body,
          0,
        ),
        "sternum",
        0,
      ),
    ),
  );
}
