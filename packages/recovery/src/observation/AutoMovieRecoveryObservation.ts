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

import { type AutoMovieRecoveryCurveData, type AutoMovieRecoveryCurveFormat, type IAutoMovieRecoveryAtlasObservation, type IAutoMovieRecoveryAtlasObservationInput, type IAutoMovieRecoveryCameraMapEstimate, type IAutoMovieRecoveryCameraSetObservationOperation, type IAutoMovieRecoveryImageFeaturesExtractionOperation, type IAutoMovieRecoveryCameraTracksLinkageOperation, type IAutoMovieRecoveryCameraMapInput, type IAutoMovieRecoveryCameraPairEstimate, type IAutoMovieRecoveryCameraPairInput, type IAutoMovieRecoveryCameraSceneEstimate, type IAutoMovieRecoveryCameraSceneInput, type IAutoMovieRecoveryContourResume, type IAutoMovieRecoveryContourResumeInput, type IAutoMovieRecoveryDefaultObservationOptions, type IAutoMovieRecoveryImageInput, type IAutoMovieRecoveryImageObservation, type IAutoMovieRecoveryInput, type IAutoMovieRecoveryMeshSections, type IAutoMovieRecoveryObservationChart, type IAutoMovieRecoveryObservationChartSeed, type IAutoMovieRecoveryObservationOptions, type IAutoMovieRecoveryObservationTransport, type IAutoMovieRecoveryOptions, type IAutoMovieRecoveryPreparedInput, type IAutoMovieRecoveryRegisteredInput, type IAutoMovieRecoveryResult, type IAutoMovieRecoverySections, type IAutoMovieRecoverySectionsInput, type IAutoMovieRecoverySlabs, type IAutoMovieRecoverySlabsInput, type IAutoMoviePolylineFit, type IAutoMoviePolylineFitInput, type IAutoMovieRecoveryAtlasObservationSource, type IAutoMovieRecoveryAtlasObservationCreases, type IAutoMovieRecoveryAtlasObservationFeatures, type IAutoMovieRecoveryAtlasObservationChart, type IAutoMovieRecoveryAtlasObservationPublish, type IAutoMovieRecoveryChartBoundaryNetwork, type IAutoMovieRecoveryAnnularChartPreparation, type IAutoMovieRecoveryDiskChart, type IAutoMovieRecoveryMultiBoundaryChart, type IAutoMovieRecoveryChartCollar, type IAutoMovieRecoveryChartAreaObservations, type IAutoMovieRecoveryChartAssembly, type IAutoMovieRecoveryChartBoundary, type IAutoMovieRecoveryChartBoundaryNetworkAugment, type IAutoMovieRecoveryChartBoundaryNetworkBindings, type IAutoMovieRecoveryChartBoundaryNetworkRegistry, type IAutoMovieRecoveryChartBoxSolve, type IAutoMovieRecoveryChartControlRelations, type IAutoMovieRecoveryChartFitPrepare, type IAutoMovieRecoveryChartFitReport, type IAutoMovieRecoveryFeatureChartCuts, type IAutoMovieRecoveryChartFitSolve, type IAutoMovieRecoveryChartFitSystem, type IAutoMovieRecoveryChartLeafAssembly, type IAutoMovieRecoveryChartLeafControls, type IAutoMovieRecoveryChartLeafFit, type IAutoMovieRecoveryChartPhysicalJet, type IAutoMovieRecoveryChartRefinementClosure, type IAutoMovieRecoveryEventRegion, type IAutoMovieRecoveryEventRegionCells, type IAutoMovieRecoveryEventRegionPorts, type IAutoMovieRecoveryEventRegionSource, type IAutoMovieRecoveryEventRegionTopology, type IAutoMovieRecoveryFeatureChartCutsSeams, type IAutoMovieRecoveryFeatureChartCutsSubdivide, type AutoMovieVector3Tuple, type IAutoMovieRecoveryObservedMeshTopology, type IAutoMovieRecoveryFeatureChartPreparation, type AutoMovieDiagnosticNumber, type IAutoMovieAffineBoxBound } from "@automovie/interface";

import { extractRecoveryImageFeatures as extractImageFeaturesOperation } from "./internal/extractRecoveryImageFeatures";
import { linkRecoveryCameraTracks as linkCameraTracksOperation } from "./internal/linkRecoveryCameraTracks";
import { observeRecoveryCameraSet as observeCameraSetOperation } from "./internal/observeRecoveryCameraSet";
import { estimateAutoMovieRecoveryCameraMap as estimateCameraMapOperation } from "./internal/estimateAutoMovieRecoveryCameraMap";
import { estimateAutoMovieRecoveryCameraPair as estimateCameraPairOperation } from "./internal/estimateAutoMovieRecoveryCameraPair";
import { estimateAutoMovieRecoveryCameraScene as estimateCameraSceneOperation } from "./internal/estimateAutoMovieRecoveryCameraScene";
import { observeAutoMovieRecovery as observeMeshOperation } from "./internal/observeAutoMovieRecovery";
import { observeAutoMovieRecoveryAtlas as observeAtlasOperation } from "./internal/observeAutoMovieRecoveryAtlas";
import { observeAutoMovieRecoveryImages as observeImagesOperation } from "./internal/observeAutoMovieRecoveryImages";
import { observeAutoMovieRecoveryPolyline as observePolylineOperation } from "./internal/observeAutoMovieRecoveryPolyline";
import { observeAutoMovieRecoverySections as observeSectionsOperation } from "./internal/observeAutoMovieRecoverySections";
import { observeAutoMovieRecoverySlabs as observeSlabsOperation } from "./internal/observeAutoMovieRecoverySlabs";
import { prepareAutoMovieRecoveryInput as prepareInputOperation } from "./internal/prepareAutoMovieRecoveryInput";
import { resumeAutoMovieRecoveryContours as resumeContoursOperation } from "./internal/resumeAutoMovieRecoveryContours";
import { transportAutoMovieRecoveryObservationChart as transportChartOperation } from "./internal/transportAutoMovieRecoveryObservationChart";

