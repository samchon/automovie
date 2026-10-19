import type { IAutoMovieCurve64 as C } from "@automovie/engine/geometry/curve";
import { RecoveryFeatureChartCutsFans } from "./RecoveryFeatureChartCutsFans";
import { RecoveryFeatureChartCutsSeams } from "./RecoveryFeatureChartCutsSeams";
import { RecoveryFeatureChartCutsSubdivide } from "./RecoveryFeatureChartCutsSubdivide";
import { RecoveryFeatureChartCutsTopology } from "./RecoveryFeatureChartCutsTopology";

/**
 * Materialize declared feature cuts as private manifold observation charts.
 * Ordinals and unique occurrence keys own topology; repeated physical keys must
 * name exactly equal millimetre coordinates. Source-face pairs admit features,
 * independently of a supplied angle's classification, which belongs to the caller.
 * Incident-face fans are split across every feature. A cut whose banks otherwise
 * share both endpoint ordinals first receives one conforming midpoint observation.
 * Ideal midpoint subdivision preserves PL geometry in real arithmetic; diagnostics
 * separately report upward coordinate-rounding bounds and measured area changes.
 * observationDisplacementUpperMm is the largest midpoint displacement bound only;
 * later quarter/chord subdivision and fitting errors require separate accounting.
 * Positive areas, coherent winding, links and actual cut-bank incidence are checked.
 * Outputs can be disks, annuli, slits or closed surfaces; no UV map is certified.
 * Both banks follow physicalPath; their coherent boundary directions are opposite.
 * Chains stop at physical boundaries as well as feature junctions; isolated
 * interior degree-two cycles repeat their first path vertex. Source topology,
 * physical words, midpoint witnesses and all outputs stay private to observation.
 * Public fitted curves, compactness, boundary authority and normals belong elsewhere.
 *
 * @evidence contracts/common.md#principled-implementation Coherent edge incidence and circle/path links admit the source. Original face-pair provenance rejects triangulation diagonals; declared cuts remove incident-face adjacencies, and connected fans receive separate ordinals. Unmaterialized bank pairs receive conforming, correctly rounded dyadic midpoints before fans are rebuilt. Actual components, links and every feature's two boundary banks are revalidated without assuming disk topology.
 * @evidence contracts/common.md#clear-and-simple-design One private operation owns cut materialization, face ownership, component boundaries and maximal feature-chain banks. Source feature classification, topology-to-UV conversion and fitted publication remain separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No threshold reclassification, coordinate welding, guessed closure, anatomical selection, copied reconstruction normal or consumer mesh occurs. Arithmetic collapse, inconsistent provenance and ambiguous bank continuation fail explicitly; midpoint rounding remains measured rather than relabelled exact preservation.
 * @evidence contracts/common.md#meaningful-documentation States millimetres, physical versus occurrence identity, source provenance, midpoint rounding, opposite bank directions, non-disk outputs, private lifetime and independent UV, curve and normal qualifications.
 * @evidence contracts/performance.md#efficient-algorithms For V vertices, F faces and K feature edges, bounded incidence and fan passes use O(V+F+K) storage; deterministic key ordering costs O((V+F+K)log(V+F+K)). Each colliding edge adds one point and two faces. Boundary and bank traversal visits each face occurrence and feature segment a bounded number of times; dyadic integer widths are bounded by binary64 encoding.
 * @evidence contracts/performance.md#reuse-equivalent-work One admitted incidence registry serves initial bank-collision detection. It is rebuilt only after required conforming subdivisions, then reused for fan labels, actual component boundaries and feature-bank provenance. Each maximal chain has one canonical physical order for both banks.
 * @evidence contracts/performance.md#bound-retention-and-release-resources All registries and arithmetic buffers expire on return or failure. At most three vertex occurrences per resulting triangle transfer to private chart owners; no global cache, task, handle or source geometry enters a reconstruction consumer.
 */
