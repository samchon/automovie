/**
 * The tone mapping exposure at which a grey of linear radiance `radiance`
 * displays at relative luminance `target` through the linear transform:
 * their ratio.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Keeps the inspected face readable under a photographically exposed, white-balanced light rig.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Exposes and white balances the preview on a key-lit grey card without changing the saved anatomical document.
 */
export function humanPreviewLinearExposure(
  radiance: number,
  target: number,
): number {
  if (!(radiance > 0) || !(target > 0 && target < 1))
    throw new Error("Exposure needs a positive radiance and a target below 1.");
  return target / radiance;
}
