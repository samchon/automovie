import { createAutoMovieMeshRayCaster } from "@automovie/engine";

import type { IHumanBodyLayerExterior } from "./IHumanBodyLayerExterior";
import type { IHumanBodyLayerSurfaces } from "./IHumanBodyLayerSurfaces";
import type { IHumanBodyLayerSurfacesInput } from "./IHumanBodyLayerSurfacesInput";

/**
 * Derive the dermal and fascial faces of a body from its skin.
 *
 * Each face is the skin moved inward along its vertex normal: the dermal face by the skin thickness, the fascial face by the skin and subcutaneous thickness together. The normal is the area-weighted mean of the incident triangle normals, computed here from the given positions so the offset follows the evaluated surface and not a stored shading normal. A whole person supplies its actual continued exterior: canonical origin incidence selects the same native body samples from its complete normal/ray domain. The native thickness field and output order remain unchanged. This is the one place the two faces are computed; the offline registration reads this function's output instead of repeating the rule.
 *
 * These are limited geometric observations, not an embedding certificate. An unbounded inward ray excludes only the native triangles incident to its origin vertex. Half its positive opposite-sheet travel is a reported normal-ray thickness proxy, not the surface's true reach: unequal opposite thicknesses, changing normals and distant-sheet crossings are not solved. Missing or nonpositive travel is counted as an unavailable positive reach observation. Neither the origin nor a metric exclusion band is shifted. Both offset sheets are compared with the original triangle orientations. All offsets retain the requested thickness; failures are never repaired.
 *
 * @evidence contracts/common.md#principled-implementation Evaluated area-weighted normals offset dermal/fascial faces, while incident-triangle-excluded inward rays report half-positive-travel proxies and both sheets retain original orientation observations.
 * @evidence contracts/common.md#clear-and-simple-design One owner derives both faces and their native witnesses from the same evaluated skin or exact continued exterior.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The half-travel threshold is a conventional observation, not true reach; unequal offsets/global embedding remain unproved and failures never repair requested thickness.
 * @evidence contracts/common.md#meaningful-documentation The prose states metre offsets, native correspondence, unbounded rays, missing-positive-travel meaning and both orientation checks.
 * @evidence contracts/performance.md#efficient-algorithms Normal/incidence/offset scans cost O(V+T), plus ray-caster construction and V spatial queries whose worst case visits all triangles; arrays/incident sets scale with queried exterior and native output.
 * @evidence contracts/performance.md#reuse-equivalent-work One area-normal/incidence population and ray caster serve all native vertices and both faces; no stored shading normals or duplicate offline offset implementation substitutes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Query copies, ray caster and incidence sets are call-local; only offset/normal/witness arrays escape, with no external handles or persistent construction cache.
 */
