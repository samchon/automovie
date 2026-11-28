import { RecoveryChartBatch as assembleChartBatchImplementation } from "./internal/RecoveryChartBatch";
import { RecoveryChartFitRows as streamChartFitRowsImplementation } from "./internal/RecoveryChartFitRows";
import type {
  IAutoMovieRecoveryChartBatch,
  IAutoMovieRecoveryChartFitRows,
  AutoMovieRecoveryCurveData,
  AutoMovieRecoveryCurveFormat,
  IAutoMovieRecoveryAtlasObservation,
  IAutoMovieRecoveryAtlasObservationInput,
  IAutoMovieRecoveryCameraMapEstimate,
  IAutoMovieRecoveryCameraSetObservationOperation,
  IAutoMovieRecoveryImageFeaturesExtractionOperation,
  IAutoMovieRecoveryCameraTracksLinkageOperation,
  IAutoMovieRecoveryCameraMapInput,
  IAutoMovieRecoveryCameraPairEstimate,
  IAutoMovieRecoveryCameraPairInput,
  IAutoMovieRecoveryCameraSceneEstimate,
  IAutoMovieRecoveryCameraSceneInput,
  IAutoMovieRecoveryContourResume,
  IAutoMovieRecoveryContourResumeInput,
  IAutoMovieRecoveryDefaultObservationOptions,
  IAutoMovieRecoveryImageInput,
  IAutoMovieRecoveryImageObservation,
  IAutoMovieRecoveryInput,
  IAutoMovieRecoveryMeshSections,
  IAutoMovieRecoveryObservationChart,
  IAutoMovieRecoveryObservationChartSeed,
  IAutoMovieRecoveryObservationOptions,
  IAutoMovieRecoveryObservationTransport,
  IAutoMovieRecoveryOptions,
  IAutoMovieRecoveryPreparedInput,
  IAutoMovieRecoveryRegisteredInput,
  IAutoMovieRecoveryResult,
  IAutoMovieRecoverySections,
  IAutoMovieRecoverySectionsInput,
  IAutoMovieRecoverySlabs,
  IAutoMovieRecoverySlabsInput,
  IAutoMoviePolylineFit,
  IAutoMoviePolylineFitInput,
  IAutoMovieRecoveryAtlasObservationSource,
  IAutoMovieRecoveryAtlasObservationCreases,
  IAutoMovieRecoveryAtlasObservationFeatures,
  IAutoMovieRecoveryAtlasObservationChart,
  IAutoMovieRecoveryAtlasObservationPublish,
  IAutoMovieRecoveryChartBoundaryNetwork,
  IAutoMovieRecoveryAnnularChartPreparation,
  IAutoMovieRecoveryDiskChart,
  IAutoMovieRecoveryMultiBoundaryChart,
  IAutoMovieRecoveryChartCollar,
  IAutoMovieRecoveryChartAreaObservations,
  IAutoMovieRecoveryChartAssembly,
  IAutoMovieRecoveryChartBoundary,
  IAutoMovieRecoveryChartBoundaryNetworkAugment,
  IAutoMovieRecoveryChartBoundaryNetworkBindings,
  IAutoMovieRecoveryChartBoundaryNetworkRegistry,
  IAutoMovieRecoveryChartBoxSolve,
  IAutoMovieRecoveryChartControlRelations,
  IAutoMovieRecoveryChartFitPrepare,
  IAutoMovieRecoveryChartFitReport,
  IAutoMovieRecoveryFeatureChartCuts,
  IAutoMovieRecoveryChartFitSolve,
  IAutoMovieRecoveryChartFitSystem,
  IAutoMovieRecoveryChartLeafAssembly,
  IAutoMovieRecoveryChartLeafControls,
  IAutoMovieRecoveryChartLeafFit,
  IAutoMovieRecoveryChartPhysicalJet,
  IAutoMovieRecoveryChartRefinementClosure,
  IAutoMovieRecoveryEventRegion,
  IAutoMovieRecoveryEventRegionCells,
  IAutoMovieRecoveryEventRegionPorts,
  IAutoMovieRecoveryEventRegionSource,
  IAutoMovieRecoveryEventRegionTopology,
  IAutoMovieRecoveryFeatureChartCutsSeams,
  IAutoMovieRecoveryFeatureChartCutsSubdivide,
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryObservedMeshTopology,
  IAutoMovieRecoveryFeatureChartPreparation,
  AutoMovieDiagnosticNumber,
  IAutoMovieAffineBoxBound,
} from "@automovie/interface";

import { createRecoveryObservationPolicy as createRecoveryObservationPolicyImplementation } from "./internal/createRecoveryObservationPolicy";
import { encodeRecoveryDiagnosticNumber as encodeRecoveryDiagnosticNumberImplementation } from "./internal/encodeRecoveryDiagnosticNumber";
import { filterRecoveryImageGaussian as filterRecoveryImageGaussianImplementation } from "./internal/filterRecoveryImageGaussian";
import { RecoveryChartReachableBox as RecoveryChartReachableBoxImplementation } from "./internal/RecoveryChartReachableBox";

import { RecoveryAtlasObservationNormals as RecoveryAtlasObservationNormalsImplementation } from "./internal/RecoveryAtlasObservationNormals";
import { RecoveryFeatureChartCutsSeams as RecoveryFeatureChartCutsSeamsImplementation } from "./internal/RecoveryFeatureChartCutsSeams";
import { RecoveryFeatureChartCutsSubdivide as RecoveryFeatureChartCutsSubdivideImplementation } from "./internal/RecoveryFeatureChartCutsSubdivide";
import { RecoveryFeatureChartCutsTopology as RecoveryFeatureChartCutsTopologyImplementation } from "./internal/RecoveryFeatureChartCutsTopology";
import { RecoveryFeatureChartPreparation as RecoveryFeatureChartPreparationImplementation } from "./internal/RecoveryFeatureChartPreparation";

