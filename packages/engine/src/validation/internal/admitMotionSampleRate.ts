import type { IAutoMovieViolationCollector } from "@automovie/interface";

/*
 * Admit the resolved sample rate in Hz before a validator samples its motion.
 * Report a range finding at the motion's sampleRate field for a nonfinite or
 * nonpositive value. The caller chooses the default and handles other
 * findings.
 * Parameter collector: The caller's mutable diagnostic collector.
 * Parameter path: The owning diagnostic path, without the sampleRate member.
 * Parameter sampleRate: Resolved sample rate in Hz.
 * Returns: Whether the rate satisfies the finite positive requirement.
 */
export function admitMotionSampleRate(
  collector: IAutoMovieViolationCollector,
  path: string,
  sampleRate: number,
): boolean {
  if (Number.isFinite(sampleRate) && sampleRate > 0) return true;
  collector.push(
    "range",
    `${path}.sampleRate`,
    `sampleRate must be a finite number > 0, but was ${sampleRate}`,
    sampleRate,
  );
  return false;
}