/** Public camera, mesh, image and contour observation operations. */
export namespace AutoMovieRecoveryObservation {
  /** Extract bounded image features under the supplied policy and budget. */
  export function extractImageFeatures(
    view: Parameters<IAutoMovieRecoveryImageFeaturesExtractionOperation.Operation>[0],
    policy: Parameters<IAutoMovieRecoveryImageFeaturesExtractionOperation.Operation>[1],
    budget: Parameters<IAutoMovieRecoveryImageFeaturesExtractionOperation.Operation>[2],
  ): ReturnType<IAutoMovieRecoveryImageFeaturesExtractionOperation.Operation> {
    return extractImageFeaturesOperation(view, policy, budget);
  }

  /** Link reciprocal image-feature matches, withholding conflicting components. */
  export function linkCameraTracks(
    features: Parameters<IAutoMovieRecoveryCameraTracksLinkageOperation.Operation>[0],
    pairs: Parameters<IAutoMovieRecoveryCameraTracksLinkageOperation.Operation>[1],
    budget: Parameters<IAutoMovieRecoveryCameraTracksLinkageOperation.Operation>[2],
  ): ReturnType<IAutoMovieRecoveryCameraTracksLinkageOperation.Operation> {
    return linkCameraTracksOperation(features, pairs, budget);
  }

  /** Observe the supplied camera set and match every admitted image pair. */
  export function observeCameraSet(
    views: Parameters<IAutoMovieRecoveryCameraSetObservationOperation.Operation>[0],
    policy: Parameters<IAutoMovieRecoveryCameraSetObservationOperation.Operation>[1],
    budget: Parameters<IAutoMovieRecoveryCameraSetObservationOperation.Operation>[2],
    maximumComparisons: Parameters<IAutoMovieRecoveryCameraSetObservationOperation.Operation>[3],
    checkpoint: Parameters<IAutoMovieRecoveryCameraSetObservationOperation.Operation>[4],
  ): ReturnType<IAutoMovieRecoveryCameraSetObservationOperation.Operation> {
    return observeCameraSetOperation(views, policy, budget, maximumComparisons, checkpoint);
  }
  /** Estimate a sparse calibrated triad from three fixed image views. */
  export function estimateCameraMap(
    input: IAutoMovieRecoveryCameraMapInput,
    options: Pick<IAutoMovieRecoveryOptions, "cancelled" | "onProgress"> = {},
  ): IAutoMovieRecoveryResult<IAutoMovieRecoveryCameraMapEstimate> {
    return estimateCameraMapOperation(input, options);
  }

  /** Estimate a calibrated relative pose from a fixed image pair. */
  export function estimateCameraPair(
    input: IAutoMovieRecoveryCameraPairInput,
    options: Pick<IAutoMovieRecoveryOptions, "cancelled" | "onProgress"> = {},
  ): IAutoMovieRecoveryResult<IAutoMovieRecoveryCameraPairEstimate> {
    return estimateCameraPairOperation(input, options);
  }

  /** Estimate one bounded sparse component from fixed calibrated images. */
  export function estimateCameraScene(
    input: IAutoMovieRecoveryCameraSceneInput,
    options: Pick<IAutoMovieRecoveryOptions, "cancelled" | "onProgress"> = {},
  ): IAutoMovieRecoveryResult<IAutoMovieRecoveryCameraSceneEstimate> {
    return estimateCameraSceneOperation(input, options);
  }

  /** Observe a registered mesh, preserving the input and selected curve basis. */
  export function observeMesh<Format extends AutoMovieRecoveryCurveFormat>(
    input: IAutoMovieRecoveryInput,
    options: IAutoMovieRecoveryObservationOptions<Format>,
  ): IAutoMovieRecoveryResult<AutoMovieRecoveryCurveData<IAutoMovieRecoveryMeshSections, Format>>;
  /** Observe a mesh with the default curve representation. */
  export function observeMesh(
    input: IAutoMovieRecoveryInput,
    options?: IAutoMovieRecoveryDefaultObservationOptions,
  ): IAutoMovieRecoveryResult<IAutoMovieRecoveryMeshSections>;
  /** Observe a mesh with a curve representation selected at runtime. */
  export function observeMesh(
    input: IAutoMovieRecoveryInput,
    options: IAutoMovieRecoveryOptions,
  ): IAutoMovieRecoveryResult<AutoMovieRecoveryCurveData<IAutoMovieRecoveryMeshSections, AutoMovieRecoveryCurveFormat>>;
  /** Dispatch mesh observation with the admitted curve options. */
  export function observeMesh(
    input: IAutoMovieRecoveryInput,
    options: IAutoMovieRecoveryOptions = {},
  ): IAutoMovieRecoveryResult<unknown> {
    return observeMeshOperation(input, options);
  }

  /** Observe an atlas from registered source geometry and explicit source policy. */
  export function observeAtlas(
    input: IAutoMovieRecoveryAtlasObservationInput,
    observe?: (record: object) => void,
  ): IAutoMovieRecoveryAtlasObservation {
    return observeAtlasOperation(input, observe);
  }

  /** Measure fixed-background supports from supplied RGB views. */
  export function observeImages(
    input: IAutoMovieRecoveryImageInput,
    options: IAutoMovieRecoveryOptions = {},
  ): IAutoMovieRecoveryResult<IAutoMovieRecoveryImageObservation> {
    return observeImagesOperation(input, options);
  }

  /** Fit one caller-ordered physical polyline under the requested curve basis. */
  export function observePolyline<Format extends AutoMovieRecoveryCurveFormat>(
    input: IAutoMoviePolylineFitInput,
    options: Pick<IAutoMovieRecoveryObservationOptions<Format>, "curveFormat" | "cancelled" | "onProgress">,
  ): IAutoMovieRecoveryResult<AutoMovieRecoveryCurveData<IAutoMoviePolylineFit, Format>> {
    return observePolylineOperation(input, options);
  }

