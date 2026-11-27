import { type IAutoMovieRecoveryMultiBoundarySurfaceAnalysisOperation, type IAutoMovieRecoveryImageChartAssertOperation, type IAutoMovieRecoverySavedSectionCutsBindingOperation, type IAutoMovieRecoveryContourFaceSupportCollectionOperation, type IAutoMovieRecoveryMeshSections, type IAutoMovieRecoveryInput, type IAutoMovieRecoverySourceLineage, type IAutoMovieRecoveryOrderedCuts, type IAutoMovieRecoveryOrderedLineage, type IAutoMovieRecoverySectionObservationOperation, type IAutoMovieRecoverySourceSlabsObservationOperation, type IAutoMovieRecoverySourceTerminalsObservationOperation, type IAutoMovieRecoveryChartLeafBoundaryPreparationOperation, type IAutoMovieRecoveryCriticalBracketsPreparationOperation, type IAutoMovieRecoveryDiskBoundaryPreparationOperation, type IAutoMovieRecoveryImageSupportsPreparationOperation, type IAutoMovieRecoveryMeshIncidencePreparationOperation, type IAutoMovieRecoveryChartBoundaryChordsRefinementOperation } from "@automovie/interface";
import { analyzeRecoveryMultiBoundarySurface as analyzeRecoveryMultiBoundarySurfaceImplementation } from "./internal/analyzeRecoveryMultiBoundarySurface";
import { assertRecoveryImageChart as assertRecoveryImageChartImplementation } from "./internal/assertRecoveryImageChart";
import { bindRecoverySavedSectionCuts as bindRecoverySavedSectionCutsImplementation } from "./internal/bindRecoverySavedSectionCuts";
import { collectRecoveryContourFaceSupport as collectRecoveryContourFaceSupportImplementation } from "./internal/collectRecoveryContourFaceSupport";
import { extractRecoveryMeshSections as extractRecoveryMeshSectionsImplementation } from "./internal/extractRecoveryMeshSections";
import { observeRecoveryOrderedCuts as observeRecoveryOrderedCutsImplementation } from "./internal/observeRecoveryOrderedCuts";
import { observeRecoverySection as observeRecoverySectionImplementation } from "./internal/observeRecoverySection";
import { observeRecoverySourceSlabs as observeRecoverySourceSlabsImplementation } from "./internal/observeRecoverySourceSlabs";
import { observeRecoverySourceTerminals as observeRecoverySourceTerminalsImplementation } from "./internal/observeRecoverySourceTerminals";
import { prepareRecoveryChartLeafBoundary as prepareRecoveryChartLeafBoundaryImplementation } from "./internal/prepareRecoveryChartLeafBoundary";
import { prepareRecoveryCriticalBrackets as prepareRecoveryCriticalBracketsImplementation } from "./internal/prepareRecoveryCriticalBrackets";
import { prepareRecoveryDiskBoundary as prepareRecoveryDiskBoundaryImplementation } from "./internal/prepareRecoveryDiskBoundary";
import { prepareRecoveryImageSupports as prepareRecoveryImageSupportsImplementation } from "./internal/prepareRecoveryImageSupports";
import { prepareRecoveryMeshIncidence as prepareRecoveryMeshIncidenceImplementation } from "./internal/prepareRecoveryMeshIncidence";
import { refineRecoveryChartBoundaryChords as refineRecoveryChartBoundaryChordsImplementation } from "./internal/refineRecoveryChartBoundaryChords";

/** Public operations for Auto Movie Recovery Shape. */
export namespace AutoMovieRecoveryShape {
  /** Analyze coherent private surface incidence and complete boundary cycles. */
  export function analyzeMultiBoundarySurface(vertices: Parameters<IAutoMovieRecoveryMultiBoundarySurfaceAnalysisOperation.Operation>[0], triangles: Parameters<IAutoMovieRecoveryMultiBoundarySurfaceAnalysisOperation.Operation>[1], fail: Parameters<IAutoMovieRecoveryMultiBoundarySurfaceAnalysisOperation.Operation>[2], edgeKey: Parameters<IAutoMovieRecoveryMultiBoundarySurfaceAnalysisOperation.Operation>[3]): ReturnType<IAutoMovieRecoveryMultiBoundarySurfaceAnalysisOperation.Operation> {
    return analyzeRecoveryMultiBoundarySurfaceImplementation(vertices, triangles, fail, edgeKey);
  }

  /**
   * Admit the finite metric pixel chart and verify measured row/cell coordinates.
   * Adjacent occupied rows must form one eight-connected foreground component.
   * The relative binary64 bound covers arithmetic roundoff, not segmentation or
   * camera uncertainty. A chart whose frame offset overwhelms pixel increments
   * refuses instead of publishing aliased stations as calibrated measurements.
   */
  export function assertImageChart(view: Parameters<IAutoMovieRecoveryImageChartAssertOperation.Operation>[0]): ReturnType<IAutoMovieRecoveryImageChartAssertOperation.Operation> {
    return assertRecoveryImageChartImplementation(view);
  }

