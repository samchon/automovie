import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanProp,
  IAutoMovieVector3,
} from "@automovie/interface";
import { everydayPostureCaseObstacle } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/**
 * `everydayPostureCaseObstacle` stages a box to step over with a kerb's
 * contacts: an `edge` along its near top and a `top` face its depth deep, the
 * box turned so its near side faces a performer at the origin facing +Z.
 *
 * A 0.2 m high, 0.3 m deep box whose near side's middle stands at (0, 0, 0.5).
 *
 * Scenarios:
 *
 * 1. In the world the edge runs at (0, 0.2, 0.5), the near top.
 * 2. The top's middle lies at (0, 0.2, 0.65), 0.3 m deep.
 */
export function test_unit_motions_executable_everyday_posture_case_obstacle(): void {
  const box: IAutoMovieMotionHumanProp = everydayPostureCaseObstacle({
    at: { x: 0, y: 0, z: 0.5 },
    height: 0.2,
    depth: 0.3,
  });
  const world = (id: string): IAutoMovieVector3 => {
    const a: IAutoMovieAffordance = box.affordances!.find(
      (c: IAutoMovieAffordance): boolean => c.id === id,
    )!;
    return Vector3.add(
      box.frame.position,
      Quaternion.rotateVector(box.frame.rotation, a.frame.translation),
    );
  };
  TestValidator.predicate(
    "the near top edge and the top's middle",
    vclose(world("edge"), { x: 0, y: 0.2, z: 0.5 }, 1e-12) &&
      vclose(world("top"), { x: 0, y: 0.2, z: 0.65 }, 1e-12) &&
      box.affordances![1]!.depth === 0.3,
  );
}
