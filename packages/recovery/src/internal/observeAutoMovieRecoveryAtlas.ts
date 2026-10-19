import type { IAutoMovieCurve64 as C } from "@automovie/engine/geometry/curve";
import type { IAutoMovieBicubicAtlasGeometry } from "@automovie/interface";
import { RecoveryAtlasObservationChart } from "./RecoveryAtlasObservationChart";
import { RecoveryAtlasObservationCreases } from "./RecoveryAtlasObservationCreases";
import { RecoveryAtlasObservationFeatures } from "./RecoveryAtlasObservationFeatures";
import { RecoveryAtlasObservationNormals } from "./RecoveryAtlasObservationNormals";
import { RecoveryAtlasObservationPublish } from "./RecoveryAtlasObservationPublish";
import { RecoveryAtlasObservationSource } from "./RecoveryAtlasObservationSource";
import type { RecoveryAtlasObservationTypes } from "./RecoveryAtlasObservationTypes";
import { RecoveryChartAssembly } from "./RecoveryChartAssembly";
import { RecoveryChartBoundary } from "./RecoveryChartBoundary";
import { RecoveryEventRegion } from "./RecoveryEventRegion";

type Pending = RecoveryAtlasObservationTypes["Pending"];

/**
 * Observe orientable genus-zero source components through private disk charts.
 * Supplied automatic levels are immutable observations, not manually authored planes.
 * Every visited cell, component and issue receives a private ownership record. The
 * public result carries only fitted coefficients, chart names and coverage counts.
 * Natural four-sided disks and ordinary annuli retain their existing chart rules.
 * Other coherent disks use physical-arclength quarters; multiple boundaries first
 * use a private cut forest and fan duplication. Source PL triangles remain private.
 * All selected families retain their physical keys and original quarter ancestry
 * until one common maximal-arc network registers their boundaries. Declared
 * subarcs share positional coefficients and phase before each sequential fit.
 * An optional millimetre exchange length adds source PL physical-gradient rows
 * to the area objective; it is an experiment parameter, not an optimum constant.
 * Numerical mapping, missing banks, exact transverse C1/G1 and joins to prior
 * closed/ruled surfaces remain separate unresolved qualifications.
 * An optional scalar window selects complete intersecting saved slabs before the
 * work prefix; planned/window and whole-input coverage denominators stay separate.
 *
 * @evidence contracts/common.md#principled-implementation Exact-incidence orientable genus-zero components qualify natural disks, ordinary annuli or a validated private cut-forest disk with physical-arclength quarters. Every resulting harmonic map independently checks signed UV areas before fitting; complete boundary coefficients and accepted phase drive the joint area fit.
 * @evidence contracts/common.md#clear-and-simple-design The private topology observer owns cells and typed issues, the chart fitter owns numerical correspondence and coefficients, and the public atlas contains neither source indices nor source normals.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ambiguous topology, collapsed UV triangles, failed feature cuts and unresolved partial-arc boundary ownership remain explicit. Private PL subdivision and cut-fan duplication publish no source triangle, guessed cap or person-specific control. Generic quarter charts remain externally unqualified even when their finite coefficient geometry is generated.
 * @evidence contracts/common.md#meaningful-documentation States automatic input levels, private versus public ownership, finite work prefixes and C0-only internal continuity with unresolved external joins.
 * @evidence contracts/performance.md#efficient-algorithms Source admission and height indexing are prepared once; each of K visited slabs queries A overlapping faces and processes their clipped incidence, then fits only its admitted disk components. Worst-case overlap is K times the source face count; explicit interval, chart and patch budgets bound the processed prefix.
 * @evidence contracts/performance.md#reuse-equivalent-work Exact source aliases, scalar samples and interval queries are reused across slabs; each component's clipped vertices serve topology, harmonic mapping and original-observation residuals.
 * @evidence contracts/performance.md#bound-retention-and-release-resources All bounded selected private charts remain live through one common boundary-network pass; fits then execute sequentially. The caller owns the bounded selected-chart output and the private cell ledger; unvisited slabs remain explicitly incomplete.
 */
