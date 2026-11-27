import type { IAutoMovieMark } from "@automovie/interface";
import * as THREE from "three";

import { AutoMovieRenderInspectionKinds } from "../../AutoMovieRenderInspectionKinds.js";
import type { IAutoMovieRenderInspectionMeasured } from "../../IAutoMovieRenderInspectionMeasured.js";

/*
 * Read a mesh's triangle edges and return them as one mark lying on the mesh as
 * it is posed, so the triangles are drawn over the shaded surface or alone.
 *
 * Every mesh has edges, so the inspection measures them itself on the meshes it
 * draws. Each edge of a triangle is drawn once, however many triangles share
 * it. Corners are welded by their stored positions, so an indexed geometry and
 * a non-indexed one of the same form give the same edges, and a triangle side
 * between two corners at one place draws nothing. The mark's kind is `edge`,
 * its path the mesh's path followed by `edge`, its label `mesh edge` and its
 * colour the palette's dark blue, which no shade uses.
 *
 * The coordinates are read from the mesh as three.js poses it, morph targets
 * and linear-blend skinning included, through the first stored vertex of each
 * welded corner.
 */
export function measureAutoMovieInspectionEdges(props: {
  /*
   * The mesh to read, drawn and with a position buffer.
   */
  mesh: THREE.Mesh;

  /*
   * The mesh's inspection path.
   */
  path: string;
}): IAutoMovieRenderInspectionMeasured {
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
    for (const [a, b] of sides(at(k), at(k + 1), at(k + 2))) {
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
      label: AutoMovieRenderInspectionKinds.edge!.label,
      color: AutoMovieRenderInspectionKinds.edge!.color,
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

/*
 * The three sides of one triangle, each as its two corner indices.
 */
function sides(a: number, b: number, c: number): [number, number][] {
  return [
    [a, b],
    [b, c],
    [c, a],
  ];
}
