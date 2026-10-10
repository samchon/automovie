import { assertDirection } from "../../common/mesh/assertDirection";
import { triangleAreaVector } from "../../common/mesh/triangleAreaVector";
import type { IAutoMovieHumanPersonSubdivisionCheck } from "../structures/IAutoMovieHumanPersonSubdivisionCheck";

/**
 * Admit one emitted piece of a subdivided boundary triangle: its oriented area
 * must keep a positive dot product with the original triangle's.
 *
 * A folded piece refuses with the direction error and what a caller needs to
 * tell a posed fold from precision loss: the side, the original, emitted,
 * input and perimeter coordinates, the source ids, every neighbouring
 * triangle sharing two of those sources with its attributes and, when the
 * stitch carries the body's positions before collar alignment, each involved
 * source's native, collar and band lineage. The admission itself is
 * unchanged by the report.
 */
export function assertHumanPersonSubdivision(
  check: IAutoMovieHumanPersonSubdivisionCheck,
): void {
  const {
    stitch,
    emitted,
    indices,
    before,
    original,
    corners,
    triangle,
    perimeter,
  } = check;
  try {
    assertDirection(
      before,
      triangleAreaVector(emitted, corners, 0),
      triangle,
      "person boundary subdivision",
    );
  } catch (error) {
    const { mesh, sources, side, seam, face, bodyBeforeCollar } = stitch;
    const count = seam.faceLoop.length;
    const pointAt = (parameter: number): number[] => {
      const edge = Math.floor(parameter);
      const fraction = parameter - edge;
      const a = seam.faceLoop[edge];
      const b = seam.faceLoop[(edge + 1) % count];
      return [0, 1, 2].map(
        (axis) =>
          face[a * 3 + axis] * (1 - fraction) + face[b * 3 + axis] * fraction,
      );
    };
    const points = (vertices: number[]): number[][] =>
      vertices.map((vertex) => emitted.slice(vertex * 3, vertex * 3 + 3));
    const input = original.map((vertex) =>
      mesh.positions.slice(vertex * 3, vertex * 3 + 3),
    );
    const sourceIds = original.map((vertex) => sources[vertex]);
    const attributes = (
      values: readonly number[] | null | undefined,
      width: number,
      vertices: number[],
    ): number[][] | null =>
      values === undefined || values === null
        ? null
        : vertices.map((vertex) =>
            values.slice(vertex * width, vertex * width + width),
          );
    const neighbours = [];
    for (let start = 0; start < indices.length; start += 3) {
      if (start / 3 === triangle) continue;
      const vertices = indices.slice(start, start + 3);
      if (
        vertices.filter((vertex) => sourceIds.includes(sources[vertex]))
          .length < 2
      )
        continue;
      neighbours.push({
        triangle: start / 3,
        corners: vertices,
        sources: vertices.map((vertex) => sources[vertex]),
        positions: attributes(mesh.positions, 3, vertices),
        normals: attributes(mesh.normals, 3, vertices),
        uvs: attributes(mesh.uvs, 2, vertices),
        colors: attributes(mesh.colors, 3, vertices),
        reliefWeights: attributes(mesh.reliefWeights, 1, vertices),
      });
    }
    const target = (loop: number): number[] => {
      const follow = seam.collar.follow[loop];
      return pointAt((follow.edge + follow.fraction) % count);
    };
    const lineage =
      bodyBeforeCollar === undefined
        ? null
        : [
            ...new Set([
              ...original,
              ...neighbours.flatMap((one) => one.corners),
            ]),
          ].map((vertex) => {
            const source = sources[vertex];
            const loop = seam.bodyLoop.indexOf(source);
            const band = seam.collar.band.find((one) => one.vertex === source);
            const nativeOf = (id: number): number[] =>
              bodyBeforeCollar.slice(id * 3, id * 3 + 3);
            return {
              source,
              nativePosed: nativeOf(source),
              collarInput: mesh.positions.slice(vertex * 3, vertex * 3 + 3),
              loop:
                loop < 0
                  ? null
                  : {
                      index: loop,
                      follow: seam.collar.follow[loop],
                      target: target(loop),
                    },
              band:
                band === undefined
                  ? null
                  : {
                      ...band,
                      lowSource: seam.bodyLoop[band.low],
                      highSource: seam.bodyLoop[band.high],
                      lowNative: nativeOf(seam.bodyLoop[band.low]),
                      highNative: nativeOf(seam.bodyLoop[band.high]),
                      lowTarget: target(band.low),
                      highTarget: target(band.high),
                    },
            };
          });
    throw new Error(
      `${String(error)} Side=${side}; original=${JSON.stringify(points(original))}; emitted=${JSON.stringify(points(corners))}; input=${JSON.stringify(input)}; perimeter=${JSON.stringify(points(perimeter))}; sources=${JSON.stringify(sourceIds)}; neighbours=${JSON.stringify(neighbours)}; lineage=${JSON.stringify(lineage)}.`,
    );
  }
}
