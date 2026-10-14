import {
  Vector3,
  compareCodeUnits,
  createAutoMovieMeshDeformer,
} from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieMeshDeformationField,
  IAutoMovieVector3,
} from "@automovie/interface";

import { areaWeightedNormals } from "../../common/mesh/areaWeightedNormals";
import { createMetricMeshPart } from "../mesh/createMetricMeshPart";
import type { IControlMesh } from "../mesh/structures/IControlMesh";
import { refinePortraitSurfaceSampling } from "./refinePortraitSurfaceSampling";
import type { IPortraitSurfaceEdge } from "./structures/IPortraitSurfaceEdge";
import type { IPortraitSurfaceHost } from "./structures/IPortraitSurfaceHost";
import type { IPortraitSurfaceLayer } from "./structures/IPortraitSurfaceLayer";
import type { IPortraitSurfaceNeighbour } from "./structures/IPortraitSurfaceNeighbour";

/**
 * Apply anatomical layers after refinement and before shared normals/material
 * regions are extracted. Open eye, mouth and crop boundaries remain exact;
 * a quintic fade reaches full influence over the declared edge-graph distance.
 * Unreferenced gaze markers remain unchanged. Zero layers/fields are identity.
 *
 * attachmentFade and the returned cage use millimetres. Layer factories emit
 * metre-valued engine fields. The fade and its derivative are supplied to that
 * same deformation operation, so its Jacobian and emitted-triangle checks see
 * the final masked map. Convert only at that boundary, then add its displacement
 * back to the original millimetre coordinates. Zero influence remains exact.
 *
 * Every layer reads the same host; stable ID sorting fixes summation order.
 * The host has already passed topology validation. Optional layer sampling
 * inserts shared midpoints without moving the basis; omission preserves its
 * triangles. Material groups survive, and the caller recomputes normals after
 * the boundary fade, whose spatial gradient also changes the surface slope.
 * Layer host immutability is a producer contract, not a runtime freeze here.
 * Edge-distance relaxation and averaged one-sided gradients are mesh samples,
 * not an exact continuous geodesic or global self-intersection proof. The
 * default 3 mm fade is an authored attachment protocol, not measured anatomy.
 *
 * @evidence contracts/common.md#principled-implementation Stable ordered fields deform the shared metric mesh with a quintic free-rim mask and its averaged gradient included in the engine Jacobian; adding metric displacement back preserves exact zero-influence millimetre coordinates.
 * @evidence contracts/common.md#clear-and-simple-design Layer providers own fields, optional refinement owns shared sampling and the engine owns masked deformation admission; this coordinator owns attachment distances and unit conversion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Free-rim masking and the authored 3 mm default do not calibrate anatomy; the borrowed host must remain unmodified, and sampled Jacobian/triangle checks do not prove global embeddedness.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes millimetre cages/fade from metre fields, layer ordering, exact identity cases, host purity and discrete-distance limitations.
 * @evidence contracts/performance.md#efficient-algorithms Layer sorting costs O(L log L), normals/edges/gradients O(V+T), and local queue relaxation may revisit vertices; optional refinement can grow geometry without a fixed bound and deformation costs O(V*F+T).
 * @evidence contracts/performance.md#reuse-equivalent-work One unchanged host serves all field factories and one ordered field compilation serves the refined mesh; edge distances and gradients are shared across fields but invalid after geometry changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Plans, graph arrays, queue, metric buffers and influences are call-local and grow with refined geometry/fields; no fixed refinement population bound or global retained resource exists.
 */