  /** Observe caller-defined source planes in their original request order. */
  export function observeSections<Format extends AutoMovieRecoveryCurveFormat>(
    input: IAutoMovieRecoverySectionsInput,
    options: Pick<IAutoMovieRecoveryObservationOptions<Format>, "curveFormat" | "cancelled" | "onProgress" | "onSourceLineage" | "onSourceSlab">,
  ): IAutoMovieRecoveryResult<AutoMovieRecoveryCurveData<IAutoMovieRecoverySections, Format>> {
    return observeSectionsOperation(input, options);
  }

  /** Observe exact saved source slabs and bind raw section cuts. */
  export function observeSlabs(
    input: IAutoMovieRecoverySlabsInput,
    options: Pick<IAutoMovieRecoveryOptions, "cancelled" | "onProgress" | "onSourceSlab"> = {},
  ): IAutoMovieRecoveryResult<IAutoMovieRecoverySlabs> {
    return observeSlabsOperation(input, options);
  }

  /** Prepare already evaluated registered triangle data for observation. */
  export function prepareInput(
    input: IAutoMovieRecoveryRegisteredInput,
  ): IAutoMovieRecoveryResult<IAutoMovieRecoveryPreparedInput> {
    return prepareInputOperation(input);
  }

  /** Resume only explicitly failed and rebound raw source contours. */
  export function resumeContours<Format extends AutoMovieRecoveryCurveFormat>(
    input: IAutoMovieRecoveryContourResumeInput,
    options: Pick<IAutoMovieRecoveryObservationOptions<Format>, "curveFormat" | "cancelled" | "onProgress">,
  ): IAutoMovieRecoveryResult<IAutoMovieRecoveryContourResume<Format>> {
    return resumeContoursOperation(input, options);
  }

  /** Transport a closed observation chart through ordered persistent anchors. */
  export function transportChart(
    previous: IAutoMovieRecoveryObservationChartSeed,
    current: IAutoMovieRecoveryObservationChart,
    relation: string,
  ): IAutoMovieRecoveryObservationTransport {
    return transportChartOperation(previous, current, relation);
  }

  /** Admit the immutable source and prepare the selected scalar interval index. */
  export function prepareAtlasObservationSource(input: Parameters<IAutoMovieRecoveryAtlasObservationSource.Operation>[0]): ReturnType<IAutoMovieRecoveryAtlasObservationSource.Operation> {
    return RecoveryAtlasObservationSourceImplementation(input);
  }

  /**
   * Observe original component crease edges with the existing oriented source
   * normals.
   */
  export function observeAtlasCreases(context: Parameters<IAutoMovieRecoveryAtlasObservationCreases.Operation>[0]): ReturnType<IAutoMovieRecoveryAtlasObservationCreases.Operation> {
    return RecoveryAtlasObservationCreasesImplementation(context);
  }

  /** Register feature-prepared charts and their original shared outcome records. */
  export function observeAtlasFeatures(context: Parameters<IAutoMovieRecoveryAtlasObservationFeatures.Operation>[0]): ReturnType<IAutoMovieRecoveryAtlasObservationFeatures.Operation> {
    return RecoveryAtlasObservationFeaturesImplementation(context);
  }

  /**
   * Prepare an annular, natural-side or general disk chart without changing its
   * declared correspondence.
   */
  export function observeAtlasChart(context: Parameters<IAutoMovieRecoveryAtlasObservationChart.Operation>[0]): ReturnType<IAutoMovieRecoveryAtlasObservationChart.Operation> {
    return RecoveryAtlasObservationChartImplementation(context);
  }

  /**
   * Fit the completely registered selected domain and publish its canonical
   * assembly and coverage.
   */
  export function publishAtlasObservation(context: Parameters<IAutoMovieRecoveryAtlasObservationPublish.Operation>[0]): ReturnType<IAutoMovieRecoveryAtlasObservationPublish.Operation> {
    return RecoveryAtlasObservationPublishImplementation(context);
  }

  /**
   * Reconcile private quarter cuts before fitting shared maximal boundary arcs.
   * Physical keys, base-edge ancestry and exact numeric fractions declare
   * sharing; equal positions alone never identify a bank. Inputs remain
   * immutable. Missing base-edge banks are diagnosed without fabricated
   * connections. Ambiguous keys, collapsed observations, invalid incidence or
   * nonrepresentable phases throw. Canonical insertions can change existing
   * binary64 points slightly; diagnostics retain maximum point displacement and
   * actual per-chart source-area changes. This is observation subdivision, not
   * engine geometry or a PL equality proof.
   *
   * Original quarter corners, graph branches and changes of incident chart sets
   * split the physical boundary graph into open arcs. Closed and junction-return
   * chains receive stable-key anchors at existing observations, preserving every
   * edge and introducing no point or shortcut. Each canonical arc invokes
   * owner.get once; reversed banks reuse its coefficients and registration. A
   * side composite concatenates these arcs under physical-polyline-length
   * proportions. Its synthetic identity serves mapping only; assembly must use
   * pieces authority. Source words, triangles and original normals remain private
   * to this operation.
   */
  export function reconcileChartBoundaryNetwork(input: Parameters<IAutoMovieRecoveryChartBoundaryNetwork.Operation>[0]): ReturnType<IAutoMovieRecoveryChartBoundaryNetwork.Operation> {
    return RecoveryChartBoundaryNetworkImplementation(input);
  }