import { RecoveryChartAreaObservations as RecoveryChartAreaObservationsImplementation } from "./internal/RecoveryChartAreaObservations";
import { RecoveryChartAssembly as RecoveryChartAssemblyImplementation } from "./internal/RecoveryChartAssembly";
import { RecoveryChartBoundary as RecoveryChartBoundaryImplementation } from "./internal/RecoveryChartBoundary";
import { RecoveryChartBoundaryNetworkAugment as RecoveryChartBoundaryNetworkAugmentImplementation } from "./internal/RecoveryChartBoundaryNetworkAugment";
import { RecoveryChartBoundaryNetworkBindings as RecoveryChartBoundaryNetworkBindingsImplementation } from "./internal/RecoveryChartBoundaryNetworkBindings";
import { RecoveryChartBoundaryNetworkRegistry as RecoveryChartBoundaryNetworkRegistryImplementation } from "./internal/RecoveryChartBoundaryNetworkRegistry";
import { RecoveryChartBoxSolve as RecoveryChartBoxSolveImplementation } from "./internal/RecoveryChartBoxSolve";
import { RecoveryChartControlRelations as RecoveryChartControlRelationsImplementation } from "./internal/RecoveryChartControlRelations";
import { RecoveryChartFitPrepare as RecoveryChartFitPrepareImplementation } from "./internal/RecoveryChartFitPrepare";
import { RecoveryChartFitReport as RecoveryChartFitReportImplementation } from "./internal/RecoveryChartFitReport";
import { RecoveryFeatureChartCuts as RecoveryFeatureChartCutsImplementation } from "./internal/RecoveryFeatureChartCuts";
import { RecoveryChartFitSolve as RecoveryChartFitSolveImplementation } from "./internal/RecoveryChartFitSolve";
import { RecoveryChartFitSystem as RecoveryChartFitSystemImplementation } from "./internal/RecoveryChartFitSystem";
import { RecoveryChartLeafAssembly as RecoveryChartLeafAssemblyImplementation } from "./internal/RecoveryChartLeafAssembly";
import { RecoveryChartLeafControls as RecoveryChartLeafControlsImplementation } from "./internal/RecoveryChartLeafControls";
import { RecoveryChartLeafFit as RecoveryChartLeafFitImplementation } from "./internal/RecoveryChartLeafFit";
import { RecoveryChartPhysicalJet as RecoveryChartPhysicalJetImplementation } from "./internal/RecoveryChartPhysicalJet";
import { RecoveryChartRefinementClosure as RecoveryChartRefinementClosureImplementation } from "./internal/RecoveryChartRefinementClosure";
import { RecoveryEventRegion as RecoveryEventRegionImplementation } from "./internal/RecoveryEventRegion";
import { RecoveryEventRegionCells as RecoveryEventRegionCellsImplementation } from "./internal/RecoveryEventRegionCells";
import { RecoveryEventRegionPorts as RecoveryEventRegionPortsImplementation } from "./internal/RecoveryEventRegionPorts";
import { RecoveryEventRegionSource as RecoveryEventRegionSourceImplementation } from "./internal/RecoveryEventRegionSource";
import { RecoveryEventRegionTopology as RecoveryEventRegionTopologyImplementation } from "./internal/RecoveryEventRegionTopology";

import { RecoveryAtlasObservationSource as RecoveryAtlasObservationSourceImplementation } from "./internal/RecoveryAtlasObservationSource";
import { RecoveryAtlasObservationCreases as RecoveryAtlasObservationCreasesImplementation } from "./internal/RecoveryAtlasObservationCreases";
import { RecoveryAtlasObservationFeatures as RecoveryAtlasObservationFeaturesImplementation } from "./internal/RecoveryAtlasObservationFeatures";
import { RecoveryAtlasObservationChart as RecoveryAtlasObservationChartImplementation } from "./internal/RecoveryAtlasObservationChart";
import { RecoveryAtlasObservationPublish as RecoveryAtlasObservationPublishImplementation } from "./internal/RecoveryAtlasObservationPublish";
import { RecoveryChartBoundaryNetwork as RecoveryChartBoundaryNetworkImplementation } from "./internal/RecoveryChartBoundaryNetwork";
import { RecoveryAnnularChart as RecoveryAnnularChartImplementation } from "./internal/RecoveryAnnularChart";
import { RecoveryDiskChart as RecoveryDiskChartImplementation } from "./internal/RecoveryDiskChart";
import { RecoveryMultiBoundaryChart as RecoveryMultiBoundaryChartImplementation } from "./internal/RecoveryMultiBoundaryChart";
import { RecoveryChartCollar as RecoveryChartCollarImplementation } from "./internal/RecoveryChartCollar";



import { extractRecoveryImageFeatures as extractImageFeaturesOperation } from "./internal/extractRecoveryImageFeatures";
import { linkRecoveryCameraTracks as linkCameraTracksOperation } from "./internal/linkRecoveryCameraTracks";
import { observeRecoveryCameraSet as observeCameraSetOperation } from "./internal/observeRecoveryCameraSet";
import { estimateRecoveryCameraMap as estimateCameraMapOperation } from "./internal/estimateRecoveryCameraMap";
import { estimateRecoveryCameraPair as estimateCameraPairOperation } from "./internal/estimateRecoveryCameraPair";
import { estimateRecoveryCameraScene as estimateCameraSceneOperation } from "./internal/estimateRecoveryCameraScene";
import { observeRecovery as observeMeshOperation } from "./internal/observeRecovery";
import { observeRecoveryAtlas as observeAtlasOperation } from "./internal/observeRecoveryAtlas";
import { observeRecoveryImages as observeImagesOperation } from "./internal/observeRecoveryImages";
import { observeRecoveryPolyline as observePolylineOperation } from "./internal/observeRecoveryPolyline";
import { observeRecoverySections as observeSectionsOperation } from "./internal/observeRecoverySections";
import { observeRecoverySlabs as observeSlabsOperation } from "./internal/observeRecoverySlabs";
import { prepareRecoveryInput as prepareInputOperation } from "./internal/prepareRecoveryInput";
import { resumeRecoveryContours as resumeContoursOperation } from "./internal/resumeRecoveryContours";
import { transportRecoveryObservationChart as transportChartOperation } from "./internal/transportRecoveryObservationChart";

/** Public camera, mesh, image and contour observation operations. */
export namespace AutoMovieRecoveryObservation {
  /**
   * Detect multiscale Harris features in one admitted resident RGB8 chart.
   * Positions use the original image's pixel-centre coordinates. Orientations
   * are in radians and descriptors are owned normalized 128-bin arrays.
   * Candidate overflow throws. The selected-feature limit is applied before
   * descriptor support checks, so the returned population can be smaller.
   */
  export function extractImageFeatures(
    view: Parameters<IAutoMovieRecoveryImageFeaturesExtractionOperation.Operation>[0],
    policy: Parameters<IAutoMovieRecoveryImageFeaturesExtractionOperation.Operation>[1],
    budget: Parameters<IAutoMovieRecoveryImageFeaturesExtractionOperation.Operation>[2],
  ): ReturnType<IAutoMovieRecoveryImageFeaturesExtractionOperation.Operation> {
    return extractImageFeaturesOperation(view, policy, budget);
  }

