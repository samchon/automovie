import { components } from "../geometry/components.ts";
import { cross } from "../geometry/cross.ts";
import { len } from "../geometry/len.ts";
import { sub } from "../geometry/sub.ts";
import { weld } from "../geometry/weld.ts";
import type { EvaluationMesh } from "./EvaluationMesh.ts";

/**
 * Records raw and 0.001 mm connectivity-welded topology without repairing or certifying surface embedding.
 *
 * @evidence contracts/common.md#principled-implementation Edge incidence, paired orientation and connected components expose topological defects under explicit connectivity.
 * @evidence contracts/common.md#clear-and-simple-design Raw indices and tolerance-dependent connectivity receive separate reports.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Welding is a declared diagnostic and never changes the measured positions or generated model.
 * @evidence contracts/common.md#meaningful-documentation States raw-versus-welded meaning and the absence of self-intersection certification.
 * @evidence contracts/performance.md#efficient-algorithms Triangle and edge accounting are linear apart from documented weld degeneracy, retaining linear maps.
 * @evidence contracts/performance.md#reuse-equivalent-work Both modes consume the same immutable geometry and their explicitly selected labels.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local maps and connectivity buffers release after report construction.
 */
export function surfaceTopology(mesh: EvaluationMesh): object {
  const count = (canonical: Int32Array): object => {
    const triangles: [number, number, number][] = mesh.triangles.map(
      (t: [number, number, number]): [number, number, number] => [
        canonical[t[0]],
        canonical[t[1]],
        canonical[t[2]],
      ],
    );
    const edges: Map<string, { uses: number; orientation: number }> = new Map();
    const faces: Set<string> = new Set(),
      used: Set<number> = new Set();
    let duplicateTriangles: number = 0,
      collapsedTriangles: number = 0;
    for (const t of triangles) {
      for (const v of t) used.add(v);
      if (new Set(t).size < 3) collapsedTriangles++;
      const face: string = [...t]
        .sort((a: number, b: number): number => a - b)
        .join(",");
      if (faces.has(face)) duplicateTriangles++;
      faces.add(face);
      for (let k: number = 0; k < 3; k++) {
        const a: number = t[k],
          b: number = t[(k + 1) % 3],
          key: string = a < b ? `${a},${b}` : `${b},${a}`;
        if (!edges.has(key)) edges.set(key, { uses: 0, orientation: 0 });
        const edge: { uses: number; orientation: number } = edges.get(key)!;
        edge.uses++;
        edge.orientation += a < b ? 1 : a > b ? -1 : 0;
      }
    }
    return {
      usedVertices: used.size,
      triangles: triangles.length,
      edges: edges.size,
      boundaryEdges: [...edges.values()].filter(
        (edge: { uses: number }): boolean => edge.uses === 1,
      ).length,
      nonmanifoldEdges: [...edges.values()].filter(
        (edge: { uses: number }): boolean => edge.uses > 2,
      ).length,
      inconsistentPairedEdges: [...edges.values()].filter(
        (edge: { uses: number; orientation: number }): boolean =>
          edge.uses === 2 && edge.orientation !== 0,
      ).length,
      collapsedTriangles,
      duplicateTriangles,
      connectedComponents: components(mesh.vertices.length, triangles).count,
      eulerCharacteristic: used.size - edges.size + triangles.length,
    };
  };
  return {
    vertices: mesh.vertices.length,
    zeroAreaTriangles: mesh.triangles.filter(
      (t: [number, number, number]): boolean =>
        len(
          cross(
            sub(mesh.vertices[t[1]], mesh.vertices[t[0]]),
            sub(mesh.vertices[t[2]], mesh.vertices[t[0]]),
          ),
        ) === 0,
    ).length,
    raw: count(
      Int32Array.from(
        { length: mesh.vertices.length },
        (_value: unknown, i: number): number => i,
      ),
    ),
    connectivityWelded: {
      toleranceMm: 0.001,
      counts: count(weld(mesh.vertices, 0.001)),
    },
  };
}
