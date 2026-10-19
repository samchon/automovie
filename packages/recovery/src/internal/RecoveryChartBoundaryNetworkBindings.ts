import type { IAutoMovieCurve64 as C } from "@automovie/engine/geometry/curve";
import type { RecoveryChartBoundary } from "./RecoveryChartBoundary";
import type { RecoveryChartBoundaryNetwork } from "./RecoveryChartBoundaryNetwork";
import type { RecoveryChartBoundaryNetworkRegistry } from "./RecoveryChartBoundaryNetworkRegistry";

type Input = Parameters<typeof RecoveryChartBoundaryNetwork>[0];
type Binding = ReturnType<ReturnType<typeof RecoveryChartBoundary>["get"]>;

/**
 * Bind maximal physical arcs to all copied chart sides after augmentation.
 *
 * @evidence contracts/common.md#principled-implementation Stable graph traversal, lexical anchors and the original arclength reductions define the same composite phases.
 * @evidence contracts/common.md#clear-and-simple-design This phase retains its original arithmetic and ordered state transitions while its caller owns orchestration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Extraction introduces no input correction, geometry fallback, reordered reduction or changed admission condition.
 * @evidence contracts/common.md#meaningful-documentation States the phase responsibility, shared-state ownership and numerical limits inherited from the calling algorithm.
 * @evidence contracts/performance.md#efficient-algorithms Visits the physical boundary graph and its side occurrences, retaining the original sorts.
 * @evidence contracts/performance.md#reuse-equivalent-work Every maximal arc invokes the existing boundary owner once and sides reuse that registration.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller receives copied charts and diagnostics; temporary graph and traversal maps expire on return.
 */
