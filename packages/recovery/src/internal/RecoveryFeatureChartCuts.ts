import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryDirectedEdgeIncidence,
  IAutoMovieRecoveryFeatureChartCuts,
  IAutoMovieRecoveryFeatureChartCutsSubdivide,
  IAutoMovieRecoveryObservedMeshTopology,
} from "@automovie/interface";

import { RecoveryFeatureChartCutsFans } from "./RecoveryFeatureChartCutsFans";
import { RecoveryFeatureChartCutsSeams } from "./RecoveryFeatureChartCutsSeams";
import { RecoveryFeatureChartCutsSubdivide } from "./RecoveryFeatureChartCutsSubdivide";
import { RecoveryFeatureChartCutsTopology } from "./RecoveryFeatureChartCutsTopology";

/**
 * Materialize declared feature cuts as private manifold observation charts.
 * Ordinals and unique occurrence keys own topology; repeated physical keys must
 * name exactly equal millimetre coordinates. Source-face pairs admit features,
 * independently of a supplied angle's classification, which belongs to the
 * caller. Incident-face fans are split across every feature. A cut whose banks
 * otherwise share both endpoint ordinals first receives one conforming midpoint
 * observation. Ideal midpoint subdivision preserves PL geometry in real
 * arithmetic; diagnostics separately report upward coordinate-rounding bounds
 * and measured area changes. observationDisplacementUpperMm is the largest
 * midpoint displacement bound only; later quarter/chord subdivision and fitting
 * errors require separate accounting. Positive areas, coherent winding, links
 * and actual cut-bank incidence are checked. Outputs can be disks, annuli,
 * slits or closed surfaces; no UV map is certified. Both banks follow
 * physicalPath; their coherent boundary directions are opposite. Chains stop at
 * physical boundaries as well as feature junctions; isolated interior
 * degree-two cycles repeat their first path vertex. Source topology, physical
 * words, midpoint witnesses and all outputs stay private to observation. Public
 * fitted curves, compactness, boundary authority and normals belong elsewhere.
 */
