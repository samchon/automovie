import { type AutoMovieArchetype, createNecklace } from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type { IAutoMovieRigidTransform } from "@automovie/interface";

/**
 * The neck loop's staging from `test_motion_get_dressed_place_over_head`, as
 * that spec stages it, so `test_motion_action_pick_up` takes the loop up from
 * the same stand by the same handle.
 */
export namespace placeOverHeadScene {
  /**
   * How the partner waits for the loop: seated facing the dresser, seated
   * facing away, or standing facing the dresser.
   */
  export type Pose = "front" | "behind" | "stand";

  /** A neck loop model. */
  export type Loop = AutoMovieArchetype<
    createNecklace.Affordance,
    createNecklace.Dimension
  >;

  /**
   * The loop on its stand at the dresser's right, laid as it will be worn, as
   * the original places it.
   *
   * @param pose How the partner waits.
   * @returns The loop's frame on its stand.
   */
  export function stand(pose: Pose): IAutoMovieRigidTransform {
    return {
      position: { x: -0.3, y: 1.0, z: 0.05 },
      rotation:
        pose === "behind"
          ? Quaternion.identity()
          : Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 180),
    };
  }

  /**
   * The handle the right hand takes the loop by, as the original takes it.
   *
   * @param pose How the partner waits.
   * @returns The handle.
   */
  export function handle(pose: Pose): string {
    return pose === "behind" ? "holdRight" : "holdLeft";
  }
}
