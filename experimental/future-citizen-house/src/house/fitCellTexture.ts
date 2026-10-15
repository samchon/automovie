/** Roof-owned visual laminate. One periodic cell is sampled through the native
 * metric surface UVs; no image of the reference or replacement geometry is used.
 * Alpha represents unresolved clear laminate between opaque cells. This is a
 * thin-surface appearance approximation, not measured solar transmission. */
import type { IAutoMovieTextureReference } from "@automovie/interface";
import { pvTextureBinding } from "./pvTextureBinding";

/** The explicit repeat fills each laminate with whole cells. The caller supplies
 * the actual upper face's metric UV interval, not an estimated image dimension. */
export function fitCellTexture(minU: number, maxU: number, minV: number, maxV: number): IAutoMovieTextureReference {
  const scale = { x: Math.max(1, Math.round((maxU - minU) / 0.18)) / (maxU - minU), y: Math.max(1, Math.round((maxV - minV) / 0.18)) / (maxV - minV) };
  return { ...pvTextureBinding, transform: { offset: { x: -minU * scale.x, y: -minV * scale.y }, scale, rotationDeg: 0 } };
}