  /**
   * Link reciprocal appearance matches into tracks in source view order.
   * Supply precomputed feature populations and paired view matches from the
   * same admitted set. A component with two observations from one view is a
   * conflict. The returned tracks keep original view and feature indices.
   * Exceeding the linked-observation or track ceiling throws.
   */
  export function linkCameraTracks(
    features: Parameters<IAutoMovieRecoveryCameraTracksLinkageOperation.Operation>[0],
    pairs: Parameters<IAutoMovieRecoveryCameraTracksLinkageOperation.Operation>[1],
    budget: Parameters<IAutoMovieRecoveryCameraTracksLinkageOperation.Operation>[2],
  ): ReturnType<IAutoMovieRecoveryCameraTracksLinkageOperation.Operation> {
    return linkCameraTracksOperation(features, pairs, budget);
  }

  /**
   * Extract features from every admitted resident RGB8 view and match every
   * view pair in both directions. A direction with fewer than two targets
   * needs no descriptor comparisons. Check the total directed work before
   * matching. The checkpoint reports completed views and pairs, and a thrown
   * checkpoint aborts the call.
   */
  export function observeCameraSet(
    views: Parameters<IAutoMovieRecoveryCameraSetObservationOperation.Operation>[0],
    policy: Parameters<IAutoMovieRecoveryCameraSetObservationOperation.Operation>[1],
    budget: Parameters<IAutoMovieRecoveryCameraSetObservationOperation.Operation>[2],
    maximumComparisons: Parameters<IAutoMovieRecoveryCameraSetObservationOperation.Operation>[3],
    checkpoint: Parameters<IAutoMovieRecoveryCameraSetObservationOperation.Operation>[4],
  ): ReturnType<IAutoMovieRecoveryCameraSetObservationOperation.Operation> {
    return observeCameraSetOperation(views, policy, budget, maximumComparisons, checkpoint);
  }
  /**
   * Observe three fixed RGB8 views under supplied corrected pinhole
   * calibration. Views zero and one form the seed for the third view. The
   * completed observation returns `partial` with an accepted sparse map, a
   * seed-only map or a refusal. Its coordinates use the first-view
   * unit-baseline gauge. Keep resident bytes unchanged until return.
   * Admission, callback failure and cooperative cancellation return
   * diagnostics without a map.
   */
  export function estimateCameraMap(
    input: IAutoMovieRecoveryCameraMapInput,
    options: Pick<IAutoMovieRecoveryOptions, "cancelled" | "onProgress"> = {},
  ): IAutoMovieRecoveryResult<IAutoMovieRecoveryCameraMapEstimate> {
    return estimateCameraMapOperation(input, options);
  }

  /**
   * Observe two corrected RGB8 images of one fixed scene and qualify their
   * relative pose under the supplied calibration, policy and work limits.
   *
   * A completed observation returns `partial`. Its value carries either an
   * accepted unit-baseline pose or the reasons it was refused. Borrow the
   * resident pixel bytes unchanged until the call returns. Cancellation is
   * cooperative at progress checkpoints. Admission, cancellation and execution
   * failures return diagnostics without an observation.
   */
  export function estimateCameraPair(
    input: IAutoMovieRecoveryCameraPairInput,
    options: Pick<IAutoMovieRecoveryOptions, "cancelled" | "onProgress"> = {},
  ): IAutoMovieRecoveryResult<IAutoMovieRecoveryCameraPairEstimate> {
    return estimateCameraPairOperation(input, options);
  }

  /**
   * Observe one sparse component from an admitted set of fixed RGB8 views with
   * supplied corrected pinhole charts. Views zero and one form the seed. A
   * completed observation returns `partial`; inspect `registeredViews`, null
   * poses and `stopReason` for its coverage. Coordinates use one unit seed
   * baseline. Keep resident bytes unchanged until return. Cancellation is
   * cooperative, and cancellation, admission refusal and callback failure
   * publish diagnostics without a value.
   */
  export function estimateCameraScene(
    input: IAutoMovieRecoveryCameraSceneInput,
    options: Pick<IAutoMovieRecoveryOptions, "cancelled" | "onProgress"> = {},
  ): IAutoMovieRecoveryResult<IAutoMovieRecoveryCameraSceneEstimate> {
    return estimateCameraSceneOperation(input, options);
  }

  /**
   * Observe a registered mesh as cubic sections, incidence and local
   * diagnostics. Omitted curve format uses Bernstein coefficients. Request
   * Hermite to retain the same physical span widths with endpoint derivatives.
   * Supply evaluated geometry in the registered millimetre frame and keep
   * source arrays unchanged until return. Local omissions produce `partial`.
   * Observer failure or cooperative cancellation transfers diagnostics without
   * coefficients.
   */
  export function observeMesh<Format extends AutoMovieRecoveryCurveFormat>(
    input: IAutoMovieRecoveryInput,
    options: IAutoMovieRecoveryObservationOptions<Format>,
  ): IAutoMovieRecoveryResult<AutoMovieRecoveryCurveData<IAutoMovieRecoveryMeshSections, Format>>;
  /**
   * Observe a registered mesh and return Bernstein coefficients. Omit options
   * to use the observation policy supplied with the mesh.
   */
  export function observeMesh(
    input: IAutoMovieRecoveryInput,
    options?: IAutoMovieRecoveryDefaultObservationOptions,
  ): IAutoMovieRecoveryResult<IAutoMovieRecoveryMeshSections>;
  /**
   * Observe a registered mesh with a cubic basis selected at runtime. The
   * result can carry either admitted coefficient format.
   */
  export function observeMesh(
    input: IAutoMovieRecoveryInput,
    options: IAutoMovieRecoveryOptions,
  ): IAutoMovieRecoveryResult<AutoMovieRecoveryCurveData<IAutoMovieRecoveryMeshSections, AutoMovieRecoveryCurveFormat>>;
  /**
   * Observe a registered mesh and delegate basis conversion to the section
   * operation.
   */
  export function observeMesh(
    input: IAutoMovieRecoveryInput,
    options: IAutoMovieRecoveryOptions = {},
  ): IAutoMovieRecoveryResult<unknown> {
    return observeMeshOperation(input, options);
  }

  /**
   * Fit the selected registered source interval domain as private charts with
   * shared physical boundaries. A scalar window selects complete intersecting
   * intervals before the work prefix. Keep source geometry and selection
   * records unchanged throughout the call. The returned coefficients retain
   * source coverage, fitted-chart counts and local omissions. Invalid source
   * admission throws, and chart diagnostics qualify continuity or fit
   * separately.
   */
  export function observeAtlas(
    input: IAutoMovieRecoveryAtlasObservationInput,
    observe?: (record: object) => void,
  ): IAutoMovieRecoveryAtlasObservation {
    return observeAtlasOperation(input, observe);
  }

