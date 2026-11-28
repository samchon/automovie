import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryAnnularChartPreparation,
  IAutoMovieRecoveryAtlasObservationChart,
  IAutoMovieRecoveryAtlasObservationInput,
  IAutoMovieRecoveryChartBatch,
  IAutoMovieRecoveryChartBoundaryChordsRefinementOperation,
  IAutoMovieRecoveryChartInventory,
  IAutoMovieRecoveryDiskChart,
  IAutoMovieRecoveryEventRegion,
  IAutoMovieRecoveryMultiBoundaryChart,
  IAutoMovieRecoveryPendingChartObservation,
  IAutoMovieRecoverySourceComponent,
} from "@automovie/interface";

import { RecoveryAnnularChart } from "./RecoveryAnnularChart";
import { RecoveryDiskChart } from "./RecoveryDiskChart";
import { RecoveryMultiBoundaryChart } from "./RecoveryMultiBoundaryChart";
import { refineRecoveryChartBoundaryChords } from "../../geometry/internal/refineRecoveryChartBoundaryChords";

/*
 * Prepare an annular, natural-side or general disk chart without changing its
 * declared correspondence.
 */
export function RecoveryAtlasObservationChart(
  context: Parameters<IAutoMovieRecoveryAtlasObservationChart.Operation>[0],
): ReturnType<IAutoMovieRecoveryAtlasObservationChart.Operation> {
  let {
    positions,
    triangles,
  }: {
    occurrences: Map<
      string,
      IAutoMovieRecoveryEventRegion.Result["occurrences"][number]
    >;
    input: IAutoMovieRecoveryAtlasObservationInput;
    name: string;
    positions: Readonly<AutoMovieVector3Tuple>[];
    triangles: [number, number, number][];
    vertexIds: string[];
    slots: Map<string, number>;
    component: IAutoMovieRecoverySourceComponent;
    interval: number;
    beforeMm: number;
    afterMm: number;
    pending: IAutoMovieRecoveryPendingChartObservation[];
    inventory: IAutoMovieRecoveryChartInventory[];
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
      IAutoMovieRecoveryEventRegion.Result["occurrences"][number]
    >;
    input: IAutoMovieRecoveryAtlasObservationInput;
    name: string;
    positions: Readonly<AutoMovieVector3Tuple>[];
    triangles: [number, number, number][];
    vertexIds: string[];
    slots: Map<string, number>;
    component: IAutoMovieRecoverySourceComponent;
    interval: number;
    beforeMm: number;
    afterMm: number;
    pending: IAutoMovieRecoveryPendingChartObservation[];
    inventory: IAutoMovieRecoveryChartInventory[];
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
    const cut: ReturnType<IAutoMovieRecoveryAnnularChartPreparation.Operation> =
      RecoveryAnnularChart({
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
      const cut: ReturnType<IAutoMovieRecoveryMultiBoundaryChart.Operation> =
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
    const disk: ReturnType<IAutoMovieRecoveryDiskChart.Operation> =
      RecoveryDiskChart({
        verticesMm: positions,
        triangles,
        vertexKeys: keys,
        boundaryCycle,
        cornerDegrees: input.cornerDegrees,
      });
    sides = disk.sides;
    insertions = disk.insertedBoundaryVertices;
    const refined: ReturnType<IAutoMovieRecoveryChartBoundaryChordsRefinementOperation.Operation> =
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
  } else {
    const side = (i: 0 | 1 | 2 | 3): number[] =>
      (i < 2 ? ordered[i]!.nodes : [...ordered[i]!.nodes].reverse()).map(
        (id: string): number => slots.get(id)!,
      );
    sides = [side(0), side(1), side(2), side(3)];
  }
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
type Prepared =
  IAutoMovieRecoveryChartBatch.IInput["charts"][number];
