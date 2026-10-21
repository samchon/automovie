import { AutoMovieCurveMath64 as M } from "./AutoMovieCurveMath64";
import type { IAutoMovieContourLoft64 as L } from "./IAutoMovieContourLoft64";
import type { IAutoMovieContourLoftEmission64 } from "./IAutoMovieContourLoftEmission64";
import type { IAutoMovieContourLoftSink64 } from "./IAutoMovieContourLoftSink64";
import type { IAutoMovieCurve64 as C } from "./IAutoMovieCurve64";
import { computeAutoMovieContourNormals64 } from "./computeAutoMovieContourNormals64";
import { generateAutoMovieContourLoft64 } from "./generateAutoMovieContourLoft64";

/**
 * Materialize the original contour kernel into its existing memory result.
 * Source-free coefficients and declared incidence retain their original ordering.
 * Normals use the original face/corner reduction, with no source-normal fallback.
 *
 * @evidence contracts/common.md#principled-implementation The shared kernel emits original indexed millimetre positions and oriented triangles; the existing normal operator runs on those complete channels before metre publication.
 * @evidence contracts/common.md#clear-and-simple-design This explicit memory sink retains the existing mesh result while the shared generator owns correspondence and qualification.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source geometry, positional alias, alternate triangulator or changed normal reduction replaces generated coordinates.
 * @evidence contracts/common.md#meaningful-documentation States the memory materialization boundary, physical conversion and unchanged qualification ownership.
 * @evidence contracts/performance.md#efficient-algorithms Kernel preparation and strip search dominate; materialization and normal reduction cost O(V+T+K) for vertices, triangles and construction samples.
 * @evidence contracts/performance.md#reuse-equivalent-work One kernel invocation supplies indexed geometry, construction and actual qualification metadata.
 * @evidence contracts/performance.md#bound-retention-and-release-resources This memory API deliberately retains complete vertex/triangle channels. Borrowed construction-point references and paid phase arrays survive until normal reduction and final construction conversion; no file or cache is acquired.
 */
export function tessellateAutoMovieContourLoft64(input: L): L.IResult {
  const vertices: C.Vector[] = [],
    triangles: [number, number, number][] = [];
  const sources: [string, readonly C.Vector[], number[]][] = [];
  const sink: IAutoMovieContourLoftSink64 = {
    vertex: (index: number, pointMm: C.Vector): void => {
      if (index !== vertices.length)
        throw new Error("Contour vertex order differs from its memory sink");
      vertices.push(pointMm);
    },
    triangle: (a: number, b: number, c: number): void => {
      triangles.push([a, b, c]);
    },
    construction: (
      id: string,
      pointsMm: readonly C.Vector[],
      phase: (pointMm: C.Vector) => number,
    ): void => {
      sources.push([id, pointsMm, pointsMm.map(phase)]);
    },
  };
  const generated: IAutoMovieContourLoftEmission64 =
    generateAutoMovieContourLoft64(input, sink);
  const normals: number[] = computeAutoMovieContourNormals64(
    vertices,
    triangles,
  );
  return {
    primitiveRanges: generated.primitiveRanges,
    interactionObservations: generated.interactionObservations,
    stripObservations: generated.stripObservations,
    mesh: {
      positions: vertices.flatMap(
        (point: C.Vector): M.V => M.scale(point, 0.001),
      ),
      indices: triangles.flat(),
      normals,
      uvs: null,
      skin: null,
    },
    construction: sources.map(
      ([id, points, phases]: [
        string,
        readonly C.Vector[],
        number[],
      ]): L.IResult["construction"][number] => ({
        id,
        closed: true,
        points: points.map((point: C.Vector): M.V => M.scale(point, 0.001)),
        phases,
      }),
    ),
    unresolved: generated.unresolved,
  };
}
