import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanInteractionMesh,
  IAutoMovieVector3,
} from "@automovie/interface";

/** The record of `IRowsResult`'s site. */
type IRowsResult = { point: number; value: number };

/** The record of `IRowItem`'s site. */
type IRowItem = { point: number; value: number };

/**
 * The Laplacian of an interaction mesh (Ho, Komura and Tai 2010, sections 5 and
 * 5.1): nearby parts influence each other by inverse-distance weights; the
 * skeleton's own bone edges are omitted so the deformation objective does not
 * oppose the bone lengths that the constraints must change.
 */
export namespace HumanInteractionMeshLaplacian {
  /** A sparse row of the Laplacian over point indices. */
  export type Row = IRowItem[];

  /**
   * Build the deformation rows on the reference geometry.
   *
   * @param reference The reference points, metres.
   * @param neighbours The Delaunay neighbours of each point.
   * @param bones The edges whose lengths the adaptation constrains.
   * @returns One Laplacian row per point; an isolated point has an empty row.
   */
  export function rows(
    reference: readonly IAutoMovieVector3[],
    neighbours: readonly (readonly number[])[],
    bones: readonly IAutoMovieMotionHumanInteractionMesh.IBone[],
  ): Row[] {
    const edge = (a: number, b: number): string =>
      a < b ? `${a}|${b}` : `${b}|${a}`;
    const omitted: Set<string> = new Set(
      bones.map((bone: IAutoMovieMotionHumanInteractionMesh.IBone): string =>
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
          (j: number, k: number): IRowsResult => ({
            point: j,
            value: -weights[k]! / sum,
          }),
        ),
      ];
    });
  }
}