  /**
   * Cut a private oriented annular triangle chart along an observed edge path.
   * Two coherent boundary cycles become bottom/top and the duplicated seam
   * becomes left/right. Original positions and faces stay private observations
   * for fitting. The caller establishes genus zero and exactly two boundary
   * cycles beforehand. A seam touching another boundary vertex is refused rather
   * than changing topology.
   */
  export function prepareAnnularChart(input: Parameters<IAutoMovieRecoveryAnnularChartPreparation.Operation>[0]): ReturnType<IAutoMovieRecoveryAnnularChartPreparation.Operation> {
    return RecoveryAnnularChartImplementation(input);
  }

  /**
   * Divide one coherent private triangle disk into four physical-arclength sides.
   * A maximum boundary turn meeting cornerDegrees anchors the chart, with stable
   * physical-key ties followed by the complete coherent cyclic key-word context;
   * indistinguishable contexts fail. Without a feature the smallest key anchors
   * it. Repeated physical keys require exactly equal coordinates; private
   * occurrences retain distinct ordinals, including paired cut edges and their
   * observations. Quarter observations subdivide only the unique incident
   * boundary triangles. Coordinates remain millimetres in the input frame, and
   * input arrays are immutable. Sides are bottom/right/top/left, with top and
   * left reversed for increasing UV. Invalid incidence, links, orientation or
   * unrepresentable subdivision throws an explicit unsupported error. PL geometry
   * is preserved in real arithmetic; binary64 interpolation and global source
   * embedding are not certified. Keys, triangles and corner diagnostics remain
   * private fitting observations. Partial boundary-arc authority and all
   * field/consumer publication belong elsewhere.
   */
  export function prepareDiskChart(input: Parameters<IAutoMovieRecoveryDiskChart.Operation>[0]): ReturnType<IAutoMovieRecoveryDiskChart.Operation> {
    return RecoveryDiskChartImplementation(input);
  }

  /**
   * Open one coherent genus-zero private observation mesh into a triangle disk.
   * Complete oriented boundary cycles have no repeated final vertex. The longest
   * measured perimeter is the root, with stable-key ties; repeated multi-source
   * Dijkstra joins the nearest remaining boundary through interior edges only.
   * Removing those edges from incident-face links duplicates disconnected fans.
   * Input source keys are unique. Coordinates stay in input millimetres and
   * duplicated fans share source keys, while their private vertex ordinals
   * differ. The output boundary starts at its smallest source-key and
   * incident-face pair. All input arrays stay immutable. The result retains every
   * affine source triangle exactly, solely for subsequent curve/field fitting. It
   * is not a source-free reconstruction or a publication. Nonmanifold,
   * disconnected, positive-genus, incomplete-boundary and arithmetic cases fail
   * explicitly. No embedding, surface fit, or shared-arc C0 is certified.
   */
  export function analyzeMultiBoundaryChart(input: Parameters<IAutoMovieRecoveryMultiBoundaryChart.Operation>[0]): ReturnType<IAutoMovieRecoveryMultiBoundaryChart.Operation> {
    return RecoveryMultiBoundaryChartImplementation(input);
  }

  /**
   * Partition one unit UV square into an affine boundary collar and local leaves.
   * Side knots are bottom, right, top and left, increasing in chart u or v. Every
   * outer leaf edge lies within one supplied side interval. The initial partition
   * has at most the four side span counts plus five leaves. This bound does not
   * cover later splits, fitted controls or generated vertices.
   *
   * Roots are center, corner.bottom-left, corner.bottom-right, corner.top-left,
   * corner.top-right, or bottom/right/top/left followed by their interval
   * ordinal. A split replaces its leaf by .0 and .1 children in increasing axis
   * order; parameter is a global UV coordinate, not a relative child parameter.
   * Bounds are [u0,u1,v0,v1]. Thin positive spans remain present; their physical
   * conditioning and quadrature representability belong to the consumer. Invalid
   * input or an unrepresentable or over-budget partition throws without mutating
   * input. No source, boundary authority or physical curve is inferred.
   */
  export function prepareChartCollar(input: Parameters<IAutoMovieRecoveryChartCollar.Operation>[0]): ReturnType<IAutoMovieRecoveryChartCollar.Operation> {
    return RecoveryChartCollarImplementation(input);
  }

  /**
   * Integrate private piecewise-affine source observations inside axis-aligned
   * leaves. Positive UV triangles are clipped at the tensor knots before a
   * seven-by-seven Gauss rule on a Duffy triangle supplies physical-area weighted
   * correspondences. An optional rectangular leaf partition replaces the tensor
   * product; its open interiors must cover the unit square once. Every local map
   * remains affine. For a bicubic field minus an affine source this integrates
   * its squared residual exactly in real arithmetic. Binary64 arithmetic and
   * continuous maximum error remain separate qualifications. No private source
   * triangle leaves this operation. Optional physical-gradient frames are
   * computed once per source-triangle/leaf intersection by thin QR. The same
   * samples then stream two derivative rows; their squared polynomial degree is
   * at most ten, within the same Gauss rule.
   */
  export function collectChartAreaObservations(input: Parameters<IAutoMovieRecoveryChartAreaObservations.Operation>[0]): ReturnType<IAutoMovieRecoveryChartAreaObservations.Operation> {
    return RecoveryChartAreaObservationsImplementation(input);
  }

  /**
   * Assemble fitted chart fields using one canonical boundary coefficient
   * registry. Equal declared boundary intervals share four exact coefficient IDs,
   * including reversal; coincident independent sheets retain distinct IDs.
   * Different edge partitions retain common analytic curves but report unmatched
   * tessellation spans. Physical transverse jets and coarse/fine edge-sample
   * conformity are separate work. Stored oriented knots map directly to their
   * canonical counterparts without a subtraction round trip. Each canonical
   * endpoint has one evaluation owner; its binary64 restriction difference is
   * measured against the fitted field below.
   */
  export function assembleRecoveryChart(charts: Parameters<IAutoMovieRecoveryChartAssembly.Operation>[0]): ReturnType<IAutoMovieRecoveryChartAssembly.Operation> {
    return RecoveryChartAssemblyImplementation(charts);
  }