  /**
   * Measures ordered silhouette supports from resident calibrated RGB8 views.
   *
   * Supply one asserted fixed object, a named metric frame and unique view
   * identities. Each view needs its supplied finite horizontal camera and
   * exactly three bytes per pixel. A byte reference color and a threshold in
   * (0, 255] classify a pixel as foreground when any channel reaches the
   * threshold. Dimensions and all three budget counts are positive safe
   * integers.
   *
   * Complete observations own their rows in millimetres and camera data.
   * Clipped, holed or disconnected foreground, malformed admission, and
   * exhausted budgets return refusals with diagnostics. Cancellation is checked
   * before admission, between scans and before publication. A callback exception
   * returns failure. Measured support is conditional on supplied calibration and
   * segmentation.
   */
  export function observeImages(
    input: IAutoMovieRecoveryImageInput,
    options: IAutoMovieRecoveryOptions = {},
  ): IAutoMovieRecoveryResult<IAutoMovieRecoveryImageObservation> {
    return observeImagesOperation(input, options);
  }

  /**
   * Fit one named, ordered millimetre polyline using its declared corners and
   * closure. Choose Bernstein or Hermite in the required options. Returns
   * `partial` with an admitted fit when sampled tolerance remains unresolved.
   * An empty name refuses; invalid fit inputs and callback exceptions fail.
   * Cancellation is checked before fitting and publication.
   */
  export function observePolyline<Format extends AutoMovieRecoveryCurveFormat>(
    input: IAutoMoviePolylineFitInput,
    options: Pick<IAutoMovieRecoveryObservationOptions<Format>, "curveFormat" | "cancelled" | "onProgress">,
  ): IAutoMovieRecoveryResult<AutoMovieRecoveryCurveData<IAutoMoviePolylineFit, Format>> {
    return observePolylineOperation(input, options);
  }

  /**
   * Cut the requested distinct physical planes through registered millimetre
   * triangles. Results retain requested plane order, the normalized physical
   * frame and curves in the requested basis. Explicit terminal observations
   * can append probe cuts. Optional lineage and slab callbacks receive source
   * evidence. Open contacts, local failures and unsupported terminal or slab
   * evidence produce `partial`. Admission, execution and cancellation failures
   * publish diagnostics without sections.
   */
  export function observeSections<Format extends AutoMovieRecoveryCurveFormat>(
    input: IAutoMovieRecoverySectionsInput,
    options: Pick<IAutoMovieRecoveryObservationOptions<Format>, "curveFormat" | "cancelled" | "onProgress" | "onSourceLineage" | "onSourceSlab">,
  ): IAutoMovieRecoveryResult<AutoMovieRecoveryCurveData<IAutoMovieRecoverySections, Format>> {
    return observeSectionsOperation(input, options);
  }

  /**
   * Observe explicitly requested slabs between saved sections of one
   * registered millimetre source. Supply source and selection identities, a
   * matching physical frame and original section addresses. Saved publication
   * associations bind by exact raw cut ordinal and closure. Unqualified
   * coverage returns `partial`; invalid requests, observer failure or
   * cancellation publish diagnostics without slab results.
   */
  export function observeSlabs(
    input: IAutoMovieRecoverySlabsInput,
    options: Pick<IAutoMovieRecoveryOptions, "cancelled" | "onProgress" | "onSourceSlab"> = {},
  ): IAutoMovieRecoveryResult<IAutoMovieRecoverySlabs> {
    return observeSlabsOperation(input, options);
  }

  /**
   * Borrow an already evaluated triangle mesh with its declared applied
   * registration and observation policy. The complete result refers to the
   * supplied input and geometry arrays. Load, transform and verify the asset
   * before calling.
   */
  export function prepareInput(
    input: IAutoMovieRecoveryRegisteredInput,
  ): IAutoMovieRecoveryResult<IAutoMovieRecoveryPreparedInput> {
    return prepareInputOperation(input);
  }

  /**
   * Refit selected failed raw contours against their saved section addresses,
   * using the original registered millimetre source and explicitly selected
   * patch budgets. Choose the output basis for the new fits. The result
   * preserves external original-artifact references and gives new patch
   * indices only for successful targets. Check `partial` for failed targets or
   * unqualified patch tolerance. Invalid bindings, observer errors and
   * cancellation publish diagnostics without a patch.
   */
  export function resumeContours<Format extends AutoMovieRecoveryCurveFormat>(
    input: IAutoMovieRecoveryContourResumeInput,
    options: Pick<IAutoMovieRecoveryObservationOptions<Format>, "curveFormat" | "cancelled" | "onProgress">,
  ): IAutoMovieRecoveryResult<IAutoMovieRecoveryContourResume<Format>> {
    return resumeContoursOperation(input, options);
  }

  /**
   * Transport the phase of a closed observed contour through at least three
   * uniquely ordered persistent anchors. Supply finite millimetre points,
   * unitless periodic phase and the `ordinary-ordered` relation. Omitted
   * incoming phase uses normalized observed arclength. A conflict or
   * unresolved seam returns diagnostics and leaves the caller's course intact.
   * Malformed chart structure throws.
   */
  export function transportChart(
    previous: IAutoMovieRecoveryObservationChartSeed,
    current: IAutoMovieRecoveryObservationChart,
    relation: string,
  ): IAutoMovieRecoveryObservationTransport {
    return transportChartOperation(previous, current, relation);
  }

  /**
   * Prepare the scalar frame and interval index for an immutable registered
   * millimetre mesh. Omit interval order to use source order. A supplied
   * scalar window selects intersecting saved intervals. Invalid levels, sweep
   * axis or observation and realization budgets throw before chart work.
   */
  export function prepareAtlasObservationSource(input: Parameters<IAutoMovieRecoveryAtlasObservationSource.Operation>[0]): ReturnType<IAutoMovieRecoveryAtlasObservationSource.Operation> {
    return RecoveryAtlasObservationSourceImplementation(input);
  }

  /**
   * Measure original source-edge dihedrals for one admitted observed
   * component. Supply the original oriented face normals and a threshold in
   * degrees. Return each qualifying physical edge with its two original face
   * IDs and angle. The component diagnostic receives unresolved normal
   * arithmetic.
   */
  export function observeAtlasCreases(context: Parameters<IAutoMovieRecoveryAtlasObservationCreases.Operation>[0]): ReturnType<IAutoMovieRecoveryAtlasObservationCreases.Operation> {
    return RecoveryAtlasObservationCreasesImplementation(context);
  }

