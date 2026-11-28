import type { IAutoMovieInspectionCamera } from "@automovie/interface";

/* A canonical exact-projection key for stored and current cameras. */
export function projectedRasterKey(value: unknown): string | null {
  if (value === null || typeof value !== "object") return null;
  const {
    width,
    height,
    worldToView,
    viewToClip,
    layers,
  }: Partial<IAutoMovieInspectionCamera.IProjectionIdentity> = value;
  if (
    width === undefined ||
    !Number.isSafeInteger(width) ||
    width <= 0 ||
    height === undefined ||
    !Number.isSafeInteger(height) ||
    height <= 0 ||
    layers === undefined ||
    !Number.isInteger(layers) ||
    (layers | 0) !== layers ||
    !isMatrix(worldToView) ||
    !isMatrix(viewToClip)
  )
    return null;
  return JSON.stringify([width, height, worldToView, viewToClip, layers]);
}

function isMatrix(value: unknown): value is readonly number[] {
  return (
    Array.isArray(value) &&
    value.length === 16 &&
    Array.from(value).every(Number.isFinite)
  );
}
