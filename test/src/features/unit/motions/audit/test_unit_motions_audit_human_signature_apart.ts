import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSignature,
} from "@automovie/interface";
import { HumanSignature } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { auditStanceMotion } from "../../../internal/auditStanceMotion";
import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";

/** How far apart the two stand at first, metres. */
const APART: number = 2;

/**
 * `HumanSignature.apart` reads the least signed distance from any joint centre
 * of either performer to the other's colliders, negative inside.
 *
 * Scenarios, two average men in the quiet stance, the second along +X:
 *
 * 1. Two metres apart, the distance is positive and less than 2 m: the hands
 *    hang nearer than the hips.
 * 2. In one place, it is negative: the hips lie inside the other's pelvis.
 *
 * The bodies are built whole (`humanFixtureBody`): the distance reads each
 * body's colliders on its displayed bones.
 */
export async function test_unit_motions_audit_human_signature_apart(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const stance = auditStanceMotion(body);
  const motion = (x: number): IAutoMovieMotionHumanSignature.IMotion => {
    const moved = auditStanceMotion(body, { shift: () => ({ x, y: 0, z: 0 }) });
    return {
      duration: 1,
      bones: (subject: string, t: number) =>
        subject === "a" ? stance.bones("a", t) : moved.bones("a", t),
    };
  };
  const distance = (x: number): number =>
    HumanSignature.apart(
      HumanSignature(motion(x), "a", body, 0),
      HumanSignature(motion(x), "b", body, 0),
      0,
    );
  const far: number = distance(APART);
  TestValidator.predicate("apart", far > 0 && far < APART);
  TestValidator.predicate("in one place", distance(0) < 0);
}
