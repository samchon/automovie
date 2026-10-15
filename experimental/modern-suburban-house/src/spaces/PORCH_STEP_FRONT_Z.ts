import { STEP_TREAD } from "./STEP_TREAD";
import { PORCH_STEP_BACK_Z } from "./PORCH_STEP_BACK_Z";

/** World z of the porch steps' front edge, two treads ahead of the back. */
export const PORCH_STEP_FRONT_Z = PORCH_STEP_BACK_Z + 2 * STEP_TREAD;
