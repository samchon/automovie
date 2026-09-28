/** Roof-owned visual laminate. One periodic cell is sampled through the native
 * metric surface UVs; no image of the reference or replacement geometry is used.
 * Alpha represents unresolved clear laminate between opaque cells. This is a
 * thin-surface appearance approximation, not measured solar transmission. */
import type { IAutoMovieTextureReference } from "@automovie/interface";

export const pvTextureBinding: IAutoMovieTextureReference = {
  asset: "canopy-pv-cell", texCoord: 0, coordinateSource: "surface-metres", colorSpace: "srgb",
  sampler: { wrapS: "repeat", wrapT: "repeat", minFilter: "linearMipmapLinear", magFilter: "linear" },
};

/** The explicit repeat fills each laminate with whole cells. The caller supplies
 * the actual upper face's metric UV interval, not an estimated image dimension. */
export function fitCellTexture(minU: number, maxU: number, minV: number, maxV: number): IAutoMovieTextureReference {
  const scale = { x: Math.max(1, Math.round((maxU - minU) / 0.18)) / (maxU - minU), y: Math.max(1, Math.round((maxV - minV) / 0.18)) / (maxV - minV) };
  return { ...pvTextureBinding, transform: { offset: { x: -minU * scale.x, y: -minV * scale.y }, scale, rotationDeg: 0 } };
}

/** One octagonal cell, fine conductors and a clear border. Texture pixels are
 * deterministic authored material samples, never a stored environment snapshot. */
export function pvCellTexture() {
  const size = 128, rgba: number[] = [];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = (x + 0.5) / size, v = (y + 0.5) / size;
    const du = Math.abs(u - 0.5), dv = Math.abs(v - 0.5);
    const cell = du < 0.40 && dv < 0.40 && du + dv < 0.74;
    const conductor = cell && (Math.abs(u - 0.30) < 0.006 || Math.abs(u - 0.70) < 0.006 || Math.abs(v * 18 - Math.round(v * 18)) < 0.045);
    const grain = 3 * Math.sin(x * 0.63 + y * 0.31) * Math.sin(y * 0.79);
    const rgb = conductor ? [133, 160, 174] : cell ? [49 + grain, 80 + grain, 104 + grain] : [190, 214, 224];
    rgba.push(...rgb.map(value => Math.round(value)), cell ? 255 : 38);
  }
  return { id: pvTextureBinding.asset, width: size, height: size, rgba };
}
