import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * Extract a labelled triangle region while retaining the parent normal field.
 * Only referenced vertices survive, so a lip or iris part has its own bounds
 * instead of inheriting the complete head's unused position buffer. Identity is
 * the old vertex index, not rounded coordinates; seams are never welded here.
 * Optional per-corner linear RGB splits a shared vertex only when its two
 * tissue colours differ, retaining the parent's common normal on both copies.
 *
 * @evidence contracts/common.md#principled-implementation Admitted resident corner indices gather only referenced positions/common normals; source id plus optional exact RGB separates tissue-colour aliases. Head/eye callers provide aligned source fields, and coordinates never determine identity.
 * @evidence contracts/common.md#clear-and-simple-design One gatherer owns compaction/colour splitting while region selection and common-normal calculation remain component/surface responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Colours require one finite unit-range triple per corner; no coordinate weld removes seams. Index/normal admission is a caller prerequisite, and extracted boundary/colour aliases are no topology/anatomy certificate.
 * @evidence contracts/common.md#meaningful-documentation Prose gives referenced-only bounds, original vertex identity, common normals, optional colour splits, owned output and unchanged input arrays.
 * @evidence contracts/performance.md#efficient-algorithms One I-corner scan and optional colour validation populate expected constant-time map entries/O(I) output; fixed RGB text keys avoid full-head unused coordinate copies.
 * @evidence contracts/performance.md#reuse-equivalent-work Each exact id/colour key gathers once per region; regions share the source field but require separately owned compact outputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Output attributes transfer, local O(I) map releases, and no region history/GPU handle/task is retained.
 */
export const extractTriangleRegion: (positions: number[], normals: number[], indices: number[], cornerColors?: readonly (readonly number[])[]) => IAutoMovieMesh = (
  positions: number[],
  normals: number[],
  indices: number[],
  cornerColors?: readonly (readonly number[])[],
): IAutoMovieMesh => {
  if (
    cornerColors !== undefined &&
    (cornerColors.length !== indices.length ||
      cornerColors.some(
        (rgb: readonly number[]): boolean  =>
          rgb.length !== 3 ||
          rgb.some((v: number): boolean  => !Number.isFinite(v) || v < 0 || v > 1),
      ))
  )
    throw new Error(
      "Portrait corner colours need one finite RGB triple in [0,1] per triangle corner.",
    );
  const vertices: Map<string | number, number> = new Map<number | string, number>();
  const output: IAutoMovieMesh = {
    positions: [],
    normals: [],
    indices: [],
    uvs: null,
    skin: null,
    ...(cornerColors === undefined ? {} : { colors: [] }),
  };
  for (const [corner, old] of indices.entries()) {
    const color: readonly number[] | undefined = cornerColors?.[corner];
    const key: string | number = color === undefined ? old : `${old}/${color.join("/")}`;
    let next: number | undefined = vertices.get(key);
    if (next === undefined) {
      next = vertices.size;
      vertices.set(key, next);
      const at: number = old * 3;
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
