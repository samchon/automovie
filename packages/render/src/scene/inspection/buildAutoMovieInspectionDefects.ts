import type { IAutoMovieMeshDefect } from "@automovie/engine";
import * as THREE from "three";

import { AUTO_MOVIE_INSPECTION_PALETTE } from "./AUTO_MOVIE_INSPECTION_PALETTE.js";
import type { IAutoMovieInspectionLegendEntry } from "./IAutoMovieInspectionLegendEntry.js";
import type { IAutoMovieInspectionOverlay } from "./IAutoMovieInspectionOverlay.js";
import { createAutoMovieInspectionSegments } from "./createAutoMovieInspectionSegments.js";
import { followAutoMovieInspectionSource } from "./followAutoMovieInspectionSource.js";
import { mergeAutoMovieInspectionLegends } from "./mergeAutoMovieInspectionLegends.js";

/**
 * Draw the defects measured on a mesh as coloured line segments lying on that mesh as it is posed.
 *
 * A defect with two vertices is an edge and draws one segment; a defect with three is a triangle and draws its three edges. Each takes the palette colour of its kind. The legend counts defects under `open edge`, `non-manifold edge`, `inconsistent edge`, `degenerate triangle` and `sliver triangle`. A triangle whose three corners are one point draws nothing in WebGL and is still counted.
 *
 * `defects` must be measured on this mesh's own position buffer, because their vertices are indices into it. On `update` every mark vertex is read from the mesh as three.js poses it, morph targets and linear-blend skinning included, so the marks stay on a moving surface. A dual-quaternion skin is followed by its linear-blend pose, and an instanced mesh is marked on its first instance.
 *
 * It throws for a defect that does not hold two or three vertices, or that names a vertex outside the buffer.
 *
 * ```ts
 * const position = mesh.geometry.getAttribute("position");
 * const overlay = buildAutoMovieInspectionDefects(
 *   mesh,
 *   measureAutoMovieMeshDefects({
 *     positions: position.array,
 *     indices: mesh.geometry.getIndex()?.array ?? null,
 *   }),
 *   { stroke: 3, xray: false },
 * );
 * scene.add(overlay.object);
 * overlay.update();
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the segments per defect, the colour and legend rule, the one mark WebGL cannot draw, the buffer premise, what a posed update follows and its two limits, the refusals, and shows the measure, build, attach and update order.
 * @evidence contracts/development/implementation.md#principled-implementation A defect is located by vertex indices, so its mark is rebuilt from those vertices' current posed positions in the mesh's space and carried by the mesh's world matrix.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission and counting, one fill of the corner list and colours, then an update that rewrites positions from the corner list.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Edge or triangle is read from the defect's own vertex count, not from a list of kind names, and an out-of-range vertex is refused instead of drawn at the origin.
 * @evidence contracts/development/implementation.md#efficient-algorithms Building and each update are linear in the marked corners, not in the mesh; every defect of the mesh is one draw call.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Posed positions come from three.js's own `getVertexPosition`; the line object, the follow rule and the legend tally are the shared inspection helpers.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The overlay owns one geometry, one material and one corner list and releases the first two in `dispose`; it borrows the mesh and keeps no defect record.
 */
export function buildAutoMovieInspectionDefects(
  mesh: THREE.Mesh,
  defects: readonly IAutoMovieMeshDefect[],
  options: { stroke: number; xray: boolean },
): IAutoMovieInspectionOverlay {
  // Admit every defect and count its segments before allocating.
  const vertexCount: number = mesh.geometry.getAttribute("position").count;
  let count: number = 0;
  for (const defect of defects) {
    if (defect.vertices.length !== 2 && defect.vertices.length !== 3)
      throw new Error(
        `A ${defect.kind} defect holds ${defect.vertices.length} vertices, not an edge's two or a triangle's three`,
      );
    for (const vertex of defect.vertices)
      if (!Number.isInteger(vertex) || vertex < 0 || vertex >= vertexCount)
        throw new Error(
          `A ${defect.kind} defect names vertex ${vertex}, outside the ${vertexCount} vertices of mesh "${mesh.name}"`,
        );
    count += defect.vertices.length === 2 ? 1 : 3;
  }

  // The two vertex indices of every segment, each with the colour of its defect.
  const corners: Uint32Array = new Uint32Array(count * 2);
  const colors: Float32Array = new Float32Array(count * 6);
  const legend: IAutoMovieInspectionLegendEntry[][] = [];
  const color: THREE.Color = new THREE.Color();
  let cursor: number = 0;
  for (const defect of defects) {
    const hex: number = AUTO_MOVIE_INSPECTION_PALETTE.defect[defect.kind];
    const edge: boolean = defect.vertices.length === 2;
    legend.push([
      {
        label: `${defect.kind} ${edge ? "edge" : "triangle"}`,
        color: hex,
        count: 1,
      },
    ]);
    color.setHex(hex);

    const sides: number = edge ? 1 : 3;
    for (let s: number = 0; s < sides; s++)
      for (const corner of [s, (s + 1) % defect.vertices.length]) {
        corners[cursor] = defect.vertices[corner]!;
        colors[cursor * 3] = color.r;
        colors[cursor * 3 + 1] = color.g;
        colors[cursor * 3 + 2] = color.b;
        cursor++;
      }
  }

  const positions: Float32Array = new Float32Array(count * 6);
  const object: THREE.LineSegments = createAutoMovieInspectionSegments(
    positions,
    colors,
    options,
  );
  const posed: THREE.Vector3 = new THREE.Vector3();
  const instance: THREE.Matrix4 = new THREE.Matrix4();
  return {
    object,
    legend: mergeAutoMovieInspectionLegends(legend),
    update: (): void => {
      // Posed positions in the mesh's own space.
      for (let i: number = 0; i < corners.length; i++) {
        mesh.getVertexPosition(corners[i]!, posed);
        positions[i * 3] = posed.x;
        positions[i * 3 + 1] = posed.y;
        positions[i * 3 + 2] = posed.z;
      }
      object.geometry.getAttribute("position").needsUpdate = true;

      // The mesh's world placement, through its first instance when it is instanced.
      if (mesh instanceof THREE.InstancedMesh && mesh.count > 0) {
        mesh.getMatrixAt(0, instance);
        followAutoMovieInspectionSource(object, mesh, instance);
      } else followAutoMovieInspectionSource(object, mesh);
    },
    dispose: (): void => {
      object.removeFromParent();
      object.geometry.dispose();
      (object.material as THREE.Material).dispose();
    },
  };
}
