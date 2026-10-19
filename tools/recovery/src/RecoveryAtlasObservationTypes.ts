import type { RecoveryAtlasObservation } from "./RecoveryAtlasObservation.ts";
import { RecoveryChartBatch as B } from "./RecoveryChartBatch.ts";
import { RecoveryEventRegion } from "./RecoveryEventRegion.ts";

type Prepared = Parameters<typeof B>[0]["charts"][number];
type Pending = {
  chart: Prepared;
  interval: number;
  beforeMm: number;
  afterMm: number;
  component: number;
  sourceFaces: number[];
  sourceChart: string;
  diskConstruction: object | null;
  externalBoundaryAuthorityQualified: boolean;
  outcomes: object[];
};
type Input = Parameters<typeof RecoveryAtlasObservation>[0];
type Observed = ReturnType<ReturnType<typeof RecoveryEventRegion>>;
type Component = Observed["components"][number];
type Feature = {
  from: string;
  to: string;
  sourceEdge: string;
  sourceFaces: [number, number];
  angleDegrees: number;
};
type Inventory = {
  chart: string;
  component: string;
  vertices: number;
  triangles: number;
  boundaryObservations: number;
  feature: boolean;
};
/**
 * Internal observation records retain prepared-chart and private source ownership.
 *
 * @evidence contracts/common.md#principled-implementation The original pending record keeps its shared outcomes array and all source-free preparation fields.
 * @evidence contracts/common.md#clear-and-simple-design This phase retains its original arithmetic and ordered state transitions while its caller owns orchestration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Extraction introduces no input correction, geometry fallback, reordered reduction or changed admission condition.
 * @evidence contracts/common.md#meaningful-documentation States the phase responsibility, shared-state ownership and numerical limits inherited from the calling algorithm.
 * @evidence contracts/performance.md#efficient-algorithms Erased declarations perform no fitting or observation.
 * @evidence contracts/performance.md#reuse-equivalent-work All extracted phases use the same pending and observation record shapes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Types own no runtime handles or retained arrays.
 */
export type RecoveryAtlasObservationTypes = {
  /** Immutable source observations, automatic levels and explicit fit/work budgets. */
  Input: Input;

  /** Private chart observations prepared for the single common boundary-network pass. */
  Prepared: Prepared;

  /** Prepared chart plus source ownership and the ledger-shared outcomes array. */
  Pending: Pending;

  /** Private scalar-cell topology result; source addresses never become engine geometry. */
  Observed: Observed;

  /** One observed edge-connected sheet with independently qualified topology. */
  Component: Component;

  /** Declared private physical crease edge and its two original face owners. */
  Feature: Feature;

  /** Unfitted chart population counts retained by inventory-only observation. */
  Inventory: Inventory;
};
