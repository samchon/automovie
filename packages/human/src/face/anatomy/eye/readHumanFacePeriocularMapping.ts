import type { IHumanFacePeriocularTopology } from "./structures/IHumanFacePeriocularTopology";
import type { IHumanFaceSkinFrame } from "../skin/IHumanFaceSkinFrame";
import type { IHumanFaceSkinSeat } from "../skin/IHumanFaceSkinSeat";

import { measureAutoMovieMeshCrossings, type IAutoMovieMeshCrossing } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import { readHumanLocalMeshWorld } from "../../../common/mesh/readHumanLocalMeshWorld";

import { createHumanFacePeriocularTopology } from "./createHumanFacePeriocularTopology";
import type { IHumanFacePeriocularCrossingWitness } from "./structures/IHumanFacePeriocularCrossingWitness";
import type { IHumanFacePeriocularMappingInput } from "./structures/IHumanFacePeriocularMappingInput";
import type { IHumanFacePeriocularMappingReading } from "./structures/IHumanFacePeriocularMappingReading";

/**
 * Read the generated band's material, sampled-skin and offset stages separately.
 * The producer supplies its actual conforming incidence when present;
 * otherwise the same source quotient and cell diagonal as its shell supply
 * incidence. No old grid reconstruction substitutes for a conformed sheet.
 * Signed UV areas read Float64 material construction; spatial crossings read
 * local Float32 buffers restored by the same publication origin, with the
 * existing engine instrument used by part census.
 * Crossing counts retain at most one transverse witness per first sheet
 * triangle under the default instrument; they do not count all intersecting
 * face pairs. These observations add no condition or tolerance to physical admission.
 * Missing legacy UV coordinates stay unknown rather than reading as zero folds.
 * Original offset crossing witnesses retain their producer attachments; no
 * second query or reconstructed sheet is introduced to locate their causes.
 *
 * @evidence contracts/common.md#principled-implementation Actual conforming incidence or canonical structured quotient separately measures material orientation, sampled skin and published offset sheet crossings.
 * @evidence contracts/common.md#clear-and-simple-design The existing local-world publication and crossing owners read the same geometry as shell/part census; witness provenance stays original.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing legacy material stays unknown and observational mapping results add no new physical tolerance/admission rule.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes Float64 material areas, local Float32/TRS spatial crossings and source witness ownership.
 * @evidence contracts/performance.md#efficient-algorithms Structured topology is allocated even with explicit conforming indices. Three offset crossing queries and an optional skin query dominate; candidate pair counts can grow quadratically in faces. Witness vertex and source-triangle lists are deduplicated and sorted, adding O(K log K) work for each collected population.
 * @evidence contracts/performance.md#reuse-equivalent-work A supplied sourceReading skips material signs and skin crossings and shares its sampled source-triangle array. The caller must keep source positions, material coordinates and incidence unchanged; no local equivalence check is performed. Outer, inner and between-sheet crossings are always recomputed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned readings own counts/witness arrays and may borrow supplied frame/seat records; per-call mesh/hit tables expire without retained tasks.
 */
