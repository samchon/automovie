/** Secant steps that settle the joint scale of volume preservation. */
const ROUNDS: number = 8;

/** Relative volume error at which volume preservation stops. */
const TOLERANCE: number = 1e-6;

/**
 * Find the factor on a posed sweep's joint sections that restores its rest
 * volume, by secant steps.
 *
 * The first two trials are 1 and `sqrt(target / V(1))`, the factor that
 * would restore the volume if it scaled as an area; then up to eight secant
 * steps, each factor held at 0.1 or more, stop when the volume is within
 * 1e-6 of the target or two trials give the same volume. Volume preservation
 * in sweep-based deformation rescales the key section at the bent joint the
 * same way (Hyun et al. 2005, The Visual Computer 21(8-10):542-550, Section
 * 4.4).
 *
 * @param target The rest volume, cubic metres.
 * @param volume The posed volume at a joint factor.
 * @returns The last factor tried.
 *
 * @evidence contracts/common.md#principled-implementation The secant method on the one-dimensional volume equation, started from the area law, the rescaling step of sweep-based deformation's volume preservation.
 * @evidence contracts/common.md#clear-and-simple-design One search shared by `poseAutoMovieSweep` and posed rigs, which differ only in how they evaluate the volume.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The step count, tolerance and lower bound are fixed and stated, not tuned per caller.
 * @evidence contracts/common.md#meaningful-documentation States the starts, the stopping rules, the bound and the source.
 * @evidence contracts/performance.md#efficient-algorithms At most ten volume evaluations and no allocation of its own.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A search; the caller's volume function owns any reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing.
 */
export const settleAutoMovieSweepVolume: (target: number, volume: (factor: number) => number) => number = (
  target: number,
  volume: (factor: number) => number,
): number => {
  let a: number = 1;
  let va: number = volume(a);
  let b: number = Math.sqrt(target / va);
  let vb: number = volume(b);
  for (let round: number = 0; round < ROUNDS; ++round) {
    if (Math.abs(vb - target) <= TOLERANCE * target || vb === va) break;
    const next: number = b + ((target - vb) * (b - a)) / (vb - va);
    a = b;
    va = vb;
    b = Math.max(0.1, next);
    vb = volume(b);
  }
  return b;
};
