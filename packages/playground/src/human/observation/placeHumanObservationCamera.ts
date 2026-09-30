import type { HumanObservationView } from "./HumanObservationView";

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
 */
export function placeHumanObservationCamera(
  view: HumanObservationView,
  target: readonly [number, number, number],
  distance: number,
): { position: [number, number, number]; target: [number, number, number] } {
  if (!Object.hasOwn(DIRECTIONS, view))
    throw new Error(`Unknown observation view "${String(view)}".`);
  const { azimuth, elevation } = DIRECTIONS[view];
  const a = (azimuth * Math.PI) / 180;
  const e = (elevation * Math.PI) / 180;
  return {
    position: [
      target[0] + distance * Math.sin(a) * Math.cos(e),
      target[1] + distance * Math.sin(e),
      target[2] + distance * Math.cos(a) * Math.cos(e),
    ],
    target: [target[0], target[1], target[2]],
  };
}
