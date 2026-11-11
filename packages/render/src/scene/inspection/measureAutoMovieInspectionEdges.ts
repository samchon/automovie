import type { IAutoMovieMark } from "@automovie/engine";
import * as THREE from "three";

import { AUTO_MOVIE_INSPECTION_KINDS } from "./AUTO_MOVIE_INSPECTION_KINDS.js";
import type { IAutoMovieInspectionMeasured } from "./IAutoMovieInspectionMeasured.js";

/**
 * Read a mesh's triangle edges and return them as one mark lying on the mesh as it is posed, so the triangles are drawn over the shaded surface or alone.
 *
 * Every mesh has edges, so the inspection measures them itself on the meshes it draws. Each edge of a triangle is drawn once, however many triangles share it. Corners are welded by their stored positions, so an indexed geometry and a non-indexed one of the same form give the same edges, and a triangle side between two corners at one place draws nothing. The mark's kind is `edge`, its path the mesh's path followed by `edge`, its label `mesh edge` and its colour the palette's dark blue, which no shade uses.
 *
 * The coordinates are read from the mesh as three.js poses it, morph targets and linear-blend skinning included, through the first stored vertex of each welded corner.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States why the inspection measures this kind itself, the once-per-edge and welding rules with their consequence for indexed and non-indexed forms, the kind, path, label and colour, and what the posed coordinates include.
 * @evidence contracts/development/implementation.md#principled-implementation An edge is an unordered pair of distinct corners of a triangle; welding by exact stored position identifies the corners a non-indexed geometry repeats per triangle, which is the topology an indexed one states, so both give one edge set.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Weld the corners, collect each triangle's three sides into one set keyed by the welded pair, then a refresh that writes each edge's two posed ends.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Positions are read through the attribute so interleaved and normalized buffers give metres, a group-split or drawn range is not used to skip triangles, and no mesh is skipped by name.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the stored vertices and the triangles, with one hashed lookup per corner and per side; each refresh is linear in the edges.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each mesh's edges are read once per inspection and rewritten in place on every refresh.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The mark and its corner runs live as long as the caller keeps the record; the mesh is borrowed.
 */
export function measureAutoMovieInspectionEdges(props: {
  /** The mesh to read, drawn and with a position buffer. */
  mesh: THREE.Mesh;

  /** The mesh's inspection path. */
  path: string;
}): IAutoMovieInspectionMeasured {
  const mesh: THREE.Mesh = props.mesh;
  const position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute =
    mesh.geometry.getAttribute("position");

  // Weld: the first stored vertex at each position stands for every vertex there.
  const welded: Map<string, number> = new Map<string, number>();
  const corner: Int32Array = new Int32Array(position.count);
  for (let i: number = 0; i < position.count; i++) {
    const key: string = `${position.getX(i)},${position.getY(i)},${position.getZ(i)}`;
    const first: number | undefined = welded.get(key);
    if (first === undefined) welded.set(key, i);
    corner[i] = first ?? i;
  }

  // Each triangle side once, keyed by its welded ends.
  const index: THREE.BufferAttribute | null = mesh.geometry.getIndex();
  const count: number = index === null ? position.count : index.count;
  const at: (k: number) => number = (k: number): number =>
    corner[index === null ? k : index.getX(k)]!;
  const seen: Set<number> = new Set<number>();
  const ends: number[] = [];
  for (let k: number = 0; k + 2 < count; k += 3)
    for (const [a, b] of [
      [at(k), at(k + 1)],
      [at(k + 1), at(k + 2)],
      [at(k + 2), at(k)],
    ] as [number, number][]) {
      if (a === b) continue;
      const key: number = Math.min(a, b) * position.count + Math.max(a, b);
      if (seen.has(key)) continue;
      seen.add(key);
      ends.push(a, b);
    }

  const points: number[] = new Array<number>(ends.length * 3).fill(0);
  const marks: IAutoMovieMark[] = [];
  if (ends.length !== 0)
    marks.push({
      path: props.path === "" ? "edge" : `${props.path}/edge`,
      kind: "edge",
      label: AUTO_MOVIE_INSPECTION_KINDS.edge!.label,
      color: AUTO_MOVIE_INSPECTION_KINDS.edge!.color,
      shape: { type: "segments", points },
      flagged: false,
      anchor: props.path,
    });
  const posed: THREE.Vector3 = new THREE.Vector3();
  const refresh: () => void = (): void => {
    ends.forEach((vertex: number, k: number): void => {
      mesh.getVertexPosition(vertex, posed);
      points[k * 3] = posed.x;
      points[k * 3 + 1] = posed.y;
      points[k * 3 + 2] = posed.z;
    });
  };
  refresh();
  return { anchor: mesh, marks, refresh };
}