export function createHumanBodyLayerSurfaces(
  input: IHumanBodyLayerSurfacesInput,
): IHumanBodyLayerSurfaces {
  const { positions, indices, field }: IHumanBodyLayerSurfacesInput = input;
  const count: number = positions.length / 3;
  if (
    positions.length % 3 !== 0 ||
    indices.length % 3 !== 0 ||
    field.skinMetres.length !== count ||
    field.subcutaneousMetres.length !== count
  )
    throw new Error("Layer thickness does not address this skin's vertices.");
  if (
    count === 0 ||
    indices.length === 0 ||
    !positions.every(Number.isFinite) ||
    indices.some(
      (index: number): boolean =>
        !Number.isSafeInteger(index) || index < 0 || index >= count,
    )
  )
    throw new Error("Layer surfaces need a nonempty finite indexed skin.");
  if (
    [...field.skinMetres, ...field.subcutaneousMetres].some(
      (value: number): boolean => !Number.isFinite(value) || value < 0,
    )
  )
    throw new Error("Layer thickness must be finite and nonnegative.");
  const exterior: IHumanBodyLayerExterior | undefined = input.exterior;
  const queryPositions: readonly number[] =
    exterior?.mesh.positions ?? positions;
  const queryIndices: readonly number[] = exterior?.mesh.indices ?? indices;
  const queryCount: number = queryPositions.length / 3;
  const origins: readonly number[] =
    exterior?.originVertices ??
    Array.from(
      { length: count },
      (_: unknown, vertex: number): number => vertex,
    );
  if (
    queryPositions.length % 3 !== 0 ||
    queryIndices.length === 0 ||
    queryIndices.length % 3 !== 0 ||
    !queryPositions.every(Number.isFinite) ||
    queryIndices.some(
      (vertex: number): boolean =>
        !Number.isSafeInteger(vertex) || vertex < 0 || vertex >= queryCount,
    ) ||
    origins.length !== count ||
    origins.some(
      (vertex: number, native: number): boolean =>
        !Number.isSafeInteger(vertex) ||
        vertex < 0 ||
        vertex >= queryCount ||
        [0, 1, 2].some(
          (axis: number): boolean =>
            queryPositions[vertex * 3 + axis] !== positions[native * 3 + axis],
        ),
    ) ||
    (exterior !== undefined && exterior.mesh.indices === null)
  )
    throw new Error(
      "Layer exterior must carry exact native origins in a finite indexed common frame.",
    );
  const areaOf: (
    surface: readonly number[],
    at: number,
    triangles?: readonly number[],
  ) => number[] = (
    surface: readonly number[],
    at: number,
    triangles: readonly number[] = indices,
  ): number[] => {
    const [a, b, c]: number[] = [
      triangles[at] * 3,
      triangles[at + 1] * 3,
      triangles[at + 2] * 3,
    ];
    const u: number[] = [
      surface[b] - surface[a],
      surface[b + 1] - surface[a + 1],
      surface[b + 2] - surface[a + 2],
    ];
    const v: number[] = [
      surface[c] - surface[a],
      surface[c + 1] - surface[a + 1],
      surface[c + 2] - surface[a + 2],
    ];
    return [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0],
    ];
  };
  const queryNormals: number[] = new Array<number>(queryPositions.length).fill(
    0,
  );
  const incident: Set<number>[] = Array.from(
    { length: queryCount },
    (): Set<number> => new Set<number>(),
  );
  for (let at: number = 0; at < queryIndices.length; at += 3) {
    const area: number[] = areaOf(queryPositions, at, queryIndices);
    if (!area.every(Number.isFinite))
      throw new Error("Skin triangle area is not representable.");
    for (let corner: number = 0; corner < 3; corner++) {
      incident[queryIndices[at + corner]].add(at / 3);
      for (let axis: number = 0; axis < 3; axis++)
        queryNormals[queryIndices[at + corner] * 3 + axis] += area[axis];
    }
  }
  for (let at: number = 0; at < queryNormals.length; at += 3) {
    const length: number = Math.hypot(
      queryNormals[at],
      queryNormals[at + 1],
      queryNormals[at + 2],
    );
    if (!(length > 0) || !Number.isFinite(length))
      throw new Error(
        "Skin vertex " + at / 3 + " has no finite area-weighted normal.",
      );
    for (let axis: number = 0; axis < 3; axis++)
      queryNormals[at + axis] /= length;
  }
  const normals: number[] = origins.flatMap((vertex: number): number[] =>
    queryNormals.slice(vertex * 3, vertex * 3 + 3),
  );
  const cast: ReturnType<typeof createAutoMovieMeshRayCaster> =
    createAutoMovieMeshRayCaster({
      positions: [...queryPositions],
      normals: queryNormals,
      indices: [...queryIndices],
      uvs: null,
      skin: null,
    });
  const dermis: number[] = new Array<number>(positions.length);
  const fascia: number[] = new Array<number>(positions.length);
  let beyondReachVertices: number = 0;
  let unmeasuredReachVertices: number = 0;
  const beyondReachVertexOrdinals: number[] = [];
  const unmeasuredReachVertexOrdinals: number[] = [];
  let tightestVertex: number | null = null;
  let tightestRatio: number | null = null;
  for (let vertex: number = 0; vertex < count; vertex++) {
    const at: number = vertex * 3;
    const skin: number = field.skinMetres[vertex];
    const both: number = skin + field.subcutaneousMetres[vertex];
    if (!Number.isFinite(both))
      throw new Error(
        "Combined layer thickness is not representable at vertex " + vertex,
      );
    const inward: number[] = [-normals[at], -normals[at + 1], -normals[at + 2]];
    for (let axis: number = 0; axis < 3; axis++) {
      dermis[at + axis] = positions[at + axis] + inward[axis] * skin;
      fascia[at + axis] = positions[at + axis] + inward[axis] * both;
      if (
        !Number.isFinite(dermis[at + axis]) ||
        !Number.isFinite(fascia[at + axis])
      )
        throw new Error(
          "Layer offset is not representable at vertex " + vertex,
        );
    }
    const reach: number | null = cast.nearest(
      [positions[at], positions[at + 1], positions[at + 2]],
      inward,
      Infinity,
      0,
      { excludedTriangles: incident[origins[vertex]] },
    );
    if (reach === null || !(reach > 0) || !Number.isFinite(reach)) {
      unmeasuredReachVertices++;
      unmeasuredReachVertexOrdinals.push(vertex);
      continue;
    }
    const ratio: number = both / reach;
    if (!Number.isFinite(ratio))
      throw new Error(
        "Layer thickness-to-ray ratio is not representable at vertex " + vertex,
      );
    if (ratio >= 0.5) {
      beyondReachVertices++;
      beyondReachVertexOrdinals.push(vertex);
    }
    if (tightestRatio === null || ratio > tightestRatio) {
      tightestRatio = ratio;
      tightestVertex = vertex;
    }
  }
  let invertedTriangles: number = 0;
  let dermalInvertedTriangles: number = 0;
  const fascialInvertedTriangleOrdinals: number[] = [];
  const dermalInvertedTriangleOrdinals: number[] = [];
  for (let at: number = 0; at < indices.length; at += 3) {
    const outer: number[] = areaOf(positions, at);
    const inner: number[] = areaOf(fascia, at);
    const dermal: number[] = areaOf(dermis, at);
    const fasciaOrientation: number =
      outer[0] * inner[0] + outer[1] * inner[1] + outer[2] * inner[2];
    const dermalOrientation: number =
      outer[0] * dermal[0] + outer[1] * dermal[1] + outer[2] * dermal[2];
    if (
      !Number.isFinite(fasciaOrientation) ||
      !Number.isFinite(dermalOrientation)
    )
      throw new Error(
        "Layer triangle orientation is not representable at triangle " + at / 3,
      );
    if (fasciaOrientation <= 0) {
      invertedTriangles++;
      fascialInvertedTriangleOrdinals.push(at / 3);
    }
    if (dermalOrientation <= 0) {
      dermalInvertedTriangles++;
      dermalInvertedTriangleOrdinals.push(at / 3);
    }
  }
  return {
    normals,
    dermis,
    fascia,
    beyondReachVertices,
    unmeasuredReachVertices,
    tightestVertex,
    tightestRatio,
    invertedTriangles,
    dermalInvertedTriangles,
    beyondReachVertexOrdinals,
    unmeasuredReachVertexOrdinals,
    fascialInvertedTriangleOrdinals,
    dermalInvertedTriangleOrdinals,
    qualification:
      "Normal-ray half-travel proxy and triangle orientation observations only; unequal opposite offsets, global embedding and clinical thickness are not certified.",
  };
}
