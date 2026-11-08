import type { observeAutoMovieRecoveryAtlas } from "../observation/observeAutoMovieRecoveryAtlas";
import { RecoveryChartBatch as B } from "./RecoveryChartBatch";
import { RecoveryEventRegion } from "./RecoveryEventRegion";

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
type Input = Parameters<typeof observeAutoMovieRecoveryAtlas>[0];
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
 * @evidence contracts/development/design.md#principled-representation The original pending record keeps its shared outcomes array and all source-free preparation fields.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This phase retains its original arithmetic and ordered state transitions while its caller owns orchestration.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Extraction introduces no input correction, geometry fallback, reordered reduction or changed admission condition.
 * @evidence contracts/development/common.md#meaningful-documentation States the phase responsibility, shared-state ownership and numerical limits inherited from the calling algorithm.
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
