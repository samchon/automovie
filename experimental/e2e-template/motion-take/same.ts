import type { IMotionTakeSource } from "../../src/executable/motionTake/IMotionTakeSource";
import { createAlternative } from "./branch";

/** Reauthor the original tail exactly in a separately saved continuation. */
export function createMotionTakeSource(): IMotionTakeSource {
  return createAlternative("identical-suffix", "old-tail", 0);
}
