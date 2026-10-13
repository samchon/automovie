import { windowSampleTimes } from "./windowSampleTimes";

/** The sampling grid over `[0, duration]`, see the module contract. */
export const sampleTimes = (duration: number, sampleRate: number): number[] =>
  windowSampleTimes(0, duration, sampleRate);
