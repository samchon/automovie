import { impactRecoil } from "@automovie/engine";
import type {
  IAutoMovieBone,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/predicates";

/**
 * `impactRecoil` spreads a push down a bone chain with the attenuation
 * `falloff`.
 *
 * Rig: `spine` (root) and its child `chest`. Push: flexion 10 degrees.
 *
 * Scenarios:
 *
 * 1. A falloff of 0 pushes only the contact joint: `spine` flexes 10 and `chest`
 *    stays at rest (null).
 * 2. A falloff of 1 preserves the push: both joints flex 10.
 * 3. A falloff of Infinity, -0.1 or 1.1 is refused.
 */
export function test_unit_engine_physics_impact_recoil(): void {
  const rest: IAutoMovieTransform = {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
  const bone = (
    name: IAutoMovieBone["bone"],
    parent: IAutoMovieBone["parent"],
  ): IAutoMovieBone => ({ bone: name, parent, rest, constraint: null });
  const skeleton: IAutoMovieSkeleton = {
    id: "falloff-rig",
    bones: [bone("spine", null), bone("chest", "spine")],
  };
  const stopped = impactRecoil(
    { flexion: 10 },
    ["spine", "chest"],
    skeleton,
    0,
  );
  TestValidator.equals("falloff 0 contact", stopped.joints[0]!.flexion, 10);
  TestValidator.equals("falloff 0 next", stopped.joints[1]!.flexion, null);
  const kept = impactRecoil({ flexion: 10 }, ["spine", "chest"], skeleton, 1);
  TestValidator.equals("falloff 1 contact", kept.joints[0]!.flexion, 10);
  TestValidator.equals("falloff 1 next", kept.joints[1]!.flexion, 10);
  for (const falloff of [Infinity, -0.1, 1.1])
    TestValidator.predicate(
      `falloff ${falloff}`,
      throwsError(() =>
        impactRecoil({ flexion: 10 }, ["spine", "chest"], skeleton, falloff),
      ),
    );
}
