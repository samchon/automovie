import { SPAR_MOMENTS } from "./SPAR_MOMENTS";

/**
 * Final shared sparring instant in seconds, consumed by the page's playback/capture duration. The authored timeline is nonempty; this value does not include the page's additional inter-repeat pause.
 *
 * The page and both clips derive timing from the same authored nonempty list rather than independent constants. Constant-time final-array access follows the one module-level timeline construction; it is not a motion-health or frame-count verdict.
 *
 * This module-lifetime number owns no additional geometry, worker, GPU handle or running task beyond the imported fixed timeline.
 *
 * @author Samchon
 */
export const SPAR_DURATION: number = SPAR_MOMENTS[SPAR_MOMENTS.length - 1]!.t;
