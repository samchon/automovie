import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/*
 * The point of the segment from `from` along `slide` at `length` from `grip`,
 * the farther along it of the two where the sphere about the grip meets the
 * segment's line, clamped to the segment; undefined when the sphere misses the
 * line.
 * Parameter from: The segment's start, world metres.
 * Parameter slide: The segment, world metres.
 * Parameter grip: The sphere's centre, world metres.
 * Parameter length: The sphere's radius, metres.
 * Returns: The point, or undefined when the sphere misses the line.
 */
export function poleVaultOnLine(
  from: IAutoMovieVector3,
  slide: IAutoMovieVector3,
  grip: IAutoMovieVector3,
  length: number,
): IAutoMovieVector3 | undefined {
  const a: number = Vector3.dot(slide, slide);
  if (!(a > 1e-12)) return undefined;
  const offset: IAutoMovieVector3 = Vector3.subtract(from, grip);
  const b: number = 2 * Vector3.dot(slide, offset);
  const c: number = Vector3.dot(offset, offset) - length * length;
  const discriminant: number = b * b - 4 * a * c;
  if (discriminant < 0) return undefined;
  const along: number = Math.max(
    0,
    Math.min(1, (-b + Math.sqrt(discriminant)) / (2 * a)),
  );
  return Vector3.add(from, Vector3.scale(slide, along));
}
