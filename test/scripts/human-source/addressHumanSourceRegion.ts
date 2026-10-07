import type { IHumanSourceRegionFill } from "./structures/IHumanSourceRegionFill.ts";

/**
 * Carry a filled base-mesh region onto the head view's skin. A sample is in
 * the region when every base face it lies on (`mapHumanSourceSampleFaces`) is
 * on the region's side: inner original vertices, edge points and face points
 * qualify, while loop vertices and the edge points on loop edges, which also
 * touch an outside face, do not. Each region sample must appear exactly once
 * on the head view, or the region is refused by name.
 */
export function addressHumanSourceRegion(
  name: string,
  fill: IHumanSourceRegionFill,
  sampleFaces: readonly number[][],
  faceToG1: Int32Array,
  nativeToSource?: Int32Array,
): number[] {
  const view = new Map<number, number[]>();
  faceToG1.forEach((g, j) => {
    if (!view.has(g)) view.set(g, []);
    view.get(g)!.push(j);
  });
  const out: number[] = [];
  sampleFaces.forEach((faces, s) => {
    if (faces.length === 0 || !faces.every((f) => fill.faces.has(f))) return;
    const canonical = nativeToSource === undefined ? s : nativeToSource[s];
    if (!Number.isSafeInteger(canonical) || canonical < 0)
      throw new Error(`Skin region ${name}: native sample ${s} is retired or absent from this source.`);
    const at = view.get(canonical) ?? [];
    if (at.length !== 1) throw new Error(`Skin region ${name}: sample ${s} appears ${at.length} times on the head view.`);
    out.push(at[0]);
  });
  return out.sort((a, b) => a - b);
}
