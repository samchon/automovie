import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Encode physical slopes in Three's shared-scale cotangent frame, not a Gram-Schmidt frame.
 *
 * Without a tangent attribute, Three scales both dual UV vectors by the inverse of their maximum length. Inverting that frame preserves flat-triangle world slopes under UV rotation, shear, unequal scale and mirroring. Interpolated smooth normals, later deformations, texture quantization/filtering and alpha coverage still make the final displayed slope an approximation.
 */
export function writeAutoMovieHumanSkinNormal(
  out: Uint8Array,
  at: number,
  p: number[][],
  uv: number[][],
  g: IAutoMovieVector3,
): void {
  const e: number[] = p[1]!.map(
    (v: number, i: number): number => v - p[0]![i]!,
  );
  const f: number[] = p[2]!.map(
    (v: number, i: number): number => v - p[0]![i]!,
  );
  const du: number = uv[1]![0]! - uv[0]![0]!;
  const dv: number = uv[1]![1]! - uv[0]![1]!;
  const eu: number = uv[2]![0]! - uv[0]![0]!;
  const ev: number = uv[2]![1]! - uv[0]![1]!;
  const det: number = du * ev - dv * eu;
  const t: number[] = e.map(
    (v: number, i: number): number => (v * ev - f[i]! * dv) / det,
  );
  const b: number[] = e.map(
    (v: number, i: number): number => (f[i]! * du - v * eu) / det,
  );
  const area: number = Math.hypot(
    t[1]! * b[2]! - t[2]! * b[1]!,
    t[2]! * b[0]! - t[0]! * b[2]!,
    t[0]! * b[1]! - t[1]! * b[0]!,
  );
  if (area === 0) return;
  const inverseScale: number =
    Math.max(Math.hypot(...t), Math.hypot(...b)) / area;
  const nx: number = -(g.x * t[0]! + g.y * t[1]! + g.z * t[2]!) * inverseScale;
  const ny: number = -(g.x * b[0]! + g.y * b[1]! + g.z * b[2]!) * inverseScale;
  const length: number = Math.hypot(nx, ny, 1);
  out[3 * at] = Math.round(127.5 * (nx / length + 1));
  out[3 * at + 1] = Math.round(127.5 * (ny / length + 1));
  out[3 * at + 2] = Math.round(127.5 * (1 / length + 1));
}
