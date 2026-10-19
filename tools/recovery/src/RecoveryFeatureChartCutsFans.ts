import type { IAutoMovieCurve64 as C } from "../../../packages/engine/src/geometry/curve/IAutoMovieCurve64.ts";
import type { RecoveryFeatureChartCuts } from "./RecoveryFeatureChartCuts.ts";

type Input = Parameters<typeof RecoveryFeatureChartCuts>[0];

type Row = { a: number; b: number; face: number };
type Topology = {
  edges: Map<string, Row[]>;
  vertexEdges: string[][];
  incident: number[][];
  components: number[][];
  faceComponent: Int32Array;
  cycles: number[][];
  areas: number[];
  normals: C.Vector[];
};
type Feature = Input["featureEdges"][number];
/**
 * Create stable incident-fan labeling for declared feature edges.
 *
 * @evidence contracts/common.md#principled-implementation Face-word order and the original cut-excluding adjacency assign identical fan labels.
 * @evidence contracts/common.md#clear-and-simple-design This phase retains its original arithmetic and ordered state transitions while its caller owns orchestration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Extraction introduces no input correction, geometry fallback, reordered reduction or changed admission condition.
 * @evidence contracts/common.md#meaningful-documentation States the phase responsibility, shared-state ownership and numerical limits inherited from the calling algorithm.
 * @evidence contracts/performance.md#efficient-algorithms Visits vertex-face and incident edge populations and retains the original lexical face sorts.
 * @evidence contracts/performance.md#reuse-equivalent-work Labels serve both collision discovery and final fan materialization.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned labels are call-owned; the factory retains only the supplied face-word function.
 */
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