export function applyPortraitSurfaceLayers(
  mesh: IControlMesh,
  layers: readonly IPortraitSurfaceLayer[],
  attachmentFade: number = 3,
): IControlMesh {
  if (!Number.isFinite(attachmentFade) || attachmentFade <= 0)
    throw new Error(
      "A surface attachment fade must be a positive millimetre distance.",
    );
  if (
    layers.some(
      (layer: IPortraitSurfaceLayer): boolean => layer.id.trim().length === 0,
    ) ||
    new Set(layers.map((layer: IPortraitSurfaceLayer): string => layer.id))
      .size !== layers.length
  )
    throw new Error("Anatomical surface layer identities must be unique.");
  if (layers.length === 0) return mesh;
  const packed: number[] = mesh.positions.flat();
  const host: IPortraitSurfaceHost = {
    positions: mesh.positions,
    indices: mesh.indices,
    normals: areaWeightedNormals(packed, mesh.indices),
  };
  const plans: {
    layer: IPortraitSurfaceLayer;
    fields: IAutoMovieMeshDeformationField[];
  }[] = [...layers]
    .sort((a: IPortraitSurfaceLayer, b: IPortraitSurfaceLayer): number =>
      compareCodeUnits(a.id, b.id),
    )
    .map(
      (
        layer: IPortraitSurfaceLayer,
      ): {
        layer: IPortraitSurfaceLayer;
        fields: IAutoMovieMeshDeformationField[];
      } => ({ layer, fields: layer.fields(host) }),
    );
  const fields: IAutoMovieMeshDeformationField[] = plans.flatMap(
    (plan: {
      layer: IPortraitSurfaceLayer;
      fields: IAutoMovieMeshDeformationField[];
    }): IAutoMovieMeshDeformationField[] => plan.fields,
  );
  if (fields.length === 0) return mesh;
  const deform: ReturnType<typeof createAutoMovieMeshDeformer> =
    createAutoMovieMeshDeformer(fields);
  for (const plan of plans)
    if (plan.layer.sampleSpacing !== undefined && plan.fields.length !== 0)
      mesh = refinePortraitSurfaceSampling(
        mesh,
        plan.fields,
        plan.layer.sampleSpacing,
      );
  packed.length = 0;
  for (const point of mesh.positions) packed.push(...point);
  const metric: IAutoMovieMesh = createMetricMeshPart(
    "surface-basis",
    {
      positions: packed,
      indices: mesh.indices,
      normals: null,
      uvs: null,
      skin: null,
    },
    "skin",
  ).geometry.mesh;
  // Count undirected edges on the complete skin, before material separation.
  // A one-face edge is an intentional free rim, so colour seams do not become
  // artificial deformation barriers. Edge lengths use construction millimetres.
  const edges: Map<string, IPortraitSurfaceEdge> = new Map<
    string,
    IPortraitSurfaceEdge
  >();
  for (let i: number = 0; i < mesh.indices.length; i += 3)
    for (let corner: number = 0; corner < 3; corner++) {
      const a: number = mesh.indices[i + corner],
        b: number = mesh.indices[i + ((corner + 1) % 3)],
        key: string = a < b ? `${a}/${b}` : `${b}/${a}`;
      const edge: IPortraitSurfaceEdge | undefined = edges.get(key);
      if (edge !== undefined) edge.count++;
      else
        edges.set(key, {
          a,
          b,
          count: 1,
          length: Math.hypot(
            ...mesh.positions[a].map(
              (value: number, axis: number): number =>
                value - mesh.positions[b][axis],
            ),
          ),
        });
    }
  const neighbours: IPortraitSurfaceNeighbour[][] = mesh.positions.map(
    (): IPortraitSurfaceNeighbour[] => [],
  );
  const distances: Float64Array = new Float64Array(mesh.positions.length).fill(
    Infinity,
  );
  const queued: Uint8Array = new Uint8Array(mesh.positions.length),
    queue: number[] = [];
  for (const edge of edges.values()) {
    neighbours[edge.a].push({ vertex: edge.b, length: edge.length });
    neighbours[edge.b].push({ vertex: edge.a, length: edge.length });
    if (edge.count === 1)
      for (const id of [edge.a, edge.b])
        if (distances[id] !== 0) {
          distances[id] = 0;
          queued[id] = 1;
          queue.push(id);
        }
  }
  // Positive edge lengths and a bounded reach make queue relaxation local to
  // the openings. It avoids scanning the whole dense skin for each next node.
  for (let cursor: number = 0; cursor < queue.length; cursor++) {
    const id: number = queue[cursor];
    queued[id] = 0;
    for (const near of neighbours[id]) {
      const distance: number = distances[id] + near.length;
      if (distance >= attachmentFade || distance >= distances[near.vertex])
        continue;
      distances[near.vertex] = distance;
      if (queued[near.vertex] === 0) {
        queued[near.vertex] = 1;
        queue.push(near.vertex);
      }
    }
  }
  // Distances are linearly interpolated over each original refined triangle.
  // At a shared vertex that piecewise field has several one-sided gradients;
  // their area-weighted mean is the declared vertex differential used by the
  // sampled deformation guard. Clamping distance before differentiation keeps
  // the full-influence region finite and constant. It does not claim an exact
  // continuous geodesic solver between the mesh samples.
  const clamped: number[] = Array.from(distances, (distance: number): number =>
    Math.min(attachmentFade, distance),
  );
  const gradients: IAutoMovieVector3[] = mesh.positions.map(
    (): IAutoMovieVector3 => Vector3.create(),
  );
  const areas: Float64Array = new Float64Array(mesh.positions.length);
  for (let i: number = 0; i < mesh.indices.length; i += 3) {
    const [a, b, c]: number[] = mesh.indices.slice(i, i + 3);
    const point: (id: number) => IAutoMovieVector3 = (
      id: number,
    ): IAutoMovieVector3 =>
      Vector3.create(
        mesh.positions[id][0],
        mesh.positions[id][1],
        mesh.positions[id][2],
      );
    const ab: IAutoMovieVector3 = Vector3.subtract(point(b), point(a));
    const ac: IAutoMovieVector3 = Vector3.subtract(point(c), point(a));
    const cross: IAutoMovieVector3 = Vector3.cross(ab, ac);
    const area: number = Math.hypot(cross.x, cross.y, cross.z);
    if (!Number.isFinite(area) || area === 0)
      throw new Error(
        "Portrait attachment gradients require finite nondegenerate host triangles.",
      );
    const normal: IAutoMovieVector3 = Vector3.scale(cross, 1 / area);
    // This is gradient(distance) multiplied by double area. The dual edge
    // vectors avoid squaring the area, which needlessly loses very small faces.
    const weighted: IAutoMovieVector3 = Vector3.add(
      Vector3.scale(Vector3.cross(ac, normal), clamped[b] - clamped[a]),
      Vector3.scale(Vector3.cross(normal, ab), clamped[c] - clamped[a]),
    );
    for (const vertex of [a, b, c]) {
      gradients[vertex] = Vector3.add(gradients[vertex], weighted);
      areas[vertex] += area;
    }
  }
  // Quintic smoothstep has zero first and second derivatives at both ends.
  // Its derivative is 30*t^2*(1-t)^2. Distances/areas above use mm, so multiply
  // the resulting inverse-mm mask gradient by 1000 for the engine's metre frame.
  // Isolated gaze markers receive zero mask; closed regions receive one.
  const influence: { weight: number; gradient: IAutoMovieVector3 }[] =
    mesh.positions.map(
      (
        _point: number[],
        id: number,
      ): { weight: number; gradient: IAutoMovieVector3 } => {
        const t: number =
          neighbours[id].length === 0 ? 0 : clamped[id] / attachmentFade;
        // Evaluate the nearer half and reflect it. The direct polynomial can
        // round above one just below t=1, contradicting the mask's bounded domain.
        const half: number = Math.min(t, 1 - t);
        const value: number =
          half * half * half * (10 + half * (-15 + 6 * half));
        const weight: number = t <= 0.5 ? value : 1 - value;
        const derivative: number = 30 * t * t * (1 - t) ** 2;
        const gradient: IAutoMovieVector3 =
          areas[id] === 0
            ? Vector3.create()
            : Vector3.scale(
                gradients[id],
                (1000 * derivative) / (attachmentFade * areas[id]),
              );
        return { weight, gradient };
      },
    );
  const changed: IAutoMovieMesh = deform(metric, influence);
  return {
    ...mesh,
    positions: mesh.positions.map((point: number[], id: number): number[] => {
      return point.map(
        (value: number, axis: number): number =>
          value +
          (changed.positions[3 * id + axis] - metric.positions[3 * id + axis]) *
            1000,
      );
    }),
  };
}
