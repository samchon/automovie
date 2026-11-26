import { sampleTimes } from "./internal/sampleTimes";

/** Sample a stance or its root path on the same endpoint-inclusive clock. */
export function sampleStanceTimes(
  duration: number,
  sampleRate: number = 24,
  boundaries?: readonly number[],
): number[] {
  const times: number[] = sampleTimes(duration, sampleRate);
  if (boundaries === undefined || boundaries.length === 0) return times;
  for (const time of boundaries)
    if (time < 0 || time > duration)
      throw new Error("support boundary must lie within the motion clock");
  return [...new Set([...times, ...boundaries])].sort(
    (a: number, b: number): number => a - b,
  );
}
