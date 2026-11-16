import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { HumanInteractionMesh } from "./HumanInteractionMesh";

/**
 * The Laplacian of an interaction mesh (Ho, Komura and Tai 2010, sections
 * 5 and 5.1): nearby parts influence each other by inverse-distance weights;
 * the skeleton's own bone edges are omitted so the deformation objective
 * does not oppose the bone lengths that the constraints must change.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the weights, the excluded edges and why that exclusion is necessary.
 * @evidence contracts/development/design.md#principled-representation Sparse rows over point indices, the linear map taking Cartesian points to their Laplacian coordinates.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A row and its builder, consumed once by HumanInteractionMesh.adapt.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The topology and bone pairs are inputs from their existing owners; nothing names a body or a fixture.
 */
export namespace HumanInteractionMeshLaplacian {
  /**
   * A sparse row of the Laplacian over point indices.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the index and coefficient representation of one linear row.
   * @evidence contracts/development/design.md#principled-representation Point indices and scalar coefficients represent the same linear map on each Cartesian axis.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two values per nonzero coefficient; no dense matrix is retained.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The row uses input indices rather than a body-specific bone vocabulary.
   */
  export type Row = { point: number; value: number }[];

  /**
   * Build the deformation rows on the reference geometry.
   *
   * @param reference The reference points, metres.
   * @param neighbours The Delaunay neighbours of each point.
   * @param bones The edges whose lengths the adaptation constrains.
   * @returns One Laplacian row per point; an isolated point has an empty row.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which geometry fixes the weights, the omitted edges and the isolated case.
   * @evidence contracts/development/implementation.md#principled-implementation Ho, Komura and Tai's equation 3 normalises inverse-distance weights; section 5.1 excludes bone edges because their deformation energy conflicts with the changing bone lengths. For coincident neighbours the inverse-distance limit shares the weight among those zero-distance neighbours alone. A point with no remaining neighbours records no relation, so its row is zero.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Index the omitted edges, then one neighbour filter and normalisation per point.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No numerical cutoff replaces a zero distance; scaling all inverse distances by the closest positive distance leaves their normalisation unchanged and avoids overflow.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the bone edges and Delaunay edges; the bone lookup is a set, and the rows are constructed once per key-pose adaptation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the already computed Delaunay neighbourhoods and the adaptation's bone list.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure builder; only its caller retains the returned sparse rows.
   */
  export function rows(
    reference: readonly IAutoMovieVector3[],
    neighbours: readonly (readonly number[])[],
    bones: readonly HumanInteractionMesh.IBone[],
  ): Row[] {
    const edge = (a: number, b: number): string =>
      a < b ? `${a}|${b}` : `${b}|${a}`;
    const omitted: Set<string> = new Set(
      bones.map((bone: HumanInteractionMesh.IBone): string =>
        edge(bone.from, bone.to),
      ),
    );
    return neighbours.map((around: readonly number[], i: number): Row => {
      const kept: number[] = around.filter(
        (j: number): boolean => !omitted.has(edge(i, j)),
      );
      if (kept.length === 0) return [];
      const distances: number[] = kept.map((j: number): number =>
        Vector3.length(Vector3.subtract(reference[i]!, reference[j]!)),
      );
      const closest: number = Math.min(...distances);
      const weights: number[] = distances.map((distance: number): number =>
        closest === 0 ? (distance === 0 ? 1 : 0) : closest / distance,
      );
      const sum: number = weights.reduce(
        (total: number, weight: number): number => total + weight,
        0,
      );
      return [
        { point: i, value: 1 },
        ...kept.map(
          (j: number, k: number): { point: number; value: number } => ({
            point: j,
            value: -weights[k]! / sum,
          }),
        ),
      ];
    });
  }
}
