import type { IAutoMovieRecoveryAtlasObservationOperation } from "../observation/IAutoMovieRecoveryAtlasObservationOperation";
import type { IAutoMovieRecoveryChartBatch } from "./IAutoMovieRecoveryChartBatch";
import type { IAutoMovieRecoveryEventRegion } from "./IAutoMovieRecoveryEventRegion";


/** Internal observation records retain prepared-chart and private source ownership.
 *
 * @evidence contracts/development/design.md#principled-representation The original pending record keeps its shared outcomes array and all source-free preparation fields.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This phase retains its original arithmetic and ordered state transitions while its caller owns orchestration.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Extraction introduces no input correction, geometry fallback, reordered reduction or changed admission condition.
 * @evidence contracts/development/common.md#meaningful-documentation States the phase responsibility, shared-state ownership and numerical limits inherited from the calling algorithm.
 */
export type IAutoMovieRecoveryAtlasObservationState = {
 
 /** Immutable source observations, automatic levels and explicit fit/work budgets. */
  Input: Parameters<IAutoMovieRecoveryAtlasObservationOperation.Operation>[0];

 
 /** Private chart observations prepared for the single common boundary-network pass. */
  Prepared: Parameters<IAutoMovieRecoveryChartBatch.Operation>[0]["charts"][number];

 
 /** Prepared chart plus source ownership and the ledger-shared outcomes array. */
  Pending: IAutoMovieRecoveryAtlasObservationState.Pending;

 
 /** Private scalar-cell topology result; source addresses never become engine geometry. */
  Observed: ReturnType<ReturnType<IAutoMovieRecoveryEventRegion.Operation>>;

 
 /** One observed edge-connected sheet with independently qualified topology. */
  Component: IAutoMovieRecoveryAtlasObservationState.Component;

 
 /** Declared private physical crease edge and its two original face owners. */
  Feature: IAutoMovieRecoveryAtlasObservationState.Feature;

 
 /** Unfitted chart population counts retained by inventory-only observation. */
  Inventory: IAutoMovieRecoveryAtlasObservationState.Inventory;
};
/**
 * Shared state records for source-chart preparation, fitting and atlas observation publication.
 * Pending jobs borrow prepared charts and mutate the same outcomes arrays as the
 * private observation ledger. Original face addresses and source normals remain
 * acquisition evidence; only the publication phase may construct the source-free
 * coefficient result. These records neither acquire files nor validate source bytes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Prepared or fitted chart record whose source correspondence and coefficient authority remain separately qualified. Ordinal of the adjacent saved-plane interval in the complete observation sequence.
 * @evidence contracts/development/design.md#principled-representation Ordinal of the adjacent saved-plane interval in the complete observation sequence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryAtlasObservationChart, RecoveryAtlasObservationCreases, RecoveryAtlasObservationFeatures share IAutoMovieRecoveryAtlasObservationState's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Prepared or fitted chart record whose source correspondence and coefficient authority remain separately qualified.
 */
export namespace IAutoMovieRecoveryAtlasObservationState {


/**
 * Pending within recovery atlas observation state. Prepared or fitted chart record whose source correspondence and coefficient authority remain separately qualified.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Prepared or fitted chart record whose source correspondence and coefficient authority remain separately qualified. Ordinal of the adjacent saved-plane interval in the complete observation sequence.
 * @evidence contracts/development/design.md#principled-representation Ordinal of the adjacent saved-plane interval in the complete observation sequence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryAtlasObservationChart, RecoveryAtlasObservationCreases, RecoveryAtlasObservationFeatures share IAutoMovieRecoveryAtlasObservationState's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Prepared or fitted chart record whose source correspondence and coefficient authority remain separately qualified.
 */
export type Pending = {
 
 /** Prepared or fitted chart record whose source correspondence and coefficient authority remain separately qualified. */
chart: Parameters<IAutoMovieRecoveryChartBatch.Operation>[0]["charts"][number];
 
 /** Ordinal of the adjacent saved-plane interval in the complete observation sequence. */
interval: number;
 
 /** Lower physical sweep coordinate in registered millimetres; paired with the strictly greater afterMm. */
beforeMm: number;
 
 /** Upper physical sweep coordinate in registered millimetres; paired with the strictly smaller beforeMm. */
afterMm: number;
 
 /** Query-local component ordinal; null, where allowed, means the cell has no two-dimensional component. */
component: number;
 
 /** Original source-face ordinals belonging to this observed chart or feature. */
sourceFaces: number[];
 
 /** Stable identity of the original observed chart before feature-driven subdivision. */
sourceChart: string;
 
 /** Optional disk-parameterization construction metadata; null means this chart used no such record. */
diskConstruction: object | null;
 
 /** Whether the supplied external boundary coefficients passed the observation owner's authority checks. */
externalBoundaryAuthorityQualified: boolean;
 
 /** Caller-owned mutable diagnostic ledger entries; these are metadata and never interpreted as generated geometry. */
outcomes: object[];
};


/**
 * Component within recovery atlas observation state. Its referenced contract retains the same units, ordering and absence semantics.
 *
 * @evidence contracts/development/common.md#meaningful-documentation 
 * @evidence contracts/development/design.md#principled-representation Component within recovery atlas observation state. Its referenced contract retains the same units, ordering and absence semantics.
 * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryAtlasObservationChart, RecoveryAtlasObservationCreases, RecoveryAtlasObservationFeatures share IAutoMovieRecoveryAtlasObservationState's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */
export type Component = ReturnType<ReturnType<IAutoMovieRecoveryEventRegion.Operation>>["components"][number];


/**
 * Feature within recovery atlas observation state. Identity of the directed source incidence at this edge's start.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identity of the directed source incidence at this edge's start. Identity of the directed source incidence at this edge's end.
 * @evidence contracts/development/design.md#principled-representation Original source-face ordinals belonging to this observed chart or feature.
 * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryAtlasObservationChart, RecoveryAtlasObservationCreases, RecoveryAtlasObservationFeatures share IAutoMovieRecoveryAtlasObservationState's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */
export type Feature = {
 
 /** Identity of the directed source incidence at this edge's start. */
from: string;
 
 /** Identity of the directed source incidence at this edge's end. */
to: string;
 
 /** Original source-edge identity; coincident edges with different incidence remain distinct. */
sourceEdge: string;
 
 /** Original source-face ordinals belonging to this observed chart or feature. */
sourceFaces: [number, number];
 
 /** Measured angle between the incident source faces, in degrees. */
angleDegrees: number;
};


/**
 * Inventory within recovery atlas observation state. Stable identity of the observed or prepared chart.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Stable identity of the observed or prepared chart. One observed source-cell component with independent topology qualification.
 * @evidence contracts/development/design.md#principled-representation Inventory within recovery atlas observation state. Stable identity of the observed or prepared chart.
 * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryAtlasObservationChart, RecoveryAtlasObservationCreases, RecoveryAtlasObservationFeatures share IAutoMovieRecoveryAtlasObservationState's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts One observed source-cell component with independent topology qualification.
 */
export type Inventory = {
 
 /** Stable identity of the observed or prepared chart. */
chart: string;
 
 /** One observed source-cell component with independent topology qualification. */
component: string;
 
 /** Actual vertex population of this generated run or observed component. */
vertices: number;
 
 /** Actual triangle population of this generated run or observed component. */
triangles: number;
 
 /** Number of source-boundary point observations assigned to the chart. */
boundaryObservations: number;
 
 /** Whether this inventory entry represents a chart split along an admitted source crease. */
feature: boolean;
};
}

