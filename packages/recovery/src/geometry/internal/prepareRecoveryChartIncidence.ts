import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryDirectedEdgeIncidence,
} from "@automovie/interface";

import { measureRecoveryChartFace } from "./measureRecoveryChartFace";

/*
 * Build oriented edge incidence and per-vertex links once in source order.
 * The caller keeps its own face measurements, boundary and component policy.
 */
export function prepareRecoveryChartIncidence(
  input: IRecoveryChartIncidenceInput,
): IRecoveryChartIncidence {
  const edges: Map<string, IAutoMovieRecoveryDirectedEdgeIncidence[]> =
    new Map();
  const links: Map<number, Set<number>>[] = Array.from(
    input.vertices,
    (): Map<number, Set<number>> => new Map(),
  );
  const faces: Set<string> = new Set();
  for (const [face, triangle] of input.triangles.entries()) {
    const measurement: ReturnType<typeof measureRecoveryChartFace> =
      measureRecoveryChartFace(
        input.vertices,
        triangle,
        input.fail,
        input.invalidArea,
        input.invalidAddress,
      );
    const word: string = [...triangle]
      .sort((a: number, b: number): number => a - b)
      .join(":");
    if (faces.has(word)) input.fail(input.duplicate);
    faces.add(word);
    input.onFace(face, triangle, measurement);
    for (let corner: number = 0; corner < 3; corner++) {
      const a: number = triangle[corner]!,
        b: number = triangle[(corner + 1) % 3]!,
        opposite: number = triangle[(corner + 2) % 3]!;
      const key: string = input.edgeKey(a, b);
      const incidences: IAutoMovieRecoveryDirectedEdgeIncidence[] =
        edges.get(key) ?? [];
      incidences.push({ a, b, face });
      edges.set(key, incidences);
      const link: Map<number, Set<number>> = links[a]!;
      const from: Set<number> = link.get(b) ?? new Set();
      const to: Set<number> = link.get(opposite) ?? new Set();
      from.add(opposite);
      to.add(b);
      link.set(b, from);
      link.set(opposite, to);
    }
  }
  return { edges, links };
}

interface IRecoveryChartIncidenceInput {
  vertices: readonly Readonly<AutoMovieVector3Tuple>[];
  triangles: readonly (readonly [number, number, number])[];
  fail: (reason: string) => never;
  edgeKey: (a: number, b: number) => string;
  onFace: (
    face: number,
    triangle: readonly [number, number, number],
    geometry: ReturnType<typeof measureRecoveryChartFace>,
  ) => void;
  invalidArea: string;
  invalidAddress?: string;
  duplicate: string;
}

interface IRecoveryChartIncidence {
  edges: Map<string, IAutoMovieRecoveryDirectedEdgeIncidence[]>;
  links: Map<number, Set<number>>[];
}
