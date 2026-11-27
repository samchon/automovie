import {
  BufferAttribute,
  InterleavedBufferAttribute,
  Material,
  Mesh,
} from "three";

import { AutoMovieRenderThreeKind } from "../../AutoMovieRenderThreeKind";

/*
 * List the index ranges Three draws for a mesh, each with its visible material.
 *
 * A single-material mesh draws its draw range when the material is visible. A
 * multi-material mesh draws only its geometry groups, each clipped to the draw
 * range and skipped when its material is missing or hidden.
 * Parameter mesh: A mesh with a `position` attribute.
 * Returns: Ranges of indices, or of vertices for a non-indexed geometry, in
 * group order; empty when nothing is drawn.
 */
export function readDrawnRanges(
  mesh: Mesh,
): readDrawnRanges.IRange[] {
  const position: BufferAttribute | InterleavedBufferAttribute =
    mesh.geometry.getAttribute("position");
  const total: number = mesh.geometry.index?.count ?? position.count;
  const start: number = Math.max(0, mesh.geometry.drawRange.start);
  const end: number = Math.min(total, start + mesh.geometry.drawRange.count);
  const material: Material | Material[] = mesh.material;
  if (AutoMovieRenderThreeKind.isMaterial(material))
    return material.visible && start < end ? [{ start, end, material }] : [];

  // Three draws a multi-material mesh only through its groups.
  const ranges: readDrawnRanges.IRange[] = [];
  for (const group of mesh.geometry.groups) {
    const chosen: Material | undefined = material[group.materialIndex ?? 0];
    const from: number = Math.max(start, group.start);
    const to: number = Math.min(end, group.start + group.count);
    if (chosen !== undefined && chosen.visible && from < to)
      ranges.push({ start: from, end: to, material: chosen });
  }
  return ranges;
}

/*
 * Types of the drawn ranges.
 */
export namespace readDrawnRanges {
  /*
   * One drawn index range of a mesh and the material it is drawn with.
   */
  export interface IRange {
    /*
     * First index or vertex, inclusive.
     */
    start: number;

    /*
     * Last index or vertex, exclusive.
     */
    end: number;

    /*
     * Material Three binds for the range.
     */
    material: Material;
  }
}
