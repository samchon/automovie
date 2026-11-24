import { createLongCane } from "@automovie/archetypes";
import type {
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * The long cane's staging from `test_motion_gait_cane_sweep`, as that spec
 * stages it, so `test_motion_action_pick_up` takes the same fitted cane up from
 * the same place.
 */
export namespace caneSweepScene {
  /** A long cane's model. */
  export type Cane = ReturnType<typeof createLongCane>;

  /**
   * Where the cane stands before it is taken up, beside the right foot, world
   * metres.
   */
  export const STAND: IAutoMovieVector3 = { x: -0.3, y: 0, z: 0.3 };

  /**
   * The cane fitted to the body: the sternum's standing height, the long cane's
   * fitting length, within the archetype's length band.
   *
   * @param body The walker's body.
   * @returns The cane.
   */
  export function fitted(body: IAutoMovieMotionHumanBody): Cane {
    const frame: IAutoMovieHumanoidSurfaces.IFrame =
      body.surfaces.regions.sternum;
    const sternum: number = body.rest.get(frame.bone)!.y + frame.point.y;
    return createLongCane({
      length: Math.min(
        createLongCane.BANDS.length.maximum,
        Math.max(createLongCane.BANDS.length.minimum, sternum),
      ),
    });
  }
}
