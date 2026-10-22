import type { IAutoMovieCurve64 as C } from "@automovie/engine/geometry/curve";
import type { IAutoMovieRecoveryInput } from "@automovie/interface/recovery";

/**
 * Prepare declared source aliases and original edge/vertex face incidence.
 *
 * @evidence contracts/common.md#principled-implementation Exact-coordinate aliases follow the explicit input policy; original face order builds the same canonical edge and vertex support maps without moving observations.
 * @evidence contracts/common.md#clear-and-simple-design One preparation owns the maps reused by cutting and event support; source admission remains with extraction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No proximity tolerance, source repair, component removal or generated mesh fallback is introduced.
 * @evidence contracts/common.md#meaningful-documentation States exact alias policy, original source incidence and extraction-scoped ownership.
 * @evidence contracts/performance.md#efficient-algorithms Visits V source vertices and T triangles once, using O(V+T) map/set storage with expected constant-time lookup.
 * @evidence contracts/performance.md#reuse-equivalent-work One canonical address array and one face-support registry serve all later observation levels.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned maps borrow source arrays and remain owned by one extraction call; no handles or global cache are created.
 */
export function prepareRecoveryMeshIncidence(
  input: Pick<IAutoMovieRecoveryInput, "triangles" | "exactCoordinateAliases">,
  vertices: IAutoMovieRecoveryInput["verticesMm"],
): {
  aliases: Map<string, number>;
  canon: Int32Array;
  mesh: {
    vertices: typeof vertices;
    triangles: typeof input.triangles;
    canon: Int32Array;
  };
  faceEdges: Map<string, Set<number>>;
  vertexFaces: Map<number, Set<number>>;
  edgeKey: (a: number, b: number) => string;
} {
  const aliases: Map<string, number> = new Map();
  const canon: Int32Array = Int32Array.from(
    vertices.map((p: C.Vector, i: number): number => {
      if (!input.exactCoordinateAliases) return i;
      const key: string = JSON.stringify(p);
      if (!aliases.has(key)) aliases.set(key, i);
      return aliases.get(key)!;
    }),
  );
  const mesh: {
    vertices: typeof vertices;
    triangles: typeof input.triangles;
    canon: Int32Array;
  } = { vertices, triangles: input.triangles, canon };
  const faceEdges: Map<string, Set<number>> = new Map();
  const vertexFaces: Map<number, Set<number>> = new Map();
  const edgeKey: (a: number, b: number) => string = (
    a: number,
    b: number,
  ): string => (a < b ? `${a},${b}` : `${b},${a}`);
  for (let ti: number = 0; ti < mesh.triangles.length; ti++) {
    const t: [number, number, number] = mesh.triangles[ti]!;
    for (let k: number = 0; k < 3; k++) {
      const a: number = canon[t[k]!]!,
        b: number = canon[t[(k + 1) % 3]!]!;
      const key: string = edgeKey(a, b);
      if (!faceEdges.has(key)) faceEdges.set(key, new Set());
      if (!vertexFaces.has(a)) vertexFaces.set(a, new Set());
      faceEdges.get(key)!.add(ti);
      vertexFaces.get(a)!.add(ti);
    }
  }
  return { aliases, canon, mesh, faceEdges, vertexFaces, edgeKey };
}
