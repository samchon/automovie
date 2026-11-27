import type {
  IAutoMovieSubdivisionCage,
  IAutoMovieSubdivisionCrease,
  IAutoMovieSubdivisionLevel,
  IAutoMovieSubdivisionTopology,
} from "@automovie/interface";

import { buildSubdivisionTopology } from "./buildSubdivisionTopology";

/*
 * Validate a subdivision cage and turn it into level zero.
 *
 * Refused, each with the offending index, before any refinement: positions that
 * are empty, not packed in threes or not finite; no faces; a face with fewer
 * than three corners, a corner that indexes no vertex, or a repeated vertex; a
 * crease with an invalid end, equal ends, a sharpness outside 0 to 10, a
 * repeated edge, or no matching cage edge; UVs without UV faces or the reverse,
 * UVs not packed in pairs or not finite, UV faces not shaped like the faces, a
 * UV index out of range, a UV shared by two vertices, or an unused UV; and
 * every manifold refusal of `buildSubdivisionTopology`. Inputs are only read.
 * Parameter cage: The authored cage.
 * Returns: Level zero, with each quad corner at its parameter square corner and
 * each other corner at `(0, 0)` of its own sub-face.
 */
export const admitSubdivisionCage = (
  cage: IAutoMovieSubdivisionCage,
): IAutoMovieSubdivisionLevel => {
  const positions: number[] = cage.positions.slice();
  if (positions.length === 0 || positions.length % 3 !== 0)
    throw new Error(
      "subdivision cage positions must hold x, y, z for at least one vertex",
    );
  const vertexCount: number = positions.length / 3;
  if (cage.faces.length === 0)
    throw new Error("subdivision cage needs at least one face");
  const faceOffsets: number[] = [0];
  const faceVertices: number[] = [];
  cage.faces.forEach((face: readonly number[], f: number): void => {
    if (face.length < 3)
      throw new Error(
        `subdivision cage face ${f} needs at least three corners`,
      );
    face.forEach((v: number, k: number): void => {
      if (v < 0 || v >= vertexCount)
        throw new Error(
          `subdivision cage face ${f} corner ${k} must index a cage vertex`,
        );
      if (face.indexOf(v) !== k)
        throw new Error(`subdivision cage face ${f} repeats vertex ${v}`);
      faceVertices.push(v);
    });
    faceOffsets.push(faceVertices.length);
  });

  const key: (a: number, b: number) => number = (
    a: number,
    b: number,
  ): number => Math.min(a, b) * vertexCount + Math.max(a, b);
  const sharpness: Map<number, number> = new Map<number, number>();
  (cage.creases ?? []).forEach(
    (crease: IAutoMovieSubdivisionCrease, i: number): void => {
      for (const end of [crease.from, crease.to])
        if (end < 0 || end >= vertexCount)
          throw new Error(
            `subdivision cage crease ${i} must join two cage vertices`,
          );
      if (crease.from === crease.to)
        throw new Error(
          `subdivision cage crease ${i} must join two cage vertices`,
        );
      if (crease.sharpness < 0 || crease.sharpness > 10)
        throw new Error(
          `subdivision cage crease ${i} sharpness must be from 0 to 10`,
        );
      if (sharpness.has(key(crease.from, crease.to)))
        throw new Error(
          `subdivision cage crease ${i} repeats edge ${crease.from}-${crease.to}`,
        );
      sharpness.set(key(crease.from, crease.to), crease.sharpness);
    },
  );
  const topology: IAutoMovieSubdivisionTopology = buildSubdivisionTopology(
    vertexCount,
    faceOffsets,
    faceVertices,
    (a: number, b: number): number => sharpness.get(key(a, b)) ?? 0,
  );
  const edges: Set<number> = new Set<number>();
  for (let e: number = 0; e < topology.edgeSharpness.length; ++e)
    edges.add(
      key(topology.edgeVertices[e * 2]!, topology.edgeVertices[e * 2 + 1]!),
    );
  (cage.creases ?? []).forEach(
    (crease: IAutoMovieSubdivisionCrease, i: number): void => {
      if (!edges.has(key(crease.from, crease.to)))
        throw new Error(
          `subdivision cage crease ${i} names no cage edge ${crease.from}-${crease.to}`,
        );
    },
  );

  const parameterFaces: number[] = [];
  const parameterCorners: number[] = [];
  const parameterU: number[] = [];
  const parameterV: number[] = [];
  cage.faces.forEach((face: readonly number[], f: number): void => {
    face.forEach((_v: number, k: number): void => {
      parameterFaces.push(f);
      parameterCorners.push(face.length === 4 ? -1 : k);
      parameterU.push(face.length === 4 ? [0, 1, 1, 0][k]! : 0);
      parameterV.push(face.length === 4 ? [0, 0, 1, 1][k]! : 0);
    });
  });
  return {
    topology,
    positions,
    ...admitUvs(cage, faceVertices),
    cage: true,
    parameterFaces,
    parameterCorners,
    parameterU,
    parameterV,
  };
};

/*
 * The cage's UVs and corner UV indices, or both `null`, after their checks.
 */
const admitUvs: (
  cage: IAutoMovieSubdivisionCage,
  faceVertices: readonly number[],
) => { uvs: number[] | null; cornerUvs: number[] | null } = (
  cage: IAutoMovieSubdivisionCage,
  faceVertices: readonly number[],
): { uvs: number[] | null; cornerUvs: number[] | null } => {
  if (cage.uvs === undefined && cage.uvFaces === undefined)
    return { uvs: null, cornerUvs: null };
  if (cage.uvs === undefined || cage.uvFaces === undefined)
    throw new Error("subdivision cage uvs and uvFaces must be given together");
  const uvs: number[] = cage.uvs.slice();
  if (uvs.length % 2 !== 0)
    throw new Error("subdivision cage uvs must hold u, v pairs");
  const uvCount: number = uvs.length / 2;
  if (cage.uvFaces.length !== cage.faces.length)
    throw new Error("subdivision cage uvFaces must hold one row per face");
  const cornerUvs: number[] = [];
  cage.uvFaces.forEach((row: readonly number[], f: number): void => {
    if (row.length !== cage.faces[f]!.length)
      throw new Error(
        `subdivision cage uvFaces[${f}] must name one UV per corner`,
      );
    row.forEach((t: number, k: number): void => {
      if (t < 0 || t >= uvCount)
        throw new Error(
          `subdivision cage uvFaces[${f}][${k}] must index a cage UV`,
        );
      cornerUvs.push(t);
    });
  });
  const owners: number[] = new Array<number>(uvCount).fill(-1);
  cornerUvs.forEach((t: number, c: number): void => {
    if (owners[t] !== -1 && owners[t] !== faceVertices[c])
      throw new Error(
        `subdivision cage uv ${t} is used by vertices ${owners[t]} and ${faceVertices[c]}`,
      );
    owners[t] = faceVertices[c]!;
  });
  owners.forEach((owner: number, t: number): void => {
    if (owner === -1)
      throw new Error(`subdivision cage uv ${t} is used by no face corner`);
  });
  return { uvs, cornerUvs };
};