  /**
   * Own one fitted curve and accepted pointwise phase chart per private boundary
   * path. Private incidence words identify equality, including reversed order;
   * equal positions on different words never weld. Public boundary IDs are new
   * sequential identities. Each returned orientation uses the same canonical
   * coefficients and registration. Partial path overlaps remain distinct and
   * require a separate segmentation authority.
   */
  export function createChartBoundary(policy: Parameters<IAutoMovieRecoveryChartBoundary.Operation>[0]): ReturnType<IAutoMovieRecoveryChartBoundary.Operation> {
    return RecoveryChartBoundaryImplementation(policy);
  }

  /**
   * Augment copied chart banks with their registered physical cuts in original
   * triangle order.
   */
  export function augmentChartBoundaryNetwork(input: Parameters<IAutoMovieRecoveryChartBoundaryNetworkAugment.Operation>[0], context: Parameters<IAutoMovieRecoveryChartBoundaryNetworkAugment.Operation>[1]): ReturnType<IAutoMovieRecoveryChartBoundaryNetworkAugment.Operation> {
    return RecoveryChartBoundaryNetworkAugmentImplementation(input, context);
  }

  /** Bind maximal physical arcs to all copied chart sides after augmentation. */
  export function bindChartBoundaryNetwork(input: Parameters<IAutoMovieRecoveryChartBoundaryNetworkBindings.Operation>[0], context: Parameters<IAutoMovieRecoveryChartBoundaryNetworkBindings.Operation>[1]): ReturnType<IAutoMovieRecoveryChartBoundaryNetworkBindings.Operation> {
    return RecoveryChartBoundaryNetworkBindingsImplementation(input, context);
  }

  /**
   * Register immutable boundary ancestry and copied chart observations before
   * augmentation.
   */
  export function createChartBoundaryNetworkRegistry(input: Parameters<IAutoMovieRecoveryChartBoundaryNetworkRegistry.Operation>[0]): ReturnType<IAutoMovieRecoveryChartBoundaryNetworkRegistry.Operation> {
    return RecoveryChartBoundaryNetworkRegistryImplementation(input);
  }

  /**
   * Minimize sum_axis(0.5*x' H x - rhs' x) on the supplied original control box.
   * H is an exactly symmetric sparse positive-semidefinite Gram matrix supplied
   * by the caller. This helper validates finite entries, distinct sparse
   * addresses, reciprocal symmetry and nonnegative diagonals; it does not certify
   * PSD or rank. An exactly zero diagonal requires an exactly zero row and three
   * zero RHS entries. Such an unseen coordinate uses scale one and retains its
   * feasible initial value.
   *
   * Dii=1/sqrt(Hii), x=Dy, Hs=DHD and bs=Db give the same real-arithmetic
   * objective and box after scaling. FISTA projects in y, with objective-based
   * momentum restarts. Numeric scaling is binary64; failed finite/feasible
   * transformations throw rather than adding a regularizer or perturbing H.
   * Active bounds retain original endpoints. Termination uses the original
   * infinity norm of G_L(x)=L*(x-proj(x-gradient/L)). An equivalent component
   * formula avoids cancellation of two nearly equal x values. The best finite
   * feasible original objective is returned, with its own gradient metric;
   * exhausting the attempt budget is not convergence. Iterations counts all
   * projected proposals, including rejected momentum attempts. Empty systems
   * return empty. The attempt budget is a positive safe integer and gradient
   * tolerance is finite and nonnegative. Reported gradients/objectives are
   * binary64 evaluations, not exact KKT, uniqueness, eigenvalue or geometric
   * accuracy certificates. Optional initialValues are copied original normalized
   * coordinates, interleaved by three axes per control. They must be finite and
   * feasible without clipping; omission starts at projected zero.
   * initialObjective records their original Q, and every invocation starts with
   * fresh momentum and retains that feasible best.
   */
  export function solveChartBox(input: Parameters<IAutoMovieRecoveryChartBoxSolve.Operation>[0]): ReturnType<IAutoMovieRecoveryChartBoxSolve.Operation> {
    return RecoveryChartBoxSolveImplementation(input);
  }

  /**
   * Eliminate acyclic affine control relations without changing their
   * coefficients. Original control IDs remain the independent term addresses;
   * they are never replaced by compact solver slots. Fixed positions and returned
   * constants are millimetres. Relations may have signed weights or sums other
   * than one. Equal terms combine, exact zero sums disappear, and fixed terms
   * fold into the constant. No epsilon deletion, weight normalization or
   * convexity repair occurs.
   *
   * MaxTerms bounds each intermediate flattened provenance map, including fixed
   * sources, and every final independent expression. maxDepth counts relation
   * edges; fixed and independent controls have depth zero. Cycles are rejected
   * even when a declared dependency has zero weight or later cancels. Weight
   * diagnostics describe flattened fixed and independent source weights before
   * fixed-position folding. They do not certify a dependent enclosure. Invalid
   * identities, conflicts, budget exhaustion or nonfinite arithmetic throw
   * without mutating input or returning a partial relation system.
   */
  export function relateChartControls(input: Parameters<IAutoMovieRecoveryChartControlRelations.Operation>[0]): ReturnType<IAutoMovieRecoveryChartControlRelations.Operation> {
    return RecoveryChartControlRelationsImplementation(input);
  }

  /** Admit and normalize one chart before sparse observation assembly. */
  export function prepareChartFit(input: Parameters<IAutoMovieRecoveryChartFitPrepare.Operation>[0]): ReturnType<IAutoMovieRecoveryChartFitPrepare.Operation> {
    return RecoveryChartFitPrepareImplementation(input);
  }

