import type { IAutoMovieCurve64 as C } from "../../../packages/engine/src/geometry/curve/IAutoMovieCurve64.ts";
import { RecoveryAnnularChart } from "./RecoveryAnnularChart.ts";
import type { RecoveryAtlasObservationTypes } from "./RecoveryAtlasObservationTypes.ts";
import { RecoveryDiskChart } from "./RecoveryDiskChart.ts";
import { RecoveryMultiBoundaryChart } from "./RecoveryMultiBoundaryChart.ts";
import { refineRecoveryChartBoundaryChords } from "./refineRecoveryChartBoundaryChords.ts";

type Input = RecoveryAtlasObservationTypes["Input"];
type Run = { side: "before" | "after" | "physical"; nodes: string[] };
type Prepared = RecoveryAtlasObservationTypes["Prepared"];
type Pending = RecoveryAtlasObservationTypes["Pending"];

type Component = RecoveryAtlasObservationTypes["Component"];

type Inventory = RecoveryAtlasObservationTypes["Inventory"];
/**
 * Prepare an annular, natural-side or general disk chart without changing its declared correspondence.
 *
 * @evidence contracts/common.md#principled-implementation The original cut graph, corner rule, chord refinement and inventory exits preserve chart construction and diagnostics.
 * @evidence contracts/common.md#clear-and-simple-design This phase retains its original arithmetic and ordered state transitions while its caller owns orchestration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Extraction introduces no input correction, geometry fallback, reordered reduction or changed admission condition.
 * @evidence contracts/common.md#meaningful-documentation States the phase responsibility, shared-state ownership and numerical limits inherited from the calling algorithm.
 * @evidence contracts/performance.md#efficient-algorithms Invokes the same chart preparation owners once for each admitted component.
 * @evidence contracts/performance.md#reuse-equivalent-work The existing component vertices and identity arrays feed the pending chart; outcomes remain shared with the ledger.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only prepared private chart data transfers to the batch; temporary chart construction stays call-local.
 */
