import { assertDirection } from "../../common/mesh/assertDirection";
import { triangleAreaVector } from "../../common/mesh/triangleAreaVector";
import type { IAutoMovieHumanPersonSubdivisionCheck } from "../structures/IAutoMovieHumanPersonSubdivisionCheck";

/**
 * Admit one emitted piece of a subdivided boundary triangle: its oriented area must keep a positive dot product with the original triangle's.
 *
 * A folded piece refuses with the direction error and what a caller needs to tell a posed fold from precision loss: the side, the original, emitted, input and perimeter coordinates, the source ids, every neighbouring triangle sharing two of those sources with its attributes and, when the stitch carries the body's positions before collar alignment, each involved source's native, collar and band lineage. The admission itself is unchanged by the report.
 *
 * Positions are shared-frame metres and area vectors are square metres. Source residency, admitted original topology and perimeter meaning are caller premises; this orientation test is neither a collision test nor clinical neck-fit certification. Failure-only context is serialized into the error.
 *
 * @evidence contracts/common.md#principled-implementation The emitted corner cross product must have positive normalized agreement with the original area vector; collapsed/opposed pieces refuse and actual source neighbours explain the same failure.
 * @evidence contracts/common.md#clear-and-simple-design Shared area/orientation helpers own the predicate; this owner adds subdivision-specific side, attributes and optional collar lineage only after refusal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Diagnostics change no triangle, area threshold or admission outcome; original source residency and nonredundant geometry remain premises rather than repaired by the report.
 * @evidence contracts/common.md#meaningful-documentation Prose states metre/area units, source premises, failure provenance and the limited orientation-only result.
 * @evidence contracts/performance.md#efficient-algorithms Success uses constant three-corner arithmetic; failure scans region triangles for shared sources, gathers actual attributes and performs per-involved-source collar searches plus output-size serialization.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each emitted piece has its own orientation and failure context; this admission wrapper coordinates no shared requests or diagnostic cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Successful calls retain nothing; failure arrays are temporary and only serialized text escapes with the thrown Error, with size driven by actual neighbouring/source populations.
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
  }: IAutoMovieHumanPersonSubdivisionCheck = check;
  try {
    assertDirection(
      before,
      triangleAreaVector(emitted, corners, 0),
      triangle,
      "person boundary subdivision",
    );
  } catch (error) {
    const { mesh, sources, side, seam, face, bodyBeforeCollar }: IAutoMovieHumanPersonSubdivisionCheck["stitch"] = stitch;
    const count: number = seam.faceLoop.length;
    const pointAt: (parameter: number) => number[] = (parameter: number): number[] => {
      const edge: number = Math.floor(parameter);
      const fraction: number = parameter - edge;
      const a: number = seam.faceLoop[edge];
      const b: number = seam.faceLoop[(edge + 1) % count];
      return [0, 1, 2].map(
        (axis: number): number =>
          face[a * 3 + axis] * (1 - fraction) + face[b * 3 + axis] * fraction,
      );
    };
    const points: (vertices: number[]) => number[][] = (vertices: number[]): number[][] =>
      vertices.map((vertex: number): number[] => emitted.slice(vertex * 3, vertex * 3 + 3));
    const input: number[][] = original.map((vertex: number): number[] =>
      mesh.positions.slice(vertex * 3, vertex * 3 + 3),
    );
    const sourceIds: number[] = original.map((vertex: number): number => sources[vertex]);
    const attributes: (values: readonly number[] | null | undefined, width: number, vertices: number[]) => number[][] | null = (
      values: readonly number[] | null | undefined,
      width: number,
      vertices: number[],
    ): number[][] | null =>
      values === undefined || values === null
        ? null
        : vertices.map((vertex: number): number[] =>
            values.slice(vertex * width, vertex * width + width),
          );
    const neighbours: { triangle: number; corners: number[]; sources: number[]; positions: number[][] | null; normals: number[][] | null; uvs: number[][] | null; colors: number[][] | null; reliefWeights: number[][] | null }[] = [];
    for (let start: number = 0; start < indices.length; start += 3) {
      if (start / 3 === triangle) continue;
      const vertices: number[] = indices.slice(start, start + 3);
      if (
        vertices.filter((vertex: number): boolean => sourceIds.includes(sources[vertex]))
          .length < 2
      )
        continue;
      neighbours.push({
        triangle: start / 3,
        corners: vertices,
        sources: vertices.map((vertex: number): number => sources[vertex]),
        positions: attributes(mesh.positions, 3, vertices),
        normals: attributes(mesh.normals, 3, vertices),
        uvs: attributes(mesh.uvs, 2, vertices),
        colors: attributes(mesh.colors, 3, vertices),
        reliefWeights: attributes(mesh.reliefWeights, 1, vertices),
      });
    }
    const target: (loop: number) => number[] = (loop: number): number[] => {
      const follow: typeof seam.collar.follow[number] = seam.collar.follow[loop];
      return pointAt((follow.edge + follow.fraction) % count);
    };
    const lineage: { source: number; nativePosed: number[]; collarInput: number[]; loop: { index: number; follow: typeof seam.collar.follow[number]; target: number[] } | null; band: (typeof seam.collar.band[number] & { lowSource: number; highSource: number; lowNative: number[]; highNative: number[]; lowTarget: number[]; highTarget: number[] }) | null }[] | null =
      bodyBeforeCollar === undefined
        ? null
        : [
            ...new Set([
              ...original,
              ...neighbours.flatMap((one: typeof neighbours[number]): number[] => one.corners),
            ]),
          ].map((vertex: number): NonNullable<typeof lineage>[number] => {
            const source: number = sources[vertex];
            const loop: number = seam.bodyLoop.indexOf(source);
            const band: typeof seam.collar.band[number] | undefined = seam.collar.band.find((one: typeof seam.collar.band[number]): boolean => one.vertex === source);
            const nativeOf: (id: number) => number[] = (id: number): number[] =>
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
