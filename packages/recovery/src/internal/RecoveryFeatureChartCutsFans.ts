import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryFeatureChartCuts,
} from "@automovie/interface";

/** Create stable incident-fan labeling for declared feature edges. */
export function RecoveryFeatureChartCutsFans(
  faceWords: (
    triangles: readonly (readonly [number, number, number])[],
    keys: readonly string[],
  ) => string[],
  lex: (a: string, b: string) => number,
): (
  topology: Topology,
  keys: readonly string[],
  triangles: readonly (readonly [number, number, number])[],
  cuts: ReadonlyMap<string, Feature>,
) => Map<number, string>[] {
  const fanLabels: (
    topology: Topology,
    keys: readonly string[],
    triangles: readonly (readonly [number, number, number])[],
    cuts: ReadonlyMap<string, Feature>,
  ) => Map<number, string>[] = (
    topology: Topology,
    keys: readonly string[],
    triangles: readonly (readonly [number, number, number])[],
    cuts: ReadonlyMap<string, Feature>,
  ): Map<number, string>[] => {
    const words: string[] = faceWords(triangles, keys),
      labels: Map<number, string>[] = Array.from(
        keys,
        (): Map<number, string> => new Map(),
      );
    for (let vertex: number = 0; vertex < keys.length; vertex++) {
      const adjacent: Map<number, number[]> = new Map(
        topology.incident[vertex]!.map((face: number): [number, number[]] => [
          face,
          [],
        ]),
      );
      for (const key of topology.vertexEdges[vertex]!) {
        const rows: Row[] = topology.edges.get(key)!;
        if (rows.length === 2 && !cuts.has(key)) {
          adjacent.get(rows[0]!.face)!.push(rows[1]!.face);
          adjacent.get(rows[1]!.face)!.push(rows[0]!.face);
        }
      }
      const ordered: number[] = [...topology.incident[vertex]!].sort(
        (a: number, b: number): number => lex(words[a]!, words[b]!),
      );
      for (const first of ordered) {
        if (labels[vertex]!.has(first)) continue;
        const queue: number[] = [first],
          label: string = words[first]!;
        labels[vertex]!.set(first, label);
        for (let k: number = 0; k < queue.length; k++)
          for (const to of adjacent.get(queue[k]!)!)
            if (!labels[vertex]!.has(to)) {
              labels[vertex]!.set(to, label);
              queue.push(to);
            }
      }
    }
    return labels;
  };

  return fanLabels;
}

type Input = Parameters<IAutoMovieRecoveryFeatureChartCuts.Operation>[0];
type Row = { a: number; b: number; face: number };
type Topology = {
  edges: Map<string, Row[]>;
  vertexEdges: string[][];
  incident: number[][];
  components: number[][];
  faceComponent: Int32Array;
  cycles: number[][];
  areas: number[];
  normals: Readonly<AutoMovieVector3Tuple>[];
};
type Feature = Input["featureEdges"][number];
