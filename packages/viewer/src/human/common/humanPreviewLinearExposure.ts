/**
 * The tone mapping exposure at which a grey of linear radiance `radiance`
 * displays at relative luminance `target` through the linear transform:
 * their ratio.
 */
export function humanPreviewLinearExposure(
  radiance: number,
  target: number,
): number {
  if (!(radiance > 0) || !(target > 0 && target < 1))
    throw new Error("Exposure needs a positive radiance and a target below 1.");
  return target / radiance;
}