  /**
   * Register crease-prepared chart pieces against an observed component.
   * Inventory-only mode records candidate counts and leaves fitting pending.
   * Otherwise append each supported piece to the pending chart batch. Preserve
   * the source faces and reasons for unsupported pieces.
   */
  export function observeAtlasFeatures(context: Parameters<IAutoMovieRecoveryAtlasObservationFeatures.Operation>[0]): ReturnType<IAutoMovieRecoveryAtlasObservationFeatures.Operation> {
    return RecoveryAtlasObservationFeaturesImplementation(context);
  }

  /**
   * Prepare the selected ordinary annulus, four-sided source chart or general
   * disk for a later common boundary-network pass. Keep registered millimetre
   * positions, observed boundary identities and triangle lineage available to
   * the batch. An invalid component fails preparation or records its reason
   * for publication.
   */
  export function observeAtlasChart(context: Parameters<IAutoMovieRecoveryAtlasObservationChart.Operation>[0]): ReturnType<IAutoMovieRecoveryAtlasObservationChart.Operation> {
    return RecoveryAtlasObservationChartImplementation(context);
  }

  /**
   * Finish fitting a prepared selected atlas and publish owned coefficient
   * geometry together with coverage and local diagnostics. Pass the atlas
   * computation's pending chart owners and append destinations. The routine
   * transfers fitted charts and records unsupported components before
   * requesting realization.
   */
  export function publishAtlasObservation(context: Parameters<IAutoMovieRecoveryAtlasObservationPublish.Operation>[0]): ReturnType<IAutoMovieRecoveryAtlasObservationPublish.Operation> {
    return RecoveryAtlasObservationPublishImplementation(context);
  }

  /**
   * Reconcile chart sides over declared physical keys and base-edge cut
   * fractions. Return copied chart observations with fitted maximal-arc
   * authority and measured displacement in millimetres. Ambiguous ancestry,
   * collapsed incidence and unrepresentable phase throw. Missing banks remain
   * diagnostic.
   */
  export function reconcileChartBoundaryNetwork(input: Parameters<IAutoMovieRecoveryChartBoundaryNetwork.Operation>[0]): ReturnType<IAutoMovieRecoveryChartBoundaryNetwork.Operation> {
    return RecoveryChartBoundaryNetworkImplementation(input);
  }

  /**
   * Cut one admitted genus-zero annular mesh into a private four-sided disk
   * along existing source edges. Supply two disjoint oriented boundary cycles
   * and their endpoint identities in the millimetre chart. Return the
   * resulting bottom and top cycles and duplicated left and right seam.
   * Invalid incidence, collapsed edges or an intervening boundary contact
   * throw.
   */
  export function prepareAnnularChart(input: Parameters<IAutoMovieRecoveryAnnularChartPreparation.Operation>[0]): ReturnType<IAutoMovieRecoveryAnnularChartPreparation.Operation> {
    return RecoveryAnnularChartImplementation(input);
  }

  /**
   * Divides one oriented triangle disk into four equal-arclength sides.
   *
   * Supply finite coordinates in millimetres, physical vertex keys and the
   * complete oriented boundary. A qualified maximum corner turn anchors
   * the chart, using the physical keys and cyclic order to distinguish ties.
   * Without a qualified corner the least key anchors it. Quarter positions
   * may subdivide their incident boundary faces. The top and left sides
   * reverse their boundary order for increasing chart parameters.
   *
   * The result owns the chart arrays and reports measured perimeter and
   * corner selection. Ambiguous anchors, invalid topology or unrepresentable
   * geometry throw with the disk diagnostic.
   */
  export function prepareDiskChart(input: Parameters<IAutoMovieRecoveryDiskChart.Operation>[0]): ReturnType<IAutoMovieRecoveryDiskChart.Operation> {
    return RecoveryDiskChartImplementation(input);
  }

  /**
   * Prepare a private disk from an orientable genus-zero component with
   * multiple boundaries by choosing cuts between its observed cycles.
   * Positions and measured cut lengths are in millimetres. Preserve source
   * keys across duplicated cut banks. An invalid topology or incomplete safe
   * cut throws through the supplied diagnostic policy.
   */
  export function analyzeMultiBoundaryChart(input: Parameters<IAutoMovieRecoveryMultiBoundaryChart.Operation>[0]): ReturnType<IAutoMovieRecoveryMultiBoundaryChart.Operation> {
    return RecoveryMultiBoundaryChartImplementation(input);
  }

  /**
   * Partition the unit UV square into a rectangular boundary collar and local
   * leaves. Supply side knots in bottom, right, top and left order, increasing
   * along chart u or v. Optional splits address an existing leaf with a global
   * UV position. Invalid coverage, collapsed bounds or exhausted leaf budget
   * throw.
   */
  export function prepareChartCollar(input: Parameters<IAutoMovieRecoveryChartCollar.Operation>[0]): ReturnType<IAutoMovieRecoveryChartCollar.Operation> {
    return RecoveryChartCollarImplementation(input);
  }

  /**
   * Integrate physical-area weighted positions from affine source triangles
   * over a bounded, nonoverlapping unit-chart partition. Supply millimetre
   * positions, UV triangles and tensor knots or explicit leaves. Optional
   * physical-gradient observations carry the supplied exchange length in
   * millimetres. Invalid coverage or unresolved observation limits throw.
   */
  export function collectChartAreaObservations(input: Parameters<IAutoMovieRecoveryChartAreaObservations.Operation>[0]): ReturnType<IAutoMovieRecoveryChartAreaObservations.Operation> {
    return RecoveryChartAreaObservationsImplementation(input);
  }

  /**
   * Iterate the selected chart receipts after the common boundary-network pass.
   *
   * Keep the supplied source arrays and boundary owner valid until the iterator
   * finishes. If the shared network fails, each chart tries its own network.
   * Read the receipt's `type` for network refusal, local fit refusal or a retained
   * fit. A fit's qualification and shared-boundary continuity remain independent.
   */
  export function* assembleChartBatch(
    input: IAutoMovieRecoveryChartBatch.IInput,
  ): Generator<IAutoMovieRecoveryChartBatch.IResult, void, void> {
    yield* assembleChartBatchImplementation(input);
  }

  /**
   * Yield one finite chart position row and, when supplied, its two
   * physical-gradient rows. Pass finite unit-square UV, millimetre targets
   * and finite nonzero tangent operators. A malformed observation or
   * unrepresentable derivative row throws when requested. Earlier valid rows
   * remain available to the caller.
   */
  export function* streamChartFitRows(
    sample: Parameters<IAutoMovieRecoveryChartFitRows.Operation>[0],
  ): ReturnType<IAutoMovieRecoveryChartFitRows.Operation> {
    yield* streamChartFitRowsImplementation(sample);
  }

