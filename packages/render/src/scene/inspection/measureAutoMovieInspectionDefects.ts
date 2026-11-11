import {
  type IAutoMovieMark,
  type IAutoMovieMeshDefect,
  measureAutoMovieMeshDefects,
} from "@automovie/engine";
import * as THREE from "three";

import { AUTO_MOVIE_INSPECTION_KINDS } from "./AUTO_MOVIE_INSPECTION_KINDS.js";
import type { IAutoMovieInspectionMeasured } from "./IAutoMovieInspectionMeasured.js";

/**
 * Measure a mesh's defects and return them as marks lying on the mesh as it is posed.
 *
 * Every mesh has the quantity, so the inspection measures it itself on the meshes it draws, through the engine's `measureAutoMovieMeshDefects` on the mesh's stored positions. An edge defect becomes a segments mark of its two vertices and a triangle defect a closed polyline of its three. A defect's kind is `defect/<engine kind>`, such as `defect/open`, its path is the mesh's path followed by its kind and its ordinal among that kind on the mesh, such as `panel/defect/open/2`, and its label and colour are those `AUTO_MOVIE_INSPECTION_KINDS` gives the kind, such as `open edge` in red.
 *
 * Only the `kinds` asked are returned, and `sliver` is the aspect limit the engine needs for slivers. `measured` caches the engine's answer by geometry, so meshes that share one are measured once. Each mesh still gets its own marks, because their coordinates are read from that mesh's pose: morph targets and linear-blend skinning included, a dual-quaternion skin by its linear-blend pose.
 *
 * An engine refusal of the buffers is rethrown naming the mesh's path.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States why the inspection measures this kind itself, how each defect becomes a mark, its kind, path, label and colour, the filter, the cache and its limit, what the posed coordinates include, and the refusal.
 * @evidence contracts/development/implementation.md#principled-implementation A defect is located by vertex indices into the stored buffer, so its mark keeps those indices and its coordinates are their posed positions in the mesh's space, which the mesh's world matrix carries into the scene.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Measure through the cache, then one mark per kept defect with its index run, then a refresh that rewrites every mark from its run.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Edge or triangle is read from the defect's own vertex count, not from a list of kind names, and positions are read through the attribute so interleaved and normalized buffers give metres.
 * @evidence contracts/development/implementation.md#efficient-algorithms The engine's measure dominates and runs once per geometry; building and each refresh are linear in the marked vertices.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller's cache shares one measurement among meshes with the same geometry, the only input the defects depend on; the sliver limit is fixed for one inspection.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The marks and their index runs live as long as the caller keeps the record; the mesh is borrowed and the cache is the caller's.
 */
export function measureAutoMovieInspectionDefects(props: {
  /** The mesh to measure, drawn and with a position buffer. */
  mesh: THREE.Mesh;

  /** The mesh's inspection path. */
  path: string;

  /** The engine kinds to return. */
  kinds: ReadonlySet<IAutoMovieMeshDefect.Kind>;

  /** Sliver aspect limit, or null when slivers are not measured. */
  sliver: number | null;

  /** The engine's defects by geometry, shared across the meshes of one inspection. */
  measured: Map<THREE.BufferGeometry, IAutoMovieMeshDefect[]>;
}): IAutoMovieInspectionMeasured {
  const mesh: THREE.Mesh = props.mesh;
  let defects: IAutoMovieMeshDefect[] | undefined = props.measured.get(
    mesh.geometry,
  );
  if (defects === undefined) {
    defects = measure(mesh.geometry, props.path, props.sliver);
    props.measured.set(mesh.geometry, defects);
  }

  // One mark per kept defect, numbered within its kind on this mesh.
  const ordinals: Map<string, number> = new Map<string, number>();
  const runs: number[][] = [];
  const marks: IAutoMovieMark[] = [];
  for (const defect of defects) {
    if (!props.kinds.has(defect.kind)) continue;
    const ordinal: number = ordinals.get(defect.kind) ?? 0;
    ordinals.set(defect.kind, ordinal + 1);
    const edge: boolean = defect.vertices.length === 2;
    const kind: string = `defect/${defect.kind}`;
    const points: number[] = new Array<number>(defect.vertices.length * 3).fill(
      0,
    );
    runs.push([...defect.vertices]);
    marks.push({
      path:
        props.path === ""
          ? `${kind}/${ordinal}`
          : `${props.path}/${kind}/${ordinal}`,
      kind,
      label: AUTO_MOVIE_INSPECTION_KINDS[kind]!.label,
      color: AUTO_MOVIE_INSPECTION_KINDS[kind]!.color,
      shape: edge
        ? { type: "segments", points }
        : { type: "polyline", points, closed: true },
      flagged: false,
      anchor: props.path,
    });
  }

  const posed: THREE.Vector3 = new THREE.Vector3();
  const refresh: () => void = (): void => {
    marks.forEach((mark: IAutoMovieMark, m: number): void => {
      const points: number[] = (
        mark.shape as IAutoMovieMark.ISegments | IAutoMovieMark.IPolyline
      ).points;
      runs[m]!.forEach((vertex: number, k: number): void => {
        mesh.getVertexPosition(vertex, posed);
        points[k * 3] = posed.x;
        points[k * 3 + 1] = posed.y;
        points[k * 3 + 2] = posed.z;
      });
    });
  };
  refresh();
  return { anchor: mesh, marks, refresh };
}

/** Measure one geometry's defects on its stored positions, naming the mesh's path when the engine refuses the buffers. */
function measure(
  geometry: THREE.BufferGeometry,
  path: string,
  sliver: number | null,
): IAutoMovieMeshDefect[] {
  // Read through the attribute so interleaved and normalized buffers give metres.
  const position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute =
    geometry.getAttribute("position");
  const positions: Float32Array = new Float32Array(position.count * 3);
  for (let i: number = 0; i < position.count; i++) {
    positions[i * 3] = position.getX(i);
    positions[i * 3 + 1] = position.getY(i);
    positions[i * 3 + 2] = position.getZ(i);
  }
  try {
    return measureAutoMovieMeshDefects(
      { positions, indices: geometry.getIndex()?.array ?? null },
      sliver === null ? {} : { sliver },
    );
  } catch (error) {
    throw new Error(
      `Mesh "${path}" cannot be measured for defects: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
}