export function readHumanFacePeriocularMapping(
  input: IHumanFacePeriocularMappingInput,
): IHumanFacePeriocularMappingReading {
  const topology: IHumanFacePeriocularTopology = createHumanFacePeriocularTopology(input);
  const indices: number[] =
    input.indices === undefined ? [] : [...input.indices];
  if (input.indices === undefined)
    for (const [a, b, c, d] of topology.cells)
      for (const corners of [
        [a, b, c],
        [a, c, d],
      ])
        if (new Set(corners).size === 3) indices.push(...corners);
  const sheet: (positions: number[], origin?: IAutoMovieVector3) => IAutoMovieMesh = (positions: number[], origin?: IAutoMovieVector3): IAutoMovieMesh => readHumanLocalMeshWorld({
    positions: origin === undefined ? positions : positions.map(
      (value: number, at: number): number  => value - [origin.x, origin.y, origin.z][at % 3],
    ),
    indices,
    normals: null,
    uvs: null,
    skin: null,
  }, origin === undefined ? undefined : {
    translation: origin,
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  });
  const skin: IAutoMovieMesh | undefined =
    input.sourceReading === undefined ? sheet(input.skin) : undefined;
  const outer: IAutoMovieMesh = sheet(input.outer, input.publicationOrigin),
    inner: IAutoMovieMesh = sheet(input.inner, input.publicationOrigin);
  const crossings: (a: IAutoMovieMesh, b: IAutoMovieMesh) => IAutoMovieMeshCrossing[] = (a: IAutoMovieMesh, b: IAutoMovieMesh): IAutoMovieMeshCrossing[]  =>
    measureAutoMovieMeshCrossings(a, b).filter((hit: IAutoMovieMeshCrossing): boolean  => !hit.coplanar);
  const outerHits: IAutoMovieMeshCrossing[] = crossings(outer, outer),
    innerHits: IAutoMovieMeshCrossing[] = crossings(inner, inner);
  const betweenHits: IAutoMovieMeshCrossing[] = crossings(outer, inner);
  const witness: (hit: IAutoMovieMeshCrossing) => IHumanFacePeriocularCrossingWitness = (
    hit: (typeof outerHits)[number],
  ): IHumanFacePeriocularCrossingWitness => ({
    triangle: hit.triangle,
    other: hit.other,
    sourceTriangle: input.sourceTriangles[hit.triangle],
    otherSourceTriangle: input.sourceTriangles[hit.other],
    corners: indices.slice(3 * hit.triangle, 3 * hit.triangle + 3),
    otherCorners: indices.slice(3 * hit.other, 3 * hit.other + 3),
  });
  const outerWitnesses: IHumanFacePeriocularCrossingWitness[] = outerHits.map(witness),
    innerWitnesses: IHumanFacePeriocularCrossingWitness[] = innerHits.map(witness);
  const betweenWitnesses: IHumanFacePeriocularCrossingWitness[] = betweenHits.map(witness);
  const used: Set<number> = new Set(
    [...outerWitnesses, ...innerWitnesses, ...betweenWitnesses].flatMap(
      (hit: IHumanFacePeriocularCrossingWitness): number[]  => [...hit.corners, ...hit.otherCorners],
    ),
  );
  let positive: number = 0,
    negative: number = 0,
    zero: number = 0;
  if (input.material !== undefined && input.sourceReading === undefined)
    for (let at: number = 0; at < indices.length; at += 3) {
      const [a, b, c]: number[] = indices.slice(at, at + 3),
        uv: number[] = input.material;
      const area: number =
        (uv[2 * b] - uv[2 * a]) * (uv[2 * c + 1] - uv[2 * a + 1]) -
        (uv[2 * b + 1] - uv[2 * a + 1]) * (uv[2 * c] - uv[2 * a]);
      if (area > 0) positive++;
      else if (area < 0) negative++;
      else zero++;
    }
  return {
    triangles: indices.length / 3,
    positiveMaterialTriangles:
      input.sourceReading === undefined
        ? input.material === undefined
          ? null
          : positive
        : input.sourceReading.positiveMaterialTriangles,
    negativeMaterialTriangles:
      input.sourceReading === undefined
        ? input.material === undefined
          ? null
          : negative
        : input.sourceReading.negativeMaterialTriangles,
    zeroMaterialTriangles:
      input.sourceReading === undefined
        ? input.material === undefined
          ? null
          : zero
        : input.sourceReading.zeroMaterialTriangles,
    skinSheetCrossings:
      input.sourceReading?.skinSheetCrossings ?? crossings(skin!, skin!).length,
    outerSheetCrossings: outerHits.length,
    innerSheetCrossings: innerHits.length,
    betweenSheetCrossings: betweenHits.length,
    sampledSourceTriangles:
      input.sourceReading?.sampledSourceTriangles ??
      [...new Set(input.sourceTriangles)].sort((a: number, b: number): number  => a - b),
    ...(input.frames === undefined || input.seats === undefined
      ? {}
      : {
          offsetWitnesses: {
            outerDistanceMetres: input.outerDistanceMetres,
            innerDistanceMetres: input.innerDistanceMetres,
            outer: outerWitnesses,
            inner: innerWitnesses,
            between: betweenWitnesses,
            vertices: [...used]
              .sort((a: number, b: number): number  => a - b)
              .map((vertex: number): { vertex: number; frame: IHumanFaceSkinFrame; seat: IHumanFaceSkinSeat; }  => ({
                vertex,
                frame: input.frames![vertex],
                seat: input.seats![vertex],
              })),
          },
        }),
  };
}