  /**
   * Assemble fitted chart coefficients through the declared shared boundary
   * registry. A common oriented boundary interval reuses its coefficient IDs,
   * including reversed uses. Records list unmatched spans when neighboring
   * partitions differ. Conflicting values at one declared address throw.
   */
  export function assembleRecoveryChart(charts: Parameters<IAutoMovieRecoveryChartAssembly.Operation>[0]): ReturnType<IAutoMovieRecoveryChartAssembly.Operation> {
    return RecoveryChartAssemblyImplementation(charts);
  }

  /**
   * Create a boundary owner for one fit policy in millimetres. For each
   * declared physical path, return a fitted cubic and its normalized phase
   * registration. Reversed paths share the canonical fit. A conflicting
   * measurement for an existing path throws. Keep the owner alive across all
   * chart requests in the selected network.
   */
  export function createChartBoundary(policy: Parameters<IAutoMovieRecoveryChartBoundary.Operation>[0]): ReturnType<IAutoMovieRecoveryChartBoundary.Operation> {
    return RecoveryChartBoundaryImplementation(policy);
  }

  /**
   * Insert registered base-edge cuts into the copied chart banks. Use registry
   * state from the same boundary selection. Preserve original triangle order
   * where faces are split and return the maximum measured point displacement
   * in millimetres. Invalid ancestry, reversed incidence or a collapsed
   * refined triangle throws.
   */
  export function augmentChartBoundaryNetwork(input: Parameters<IAutoMovieRecoveryChartBoundaryNetworkAugment.Operation>[0], context: Parameters<IAutoMovieRecoveryChartBoundaryNetworkAugment.Operation>[1]): ReturnType<IAutoMovieRecoveryChartBoundaryNetworkAugment.Operation> {
    return RecoveryChartBoundaryNetworkAugmentImplementation(input, context);
  }

  /**
   * Bind the augmented chart sides to fitted maximal physical arcs. Supply the
   * same registered selection used for augmentation. Return each oriented side
   * with piece authority and normalized phase. Ambiguous or collapsed graph
   * segments throw.
   */
  export function bindChartBoundaryNetwork(input: Parameters<IAutoMovieRecoveryChartBoundaryNetworkBindings.Operation>[0], context: Parameters<IAutoMovieRecoveryChartBoundaryNetworkBindings.Operation>[1]): ReturnType<IAutoMovieRecoveryChartBoundaryNetworkBindings.Operation> {
    return RecoveryChartBoundaryNetworkBindingsImplementation(input, context);
  }

  /**
   * Create the registry for one selected boundary network. Borrow its
   * millimetre inputs and copy chart banks for later augmentation.
   * Canonicalize insertion fractions under ordered base-edge identities.
   * Conflicting keys, invalid insertion provenance or ambiguous chart identity
   * throw.
   */
  export function createChartBoundaryNetworkRegistry(input: Parameters<IAutoMovieRecoveryChartBoundaryNetworkRegistry.Operation>[0]): ReturnType<IAutoMovieRecoveryChartBoundaryNetworkRegistry.Operation> {
    return RecoveryChartBoundaryNetworkRegistryImplementation(input);
  }

  /**
   * Minimize a supplied sparse Gram quadratic on three original-coordinate
   * control bounds. Supply an exactly symmetric Gram matrix with nonnegative
   * diagonal, three right-hand-side axes and a positive safe attempt budget.
   * Omitted initial values start at projected zero. When supplied, initial
   * values must already be finite and feasible. Returns the best feasible
   * retained iterate and its projected-gradient measure, including when the
   * attempt cap is exhausted. Malformed data, invalid budgets and a
   * nonrepresentable Gram row norm throw.
   */
  export function solveChartBox(input: Parameters<IAutoMovieRecoveryChartBoxSolve.Operation>[0]): ReturnType<IAutoMovieRecoveryChartBoxSolve.Operation> {
    return RecoveryChartBoxSolveImplementation(input);
  }

  /**
   * Flatten an acyclic set of affine control relations over original control
   * IDs. Fixed coordinates and returned constants use millimetres. Retain
   * signed coefficients, combine duplicate terms and omit exact zero sums.
   * Supply finite fixed positions and weights, valid integer IDs, a positive
   * safe term cap and a nonnegative safe depth cap. Cycles, conflicts, budget
   * exhaustion and nonfinite composition throw.
   */
  export function relateChartControls(input: Parameters<IAutoMovieRecoveryChartControlRelations.Operation>[0]): ReturnType<IAutoMovieRecoveryChartControlRelations.Operation> {
    return RecoveryChartControlRelationsImplementation(input);
  }

  /**
   * Admit one chart enclosure, control registry and weighted observations
   * before building a sparse fit. Positions and enclosure use millimetres. The
   * returned preparation carries the origin and scale that normalize the fit.
   * An unrepresentable box, bad identities or invalid weights throw.
   */
  export function prepareChartFit(input: Parameters<IAutoMovieRecoveryChartFitPrepare.Operation>[0]): ReturnType<IAutoMovieRecoveryChartFitPrepare.Operation> {
    return RecoveryChartFitPrepareImplementation(input);
  }

  /**
   * Measure a solved chart's original weighted errors in millimetres. Report
   * the first strict worst witness, numerical optimality, and the solver's
   * work. Keep the separate physical-gradient contribution visible when
   * present.
   */
  export function createChartFitReport(input: Parameters<IAutoMovieRecoveryChartFitReport.Operation>[0], prepared: Parameters<IAutoMovieRecoveryChartFitReport.Operation>[1], system: Parameters<IAutoMovieRecoveryChartFitReport.Operation>[2], solution: Parameters<IAutoMovieRecoveryChartFitReport.Operation>[3]): ReturnType<IAutoMovieRecoveryChartFitReport.Operation> {
    return RecoveryChartFitReportImplementation(input, prepared, system, solution);
  }

  /**
   * Split an oriented private source mesh along declared feature edges. Use
   * original occurrence IDs for topology and physical keys for equal positions
   * in millimetres. Report cut banks, input face lineage and any measured
   * midpoint displacement bounds. Malformed incidence, topology or collapsed
   * refinement throws.
   */
  export function createFeatureChartCuts(input: Parameters<IAutoMovieRecoveryFeatureChartCuts.Operation>[0]): ReturnType<IAutoMovieRecoveryFeatureChartCuts.Operation> {
    return RecoveryFeatureChartCutsImplementation(input);
  }

