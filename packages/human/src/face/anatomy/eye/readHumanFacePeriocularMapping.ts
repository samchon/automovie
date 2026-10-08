import { measureAutoMovieMeshCrossings } from "@automovie/engine";
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
 * These observations add no condition or tolerance to physical admission.
 * Missing legacy UV coordinates stay unknown rather than reading as zero folds.
 * Original offset crossing witnesses retain their producer attachments; no
 * second query or reconstructed sheet is introduced to locate their causes.
 *
 * @evidence contracts/common.md#principled-implementation Signed triangle areas discriminate material folds, while identical engine crossing predicates separately read the producer's skin, outer and inner stages at output precision.
 * @evidence contracts/common.md#clear-and-simple-design The emitted cell incidence and original arrays are supplied by their construction owner; source-only observations can be reused within that immutable band.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No sampled triangle or failed relation is removed and no physical admission condition is replaced by the report.
 * @evidence contracts/common.md#meaningful-documentation Separates mathematical mapping readings from clinical acceptance and reports absent source UV as unknown.
 * @evidence contracts/modeling.md#spatial-conventions Material areas are dimensionless; spatial buffers restore actual local Float32 coordinates into head-frame metres exactly as part census.
 */
export function readHumanFacePeriocularMapping(
  input: IHumanFacePeriocularMappingInput,
): IHumanFacePeriocularMappingReading {
  const topology = createHumanFacePeriocularTopology(input);
  const indices: number[] =
    input.indices === undefined ? [] : [...input.indices];
  if (input.indices === undefined)
    for (const [a, b, c, d] of topology.cells)
      for (const corners of [
        [a, b, c],
        [a, c, d],
      ])
        if (new Set(corners).size === 3) indices.push(...corners);
  const sheet = (positions: number[], origin?: IAutoMovieVector3): IAutoMovieMesh => readHumanLocalMeshWorld({
    positions: origin === undefined ? positions : positions.map(
      (value, at) => value - [origin.x, origin.y, origin.z][at % 3],
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
  const skin =
    input.sourceReading === undefined ? sheet(input.skin) : undefined;
  const outer = sheet(input.outer, input.publicationOrigin),
    inner = sheet(input.inner, input.publicationOrigin);
  const crossings = (a: IAutoMovieMesh, b: IAutoMovieMesh) =>
    measureAutoMovieMeshCrossings(a, b).filter((hit) => !hit.coplanar);
  const outerHits = crossings(outer, outer),
    innerHits = crossings(inner, inner);
  const betweenHits = crossings(outer, inner);
  const witness = (
    hit: (typeof outerHits)[number],
  ): IHumanFacePeriocularCrossingWitness => ({
    triangle: hit.triangle,
    other: hit.other,
    sourceTriangle: input.sourceTriangles[hit.triangle],
    otherSourceTriangle: input.sourceTriangles[hit.other],
    corners: indices.slice(3 * hit.triangle, 3 * hit.triangle + 3),
    otherCorners: indices.slice(3 * hit.other, 3 * hit.other + 3),
  });
  const outerWitnesses = outerHits.map(witness),
    innerWitnesses = innerHits.map(witness);
  const betweenWitnesses = betweenHits.map(witness);
  const used = new Set(
    [...outerWitnesses, ...innerWitnesses, ...betweenWitnesses].flatMap(
      (hit) => [...hit.corners, ...hit.otherCorners],
    ),
  );
  let positive = 0,
    negative = 0,
    zero = 0;
  if (input.material !== undefined && input.sourceReading === undefined)
    for (let at = 0; at < indices.length; at += 3) {
      const [a, b, c] = indices.slice(at, at + 3),
        uv = input.material;
      const area =
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
      [...new Set(input.sourceTriangles)].sort((a, b) => a - b),
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
              .sort((a, b) => a - b)
              .map((vertex) => ({
                vertex,
                frame: input.frames![vertex],
                seat: input.seats![vertex],
              })),
          },
        }),
  };
}