export function RecoveryChartBoundaryNetworkBindings(
  input: Input,
  context: ReturnType<typeof RecoveryChartBoundaryNetworkRegistry>,
): ReturnType<typeof RecoveryChartBoundaryNetwork> {
  const {
    points,
    charts,
    canonicalBreaks,
    diagnostics,
    maximumPointChange,
    pair,
    compare,
  }: ReturnType<typeof RecoveryChartBoundaryNetworkRegistry> = context;
  const graph: Map<string, { a: string; b: string; charts: Set<string> }> =
      new Map(),
    neighbors: Map<string, Set<string>> = new Map();
  for (const chart of charts)
    for (const side of chart.sides)
      for (let i: number = 0; i + 1 < side.length; i++) {
        const a: string = chart.physicalKeys[side[i]!]!,
          b: string = chart.physicalKeys[side[i + 1]!]!,
          key: string = pair(a, b);
        if (a === b)
          throw new Error("A physical boundary graph edge is collapsed");
        if (!graph.has(key)) graph.set(key, { a, b, charts: new Set() });
        graph.get(key)!.charts.add(chart.name);
        for (const [first, last] of [
          [a, b],
          [b, a],
        ]) {
          if (!neighbors.has(first!)) neighbors.set(first!, new Set());
          neighbors.get(first!)!.add(last!);
        }
      }
  for (const [key, adjacent] of neighbors) {
    const labels: Set<string> = new Set(
      [...adjacent].map((other: string): string =>
        JSON.stringify([...graph.get(pair(key, other))!.charts].sort(compare)),
      ),
    );
    if (adjacent.size !== 2 || labels.size !== 1) canonicalBreaks.add(key);
  }
  const examined: Set<string> = new Set(),
    anchors: Set<string> = new Set();
  const follow: (first: string, next: string) => string[] = (
    first: string,
    next: string,
  ): string[] => {
    const word: string[] = [first];
    let previous: string = first,
      current: string = next;
    while (true) {
      const key: string = pair(previous, current);
      if (examined.has(key))
        throw new Error("Boundary anchor traversal revisited a physical edge");
      examined.add(key);
      word.push(current);
      if (current === first || canonicalBreaks.has(current)) return word;
      const choices: string[] = [...neighbors.get(current)!].filter(
        (value: string): boolean => value !== previous,
      );
      if (choices.length !== 1)
        throw new Error("Boundary anchor traversal has ambiguous continuation");
      previous = current;
      current = choices[0]!;
    }
  };
  for (const first of [...canonicalBreaks].sort(compare))
    for (const next of [...(neighbors.get(first) ?? [])].sort(compare)) {
      if (examined.has(pair(first, next))) continue;
      const word: string[] = follow(first, next);
      if (word.at(-1) === first) {
        const interior: string[] = [...new Set(word.slice(1, -1))].sort(
          compare,
        );
        if (!interior.length)
          throw new Error(
            "A junction-return boundary has no distinct observed anchor",
          );
        anchors.add(interior[0]!);
      }
    }
  for (const [key, edge] of graph) {
    if (examined.has(key)) continue;
    const word: string[] = follow(edge.a, edge.b);
    if (word.at(-1) !== word[0])
      throw new Error(
        "An unanchored boundary chain does not form a closed cycle",
      );
    const unique: string[] = [...new Set(word.slice(0, -1))].sort(compare);
    if (unique.length < 2)
      throw new Error(
        "A closed boundary cycle has fewer than two distinct observed anchors",
      );
    anchors.add(unique[0]!);
    anchors.add(unique[1]!);
  }
  for (const anchor of anchors) canonicalBreaks.add(anchor);
  if (anchors.size)
    diagnostics.push(
      `Added ${anchors.size} stable-key existing-observation anchors to closed or junction-return boundary chains; all physical graph edges retained`,
    );
  const visited: Set<string> = new Set(),
    edgeArc: Map<string, number> = new Map(),
    arcs: { word: string[]; boundary: Binding; length: number }[] = [];
  for (const firstEdge of [...graph.keys()].sort(compare)) {
    if (visited.has(firstEdge)) continue;
    const edge: NonNullable<ReturnType<typeof graph.get>> =
      graph.get(firstEdge)!;
    const possible: string[] = [edge.a, edge.b]
      .filter((key: string): boolean => canonicalBreaks.has(key))
      .sort(compare);
    if (!possible.length) continue;
    const word: string[] = [possible[0]!];
    let previous: string = possible[0]!,
      current: string = previous === edge.a ? edge.b : edge.a;
    while (true) {
      const key: string = pair(previous, current);
      if (visited.has(key))
        throw new Error(
          "A maximal boundary arc revisited an owned physical edge",
        );
      visited.add(key);
      word.push(current);
      if (canonicalBreaks.has(current)) break;
      const next: string[] = [...neighbors.get(current)!].filter(
        (key: string): boolean => key !== previous,
      );
      if (next.length !== 1)
        throw new Error("A maximal arc has ambiguous continuation");
      previous = current;
      current = next[0]!;
    }
    if (word[0] === word.at(-1))
      throw new Error(
        "A closed boundary arc lacks distinct observed-anchor breaks",
      );
    if (JSON.stringify([...word].reverse()) < JSON.stringify(word))
      word.reverse();
    let length: number = 0;
    for (let i: number = 0; i + 1 < word.length; i++) {
      const part: number = Math.hypot(
        ...points
          .get(word[i + 1]!)!
          .map((v: number, k: number): number => v - points.get(word[i]!)![k]!),
      );
      if (!(part > 0 && Number.isFinite(part) && length + part > length))
        throw new Error(
          "Arc physical polyline length is not strict and finite",
        );
      length += part;
      edgeArc.set(pair(word[i]!, word[i + 1]!), arcs.length);
    }
    arcs.push({
      word,
      length,
      boundary: input.owner.get(
        word,
        word.map((key: string): C.Vector => points.get(key)!),
      ),
    });
  }
  if (visited.size !== graph.size)
    throw new Error("A boundary component lacks complete open-arc ownership");
  for (const chart of charts)
    for (let s: number = 0; s < 4; s++) {
      const side: number[] = chart.sides[s]!,
        pieces: {
          start: number;
          end: number;
          knots: number[];
          boundary: Binding;
        }[] = [],
        selected: { arc: (typeof arcs)[number]; reverse: boolean }[] = [];
      for (let at: number = 0; at + 1 < side.length; ) {
        const first: string = chart.physicalKeys[side[at]!]!,
          second: string = chart.physicalKeys[side[at + 1]!]!,
          arc: (typeof arcs)[number] = arcs[edgeArc.get(pair(first, second))!]!;
        const reverse: boolean = arc.word[0] !== first,
          word: string[] = reverse ? [...arc.word].reverse() : arc.word;
        if (
          word[0] !== first ||
          at + word.length > side.length ||
          word.some(
            (key: string, i: number): boolean =>
              key !== chart.physicalKeys[side[at + i]!],
          )
        )
          throw new Error(
            "A side is not a complete concatenation of maximal arc registrations",
          );
        selected.push({ arc, reverse });
        at += word.length - 1;
      }
      const total: number = selected.reduce(
        (sum: number, row: (typeof selected)[number]): number =>
          sum + row.arc.length,
        0,
      );
      if (!(total > 0 && Number.isFinite(total)))
        throw new Error("A composite boundary has no finite physical length");
      const spans: C.Span[] = [],
        knots: number[] = [0],
        parameters: number[] = [];
      let prefix: number = 0,
        sampleMaximumMm: number = 0,
        polylineUpperEstimateMm: number = 0,
        handleFallbacks: number = 0,
        toleranceMet: boolean = true;
      for (let p: number = 0; p < selected.length; p++) {
        const { arc, reverse }: NonNullable<(typeof selected)[number]> =
            selected[p]!,
          base: Binding = arc.boundary;
        const orientedKnots: number[] = reverse
          ? [...base.knots].reverse().map((v: number): number => 1 - v)
          : [...base.knots];
        const curve: C.Cubic = reverse
          ? {
              ...base.fit.curve,
              spans: [...base.fit.curve.spans]
                .reverse()
                .map((net: C.Span): C.Span => [net[3], net[2], net[1], net[0]]),
              phaseIntervals: orientedKnots
                .slice(1)
                .map((v: number, i: number): number => v - orientedKnots[i]!),
            }
          : base.fit.curve;
        const boundary: Binding = reverse
          ? {
              ...base,
              reversed: !base.reversed,
              corners: [base.corners[1], base.corners[0]],
              knots: orientedKnots,
              parameters: [...base.parameters]
                .reverse()
                .map((v: number): number => 1 - v),
              fit: { ...base.fit, curve },
            }
          : base;
        const start: number = prefix / total;
        prefix += arc.length;
        const end: number = p + 1 === selected.length ? 1 : prefix / total;
        if (!(end > start))
          throw new Error(
            "A composite arc has no representable positive side interval",
          );
        const pieceKnots: number[] = boundary.knots.map(
          (v: number, i: number): number =>
            i === 0
              ? start
              : i + 1 === boundary.knots.length
                ? end
                : start + (end - start) * v,
        );
        pieces.push({ start, end, knots: [...pieceKnots], boundary });
        for (
          let i: number = p === 0 ? 0 : 1;
          i < boundary.parameters.length;
          i++
        )
          parameters.push(
            i === boundary.parameters.length - 1
              ? end
              : start + (end - start) * boundary.parameters[i]!,
          );
        for (let i: number = 1; i < pieceKnots.length; i++)
          knots.push(pieceKnots[i]!);
        spans.push(...curve.spans);
        toleranceMet &&= boundary.fit.toleranceMet;
        sampleMaximumMm = Math.max(
          sampleMaximumMm,
          boundary.fit.sampleMaximumMm,
        );
        polylineUpperEstimateMm = Math.max(
          polylineUpperEstimateMm,
          boundary.fit.polylineUpperEstimateMm,
        );
        handleFallbacks += boundary.fit.handleFallbacks;
      }
      if (
        parameters.length !== side.length ||
        knots.length !== spans.length + 1 ||
        [knots, parameters].some(
          (values: number[]): boolean =>
            values[0] !== 0 ||
            values.at(-1) !== 1 ||
            values.some(
              (v: number, i: number): boolean =>
                !Number.isFinite(v) || (i > 0 && v <= values[i - 1]!),
            ),
        )
      )
        throw new Error(
          "Composite boundary registration lost points or strict normalized phases",
        );
      const id: string = `network.side.${chart.name}.${s}`,
        curve: C.Cubic = {
          type: "cubicBezier",
          name: id,
          closed: false,
          unit: "mm",
          phaseUnit: "normalized",
          spans,
          phaseIntervals: knots
            .slice(1)
            .map((v: number, i: number): number => v - knots[i]!),
        };
      chart.boundaries.push({
        id,
        reversed: false,
        corners: [
          pieces[0]!.boundary.corners[0],
          pieces.at(-1)!.boundary.corners[1],
        ],
        parameters,
        knots,
        canonicalCurve: curve,
        canonicalKnots: [...knots],
        pieces,
        fit: {
          curve,
          toleranceMet,
          sampleMaximumMm,
          polylineUpperEstimateMm,
          handleFallbacks,
          observationsPerSpan: side.length / spans.length,
        },
      });
    }
  if (!Number.isFinite(maximumPointChange))
    throw new Error(
      "Private-bank point displacement accounting became nonfinite",
    );
  diagnostics.push(
    `Canonical base-edge subdivision maximumPointChangeMm=${maximumPointChange}; binary64 measurements are not exact PL preservation certificates`,
  );
  return { charts, diagnostics, maximumPointChangeMm: maximumPointChange };
}
