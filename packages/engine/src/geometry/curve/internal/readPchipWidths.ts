import { isDenseFinite } from "./isDenseFinite";

/*
 * Resolve strictly positive, representable interval widths.
 */
export function readPchipWidths(coordinates: readonly number[]): number[] {
  if (coordinates.length < 2 || !isDenseFinite(coordinates))
    throw new Error("At least two finite spline coordinates required");
  const widths: number[] = coordinates
    .slice(1)
    .map((coordinate: number, i: number): number => coordinate - coordinates[i]!);
  if (widths.some((width: number): boolean => !(width > 0 && Number.isFinite(width))))
    throw new Error("Increasing spline coordinates with finite widths required");
  return widths;
}