  /**
   * Measure residuals, the first strict worst witness and optimality from the
   * solved chart.
   */
  export function createChartFitReport(input: Parameters<IAutoMovieRecoveryChartFitReport.Operation>[0], prepared: Parameters<IAutoMovieRecoveryChartFitReport.Operation>[1], system: Parameters<IAutoMovieRecoveryChartFitReport.Operation>[2], solution: Parameters<IAutoMovieRecoveryChartFitReport.Operation>[3]): ReturnType<IAutoMovieRecoveryChartFitReport.Operation> {
    return RecoveryChartFitReportImplementation(input, prepared, system, solution);
  }

  /**
   * Materialize declared feature cuts as private manifold observation charts.
   * Ordinals and unique occurrence keys own topology; repeated physical keys must
   * name exactly equal millimetre coordinates. Source-face pairs admit features,
   * independently of a supplied angle's classification, which belongs to the
   * caller. Incident-face fans are split across every feature. A cut whose banks
   * otherwise share both endpoint ordinals first receives one conforming midpoint
   * observation. Ideal midpoint subdivision preserves PL geometry in real
   * arithmetic; diagnostics separately report upward coordinate-rounding bounds
   * and measured area changes. observationDisplacementUpperMm is the largest
   * midpoint displacement bound only; later quarter/chord subdivision and fitting
   * errors require separate accounting. Positive areas, coherent winding, links
   * and actual cut-bank incidence are checked. Outputs can be disks, annuli,
   * slits or closed surfaces; no UV map is certified. Both banks follow
   * physicalPath; their coherent boundary directions are opposite. Chains stop at
   * physical boundaries as well as feature junctions; isolated interior
   * degree-two cycles repeat their first path vertex. Source topology, physical
   * words, midpoint witnesses and all outputs stay private to observation. Public
   * fitted curves, compactness, boundary authority and normals belong elsewhere.
   */
  export function createFeatureChartCuts(input: Parameters<IAutoMovieRecoveryFeatureChartCuts.Operation>[0]): ReturnType<IAutoMovieRecoveryFeatureChartCuts.Operation> {
    return RecoveryFeatureChartCutsImplementation(input);
  }

  /**
   * Solve the normalized box problem and reconstruct the original coefficient
   * registry.
   */
  export function solveChartFit(input: Parameters<IAutoMovieRecoveryChartFitSolve.Operation>[0], prepared: Parameters<IAutoMovieRecoveryChartFitSolve.Operation>[1], system: Parameters<IAutoMovieRecoveryChartFitSolve.Operation>[2]): ReturnType<IAutoMovieRecoveryChartFitSolve.Operation> {
    return RecoveryChartFitSolveImplementation(input, prepared, system);
  }

  /** Assemble the same sparse weighted system and its bounded rank diagnostics. */
  export function createChartFitSystem(input: Parameters<IAutoMovieRecoveryChartFitSystem.Operation>[0], prepared: Parameters<IAutoMovieRecoveryChartFitSystem.Operation>[1]): ReturnType<IAutoMovieRecoveryChartFitSystem.Operation> {
    return RecoveryChartFitSystemImplementation(input, prepared);
  }

  /**
   * Publish source-free canonical intervals for a fitted rectangular leaf atlas.
   * Internal master edges retain their fitted coefficient owners. Outer edges use
   * the original shared fitted boundary span and oriented restriction metadata.
   * Each chart owns a separate analytic normal fan; positional sharing never
   * averages the transverse derivatives of a crease or claims G1 continuity.
   */
  export function assembleChartLeaf(charts: Parameters<IAutoMovieRecoveryChartLeafAssembly.Operation>[0]): ReturnType<IAutoMovieRecoveryChartLeafAssembly.Operation> {
    return RecoveryChartLeafAssemblyImplementation(charts);
  }

  /**
   * Couple a complete axis-aligned unit-square leaf partition with C0 bicubics.
   * axis 0 edges increase in u; axis 1 edges increase in v. Patch sides are
   * bottom, right, top, left and all side parameters increase. Equal UV scalar
   * endpoint identities share one control; this is parameter identity, not a
   * physical coordinate weld. Each maximal containing interval owns one cubic.
   * Nested fine intervals use de Casteljau restriction expressions in that cubic.
   * Disjoint intervals, including those meeting only at endpoints, keep their own
   * cubic handles. Every patch retains four independent interior controls.
   *
   * Atomic intervals verify one exterior incident and two opposed interior uses.
   * Missing exterior coverage, nonnested overlaps, inconsistent corner equations,
   * cycles, nonfinite arithmetic and control-budget exhaustion throw atomically.
   * boundary contains only master exterior controls, with their nominal affine UV
   * coefficient locations; physical fitted coefficients belong to the caller.
   * Binary64 restriction is algebraically exact before rounding. Canonical point
   * expressions own shared cut endpoints rather than separate restriction paths.
   * This helper supplies coefficient coupling, not source coverage, G1 or a
   * conforming generated mesh: the old four-ID-only engine cannot join unequal
   * intervals without canonical interval sample ownership.
   */
  export function createChartLeafControls(input: Parameters<IAutoMovieRecoveryChartLeafControls.Operation>[0]): ReturnType<IAutoMovieRecoveryChartLeafControls.Operation> {
    return RecoveryChartLeafControlsImplementation(input);
  }

  /**
   * Fit a boundary collar with affine hanging-control constraints against private
   * PL observations. Each leaf is an axis-aligned UV rectangle, so clipping and
   * local coordinates preserve the physical-area polynomial objective. Adaptive
   * attempts split residual-marked leaves at their observed UV locations and
   * close opposed interface intervals. Exhausted or incompatible attempts retain
   * the previous field. Returned edge identities are coefficient relations, not
   * source topology or G1 claims. Optional physical-gradient observations change
   * the declared fitting objective. Their millimetre exchange length scales with
   * physical units. Refinement retains the preceding candidate unless the
   * combined objective improves without worsening its original physical-area
   * position RMS. Every attempt reuses the initial coefficient enclosure;
   * restricting a boundary cubic cannot silently shrink the feasible box. Point
   * fallback supplies no gradient fit.
   */
  export function fitChartLeaf(input: Parameters<IAutoMovieRecoveryChartLeafFit.Operation>[0]): ReturnType<IAutoMovieRecoveryChartLeafFit.Operation> {
    return RecoveryChartLeafFitImplementation(input);
  }

