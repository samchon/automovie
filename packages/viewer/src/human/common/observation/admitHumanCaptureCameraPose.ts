import type { IHumanCaptureCameraPose } from "./IHumanCaptureCameraPose.js";

/**
 * Admit one recorded camera without substituting a different viewing direction.
 * Yaw is within 180 degrees and pitch below 90 degrees in magnitude. Optional
 * distance is positive, the target contains three finite metre coordinates,
 * and vertical field of view is strictly between zero and 180 degrees.
 * The returned target is copied so framing cannot mutate the source record.
 *
 * @evidence contracts/common.md#principled-implementation Selects the recorded id and admits finite yaw within [-180,180], pitch within (-90,90), optional positive finite distance, three finite target coordinates and fov within (0,180). It copies supported fields rather than deriving a direction from the photograph; dictionary lookup can read inherited ids because own-property admission is not performed.
 * @evidence contracts/common.md#clear-and-simple-design One boundary admits recorded camera data before placement, leaving defaults for omitted framing with the actual capture consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid or missing poses refuse rather than using a convenient named view. Numeric admission does not prove that the record was measured under matching image/model provenance.
 * @evidence contracts/common.md#meaningful-documentation The comment gives angle boundaries, metre target/distance, optional lens constraints and copied-target ownership; it states no inferred likeness or photographic calibration.
 * @evidence contracts/performance.md#efficient-algorithms Checks a fixed set of scalar fields and three optional target entries, constant work/storage for the supported record.
 * @evidence contracts/performance.md#reuse-equivalent-work A fresh admitted copy reflects each actual record. Matching id alone is not cached equivalence when the stored camera or capture provenance changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns copied scalar fields and target tuple without retaining the pose dictionary or native camera; caller owns the admitted data lifetime.
 */
export function admitHumanCaptureCameraPose(
  poses: Record<string, IHumanCaptureCameraPose | null> | null,
  id: string,
): IHumanCaptureCameraPose {
  const pose: IHumanCaptureCameraPose | null | undefined = poses?.[id];
  if (
    pose === undefined ||
    pose === null ||
    !Number.isFinite(pose.yaw) ||
    !Number.isFinite(pose.pitch) ||
    Math.abs(pose.yaw) > 180 ||
    Math.abs(pose.pitch) >= 90 ||
    (pose.distance !== undefined &&
      (!Number.isFinite(pose.distance) || pose.distance <= 0)) ||
    (pose.target !== undefined &&
      (pose.target.length !== 3 ||
        pose.target.some((value: number): boolean => !Number.isFinite(value)))) ||
    (pose.fov !== undefined &&
      (!Number.isFinite(pose.fov) || pose.fov <= 0 || pose.fov >= 180))
  )
    throw new Error(
      "A matched face view needs a finite measured camera pose and frame.",
    );
  return {
    yaw: pose.yaw,
    pitch: pose.pitch,
    ...(pose.distance === undefined ? {} : { distance: pose.distance }),
    ...(pose.target === undefined ? {} : { target: [...pose.target] }),
    ...(pose.fov === undefined ? {} : { fov: pose.fov }),
  };
}
