import type { IAutoMovieVector3 } from "@automovie/interface";

import { readInspectionNumber } from "./readInspectionNumber";

/*
 * Read exactly three comma-separated inspection coordinates.
 */
export function readInspectionVector(text: string): IAutoMovieVector3 | null {
  const parts: string[] = text.split(",");
  if (parts.length !== 3) return null;

  const x: number | null = readInspectionNumber(parts[0]!);
  const y: number | null = readInspectionNumber(parts[1]!);
  const z: number | null = readInspectionNumber(parts[2]!);
  return x === null || y === null || z === null ? null : { x, y, z };
}
