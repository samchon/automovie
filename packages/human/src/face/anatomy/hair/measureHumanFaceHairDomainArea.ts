import type { IAutoMovieVector3 as ImportedIAutoMovieVector3 } from "@automovie/interface";
import { Vector3 } from "@automovie/engine";

/**
 * A current-domain area proxy for a hair population: its neutral acceptance share times the domain's triangles measured on the current positions. Under uniform area scaling this carries the mask's area fraction to the current shape. Under nonuniform deformation it does not integrate the accepted patch's local area scales; the neutral share is a construction approximation. It is the fallback that `humanFaceHairDensity` reads when a population is too small to measure its own neighbourhoods.
 *
 * Positions are metres and the result is square metres. Inputs are read only.
 *
 * @evidence contracts/common.md#principled-implementation Current domain triangle areas multiply the sampler's neutral acceptance share.
 * @evidence contracts/common.md#clear-and-simple-design Small-population density receives this explicit current-area proxy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonuniform deformation of the accepted patch is not integrated, so this is an approximation rather than exact masked area.
 * @evidence contracts/common.md#meaningful-documentation Metre coordinates produce square metres, with valid correspondence/share supplied by admitted construction.
 * @evidence contracts/performance.md#efficient-algorithms Triangle reduction is linear in domain triangle count.
 * @evidence contracts/performance.md#reuse-equivalent-work The existing sampled acceptance share is reused instead of resampling or reconstructing an accepted patch.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Per-triangle vectors are temporary and no domain buffer is copied or retained after the scalar result.
 */
export function measureHumanFaceHairDomainArea(props: {
  share: number;
  triangles: readonly number[];
  indices: readonly number[];
  current: readonly number[];
}): number {
  const { indices, current }: { share: number; triangles: readonly number[]; indices: readonly number[]; current: readonly number[]; } = props;
  return (
    props.share *
    props.triangles.reduce((total: number, triangle: number): number => {
      const points: ImportedIAutoMovieVector3[] = indices
        .slice(3 * triangle, 3 * triangle + 3)
        .map((id: number): ImportedIAutoMovieVector3 =>
          Vector3.create(
            current[id * 3],
            current[id * 3 + 1],
            current[id * 3 + 2],
          ),
        );
      return (
        total +
        Vector3.length(
          Vector3.cross(
            Vector3.subtract(points[1], points[0]),
            Vector3.subtract(points[2], points[0]),
          ),
        ) /
          2
      );
    }, 0)
  );
}
