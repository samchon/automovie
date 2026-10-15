/**
 * `side-walk`: the service path from the driveway past the garage to the
 * garden lower landing.
 *
 * The long path
 * starts 0.60 m right of the garage outer right face 11.70 and is 1.20 m wide:
 * X = [12.30, 13.50]. The front connector is the 1.20 m band 1.40 m to 0.20 m
 * short of the paving end, Z = [5.10, 6.30], from the driveway's right edge
 * 11.30 to the path; between the driveway and the path's left edge its top
 * blends D(Z) to S linearly in X, and on the path it stays at S. The back
 * cross path runs −Z from the lower landing's outer end, 1.20 m wide, from the
 * landing's left edge to the path. S is the lower landing height, −0.45 m. The
 * three bands form one surface; each area is emitted once. Base 0.12 m.
 */
import { GARAGE_OUTLINE } from "../GARAGE_OUTLINE";
import { DRIVEWAY } from "./DRIVEWAY";
import { LOWER_LANDING } from "./LOWER_LANDING";

const PATH_WIDTH = 1.2;

/** Side path geometry, metres. */
export const SIDE_WALK = {
  x: [GARAGE_OUTLINE.outer.x[1] + 0.6, GARAGE_OUTLINE.outer.x[1] + 0.6 + PATH_WIDTH] as const,
  frontBand: [DRIVEWAY.z[1] - 1.4, DRIVEWAY.z[1] - 0.2] as const,
  backBand: [LOWER_LANDING.z[0] - PATH_WIDTH, LOWER_LANDING.z[0]] as const,
  top: LOWER_LANDING.top,
};

