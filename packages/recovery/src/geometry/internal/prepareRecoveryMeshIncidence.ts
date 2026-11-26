import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryInput,
  IAutoMovieRecoveryMeshIncidencePreparationOperation,
} from "@automovie/interface";

/** Prepare declared source aliases and original edge/vertex face incidence. */
export function prepareRecoveryMeshIncidence(
  input: Parameters<IAutoMovieRecoveryMeshIncidencePreparationOperation.Operation>[0],
  vertices: Parameters<IAutoMovieRecoveryMeshIncidencePreparationOperation.Operation>[1],
): ReturnType<IAutoMovieRecoveryMeshIncidencePreparationOperation.Operation> {
  const aliases: Map<string, number> = new Map();
  const canon: Int32Array = Int32Array.from(
    vertices.map((p: Readonly<AutoMovieVector3Tuple>, i: number): number => {
      if (!input.exactCoordinateAliases) return i;
      const key: string = JSON.stringify(p);
      if (!aliases.has(key)) aliases.set(key, i);
      return aliases.get(key)!;
    }),
  );
  const mesh: {
    vertices: IAutoMovieRecoveryInput["verticesMm"];
    triangles: IAutoMovieRecoveryInput["triangles"];
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
