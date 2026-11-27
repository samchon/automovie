import type {
  IAutoMovieMotionHumanLieDown,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { prepareHumanShapeBlend } from "../../posture/internal/prepareHumanShapeBlend";

/*
 * Each key-to-key joint blend of the route (`prepareHumanShapeBlend`), from
 * each key to the next.
 *
 * Part of `lieDown.plan`, which prepares it once per plan.
 * Parameter prepared: What the plan prepared for it.
 * Returns: The plan's `blend`.
 */
export function lieDownBlend(
  prepared: lieDownBlend.IPrepared,
): ((weight: number) => IAutoMovieMotionHumanPosture["joints"])[] {
  const { keys }: lieDownBlend.IPrepared = prepared;
  return keys
    .slice(1)
    .map(
      (
        key: IAutoMovieMotionHumanLieDown.IPose,
        i: number,
      ): ((weight: number) => IAutoMovieMotionHumanPosture["joints"]) =>
        prepareHumanShapeBlend(keys[i]!.joints, key.joints),
    );
}

/*
 * The `blend` of `lieDown.plan`, built from what that plan prepared.
 */
export namespace lieDownBlend {
  /*
   * What `lieDown.plan` prepared for its `blend`.
   */
  export interface IPrepared {
    /*
     * The `keys` `lieDown.plan` prepared.
     */
    keys: IAutoMovieMotionHumanLieDown.IPose[];
  }
}
