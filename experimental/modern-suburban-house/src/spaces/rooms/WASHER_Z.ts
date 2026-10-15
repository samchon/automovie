import { MACHINE_WIDTH_Z } from "./MACHINE_WIDTH_Z";

const MACHINE_BACK_Z = -3.35;
/** World z range of the washer, from the machines' back line. */
export const WASHER_Z = [MACHINE_BACK_Z, MACHINE_BACK_Z + MACHINE_WIDTH_Z] as const;
