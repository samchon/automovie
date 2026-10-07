/** Why a calibration sphere does or does not count as observed. */
export type HumanViewerCalibrationVerdict =
  | "observed"
  | "off-position"
  | "partly-occluded"
  | "occluded"
  | "out-of-frame"
  | "behind-camera";

/**
 * Decide, sphere by sphere, whether a frame observed the calibration rig, by
 * comparing what the independent projection expects with what the pixel
 * census found. A sphere whose expected centre is behind the camera or outside
 * the picture is out of frame and is not observed. A sphere expected inside the
 * picture that shows under a tenth of its expected disc is occluded, under
 * three quarters partly occluded, and a complete disc whose centroid is more
 * than `tolerancePx` from the expected pixel is off position (a wrong camera).
 * Only `observed` spheres count; the caller treats a region as observed only
 * when its framing spheres are observed, and a wrong framing or an occlusion
 * therefore never counts as an observation. Pure.
 *
 * @evidence contracts/common.md#principled-implementation Visible fraction against the expected disc area separates occlusion from framing, and centroid distance separates a wrong camera.
 * @evidence contracts/common.md#clear-and-simple-design One pure judgement owns the verdict vocabulary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The expectation comes from independent arithmetic and the measurement from pixels; neither is fitted to the other.
 * @evidence contracts/common.md#meaningful-documentation States each threshold and what the caller may conclude.
 */
export function judgeHumanViewerCalibration(
  size: number,
  expected: Record<
    string,
    { x: number; y: number; depth: number; radiusPx: number }
  >,
  found: Record<string, { count: number; x: number | null; y: number | null }>,
  tolerancePx: number,
): {
  verdicts: Record<string, HumanViewerCalibrationVerdict>;
  observed: string[];
  excluded: { name: string; reason: HumanViewerCalibrationVerdict }[];
} {
  const verdicts: Record<string, HumanViewerCalibrationVerdict> = {};
  for (const [name, want] of Object.entries(expected)) {
    const seen = found[name] ?? { count: 0, x: null, y: null };
    if (want.depth <= 0) verdicts[name] = "behind-camera";
    else if (want.x < 0 || want.x > size || want.y < 0 || want.y > size)
      verdicts[name] = "out-of-frame";
    else {
      const disc = Math.PI * want.radiusPx * want.radiusPx;
      const fraction = disc === 0 ? 0 : seen.count / disc;
      if (fraction < 0.1) verdicts[name] = "occluded";
      else if (fraction < 0.75) verdicts[name] = "partly-occluded";
      else if (
        seen.x === null ||
        seen.y === null ||
        Math.hypot(seen.x - want.x, seen.y - want.y) > tolerancePx
      )
        verdicts[name] = "off-position";
      else verdicts[name] = "observed";
    }
  }
  const names = Object.keys(verdicts);
  return {
    verdicts,
    observed: names.filter((name) => verdicts[name] === "observed"),
    excluded: names
      .filter((name) => verdicts[name] !== "observed")
      .map((name) => ({ name, reason: verdicts[name] })),
  };
}
