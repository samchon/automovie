import type { IAutoMovieQuaternion } from "@automovie/interface";

/**
 * The original module-owned identity quaternion shared by drawing placements and boundary faces.
 */
export const DRAWING_FIXTURE_NO_ROTATION: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