export function RecoveryAtlasObservationChart(context: {
  occurrences: Map<
    string,
    RecoveryAtlasObservationTypes["Observed"]["occurrences"][number]
  >;
  input: Input;
  name: string;
  positions: C.Vector[];
  triangles: [number, number, number][];
  vertexIds: string[];
  slots: Map<string, number>;
  component: Component;
  interval: number;
  beforeMm: number;
  afterMm: number;
  pending: Pending[];
  inventory: Inventory[];
  outcomes: object[];
  annular: boolean;
  generalDisk: boolean;
  ordered: { side: "before" | "after" | "physical"; nodes: string[] }[];
}): void {
  let {
    positions,
    triangles,
  }: {
    occurrences: Map<
      string,
      RecoveryAtlasObservationTypes["Observed"]["occurrences"][number]
    >;
    input: Input;
    name: string;
    positions: C.Vector[];
    triangles: [number, number, number][];
    vertexIds: string[];
    slots: Map<string, number>;
    component: Component;
    interval: number;
    beforeMm: number;
    afterMm: number;
    pending: Pending[];
    inventory: Inventory[];
    outcomes: object[];
    annular: boolean;
    generalDisk: boolean;
    ordered: { side: "before" | "after" | "physical"; nodes: string[] }[];
  } = context;
  const {
    occurrences,
    input,
    name,
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
  }: {
    occurrences: Map<
      string,
      RecoveryAtlasObservationTypes["Observed"]["occurrences"][number]
    >;
    input: Input;
    name: string;
    positions: C.Vector[];
    triangles: [number, number, number][];
    vertexIds: string[];
    slots: Map<string, number>;
    component: Component;
    interval: number;
    beforeMm: number;
    afterMm: number;
    pending: Pending[];
    inventory: Inventory[];
    outcomes: object[];
    annular: boolean;
    generalDisk: boolean;
    ordered: { side: "before" | "after" | "physical"; nodes: string[] }[];
  } = context;
  let sides: [number[], number[], number[], number[]],
    keys: string[] = vertexIds,
    seam: { path: number[]; lengthMm: number } | null = null;
  let insertions: Prepared["insertions"] = [];
  let diskConstruction: {
    cutEdges: number;
    duplicatedFanVertices: number;
    insertedBoundaryVertices: number;
    subdividedFixedSideChords: number;
    perimeterMm: number;
    anchorTurningDegrees: number;
    sourceAreaDifferenceMm2: number;
  } | null = null;
  if (annular) {
    const cycles: { side: "before" | "after"; nodes: number[] }[] =
      component.cycles.map(
        (
          cycle: (typeof component.cycles)[number],
        ): { side: "before" | "after"; nodes: number[] } => {
          const labels: Set<string> = new Set(
            cycle.occurrences.map(
              (row: (typeof cycle.occurrences)[number]): string =>
                occurrences.get(row.id)!.side,
            ),
          );
          if (
            labels.size !== 1 ||
            (!labels.has("before") && !labels.has("after"))
          )
            throw new Error(
              "An ordinary annulus requires one complete boundary on each cut plane",
            );
          return {
            side: labels.has("before") ? "before" : "after",
            nodes: cycle.nodes.map((id: string): number => slots.get(id)!),
          };
        },
      );
    const before: (typeof cycles)[number] | undefined = cycles.find(
        (cycle: (typeof cycles)[number]): boolean => cycle.side === "before",
      ),
      after: (typeof cycles)[number] | undefined = cycles.find(
        (cycle: (typeof cycles)[number]): boolean => cycle.side === "after",
      );
    if (!before || !after)
      throw new Error(
        "An annulus must join distinct lower and upper cut cycles",
      );
    const cut: ReturnType<typeof RecoveryAnnularChart> = RecoveryAnnularChart({
      verticesMm: positions,
      triangles,
      vertexKeys: keys,
      before: before.nodes,
      after: after.nodes,
    });
    positions = cut.verticesMm;
    triangles = cut.triangles;
    keys = cut.vertexKeys;
    sides = cut.sides;
    seam = { path: cut.seam, lengthMm: cut.seamLengthMm };
  } else if (generalDisk) {
    let boundaryCycle: number[] = component.cycles[0]!.nodes.map(
      (id: string): number => slots.get(id)!,
    );
    let cutEdges: number = 0,
      duplicatedFanVertices: number = 0,
      sourceAreaDifferenceMm2: number = 0;
    if (component.cycles.length > 1) {
      const cut: ReturnType<typeof RecoveryMultiBoundaryChart> =
        RecoveryMultiBoundaryChart({
          verticesMm: positions,
          triangles,
          vertexKeys: keys,
          cycles: component.cycles.map(
            (cycle: (typeof component.cycles)[number]): number[] =>
              cycle.nodes.map((id: string): number => slots.get(id)!),
          ),
        });
      positions = cut.verticesMm;
      triangles = cut.triangles;
      keys = cut.vertexKeys;
      boundaryCycle = cut.boundaryCycle;
      cutEdges = cut.cutEdges;
      duplicatedFanVertices = cut.duplicatedFanVertices;
      sourceAreaDifferenceMm2 = cut.sourceAreaDifferenceMm2;
    }
    const disk: ReturnType<typeof RecoveryDiskChart> = RecoveryDiskChart({
      verticesMm: positions,
      triangles,
      vertexKeys: keys,
      boundaryCycle,
      cornerDegrees: input.cornerDegrees,
    });
    sides = disk.sides;
    insertions = disk.insertedBoundaryVertices;
    const refined: ReturnType<typeof refineRecoveryChartBoundaryChords> =
      refineRecoveryChartBoundaryChords(disk);
    positions = refined.verticesMm;
    triangles = refined.triangles;
    keys = refined.vertexKeys;
    diskConstruction = {
      cutEdges,
      duplicatedFanVertices,
      insertedBoundaryVertices: disk.insertedBoundaryVertices.length,
      subdividedFixedSideChords: refined.subdividedChords,
      perimeterMm: disk.cornerRule.perimeterMm,
      anchorTurningDegrees: disk.cornerRule.anchorTurningDegrees,
      sourceAreaDifferenceMm2,
    };
  } else
    sides = ordered.map((run: Run, i: number): number[] =>
      (i < 2 ? run.nodes : [...run.nodes].reverse()).map(
        (id: string): number => slots.get(id)!,
      ),
    ) as [number[], number[], number[], number[]];
  if (input.inventoryOnly) {
    inventory.push({
      chart: name,
      component: name,
      vertices: positions.length,
      triangles: triangles.length,
      boundaryObservations: sides.reduce(
        (sum: number, side: number[]): number => sum + side.length,
        0,
      ),
      feature: false,
    });
    outcomes.push({
      component: component.id,
      chart: null,
      sourceFaces: component.faces,
      reason: "inventory-only-candidate-not-fitted",
    });
    return;
  }
  pending.push({
    chart: {
      name,
      verticesMm: positions,
      triangles,
      physicalKeys: keys,
      sides,
      insertions,
    },
    interval,
    beforeMm,
    afterMm,
    component: component.id,
    sourceFaces: [...component.faces],
    sourceChart: annular
      ? "annulus-cut-at-private-edge-seam"
      : generalDisk
        ? component.cycles.length > 1
          ? "multi-boundary-cutgraph-four-arc-disk"
          : "physical-arclength-four-arc-disk"
        : "four-natural-side-disk",
    diskConstruction: {
      ...diskConstruction,
      seam: seam
        ? {
            observedEdges: seam.path.length - 1,
            physicalLengthMm: seam.lengthMm,
            privateAddressesPublished: false,
          }
        : null,
    },
    externalBoundaryAuthorityQualified: !generalDisk,
    outcomes,
  });
}