  /**
   * Solve the prepared chart's sparse bounded control problem and reconstruct
   * its original millimetre coefficient registry. A warm start, when supplied,
   * must be finite and inside the original enclosure. A nonrepresentable or
   * unqualified reconstruction throws.
   */
  export function solveChartFit(input: Parameters<IAutoMovieRecoveryChartFitSolve.Operation>[0], prepared: Parameters<IAutoMovieRecoveryChartFitSolve.Operation>[1], system: Parameters<IAutoMovieRecoveryChartFitSolve.Operation>[2]): ReturnType<IAutoMovieRecoveryChartFitSolve.Operation> {
    return RecoveryChartFitSolveImplementation(input, prepared, system);
  }

  /**
   * Assemble weighted sparse normal equations from admitted chart
   * correspondence rows. Include optional signed physical-gradient
   * observations in the same declared units. Keep rank results and unsupported
   * information separate from the numerical system. Malformed chart-local rows
   * throw.
   */
  export function createChartFitSystem(input: Parameters<IAutoMovieRecoveryChartFitSystem.Operation>[0], prepared: Parameters<IAutoMovieRecoveryChartFitSystem.Operation>[1]): ReturnType<IAutoMovieRecoveryChartFitSystem.Operation> {
    return RecoveryChartFitSystemImplementation(input, prepared);
  }

  /**
   * Publish a fitted rectangular leaf atlas using declared canonical boundary
   * intervals. Outer edges carry the original fitted boundary span and
   * orientation. Internal master edges keep their fitted coefficient owners.
   * Incompatible declarations or restrictions throw.
   */
  export function assembleChartLeaf(charts: Parameters<IAutoMovieRecoveryChartLeafAssembly.Operation>[0]): ReturnType<IAutoMovieRecoveryChartLeafAssembly.Operation> {
    return RecoveryChartLeafAssemblyImplementation(charts);
  }

  /**
   * Define bicubic control relations for a complete axis-aligned unit-square
   * leaf partition. Shared UV endpoints identify common controls. Fine
   * subdivisions of one master boundary use its restriction. Invalid coverage,
   * nonnested overlaps, inconsistent equations or exceeded control counts
   * throw.
   */
  export function createChartLeafControls(input: Parameters<IAutoMovieRecoveryChartLeafControls.Operation>[0]): ReturnType<IAutoMovieRecoveryChartLeafControls.Operation> {
    return RecoveryChartLeafControlsImplementation(input);
  }

  /**
   * Fit a boundary collar and its bicubic leaf fields to observed
   * piecewise-linear source positions. Supply a chart enclosure and fit, row
   * and refinement budgets. An optional millimetre exchange length adds
   * physical-gradient rows. Attempted refinements retain the previous
   * candidate unless the objective improves without increasing original
   * position RMS.
   */
  export function fitChartLeaf(input: Parameters<IAutoMovieRecoveryChartLeafFit.Operation>[0]): ReturnType<IAutoMovieRecoveryChartLeafFit.Operation> {
    return RecoveryChartLeafFitImplementation(input);
  }

  /**
   * Build two physical tangent observation directions for one affine source
   * triangle and a leaf. Supply millimetre vertices, positive-oriented UV
   * coordinates and a positive leaf. The exchange length converts the
   * derivative targets to millimetres. Unresolved geometry or arithmetic
   * throws.
   */
  export function createChartPhysicalJet(input: Parameters<IAutoMovieRecoveryChartPhysicalJet.Operation>[0]): ReturnType<IAutoMovieRecoveryChartPhysicalJet.Operation> {
    return RecoveryChartPhysicalJetImplementation(input);
  }

  /**
   * Split a unit-square rectangular leaf and propagate opposite interface
   * endpoints until every shared interval is nested or disjoint. Use global UV
   * split positions and stable leaf IDs. Invalid coverage, colliding child IDs
   * or an exceeded leaf budget throw without changing the input.
   */
  export function closeChartRefinement(input: Parameters<IAutoMovieRecoveryChartRefinementClosure.Operation>[0]): ReturnType<IAutoMovieRecoveryChartRefinementClosure.Operation> {
    return RecoveryChartRefinementClosureImplementation(input);
  }

  /**
   * Prepare private scalar-clipped source-cell observations. Keep the supplied
   * source incidence and heights unchanged across queries. Each query supplies
   * the complete original face population intersecting its closed interval in
   * ascending order. Results report unclassified connectivity, boundary and
   * contact evidence.
   */
  export function createEventRegion(source: Parameters<IAutoMovieRecoveryEventRegion.Operation>[0]): ReturnType<IAutoMovieRecoveryEventRegion.Operation> {
    return RecoveryEventRegionImplementation(source);
  }

  /**
   * Clip the supplied ordered original faces against finite closed scalar
   * bounds in one prepared event-region source. Return temporary private cells
   * and their original face and edge associations. Invalid bounds, candidate
   * addresses or lost source-edge support throw.
   */
  export function createEventRegionCells(source: Parameters<IAutoMovieRecoveryEventRegionCells.Operation>[0], prepared: Parameters<IAutoMovieRecoveryEventRegionCells.Operation>[1], query: Parameters<IAutoMovieRecoveryEventRegionCells.Operation>[2]): ReturnType<IAutoMovieRecoveryEventRegionCells.Operation> {
    return RecoveryEventRegionCellsImplementation(source, prepared, query);
  }

  /**
   * Attach observed boundary ports and contacts to a classified private
   * connectivity query. Use the same source, cell and topology records. Return
   * original support and qualification reasons; port metadata alone carries no
   * fitted chart.
   */
  export function createEventRegionPorts(source: Parameters<IAutoMovieRecoveryEventRegionPorts.Operation>[0], prepared: Parameters<IAutoMovieRecoveryEventRegionPorts.Operation>[1], work: Parameters<IAutoMovieRecoveryEventRegionPorts.Operation>[2], topology: Parameters<IAutoMovieRecoveryEventRegionPorts.Operation>[3], query: Parameters<IAutoMovieRecoveryEventRegionPorts.Operation>[4]): ReturnType<IAutoMovieRecoveryEventRegionPorts.Operation> {
    return RecoveryEventRegionPortsImplementation(source, prepared, work, topology, query);
  }

  /**
   * Prepare source incidence, exact duplicate/collapse evidence and scalar
   * ranks for reusable event-region queries. Supply ordered source geometry
   * and aligned finite millimetre heights. Malformed source addresses or
   * inconsistent scalar data throw.
   */
  export function createEventRegionSource(source: Parameters<IAutoMovieRecoveryEventRegionSource.Operation>[0]): ReturnType<IAutoMovieRecoveryEventRegionSource.Operation> {
    return RecoveryEventRegionSourceImplementation(source);
  }

