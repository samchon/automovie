import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieEnvironmentContribution,
  IAutoMovieEnvironmentModule,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieEnvironment } from "../AutoMovieEnvironment";
import { assembleBuilding } from "./assembleBuilding";
import { buildingPlans } from "./buildingPlans";

/**
 * Prepare a placed building from metre floor plans or an exterior footprint.
 *
 * Drafts and checks its levels once. Each module placement constructs a
 * separately identified building in a world-upright frame. Room anchors are
 * named `<level>/<room>` and openings `<level>/<opening>`, with their +Z
 * pointing from the first room toward the second or outdoors.
 *
 * @param props Floor plans or an exterior shell.
 * @returns A reusable environment module.
 * @throws Error for malformed plans, unresolved openings or non-upright
 *   placements.
 */
export function createBuilding(
  props: AutoMovieEnvironment.IBuildingProps,
): IAutoMovieEnvironmentModule {
  const plan: buildingPlans.IPlan = buildingPlans(props);
  return (
    context: Parameters<IAutoMovieEnvironmentModule>[0],
  ): IAutoMovieEnvironmentContribution => {
    const vertical: IAutoMovieVector3 = Quaternion.rotateVector(
      context.frame.rotation,
      Vector3.create(0, 1, 0),
    );
    if (
      Math.hypot(vertical.x, vertical.y - 1, vertical.z) > 1e-9 ||
      context.frame.scale.x !== 1 ||
      context.frame.scale.y !== 1 ||
      context.frame.scale.z !== 1
    )
      throw new Error(
        `building "${context.id}" requires an upright unit-scale placement`,
      );
    return assembleBuilding(plan, context);
  };
}
