import type { HumanObservationView } from "./HumanObservationView.js";

/** Azimuth about +Y from the figure's front toward its left (+X), degrees, and elevation above the horizon, degrees. */
const DIRECTIONS: Record<
  HumanObservationView,
  { azimuth: number; elevation: number }
> = {
  front: { azimuth: 0, elevation: 0 },
  "left-three-quarter": { azimuth: 45, elevation: 0 },
  left: { azimuth: 90, elevation: 0 },
  back: { azimuth: 180, elevation: 0 },
  "right-three-quarter": { azimuth: -45, elevation: 0 },
  right: { azimuth: -90, elevation: 0 },
  // a camera exactly on the pole leaves the orbit's up vector undefined, so
  // the pole views stand a hair off it
  top: { azimuth: 0, elevation: 89.9 },
  bottom: { azimuth: 0, elevation: -89.9 },
};

/**
 * Where a camera stands to look at `target` from a named direction at a
 * distance, in the metre frame of the displayed figure (Y up, +Z front).
 *
 * The placement is pure geometry: `position = target + distance * (sin a cos
 * e, sin e, cos a cos e)` for azimuth `a` and elevation `e`. It reads no scene
 * and moves nothing, so the review hooks and their tests share one table.
 *
 * @param view Direction to look from.
 * @param target Point looked at, metres.
 * @param distance Distance from the target, metres, positive.
 * @param pitch Degrees added to the view's elevation (positive raises the
 *   camera, looking down), finite and within [-89, 89]; zero keeps the named
 *   direction. The sum is clamped to the pole guard so the orbit's up vector
 *   stays defined.
 *
 * @evidence contracts/common.md#principled-implementation Selects a supported named azimuth/elevation, adds admitted pitch, clamps elevation to the disclosed near-pole guard and computes a spherical metre position. Finite positive distance/target values are caller premises; explicit pitch/name admission occurs here, and finite inputs can still exceed representable target sums at extreme magnitude.
 * @evidence contracts/common.md#clear-and-simple-design One shared direction table and placement law keep figure-left/right conventions consistent across body and face observation without a second scene or camera owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The 89.9-degree pole guard avoids native orbit's singular up direction and is a display convention, not a measured pose. Unknown names and excessive pitch refuse rather than selecting a fixture-friendly view.
 * @evidence contracts/common.md#meaningful-documentation The comment and parameters give metre frame, anatomical-left azimuth, pitch sign/range and clamped near-pole meaning; source target is copied rather than exposed for mutation.
 * @evidence contracts/performance.md#efficient-algorithms Table lookup and fixed trigonometric/vector arithmetic require constant time and two tuple outputs, independent of subject mesh size.
 * @evidence contracts/performance.md#reuse-equivalent-work Body/face callers share the canonical directions, but target, distance and pitch remain request dependencies; matching view names alone do not identify equivalent camera states.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns position/target data and retains no source tuple, native camera or task. The small direction table persists as module data.
 */
export function placeHumanObservationCamera(
  view: HumanObservationView,
  target: readonly [number, number, number],
  distance: number,
  pitch: number = 0,
): { position: [number, number, number]; target: [number, number, number] } {
  if (!Object.hasOwn(DIRECTIONS, view))
    throw new Error(`Unknown observation view "${String(view)}".`);
  if (!Number.isFinite(pitch) || Math.abs(pitch) > 89)
    throw new Error("Observation pitch must be finite, within [-89, 89].");
  const { azimuth }: { azimuth: number; elevation: number } = DIRECTIONS[view];
  const elevation: number = Math.max(
    -89.9,
    Math.min(89.9, DIRECTIONS[view].elevation + pitch),
  );
  const a: number = (azimuth * Math.PI) / 180;
  const e: number = (elevation * Math.PI) / 180;
  return {
    position: [
      target[0] + distance * Math.sin(a) * Math.cos(e),
      target[1] + distance * Math.sin(e),
      target[2] + distance * Math.cos(a) * Math.cos(e),
    ],
    target: [target[0], target[1], target[2]],
  };
}
