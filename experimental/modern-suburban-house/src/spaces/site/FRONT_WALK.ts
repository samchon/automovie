/**
 * `front-walk`: the walk from the porch steps to the paving end, and its cross
 * connector to the driveway.
 *
 * Width and
 * centre X follow the porch stair: X = [0.15, 1.65]. It starts at the first
 * porch riser Z = 2.80 (two 0.30 m treads in front of the porch edge 2.20) and
 * runs to the paving end Z = 6.50, level at the front walk datum −0.45 m, so it
 * contains the 1.20 m lower waiting in front of the steps. The cross connector
 * is Z = [4.25, 5.45] from the walk's right edge X = 1.65 to the driveway's left
 * edge X = 5.90, its top blending the walk height to D(Z) linearly in X. Base
 * 0.12 m (01-paving-support).
 */
import { DRIVEWAY } from "./DRIVEWAY";
import {
  PORCH_STEP_HALF_WIDTH,
} from "../PORCH_STEP_HALF_WIDTH";
import { PORCH_STEP_FRONT_Z } from "../PORCH_STEP_FRONT_Z";
import { PORCH_STEP_CENTRE_X } from "../PORCH_STEP_CENTRE_X";

/** Front walk extent, metres. */
export const FRONT_WALK = {
  x: [PORCH_STEP_CENTRE_X - PORCH_STEP_HALF_WIDTH, PORCH_STEP_CENTRE_X + PORCH_STEP_HALF_WIDTH] as const,
  z: [PORCH_STEP_FRONT_Z, DRIVEWAY.z[1]] as const,
  connectorZ: [4.25, 5.45] as const,
};

