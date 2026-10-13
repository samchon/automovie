import type { IAutoMovieMesh } from "@automovie/interface";

import { areaWeightedNormals as normalsOf } from "../../common/mesh/areaWeightedNormals";
import { Point } from "./structures/Point";

/**
 * Sample a surface over [0,1] squared and triangulate its shared lattice.
 * The positive normal follows du cross dv. Closure belongs to the surface:
 * a tube without caps remains open, and coincident pole rows are not welded.
 * Callers supply positive integer row/column counts and finite points in one
 * coordinate frame/unit, preserved without conversion: portrait paths use
 * millimetres and native brow courses use metres. This sampler admits neither
 * resolution nor anatomical shape. UVs and skin weights are returned as null.
 *
 * @evidence contracts/common.md#principled-implementation Samples each normalized lattice point once and emits two consistently wound triangles per cell, then delegates shared-vertex area-weighted normals; finite coordinates and positive integer dimensions are caller premises, with no pole or seam topology repair.
 * @evidence contracts/common.md#clear-and-simple-design One row-major lattice preserves surface callback coordinates and predictable vertex indexing for seam-normal consumers; normals remain in the shared mesh producer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sampling uses the declared rows/columns rather than measured answers or subject-specific vertices. Open boundaries and coincident poles remain explicit representation limits; invalid resolution is not silently corrected.
 * @evidence contracts/common.md#meaningful-documentation The comment states the normalized domain, winding, unchanged caller coordinate units, resolution admission, open caps, unwelded coincident poles and null UV/skin-weight fields.
 * @evidence contracts/performance.md#efficient-algorithms For C columns and R rows, sampling and normal accumulation take O(CR) time/storage plus (C+1)(R+1) callback evaluations; each coordinate is sampled once and every cell contributes two triangles.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This producer answers one surface callback and resolution; it owns no request cache or equivalence rule for callback effects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Position/index/normal arrays transfer in the returned mesh and temporaries expire on return/refusal; allocation grows with the caller's resolution, without a local global cap or retained handle/task.
 */
export const triangulateSurfaceLattice: (surface: (u: number, v: number) => Point, columns: number, rows: number) => IAutoMovieMesh = (
  surface: (u: number, v: number) => Point,
  columns: number,
  rows: number,
): IAutoMovieMesh => {
  const positions: number[] = [],
    indices: number[] = [];
  for (let j: number = 0; j <= rows; j++)
    for (let i: number = 0; i <= columns; i++) {
      const point: Point = surface(i / columns, j / rows);
      positions.push(point.x, point.y, point.z);
    }
  for (let j: number = 0; j < rows; j++)
    for (let i: number = 0; i < columns; i++) {
      const a: number = j * (columns + 1) + i;
      indices.push(
        a,
        a + 1,
        a + columns + 1,
        a + 1,
        a + columns + 2,
        a + columns + 1,
      );
    }
  return {
    positions,
    indices,
    normals: normalsOf(positions, indices),
    uvs: null,
    skin: null,
  };
};
