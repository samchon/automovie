import { IAutoMovieSubdivisionParameter } from "./IAutoMovieSubdivisionParameter";
import { IAutoMovieSubdivisionSurface } from "./IAutoMovieSubdivisionSurface";
import { ISubdivisionLevel } from "./ISubdivisionLevel";
import { limitSubdivisionLevel } from "./limitSubdivisionLevel";

/**
 * Evaluate a completed generating level without another topology refinement.
 *
 * This boundary lets a refined fitting domain emit its existing LOD instead
 * of multiplying render triangles merely because fitting added controls.
 * Original source-face parameters and indexed face-varying UV identities are
 * copied from the level unchanged. The level must come from cage admission or
 * the maintained refiner; this function performs no admission or repair.
 *
 * @evidence contracts/common.md#principled-implementation Uses the same published position and normal limit masks as subdivideAutoMovieSurface; topology refinement and limit evaluation remain distinct operations so fitting-domain resolution does not silently increase render LOD.
 * @evidence contracts/common.md#clear-and-simple-design One output materializer serves ordinary subdivision and fitted-domain consumers. It chooses the first source-face parameter per physical vertex without rebuilding UV seams from numeric values.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No zero-level bypass of an unadmitted cage, approximation or vertex welding; input is an existing admitted/refined level and limit normal failures propagate unchanged.
 * @evidence contracts/common.md#meaningful-documentation States producer provenance required for the level, unchanged source parameters and indexed UVs, shared array ownership and the purpose of evaluating an already refined fitting domain.
 * @evidence contracts/performance.md#efficient-algorithms Parameter emission is linear in corners and vertices; limit evaluation owns its one-ring refinement and exceptional-vertex eigenvector costs documented by limitSubdivisionLevel.
 * @evidence contracts/performance.md#reuse-equivalent-work Completed topology and UV arrays are shared read-only with the returned surface, and each physical vertex chooses its parameter once. Limit geometry is evaluated once for both render and construction consumers.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The result shares level arrays rather than duplicating them, and owns new limit and parameter arrays. No module state or completed request is retained.
 */
export function evaluateSubdivisionLevel(
  level: ISubdivisionLevel,
): IAutoMovieSubdivisionSurface {
  const limit: ReturnType<typeof limitSubdivisionLevel> =
    limitSubdivisionLevel(level);
  const parameters: IAutoMovieSubdivisionParameter[] =
    new Array<IAutoMovieSubdivisionParameter>(level.topology.vertexCount);
  level.topology.faceVertices.forEach((v: number, c: number): void => {
    if (parameters[v] !== undefined) return;
    parameters[v] = {
      face: level.parameterFaces[c]!,
      corner:
        level.parameterCorners[c] === -1 ? null : level.parameterCorners[c]!,
      u: level.parameterU[c]!,
      v: level.parameterV[c]!,
    };
  });
  return {
    positions: level.positions,
    limitPositions: limit.positions,
    faces: level.topology.faceVertices,
    normals: limit.normals,
    normalFaces: limit.cornerNormals,
    uvs: level.uvs,
    uvFaces: level.cornerUvs,
    parameters,
  };
}
