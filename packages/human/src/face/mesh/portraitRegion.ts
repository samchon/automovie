import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * Extract a labelled triangle region while retaining the parent normal field.
 * Only referenced vertices survive, so a lip or iris part has its own bounds
 * instead of inheriting the complete head's unused position buffer. Identity is
 * the old vertex index, not rounded coordinates; seams are never welded here.
 * Optional per-corner linear RGB splits a shared vertex only when its two
 * tissue colours differ, retaining the parent's common normal on both copies.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Separates an anatomical material region without introducing an independent lighting seam.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Compacts only referenced vertex identities while retaining the parent's positions, normals and triangle order.
 */
export const portraitRegion = (
  positions: number[],
  normals: number[],
  indices: number[],
  cornerColors?: readonly (readonly number[])[],
): IAutoMovieMesh => {
  if (
    cornerColors !== undefined &&
    (cornerColors.length !== indices.length ||
      cornerColors.some(
        (rgb) =>
          rgb.length !== 3 ||
          rgb.some((v) => !Number.isFinite(v) || v < 0 || v > 1),
      ))
  )
    throw new Error(
      "Portrait corner colours need one finite RGB triple in [0,1] per triangle corner.",
    );
  const vertices = new Map<number | string, number>();
  const output: IAutoMovieMesh = {
    positions: [],
    normals: [],
    indices: [],
    uvs: null,
    skin: null,
    ...(cornerColors === undefined ? {} : { colors: [] }),
  };
  for (const [corner, old] of indices.entries()) {
    const color = cornerColors?.[corner];
    const key = color === undefined ? old : `${old}/${color.join("/")}`;
    let next = vertices.get(key);
    if (next === undefined) {
      next = vertices.size;
      vertices.set(key, next);
      const at = old * 3;
      output.positions.push(
        positions[at],
        positions[at + 1],
        positions[at + 2],
      );
      output.normals!.push(normals[at], normals[at + 1], normals[at + 2]);
      output.colors?.push(...color!);
    }
    output.indices!.push(next);
  }
  return output;
};