  /**
   * Compare a complete saved raw-contour population with one fresh exact cut.
   * Address sets and admitted closure verify contour identity only; curve names
   * and output indices remain caller-attested references. Newly emitted exact
   * faces are used even when the saved artifact retained broad incidence only.
   */
  export function bindSavedSectionCuts(input: Parameters<IAutoMovieRecoverySavedSectionCutsBindingOperation.Operation>[0]): ReturnType<IAutoMovieRecoverySavedSectionCutsBindingOperation.Operation> {
    return bindRecoverySavedSectionCutsImplementation(input);
  }

  /**
   * Union original triangle incidence at every sampled contour vertex or crossed
   * source edge. The resulting support can include adjacent faces and is not a
   * semantic region or an exact generating patch.
   */
  export function collectContourFaceSupport(points: Parameters<IAutoMovieRecoveryContourFaceSupportCollectionOperation.Operation>[0], vertexFaces: Parameters<IAutoMovieRecoveryContourFaceSupportCollectionOperation.Operation>[1], faceEdges: Parameters<IAutoMovieRecoveryContourFaceSupportCollectionOperation.Operation>[2], edgeKey: Parameters<IAutoMovieRecoveryContourFaceSupportCollectionOperation.Operation>[3]): ReturnType<IAutoMovieRecoveryContourFaceSupportCollectionOperation.Operation> {
    return collectRecoveryContourFaceSupportImplementation(points, vertexFaces, faceEdges, edgeKey);
  }

  /**
   * Extract every section component with automatic stations, feature corners and
   * PL critical brackets. Physical ties remain explicit; cutting and PL topology
   * share one immutable scalar chart. The optional progress observer reports
   * completed plane and slab populations without changing geometry. An explicit
   * sectionLimit publishes an incomplete sorted-station prefix; coverage records
   * the full omission. The optional lineage observer receives copied incident
   * face IDs per contour, including local failures and degenerate contacts;
   * callback exceptions escape the local fitting catch and fail extraction.
   */
  export function extractMeshSections(input: IAutoMovieRecoveryInput, progress?: (phase: string, completed: number, total: number) => void, sectionLimit?: number, onSourceLineage?: (observation: IAutoMovieRecoverySourceLineage) => void): IAutoMovieRecoveryMeshSections {
    return extractRecoveryMeshSectionsImplementation(input, progress, sectionLimit, onSourceLineage);
  }

  /**
   * Reobserve requested saved planes without reading or fitting a coefficient.
   * The caller verifies native and saved artifact bytes; this function compares
   * their declared source/selection/frame identities and rechecks complete raw
   * populations, closure and broad/exact face sets through the official binder.
   * Binary64 cutting is not certified exact arithmetic. No aggregate metadata
   * byte ceiling or cancellation hook is provided; the synchronous caller bounds
   * its selected mesh and saved-plane request and keeps borrowed inputs
   * immutable.
   */
  export function observeOrderedCuts(input: IAutoMovieRecoveryOrderedLineage.Input): IAutoMovieRecoveryOrderedCuts {
    return observeRecoveryOrderedCutsImplementation(input);
  }

  /**
   * Observe and fit every contour on one fixed private section. An optional
   * collection name prefixes curve identities; an optional acquisition observer
   * receives copied original face incidence after local fitting, including
   * rejected contours. Observer exceptions escape the fitting catch.
   */
  export function observeSection(input: Parameters<IAutoMovieRecoverySectionObservationOperation.Operation>[0]): ReturnType<IAutoMovieRecoverySectionObservationOperation.Operation> {
    return observeRecoverySectionImplementation(input);
  }

  /**
   * Bind actual cut-emitting faces and published contour identities to clipped
   * source slabs. The same physical scalar chart drives source cells and PL
   * critical classification. All components and issues survive; only actual
   * segment/contact provenance supplies ports, never endpoint-star witnesses.
   * Copy the observed raw-node, alias and halfedge registries with their input
   * ordinal spaces so boundary words remain joinable without parsing IDs.
   * Measured critical brackets do not imply curves fitted at those bracket
   * planes, exact material phase transport or transverse jets.
   */
  export function observeSourceSlabs(input: Parameters<IAutoMovieRecoverySourceSlabsObservationOperation.Operation>[0]): ReturnType<IAutoMovieRecoverySourceSlabsObservationOperation.Operation> {
    return observeRecoverySourceSlabsImplementation(input);
  }

