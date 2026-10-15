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