  /**
   * Form two physical tangent observations for one affine source triangle. For
   * physical edges K=Q R and UV edges U, T=U R^-1 maps orthonormal physical
   * tangent coordinates to global UV. A leaf basis contributes
   * lengthMm*(phi_s_T[0,a]/hu + phi_t_T[1,a]/hv), with target lengthMm*Q[:,a].
   * Thus the two rows measure the source-metric first derivative residual.
   * Targets are millimetres and receive no position-origin subtraction.
   *
   * The original triangle may cross the leaf bounds. Its frame is reusable by
   * every clipped child and quadrature point. UV orientation must be positive. A
   * second physical edge unresolved at machine-relative angular precision,
   * nonrepresentable positive area or nonfinite arithmetic throws. The diagonal
   * scale ratio and edge reconstruction residual are diagnostics, not condition
   * numbers, rank certificates or continuous source-error bounds. Input arrays
   * are not mutated and no geometry or normal is published.
   */
  export function createChartPhysicalJet(input: Parameters<IAutoMovieRecoveryChartPhysicalJet.Operation>[0]): ReturnType<IAutoMovieRecoveryChartPhysicalJet.Operation> {
    return RecoveryChartPhysicalJetImplementation(input);
  }

  /**
   * Close a private rectangle split under laminar opposed interface intervals.
   * Bounds are global unit-square [u0,u1,v0,v1] coordinates; axes 0 and 1 vary u
   * and v. An exact endpoint sweep first establishes one covering layer over
   * every positive-area cell. Every subsequent strict split preserves that
   * partition without moving an endpoint. Proper overlaps propagate an existing
   * smaller end into the opposite leaf; identical, contained and disjoint
   * interfaces need no additional split. Stable geometric and name ordering makes
   * input permutations equivalent.
   *
   * Failure is atomic: invalid coverage, exhausted leaf budgets, unrepresentable
   * levels or colliding child names throw without changing input. Low and high
   * children append .0 and .1 to the parent ID, increment its level and retain
   * its root. This operation establishes rectangle coverage and laminar
   * interfaces only; C0 control relations, field prolongation, approximation
   * improvement and normal or source correspondence remain consumer obligations.
   */
  export function closeChartRefinement(input: Parameters<IAutoMovieRecoveryChartRefinementClosure.Operation>[0]): ReturnType<IAutoMovieRecoveryChartRefinementClosure.Operation> {
    return RecoveryChartRefinementClosureImplementation(input);
  }

  /**
   * Prepare private scalar-clipped source-cell ownership and boundary incidence
   * observations. Every query supplies all faces with max(height)>=before and
   * min(height)<=after, in original face order. The implicit cell is that face's
   * barycentric domain intersected with the closed scalar interval; no source
   * triangle array or generated mesh is returned. Source and returned private
   * addresses must be discarded before engine publication. Original source edges
   * share declared incidence; cut edges remain face occurrences, so coincident or
   * parallel cut edges are not welded. Raw and canonical incidence are explicit
   * alternatives, not assumed equivalent. Plane strata require one external owner
   * when adjacent slabs are combined. Connectivity/topology never establishes a
   * regular or event chart: every component remains unclassified, with all
   * unsupported evidence retained.
   */
  export function createEventRegion(source: Parameters<IAutoMovieRecoveryEventRegion.Operation>[0]): ReturnType<IAutoMovieRecoveryEventRegion.Operation> {
    return RecoveryEventRegionImplementation(source);
  }

  /** Clip one ordered candidate population into fresh private query cells. */
  export function createEventRegionCells(source: Parameters<IAutoMovieRecoveryEventRegionCells.Operation>[0], prepared: Parameters<IAutoMovieRecoveryEventRegionCells.Operation>[1], query: Parameters<IAutoMovieRecoveryEventRegionCells.Operation>[2]): ReturnType<IAutoMovieRecoveryEventRegionCells.Operation> {
    return RecoveryEventRegionCellsImplementation(source, prepared, query);
  }

  /**
   * Attach contact and port ownership evidence after component topology is
   * complete.
   */
  export function createEventRegionPorts(source: Parameters<IAutoMovieRecoveryEventRegionPorts.Operation>[0], prepared: Parameters<IAutoMovieRecoveryEventRegionPorts.Operation>[1], work: Parameters<IAutoMovieRecoveryEventRegionPorts.Operation>[2], topology: Parameters<IAutoMovieRecoveryEventRegionPorts.Operation>[3], query: Parameters<IAutoMovieRecoveryEventRegionPorts.Operation>[4]): ReturnType<IAutoMovieRecoveryEventRegionPorts.Operation> {
    return RecoveryEventRegionPortsImplementation(source, prepared, work, topology, query);
  }

  /** Prepare immutable source rank and incidence once for all scalar queries. */
  export function createEventRegionSource(source: Parameters<IAutoMovieRecoveryEventRegionSource.Operation>[0]): ReturnType<IAutoMovieRecoveryEventRegionSource.Operation> {
    return RecoveryEventRegionSourceImplementation(source);
  }

  /**
   * Observe component incidence, orientation parity, links and boundary cycles in
   * one query.
   */
  export function createEventRegionTopology(_source: Parameters<IAutoMovieRecoveryEventRegionTopology.Operation>[0], prepared: Parameters<IAutoMovieRecoveryEventRegionTopology.Operation>[1], work: Parameters<IAutoMovieRecoveryEventRegionTopology.Operation>[2]): ReturnType<IAutoMovieRecoveryEventRegionTopology.Operation> {
    return RecoveryEventRegionTopologyImplementation(_source, prepared, work);
  }

