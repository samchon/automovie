import type {
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
} from "@automovie/interface";

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
}