export function observeAutoMovieRecoveryAtlas(
  input: {
    verticesMm: readonly C.Vector[];
    triangles: readonly (readonly [number, number, number])[];
    axis: C.Vector;
    levelsMm: readonly number[];
    intervalOrder?: readonly number[];
    scalarWindowMm?: readonly [number, number];
    priorityFaces?: readonly number[];
    exactCoordinateAliases: boolean;
    toleranceMm: number;
    maxSpans: number;
    cornerDegrees: number;
    maxPatchesPerChart: number;
    maxIterations: number;
    maxObservationRowsPerChart?: number;
    maxRefinementsPerChart?: number;
    maxIntervals: number;
    maxCharts: number;
    inventoryOnly?: boolean;
    physicalGradientLengthMm?: number;
    topologyDomain: string;
    tessellation: {
      toleranceMm: number;
      maxCells: number;
      maxVertices: number;
      cellBudgetPolicy?: "retain-coarse" | "omit-unresolved";
    };
  },
  observe?: (record: object) => void,
): {
  geometry: IAutoMovieBicubicAtlasGeometry;
  charts: object[];
  coverage: object;
  privateLedger: object[];
} {
  const {
    order,
    selection,
    heights,
    region,
    index,
  }: ReturnType<typeof RecoveryAtlasObservationSource> =
    RecoveryAtlasObservationSource(input);
  const controls: IAutoMovieBicubicAtlasGeometry["controls"] = [],
    patches: IAutoMovieBicubicAtlasGeometry["patches"] = [],
    charts: object[] = [],
    privateLedger: object[] = [];
  const boundaryOwner: ReturnType<typeof RecoveryChartBoundary> =
    RecoveryChartBoundary({
      toleranceMm: input.toleranceMm,
      maxSpans: input.maxSpans,
      cornerDegrees: input.cornerDegrees,
    });
  const fittedCharts: Parameters<typeof RecoveryChartAssembly>[0][number][] =
    [];
  const pending: Pending[] = [],
    failedSelectedComponents: Set<string> = new Set();
  const inventory: {
    chart: string;
    component: string;
    vertices: number;
    triangles: number;
    boundaryObservations: number;
    feature: boolean;
  }[] = [];
  if (
    input.inventoryOnly !== undefined &&
    typeof input.inventoryOnly !== "boolean"
  )
    throw new Error("Inventory mode must be an explicit boolean");
  if (!(input.cornerDegrees > 0 && input.cornerDegrees < 180))
    throw new Error("A source crease/corner threshold in degrees is required");
  const sourceNormals: number[][] = RecoveryAtlasObservationNormals(input);
  let visitedIntervals: number = 0,
    visitedComponents: number = 0,
    unsupportedComponents: number = 0;
  const visitedIntervalIds: number[] = [];
  const representedFaces: Set<number> = new Set(),
    encounteredFaces: Set<number> = new Set();
  const planeOwners: Map<string, number> = new Map();
  const priorityFaces: Set<number> = new Set(input.priorityFaces ?? []);
  for (const face of priorityFaces)
    if (
      !Number.isSafeInteger(face) ||
      face < 0 ||
      face >= input.triangles.length
    )
      throw new Error(
        "Private work priorities must address original source faces",
      );
  for (const interval of selection.intervals) {
    if (
      visitedIntervals >= input.maxIntervals ||
      pending.length >= input.maxCharts
    )
      break;
    const beforeMm: number = input.levelsMm[interval]!,
      afterMm: number = input.levelsMm[interval + 1]!;
    const candidates: number[] = [
      ...new Set([
        ...index.slab(beforeMm, afterMm),
        ...index.cut(beforeMm),
        ...index.cut(afterMm),
      ]),
    ].sort((a: number, b: number): number => a - b);
    const observed: ReturnType<ReturnType<typeof RecoveryEventRegion>> = region(
      { beforeMm, afterMm, candidates, ports: [] },
    );
    visitedIntervals++;
    visitedIntervalIds.push(interval);
    const byRaw: Map<string, string> = new Map(
      observed.nodes.map(
        (node: (typeof observed.nodes)[number]): [string, string] => [
          node.id,
          node.incidenceId,
        ],
      ),
    );
    const nodes: Map<string, (typeof observed.nodes)[number]> = new Map(),
      occurrences: Map<string, (typeof observed.occurrences)[number]> = new Map(
        observed.occurrences.map(
          (
            row: (typeof observed.occurrences)[number],
          ): [string, (typeof observed.occurrences)[number]] => [row.id, row],
        ),
      );
    for (const node of observed.nodes)
      if (!nodes.has(node.incidenceId)) nodes.set(node.incidenceId, node);
    for (const cell of observed.cells) encounteredFaces.add(cell.face);
    const outcomes: object[] = [];
    const componentOrder: (typeof observed.components)[number][] = [
      ...observed.components,
    ].sort(
      (
        a: (typeof observed.components)[number],
        b: (typeof observed.components)[number],
      ): number =>
        Number(
          b.faces.some((face: number): boolean => priorityFaces.has(face)),
        ) -
          Number(
            a.faces.some((face: number): boolean => priorityFaces.has(face)),
          ) || a.id - b.id,
    );
    for (const component of componentOrder) {
      visitedComponents++;
      const name: string = `chart.${interval}.${component.id}`;
      let reason: string | null = null;
      const reasons: string[] = [];
      const mark: (value: string) => void = (value: string): void => {
        reasons.push(value);
        reason ??= value;
      };
      const supportedTopology: boolean =
        component.topology.manifold &&
        component.topology.orientable === true &&
        component.cycles.length > 0 &&
        component.topology.euler === 2 - component.cycles.length &&
        component.cycles.every(
          (cycle: (typeof component.cycles)[number]): boolean =>
            cycle.orientation === "coherent",
        );
      const cycleSides: string[] = component.cycles.map(
        (cycle: (typeof component.cycles)[number]): string => {
          const labels: Set<string> = new Set(
            cycle.occurrences.map(
              (row: (typeof cycle.occurrences)[number]): string =>
                occurrences.get(row.id)!.side,
            ),
          );
          return labels.size === 1 ? [...labels][0]! : "mixed";
        },
      );
      const annular: boolean =
        supportedTopology &&
        component.cycles.length === 2 &&
        cycleSides.includes("before") &&
        cycleSides.includes("after");
      let generalDisk: boolean =
        supportedTopology && !annular && component.cycles.length > 1;
      if (pending.length >= input.maxCharts)
        mark("chart-work-prefix-exhausted");
      else if (!supportedTopology)
        mark(
          "component-is-not-a-qualified-orientable-genus-zero-surface-with-boundary",
        );
      else if (
        component.cells.some(
          (id: number): boolean =>
            observed.cells[id]!.stratum.kind === "plane" ||
            observed.cells[id]!.sourceGeometryRank !== 2,
        )
      )
        mark(
          "plane-stratum-or-degenerate-source-cell-needs-separate-chart-owner",
        );
      const {
        creaseFaces,
        featureEdges,
      }: ReturnType<typeof RecoveryAtlasObservationCreases> =
        RecoveryAtlasObservationCreases({
          input,
          observed,
          component,
          sourceNormals,
          byRaw,
          mark,
          reason,
        });
      const cycle: (typeof component.cycles)[number] | undefined =
        component.cycles[0];
      type Run = { side: "before" | "after" | "physical"; nodes: string[] };
      const runs: Run[] = [];
      if (!reason && cycle && !annular && component.cycles.length === 1) {
        const sides: ("before" | "after" | "physical")[] =
          cycle.occurrences.map(
            (
              item: (typeof cycle.occurrences)[number],
            ): "before" | "after" | "physical" =>
              occurrences.get(item.id)!.side,
          );
        const start: number = sides.findIndex(
          (side: string, i: number): boolean =>
            side !== sides[(i + sides.length - 1) % sides.length],
        );
        if (start < 0) generalDisk = true;
        else
          for (let k: number = 0; k < sides.length; k++) {
            const i: number = (start + k) % sides.length,
              side: Run["side"] = sides[i]!,
              a: string = cycle.nodes[i]!,
              b: string = cycle.nodes[(i + 1) % sides.length]!;
            if (!runs.length || runs.at(-1)!.side !== side)
              runs.push({ side, nodes: [a, b] });
            else runs.at(-1)!.nodes.push(b);
            if (
              side === "physical" &&
              !occurrences.get(cycle.occurrences[i]!.id)!.physicalBoundary
            )
              mark("boundary-path-lacks-physical-source-incidence");
          }
        if (
          runs.length !== 4 ||
          runs.filter((run: Run): boolean => run.side === "before").length !==
            1 ||
          runs.filter((run: Run): boolean => run.side === "after").length !==
            1 ||
          runs.filter((run: Run): boolean => run.side === "physical").length !==
            2
        )
          generalDisk = true;
      }
      if (!reason)
        try {
          const start: number = runs.findIndex(
              (run: Run): boolean => run.side === "before",
            ),
            ordered: Run[] =
              annular || generalDisk
                ? []
                : Array.from(
                    { length: 4 },
                    (_: unknown, i: number): Run => runs[(start + i) % 4]!,
                  );
          if (!annular && !generalDisk && ordered[2]!.side !== "after")
            generalDisk = true;
          const vertexIds: string[] = [
            ...new Set(
              component.cells.flatMap((id: number): string[] =>
                observed.cells[id]!.nodes.map(
                  (raw: string): string => byRaw.get(raw)!,
                ),
              ),
            ),
          ];
          const slots: Map<string, number> = new Map(
            vertexIds.map((id: string, i: number): [string, number] => [id, i]),
          );
          const positions: C.Vector[] = vertexIds.map(
            (id: string): C.Vector => {
              const node: (typeof observed.nodes)[number] = nodes.get(id)!;
              if (node.vertices.length === 1)
                return input.verticesMm[node.vertices[0]!]!;
              const a: number = node.vertices[0]!,
                b: number = node.vertices[1]!,
                t: number =
                  (node.scalar - heights[a]!) / (heights[b]! - heights[a]!);
              return [0, 1, 2].map(
                (k: number): number =>
                  input.verticesMm[a]![k]! +
                  (input.verticesMm[b]![k]! - input.verticesMm[a]![k]!) * t,
              ) as [number, number, number];
            },
          );
          const triangles: [number, number, number][] = [];
          const triangleSourceFaces: number[] = [];
          for (const id of component.cells) {
            const cell: (typeof observed.cells)[number] = observed.cells[id]!,
              polygon: number[] = cell.nodes.map(
                (raw: string): number => slots.get(byRaw.get(raw)!)!,
              );
            if (cell.orientationFlip) polygon.reverse();
            for (let k: number = 1; k + 1 < polygon.length; k++) {
              triangles.push([polygon[0]!, polygon[k]!, polygon[k + 1]!]);
              triangleSourceFaces.push(cell.face);
            }
          }
          if (featureEdges.length) {
            RecoveryAtlasObservationFeatures({
              input,
              name,
              positions,
              triangles,
              vertexIds,
              slots,
              component,
              interval,
              beforeMm,
              afterMm,
              pending,
              inventory,
              outcomes,
              triangleSourceFaces,
              featureEdges,
              failedSelectedComponents,
              incrementUnsupported: (): void => {
                unsupportedComponents++;
              },
            });
            continue;
          }
          RecoveryAtlasObservationChart({
            occurrences,
            input,
            name,
            positions,
            triangles,
            vertexIds,
            slots,
            component,
            interval,
            beforeMm,
            afterMm,
            pending,
            inventory,
            outcomes,
            annular,
            generalDisk,
            ordered,
          });
          continue;
        } catch (error) {
          mark(
            `chart-correspondence-or-fit: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      if (reason) {
        unsupportedComponents++;
        outcomes.push({
          component: component.id,
          sourceFaces: component.faces,
          chart: null,
          reason,
          reasons: [...new Set(reasons)],
          creaseWitnessFaces: [...new Set(creaseFaces)],
        });
      }
    }
    const planeOwnership: {
      identity: string;
      ownerInterval: number;
      localOccurrence: string;
    }[] = [];
    const plane: (
      face: number,
      coordinateMm: number,
      localOccurrence: string,
    ) => void = (
      face: number,
      coordinateMm: number,
      localOccurrence: string,
    ): void => {
      const identity: string = `${face}:${coordinateMm}`;
      if (!planeOwners.has(identity)) planeOwners.set(identity, interval);
      planeOwnership.push({
        identity,
        ownerInterval: planeOwners.get(identity)!,
        localOccurrence,
      });
    };
    for (const cell of observed.cells)
      if (cell.stratum.kind === "plane")
        plane(cell.face, cell.stratum.coordinateMm, `cell:${cell.id}`);
    for (const occurrence of observed.occurrences)
      if (occurrence.side !== "physical")
        plane(
          occurrence.face,
          occurrence.side === "before" ? beforeMm : afterMm,
          `halfedge:${occurrence.id}`,
        );
    privateLedger.push({
      interval,
      beforeMm,
      afterMm,
      candidates,
      cells: observed.cells,
      nodes: observed.nodes,
      occurrences: observed.occurrences,
      aliases: observed.aliases,
      components: observed.components,
      contacts: observed.contacts,
      issues: observed.issues,
      planeOwnership,
      outcomes,
    });
    observe?.({
      phase: "event-chart-observation",
      interval,
      visitedIntervals,
      visitedComponents,
      charts: charts.length,
      patches: patches.length,
      unsupportedComponents,
      
    });
  }
  return RecoveryAtlasObservationPublish({
    input,
    pending,
    boundaryOwner,
    fittedCharts,
    controls,
    patches,
    charts,
    privateLedger,
    representedFaces,
    encounteredFaces,
    failedSelectedComponents,
    sourceNormals,
    inventory,
    order,
    selection,
    visitedIntervalIds,
    visitedIntervals,
    visitedComponents,
    incrementUnsupported: (): void => {
      unsupportedComponents++;
    },
    unsupportedCount: (): number => unsupportedComponents,
    observe,
  });
}
