/** Standing observation eye height above the current floor support, in metres. */
export const templeObservationEye = 1.6;

/** One authored pose shared by the exterior setting and reference 01 observations. */
export const templeExteriorSettingView = {
  position: { x: -8, y: 15, z: 27 },
  target: { x: 0, y: 1.2, z: 0.5 },
} as const;

/** Capture lens shared by authored observation framing, source audits, and the live viewer. */
export const templeViewerLens = {
  verticalDegrees: 50,
  aspect: 1.6,
  near: 0.05,
  far: 400,
  get halfVerticalRadians(): number {
    return this.verticalDegrees * Math.PI / 360;
  },
} as const;
