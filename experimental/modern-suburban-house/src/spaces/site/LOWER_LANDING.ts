import { TERRACE_EDGE_Z } from "./TERRACE_EDGE_Z";
import { TERRACE_STEP_X } from "./TERRACE_STEP_X";
import { TERRACE_LOW } from "./TERRACE_LOW";
import { TERRACE_TREAD } from "./TERRACE_TREAD";
import { TERRACE_RISERS } from "./TERRACE_RISERS";

/** Lower landing extent, metres. */

export const LOWER_LANDING = {
  x: TERRACE_STEP_X,
  z: [TERRACE_EDGE_Z - (TERRACE_RISERS - 1) * TERRACE_TREAD - 1.2, TERRACE_EDGE_Z - (TERRACE_RISERS - 1) * TERRACE_TREAD] as const,
  top: TERRACE_LOW,
};
