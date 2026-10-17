import type { IAutoMovieModel } from "../../../../packages/interface/src/model/IAutoMovieModel.ts";
import { comparisonModel } from "./comparisonModel.ts";

/**
 * Converts the independent reference display from millimetres into the interface's metre-valued model contract.
 *
 * @evidence contracts/common.md#principled-implementation Divides each source coordinate by one thousand once and retains adopted reference triangles for display.
 * @evidence contracts/common.md#clear-and-simple-design The reference-only adapter delegates appearance to comparisonModel and never feeds the reconstruction consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Imported reference provenance stays distinct from engine-generated surface provenance.
 * @evidence contracts/common.md#meaningful-documentation The comment gives the unit conversion and the prohibition on reference geometry entering reconstruction.
 * @evidence contracts/performance.md#efficient-algorithms Maps three coordinates per source vertex, allocating one position array and borrowing the index array.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the neutral model binding; each adopted source payload is converted independently.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns the returned position array as model data and acquires no renderer or native resource.
 */
export function referenceModel(source: {
  vertices: number[];
  triangles: number[];
}): IAutoMovieModel {
  return comparisonModel(
    {
      type: "mesh",
      mesh: {
        positions: source.vertices.map(
          (millimetres: number): number => millimetres / 1000,
        ),
        indices: source.triangles,
        normals: null,
        uvs: null,
        skin: null,
      },
    },
    "imported",
    "reference-display",
  );
}