  /** Compute the original unnormalized source face cross products in index order. */
  export function computeAtlasObservationNormals(input: IAutoMovieRecoveryAtlasObservationInput): number[][] {
    return RecoveryAtlasObservationNormalsImplementation(input);
  }

  /** Publish maximal feature arcs with their two actual coherent boundary banks. */
  export function extractFeatureChartSeams(context: Parameters<IAutoMovieRecoveryFeatureChartCutsSeams.Operation>[0], fail: Parameters<IAutoMovieRecoveryFeatureChartCutsSeams.Operation>[1], edge: Parameters<IAutoMovieRecoveryFeatureChartCutsSeams.Operation>[2], lex: Parameters<IAutoMovieRecoveryFeatureChartCutsSeams.Operation>[3]): ReturnType<IAutoMovieRecoveryFeatureChartCutsSeams.Operation> {
    return RecoveryFeatureChartCutsSeamsImplementation(context, fail, edge, lex);
  }

  /**
   * Subdivide colliding feature edges using the unchanged exact midpoint
   * arithmetic.
   */
  export function subdivideFeatureChartCuts(input: Parameters<IAutoMovieRecoveryFeatureChartCutsSubdivide.Operation>[0], source: Parameters<IAutoMovieRecoveryFeatureChartCutsSubdivide.Operation>[1], features: Parameters<IAutoMovieRecoveryFeatureChartCutsSubdivide.Operation>[2], collisions: Parameters<IAutoMovieRecoveryFeatureChartCutsSubdivide.Operation>[3], physicalPositions: Parameters<IAutoMovieRecoveryFeatureChartCutsSubdivide.Operation>[4], analyze: Parameters<IAutoMovieRecoveryFeatureChartCutsSubdivide.Operation>[5], fail: Parameters<IAutoMovieRecoveryFeatureChartCutsSubdivide.Operation>[6], edge: Parameters<IAutoMovieRecoveryFeatureChartCutsSubdivide.Operation>[7], lex: Parameters<IAutoMovieRecoveryFeatureChartCutsSubdivide.Operation>[8]): ReturnType<IAutoMovieRecoveryFeatureChartCutsSubdivide.Operation> {
    return RecoveryFeatureChartCutsSubdivideImplementation(input, source, features, collisions, physicalPositions, analyze, fail, edge, lex);
  }

  /**
   * Create the feature-cut topology observer with its original failure and
   * edge-key policy.
   */
  export function inspectFeatureChartTopology(fail: (reason: string) => never, edge: (a: number, b: number) => string): (
  vertices: readonly Readonly<AutoMovieVector3Tuple>[],
  triangles: readonly (readonly [number, number, number])[],
) => IAutoMovieRecoveryObservedMeshTopology {
    return RecoveryFeatureChartCutsTopologyImplementation(fail, edge);
  }

  /**
   * Prepare privately cut feature banks for a common four-arc boundary network.
   * Unique occurrence keys guide auxiliary cuts; repeated physical keys retain
   * source identity without welding private fans. Every output remains an
   * observation chart. Closed components and failed topology or disk admissions
   * stay unsupported.
   */
  export function prepareFeatureChart(input: Parameters<IAutoMovieRecoveryFeatureChartPreparation.Operation>[0]): ReturnType<IAutoMovieRecoveryFeatureChartPreparation.Operation> {
    return RecoveryFeatureChartPreparationImplementation(input);
  }

  /**
   * Publish only the declared observation policy, never undeclared caller
   * payloads. Numerical values and vector references are retained without
   * defaults or conversion. Input objects can contain extra runtime properties
   * even when their static type is narrower; object-rest publication would
   * accidentally retain source populations.
   */
  export function createObservationPolicy(input: IAutoMovieRecoveryInput): Omit<IAutoMovieRecoveryInput, "verticesMm" | "triangles"> {
    return createRecoveryObservationPolicyImplementation(input);
  }

  /** Encode an already computed number without changing its numerical owner. */
  export function encodeDiagnosticNumber(value: number): AutoMovieDiagnosticNumber {
    return encodeRecoveryDiagnosticNumberImplementation(value);
  }

  /**
   * Filter one finite grayscale chart with separable sampled Gaussian kernels.
   * First derivatives use the derivative of the Gaussian, not a finite difference
   * of an unrelated blur. Four-sigma truncation and half-sample reflection follow
   * scipy.ndimage's documented Gaussian-filter chart used by the experiment.
   * https://docs.scipy.org/doc/scipy/reference/generated/scipy.ndimage.gaussian_filter.html
   */
  export function filterImageGaussian(source: Float64Array, width: number, height: number, sigma: number, derivative?: "none" | "x" | "y"): Float64Array {
    return filterRecoveryImageGaussianImplementation(source, width, height, sigma, derivative);
  }

  /**
   * Bound one declared affine row over a common independent-coefficient box.
   * Duplicate original IDs first combine in input order using binary64 addition.
   * The resulting floating-point coefficients, constants, bounds and target are
   * then interpreted as exact dyadic numbers. Endpoint arithmetic and the strict
   * squared-distance comparison against tolerance are exact for that row.
   *
   * Returned endpoints round outward. minimumDistanceMm is an approximate number
   * view; only infeasibleAtTolerance uses the exact comparison. A false decision
   * does not establish that several observations can be fitted simultaneously.
   * Row identities do not identify source vertices, and this box is not generated
   * geometry, continuous source support or a closest-surface distance
   * certificate. Nonfinite input, conflicting bounds, invalid IDs, exhausted raw
   * term budgets, nonfinite duplicate sums or nonrepresentable number views throw
   * atomically.
   */
  export function computeReachableChartBox(input: Parameters<IAutoMovieAffineBoxBound.Operation>[0]): ReturnType<IAutoMovieAffineBoxBound.Operation> {
    return RecoveryChartReachableBoxImplementation(input);
  }
}
