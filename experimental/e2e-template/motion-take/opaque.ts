import type { IMotionTakeSource } from "../../src/executable/motionTake/IMotionTakeSource";
import { createMotionTakeSource as original } from "./source";

/** Omit a live callback's registered identity from an otherwise valid recipe. */
export function createMotionTakeSource(): IMotionTakeSource {
  const source: IMotionTakeSource = original();
  return {
    ...source,
    bindings: source.bindings.filter(
      ({ id }): boolean => id !== "carrier-motion",
    ),
  };
}