  /**
   * Observe actual distal extrema and PL critical brackets from existing
   * source-loop incidence. The open half-space is bounded above by the next
   * representable value beyond the source maximum. Private vertex-face probes let
   * the existing slab graph identify exactly the seeded indexed-source component;
   * original point positions are published only as measured extrema and critical
   * event observations. A one-tip result requires unique incidence, two-use
   * original edges, one nonflat manifold maximum and no other critical event;
   * branch and plateau observations remain explicit.
   */
  export function observeSourceTerminals(input: Parameters<IAutoMovieRecoverySourceTerminalsObservationOperation.Operation>[0]): ReturnType<IAutoMovieRecoverySourceTerminalsObservationOperation.Operation> {
    return observeRecoverySourceTerminalsImplementation(input);
  }

  /** Prepare fixed outer collar coefficients from the original boundary cubics. */
  export function prepareChartLeafBoundary(input: Parameters<IAutoMovieRecoveryChartLeafBoundaryPreparationOperation.Operation>[0], registry: Parameters<IAutoMovieRecoveryChartLeafBoundaryPreparationOperation.Operation>[1]): ReturnType<IAutoMovieRecoveryChartLeafBoundaryPreparationOperation.Operation> {
    return prepareRecoveryChartLeafBoundaryImplementation(input, registry);
  }

  /** Prepare critical physical brackets and retain explicit unresolvable gaps. */
  export function prepareCriticalBrackets(criticals: Parameters<IAutoMovieRecoveryCriticalBracketsPreparationOperation.Operation>[0], heights: Parameters<IAutoMovieRecoveryCriticalBracketsPreparationOperation.Operation>[1], stepMm: Parameters<IAutoMovieRecoveryCriticalBracketsPreparationOperation.Operation>[2], levels: Parameters<IAutoMovieRecoveryCriticalBracketsPreparationOperation.Operation>[3], diagnostics: Parameters<IAutoMovieRecoveryCriticalBracketsPreparationOperation.Operation>[4], topologyGaps: Parameters<IAutoMovieRecoveryCriticalBracketsPreparationOperation.Operation>[5]): ReturnType<IAutoMovieRecoveryCriticalBracketsPreparationOperation.Operation> {
    return prepareRecoveryCriticalBracketsImplementation(criticals, heights, stepMm, levels, diagnostics, topologyGaps);
  }

  /** Choose a private disk boundary anchor and exact physical quarter measures. */
  export function prepareDiskBoundary(input: Parameters<IAutoMovieRecoveryDiskBoundaryPreparationOperation.Operation>[0], fail: Parameters<IAutoMovieRecoveryDiskBoundaryPreparationOperation.Operation>[1]): ReturnType<IAutoMovieRecoveryDiskBoundaryPreparationOperation.Operation> {
    return prepareRecoveryDiskBoundaryImplementation(input, fail);
  }

  /**
   * Admit measured image supports and prepare their common physical row chart.
   * Retain every original row inside the shared interval; interpolate other views
   * linearly only within their measured domains. This changes neither image bytes
   * nor the meaning of a recorded row. Cameras and rigidity remain supplied
   * inputs.
   */
  export function prepareImageSupports(observation: Parameters<IAutoMovieRecoveryImageSupportsPreparationOperation.Operation>[0], limits: Parameters<IAutoMovieRecoveryImageSupportsPreparationOperation.Operation>[1]): ReturnType<IAutoMovieRecoveryImageSupportsPreparationOperation.Operation> {
    return prepareRecoveryImageSupportsImplementation(observation, limits);
  }

  /** Prepare declared source aliases and original edge/vertex face incidence. */
  export function prepareMeshIncidence(input: Parameters<IAutoMovieRecoveryMeshIncidencePreparationOperation.Operation>[0], vertices: Parameters<IAutoMovieRecoveryMeshIncidencePreparationOperation.Operation>[1]): ReturnType<IAutoMovieRecoveryMeshIncidencePreparationOperation.Operation> {
    return prepareRecoveryMeshIncidenceImplementation(input, vertices);
  }

  /**
   * Subdivide private interior edges whose fixed endpoints share one square side.
   * Such a chord has zero transverse UV extent under square Dirichlet data and
   * can collapse an incident ear even for a valid PL disk. Its source-PL midpoint
   * is a new free map vertex, and both incident triangles retain coherent
   * orientation. Original coordinates, boundary observations and physical
   * identities are copied; paired cut occurrences receive equal midpoint keys
   * without ordinal welding. This removes the specific fixed chord obstruction,
   * not all harmonic degeneracy. The consumer must still check every actual
   * signed UV area before fitting.
   */
  export function refineChartBoundaryChords(input: Parameters<IAutoMovieRecoveryChartBoundaryChordsRefinementOperation.Operation>[0]): ReturnType<IAutoMovieRecoveryChartBoundaryChordsRefinementOperation.Operation> {
    return refineRecoveryChartBoundaryChordsImplementation(input);
  }
}
