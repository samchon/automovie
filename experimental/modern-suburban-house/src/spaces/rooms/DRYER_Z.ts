import { WASHER_Z } from "./WASHER_Z";
import { MACHINE_WIDTH_Z } from "./MACHINE_WIDTH_Z";

/** World z range of the dryer, beside the washer. */
export const DRYER_Z = [WASHER_Z[1], WASHER_Z[1] + MACHINE_WIDTH_Z] as const;