  /**
   * Describe components and boundary incidence in one clipped cell query.
   * Report orientability, vertex links, cycles and local unsupported
   * conditions from the supplied private incidence. Keep topology and later
   * chart qualification separate.
   */
  export function createEventRegionTopology(_source: Parameters<IAutoMovieRecoveryEventRegionTopology.Operation>[0], prepared: Parameters<IAutoMovieRecoveryEventRegionTopology.Operation>[1], work: Parameters<IAutoMovieRecoveryEventRegionTopology.Operation>[2]): ReturnType<IAutoMovieRecoveryEventRegionTopology.Operation> {
    return RecoveryEventRegionTopologyImplementation(_source, prepared, work);
  }

  /**
   * Compute one unnormalized oriented face cross product in original triangle
   * order. Supply indexed source positions in millimetres. Each output vector
   * has square-millimetre components and magnitude twice the face area.
   */
  export function computeAtlasObservationNormals(input: IAutoMovieRecoveryAtlasObservationInput): number[][] {
    return RecoveryAtlasObservationNormalsImplementation(input);
  }

  /**
   * Describe maximal declared feature paths and both coherent cut banks.
   * Supply the prepared original edge, face and occurrence associations.
   * Return source lineage along each path so its reverse bank retains the same
   * physical identity.
   */
  export function extractFeatureChartSeams(context: Parameters<IAutoMovieRecoveryFeatureChartCutsSeams.Operation>[0], fail: Parameters<IAutoMovieRecoveryFeatureChartCutsSeams.Operation>[1], edge: Parameters<IAutoMovieRecoveryFeatureChartCutsSeams.Operation>[2], lex: Parameters<IAutoMovieRecoveryFeatureChartCutsSeams.Operation>[3]): ReturnType<IAutoMovieRecoveryFeatureChartCutsSeams.Operation> {
    return RecoveryFeatureChartCutsSeamsImplementation(context, fail, edge, lex);
  }

  /**
   * Insert conforming midpoint observations along colliding declared feature
   * edges. Positions and displacement bounds use millimetres. Keep source face
   * and physical key lineage across the split. A rounded midpoint that
   * collapses to an endpoint fails through the supplied handler.
   */
  export function subdivideFeatureChartCuts(input: Parameters<IAutoMovieRecoveryFeatureChartCutsSubdivide.Operation>[0], source: Parameters<IAutoMovieRecoveryFeatureChartCutsSubdivide.Operation>[1], features: Parameters<IAutoMovieRecoveryFeatureChartCutsSubdivide.Operation>[2], collisions: Parameters<IAutoMovieRecoveryFeatureChartCutsSubdivide.Operation>[3], physicalPositions: Parameters<IAutoMovieRecoveryFeatureChartCutsSubdivide.Operation>[4], analyze: Parameters<IAutoMovieRecoveryFeatureChartCutsSubdivide.Operation>[5], fail: Parameters<IAutoMovieRecoveryFeatureChartCutsSubdivide.Operation>[6], edge: Parameters<IAutoMovieRecoveryFeatureChartCutsSubdivide.Operation>[7], lex: Parameters<IAutoMovieRecoveryFeatureChartCutsSubdivide.Operation>[8]): ReturnType<IAutoMovieRecoveryFeatureChartCutsSubdivide.Operation> {
    return RecoveryFeatureChartCutsSubdivideImplementation(input, source, features, collisions, physicalPositions, analyze, fail, edge, lex);
  }

  /**
   * Creates a feature-chart topology observer with the supplied edge identity
   * and failure policies.
   *
   * The observer accepts oriented triangles with safe integer addresses in the
   * supplied millimetre positions. It reports measured areas, unit normals,
   * boundary cycles and edge-connected components in source order. Malformed
   * or unrepresentable topology calls the supplied failure handler.
   */
  export function inspectFeatureChartTopology(fail: (reason: string) => never, edge: (a: number, b: number) => string): (
  vertices: readonly Readonly<AutoMovieVector3Tuple>[],
  triangles: readonly (readonly [number, number, number])[],
) => IAutoMovieRecoveryObservedMeshTopology {
    return RecoveryFeatureChartCutsTopologyImplementation(fail, edge);
  }

  /**
   * Prepare private four-sided charts from the declared feature-cut source.
   * Keep original face and physical key ancestry in millimetres. Closed or
   * unqualified components and exhausted chart capacity remain explicit
   * unsupported records.
   */
  export function prepareFeatureChart(input: Parameters<IAutoMovieRecoveryFeatureChartPreparation.Operation>[0]): ReturnType<IAutoMovieRecoveryFeatureChartPreparation.Operation> {
    return RecoveryFeatureChartPreparationImplementation(input);
  }

  /**
   * Project an input onto the declared saved observation policy. Retain
   * explicit values and vector references. An omitted optional critical policy
   * stays absent. Source geometry and extra runtime properties stay with the
   * caller.
   */
  export function createObservationPolicy(input: IAutoMovieRecoveryInput): Omit<IAutoMovieRecoveryInput, "verticesMm" | "triangles"> {
    return createRecoveryObservationPolicyImplementation(input);
  }

  /**
   * Encode computed `NaN`, positive infinity and negative infinity as distinct
   * JSON strings. Preserve finite measurements in their original units and
   * signed zero in memory.
   */
  export function encodeDiagnosticNumber(value: number): AutoMovieDiagnosticNumber {
    return encodeRecoveryDiagnosticNumberImplementation(value);
  }

  /**
   * Filter a borrowed finite row-major grayscale raster with sigma in pixels.
   * Omit derivative to smooth; select `x` or `y` for a first derivative along
   * that pixel axis. Return a new raster of the same dimensions. Supply
   * positive dimensions, matching storage and positive sigma.
   */
  export function filterImageGaussian(source: Float64Array, width: number, height: number, sigma: number, derivative?: "none" | "x" | "y"): Float64Array {
    return filterRecoveryImageGaussianImplementation(source, width, height, sigma, derivative);
  }

  /**
   * Bound the positions reachable by a single affine chart row in millimetres.
   *
   * Repeated control IDs combine in input order using binary64 addition. The
   * resulting coefficients and the common box values define an exact dyadic
   * calculation. Endpoints round outward and `minimumDistanceMm` is approximate.
   * `infeasibleAtTolerance` uses the exact strict comparison for this row, so
   * equality is admitted. Joint feasibility across rows requires a separate fit.
   *
   * @throws If the row has nonfinite values, unordered bounds, invalid control
   * IDs, a nonpositive tolerance, an invalid or exceeded raw-term limit, or an
   * unrepresentable result.
   */
  export function computeReachableChartBox(
    input: IAutoMovieAffineBoxBound.IInput,
  ): IAutoMovieAffineBoxBound.IResult {
    return RecoveryChartReachableBoxImplementation(input);
  }
}