export function RecoveryFeatureChartCuts(
  input: Parameters<IAutoMovieRecoveryFeatureChartCuts.Operation>[0],
): ReturnType<IAutoMovieRecoveryFeatureChartCuts.Operation> {
  type Feature = (typeof input.featureEdges)[number];
  const fail: (reason: string) => never = (reason: string): never => {
    throw new Error(`Unsupported feature chart cuts: ${reason}`);
  };
  const lex: (a: string, b: string) => number = (
    a: string,
    b: string,
  ): number => (a < b ? -1 : a > b ? 1 : 0);
  const edge: (a: number, b: number) => string = (
    a: number,
    b: number,
  ): string => (a < b ? `${a}:${b}` : `${b}:${a}`);
  const count: number = input.verticesMm.length;
  if (
    count < 3 ||
    !input.triangles.length ||
    input.physicalKeys.length !== count ||
    input.occurrenceKeys.length !== count ||
    new Set(input.occurrenceKeys).size !== count ||
    [...input.physicalKeys, ...input.occurrenceKeys].some(
      (word: string): boolean => !word.length,
    ) ||
    input.verticesMm.some(
      (p: Readonly<AutoMovieVector3Tuple>): boolean => p.length !== 3,
    ) ||
    input.triangleSourceFaces.length !== input.triangles.length ||
    input.triangleSourceFaces.some((id: number): boolean => id < 0)
  )
    fail(
      "aligned finite observations, unique occurrence keys and original face owners are required",
    );
  const physicalPositions: Map<
    string,
    Readonly<AutoMovieVector3Tuple>
  > = new Map();
  for (let i: number = 0; i < count; i++) {
    const key: string = input.physicalKeys[i]!,
      previous: Readonly<AutoMovieVector3Tuple> | undefined =
        physicalPositions.get(key);
    if (
      previous &&
      previous.some(
        (x: number, k: number): boolean => x !== input.verticesMm[i]![k],
      )
    )
      fail("one physical key has conflicting coordinates");
    physicalPositions.set(key, input.verticesMm[i]!);
  }
  const analyze: (
    vertices: readonly Readonly<AutoMovieVector3Tuple>[],
    triangles: readonly (readonly [number, number, number])[],
  ) => IAutoMovieRecoveryObservedMeshTopology =
    RecoveryFeatureChartCutsTopology(fail, edge);
  const source: IAutoMovieRecoveryObservedMeshTopology = analyze(
    input.verticesMm,
    input.triangles,
  );
  if (source.components.length !== 1)
    fail("one edge-connected source component is required");
  const features: Map<string, Feature> = new Map(),
    provenance: Map<string, string> = new Map();
  for (const feature of input.featureEdges) {
    const key: string = edge(feature.a, feature.b),
      rows: IAutoMovieRecoveryDirectedEdgeIncidence[] | undefined =
        source.edges.get(key);
    if (
      feature.a === feature.b ||
      rows?.length !== 2 ||
      features.has(key) ||
      !feature.sourceEdge ||
      feature.sourceFaces.length !== 2 ||
      feature.sourceFaces[0] === feature.sourceFaces[1] ||
      !(feature.angleDegrees > 0 && feature.angleDegrees <= 180)
    )
      fail(
        "features need unique interior edges and finite original crease provenance",
      );
    const pair: number[] = rows
        .map(
          (row: IAutoMovieRecoveryDirectedEdgeIncidence): number =>
            input.triangleSourceFaces[row.face]!,
        )
        .sort((a: number, b: number): number => a - b),
      declared: number[] = [...feature.sourceFaces].sort(
        (a: number, b: number): number => a - b,
      );
    if (pair[0] !== declared[0] || pair[1] !== declared[1])
      fail("a feature does not separate its declared original face pair");
    const word: string = JSON.stringify(pair),
      previous: string | undefined = provenance.get(feature.sourceEdge);
    if (previous !== undefined && previous !== word)
      fail("one original feature edge has conflicting source-face provenance");
    provenance.set(feature.sourceEdge, word);
    features.set(key, feature);
  }
  const faceWords: (
    triangles: readonly (readonly [number, number, number])[],
    keys: readonly string[],
  ) => string[] = (
    triangles: readonly (readonly [number, number, number])[],
    keys: readonly string[],
  ): string[] =>
    triangles.map((t: readonly [number, number, number]): string =>
      JSON.stringify(t.map((id: number): string => keys[id]!).sort(lex)),
    );
  const fanLabels: (
    topology: IAutoMovieRecoveryObservedMeshTopology,
    keys: readonly string[],
    triangles: readonly (readonly [number, number, number])[],
    cuts: ReadonlyMap<string, Feature>,
  ) => Map<number, string>[] = RecoveryFeatureChartCutsFans(faceWords, lex);
  const initialFans: Map<number, string>[] = fanLabels(
      source,
      input.occurrenceKeys,
      input.triangles,
      features,
    ),
    collisions: Set<string> = new Set();
  for (const [key, feature] of features) {
    const rows: IAutoMovieRecoveryDirectedEdgeIncidence[] =
      source.edges.get(key)!;
    if (
      initialFans[feature.a]!.get(rows[0]!.face) ===
        initialFans[feature.a]!.get(rows[1]!.face) &&
      initialFans[feature.b]!.get(rows[0]!.face) ===
        initialFans[feature.b]!.get(rows[1]!.face)
    )
      collisions.add(key);
  }
  const {
    vertices,
    physical,
    occurrences,
    insertions,
    diagnostics,
    observationDisplacementUpperMm,
    triangles,
    owners,
    parents,
    expanded,
    subdivided,
  }: ReturnType<IAutoMovieRecoveryFeatureChartCutsSubdivide.Operation> =
    RecoveryFeatureChartCutsSubdivide(
      input,
      source,
      features,
      collisions,
      physicalPositions,
      analyze,
      fail,
      edge,
      lex,
    );
  const labels: Map<number, string>[] = fanLabels(
      subdivided,
      occurrences,
      triangles,
      expanded,
    ),
    remap: Map<number, number>[] = Array.from(
      vertices,
      (): Map<number, number> => new Map(),
    );
  const cutVertices: Readonly<AutoMovieVector3Tuple>[] = [],
    cutPhysical: string[] = [],
    cutOccurrences: string[] = [],
    generatedKeys: Set<string> = new Set(occurrences);
  for (let vertex: number = 0; vertex < vertices.length; vertex++) {
    const words: string[] = [...new Set(labels[vertex]!.values())].sort(lex),
      ids: Map<string, number> = new Map();
    words.forEach((word: string, fan: number): void => {
      const key: string =
        fan === 0
          ? occurrences[vertex]!
          : `feature-fan:${JSON.stringify([occurrences[vertex], word])}`;
      if (fan > 0 && generatedKeys.has(key))
        fail("a fan occurrence identity collides");
      generatedKeys.add(key);
      ids.set(word, cutVertices.length);
      cutVertices.push([...vertices[vertex]!]);
      cutPhysical.push(physical[vertex]!);
      cutOccurrences.push(key);
    });
    for (const [face, label] of labels[vertex]!)
      remap[vertex]!.set(face, ids.get(label)!);
  }
  const cutTriangles: [number, number, number][] = triangles.map(
    (
      t: readonly [number, number, number],
      face: number,
    ): [number, number, number] =>
      [
        remap[t[0]]!.get(face)!,
        remap[t[1]]!.get(face)!,
        remap[t[2]]!.get(face)!,
      ],
  );
  const actual: IAutoMovieRecoveryObservedMeshTopology = analyze(
    cutVertices,
    cutTriangles,
  );
  for (let face: number = 0; face < cutTriangles.length; face++) {
    if (owners[face] !== input.triangleSourceFaces[parents[face]!])
      fail("fan materialization changed original face ownership");
    for (let k: number = 0; k < 3; k++)
      for (let axis: number = 0; axis < 3; axis++)
        if (
          !Object.is(
            cutVertices[cutTriangles[face]![k]!]![axis],
            vertices[triangles[face]![k]!]![axis],
          )
        )
          fail("fan materialization changed an observation coordinate");
  }
  for (const [key, rows] of subdivided.edges)
    if (!expanded.has(key)) {
      const images: string[] = rows.map(
        (row: IAutoMovieRecoveryDirectedEdgeIncidence): string =>
          edge(remap[row.a]!.get(row.face)!, remap[row.b]!.get(row.face)!),
      );
      if (
        images.some((word: string): boolean => word !== images[0]) ||
        actual.edges.get(images[0]!)?.length !== rows.length
      )
        fail("fan materialization cut an undeclared edge");
    }
  for (const [key, feature] of expanded) {
    const rows: IAutoMovieRecoveryDirectedEdgeIncidence[] | undefined =
      subdivided.edges.get(key);
    if (rows?.length !== 2)
      fail("an expanded feature lost its two original face incidents");
    const banks: string[] = rows.map(
      (row: IAutoMovieRecoveryDirectedEdgeIncidence): string =>
        edge(
          remap[feature.a]!.get(row.face)!,
          remap[feature.b]!.get(row.face)!,
        ),
    );
    if (
      banks[0] === banks[1] ||
      banks.some(
        (word: string): boolean => actual.edges.get(word)?.length !== 1,
      )
    )
      fail(
        "a requested feature does not have two distinct actual boundary banks",
      );
  }
  const words: string[] = faceWords(cutTriangles, cutOccurrences),
    components: number[][] = actual.components
      .map((faces: number[]): { faces: number[]; word: string } => ({
        faces,
        word: faces.reduce(
          (best: string, face: number): string =>
            lex(words[face]!, best) < 0 ? words[face]! : best,
          words[faces[0]!]!,
        ),
      }))
      .sort((a: { word: string }, b: { word: string }): number =>
        lex(a.word, b.word),
      )
      .map((component: { faces: number[] }): number[] => component.faces);
  const charts: ReturnType<IAutoMovieRecoveryFeatureChartCuts.Operation>["charts"] =
      [],
    localOf: Map<number, number> = new Map(),
    chartOf: Map<number, number> = new Map();
  const componentCycles: Map<number, number[][]> = new Map();
  for (const cycle of actual.cycles) {
    const owner: number =
        actual.faceComponent[
          actual.edges.get(edge(cycle[0]!, cycle[1]!))![0]!.face
        ]!,
      rows: number[][] = componentCycles.get(owner) ?? [];
    rows.push(cycle);
    componentCycles.set(owner, rows);
  }
  for (const component of components) {
    const ids: number[] = [
        ...new Set(
          component.flatMap((face: number): number[] => [
            ...cutTriangles[face]!,
          ]),
        ),
      ].sort((a: number, b: number): number =>
        lex(cutOccurrences[a]!, cutOccurrences[b]!),
      ),
      local: Map<number, number> = new Map(
        ids.map((id: number, ordinal: number): [number, number] => [
          id,
          ordinal,
        ]),
      );
    const faces: number[] = [...component].sort(
        (a: number, b: number): number => lex(words[a]!, words[b]!),
      ),
      chart: number = charts.length;
    for (const [id, ordinal] of local) {
      if (chartOf.has(id))
        fail("one incident fan belongs to multiple edge components");
      localOf.set(id, ordinal);
      chartOf.set(id, chart);
    }
    const cycles: number[][] = (
      componentCycles.get(actual.faceComponent[component[0]!]!) ?? []
    ).map((cycle: number[]): number[] => {
      if (cycle.some((id: number): boolean => !local.has(id)))
        fail("one boundary crosses edge components");
      const start: number = cycle.reduce(
          (best: number, id: number): number =>
            lex(cutOccurrences[id]!, cutOccurrences[best]!) < 0 ? id : best,
          cycle[0]!,
        ),
        at: number = cycle.indexOf(start);
      return [...cycle.slice(at), ...cycle.slice(0, at)].map(
        (id: number): number => local.get(id)!,
      );
    });
    cycles.sort((a: number[], b: number[]): number =>
      lex(cutOccurrences[ids[a[0]!]!]!, cutOccurrences[ids[b[0]!]!]!),
    );
    charts.push({
      id: `feature-chart.${chart}`,
      verticesMm: ids.map(
        (id: number): Readonly<AutoMovieVector3Tuple> => [...cutVertices[id]!],
      ),
      triangles: faces.map(
        (face: number): [number, number, number] =>
          [
            local.get(cutTriangles[face]![0])!,
            local.get(cutTriangles[face]![1])!,
            local.get(cutTriangles[face]![2])!,
          ],
      ),
      physicalKeys: ids.map((id: number): string => cutPhysical[id]!),
      occurrenceKeys: ids.map((id: number): string => cutOccurrences[id]!),
      triangleSourceFaces: faces.map((face: number): number => owners[face]!),
      cycles,
    });
  }
  return RecoveryFeatureChartCutsSeams(
    {
      subdivided,
      expanded,
      physical,
      occurrences,
      remap,
      actual,
      localOf,
      chartOf,
      charts,
      triangles,
      insertions,
      diagnostics,
      observationDisplacementUpperMm,
    },
    fail,
    edge,
    lex,
  );
}
