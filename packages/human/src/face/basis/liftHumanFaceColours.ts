import type { IAutoMovieMaterial, IAutoMovieMesh as IAutoMovieMeshImported } from "@automovie/interface";

import type { IHumanFaceColourPart } from "./IHumanFaceColourPart";



/**
 * Fold vertex colours above one into their materials' base colours.
 *
 * A colour field may lighten a region beyond its material (a gain over
 * one: a site whose albedo exceeds the reference skin's), but a vertex
 * colour is a multiplier in [0, 1]. For each material and channel the
 * largest colour its mesh parts reach, when above one, multiplies the base
 * colour and divides every such part's colours, so each vertex's albedo,
 * the base colour times the vertex colour, is unchanged. A material's parts
 * without colours take the reciprocal as colours of their own, keeping
 * their albedo too. A base colour above the renderer's normalized linear
 * albedo domain refuses by name. Materials whose parts stay
 * within one are untouched. Mutates the parts' colours and the materials.
 * A later material's refusal can follow changes to earlier current-build
 * parts/materials; the builder supplies fresh owned values and discards failure.
 *
 * @evidence contracts/common.md#principled-implementation Per-material channel maxima at least one move excess vertex gain into base RGB and divide every bound part's RGB, preserving their products in floating arithmetic. Uncoloured parts receive reciprocal gains; current admitted producers supply finite matching RGB arrays and resident normalized materials.
 * @evidence contracts/common.md#clear-and-simple-design One pass collects lift factors, then each affected material and its parts are updated together before model admission. Colour sampling and region gather retain their own owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Above-one normalized base colour refuses rather than clipping the requested albedo product, and unaffected materials remain untouched. This renderer-domain transformation is not a measurement of total tissue reflectance or proof of valid external arbitrary colour arrays.
 * @evidence contracts/common.md#meaningful-documentation Prose states preserved base-times-vertex products, uncoloured-part compensation, in-place mutation, normalized refusal and partial current-build failure effects.
 * @evidence contracts/performance.md#efficient-algorithms The initial scan visits C colour scalars; affected material processing scans P parts for each of K lifts and rewrites their colour buffers, O(C+KP+rewritten scalars). Current part/material population bounds that grouping work; no repeated geometry computation occurs.
 * @evidence contracts/performance.md#reuse-equivalent-work One lift vector per material serves every bound part, including uncoloured ones; existing material-map lookup avoids repeated material searches. This mutating current-stage operation is not reused across distinct model instances.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The lift map is local; replacement colour arrays and changed material values remain in the caller's owned model. No old arrays or request history are retained internally, and no task/image/GPU handle is acquired.
 */
export function liftHumanFaceColours(
  parts: readonly IHumanFaceColourPart[],
  materials: ReadonlyMap<string, IAutoMovieMaterial>,
): void {
  const lifts: Map<string, number[]> = new Map<string, number[]>();
  for (const part of parts) {
    const colors: number[] | undefined = part.geometry.mesh.colors;
    if (colors === undefined) continue;
    const lift: number[] = lifts.get(part.material) ?? [1, 1, 1];
    for (let i: number = 0; i < colors.length; ++i)
      lift[i % 3] = Math.max(lift[i % 3]!, colors[i]!);
    lifts.set(part.material, lift);
  }
  for (const [id, lift] of lifts) {
    if (lift.every((value: number): boolean  => value <= 1)) continue;
    const material: IAutoMovieMaterial = materials.get(id)!;
    const base: number[] = [
      material.baseColor.r,
      material.baseColor.g,
      material.baseColor.b,
    ].map((value: number, channel: number): number  => value * lift[channel]!);
    if (base.some((value: number): boolean  => value > 1))
      throw new Error(
        `A colour field lifts material ${id}'s albedo above one: ${base
          .map((value: number): string  => value.toFixed(4))
          .join(", ")}.`,
      );
    material.baseColor = {
      ...material.baseColor,
      r: base[0]!,
      g: base[1]!,
      b: base[2]!,
      hex: null,
    };
    for (const part of parts) {
      if (part.material !== id) continue;
      const mesh: IAutoMovieMeshImported = part.geometry.mesh;
      mesh.colors =
        mesh.colors === undefined
          ? Array.from(
              { length: mesh.positions.length },
              (_v: unknown, i: number): number  => 1 / lift[i % 3]!,
            )
          : mesh.colors.map((value: number, i: number): number  => value / lift[i % 3]!);
    }
  }
}
