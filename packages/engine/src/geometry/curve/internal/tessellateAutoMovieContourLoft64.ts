import type {
  AutoMovieVector3Tuple,
  IAutoMovieContourLoft64,
  IAutoMovieContourLoftEmission64,
  IAutoMovieContourLoftSink64,
} from "@automovie/interface";

import { AutoMovieCurveMath64 as M } from "../AutoMovieCurveMath64";
import { computeAutoMovieContourNormals64 } from "./computeAutoMovieContourNormals64";
import { generateAutoMovieContourLoft64 } from "./generateAutoMovieContourLoft64";

/**
 * Materialize the original contour kernel into its existing memory result.
 * Source-free coefficients and declared incidence retain their original
 * ordering. Normals use the original face/corner reduction, with no
 * source-normal fallback.
 */
export function tessellateAutoMovieContourLoft64(
  input: IAutoMovieContourLoft64,
): IAutoMovieContourLoft64.IResult {
  const vertices: Readonly<AutoMovieVector3Tuple>[] = [],
    triangles: [number, number, number][] = [];
  const sources: [
    string,
    readonly Readonly<AutoMovieVector3Tuple>[],
    number[],
  ][] = [];
  const sink: IAutoMovieContourLoftSink64 = {
    vertex: (index: number, pointMm: Readonly<AutoMovieVector3Tuple>): void => {
      if (index !== vertices.length)
        throw new Error("Contour vertex order differs from its memory sink");
      vertices.push(pointMm);
    },
    triangle: (a: number, b: number, c: number): void => {
      triangles.push([a, b, c]);
    },
    construction: (
      id: string,
      pointsMm: readonly Readonly<AutoMovieVector3Tuple>[],
      phase: (pointMm: Readonly<AutoMovieVector3Tuple>) => number,
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
        (point: Readonly<AutoMovieVector3Tuple>): AutoMovieVector3Tuple =>
          M.scale(point, 0.001),
      ),
      indices: triangles.flat(),
      normals,
      uvs: null,
      skin: null,
    },
    construction: sources.map(
      ([id, points, phases]: [
        string,
        readonly Readonly<AutoMovieVector3Tuple>[],
        number[],
      ]): IAutoMovieContourLoft64.IResult["construction"][number] => ({
        id,
        closed: true,
        points: points.map(
          (point: Readonly<AutoMovieVector3Tuple>): AutoMovieVector3Tuple =>
            M.scale(point, 0.001),
        ),
        phases,
      }),
    ),
    unresolved: generated.unresolved,
  };
}
