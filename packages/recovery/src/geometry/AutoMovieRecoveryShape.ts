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
  /**
   * Measures one connected surface with complete boundary cycles.
   *
   * Supply oriented triangles with safe integer addresses in the supplied
   * millimetre positions. The result contains their directed incidence,
   * physical edge lengths and summed area in square millimetres. Invalid
   * geometry, disconnected faces or ambiguous links call the supplied
   * failure handler.
   */
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
   * Bind one fresh physical section cut to the complete saved raw contour
   * population. Match original contour ordinals, closure and source face
   * addresses. Saved curve names and publication indices remain
   * caller-attested. A mismatch returns `refused`; an admitted result returns
   * `bound` with current exact support.
   */
  export function bindSavedSectionCuts(input: Parameters<IAutoMovieRecoverySavedSectionCutsBindingOperation.Operation>[0]): ReturnType<IAutoMovieRecoverySavedSectionCutsBindingOperation.Operation> {
    return bindRecoverySavedSectionCutsImplementation(input);
  }

  /**
   * Collect broad original-face support for a sampled cut contour. Union
   * incident faces at sampled source vertices and crossed edges. The result
   * can include a face that touched only an endpoint.
   */
  export function collectContourFaceSupport(points: Parameters<IAutoMovieRecoveryContourFaceSupportCollectionOperation.Operation>[0], vertexFaces: Parameters<IAutoMovieRecoveryContourFaceSupportCollectionOperation.Operation>[1], faceEdges: Parameters<IAutoMovieRecoveryContourFaceSupportCollectionOperation.Operation>[2], edgeKey: Parameters<IAutoMovieRecoveryContourFaceSupportCollectionOperation.Operation>[3]): ReturnType<IAutoMovieRecoveryContourFaceSupportCollectionOperation.Operation> {
    return collectRecoveryContourFaceSupportImplementation(points, vertexFaces, faceEdges, edgeKey);
  }

  /**
   * Extract cubic contour observations from a registered source mesh in
   * millimetres at automatic stations and critical brackets. An optional
   * section limit keeps a sorted prefix and reports the omitted coverage. A
   * lineage callback receives copied source face addresses, including local
   * failures and isolated contacts. Progress or lineage failure propagates.
   */
  export function extractMeshSections(input: IAutoMovieRecoveryInput, progress?: (phase: string, completed: number, total: number) => void, sectionLimit?: number, onSourceLineage?: (observation: IAutoMovieRecoverySourceLineage) => void): IAutoMovieRecoveryMeshSections {
    return extractRecoveryMeshSectionsImplementation(input, progress, sectionLimit, onSourceLineage);
  }

  /**
   * Reobserve named saved section planes in the original registered millimetre
   * frame. Supply byte-verified source and artifact identities, source
   * selection and original face mapping. The result records fresh raw cuts and
   * bound source lineage. Mismatched identity, frame, incidence or saved
   * populations throw.
   */
  export function observeOrderedCuts(input: IAutoMovieRecoveryOrderedLineage.Input): IAutoMovieRecoveryOrderedCuts {
    return observeRecoveryOrderedCutsImplementation(input);
  }

  /**
   * Observe every contour on one fixed registered millimetre plane. A
   * collection name can prefix curve identities. The optional lineage observer
   * receives original supporting face addresses after local fitting, even for
   * refused contours. Observer exceptions propagate.
   */
  export function observeSection(input: Parameters<IAutoMovieRecoverySectionObservationOperation.Operation>[0]): ReturnType<IAutoMovieRecoverySectionObservationOperation.Operation> {
    return observeRecoverySectionImplementation(input);
  }

  /**
   * Attach measured source components to observed section port identities. Use
   * complete retained cuts and requested registered millimetre bounds. Actual
   * segment and contact provenance establishes port support. Missing sections
   * or missing required exact evidence throw.
   */
  export function observeSourceSlabs(input: Parameters<IAutoMovieRecoverySourceSlabsObservationOperation.Operation>[0]): ReturnType<IAutoMovieRecoverySourceSlabsObservationOperation.Operation> {
    return observeRecoverySourceSlabsImplementation(input);
  }

  /**
   * Observe distal extrema and critical brackets from the original faces
   * supporting a supplied closed loop. Positions and levels are millimetres.
   * Report finite extremum ties and qualified tips separately. A source
   * maximum without a finite outward bound throws.
   */
  export function observeSourceTerminals(input: Parameters<IAutoMovieRecoverySourceTerminalsObservationOperation.Operation>[0]): ReturnType<IAutoMovieRecoverySourceTerminalsObservationOperation.Operation> {
    return observeRecoverySourceTerminalsImplementation(input);
  }

  /**
   * Prepare fixed outer-collar coefficients from the declared fitted boundary
   * cubics. Use the registry's normalized UV interval addresses and millimetre
   * controls. An exterior leaf edge must stay inside one native boundary span.
   * Conflicting corner values or coefficient owners throw.
   */
  export function prepareChartLeafBoundary(input: Parameters<IAutoMovieRecoveryChartLeafBoundaryPreparationOperation.Operation>[0], registry: Parameters<IAutoMovieRecoveryChartLeafBoundaryPreparationOperation.Operation>[1]): ReturnType<IAutoMovieRecoveryChartLeafBoundaryPreparationOperation.Operation> {
    return prepareRecoveryChartLeafBoundaryImplementation(input, registry);
  }

  /**
   * Replace eligible critical sweep levels with neighboring brackets. Levels
   * and step use millimetres. Return the selected brackets and source vertices
   * that remain unsupported. Flat or unresolved local topology retains a
   * diagnostic.
   */
  export function prepareCriticalBrackets(criticals: Parameters<IAutoMovieRecoveryCriticalBracketsPreparationOperation.Operation>[0], heights: Parameters<IAutoMovieRecoveryCriticalBracketsPreparationOperation.Operation>[1], stepMm: Parameters<IAutoMovieRecoveryCriticalBracketsPreparationOperation.Operation>[2], levels: Parameters<IAutoMovieRecoveryCriticalBracketsPreparationOperation.Operation>[3], diagnostics: Parameters<IAutoMovieRecoveryCriticalBracketsPreparationOperation.Operation>[4], topologyGaps: Parameters<IAutoMovieRecoveryCriticalBracketsPreparationOperation.Operation>[5]): ReturnType<IAutoMovieRecoveryCriticalBracketsPreparationOperation.Operation> {
    return prepareRecoveryCriticalBracketsImplementation(criticals, heights, stepMm, levels, diagnostics, topologyGaps);
  }

  /**
   * Choose a stable starting occurrence on an oriented private disk boundary
   * and measure its four physical perimeter quarters. Positions and measured
   * offsets use millimetres. Use the supplied corner threshold in degrees and
   * preserve the boundary's coherent direction.
   */
  export function prepareDiskBoundary(input: Parameters<IAutoMovieRecoveryDiskBoundaryPreparationOperation.Operation>[0], fail: Parameters<IAutoMovieRecoveryDiskBoundaryPreparationOperation.Operation>[1]): ReturnType<IAutoMovieRecoveryDiskBoundaryPreparationOperation.Operation> {
    return prepareRecoveryDiskBoundaryImplementation(input, fail);
  }

  /**
   * Prepare a common row domain for admitted calibrated silhouette supports.
   * Keep each supplied measured row inside the common millimetre interval. A
   * view's missing stations interpolate only within its measured domain.
   * Reject invalid views, a deficient shared interval or an exceeded row
   * budget.
   */
  export function prepareImageSupports(observation: Parameters<IAutoMovieRecoveryImageSupportsPreparationOperation.Operation>[0], limits: Parameters<IAutoMovieRecoveryImageSupportsPreparationOperation.Operation>[1]): ReturnType<IAutoMovieRecoveryImageSupportsPreparationOperation.Operation> {
    return prepareRecoveryImageSupportsImplementation(observation, limits);
  }

  /**
   * Prepare source vertex aliases and face incidence for an indexed observed
   * mesh. With coordinate aliases disabled, original vertex addresses stay
   * independent. Enable them only to join exactly equal positions. Return
   * original-face edge and vertex support.
   */
  export function prepareMeshIncidence(input: Parameters<IAutoMovieRecoveryMeshIncidencePreparationOperation.Operation>[0], vertices: Parameters<IAutoMovieRecoveryMeshIncidencePreparationOperation.Operation>[1]): ReturnType<IAutoMovieRecoveryMeshIncidencePreparationOperation.Operation> {
    return prepareRecoveryMeshIncidenceImplementation(input, vertices);
  }

  /**
   * Split private map chords whose fixed endpoints lie on the same side of the
   * unit square. Insert one free map vertex at each source-PL midpoint in
   * millimetres. Keep both incident orientations and the original observed
   * boundary paths. Invalid incidence or a nonrepresentable subdivision
   * throws.
   */
  export function refineChartBoundaryChords(input: Parameters<IAutoMovieRecoveryChartBoundaryChordsRefinementOperation.Operation>[0]): ReturnType<IAutoMovieRecoveryChartBoundaryChordsRefinementOperation.Operation> {
    return refineRecoveryChartBoundaryChordsImplementation(input);
  }
}
