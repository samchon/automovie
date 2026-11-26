import { windowSampleTimes } from "./windowSampleTimes";

/**
 * Return the endpoint-inclusive seconds grid from zero to duration at a
 * positive Hz rate. The window sampler owns grid arithmetic and duplicate-end
 * removal; zero duration returns one instant.
 */
export function sampleTimes(duration: number, sampleRate: number): number[] {
  return windowSampleTimes(0, duration, sampleRate);
}
