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

import { type AutoMovieRecoveryCurveData, type AutoMovieRecoveryCurveFormat, type IAutoMovieRecoveryAtlasObservation, type IAutoMovieRecoveryAtlasObservationInput, type IAutoMovieRecoveryCameraMapEstimate, type IAutoMovieRecoveryCameraSetObservationOperation, type IAutoMovieRecoveryImageFeaturesExtractionOperation, type IAutoMovieRecoveryCameraTracksLinkageOperation, type IAutoMovieRecoveryCameraMapInput, type IAutoMovieRecoveryCameraPairEstimate, type IAutoMovieRecoveryCameraPairInput, type IAutoMovieRecoveryCameraSceneEstimate, type IAutoMovieRecoveryCameraSceneInput, type IAutoMovieRecoveryContourResume, type IAutoMovieRecoveryContourResumeInput, type IAutoMovieRecoveryDefaultObservationOptions, type IAutoMovieRecoveryImageInput, type IAutoMovieRecoveryImageObservation, type IAutoMovieRecoveryInput, type IAutoMovieRecoveryMeshSections, type IAutoMovieRecoveryObservationChart, type IAutoMovieRecoveryObservationChartSeed, type IAutoMovieRecoveryObservationOptions, type IAutoMovieRecoveryObservationTransport, type IAutoMovieRecoveryOptions, type IAutoMovieRecoveryPreparedInput, type IAutoMovieRecoveryRegisteredInput, type IAutoMovieRecoveryResult, type IAutoMovieRecoverySections, type IAutoMovieRecoverySectionsInput, type IAutoMovieRecoverySlabs, type IAutoMovieRecoverySlabsInput, type IAutoMoviePolylineFit, type IAutoMoviePolylineFitInput, type IAutoMovieRecoveryAtlasObservationSource, type IAutoMovieRecoveryAtlasObservationCreases, type IAutoMovieRecoveryAtlasObservationFeatures, type IAutoMovieRecoveryAtlasObservationChart, type IAutoMovieRecoveryAtlasObservationPublish, type IAutoMovieRecoveryChartBoundaryNetwork, type IAutoMovieRecoveryAnnularChartPreparation, type IAutoMovieRecoveryDiskChart, type IAutoMovieRecoveryMultiBoundaryChart, type IAutoMovieRecoveryChartCollar } from "@automovie/interface";

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
}