export function RecoveryFeatureChartCuts(input: {
  verticesMm: readonly C.Vector[];
  triangles: readonly (readonly [number, number, number])[];
  physicalKeys: readonly string[];
  occurrenceKeys: readonly string[];
  triangleSourceFaces: readonly number[];
  featureEdges: readonly {
    a: number;
    b: number;
    sourceEdge: string;
    sourceFaces: readonly [number, number];
    angleDegrees: number;
  }[];
}): {
  charts: {
    id: string;
    verticesMm: C.Vector[];
    triangles: [number, number, number][];
    physicalKeys: string[];
    occurrenceKeys: string[];
    triangleSourceFaces: number[];
    cycles: number[][];
  }[];
  seams: {
    id: string;
    kind: "crease";
    closed: boolean;
    physicalPath: string[];
    banks: [
      { chart: number; path: number[] },
      { chart: number; path: number[] },
    ];
  }[];
  insertions: {
    edgeKeys: [string, string];
    fractionFromFirst: number;
    key: string;
    pointMm: C.Vector;
  }[];
  observationDisplacementUpperMm: number;
  diagnostics: string[];
} {
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
      (word: string): boolean => typeof word !== "string" || !word.length,
    ) ||
    input.verticesMm.some(
      (p: C.Vector): boolean => p.length !== 3 || !p.every(Number.isFinite),
    ) ||
    input.triangleSourceFaces.length !== input.triangles.length ||
    input.triangleSourceFaces.some(
      (id: number): boolean => !Number.isSafeInteger(id) || id < 0,
    )
  )
    fail(
      "aligned finite observations, unique occurrence keys and original face owners are required",
    );
  const physicalPositions: Map<string, C.Vector> = new Map();
  for (let i: number = 0; i < count; i++) {
    const key: string = input.physicalKeys[i]!,
      previous: C.Vector | undefined = physicalPositions.get(key);
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
    vertices: readonly C.Vector[],
    triangles: readonly (readonly [number, number, number])[],
  ) => Topology = RecoveryFeatureChartCutsTopology(fail, edge);
  const source: Topology = analyze(input.verticesMm, input.triangles);
  if (source.components.length !== 1)
    fail("one edge-connected source component is required");
  const features: Map<string, Feature> = new Map(),
    provenance: Map<string, string> = new Map();
  for (const feature of input.featureEdges) {
    const key: string = edge(feature.a, feature.b),
      rows: Row[] | undefined = source.edges.get(key);
    if (
      !Number.isSafeInteger(feature.a) ||
      !Number.isSafeInteger(feature.b) ||
      feature.a === feature.b ||
      rows?.length !== 2 ||
      features.has(key) ||
      typeof feature.sourceEdge !== "string" ||
      !feature.sourceEdge ||
      feature.sourceFaces.length !== 2 ||
      feature.sourceFaces[0] === feature.sourceFaces[1] ||
      !(
        feature.angleDegrees > 0 &&
        feature.angleDegrees <= 180 &&
        Number.isFinite(feature.angleDegrees)
      )
    )
      fail(
        "features need unique interior edges and finite original crease provenance",
      );
    const pair: number[] = rows
        .map((row: Row): number => input.triangleSourceFaces[row.face]!)
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
    topology: Topology,
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
    const rows: Row[] = source.edges.get(key)!;
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
  }: ReturnType<typeof RecoveryFeatureChartCutsSubdivide> =
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
  const cutVertices: C.Vector[] = [],
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
      t.map((id: number): number => remap[id]!.get(face)!) as [
        number,
        number,
        number,
      ],
  );
  const actual: Topology = analyze(cutVertices, cutTriangles);
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
      const images: string[] = rows.map((row: Row): string =>
        edge(remap[row.a]!.get(row.face)!, remap[row.b]!.get(row.face)!),
      );
      if (
        images.some((word: string): boolean => word !== images[0]) ||
        actual.edges.get(images[0]!)?.length !== rows.length
      )
        fail("fan materialization cut an undeclared edge");
    }
  for (const [key, feature] of expanded) {
    const rows: Row[] | undefined = subdivided.edges.get(key);
    if (rows?.length !== 2)
      fail("an expanded feature lost its two original face incidents");
    const banks: string[] = rows.map((row: Row): string =>
      edge(remap[feature.a]!.get(row.face)!, remap[feature.b]!.get(row.face)!),
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
  const charts: ReturnType<typeof RecoveryFeatureChartCuts>["charts"] = [],
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
      verticesMm: ids.map((id: number): C.Vector => [...cutVertices[id]!]),
      triangles: faces.map(
        (face: number): [number, number, number] =>
          cutTriangles[face]!.map((id: number): number => local.get(id)!) as [
            number,
            number,
            number,
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
