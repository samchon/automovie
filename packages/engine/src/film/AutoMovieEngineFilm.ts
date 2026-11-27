import { compilePerformance as compilePerformanceImplementation } from "../perform/internal/compilePerformance";
import { resolveTargetPoint as resolveTargetPointImplementation } from "../perform/internal/resolveTargetPoint";
import { scenePlacements as scenePlacementsImplementation } from "../perform/internal/scenePlacements";

import type { AutoMovieEngineFilmTypes } from "./AutoMovieEngineFilmTypes";
import { createPerformShotSubjectFramer as createPerformShotSubjectFramerImplementation } from "./internal/createPerformShotSubjectFramer";
import { resolvedPerformShotPoint as resolvedPerformShotPointImplementation } from "./internal/resolvedPerformShotPoint";
import { samplePracticalSurfaceMaterial as samplePracticalSurfaceMaterialImplementation } from "./internal/samplePracticalSurfaceMaterial";
import { sequenceEditorialMarkerTimeline as sequenceEditorialMarkerTimelineImplementation } from "./internal/sequenceEditorialMarkerTimeline";
import { compileDefinedShot as compileDefinedShotImplementation } from "./internal/compileDefinedShot";
import { resolvePerformShotTarget as resolvePerformShotTargetImplementation } from "./internal/resolvePerformShotTarget";
import { type IAutoMovieCompileDefinedShot, type IAutoMovieCompiledDefinedShot, type IAutoMovieResolvePerformShotTarget, type IAutoMovieMotionTake, type IAutoMovieVector3, type IAutoMovieQuaternion, type IAutoMovieMotion, type IAutoMovieClip, type IAutoMovieTransform, type IAutoMovieSampledChannel, type IAutoMovieScriptNode, type IAutoMovieBlockedBeat, type IAutoMovieScript, type IAutoMovieStagedSet, type IAutoMovieBlocking, type IAutoMovieBeatEndState, type IAutoMovieModel, type IAutoMovieCameraClearanceDeformationRadius, type IAutoMovieShot, type IAutoMovieCameraClearanceSampleTimes, type IAutoMovieProductionFrameRate, type IAutoMovieClassifyPlaybackBoundary, type AutoMovieSectionPlaneState, type IAutoMovieClassifySectionPlaneBox, type IAutoMovieCameraIntent, type IAutoMovieShotCoverage, type IAutoMovieCompileCameraCoverage, type IAutoMovieCompileCameraMove, type IAutoMovieLaunchResult, type IAutoMovieCompileLaunch, type IAutoMovieEnginePerformShotGateContext, type IAutoMovieCompilePerformShotCameras, type IAutoMovieCompilePerformShotLaunches, type IAutoMovieEnginePerformShotActionPlan, type IAutoMovieActionSynthesizer, type IAutoMovieCompilePracticalLightMotion, type IAutoMovieComputeModelRestExtent, type IAutoMovieComputeModelRestExtentY, type IAutoMovieSkeleton, type IAutoMoviePropBox, type IAutoMoviePassageBlockage, type IAutoMovieBuiltEnvironment, type IAutoMovieShotContractSubjectReader, type IAutoMovieRealizeShotContractProps, type IAutoMovieCut, type IAutoMovieEditPlan, type IAutoMovieDefinedShot, type IAutoMovieShotDefinition, type IAutoMovieDeliveryCropNdc, type IAutoMovieDeliveryCrop, type IAutoMovieCameraDepthPrecisionReport, type IAutoMovieEvaluateCameraDepthPrecision, type IAutoMovieStorySyncOutcome, type IAutoMovieEvaluateStorySync, type IAutoMovieCompiledPredicateResult, type IAutoMovieShotPredicate, type IAutoMovieForgedCast, type IAutoMovieForgePlan, type IAutoMovieForgedProp, type IAutoMoviePropSpec, type IAutoMovieFormationMemberExtent, type IAutoMovieCompiledFormation, type IAutoMovieSubjectBox, type IAutoMovieFormationSubjectBox, type IAutoMovieFramedBox, type IAutoMovieConstraintViolation, type IAutoMovieObjectMotionGate, type IAutoMovieActionCall, type IAutoMoviePerformShotFrameJob, type IAutoMovieGatePerformShotCamera, type IAutoMovieReviewNote, type IAutoMovieGrammarDiagnosticsToReviewNotes, type IAutoMovieInteractionEvent, type IAutoMovieLight, type IAutoMovieInheritProductionLighting, type IAutoMovieGrammarDiagnostic, type IAutoMovieNormalizedGrammarShot, type AutoMovieInspectGrammarCutFraming, type IAutoMovieInspectGrammarCut, type IAutoMovieIntersectsPerspectiveFrustumBox, type IAutoMovieIntersectsPerspectiveFrustumSegment, type IAutoMovieIntersectsPerspectiveFrustumSphere, type IAutoMovieLocalSegmentMeetsPerspectiveFrustum, type IAutoMovieGrammarShotObservation, type IAutoMoviePerformedShot, type IAutoMoviePerformShotProps, type IAutoMoviePlantPerformShotStanceFeet, type IAutoMovieViolationAppendSink, type IAutoMovieBeatEndFootPlant, type IAutoMoviePlaybackSample, type IAutoMovieSequence, type IAutoMoviePlaybackTimeline, type IAutoMoviePlaybackEntry, type IAutoMoviePlaybackLayer, type IAutoMoviePointSubjectBox, type IAutoMoviePreparePlaybackTimeline, type IAutoMovieProductionFrameBoundaryToGridTick, type IAutoMovieProductionFrameBoundaryToSeconds, type IAutoMovieProductionFrameIntervalToGridTicks, type IAutoMovieProductionRenderLayersForPass, type AutoMovieGuidePass, type IAutoMovieProjectToNdc, type IAutoMovieResolvedCamera, type IAutoMoviePropAnchorFrame, type IAutoMoviePropBlockedPassages, type IAutoMoviePropClearanceBounds, type IAutoMoviePropOccupancyBounds, type IAutoMoviePropSpaceContainsBounds, type IAutoMoviePropSupportFace, type IAutoMoviePropSupportGap, type IAutoMovieGrammarReading, type IAutoMovieGrammarInput, type IAutoMovieRealizeShotContract, type IAutoMovieFilmOptics, type IAutoMovieResolveLensAt, type IAutoMovieResolveBeatProps, type IAutoMovieResolveCameraAt, type IAutoMovieMotionTakeAnchor, type IAutoMoviePoseKeypoint, type IAutoMovieResolvePoseKeypoints, type IAutoMovieResolveProductionFrameRate, type IAutoMovieResolveProductionLighting, type IAutoMovieReviewVisualRead, type IAutoMovieSceneNode, type IAutoMoviePracticalSurfaceTrack, type IAutoMovieProductionRenderFrame, type IAutoMovieFilmTimeline, type IAutoMovieSurfaceGraphicTrack, type IAutoMoviePlaybackEvent, type AutoMovieHumanoidBone, type IAutoMovieValidatePerformShotFraming, type IAutoMovieValidatePropAffordanceTarget, type IAutoMovieViolationCollector, type IAutoMovieValidatePropPlacementGeometry, type IAutoMovieValidation, type IAutoMovieValidatePropPlacements, type IAutoMovieAuthoringDiagnostic, type IAutoMovieShotPhysicsAdvice, type IAutoMovieShotProgram, type IAutoMovieShotStoryTime, type IAutoMovieStoryInterval, type IAutoMovieSectionPlane, type IAutoMovieCameraClearanceReport, type IAutoMovieCompileCameraClearanceReports, type IAutoMovieCameraClearanceEvaluation, type IAutoMovieStage, type IAutoMovieCoupleObjects, type IAutoMovieActionTarget, type IAutoMovieCreatePerformShotSubjectFramer, type IAutoMovieFramedSubject, type IAutoMoviePlaybackEditorialMarker, type IAutoMovieCompiledPerformance, type IAutoMovieScene } from "@automovie/interface";
import { compileAttach as compileAttachImplementation } from "./internal/compileAttach";
import { coupleObjects as coupleObjectsImplementation } from "./internal/coupleObjects";

import { compileCameraClearanceReports as compileCameraClearanceReportsImplementation } from "./internal/compileCameraClearanceReports";
import { evaluateCameraClearance as evaluateCameraClearanceImplementation } from "./internal/evaluateCameraClearance";
import { stageScene as stageSceneImplementation } from "./internal/stageScene";

import { autoMovieSectionPlaneDistance as autoMovieSectionPlaneDistanceImplementation } from "./internal/autoMovieSectionPlaneDistance";
import { autoMovieSectionPlanesKeepPoint as autoMovieSectionPlanesKeepPointImplementation } from "./internal/autoMovieSectionPlanesKeepPoint";


import { admitMotionTake as admitMotionTakeImplementation } from "./internal/admitMotionTake";
import { animatedBaseAt as animatedBaseAtImplementation } from "./internal/animatedBaseAt";
import { assertGrammarPositive as assertGrammarPositiveImplementation } from "./internal/assertGrammarPositive";
import { authoredRotationCriticalTimes as authoredRotationCriticalTimesImplementation } from "./internal/authoredRotationCriticalTimes";
import { autoMovieStoryInterval as autoMovieStoryIntervalImplementation } from "./internal/autoMovieStoryInterval";
import { autoMovieStoryTime as autoMovieStoryTimeImplementation } from "./internal/autoMovieStoryTime";
import { bakedTransformFromChannels as bakedTransformFromChannelsImplementation } from "./internal/bakedTransformFromChannels";
import { bakedTransformFromClipsAt as bakedTransformFromClipsAtImplementation } from "./internal/bakedTransformFromClipsAt";
import { beatNodeOf as beatNodeOfImplementation } from "./internal/beatNodeOf";
import { blockBeat as blockBeatImplementation } from "./internal/blockBeat";
import { cameraClearanceDeformationRadius as cameraClearanceDeformationRadiusImplementation } from "./internal/cameraClearanceDeformationRadius";
import { cameraClearanceSampleTimes as cameraClearanceSampleTimesImplementation } from "./internal/cameraClearanceSampleTimes";
import { canonicalProductionFrameRate as canonicalProductionFrameRateImplementation } from "./internal/canonicalProductionFrameRate";
import { classifyAutoMoviePlaybackBoundary as classifyAutoMoviePlaybackBoundaryImplementation } from "./internal/classifyAutoMoviePlaybackBoundary";
import { classifyAutoMovieSectionPlaneBox as classifyAutoMovieSectionPlaneBoxImplementation } from "./internal/classifyAutoMovieSectionPlaneBox";
import { classifyGrammarShotSize as classifyGrammarShotSizeImplementation } from "./internal/classifyGrammarShotSize";
import { compileCameraCoverage as compileCameraCoverageImplementation } from "./internal/compileCameraCoverage";
import { compileCameraMove as compileCameraMoveImplementation } from "./internal/compileCameraMove";
import { compileLaunch as compileLaunchImplementation } from "./internal/compileLaunch";
import { compilePerformShotCameras as compilePerformShotCamerasImplementation } from "./internal/compilePerformShotCameras";
import { compilePerformShotLaunches as compilePerformShotLaunchesImplementation } from "./internal/compilePerformShotLaunches";
import { compilePracticalLightMotion as compilePracticalLightMotionImplementation } from "./internal/compilePracticalLightMotion";
import { computeModelRestExtent as computeModelRestExtentImplementation } from "./internal/computeModelRestExtent";
import { computeModelRestExtentY as computeModelRestExtentYImplementation } from "./internal/computeModelRestExtentY";
import { computeRestHeight as computeRestHeightImplementation } from "./internal/computeRestHeight";
import { createPropPassageBlocker as createPropPassageBlockerImplementation } from "./internal/createPropPassageBlocker";
import { createShotContractSubjectReader as createShotContractSubjectReaderImplementation } from "./internal/createShotContractSubjectReader";
import { cutSequence as cutSequenceImplementation } from "./internal/cutSequence";
import { defineShot as defineShotImplementation } from "./internal/defineShot";
import { deliveryCropNdc as deliveryCropNdcImplementation } from "./internal/deliveryCropNdc";
import { equalProductionFrameRates as equalProductionFrameRatesImplementation } from "./internal/equalProductionFrameRates";
import { evaluateAutoMovieCameraDepthPrecision as evaluateAutoMovieCameraDepthPrecisionImplementation } from "./internal/evaluateAutoMovieCameraDepthPrecision";
import { evaluateAutoMovieStorySync as evaluateAutoMovieStorySyncImplementation } from "./internal/evaluateAutoMovieStorySync";
import { evaluateShotPredicate as evaluateShotPredicateImplementation } from "./internal/evaluateShotPredicate";
import { eventTimeKey as eventTimeKeyImplementation } from "./internal/eventTimeKey";
import { foldRoot as foldRootImplementation } from "./internal/foldRoot";
import { forgeCast as forgeCastImplementation } from "./internal/forgeCast";
import { forgeProp as forgePropImplementation } from "./internal/forgeProp";
import { formationMemberExtent as formationMemberExtentImplementation } from "./internal/formationMemberExtent";
import { formationSubjectBox as formationSubjectBoxImplementation } from "./internal/formationSubjectBox";
import { framedBoxOf as framedBoxOfImplementation } from "./internal/framedBoxOf";
import { gaitPhaseOf as gaitPhaseOfImplementation } from "./internal/gaitPhaseOf";
import { gateAuthoredObjectMotions as gateAuthoredObjectMotionsImplementation } from "./internal/gateAuthoredObjectMotions";
import { gatePerformShotActions as gatePerformShotActionsImplementation } from "./internal/gatePerformShotActions";
import { gatePerformShotBlocking as gatePerformShotBlockingImplementation } from "./internal/gatePerformShotBlocking";
import { gatePerformShotCamera as gatePerformShotCameraImplementation } from "./internal/gatePerformShotCamera";
import { gatePerformShotFrameOverlaps as gatePerformShotFrameOverlapsImplementation } from "./internal/gatePerformShotFrameOverlaps";
import { gatePerformShotRegionOverlaps as gatePerformShotRegionOverlapsImplementation } from "./internal/gatePerformShotRegionOverlaps";
import { gatePerformShotStageAction as gatePerformShotStageActionImplementation } from "./internal/gatePerformShotStageAction";
import { grammarDiagnosticsToReviewNotes as grammarDiagnosticsToReviewNotesImplementation } from "./internal/grammarDiagnosticsToReviewNotes";
import { handoffEvents as handoffEventsImplementation } from "./internal/handoffEvents";
import { inheritProductionLighting as inheritProductionLightingImplementation } from "./internal/inheritProductionLighting";
import { inspectGrammarCut as inspectGrammarCutImplementation } from "./internal/inspectGrammarCut";
import { intersectsPerspectiveFrustumBox as intersectsPerspectiveFrustumBoxImplementation } from "./internal/intersectsPerspectiveFrustumBox";
import { intersectsPerspectiveFrustumSegment as intersectsPerspectiveFrustumSegmentImplementation } from "./internal/intersectsPerspectiveFrustumSegment";
import { intersectsPerspectiveFrustumSphere as intersectsPerspectiveFrustumSphereImplementation } from "./internal/intersectsPerspectiveFrustumSphere";
import { localSegmentMeetsPerspectiveFrustum as localSegmentMeetsPerspectiveFrustumImplementation } from "./internal/localSegmentMeetsPerspectiveFrustum";
import { locateOnBeat as locateOnBeatImplementation } from "./internal/locateOnBeat";
import { lookRotation as lookRotationImplementation } from "./internal/lookRotation";
import { measureGrammarShotSize as measureGrammarShotSizeImplementation } from "./internal/measureGrammarShotSize";
import { nodeSubjectBox as nodeSubjectBoxImplementation } from "./internal/nodeSubjectBox";
import { nodeSubjectExtent as nodeSubjectExtentImplementation } from "./internal/nodeSubjectExtent";
import { normalizeGrammarShot as normalizeGrammarShotImplementation } from "./internal/normalizeGrammarShot";
import { performShot as performShotImplementation } from "./internal/performShot";
import { performShotActionSpan as performShotActionSpanImplementation } from "./internal/performShotActionSpan";
import { performShotActors as performShotActorsImplementation } from "./internal/performShotActors";
import { placeTransformedPoint as placeTransformedPointImplementation } from "./internal/placeTransformedPoint";
import { plantPerformShotStanceFeet as plantPerformShotStanceFeetImplementation } from "./internal/plantPerformShotStanceFeet";
import { plantsAtEnd as plantsAtEndImplementation } from "./internal/plantsAtEnd";
import { playbackCursor as playbackCursorImplementation } from "./internal/playbackCursor";
import { playbackEntryAt as playbackEntryAtImplementation } from "./internal/playbackEntryAt";
import { playbackEntryTime as playbackEntryTimeImplementation } from "./internal/playbackEntryTime";
import { playbackFrameSamples as playbackFrameSamplesImplementation } from "./internal/playbackFrameSamples";
import { playbackLayersAt as playbackLayersAtImplementation } from "./internal/playbackLayersAt";
import { playbackSampleAt as playbackSampleAtImplementation } from "./internal/playbackSampleAt";
import { playbackShownLayer as playbackShownLayerImplementation } from "./internal/playbackShownLayer";
import { pointSubjectBox as pointSubjectBoxImplementation } from "./internal/pointSubjectBox";
import { preparePlaybackTimeline as preparePlaybackTimelineImplementation } from "./internal/preparePlaybackTimeline";
import { productionFrameBoundaryToGridTick as productionFrameBoundaryToGridTickImplementation } from "./internal/productionFrameBoundaryToGridTick";
import { productionFrameBoundaryToSeconds as productionFrameBoundaryToSecondsImplementation } from "./internal/productionFrameBoundaryToSeconds";
import { productionFrameIntervalToGridTicks as productionFrameIntervalToGridTicksImplementation } from "./internal/productionFrameIntervalToGridTicks";
import { productionRenderLayersForPass as productionRenderLayersForPassImplementation } from "./internal/productionRenderLayersForPass";
import { projectToNdc as projectToNdcImplementation } from "./internal/projectToNdc";
import { propAnchorFrame as propAnchorFrameImplementation } from "./internal/propAnchorFrame";
import { propBlockedPassages as propBlockedPassagesImplementation } from "./internal/propBlockedPassages";
import { propBoxAxisIsSound as propBoxAxisIsSoundImplementation } from "./internal/propBoxAxisIsSound";
import { propBoundsOverlap as propBoundsOverlapImplementation } from "./internal/propBoundsOverlap";
import { propClearanceBounds as propClearanceBoundsImplementation } from "./internal/propClearanceBounds";
import { propOccupancyBounds as propOccupancyBoundsImplementation } from "./internal/propOccupancyBounds";
import { propSpaceContainsBounds as propSpaceContainsBoundsImplementation } from "./internal/propSpaceContainsBounds";
import { propSupportFace as propSupportFaceImplementation } from "./internal/propSupportFace";
import { propSupportGap as propSupportGapImplementation } from "./internal/propSupportGap";
import { readFilmGrammar as readFilmGrammarImplementation } from "./internal/readFilmGrammar";
import { realizeShotContract as realizeShotContractImplementation } from "./internal/realizeShotContract";
import { resolveAutoMovieDeliveryCrop as resolveAutoMovieDeliveryCropImplementation } from "./internal/resolveAutoMovieDeliveryCrop";
import { resolveAutoMovieLensAt as resolveAutoMovieLensAtImplementation } from "./internal/resolveAutoMovieLensAt";
import { resolveBeatEnd as resolveBeatEndImplementation } from "./internal/resolveBeatEnd";
import { resolveBeatOpening as resolveBeatOpeningImplementation } from "./internal/resolveBeatOpening";
import { resolveBeatSnapshot as resolveBeatSnapshotImplementation } from "./internal/resolveBeatSnapshot";
import { resolveCameraAt as resolveCameraAtImplementation } from "./internal/resolveCameraAt";
import { resolveFromTimeline as resolveFromTimelineImplementation } from "./internal/resolveFromTimeline";
import { resolveMotionTakeAnchor as resolveMotionTakeAnchorImplementation } from "./internal/resolveMotionTakeAnchor";
import { resolvePoseKeypoints as resolvePoseKeypointsImplementation } from "./internal/resolvePoseKeypoints";
import { resolveProductionFrameRate as resolveProductionFrameRateImplementation } from "./internal/resolveProductionFrameRate";
import { resolveProductionLighting as resolveProductionLightingImplementation } from "./internal/resolveProductionLighting";
import { resolveSequencePlayback as resolveSequencePlaybackImplementation } from "./internal/resolveSequencePlayback";
import { reviewVisualRead as reviewVisualReadImplementation } from "./internal/reviewVisualRead";
import { rootVelocityOf as rootVelocityOfImplementation } from "./internal/rootVelocityOf";
import { samplePracticalSurfaceTrackMaterial as samplePracticalSurfaceTrackMaterialImplementation } from "./internal/samplePracticalSurfaceTrackMaterial";
import { sampleProductionRenderFrame as sampleProductionRenderFrameImplementation } from "./internal/sampleProductionRenderFrame";
import { sampleSurfaceGraphicKey as sampleSurfaceGraphicKeyImplementation } from "./internal/sampleSurfaceGraphicKey";
import { scriptAncestors as scriptAncestorsImplementation } from "./internal/scriptAncestors";
import { sequenceEventTimeline as sequenceEventTimelineImplementation } from "./internal/sequenceEventTimeline";
import { sequenceTimeline as sequenceTimelineImplementation } from "./internal/sequenceTimeline";
import { skeletonRestFrames as skeletonRestFramesImplementation } from "./internal/skeletonRestFrames";
import { unionSubjectBoxes as unionSubjectBoxesImplementation } from "./internal/unionSubjectBoxes";
import { validatePerformShotFraming as validatePerformShotFramingImplementation } from "./internal/validatePerformShotFraming";
import { validatePropAffordanceTarget as validatePropAffordanceTargetImplementation } from "./internal/validatePropAffordanceTarget";
import { validatePropPlacementGeometry as validatePropPlacementGeometryImplementation } from "./internal/validatePropPlacementGeometry";
import { validatePropPlacements as validatePropPlacementsImplementation } from "./internal/validatePropPlacements";
import { validatePropSupportCycles as validatePropSupportCyclesImplementation } from "./internal/validatePropSupportCycles";
import { validateShotPhysicsAdvice as validateShotPhysicsAdviceImplementation } from "./internal/validateShotPhysicsAdvice";
import { validateShotProgramContract as validateShotProgramContractImplementation } from "./internal/validateShotProgramContract";
import { verifyMotionTake as verifyMotionTakeImplementation } from "./internal/verifyMotionTake";

/** Public operations for Auto Movie Engine Film. */
export namespace AutoMovieEngineFilm {
  /**
   * Admit a parsed motion-take artifact before the host binds any saved
   * references.
   *
   * Accepts authored version 1 only. Checks exact record fields, unpadded paths,
   * lowercase SHA-256 digests, unique ledger keys, and finite nonnegative clocks.
   * The source module must appear in the file ledger and at least one versioned
   * provider must be named. Throws a path-specific diagnostic for a malformed
   * record or an unsupported version or replay mode. The result borrows the
   * parsed data; hosts independently rederive its facts before replay.
   */
  export function admitMotionTake(input: unknown): IAutoMovieMotionTake {
    return admitMotionTakeImplementation(input);
  }

  /**
   * A node's animated world position over shot time: its staged `base` plus the
   * node-local root displacement `motion` carries at that instant, rotated into
   * the world by the node's staged `facing`.
   *
   * This is the read a `follow` camera uses to track a walking actor and a
   * `launch` uses to lead a moving target, under the same convention the renderer
   * applies: the root is node-local and turns with the node's facing. A pose with
   * no root holds the node at its base. The motion is sampled with the sampler's
   * own loop and clamp rules at shot-local seconds.
   *
   * @param base The node's staged world position, in metres.
   * @param facing The node's staged world rotation.
   * @param motion The node's compiled clip.
   * @returns A function from shot-local seconds to world position in metres.
   */
  export function animatedBaseAt(base: IAutoMovieVector3, facing: IAutoMovieQuaternion, motion: IAutoMovieMotion): (seconds: number) => IAutoMovieVector3 {
    return animatedBaseAtImplementation(base, facing, motion);
  }

  /**
   * Throws `<path> must be finite and positive.` unless `value` is a finite
   * number greater than zero.
   *
   * The film-grammar read refuses a malformed observation instead of reporting
   * it, so a threshold, a duration, a lens or a subject height that is zero,
   * negative, `NaN` or infinite stops the read before any projection divides by
   * it.
   *
   * @param value Number that must be finite and greater than zero.
   * @param path Dotted name of the field, used as the message prefix.
   */
  export function assertGrammarPositive(value: number, path: string): void {
    assertGrammarPositiveImplementation(value, path);
  }

  /**
   * Add analytical rotation extrema and one-sided key samples to shot admission.
   *
   * Clips must have passed transform-track admission. Each loop repeats the same
   * component curve against the same direct limits, so one cycle suffices;
   * sequence authority can only replace an earlier track, never restore it. The
   * owner resolves the complete sequence, so a hidden track gains no authority.
   * Nearest representable neighbours check the values just inside key boundaries,
   * including shortest-arc quaternion sign changes and cross-clip handoffs.
   */
  export function authoredRotationCriticalTimes(clips: readonly IAutoMovieClip[], shotDuration: number): Set<number> {
    return authoredRotationCriticalTimesImplementation(clips, shotDuration);
  }

  /**
   * Assemble a node's baked world frame from one already sampled object-channel
   * map.
   *
   * Translation and rotation must both have started; otherwise null leaves
   * placement authority with the caller. Admitted complete channel values are a
   * premise. Components are copied into new records, except the borrowed
   * read-only unit scale when no scale track writes. This helper does not choose
   * authority or sample time.
   */

  /**
   * Map one shot-local time in seconds onto the production story clock,
   * originSeconds + localSeconds * rate, with an omitted rate meaning 1.
   *
   * The map is affine, so a shot that stretches or compresses time still lands on
   * the same clock as one that does not. Nothing is validated here: a non-finite
   * input, or an overflow, yields a non-finite story time.
   *
   * @param pin The shot's story-clock origin and optional playback rate.
   * @param localSeconds Shot-local time in seconds.
   * @returns Story-clock time in seconds.
   */
  export function autoMovieStoryTime(
    pin: IAutoMovieShotStoryTime,
    localSeconds: number,
  ): number {
    return autoMovieStoryTimeImplementation(pin, localSeconds);
  }

  /**
   * Map a shot-local window onto the story-clock interval it occupies, in
   * seconds.
   *
   * The edit places a shot in the presentation; this places a stretch of the same
   * shot in the story, either the whole shot ({ from: 0, to: duration }) or an
   * event window inside it. Two windows may overlap here while their shots sit
   * far apart in the cut, which is a relationship a cut list cannot express.
   *
   * Both ends go through
   * {@link AutoMovieEngineFilm.autoMovieStoryTime}, so the interval keeps the
   * window's order exactly when the pin's rate is positive. Nothing is validated
   * here: a non-finite bound or pin yields a non-finite end, and an inverted
   * window yields an inverted interval, for the caller to refuse.
   *
   * @param pin The shot's story-clock origin and optional playback rate.
   * @param window Shot-local seconds to map onto the story clock.
   * @returns The resulting story-clock interval.
   */
  export function autoMovieStoryInterval(
    pin: IAutoMovieShotStoryTime,
    window: IAutoMovieStoryInterval.IWindow,
  ): IAutoMovieStoryInterval.IResult {
    return autoMovieStoryIntervalImplementation(pin, window);
  }

  /** Assemble a node's baked world transform from sampled channels, or return null until both translation and rotation have started. */
  export function bakedTransformFromChannels(
    sampled: ReadonlyMap<string, IAutoMovieSampledChannel>,
    node: string,
  ): IAutoMovieTransform | null {
    return bakedTransformFromChannelsImplementation(sampled, node);
  }

  /**
   * Resolve a node's baked world transform from a sequence of object-motion clips
   * at one shot-local instant, the way playback reads them.
   *
   * Channels are selected by {@link sampleClipSequence}: per channel, the track
   * whose first key started latest by `t` wins, ties going to the later clip, and
   * a track that has not started writes nothing. Translation and rotation are
   * therefore chosen independently, so disjoint producer clips compose and a
   * later coupling hands off from an earlier one.
   *
   * Returns `null` while no clip has started writing both the node's translation
   * and its rotation; the node then stands where its staged placement and pose
   * put it, which the caller supplies. Scale comes from an authorized scale
   * track, else it is unit: the engine's attach and launch bakers write no scale,
   * and the staged scale of a set piece is not known here, so a caller that needs
   * it reads it from the scene node.
   */
  export function bakedTransformFromClipsAt(clips: readonly IAutoMovieClip[], node: string, t: number): IAutoMovieTransform | null {
    return bakedTransformFromClipsAtImplementation(clips, node, t);
  }

  /**
   * The id of the beat-kind node that claims one flat
   * {@link IAutoMovieScript.beats} entry, or null when there is no tree or no node
   * claims it.
   *
   * This is the join `validateScriptTree` enforces one-to-one on a committed
   * tree, and the lookup a beat-scoped consumer such as `locateOnBeat` uses to
   * place its feedback on the screenplay graph. On a tree that has not passed
   * that validation, the first claiming node in tree order is returned.
   */
  export function beatNodeOf(tree: readonly IAutoMovieScriptNode[] | null | undefined, beatId: string): string | null {
    return beatNodeOfImplementation(tree, beatId);
  }

  /**
   * The blocking gate: check one beat's shot plan before any performance is
   * compiled from it, and report every contradiction at once.
   *
   * The checks are coherence, not craft:
   *
   * - The script's beat ids are unique, and the plan's beat is one of them;
   * - The beat duration is finite and positive;
   * - Every actor intent belongs to a staged scene node, and its timing anchors lie
   *   inside `[0, duration]` in the order listed, because the list order is the
   *   causal order ("the loose before the hit");
   * - A node-kind hero camera target names a staged actor, set piece or camera
   *   (#1294), and the hero intent names a supported framing and move;
   * - Each optional `coverage` camera (#1187) names a staged camera exactly once,
   *   checks staged membership for a node-kind target, and states a supported
   *   framing and move.
   *
   * When the prior beat's end state is supplied it becomes this beat's initial
   * condition: each carried actor must be a staged scene node listed once, and
   * the state is returned on success as `previous` so later stages resume from it
   * rather than resetting the world at the cut; without it `previous` is null.
   * This gate assumes typed records and does not validate carried pose values,
   * anchor cue identities or non-node target contents; `performShot` owns later
   * target resolution. Violation paths are rooted at `$script`, `$input` for the
   * blocking, and `$previous`.
   */
  export function blockBeat(script: IAutoMovieScript, staged: IAutoMovieStagedSet.ISuccess, blocking: IAutoMovieBlocking, previous?: IAutoMovieBeatEndState): IAutoMovieBlockedBeat {
    return blockBeatImplementation(script, staged, blocking, previous);
  }

  /**
   * A pose-independent radius about a model's origin that contains its supplied
   * portable part geometry in any pose of its rig, in model-space metres.
   * External bytes and renderer-only deformation are outside this bound.
   *
   * `extent` is the model's rest-pose box from {@link computeModelRestExtent}. A
   * rest point `p` bound at a joint whose root-to-joint chain length is `c` lies
   * at most `|p| + c` from that joint; after any joint rotations the joint stays
   * within `c` of the root, so the posed point stays within `|p| + 2c` of the
   * origin. Non-negative normalized skin weights blend such bounded positions
   * convexly, so the same radius holds skinned vertices as well as parts rigidly
   * attached to a bone. `c` is the longest chain that reaches a bone some part
   * rides or some skin influences; bone rest scale is ignored because neither
   * engine forward kinematics nor the viewer applies it. A model with no skeleton
   * answers the farthest rest corner alone.
   *
   * The caller must have validated the model with `validateModel`, which
   * guarantees closed parent links, finite rest translations and skin joint names
   * that exist. Throws an `Error` naming the rig or model when an otherwise
   * finite chain or radius overflows to infinity.
   */
  export function cameraClearanceDeformationRadius(model: IAutoMovieModel, extent: IAutoMovieCameraClearanceDeformationRadius.IExtent): number {
    return cameraClearanceDeformationRadiusImplementation(model, extent);
  }

  /**
   * Build the clearance sample clock of one shot: a function from a take's camera
   * motion to the strictly increasing shot-local seconds at which that take must
   * be inspected.
   *
   * The clock is the endpoint-inclusive fixed clock of `sampleRate` over
   * `duration`, refined by every key time of every actor motion, object clip and
   * the take's camera clip that falls strictly inside the shot, repeated per
   * cycle for a looping sequence. Each interval stays within one key segment.
   * Under admitted motion inputs, linear, step and named non-overshooting easing
   * keep translation and scale within their endpoint ranges; quaternion rotation
   * follows an arc instead of that chord and needs the evaluator's separate
   * rotation bound. This clock refuses `cubicBezier` actor easing, `cubicspline`
   * clip tracks and an open loop seam on a channel the bound reads. It does not
   * certify the evaluator's normalized-lerp or changing-scale limits.
   *
   * The actor/object part is computed once and each take adds its camera
   * boundaries. Unboundable motion/clip interpolation or seams throw Error at the
   * corresponding call; a loop cycle count must also be a non-negative safe
   * integer so incrementing its enumeration index can progress. This
   * representability gate is not a workload budget, and representable populations
   * can still exhaust host resources.
   */
  export function cameraClearanceSampleTimes(props: IAutoMovieCameraClearanceSampleTimes.IProps): (cameraMotion: IAutoMovieShot["cameraMotion"]) => number[] {
    return cameraClearanceSampleTimesImplementation(props);
  }

  /**
   * Reduce one positive production frame rate, in frames per second, to its exact
   * integer identity: a numerator and denominator with no common factor.
   *
   * A scalar is accepted only as a positive safe integer and read as `n/1`. A
   * fractional rate must be stated as a numerator and denominator, because a
   * decimal such as 29.97 does not identify the rate that produced it
   * (30000/1001). Throws when a scalar is not a positive safe integer or a term
   * is not a positive safe integer; the message names the rejected value.
   */
  export function canonicalProductionFrameRate(input: number | IAutoMovieProductionFrameRate): IAutoMovieProductionFrameRate {
    return canonicalProductionFrameRateImplementation(input);
  }

  /**
   * Classify the edit relation between two output instants of one cut.
   *
   * Both instants resolve through the canonical playback mapping, so trims and
   * playback rates give each endpoint its retimed shot-local second, and an
   * instant on an entry's first output second belongs to that incoming entry. One
   * entry is continuous. A hard cut into the same shot at exactly the source
   * second where the previous entry stopped is a continuous seam. Every other
   * entry change, and any transition overlap at either instant, is a cut. A
   * declared break of that shot in `(before, after]` on its clock turns a
   * continuous relation into a discontinuity.
   *
   * @param props The cut, its layout, two output seconds and the deliberate
   *   breaks.
   * @returns The relation, with both shot clocks unless it is unavailable.
   */
  export function classifyAutoMoviePlaybackBoundary(props: IAutoMovieClassifyPlaybackBoundary.IProps): IAutoMovieClassifyPlaybackBoundary.IResult {
    return classifyAutoMoviePlaybackBoundaryImplementation(props);
  }

  /**
   * Classify a world-space axis-aligned box, in metres, against a set of section
   * planes: `kept` when every plane keeps all of it, `cut` when some plane
   * removes all of it, and `crossed` otherwise. An empty plane list keeps every
   * box.
   *
   * Each plane uses two support corners rather than eight: over a box n̂·(p − p0)
   * is linear, so its extremes sit at the corners chosen per axis by the normal's
   * sign. The corner farthest toward the removed side decides whether the box is
   * wholly kept, and the opposite corner whether it is wholly removed. A computed
   * zero distance is kept. Binary64 boundary rounding and overflow in the shared
   * distance arithmetic remain; finite box coordinates alone do not certify exact
   * distances.
   *
   * Throws a `RangeError` when a corner coordinate is not finite or `min` exceeds
   * `max` on an axis, because the support corners of such a box are swapped and a
   * box wholly kept would read as cut; a degenerate plane throws as
   * {@link autoMovieSectionPlaneDistance} does.
   *
   * This tells a reviewer which subjects a section left in view. It is not folded
   * into {@link intersectsPerspectiveFrustumBox}: an authored camera declares no
   * plane, so folding it into delivery acceptance would add a term that is always
   * empty there while making the acceptance of a sliced subject a silent
   * decision.
   */
  export function classifyAutoMovieSectionPlaneBox(props: IAutoMovieClassifySectionPlaneBox.IProps): AutoMovieSectionPlaneState {
    return classifyAutoMovieSectionPlaneBoxImplementation(props);
  }

  /**
   * The framing a subject's measured frame occupancy reads as: the framing whose
   * {@link FRAMING_HEIGHT_FRACTION} is nearest, by ratio, to how many subject
   * sizes the frame spans.
   *
   * `frameOccupancy` is the subject's share of the frame, in (0, ∞): its height
   * over the frame's height for a subject the frame holds vertically, or its
   * width over the frame's width for one whose width placed the camera. The
   * framing solve applies {@link FRAMING_HEIGHT_FRACTION} to both axes, so the
   * axis that fills more of its own side states the size delivered, and
   * `measureGrammarShotSize` passes the larger of the two. Nearness is measured
   * on a log scale, so `close` at 0.28 and `medium` at 0.62 are separated where
   * their ratio is even; an exact tie keeps the framing listed first, wider
   * before closer. Throws when the occupancy is not finite and positive.
   */
  export function classifyGrammarShotSize(frameOccupancy: number): IAutoMovieCameraIntent["framing"] {
    return classifyGrammarShotSizeImplementation(frameOccupancy);
  }

  /**
   * Compile one coverage take: the alternate angle another staged camera plays
   * over a beat, as an {@link IAutoMovieShotCoverage} record.
   *
   * The camera clip comes from {@link compileCameraMove} with this camera as its
   * parameter, so the side staging gave it is the side the angle plays from, and
   * `cameraIntent` lists each entry's intent in entry order. The intent is guide
   * metadata for a render host and never feeds the solve. Entries must be sorted
   * by `start` and must not overlap, as for the hero take; an empty list yields a
   * locked-off take with `cameraMotion: null` and no intent spans. Throws
   * whatever {@link compileCameraMove} throws for a framing or move outside the
   * grammar.
   */
  export function compileCameraCoverage(props: IAutoMovieCompileCameraCoverage.IProps): IAutoMovieShotCoverage {
    return compileCameraCoverageImplementation(props);
  }

  /**
   * Compile a camera's `frame` entries into one clip of its world translation and
   * rotation, the deterministic shot grammar.
   *
   * Framing fixes the distance and the aim. The frame must show the framing's
   * {@link FRAMING_HEIGHT_FRACTION} multiple of the subject's height vertically
   * and of its width (twice `radius`) horizontally, each by the pinhole fit `d =
   * (visible / 2) / tan(half-angle)`, and the camera stands at whichever distance
   * is larger. It aims at {@link FRAMING_AIM_FRACTION} of the height above the
   * subject's base. The camera approaches along its staged bearing, the direction
   * from the aim point to the staged camera, so the side staging chose is kept
   * and only the distance is solved; a camera staged on the aim point uses +Z.
   *
   * Move picks the path over the span `[start, start + duration]`, clipped to the
   * shot, where an `"auto"` duration runs to the next entry's start or the shot
   * end:
   *
   * - `static` holds one framed key at the start.
   * - `push-in` dollies from 1.25 to 0.8 times the framed distance, eased in and
   *   out.
   * - `orbit` swings 45 degrees about world up around the start aim, eased in and
   *   out.
   * - `truck` slides one framed distance toward the camera's screen-left while
   *   looking at the subject, eased in and out and riding the subject's animated
   *   base when it has one; a camera staged straight above or below uses world -X
   *   as screen-left.
   * - `follow` re-frames against the animated base at every key, or holds one
   *   framed key for an unsampled subject. Authored lookahead changes aim by
   *   reading the subject ahead of the key time up to the shot end. Translation
   *   uses the current sample.
   * - `whip` keeps the staged position and turns from the staged rotation onto the
   *   aim within 0.2 seconds, without solving a distance.
   *
   * Push-in, orbit, truck and follow are keyed at the span's ends and at every
   * delivery frame between them, the shot-local instants `k × denominator /
   * numerator` of `frameRate`. Keys are linear, so each delivered frame lands on
   * the path itself and the speed between frames is the eased path's own, with no
   * step from coarser sampling.
   *
   * An entry that is followed by another holds its last pose until its span ends.
   * An entry that starts where an earlier entry of positive span ended continues
   * from the pose the camera reached, taking its bearing and starting distance
   * from that position. A push-in, orbit, truck or sampled follow then eases from
   * the reached distance to its own framing's end distance, 0.8 times the framed
   * distance for a push-in and the framed distance otherwise, so it reverses only
   * when that authored end lies farther out. A static entry, or a follow of an
   * unsampled subject, keeps the reached pose under the previous entry's framing;
   * under a different framing, an authored re-frame, it takes its own framed
   * distance. A continuing entry whose first pose differs from the reached one,
   * by a re-frame or a new aim, steps there: the reached pose stays as its own
   * key 1e-6 s before the start, so the change is not spread over the previous
   * entry. A gap between two entries plays as a linear re-frame. A key landing
   * within 1e-9 s of the previous one otherwise replaces it, so a later entry at
   * the same instant as a zero-span one wins. Entries must be sorted by `start`
   * and must not overlap, which `performShot` checks. Returns null for no
   * entries, and throws an `Error` for a framing or move outside the grammar, an
   * invalid `frameRate`, or a frame index that is not a safe integer.
   *
   * @param props.clipId - Id the returned clip carries.
   * @param props.camera - The staged camera: its id names the tracks, its
   *   vertical field of view sets the fit, and its transform sets the bearing and
   *   the whip's position.
   * @param props.entries - Frame actions with their resolved subjects.
   * @param props.shotDuration - Shot length in seconds; the clip's duration.
   * @param props.aspect - Frame width over height for the horizontal fit. A
   *   camera states only its vertical field of view, so without this a subject
   *   with a `radius` cannot be fitted across the delivered frame. Omitted,
   *   non-finite or non-positive, it is 1, an assumed square frame; a narrower
   *   portrait output requires its actual aspect and is not bounded by that
   *   fallback. A subject with no `radius` is unaffected.
   * @param props.frameRate - Exact delivery frame rate the moving paths are keyed
   *   at; omitted, 24 frames per second.
   */
  export function compileCameraMove(props: IAutoMovieCompileCameraMove.IProps): IAutoMovieClip | null {
    return compileCameraMoveImplementation(props);
  }

  /**
   * Compose the `launch` verb's engine primitives into one result: the
   * projectile's flight and the struck target's reaction, timed to the
   * engine-computed hit rather than a number the model had to guess.
   *
   * It {@link solveBallisticLaunch solves the aim} that connects `origin` to
   * `target` at `action.speed`, {@link projectileTrajectory bakes the flight} into
   * the projectile node's clip, and, when the launch carries an `onHit` and
   * strikes a node, schedules that node's `react` at the contact. Pass `targetAt`
   * to lead a moving target: the aim then solves through {@link solveMovingLaunch}
   * against where the mover will be when the projectile arrives, and `target`
   * only names the fallback sightline.
   *
   * Times differ by output. The clip is flight-local, keyed over `[0, hitTime]`
   * with id `trajectory:<projectile>`, and the caller shifts it by `action.start`
   * onto the shot clock. The `react` start, the event times, and `targetAt`'s
   * argument are shot-local seconds, so the hit lands at `action.start +
   * hitTime`. The events are a `contact` always, a `hit` when a node is struck,
   * and a `fall` when the react unbalances it; their `actionIndex` is null for
   * the caller to stamp.
   *
   * Returns null when the target is out of range at that speed. Throws
   * `RangeError` when `onHit` has no `targetNode`, because no actor can perform
   * that requested reaction.
   */
  export function compileLaunch(props: IAutoMovieCompileLaunch.IProps): IAutoMovieLaunchResult | null {
    return compileLaunchImplementation(props);
  }

  /**
   * Compile the camera fields of a performed shot: the live camera's move, its
   * per-span intent, one alternate take per coverage job, and the clearance
   * reports.
   *
   * The live camera's `frame` moves, already sorted by start, compile through
   * {@link compileCameraMove} into the clip `cam:<scope>`; with no move the camera
   * is locked off and the clip is null. Each move's intent carries its framing,
   * move, focal length and focus, ordinary focus resolved to the opening point
   * the input gate accepted. An authored focus pull resolves two lens marks after
   * actor and object motion are compiled. A downstream host reads the intent
   * independently of the camera path. Each coverage job plays its one framing
   * across the whole beat from its own staged camera, as the clip
   * `cam:<scope>:<camera>`, so a host can cut to the angle at any instant, with
   * no focus or focal length invented for it. Every subject is measured by one
   * {@link createPerformShotSubjectFramer}, so hero and coverage frame the same
   * subject. {@link compileCameraClearanceReports} then reports any take whose
   * physical envelope is obstructed into the context's collector.
   *
   * @param context The shot's staged tables and collector.
   * @param props.liveCamera The live camera id the camera gate settled.
   * @param props.frames The live camera's moves, sorted by start.
   * @param props.coverageJobs The coverage takes the camera gate admitted.
   * @param props.scope Clip id scope: the shot id when given, else the beat id.
   * @param props.frameFormat Delivery raster and clock: its width over height is
   *   the framing aspect, a non-positive side or none giving a square fit, and
   *   its `fps` and `frameRate` key the moving paths, the compiler's 24 fps
   *   fallback applying without `fps`. A rate `resolveProductionFrameRate`
   *   refuses is a `range` violation at `$input.frameFormat.fps`.
   * @param props.models Compiler-owned models of the staged nodes, if any.
   * @param props.formationMotions The shot's compact formation cues.
   * @param props.motions The compiled actor clips by node id.
   * @param props.objectMotions Every object clip in producer order.
   * @param props.rotations Each staged node's world rotation, by id.
   * @param props.runtime The clearance runtime, when the caller supplied one.
   * @returns The shot's camera fields.
   */
  export function compilePerformShotCameras(context: IAutoMovieEnginePerformShotGateContext, props: IAutoMovieCompilePerformShotCameras.IProps): Pick<
  IAutoMovieShot,
  "cameraMotion" | "cameraIntent" | "coverage" | "cameraClearance"
> {
    return compilePerformShotCamerasImplementation(context, props);
  }

  /**
   * Solve every gated launch, bake each projectile's flight onto the shot clock,
   * and fold each target's engine-timed recoil into the stage list.
   *
   * Runs before the performance compiles, so an injected recoil rides the same
   * synthesis and range-of-motion gate as an authored `react`. For each job:
   *
   * - A `bone` aim with a live resolver leads the bone as it moves. A node aim
   *   whose target carries a `locomote` leads the node's animated base, compiled
   *   from that node's own actions; its own recoil fires at impact, past the lead
   *   window, so it does not perturb the path being sampled. Any other aim is the
   *   plain intercept.
   * - A flight that cannot reach the target at the given speed, or that lands more
   *   than `1e-9` s after the shot ends, is one `range` violation at the action's
   *   `speed`, and contributes nothing.
   * - Flight keys shift by the action start and the clip spans the shot. Before its
   *   first key, sampleClipSequence gives that flight no channel authority,
   *   leaving staged placement or an earlier started clip in charge; after
   *   landing its last key holds. Later flights of one projectile receive the id
   *   suffix :<n>.
   * - The flight's events carry the action's index, and its recoil, when the launch
   *   has one, is appended to `plan.stageActions` with the violation path of the
   *   launch's `onHit`, because the recoil has no `region` field of its own. The
   *   recoil stays exempt from the region-overlap gate: the engine schedules it
   *   at an instant the author cannot know, and the layering envelope bounds its
   *   blend to the flinch window.
   *
   * @param context The shot's staged tables and collector.
   * @param plan The action plan; recoils are appended to its stage list.
   * @param synthesize The shot's memoized synthesizer.
   * @param rotations Each staged node's world rotation, by id.
   * @returns The baked flight clips and their events, in job order.
   */
  export function compilePerformShotLaunches(context: IAutoMovieEnginePerformShotGateContext, plan: IAutoMovieEnginePerformShotActionPlan, synthesize: IAutoMovieActionSynthesizer, rotations: ReadonlyMap<string, IAutoMovieQuaternion>): IAutoMovieCompilePerformShotLaunches.IResult {
    return compilePerformShotLaunchesImplementation(context, plan, synthesize, rotations);
  }

  /**
   * Bake the position, aim and optional switching of a practical light from a
   * prop's existing motion. Darius Khondji describes using the actors'
   * flashlights as visible sources in [American Cinematographer's account of
   * Seven](https://theasc.com/article/seven-cinematography-khondji-fincher/).
   *
   * Place the emitter at each requested instant using the same shot-local
   * object-motion sampler as baked prop placement. Translation, rotation and
   * scale inherit the staged prop values until their respective channels begin.
   * Emit linear position and spot rotation tracks for resolveShotLighting.
   * Alignment is exact at the bake samples and interpolated between samples.
   * Intensity switches at exact interval boundaries independently of frame
   * spacing. A light whose source is a flame carries the flame's flicker instead:
   * one `step` intensity track on the flame's key grid, `I_on · A(t) / Ā` inside
   * `on` and 0 outside, whether or not `on` is given. A moving prop requires
   * explicit sample times. performShot calls this compiler after collecting
   * coupling and authored object clips, then passes the serializable result
   * through the existing shot light-motion path.
   */
  export function compilePracticalLightMotion(input: IAutoMovieCompilePracticalLightMotion): IAutoMovieClip {
    return compilePracticalLightMotionImplementation(input);
  }

  /**
   * A model's rest-pose box in model space: the axis-aligned range, in metres, of
   * its portable part geometry, on all three axes. External asset bytes are not
   * opened here, so proxy parts do not establish the imported asset's pixel
   * extent.
   *
   * Every vertex is placed the way the renderer places it: by its part's own
   * transform through {@link placeTransformedPoint}, then by the rest frame of the
   * bone the part rides, or left in model space when it rides none. The canonical
   * geometry realizer supplies primitive and bicubic recipe vertices, retaining
   * finite partial output, so framing does not reject an otherwise displayable
   * recipe. A trailing partial `x, y, z` triple in a mesh is ignored.
   *
   * {@link computeModelRestExtentY} is this box read on the vertical axis. The
   * horizontal half is what a subject wider than it is tall is framed and graded
   * from: a 60 m facade authored outward from its element origin has a drawn box
   * of `x 0…60, y 0…24, z −1…1`, where the vertical read alone reports `y 0…24`.
   *
   * Returns null when no part has a vertex, leaving the caller's own fallback in
   * charge rather than inventing an extent. Throws, through
   * {@link skeletonRestFrames}, when the model's skeleton is malformed.
   */
  export function computeModelRestExtent(model: IAutoMovieModel): IAutoMovieComputeModelRestExtent.IResult {
    return computeModelRestExtentImplementation(model);
  }

  /**
   * A model's rest-pose vertical extent in model space, in metres: the model-Y
   * range of the supplied portable part geometry or registered collision proxy.
   *
   * This is the subject height the framing grammar needs, and the reason it is
   * not {@link computeRestHeight}. A rig stops at the joints animation requires
   * and the figure does not: the generated `stickman` has no foot bone and no
   * head-top bone, so its joint span is 0.680 of the declared height, and a
   * `full` shot solved from that number shows an actor from the shins up.
   *
   * Returns null when the model has no vertex to measure, leaving the caller's
   * own fallback in charge rather than inventing a height, and throws when the
   * model's skeleton is malformed, both as {@link computeModelRestExtent} does.
   */
  export function computeModelRestExtentY(model: IAutoMovieModel): IAutoMovieComputeModelRestExtentY.IResult {
    return computeModelRestExtentYImplementation(model);
  }

  /**
   * A skeleton's rest-pose joint span in metres: the model-Y distance between its
   * lowest and highest joint once every bone's rest transform is composed down
   * the parent chain.
   *
   * This is the span between the extreme joints, which is not the subject's
   * height. A rig ends at the joints it needs for animation, and geometry
   * continues past them at both ends: the generated `stickman` puts its highest
   * joint at 0.92 of the declared height and its lowest at 0.24, so this returns
   * 0.680 of the real figure, and framing solved from it crops an actor's head.
   * {@link computeModelRestExtentY} measures supplied portable parts or their
   * proxy; the framing passes read this only when a node's model measured
   * nothing.
   *
   * Returns 0 for a skeleton with no bones, and throws, through
   * {@link skeletonRestFrames}, when a bone is duplicated, a parent is missing, or
   * the parent links cycle.
   */
  export function computeRestHeight(skeleton: IAutoMovieSkeleton): number {
    return computeRestHeightImplementation(skeleton);
  }

  /**
   * Prepare world passage bounds once and return a read-only intrusion query.
   *
   * Openings use the fill model's rest-pose part boxes; absent models or
   * unresolved placement chains are omitted. A held model without vertices
   * inherits builtPlacedPartBoxes' zero-size fallback at the staged fill
   * element's world origin. Connector route segments widen to their greatest
   * section width and clearance height at endpoints and internal section
   * stations, giving an outer axis-aligned corridor bound. Strict interior
   * overlap preserves touching as nonblocking. Results list openings then
   * connectors in declaration order.
   *
   * The environment must remain unchanged while the query is retained. The prop
   * registry validator creates one query per environment only for its current
   * synchronous call; a one-off caller uses propBlockedPassages instead.
   */
  export function createPropPassageBlocker(environment: IAutoMovieBuiltEnvironment): (bounds: IAutoMoviePropBox) => IAutoMoviePassageBlockage[] {
    return createPropPassageBlockerImplementation(environment);
  }

  /**
   * Build the subject reader one {@link realizeShotContract} call grades through.
   *
   * The compiled scene nodes, models, formations, shot performances, motions and
   * world landmarks are each indexed once by id, keeping the first record of a
   * repeated id. Three results are cached for the life of the reader because the
   * grade asks for them repeatedly with identical inputs: the object-motion
   * channels sampled at one shot-local second, shared by every node placed at
   * that second; a node subject's model-space extent, which walks its model's
   * rest geometry; and a formation's member extent. The caller must keep compiled
   * artifacts, world landmarks and fallback rig lookup answers stable for this
   * one grading call. This reader is not a live view across edits; changed inputs
   * require a new reader.
   *
   * @param props The grading inputs; read, never mutated.
   * @returns A reader over `props` that holds its indexes and caches until the
   *   caller drops it.
   */
  export function createShotContractSubjectReader(props: IAutoMovieRealizeShotContractProps): IAutoMovieShotContractSubjectReader {
    return createShotContractSubjectReaderImplementation(props);
  }

  /**
   * The ASSEMBLE consumer: fold the editor's cut-list into an
   * {@link IAutoMovieSequence} over the shots the pipeline actually built, or
   * return every violation at once.
   *
   * The layout gates are editorial arithmetic. Built shot ids are unique; the
   * frame rate is finite and positive; there is at least one entry; every entry
   * names a built shot whose duration is finite and positive; a trim has a finite
   * positive duration and a finite start, and lies inside `[0, shot.duration]`;
   * the entry rate is finite and positive with a representable positive output
   * span; the first entry has no transition; and a transition is finite and
   * positive, no longer than either neighbour's played span, and does not overlap
   * the previous entry's own incoming transition inside that entry. An event trim
   * resolves two exact, uniquely occurring built shot events to the same numeric
   * source span before these checks. Pacing and continuity rationale stay prose.
   *
   * `runtime` is in seconds: the sum of each entry's played output span (retained
   * source duration divided by the entry rate) minus each transition's duration,
   * since a transition overlaps the previous entry's tail. An unrepresentable
   * runtime is refused at entries. Each event requirement addresses one playback
   * entry and must match one built shot interaction event after trim and seam
   * ownership. Prop requirements compare sampled object-motion channels on the
   * two retained sides of hard cuts. Requirement lists and records are checked
   * before their fields are read. The sequence copies the plan's id, name, frame
   * rate and entries in order, borrowing numeric trim and transition objects,
   * lowering event trims with exact source ends, and recording only nondefault
   * playback rates.
   */
  export function cutSequence(assemble: IAutoMovieEditPlan, shots: IAutoMovieShot[]): IAutoMovieCut {
    return cutSequenceImplementation(assemble, shots);
  }

  /**
   * Register one coding-agent-authored shot under `id`.
   *
   * Returns a new record of exactly id, scene, contract and build; the id
   * argument is authoritative and extra definition fields are dropped. The
   * builder is not called and values are not validated here; compileDefinedShot
   * owns those phases and their structured diagnostics. Reading definition fields
   * can invoke author-supplied accessors, so registration does not sandbox module
   * evaluation. The contract and builder are shared by reference.
   */
  export function defineShot<Context>(id: string, definition: IAutoMovieShotDefinition<Context>): IAutoMovieDefinedShot<Context> {
    return defineShotImplementation<Context>(id, definition);
  }

  /**
   * Validate one delivery crop and restate it in the uncropped frame's normalized
   * device coordinates.
   *
   * An omitted crop is the whole gate. A malformed one throws the `RangeError` of
   * {@link resolveAutoMovieDeliveryCrop} rather than being clamped, so a frustum
   * test never silently clips against a window nobody could deliver.
   *
   * @param crop The delivery crop, or `undefined` for the whole gate.
   * @returns A new NDC restatement of the crop.
   */
  export function deliveryCropNdc(crop: IAutoMovieDeliveryCrop | undefined): IAutoMovieDeliveryCropNdc {
    return deliveryCropNdcImplementation(crop);
  }

  /**
   * Whether two production frame rates are the same rate, compared by their
   * reduced integer identity, so `30`, `30/1` and `60/2` are equal while `30` and
   * `30000/1001` are not.
   *
   * Throws, through {@link canonicalProductionFrameRate}, when either rate is not
   * a positive safe integer or a pair of positive safe-integer terms.
   */
  export function equalProductionFrameRates(left: number | IAutoMovieProductionFrameRate, right: number | IAutoMovieProductionFrameRate): boolean {
    return equalProductionFrameRatesImplementation(left, right);
  }

  /**
   * Measure the largest gap between adjacent representable depths that a camera's
   * standard perspective depth buffer leaves inside one required camera-space
   * range, and judge it against an authored maximum.
   *
   * With `levels = 2^bits - 1`, a depth `z` lies at `q(z) * levels` in code
   * units, where `q(z) = (1/near - 1/z) / (1/near - 1/far)`, and the code `k`
   * decodes to `1 / (1/near - (k/levels) * (1/near - 1/far))`. The gap between
   * adjacent codes grows with depth, so the widest cell the closed range
   * `[requiredNear, requiredFar]` touches is the one ending at, or containing,
   * `requiredFar`: codes `ceil(q(requiredFar) * levels) - 1` and that ceiling. A
   * range that ends exactly on `near` needs only code 0, which decodes exactly,
   * so it reports codes 0 and 0 and a step of 0.
   *
   * The report echoes every input, and its `status` is `invalid` for a negative
   * or non-finite time, a clip range that is not `0 < near < far` and finite, an
   * inverted or non-finite required range, a bit depth that is not a positive
   * integer whose level count is a safe integer, a maximum step that is not
   * finite and positive, or a step that does not evaluate to a finite
   * non-negative number; `outside-clipping-range` when the required range leaves
   * `[near, far]`; and otherwise `satisfied` when the step is at most the
   * maximum, equality included, else `insufficient-precision`. Only `satisfied`
   * sets `passed`.
   */
  export function evaluateAutoMovieCameraDepthPrecision(props: IAutoMovieEvaluateCameraDepthPrecision.IProps): IAutoMovieCameraDepthPrecisionReport {
    return evaluateAutoMovieCameraDepthPrecisionImplementation(props);
  }

  /**
   * Measure one cross-shot simultaneity claim on the production story clock.
   *
   * Each addressed event is taken at its realized shot-local time, mapped through
   * its own shot's pin by {@link AutoMovieEngineFilm.autoMovieStoryTime}, and the widest gap between
   * any two resulting story times is compared against the tolerance, inclusive.
   * Nothing here consults the edit: two shots cut minutes apart pass when their
   * pins put the events together, and two adjacent shots fail when their pins do
   * not.
   *
   * The verdict is refusable. An unpinned shot, a missing or non-finite
   * realization, or a story time that is not finite leaves an operand unresolved,
   * and the claim then fails with a summary naming the first such operand and
   * why, because a claim nobody can measure is not a claim that holds. An empty
   * event list fails too. Otherwise the summary names the earliest and latest
   * events, where a tie for latest names the later-listed event so a simultaneous
   * claim quotes two distinct events. Every point is reported in declared order
   * either way.
   */
  export function evaluateAutoMovieStorySync(props: IAutoMovieEvaluateStorySync.IProps): IAutoMovieStorySyncOutcome {
    return evaluateAutoMovieStorySyncImplementation(props);
  }

  /**
   * Measure one typed shot-contract predicate in the compiled artifacts at a
   * shot-local second and compare it with its declared value.
   *
   * A `joint-angle` predicate reads the actor's sampled pose: the joint's angle
   * on the named axis, or zero when the pose leaves that joint at rest. A
   * `position` predicate reads one world coordinate of its selector, and a
   * `distance` predicate the Euclidean distance in metres between two selectors.
   * `==` passes within `tolerance` either way, `<=` passes up to `value +
   * tolerance`, and `>=` from `value - tolerance`.
   *
   * A reference the reader cannot resolve, such as an absent node, a rig without
   * the named bone, an uncompiled motion, an absent landmark or an uncompiled
   * formation, records `actual: null` and fails. A non-finite derived measurement
   * and any exception during measurement become that same failed null result;
   * missing-reference errors are not distinguished from unexpected sampling
   * errors here, so this record alone cannot diagnose the underlying exception.
   * Predicate values, operators and tolerances are caller-admitted finite data.
   *
   * @param reader The subject reader of the grading call.
   * @param predicate The contract predicate to measure.
   * @param time Shot-local seconds to measure at.
   * @returns The predicate, the measured scalar or `null`, and whether it passed.
   */
  export function evaluateShotPredicate(reader: IAutoMovieShotContractSubjectReader, predicate: IAutoMovieShotPredicate, time: number): IAutoMovieCompiledPredicateResult {
    return evaluateShotPredicateImplementation(reader, predicate, time);
  }

  /**
   * The time segment of an interaction event id: shot-local seconds written with
   * `toFixed(6)` formatting, as in `hit:arrow:foe:1.250000`.
   *
   * Fixed precision keeps an id stable across producers that compute the same
   * numeric instant and keeps ordinary shot times readable. Distinct instants in
   * the same rounding bin collide; arbitrarily close instants can straddle a bin
   * boundary. Magnitudes at least 1e21 use exponent notation, and nonfinite
   * inputs retain their standard number spelling.
   */
  export function eventTimeKey(time: number): string {
    return eventTimeKeyImplementation(time);
  }

  /**
   * Fold a sampled pose root into a node's staged placement, giving the world
   * transform the viewer draws the actor's root at.
   *
   * The root is node-local: its translation is placed by the whole staged
   * transform, scale then rotation then translation, and its rotation follows the
   * staged rotation. Root scale is dropped, as Engine FK and the viewer drop it
   * (#1052), so the result keeps the staged scale. A null root means the actor
   * stands at its staged base, and `base` itself is returned.
   *
   * The rotation is exact when the staged scale is uniform, which staging gives
   * every actor; under a non-uniform staged scale the drawn root basis is
   * sheared, and the returned rotation and scale are its rotation-then-scale
   * reading.
   */
  export function foldRoot(base: IAutoMovieTransform, root: IAutoMovieTransform | null): IAutoMovieTransform {
    return foldRootImplementation(base, root);
  }

  /** Admit the generated stand-in rigs against the script's cast declarations. */
  export function forgeCast(script: IAutoMovieScript, forge: IAutoMovieForgePlan): IAutoMovieForgedCast {
    return forgeCastImplementation(script, forge);
  }

  /**
   * The FORGE consumer's object side: accept a prop an agent authored as data
   * (crude primitive proxy, rich meaning: body, affordances, self-declared
   * articulation, D011), returning the spec itself on success or every violation
   * of the contracts below at once. {@link forgeCast} forges the performers; this
   * forges the things they hold, open, and stack.
   *
   * The model contract: `model.id` equals `node` (the staged scene joins on it,
   * as for a forged cast member); `origin` is `"generated"`
   * unless the spec names a `modelRef`, in which case the imported appearance is
   * gated as below; and `skeleton` is `null`, because a riggable actor goes
   * through `forgeCast` and a prop's moving parts are articulation nodes, not
   * bones. `validateModel` covers parts, materials, extents, body (#595) and
   * affordances (#604), with paths remapped onto `$input.model`.
   *
   * An imported appearance needs a `modelRef`, origin `"imported"`, a
   * non-null `asset`, and a sealed closure: unique non-blank asset paths with
   * `sha256:` digests of 64 lowercase hex digits, the rigid `gltf-static-v1`
   * profile on the closure and every LOD with no humanoid bones, unique LOD
   * levels whose asset and digest match the sealed ledger, and a `hero` LOD
   * binding the model's own asset. Whether the reference resolves and the digests
   * match bytes on disk is the builder's check, since the engine holds neither
   * the registry nor the files.
   *
   * The articulation contract (when present): at least one joint; joint node ids
   * unique; parents resolving within the declared nodes (`null` is
   * the prop's root) without a cycle; each joint's optional `mesh` naming a part
   * of this prop's own model, and no part claimed by two joints; the binding
   * targeting the declared profile; every `boneMap` value naming a declared node;
   * and every semantic key the profile references ({@link profileSemanticKeys})
   * mapped. `bindProfile` would throw on the first missing key, so reporting all
   * of them lets one correction round see the whole list, and a spec that passes
   * binds without a throw.
   */
  export function forgeProp(spec: IAutoMoviePropSpec): IAutoMovieForgedProp {
    return forgePropImplementation(spec);
  }

  /**
   * One member's model-space vertical extent inside a compiled formation, in
   * metres above the slot it stands on.
   *
   * A formation stores where its members stand, not how tall they are: the
   * compiled bounds are the box of slot positions, so their vertical span is the
   * ground's, and a camera solved from it frames a crowd as a flat carpet. The
   * member's own model supplies the missing dimension, found by the runtime id
   * {@link productionRuntimeModelId} gives the formation's model group and
   * measured through {@link computeModelRestExtentY}, the read a node subject is
   * measured with, so a hero promoted out of the unit and its anonymous
   * neighbours are the same height by construction.
   *
   * Falls back to {@link DEFAULT_SUBJECT_HEIGHT} standing on the slot when the
   * group's runtime model is not among `models`, draws nothing, or measures
   * shorter than {@link MIN_MEASURED_SUBJECT_HEIGHT}, the same stand-in and
   * threshold a node subject takes.
   */
  export function formationMemberExtent(formation: Pick<IAutoMovieCompiledFormation, "model">, models: readonly IAutoMovieModel[] | undefined): IAutoMovieFormationMemberExtent.IResult {
    return formationMemberExtentImplementation(formation, models);
  }

  /**
   * The world-space box, in metres, that one formation's members occupy at a
   * shot-local instant.
   *
   * The unit's designed bounds go through {@link transformFormationBounds} under
   * the cue {@link sampleFormationMotion} reports at that instant, so a mass that
   * has marched, wheeled, or closed its ranks is framed where it is. Both reads
   * are the builder's own: the ground gate that refuses a member standing off its
   * staged surface asks the same two functions the same way, so a gate and a
   * camera cannot disagree about where a unit is. A time before 0 reads the unit
   * as it stands at 0.
   *
   * The transformed slot box is then widened on X and Z by the member radius the
   * compiler derived for LOD projection, ignored when negative, and its Y range
   * raised by the member's own extent, because the box of slot positions is a
   * footprint: the outermost member's body hangs over its edge and its head
   * stands above it.
   */
  export function formationSubjectBox(props: IAutoMovieFormationSubjectBox.IProps): IAutoMovieSubjectBox {
    return formationSubjectBoxImplementation(props);
  }

  /**
   * Restate a world box as the base, height and radius the framing grammar solves
   * from.
   *
   * `radius` is half the horizontal diagonal rather than half the wider side. A
   * camera approaches on its staged bearing and an `orbit` sweeps that bearing 45
   * degrees, so the horizontal span the frame must hold varies with the bearing,
   * and its widest value over every bearing is exactly the box's diagonal. The
   * diagonal bounds horizontal orthogonal projection at every bearing. It does
   * not alone prove full perspective enclosure through a camera move; camera
   * compilation and contract grading own their sampled view decisions.
   *
   * `base` is the box's bottom centre, not the members' centroid: a mass that is
   * denser on one flank has a centroid off its own middle. All three values are
   * in metres, and the box must be finite and ordered (`max >= min` on every
   * axis). If the ordinary half-diagonal overflows before halving, halved
   * coordinates recover a representable radius; ordinary finite results keep
   * their arithmetic order. Height and a genuinely unrepresentable radius can
   * still overflow, and callers own admission of those derived values.
   *
   * @param box World box of the subject, in metres.
   * @returns A new framed box sharing no object with `box`.
   */
  export function framedBoxOf(box: IAutoMovieSubjectBox): IAutoMovieFramedBox {
    return framedBoxOfImplementation(box);
  }

  /**
   * Seconds into a clip's stride cycle at `localTime`, or `null` when the clip
   * states no cycle to resume.
   *
   * A carried `gaitCycle` is authoritative: it is how a non-looping composite,
   * such as the film ladder's arranged performance, still knows its stride phase,
   * and the answer is `(phaseAt + localTime) mod period`. A cycle with a
   * non-positive or non-finite period, or a non-finite `phaseAt`, answers `null`
   * rather than a `NaN` phase. Without a cycle, a looping clip answers `localTime
   * mod duration`, the wrap the motion sampler applies, and a one-shot clip or a
   * looping clip of non-positive duration answers `null`. The phase is in `[0,
   * period)` seconds. `resolveBeatEnd` and `resolveBeatOpening` store it as an
   * actor's `gaitPhase`, which the next beat resumes mid-stride from.
   *
   * @param clip The validated clip the actor plays.
   * @param localTime Clip-local seconds at the instant being resumed from.
   * @returns The phase in seconds, or `null` when there is no cycle.
   */
  export function gaitPhaseOf(clip: IAutoMovieMotion, localTime: number): number | null {
    return gaitPhaseOfImplementation(clip, localTime);
  }

  /**
   * Gate the object clips a shot's source authored, so a moving thing that is not
   * a performer can reach a compiled shot.
   *
   * {@link builtOpeningPanelPlacements} promises that a door which swings on
   * screen is an `objectMotions` clip over the panel node ids it answers with,
   * and {@link IAutoMoviePropArticulation} promises that a prop's hinge is a
   * lowered joint a clip drives. Both are one thing, a node in the staged graph
   * turned over the shot's own clock: a building's panel is a staged set piece
   * (`<environment>/<element>`) and a prop's leaf is a lowered articulation joint
   * (`<placement>/<joint>`), so one channel serves both.
   *
   * Every clip first passes the transform-clip artifact rule with a channel gate
   * that refuses, each with its own path and reason:
   *
   * - A node no shot staged, or a joint no staged prop declares, because a clip
   *   addressing nothing would be stored and rendered as silence;
   * - A node a performance already drives, because a transform clip written over a
   *   rig would fight the pose every frame;
   * - A channel a baked clip already drives, and an id a baked clip or an earlier
   *   authored clip already carries, because each channel and each clip id has
   *   one authority;
   * - A key outside `[0, duration]`, which no frame reads;
   * - `cubicspline` interpolation, because a spline's tangents can overshoot a
   *   travel bound between two keys that both satisfy it, and nothing downstream
   *   clamps an object clip.
   *
   * A scene whose lowered graph carries one id twice is refused at the gate's
   * path, since no frame can be resolved for it. Only a prop `forgeProp` accepts
   * contributes joints; its own refusals belong to `forgeProp` and the placement
   * gate. When all of that passes and a staged prop binds an articulation
   * profile, the clips resolve through {@link resolveFrame} at time `0`, at every
   * authored key, at analytical quaternion-component extrema and just inside key
   * boundaries. Periodic direct curves share their first-cycle bound. Profiles
   * bind at their placement prefix, and a channel the clips drive past its
   * declared travel is reported once, naming the profile. A channel a clip does
   * not drive is never blamed, even if its rest pose breaches. An empty clip list
   * answers no violations. The critical clock bounds directly interpolated
   * components; it does not derive additional extrema for nonlinear channel-space
   * driver combinations.
   *
   * @param gate The clips, the staged scene and what the shot already drives.
   * @returns The violations, empty when every clip is admitted.
   */
  export function gateAuthoredObjectMotions(gate: IAutoMovieObjectMotionGate): IAutoMovieConstraintViolation[] {
    return gateAuthoredObjectMotionsImplementation(gate);
  }

  /**
   * Gate every action of a beat's performance against the staged world and sort
   * the list into the plan the later stages of `performShot` read.
   *
   * Each action, at `<base>[i]`, is checked for:
   *
   * - Its actor: an id or a non-empty list of distinct ids, each a staged node or
   *   camera, and a camera only for a `frame` action;
   * - Its timing: a start inside `[0, duration]`, a positive finite duration or
   *   `"auto"`, a span inside the shot, an `"auto"` span that is not empty
   *   because it starts at the shot's end, and a positive integer `repeat`.
   *
   * A `frame` action must also state a usable framing and move, name exactly one
   * staged camera, and frame a subject that resolves. Only a follow move admits
   * finite nonnegative aim lookahead seconds. Ordinary focus and focal length are
   * gated as lens intents. Timed focus pulls resolve after object motion is
   * available. The first camera a `frame` action names becomes the live camera,
   * and a second camera is refused, because a take has one live camera. Every
   * other action joins the stage list and is gated by
   * {@link gatePerformShotStageAction}. Violations go into the context's
   * collector; the plan can still contain actions with violations. performShot
   * consumes it only after the collector is clean.
   *
   * @param context The shot's staged tables and collector.
   * @param actions The performing action list, the revise pass's when present.
   * @returns The plan: live camera, stage list and its paths, and the jobs.
   */
  export function gatePerformShotActions(context: IAutoMovieEnginePerformShotGateContext, actions: readonly IAutoMovieActionCall[]): IAutoMovieEnginePerformShotActionPlan {
    return gatePerformShotActionsImplementation(context, actions);
  }

  /**
   * Refuse a performance that does not realize the beat's blocking.
   *
   * When the pipeline blocked the beat, the performance must play that plan and
   * not another: the same beat id, a duration within `1e-6` s of the blocked one,
   * every timing anchor covered by a stage action of its actor whose span
   * contains the anchor within `1e-9` s, and the blocked camera intent honoured
   * by the first frame move, its framing and its move. Without a frame move, only
   * a `static` intent is honoured, by the locked-off camera. Each failure is one
   * violation at the field that disagrees.
   *
   * @param context The shot's staged tables and collector.
   * @param blocking The beat's validated blocking.
   * @param stageActions The non-`frame` actions, before any injected recoil.
   * @param frames The frame jobs, already sorted by start.
   */
  export function gatePerformShotBlocking(context: IAutoMovieEnginePerformShotGateContext, blocking: IAutoMovieBlocking, stageActions: readonly IAutoMovieActionCall[], frames: readonly IAutoMoviePerformShotFrameJob[]): void {
    gatePerformShotBlockingImplementation(context, blocking, stageActions, frames);
  }

  /**
   * Settle the shot's cameras once the live one is elected: fall back to a camera
   * when no `frame` action elected one, gate the blocking's coverage angles, and
   * gate every camera a move is compiled from.
   *
   * 1. Without an elected camera, the scene's first camera is live and locked off; a
   *    scene with no camera cannot be framed.
   * 2. Each coverage intent must name a staged camera that is neither the live
   *    camera nor one an earlier intent named, state a usable framing and move,
   *    and favour a subject that resolves; a coverage camera never becomes a
   *    second live camera.
   * 3. The live camera, when a `frame` action moves it, and every coverage camera
   *    must have a vertical field of view in `(0, 180)` degrees and a finite
   *    position, because the framing solve divides by `tan(fovY / 2)`; a camera
   *    whose move is a `whip` must also carry a finite rotation, since a whip
   *    pans from it. An unused degenerate camera fails nothing.
   *
   * @param context The shot's staged tables and collector.
   * @param props.liveCamera The camera the frame actions elected, or null.
   * @param props.frames The frame jobs of the live camera.
   * @param props.coverage The blocking's coverage intents, or none.
   * @returns The live camera id, null only when the scene has no camera, and the
   *   coverage jobs that passed.
   */
  export function gatePerformShotCamera(context: IAutoMovieEnginePerformShotGateContext, props: IAutoMovieGatePerformShotCamera.IProps): IAutoMovieGatePerformShotCamera.IResult {
    return gatePerformShotCameraImplementation(context, props);
  }

  /**
   * Sort the live camera's frame moves by start, in place, and refuse moves that
   * double-book the camera.
   *
   * Two moves starting within `1e-9` s of each other are one `range` violation at
   * the later move's `start`, asking for one framing per instant. An explicit
   * duration that runs, clipped to the shot, more than `1e-9` s past the next
   * move's start is another. An `"auto"` duration yields to the next move by
   * definition, so it never overlaps. The sorted order is the one the blocking
   * gate, the camera compile and `cameraIntent` read.
   *
   * @param context The shot's staged tables and collector.
   * @param frames The frame jobs; sorted in place by `action.start`.
   */
  export function gatePerformShotFrameOverlaps(context: IAutoMovieEnginePerformShotGateContext, frames: IAutoMoviePerformShotFrameJob[]): void {
    gatePerformShotFrameOverlapsImplementation(context, frames);
  }

  /**
   * Refuse two overlapping actions of one actor whose clips, after their region
   * masks, author the same channel.
   *
   * Region names are only mask policy: a `fullBody` gait that authors legs and
   * arms shares nothing with a head-only `lookAt`, but does collide with an arm
   * gesture. So each overlapping pair is compared by the content its synthesized
   * clip actually carries: the bones its region keeps, the root when the actor
   * has a single region or the action is `lowerBody` or `fullBody`, and the
   * expression for a `face` action. Two actions overlap when one starts more than
   * `1e-9` s before the other ends. A shared channel is one `range` violation at
   * the later action's `start`, listing `root`, the shared bones in code-unit
   * order, and `expression`.
   *
   * Synthesis only follows a clean input gate, so the check is skipped for every
   * actor once the collector holds a violation: a malformed request must return
   * its located violations rather than reach a throwing synthesizer.
   *
   * @param context The shot's staged tables and collector.
   * @param actions The performing action list; `frame` actions are ignored.
   * @param synthesize The shot's memoized synthesizer, shared with the compile.
   */
  export function gatePerformShotRegionOverlaps(context: IAutoMovieEnginePerformShotGateContext, actions: readonly IAutoMovieActionCall[], synthesize: IAutoMovieActionSynthesizer): void {
    gatePerformShotRegionOverlapsImplementation(context, actions, synthesize);
  }

  /**
   * Gate the verb-specific fields of one non-`frame` action, and record the
   * `launch` and `attachTo` jobs that pass.
   *
   * Per verb, at `<base>[i]`:
   *
   * - `locomote`: a gait the actor's own context lists, when gaits were supplied,
   *   and a non-relative destination that resolves at the action's start and
   *   leaves each staged actor horizontal travel, since a vertical-only move is
   *   not a walk.
   * - `launch`: a positive finite speed, an `onHit` force in `[0, 1]`, a staged
   *   projectile that is not one of the launching actors, an aim that resolves
   *   and is not the projectile itself; `onHit` needs a node or bone aim naming a
   *   staged scene node, because a point or group identifies no struck actor and
   *   a camera cannot perform the injected recoil.
   * - `enact`: a nonblank authored clip id for the host to resolve.
   * - `react`: a force in `[0, 1]` and a blow source that resolves, because the
   *   reference synthesizer otherwise snaps the body back as if struck from the
   *   front.
   * - `emote`: an intensity in `[0, 1]`.
   * - `lookAt` and `reach`: a target that resolves; `reach` also needs a rig whose
   *   elbow can bend the named arm.
   * - `point` and `strike` gestures: a right arm that can bend, because the
   *   reference synthesizer solves that arm, and an aim that resolves.
   * - `attachTo`: a child distinct from its rigged parent, a bone on that rig and,
   *   when supplied, an offset with a finite position and a unit rotation.
   * - `hold`: nothing beyond the shared checks.
   *
   * An unbendable arm is refused here because the synthesizer answers such a verb
   * with `null` and the builder skips a `null` clip, so the shot would otherwise
   * succeed having performed nothing.
   *
   * @param context The shot's staged tables and collector.
   * @param plan The plan being built; passing launches and attachments join it.
   * @param action The non-`frame` action.
   * @param actors The actor ids the action names.
   * @param index Position of the action in the performing action list.
   */
  export function gatePerformShotStageAction(context: IAutoMovieEnginePerformShotGateContext, plan: IAutoMovieEnginePerformShotActionPlan, action: Exclude<IAutoMovieActionCall, { verb: "frame" }>, actors: readonly string[], index: number): void {
    gatePerformShotStageActionImplementation(context, plan, action, actors, index);
  }

  /**
   * File film-grammar findings as visual review notes on one beat.
   *
   * Each diagnostic becomes one `visual`-tier note, in input order, whose `issue`
   * reads `<code>: <fact>; <impact>` and whose `suggestion` is the diagnostic's
   * `recovery`. The note shape has no severity or shot field, so `severity`,
   * `shot` and `previousShot` are not carried: the caller passes the findings of
   * one shot or its incoming cut, so `beat` locates the note, and an `"error"`
   * finding files at the same tier as a `"warning"`. `reviewVisualRead` puts
   * these notes ahead of its own framing, contact and silhouette notes.
   *
   * @returns One new note per diagnostic, in the same order.
   */
  export function grammarDiagnosticsToReviewNotes(props: IAutoMovieGrammarDiagnosticsToReviewNotes.IProps): IAutoMovieReviewNote[] {
    return grammarDiagnosticsToReviewNotesImplementation(props);
  }

  /**
   * The four scripted-cue events one `attachTo` handoff emits: the child is
   * grabbed and attached at `start`, then detached and released at `end`.
   *
   * Every event names the child as both `actor` and `object` and the parent as
   * `target`, carries no contact point or reaction, and records `actionIndex`,
   * the authored action's index, so a reader can trace it back. Its id is
   * `<kind>:<child>:<parent>:<time>` with the time written by
   * {@link eventTimeKey}. Repeated participant pairs in one formatted time bin
   * collide, and participant ids containing colons can make the delimiter join
   * ambiguous; this constructor does not enforce uniqueness. Times are shot-local
   * seconds. {@link coupleObjects} calls this once per handoff it bakes; a staged
   * mount emits no events at all.
   *
   * @param child Coupled child node id.
   * @param parent Parent node id whose bone carries the child.
   * @param start Shot-local second the child is grabbed and attached.
   * @param end Shot-local second the child is detached and released.
   * @param actionIndex Index of the authored `attachTo` action.
   * @returns Four new events in grab, attach, detach, release order.
   */
  export function handoffEvents(child: string, parent: string, start: number, end: number, actionIndex: number): IAutoMovieInteractionEvent[] {
    return handoffEventsImplementation(child, parent, start, end, actionIndex);
  }

  /**
   * One shot's lights at one shot-local instant, with the production's sources
   * inherited at the story moment the shot's pin places that instant at.
   *
   * With no production lighting, or for a shot carrying no story pin, the staged
   * lights come back unchanged in a new array, element by element. A film that
   * says nothing about production light therefore renders the frames it always
   * did, and an unpinned shot is never assigned a story moment it did not claim.
   *
   * Otherwise the production is resolved at `autoMovieStoryTime(pin, seconds)`
   * and merged by light id:
   *
   * - A staged light whose id a production source shares is replaced in place by
   *   that source, so the scene says which of the production's lights it stands
   *   under and the production owns the values.
   * - A production source no staged light names is appended after the staged
   *   lights, in declaration order, so a film states its source once instead of
   *   every scene re-declaring it.
   *
   * The current production assembly caller evaluates this helper once at shot
   * time zero. The result is an opening snapshot, not a continuously resampled
   * production-light track; the shot's own lightMotions subsequently animate that
   * snapshot. Returned light objects are staged or resolved objects themselves,
   * not copies.
   */
  export function inheritProductionLighting(props: IAutoMovieInheritProductionLighting.IProps): IAutoMovieLight[] {
    return inheritProductionLightingImplementation(props);
  }

  /**
   * Appends every film-grammar finding of one cut to `diagnostics`, filed on the
   * incoming shot, in this order: axis crossing, eyeline, jump cut, displacement
   * re-establishing, screen direction, then entrant re-establishing.
   *
   * The axis finding needs both shots to state the same action axis, neither to
   * cross it visibly, and the camera to stand on opposite sides at the two
   * boundaries. The eyeline finding needs the incoming primary subject's gaze to
   * reverse or continue the outgoing one, and reads the wrong screen relation.
   * The jump-cut, displacement and screen-direction findings need both shots to
   * share their primary subject: a same measured size with a camera-bearing
   * change below the angle threshold, a subject displacement beyond the distance
   * threshold into a shot that is not wide, or a reversed horizontal screen
   * motion. The entrant finding names the first subject in id order that the
   * outgoing shot did not observe, when the incoming shot is measured and not
   * wide and no displacement finding was filed.
   *
   * @param diagnostics Finding list of the read, appended to in filing order.
   * @param previous Normalized outgoing shot of the cut.
   * @param incoming Normalized incoming shot of the cut.
   * @param sizeOf Measured size of a shot at a boundary; the read memoizes it.
   * @param thresholds Smallest non-jump bearing change in degrees and largest
   *   displacement in metres that needs no wide shot.
   */
  export function inspectGrammarCut(diagnostics: IAutoMovieGrammarDiagnostic[], previous: IAutoMovieNormalizedGrammarShot, incoming: IAutoMovieNormalizedGrammarShot, sizeOf: (
    shot: IAutoMovieNormalizedGrammarShot,
    boundary: "start" | "end",
  ) => AutoMovieInspectGrammarCutFraming, thresholds: IAutoMovieInspectGrammarCut.IThresholds): void {
    inspectGrammarCutImplementation(diagnostics, previous, incoming, sizeOf, thresholds);
  }

  /**
   * Whether a world-space axis-aligned box intersects a perspective-camera
   * frustum under finite, ordered geometry and a valid lens.
   *
   * Both bodies are convex, and two convex polyhedra meet exactly when an edge of
   * one meets the other: every vertex of the intersection is a vertex of one body
   * lying inside the other, or a crossing of one body's edge with the other's
   * face, and each of those puts some edge of one body inside the other. So the
   * twelve box edges are clipped against the frustum's six half-spaces, and the
   * twelve frustum edges against the box's three slabs. Neither half alone is the
   * answer: a box small enough to sit inside the frame is found only by the
   * first, and a frustum that pierces a mass far wider than itself, a camera
   * standing inside a crowd or above one, only by the second. Touching counts as
   * meeting, and a malformed crop throws the `RangeError` of
   * {@link deliveryCropNdc}.
   *
   * This is what a required subject with a real extent is judged against in
   * `realizeShotContract`. A segment through one point cannot answer for a mass:
   * it reports a crowd absent whenever the frame holds its flank instead of its
   * middle, and present whenever that one point is on screen no matter where the
   * rest of the unit stands.
   *
   * @param props.camera Camera placement, looking down its local −Z.
   * @param props.min Minimum world corner of the box, in metres.
   * @param props.max Maximum world corner of the box, in metres.
   * @param props.near Near clip depth in metres.
   * @param props.far Far clip depth in metres.
   * @param props.halfY Vertical half-field tangent, `tan(fovY / 2)`.
   * @param props.aspect Frame width over height.
   * @param props.crop Delivery crop, or the whole gate when omitted.
   * @returns True when the box and the frustum share at least one point.
   */
  export function intersectsPerspectiveFrustumBox(props: IAutoMovieIntersectsPerspectiveFrustumBox.IProps): boolean {
    return intersectsPerspectiveFrustumBoxImplementation(props);
  }

  /**
   * Whether a world-space segment intersects a perspective-camera frustum.
   *
   * The frustum is the intersection of six half-spaces, so it is convex and the
   * segment is clipped against them one plane at a time in its own parameter.
   * Each plane is linear in camera-local coordinates, which gives algebraic
   * crossings rather than chosen samples. This is why the helper exists: a close
   * shot frames the band between roughly 0.71 and 0.99 of a subject's height, so
   * neither end of the subject is on screen while its middle fills the frame.
   * Testing chosen points, the base, the top or the midpoint, reports such a
   * subject absent; clipping finds it. Touching a face counts as meeting it, and
   * a malformed crop throws the `RangeError` of {@link deliveryCropNdc}.
   *
   * @param props.camera Camera placement, looking down its local −Z.
   * @param props.from Segment start in world metres.
   * @param props.to Segment end in world metres.
   * @param props.near Near clip depth in metres.
   * @param props.far Far clip depth in metres.
   * @param props.halfY Vertical half-field tangent, `tan(fovY / 2)`.
   * @param props.aspect Frame width over height.
   * @param props.crop Delivery crop, or the whole gate when omitted.
   * @returns True when some point of the segment lies inside or on the frustum.
   */
  export function intersectsPerspectiveFrustumSegment(props: IAutoMovieIntersectsPerspectiveFrustumSegment.IProps): boolean {
    return intersectsPerspectiveFrustumSegmentImplementation(props);
  }

  /**
   * Whether a world-space sphere may intersect a perspective-camera frustum.
   *
   * The sphere's centre is brought into the camera frame and its signed distance
   * to each of the six planes compared with the radius. Each side plane passes
   * through the lens, and its distance is normalized by the plane's own `hypot(1,
   * tangent)`, so callers must not approximate the radius by padding projected
   * NDC coordinates. Like every plane-by-plane sphere test this is conservative
   * near the frustum's edges and corners: a sphere just outside a corner yet
   * within `radius` of both adjacent planes answers true. Under exact-real
   * arithmetic the geometric approximation errs toward visible: the viewer's
   * formation culling keeps such a member drawn, and `measureAutoMovieGeometry`
   * counts it as visible. A non-finite or negative radius answers false. A
   * malformed crop throws the RangeError of deliveryCropNdc only if radius and
   * depth checks reach the side planes; an earlier false result skips that
   * conversion. Finite centres, valid lens scalars, nearly unit camera rotation
   * and representable intermediate products are premises; boundary rounding is
   * not certified.
   *
   * @param props.camera Camera placement, looking down its local −Z.
   * @param props.center Sphere centre in world metres.
   * @param props.radius Sphere radius in metres.
   * @param props.near Near clip depth in metres.
   * @param props.far Far clip depth in metres.
   * @param props.halfY Vertical half-field tangent, `tan(fovY / 2)`.
   * @param props.aspect Frame width over height.
   * @param props.crop Delivery crop, or the whole gate when omitted.
   * @returns False only when the sphere is wholly outside some frustum plane.
   */
  export function intersectsPerspectiveFrustumSphere(props: IAutoMovieIntersectsPerspectiveFrustumSphere.IProps): boolean {
    return intersectsPerspectiveFrustumSphereImplementation(props);
  }

  /**
   * Whether a camera-local segment meets a perspective frustum, its faces
   * included.
   *
   * Both ends are already in the camera's frame, looking down −Z with +Y up, so a
   * caller testing many segments of one body transforms each corner once rather
   * than once per segment. The frustum is bounded by the `near` and `far` depths
   * and by the side planes through the lens and the crop's NDC edges at `halfX`
   * and `halfY` tangents. A segment touching a face counts as meeting it.
   *
   * @param props.from Segment start in camera-local metres.
   * @param props.to Segment end in camera-local metres.
   * @param props.near Near clip depth in metres, in front of the lens.
   * @param props.far Far clip depth in metres, beyond `near`.
   * @param props.halfX Horizontal half-field tangent, `tan(fovY / 2) · aspect`.
   * @param props.halfY Vertical half-field tangent, `tan(fovY / 2)`.
   * @param props.crop The delivery crop in NDC, from {@link deliveryCropNdc}.
   * @returns True when some point of the segment lies inside or on the frustum.
   */
  export function localSegmentMeetsPerspectiveFrustum(props: IAutoMovieLocalSegmentMeetsPerspectiveFrustum.IProps): boolean {
    return localSegmentMeetsPerspectiveFrustumImplementation(props);
  }

  /**
   * Stamp beat-scoped feedback onto the screenplay graph: every violation
   * produced while working `beatId` gains `node`, the id of the beat node that
   * claims it, so `scriptAncestors` can cascade it up the refinement chain.
   *
   * When the tree is absent or no beat node claims `beatId`, the result is a
   * shallow copy of the input list with no stamp. Otherwise each violation is
   * copied with `node` set, replacing any `node` it already carried. The input
   * list and its violations are never mutated.
   *
   * @param violations Feedback produced while working the beat.
   * @param tree The script's refinement tree, or nothing when it has none.
   * @param beatId Flat script beat id the feedback belongs to.
   * @returns A new list of the same length and order.
   */
  export function locateOnBeat(violations: readonly IAutoMovieConstraintViolation[], tree: readonly IAutoMovieScriptNode[] | null | undefined, beatId: string): IAutoMovieConstraintViolation[] {
    return locateOnBeatImplementation(violations, tree, beatId);
  }

  /**
   * The rotation that points a camera's −Z down `direction` while keeping its
   * horizon level.
   *
   * A shortest-arc rotation from −Z rolls the frame on an off-axis aim; this one
   * builds the standard look-at basis instead, with camera `+Z = −direction`, `x
   * = up × z` and `y = z × x`, so the camera's local X stays horizontal. When the
   * normalized aim's cross product with up has length below `1e-6`, world `+Z` is
   * the reference and the roll is whatever that reference gives. A zero direction
   * states no aim and answers the identity, the camera's rest orientation looking
   * down −Z with a level horizon. Finite direction length does not matter; finite
   * inputs yield a unit quaternion up to rounding, while a non-finite component
   * yields a non-finite result.
   *
   * @param direction World-space direction to look along, any non-zero length.
   * @returns The camera's world rotation.
   */
  export function lookRotation(direction: IAutoMovieVector3): IAutoMovieQuaternion {
    return lookRotationImplementation(direction);
  }

  /**
   * The framing a shot's primary subject measures as at one edited boundary, or
   * null when the shot has no primary subject, the subject's base or top is not
   * in front of the camera, or its derived occupancy is non-finite or
   * negligible.
   *
   * The subject's frame occupancy is the larger of two fractions: its projected
   * height over the frame height, and its horizontal radius over the half-width
   * the frame spans at the subject's depth. `classifyGrammarShotSize` turns that
   * fraction into the nearest framing.
   *
   * @param shot Normalized shot whose primary subject is measured.
   * @param boundary Which edited boundary's camera and subject point to read.
   * @returns The measured framing, or null when it cannot be measured.
   */
  export function measureGrammarShotSize(shot: IAutoMovieNormalizedGrammarShot, boundary: "start" | "end"): IAutoMovieCameraIntent["framing"] | null {
    return measureGrammarShotSizeImplementation(shot, boundary);
  }

  /**
   * The world-axis-aligned bound of a supplied model-space subject box.
   *
   * The eight corners of extent go through placeTransformedPoint and their
   * axis-aligned range encloses the transformed input box, assuming finite
   * transform arithmetic. This bounds the portable parts or proxies that the
   * input represents; it does not inspect external asset bytes or renderer-only
   * deformation.
   *
   * `performShot` frames a node subject from this box, `realizeShotContract` and
   * the camera-clearance reports grade the same subject from it, and the
   * production film-grammar pass reads it too, so a camera solved to hold a mass
   * is tested against the mass it was solved for.
   *
   * An extent whose X and Z endpoints are all zero is treated as a point with a
   * height, the shape nodeSubjectExtent returns when nothing could be measured,
   * and goes to pointSubjectBox: only the placement's translation applies by the
   * stand-in boxing policy. This shape test also catches measured vertical
   * segments, so their rotation and scale are ignored here; it does not
   * distinguish them from unmeasured subjects.
   *
   * @param placement The node's world transform.
   * @param extent The model-space box of what the node draws, in metres.
   * @returns A new world box in metres.
   */
  export function nodeSubjectBox(placement: IAutoMovieTransform, extent: IAutoMovieSubjectBox): IAutoMovieSubjectBox {
    return nodeSubjectBoxImplementation(placement, extent);
  }

  /**
   * The model-space box a node subject is framed and graded from: its supplied
   * portable rest extent when measured, otherwise the horizontally degenerate
   * segment of its rig span or stand-in height. External asset bytes and
   * renderer-only deformation are not measured by this rule.
   *
   * `extent` is the drawn box `computeModelRestExtent` measured, or null when the
   * model measured nothing; `rigHeight` is the joint span standing in for it, or
   * null when there is no rig either. Without an extent the result is a segment
   * on the node's own vertical axis from `y = 0`, exactly zero wide, which
   * `nodeSubjectBox` recognizes as unmeasured.
   *
   * A height below {@link MIN_MEASURED_SUBJECT_HEIGHT} is replaced by
   * {@link DEFAULT_SUBJECT_HEIGHT}. A measured model keeps its own floor and its
   * own width even then: a plaza slab 60 m across and 20 mm thick is a real
   * horizontal extent even where its vertical one is unusable. The result is
   * stated once because `performShot` measures a node for the framing solve and
   * `realizeShotContract` measures it again for the grade.
   *
   * @param extent Measured model-space box in metres, or null.
   * @param rigHeight Rig joint span in metres, or null.
   * @returns The model-space box to frame and grade, in metres.
   */
  export function nodeSubjectExtent(extent: IAutoMovieSubjectBox | null, rigHeight: number | null): IAutoMovieSubjectBox {
    return nodeSubjectExtentImplementation(extent, rigHeight);
  }

  /**
   * Validates one shot observation and returns it in the canonical form the
   * film-grammar read inspects.
   *
   * Throws an `Error` naming the offending field at the first defect, in this
   * order: a duration that is not finite and positive; at each camera boundary, a
   * field of view outside `(0, 180)`, an aspect that is not finite and positive,
   * or a non-finite or missing position or rotation component; then per subject
   * in id order, a repeated id, a non-finite or missing point component, a height
   * that is not finite and positive, a radius that is negative or not finite, or
   * a non-finite eyeline point; a primary subject that is not observed; an action
   * axis that repeats or misses an observed subject; and repeated style intents.
   *
   * @param input One observed shot as the production grammar pass built it.
   * @returns A new record whose subjects are sorted and indexed by id and whose
   *   axis endpoints are sorted; the camera and subject objects are shared with
   *   `input`, not copied.
   */
  export function normalizeGrammarShot(input: IAutoMovieGrammarShotObservation): IAutoMovieNormalizedGrammarShot {
    return normalizeGrammarShotImplementation(input);
  }

  /**
   * Fold one beat's action calls into an {@link IAutoMovieShot} through
   * {@link compilePerformance}, gating both sides of the seam.
   *
   * The performing list is `revise.final` when the revise pass produced one and
   * `draft` otherwise. The stages run in order, and the first stage group that
   * reports a violation returns every violation of that group and stops:
   *
   * 1. Input: unique script beat ids, the shot's `lightMotions` against the staged
   *    lights and its polygon body cues against staged rigs, flame cues by
   *    {@link admitPerformShotFlames}, a planned beat, a positive duration,
   *    authored editorial markers, every action by {@link gatePerformShotActions},
   *    the live camera's moves by {@link gatePerformShotFrameOverlaps}, same-actor
   *    content overlaps by {@link gatePerformShotRegionOverlaps}, the blocking by
   *    {@link gatePerformShotBlocking}, the cameras by
   *    {@link gatePerformShotCamera}, and then practical surface and surface
   *    graphic tracks against the staged nodes, the registered models and the
   *    live camera that gate chose by {@link admitPerformShotSurfaces}, so a feed
   *    of the shot's own camera is an authoring finding.
   * 2. Launches: each flight is solved and its recoil scheduled by
   *    {@link compilePerformShotLaunches}.
   * 3. Performance: the stage list compiles, stance feet are planted by
   *    {@link plantPerformShotStanceFeet}, every channel a region mask would drop
   *    is reported at the author's `region` (or `onHit`) field, and every clip
   *    must pass `validateMotion` against its rig, both by
   *    {@link gatePerformShotCompiledMotions}.
   * 4. Coupling: per-beat `attachTo` handoffs and staged mounts are baked by
   *    {@link coupleObjects}.
   * 5. Authored object clips are gated by {@link gateAuthoredObjectMotions}.
   * 6. Practical lights bind staged emitters to the final object clips and share
   *    light channel admission with authored clips.
   * 7. Cameras: the live camera's move and each coverage take compile through the
   *    framing grammar, subjects measured by
   *    {@link createPerformShotSubjectFramer}, and any physical clearance envelope
   *    is checked by {@link compileCameraClearanceReports}.
   *
   * A shot with no frame action is locked off on the scene's first camera.
   * Positional targets resolve against every staged placement, cameras included,
   * so an actor may look down the lens, but a camera performs only frame. Only a
   * camera subject may name a formation. The assembled artifact is checked
   * independently and a failure throws as a compilation defect. This does not
   * prove every possible authored failure was located earlier: typed outer
   * containers, generated event-id collisions, mutable callbacks and downstream
   * arithmetic remain distinct exception boundaries.
   */
  export function performShot(props: IAutoMoviePerformShotProps): IAutoMoviePerformedShot {
    return performShotImplementation(props);
  }

  /**
   * The shot-local interval one action occupies, `[start, end]` in seconds.
   *
   * An `"auto"` duration fills to the shot's end; a numeric one ends at `start +
   * duration`, clipped to the shot's end. The action's timing is assumed already
   * gated, so `start` lies inside the shot.
   *
   * @param action The gated action.
   * @param shotDuration The shot's length in seconds.
   * @returns The action's start and end, shot-local seconds.
   */
  export function performShotActionSpan(action: IAutoMovieActionCall, shotDuration: number): [number, number] {
    return performShotActionSpanImplementation(action, shotDuration);
  }

  /**
   * The actor ids one action names, as a list.
   *
   * A single id becomes a one-element list and an id list is returned as given;
   * any other value, which the action gate refuses, yields an empty list so the
   * later checks have nothing to iterate. The ids are not validated here.
   *
   * @param action The action as authored.
   * @returns The actor ids, the action's own array when it named a list.
   */
  export function performShotActors(action: IAutoMovieActionCall): string[] {
    return performShotActorsImplementation(action);
  }

  /**
   * Apply one TRS transform to a point: scale per axis, then rotate, then
   * translate, the order a renderer applies a node's transform in.
   *
   * Exported because the same arithmetic places a model's parts for measurement
   * in `computeModelRestExtent` and carries a measured model box out into the
   * world a camera frames it in through {@link nodeSubjectBox}. A second copy is
   * how the box a shot is graded against comes to disagree with the box it was
   * solved from. The rotation is used as given, so a non-unit quaternion distorts
   * the point rather than rotating it.
   *
   * @param transform The transform to apply.
   * @param point The point in the transform's local frame.
   * @returns A new point in the parent frame.
   */
  export function placeTransformedPoint(transform: IAutoMovieTransform, point: IAutoMovieVector3): IAutoMovieVector3 {
    return placeTransformedPointImplementation(transform, point);
  }

  /**
   * Pin the stance feet of every gait-bearing or resumed actor clip, replacing
   * the clip in `motions` and returning the world-space plants a later beat can
   * resume.
   *
   * An actor is planted when its clip carries a gait cycle or the previous beat
   * left it opening plants, and it has a rig and a staged node; a static gesture
   * or hold clip keeps its authored key grid. Opening plants are converted from
   * scene world space into the actor's model frame for the solve, and the new
   * plants back into world space, exactly once. With a scene space, its world
   * ground height is carried into the model frame for contact; otherwise the
   * model-space `y = 0` plane is the ground. The conversion assumes the
   * unit-scale, yaw-only actor transform `stageScene` emits. A rig with no
   * recognized foot plants nothing, and its clip is left untouched so a host's
   * own plant measurements are not shadowed. Actors are processed in code-unit
   * order of their ids, which is the order of the returned entries.
   *
   * Shot admission checks scoped actors' sampled root positions and opening pins
   * against their named surfaces. When a grounded window contains a full gait
   * cycle and resolves a foot over eligible support, a plant or the gait's
   * model-ground origin must meet that support. Window changes appear at exact
   * seconds on the sample clock. Empty windows hand grounding to the authored
   * carrier or airborne action and do not plant against the scene-wide surface.
   *
   * @param props.staged The validated stage result.
   * @param props.motions The compiled clips by node id; planted clips replace
   *   theirs.
   * @param props.previous The prior beat's end state, or null.
   * @param props.skeleton Rig lookup; null for a node with no skeleton.
   * @param props.jointAxes Per-node joint axes the renderer uses, when supplied.
   * @param props.restFrames Per-node rest frames the renderer uses, when
   *   supplied.
   * @param admission Shot duration in seconds and collector for explicit support.
   *   Omission retains ordinary unscoped planting.
   * @returns One entry per planted actor, plants in world metres.
   */
  export function plantPerformShotStanceFeet(props: IAutoMoviePlantPerformShotStanceFeet.IProps, admission?: {
    duration: number;
    out: IAutoMovieViolationAppendSink;
  }): IAutoMoviePerformedShot.ISuccess["plants"] {
    return plantPerformShotStanceFeetImplementation(props, admission);
  }

  /**
   * The stance plant each foot holds at `localTime`, the contact the next beat
   * keeps that foot on.
   *
   * For admitted finite times and stance bounds, a plant is held when `start <=
   * localTime <= end`, both bounds inclusive. When one foot has several held
   * plants, the one with the latest `start` wins, and a later entry wins an
   * equal-start tie. Feet appear in the order their first held plant appears in
   * `plants`, and each returned plant is the input object itself. `undefined`
   * plants, meaning no plant data was supplied, and a cut where no plant is held
   * both answer `null`. `resolveBeatEnd` and `resolveBeatOpening` store the
   * result as an actor's `footPlants`. This selector does not itself validate
   * interval values; NaN comparisons do not establish the stated containment
   * rule.
   *
   * @param plants Stance runs on the ended beat's local clock, or `undefined`.
   * @param localTime The cut instant on the same clock, in seconds.
   * @returns At most one plant per foot, or `null` when none is held.
   */
  export function plantsAtEnd(plants: readonly IAutoMovieBeatEndFootPlant[] | undefined, localTime: number): IAutoMovieBeatEndFootPlant[] | null {
    return plantsAtEndImplementation(plants, localTime);
  }

  /**
   * A forward-only playback resolver for a non-decreasing query clock, turning
   * repeated random-access searches into one sweep over frames and entries.
   *
   * Entry starts never decrease for a sequence that passed `cutSequence`; a
   * transition as long as the previous entry's played span makes two adjacent
   * starts equal, and the timeline tiles `[0, runtime)` with no gaps. The cursor
   * advances while the next entry's `start <= seconds`, so among equal starts it
   * lands on the highest index, the last entry whose span contains the instant,
   * which is the same live entry {@link resolveFromTimeline}'s binary search
   * picks; both build the sample with {@link playbackSampleAt}, so the samples are
   * identical.
   *
   * The returned function keeps the live index between calls. Passing a time
   * earlier than the previous call does not move the cursor back and returns a
   * wrong sample; use {@link resolveFromTimeline} for random access.
   * `playbackFrameSamples` drives it once per output frame in order.
   *
   * @param sequence The sequence the timeline was built from.
   * @param timeline The timeline of `sequence`, from `sequenceTimeline`.
   * @returns A resolver from output seconds to the on-screen sample.
   */
  export function playbackCursor(sequence: IAutoMovieSequence, timeline: IAutoMoviePlaybackTimeline): (seconds: number) => IAutoMoviePlaybackSample {
    return playbackCursorImplementation(sequence, timeline);
  }

  /**
   * Locate the last prepared playback entry starting at or before the output
   * second, or strictly before with `includeStart` false.
   *
   * A nonempty admitted layout has nondecreasing starts. Equal starts select the
   * latest entry, as the forward playback cursor does. Before the first start,
   * returns the first entry.
   */
  export function playbackEntryAt(entries: readonly IAutoMoviePlaybackEntry[], seconds: number, includeStart?: boolean): IAutoMoviePlaybackEntry {
    return playbackEntryAtImplementation(entries, seconds, includeStart);
  }

  /**
   * The shot-local second an entry shows at an output second: its offset plus its
   * playback rate, 1 when omitted, times the output seconds since its start.
   *
   * The map is affine and defined at any output second, so a caller may read an
   * entry's clock at sub-frame instants inside its span. It does not check that
   * the instant lies in the entry's span.
   *
   * @param entry An entry of a playback timeline.
   * @param seconds Output-clock seconds.
   * @returns Shot-local seconds.
   */
  export function playbackEntryTime(entry: IAutoMoviePlaybackEntry, seconds: number): number {
    return playbackEntryTimeImplementation(entry, seconds);
  }

  /**
   * The whole film as one on-screen sample per output frame.
   *
   * There are `round(runtime × fps)` frames sampled at `i / fps`, the same
   * schedule as the render plan's frameTimes. For a feasible nonempty frame
   * population, the final scheduled instant precedes runtime up to floating
   * rounding. A render host drives its per-frame capture from this list: pose the
   * live shot's scene at `time`, blend the outgoing tail when a dissolve is in
   * flight, and write the frame. A non-finite or non-positive `fps` throws an
   * `Error`, and {@link sequenceTimeline} throws for a sequence it cannot lay out,
   * such as an empty one or an unknown shot. Frame storage is uncapped; an
   * excessive count can exceed Array.from's allocation limits.
   *
   * @param sequence The cut to play.
   * @param shots The compiled shots the cut references.
   * @returns One sample per output frame, in frame order.
   */
  export function playbackFrameSamples(sequence: IAutoMovieSequence, shots: IAutoMovieShot[]): IAutoMoviePlaybackSample[] {
    return playbackFrameSamplesImplementation(sequence, shots);
  }

  /**
   * The shots a picture of a sequence draws at one output instant, outgoing
   * first, each with its compositing weight.
   *
   * The live entry and the sample are those `resolveFromTimeline` gives, so they
   * equal what `playbackCursor` gives in a forward sweep. Outside a transition
   * the live entry is drawn alone at weight 1. Inside one, with `alpha` the
   * sample's progress, the layers follow `IAutoMovieTransition`:
   *
   * - `crossDissolve`: the outgoing tail at `1 - alpha` and the live entry at
   *   `alpha`;
   * - `fade`: before the midpoint, the outgoing tail alone at `1 - 2 × alpha`; from
   *   the midpoint on, the live entry alone at `2 × alpha - 1`, so the midpoint
   *   itself is the live entry at weight 0, black.
   *
   * `1 - alpha` and `alpha` add to exactly 1 in binary64 for every `alpha` in
   * `[0, 1)`, which the dissolve compositor's complementary-weight check needs.
   * Each layer's time is its entry's clock at `seconds`. The precondition is
   * `resolveFromTimeline`'s: a timeline from a sequence that passed
   * `cutSequence`.
   *
   * @param sequence The cut the timeline was built from.
   * @param timeline The cut laid onto the output clock.
   * @param seconds Output-clock seconds.
   * @returns One or two new layers, outgoing first.
   */
  export function playbackLayersAt(sequence: IAutoMovieSequence, timeline: IAutoMoviePlaybackTimeline, seconds: number): IAutoMoviePlaybackLayer[] {
    return playbackLayersAtImplementation(sequence, timeline, seconds);
  }

  /**
   * Turn one live timeline entry into the on-screen sample at an output instant.
   *
   * The sample is the live shot at `playbackEntryTime(live, seconds)`, `offset +
   * (seconds - start) * rate` with an omitted rate equal to 1. Inside the live
   * entry's incoming transition, that is while `seconds - start` is less than the
   * transition's duration, it also carries the previous entry's tail as `blend`,
   * at that entry's own local time, with the transition's kind and its progress
   * `alpha = (seconds - start) / duration`. The caller picks the live entry; a
   * transition on the first entry is refused by `sequenceTimeline`, so the
   * previous entry always exists when a blend is built.
   *
   * @param sequence The sequence the timeline was built from.
   * @param entries The timeline's entries, in sequence order.
   * @param live The entry live at `seconds`.
   * @param seconds Output-clock seconds.
   * @returns A new sample.
   */
  export function playbackSampleAt(sequence: IAutoMovieSequence, entries: readonly IAutoMoviePlaybackEntry[], live: IAutoMoviePlaybackEntry, seconds: number): IAutoMoviePlaybackSample {
    return playbackSampleAtImplementation(sequence, entries, live, seconds);
  }

  /**
   * The layer a picture shows most of: the one with the larger weight among the
   * layers `playbackLayersAt` gives, the incoming live layer on a tie.
   *
   * Every per-frame record keyed to "the shot at this frame" follows it, so a
   * caption, a pose or a mask names the shot the picture shows: during a fade the
   * outgoing shot until the midpoint and the incoming one from it, during a cross
   * dissolve the outgoing shot before the midpoint and the incoming one from it,
   * and outside a transition the live shot.
   *
   * @param layers One or two layers of one instant, as `playbackLayersAt` gives
   *   them.
   * @returns The shown layer.
   * @throws When `layers` is empty.
   */
  export function playbackShownLayer(layers: readonly IAutoMoviePlaybackLayer[]): IAutoMoviePlaybackLayer {
    return playbackShownLayerImplementation(layers);
  }

  /**
   * The box one staged point occupies, given the vertical extent of what stands
   * there.
   *
   * `extent` is in metres relative to the point and carries its own floor, so a
   * subject whose span begins above its node origin is boxed where it is rather
   * than at the placement it hangs from. The box is horizontally degenerate,
   * because a placement is a point and a height is not a width: this is the shape
   * of a subject nothing could be measured for, a node with no compiled model
   * whose span is its rig's or the stand-in's. {@link nodeSubjectBox} boxes a
   * subject with horizontal geometry from its measured extent; its zero-width
   * shape test also routes measured vertical segments here without distinguishing
   * them from unmeasured stand-ins.
   *
   * @param point World point the subject stands at, in metres.
   * @param extent Vertical span relative to `point`, in metres.
   * @returns A new world box, zero wide on X and Z.
   */
  export function pointSubjectBox(point: IAutoMovieVector3, extent: IAutoMoviePointSubjectBox.IExtent): IAutoMovieSubjectBox {
    return pointSubjectBoxImplementation(point, extent);
  }

  /**
   * Build a playback layout and the shot index shared by frame, event and
   * editorial marker consumers.
   *
   * The sequence must have passed cutSequence: source trims, playback rates and
   * output overlaps already fit their respective clocks. This preparation still
   * refuses empty cuts, duplicate supplied shot ids, missing referenced shots, a
   * first-entry transition and nondefault rates that cannot produce a
   * representable output interval. Extra supplied shots are indexed but do not
   * add playback entries.
   *
   * @returns The output-clock timeline and its unambiguous supplied-shot index.
   */
  export function preparePlaybackTimeline(sequence: IAutoMovieSequence, shots: readonly IAutoMovieShot[]): IAutoMoviePreparePlaybackTimeline.IResult {
    return preparePlaybackTimelineImplementation(sequence, shots);
  }

  /**
   * Map one non-negative film-frame boundary onto a destination integer clock,
   * such as audio samples or WebVTT milliseconds.
   *
   * The boundary of frame `f` at rate `n/d` lies at `f·d/n` seconds, so its tick
   * on a `ticksPerSecond` clock is `f·d·ticksPerSecond / n`, rounded once.
   * `nearest` sends an exact half tick upward, and `floor` and `ceiling` are the
   * caller's explicit choices. A frame that is not a non-negative safe integer, a
   * clock rate that is not a positive safe integer, an invalid frame rate, and a
   * tick beyond `Number.MAX_SAFE_INTEGER` each throw an `Error`.
   *
   * @param props.frame Film-frame boundary index, a non-negative safe integer.
   * @param props.frameRate The film's frame rate as an exact ratio.
   * @param props.ticksPerSecond Destination clock rate, a positive safe integer.
   * @param props.rounding How a boundary between two ticks is resolved.
   * @returns The boundary's tick on the destination clock.
   */
  export function productionFrameBoundaryToGridTick(props: IAutoMovieProductionFrameBoundaryToGridTick.IProps): number {
    return productionFrameBoundaryToGridTickImplementation(props);
  }

  /**
   * Map one non-negative film-frame boundary to seconds on the film clock.
   *
   * The boundary of frame `f` at rate `n/d` lies at `f·d/n` seconds. The rate is
   * reduced to lowest terms first, so two spellings of one rate give the same
   * bits, and the result is the correctly rounded double of that ratio while
   * `f·d` stays within `Number.MAX_SAFE_INTEGER`; beyond it the product itself
   * rounds. Callers that compare a time with a frame boundary read it here, so
   * they all compare against the same double. A frame that is not a non-negative
   * safe integer, and an invalid frame rate, throw an `Error`.
   *
   * @param props.frame Film-frame boundary index, a non-negative safe integer.
   * @param props.frameRate The film's frame rate as an exact ratio.
   * @returns The boundary's time in seconds.
   */
  export function productionFrameBoundaryToSeconds(props: IAutoMovieProductionFrameBoundaryToSeconds.IProps): number {
    return productionFrameBoundaryToSecondsImplementation(props);
  }

  /**
   * Map one positive film-frame interval onto a destination integer clock, and
   * refuse an interval the clock cannot represent.
   *
   * Both boundaries go through {@link productionFrameBoundaryToGridTick} with the
   * same rounding, so adjacent intervals share their boundary tick and tile the
   * destination clock without gaps or overlaps. An interval whose end frame is
   * not after its start frame throws an `Error`, and so does one whose two
   * boundaries land on the same tick, because a caption or sound region with no
   * duration on its own clock is not a delivered interval. Every error of the
   * boundary map passes through.
   *
   * @param props.startFrame First film frame of the interval, inclusive.
   * @param props.endFrame Film frame after the last one, exclusive.
   * @param props.frameRate The film's frame rate as an exact ratio.
   * @param props.ticksPerSecond Destination clock rate, a positive safe integer.
   * @param props.rounding How a boundary between two ticks is resolved.
   * @returns The interval's start and end ticks, end exclusive.
   */
  export function productionFrameIntervalToGridTicks(props: IAutoMovieProductionFrameIntervalToGridTicks.IProps): IAutoMovieProductionFrameIntervalToGridTicks.IResult {
    return productionFrameIntervalToGridTicksImplementation(props);
  }

  /**
   * The layers one render pass draws for one film frame.
   *
   * Beauty is alpha-composited, so the `beauty` pass gets every layer with its
   * weight. A structural guide pass carries classifications or geometric fields,
   * where linearly blending pixels invents values no layer holds, so it gets only
   * the heaviest layer, with weight `1`; on an exact tie the later layer wins,
   * which is the incoming shot because `sampleProductionRenderFrame` lists the
   * outgoing layer first. Every result is a deep copy, so a caller mutating it
   * cannot alter the frame another pass reads. A guide pass over an empty layer
   * list throws a `TypeError`; a sampled film frame always has at least one.
   *
   * @param frame The sampled film frame, layers in outgoing-then-incoming order.
   * @param pass The render pass being drawn.
   * @returns New layers for the pass: all of them for beauty, one otherwise.
   */
  export function productionRenderLayersForPass<Layer extends { weight: number }>(frame: IAutoMovieProductionRenderLayersForPass.IFrame<Layer>, pass: AutoMovieGuidePass): Array<Omit<Layer, "weight"> & { weight: number }> {
    return productionRenderLayersForPassImplementation<Layer>(frame, pass);
  }

  /**
   * Project a world point into the delivered frame's normalized device
   * coordinates.
   *
   * The camera looks down its local −Z, as glTF cameras do, so `depth = −localZ`
   * is positive in front of the lens, and NDC is `local / (depth · halfY)`
   * vertically and `local / (depth · halfY · aspect)` horizontally. With a crop,
   * NDC is rescaled so the crop window spans `[−1, 1]` on both axes; without one,
   * the whole gate does. Behind the lens (`depth <= 0`) the NDC is meaningless
   * and at `depth = 0` it is infinite or `NaN`: this never clamps, and the caller
   * reads `depth`, the near and far bounds and the `[−1, 1]` rectangle to decide.
   * A malformed crop throws the `RangeError` of {@link deliveryCropNdc}.
   *
   * @param camera Camera placement, looking down its local −Z.
   * @param point World point in metres.
   * @param halfY Vertical half-field tangent, `tan(fovY / 2)`.
   * @param aspect Frame width over height.
   * @param crop Delivery crop, or the whole gate when omitted.
   * @returns NDC on both axes and the viewing depth in metres.
   */
  export function projectToNdc(camera: IAutoMovieResolvedCamera, point: IAutoMovieVector3, halfY: number, aspect: number, crop?: IAutoMovieDeliveryCrop): IAutoMovieProjectToNdc.IResult {
    return projectToNdcImplementation(camera, point, halfY, aspect, crop);
  }

  /**
   * The world frame a placement relation anchors to, or `null` when it has none.
   *
   * This is the relative-transform half of placement: a source that wants twelve
   * chairs around a table asks for the table's `stack-top` frame once and offsets
   * from it in a loop, instead of typing twelve world positions that stop being
   * right the moment the table moves. Each target kind answers as follows:
   *
   * - `prop-affordance`: the affordance's frame under the staged piece's transform;
   *   `null` when the prop, its staged piece or the affordance is missing.
   * - `element`: the element's rest-pose world transform.
   * - `boundary`: the rest-pose world transform of its first realizing element.
   * - `opening`: the rest-pose world transform of its filling element; `null` for
   *   an open cut.
   * - `surface`: a point inside the widest convex piece of the patch, at the
   *   patch's height there, with identity rotation and unit scale; `null` for a
   *   patch with no area.
   * - `space`: always `null`, because a region has no frame.
   *
   * A building target also answers `null` when its environment, element or record
   * is missing or an element's parent chain is missing or cyclic. Rest pose means
   * operating states are ignored: an anchor on a door is where the door hangs,
   * not where it swings to. Lookups take the first record of a given id; two
   * records sharing one id is a contradiction {@link validatePropPlacements}
   * refuses by name, so resolving it a second time here would report the same
   * defect in a worse place.
   *
   * The composed affine matrix is returned as a decomposed TRS with normalized
   * rotation. Rotations combined with nonuniform parent scales can introduce
   * shear that this representation does not preserve; the result is not a general
   * affine anchor matrix. Matrix4.decompose can throw when derived affine
   * arithmetic cannot produce a finite frame; null covers the stated
   * missing/cyclic/absent-face cases, not every numerical failure.
   *
   * @param props.target The relation target to anchor to.
   * @param props.environments The buildings a building target may name.
   * @param props.props The prop registry a prop-affordance target may name.
   * @param props.set The staged set pieces that place those props.
   * @returns The anchor's world transform with a unit rotation, or `null`.
   */
  export function propAnchorFrame(props: IAutoMoviePropAnchorFrame.IProps): IAutoMovieTransform | null {
    return propAnchorFrameImplementation(props);
  }

  /**
   * Every opening and connector a world volume intrudes on, openings first, each
   * group in declaration order.
   *
   * An opening is measured through the element that fills it, at its rest pose:
   * the fill's model parts, placed under its rest world matrix, bound the hole.
   * An open cut (`fill: null`), a fill that draws no model or whose model lives
   * outside the record, and a fill whose parent chain is missing or cyclic are
   * reported by neither this query nor the validator, because a passage nothing
   * measures cannot be proven blocked and guessing where the hole is would be
   * worse than saying nothing. A model present in the record but without
   * measurable vertices instead receives builtPlacedPartBoxes' degenerate box at
   * the staged fill element's world origin; this query preserves that fallback.
   *
   * A connector is swept from its own route: each segment's box widens by half
   * the usable width horizontally and rises by the clear height, which is the
   * volume a body traversing it needs. A varying section is read at the segment's
   * ends and at every section station inside it, and the segment takes the widest
   * width and tallest clearance among them, so the box stays an outer bound of
   * the tapering corridor. A connector that states no section, or whose route has
   * no length, sweeps nothing: an unstated width is not a width of zero, and
   * `validateBuiltEnvironment` refuses that record on its own path.
   *
   * Intrusion is {@link propBoundsOverlap}, so a volume that only touches a
   * passage does not block it.
   *
   * @param props.environment The building whose passages are checked.
   * @param props.bounds The intruding world volume, in metres.
   * @returns One blockage per intruded passage.
   */
  export function propBlockedPassages(props: IAutoMoviePropBlockedPassages.IProps): IAutoMoviePassageBlockage[] {
    return propBlockedPassagesImplementation(props);
  }

  /**
   * Whether two axis-aligned world volumes share interior space.
   *
   * Contact is not occupancy: two boxes that meet exactly on a face, an edge or a
   * corner do not overlap, which lets a lamp stand on a table top without the
   * table reporting that the lamp is inside it. A box flat on one axis still
   * overlaps a box whose interior strictly contains that plane, but never one
   * that only reaches it, and a `NaN` coordinate makes the answer false. The prop
   * placement gate, the building placement-overlap queries and the
   * service-network gates all judge intrusion by this one test.
   *
   * @param left One world box, in metres.
   * @param right The other world box, in metres.
   * @returns True when, on every axis, each box's minimum lies strictly below the
   *   other's maximum.
   */

  /**
   * Whether one axis of a declared prop volume is a real extent: both bounds
   * finite and the minimum strictly below the maximum.
   *
   * A flat or inverted axis encloses no volume, so a footprint or clearance box
   * failing it can be neither contained, borne nor overlapped. The prop placement
   * gate reports a failing axis by its path and measures only props whose every
   * declared box passes, so the report and the measurement read one rule.
   *
   * @param box A declared footprint or clearance box, in metres.
   * @param axis The axis to judge.
   * @returns true only for finite bounds with min < max on that axis.
   */
  export function propBoxAxisIsSound(
    box: IAutoMoviePropBox,
    axis: "x" | "y" | "z",
  ): boolean {
    return propBoxAxisIsSoundImplementation(box, axis);
  }

  /** Test whether two world-space prop boxes overlap strictly along every axis. */
  export function propBoundsOverlap(
    left: IAutoMoviePropBox,
    right: IAutoMoviePropBox,
  ): boolean {
    return propBoundsOverlapImplementation(left, right);
  }

  /**
   * The world-axis-aligned keep-out volumes one staged prop declares, one per
   * `placement.clearance` entry in declaration order, each keeping its id.
   *
   * Each model-local box goes through the piece's full staged transform, so a
   * rotated prop's keep-out widens rather than being re-fitted. Every declared
   * box is transformed, including one whose bounds the validator rejects:
   * filtering here would hide a malformed volume from a source-side search
   * instead of letting `validatePropPlacements` name it. A prop with no placement
   * or no clearance answers an empty list.
   *
   * @param props.prop The prop's registry entry.
   * @param props.piece The set piece that stages it.
   * @returns New world boxes in metres, one per declared clearance.
   */
  export function propClearanceBounds(props: IAutoMoviePropClearanceBounds.IProps): IAutoMoviePropClearanceBounds[] {
    return propClearanceBoundsImplementation(props);
  }

  /**
   * The world-axis-aligned volume one staged prop occupies.
   *
   * A declared `placement.footprint` wins because it is the prop's own statement
   * of what it takes up; otherwise the bound is derived from the prop's own model
   * parts, each placed under its part transform and read through `tessellate` for
   * a primitive. Either way the volume travels through the piece's full staged
   * transform before the world bound is taken, so a rotated prop widens rather
   * than being re-fitted to its local box.
   *
   * Those parts are the prop's geometry, not necessarily what a viewer draws. A
   * prop citing an external appearance keeps its registered deterministic proxy;
   * this engine query does not open imported asset bytes. An explicit footprint
   * states the use volume when the proxy is too crude. If no part carries a
   * vertex, builtPlacedPartBoxes returns a zero box at the staged piece's world
   * origin.
   *
   * @param props.prop The prop's registry entry.
   * @param props.piece The set piece that stages it.
   * @returns A new world box in metres.
   */
  export function propOccupancyBounds(props: IAutoMoviePropOccupancyBounds.IProps): IAutoMoviePropBox {
    return propOccupancyBoundsImplementation(props);
  }

  /**
   * Whether a world volume lies inside a logical space or the spaces below it.
   *
   * Each of the box's eight corners must lie in some space of the subtree, read
   * through `builtSpaceContainsPoint`, the same per-space rule
   * `builtEnvironmentContainsPoint` folds. The corners may lie in different child
   * spaces, and because only corners are tested, a box whose corners are inside a
   * non-convex space while its middle crosses a notch is accepted.
   *
   * A subtree that states no volume at all locates nothing, so it excludes
   * nothing and the answer is `true`: a purely semantic container such as "the
   * west wing" is a name, not a boundary, and refusing props inside it would
   * invent a geometric claim the author never made. An undeclared space throws
   * the `Error` of `requireBuiltSpace`. The prop placement gate and the service
   * network gate judge `in-space` containment with it.
   *
   * @param props.environment The building that declares the space.
   * @param props.space Id of the logical space.
   * @param props.bounds World volume to test, in metres.
   * @returns True when every corner is inside, or the subtree states no volume.
   */
  export function propSpaceContainsBounds(props: IAutoMoviePropSpaceContainsBounds.IProps): boolean {
    return propSpaceContainsBoundsImplementation(props);
  }

  /**
   * The face one `on-support` relation resolves to, or `null` when the record
   * states none.
   *
   * A `surface` target resolves to the cited built environment's support patch:
   * its own footprint, holes included, and its own height rule. A
   * `prop-affordance` target resolves to the host prop's `stack-top` extent
   * carried through the affordance frame and the host's full staged transform
   * ({@link setPieceMatrix}), hulled into one convex ring, with a plane height
   * rule through the transformed top.
   *
   * Nothing is guessed. A citation that does not resolve, a host that is not
   * staged, a contact of a kind that carries no face (`handle`, `socket`,
   * `hook`), a `stack-top` without an extent, a patch whose region encloses no
   * area, and a top staged edge-on to the ground each answer `null`, because a
   * face nobody can measure is not a face a prop can be proven off. The edge-on
   * top's height over the ground plan is not a function, so there is no rule to
   * read it by, and inventing one would refuse or excuse a prop for a number the
   * author never wrote.
   *
   * Lookups take the first record of a given id, exactly as
   * {@link propAnchorFrame} does and for the same reason: contradicting ids are
   * {@link validatePropPlacements}'s own refusal, by name.
   *
   * @param props The relation target and the records it may cite.
   * @returns The face in world metres, or null for the stated
   *   unresolved/degenerate cases. Finite authored transforms alone do not ensure
   *   finite derived plane coefficients.
   */
  export function propSupportFace(props: IAutoMoviePropSupportFace.IProps): IAutoMoviePropSupportFace | null {
    return propSupportFaceImplementation(props);
  }

  /**
   * How far a staged prop's underside stands above the face it rests on, in
   * metres: negative where it sinks into the support, zero where it touches it,
   * positive where it floats. `null` when no probe of the prop's footprint lies
   * over the face at all, which is the answer for a prop that does not stand over
   * its support rather than one standing at the wrong height on it.
   *
   * Contact is probed from both sides: at the footprint's four corners and its
   * centre where those land on the face, and at the face's own ring corners,
   * holes included, where those land under the footprint. One side alone would be
   * wrong in one direction each. A prop standing on a patch smaller than itself
   * covers none of its own probes with the patch, and a patch wider than the prop
   * is never reached at its corners, so a bench on a plinth and a chair on a
   * floor are the same question asked from whichever side can answer it.
   *
   * The deepest probe answers, which is what lets a box resting along one edge of
   * a ramp still be resting on it while a box whose near corner has gone through
   * the ramp is not, and it is the same footprint sampling
   * {@link supportContactsFor} decides a scene's supports by. Relief between the
   * probes is not read: a support that rises and falls between them is answered
   * where they stand. Edge intersections are not added as probes, so a thin
   * overlap can be missed and even a planar support need not expose its deepest
   * overlapping point to this finite probe set.
   *
   * @param props The face and the prop's world box.
   * @returns The smallest underside rise over the probed points, or `null`.
   */
  export function propSupportGap(props: IAutoMoviePropSupportGap.IProps): number | null {
    return propSupportGapImplementation(props);
  }

  /**
   * Reads an ordered edit mechanically and reports the film-grammar findings no
   * declared exception excepted, together with the declarations that excepted
   * nothing.
   *
   * Every shot is validated and canonicalized by `normalizeGrammarShot`, and the
   * read throws on the first malformed observation, on a duplicate shot id, or on
   * a threshold that is not finite and positive. It then files, in this order, a
   * shot-size finding per shot whose measured size at either boundary differs
   * from its declared size; for each cut, an axis-crossing, an eyeline, a
   * jump-cut, a displacement re-establishing and a screen-direction finding, then
   * an entrant re-establishing finding when the displacement one was not filed;
   * and one advisory pacing finding for a non-empty edit. A finding is excepted
   * when its shot declares the style intent `GRAMMAR_STYLE_SUPPRESSION` maps to
   * its code, and pacing is excepted when any shot declares `rhythmic-pacing`.
   *
   * Shot order is editorial meaning and is kept. Subject order and action-axis
   * endpoint order are canonicalized, so they cannot change the result, and the
   * read uses no seed, clock, scene mutation or renderer.
   *
   * @param props The edited shots and the jump-cut and re-establish thresholds.
   * @returns The unexcepted findings in filing order and the unexercised claims.
   */
  export function readFilmGrammar(props: IAutoMovieGrammarInput): IAutoMovieGrammarReading {
    return readFilmGrammarImplementation(props);
  }

  /**
   * Grade a shot contract against the compiled artifacts that claim to realize
   * it, measuring every outcome from the compiled scene, motions, camera and
   * event samples rather than from the contract's own prose.
   *
   * Opening states are graded at second 0 and closing states at
   * `durationSeconds`. Each event is graded at its source sample's time and
   * passes only when every declared subject resolves, its sample exists and is
   * finite inside its window, and its predicates pass; the sample list itself
   * must name every contract event exactly once. The camera is sampled at 0,
   * every review frame and `durationSeconds`, deduplicated and ascending, and a
   * sample passes only when every required subject resolves, its box intersects
   * the clipped view frustum of the cropped raster, and the box's depth range
   * satisfies the camera's depth-precision constraint. A formation participant
   * must materialize its designed count in contiguous chunks, and, once a
   * production is supplied, every promoted hero node exactly; an actor
   * participant must be a performed scene node; every builder-reported slot
   * collision fails.
   *
   * A reference that cannot be resolved, such as an absent node, rig, bone,
   * motion, landmark or formation, makes the predicate or camera subject that
   * named it fail; nothing is substituted for it. Contract clocks must already be
   * admitted. Camera resolution runs outside the per-subject catch, so an invalid
   * review time or malformed moving-camera sample can throw here.
   *
   * @param props The contract, the compiled artifacts, and the design context.
   * @returns The realization record, and one `contract-realization-failed`
   *   diagnostic per slot collision, failing state, mismatched sample list,
   *   failing event, camera sample, formation and actor, in that order; an empty
   *   list means the contract is realized.
   */
  export function realizeShotContract(props: IAutoMovieRealizeShotContractProps): IAutoMovieRealizeShotContract.IResult {
    return realizeShotContractImplementation(props);
  }

  /**
   * Validate one delivery-gate crop and return a copy of it, or of the whole gate
   * when it is omitted.
   *
   * Edges are fractions of the uncropped raster with a top-left origin, so the
   * same window holds at every output resolution. A crop is accepted when every
   * edge is finite and within `[0, 1]`, `left < right` and `top < bottom`. The
   * result never aliases the caller's object, so render and review consumers
   * share values without sharing mutation.
   *
   * @param crop The authored window, or `undefined` for the whole gate.
   * @returns A fresh crop with the same four edges.
   * @throws {RangeError} When an edge is non-finite or outside `[0, 1]`, or the
   *   window is empty or inverted on either axis.
   */
  export function resolveAutoMovieDeliveryCrop(crop: IAutoMovieDeliveryCrop | undefined): IAutoMovieDeliveryCrop {
    return resolveAutoMovieDeliveryCropImplementation(crop);
  }

  /**
   * Resolve the lens a directly rendered frame draws at one shot-local second:
   * the authored stop and the focused depth.
   *
   * The active intent is the one with the greatest `start` at or before the
   * second. It resolves `null`, a frame drawn sharp at every depth, when no
   * intent has started, when the active intent authored no `fNumber`, when it
   * names no lens subject, or when the focused depth is not in front of the
   * camera.
   *
   * The focused depth of a mark `P` is its distance along the camera's forward
   * axis, `(P − C) · forward`, in metres, measured from where the camera stands
   * at this second, so a dolly toward a fixed mark shortens it. Inside a pull the
   * depth eases from the first mark's `z0` to the second's `z1` as `z0 + (z1 −
   * z0) × s(u)`, with `u = (t − start) / (end − start)` and `s(u) = u²(3 − 2u)`,
   * which starts and lands with zero rate as a focus puller's hand does; before
   * `start` the first mark holds and after `end` the second. Marks are world
   * points recorded when the shot was compiled, so a subject that walks away from
   * its mark goes soft: there is no follow focus.
   *
   * @param props The shot's intents, the second and the camera's placement.
   * @returns The stop and the focused depth, or null.
   */
  export function resolveAutoMovieLensAt(props: IAutoMovieResolveLensAt.IProps): IAutoMovieFilmOptics.ILens | null {
    return resolveAutoMovieLensAtImplementation(props);
  }

  /**
   * The state a later beat resumes from: every scene actor at the exclusive end
   * of the compiled shot, `shot.duration` seconds in.
   *
   * Beyond where each actor stands and faces, the state is resumable: the gait
   * phase lets the next beat continue mid-stride, the root velocity lets it keep
   * momentum, the foot plants keep stance feet where they were (only when
   * `props.plants` carries the ground-IK output), and the mount binding keeps a
   * rider coupled without restating it. A prop the shot left in a hand or where a
   * throw landed ends at that baked transform, not at its staged spot.
   * `compileDefinedShot` returns it as the closing continuity, and
   * `validateFilmContinuity` compares it with the next beat's
   * {@link resolveBeatOpening}.
   *
   * Throws on duplicated motion ids, performance nodes, mounts or plant entries,
   * and on a motion reference `props.motions` does not supply.
   *
   * @param props The compiled shot, its staged scene and motions, and the mount
   *   and plant facts to carry.
   * @returns One end state per scene node, in scene order.
   */
  export function resolveBeatEnd(props: IAutoMovieResolveBeatProps): IAutoMovieBeatEndState {
    return resolveBeatEndImplementation(props);
  }

  /**
   * Every scene actor at the shot's opening instant, `t = 0`, before any of its
   * motion has played: where each stands, faces and is coupled as the beat
   * begins.
   *
   * It has the shape of {@link resolveBeatEnd}'s state, so the gait phase, root
   * velocity and foot plants are the resumable fields at the opening. The
   * continuity check compares it with the previous beat's end state to catch a
   * cut that does not resume where that beat left off, a character who drifts or
   * a prop that disappears. `compileDefinedShot` returns it as the opening
   * continuity, overlaying a supplied previous beat's gait phase, root velocity,
   * foot plants and mount per actor.
   *
   * Throws on duplicated motion ids, performance nodes, mounts or plant entries,
   * and on a motion reference `props.motions` does not supply.
   *
   * @param props The compiled shot, its staged scene and motions, and the mount
   *   and plant facts to carry.
   * @returns One opening state per scene node, in scene order.
   */
  export function resolveBeatOpening(props: IAutoMovieResolveBeatProps): IAutoMovieBeatEndState {
    return resolveBeatOpeningImplementation(props);
  }

  /**
   * Every scene actor's resumable state at one shot-local instant, the one body
   * behind {@link resolveBeatOpening} (`instant = 0`) and {@link resolveBeatEnd}
   * (`instant = shot.duration`).
   *
   * Each node of `props.scene` yields one actor state, in scene order. A node
   * with a performance plays that performance's motion from its `startOffset`, so
   * its clip-local time is `max(0, instant - startOffset)`; any other node plays
   * its own `motion` at `instant`, or holds its staged pose when it has none. The
   * pose root is folded into the staged transform unless the shot's object
   * motions bake both a translation and a rotation for the node at that time: a
   * mounted rider, a grabbed prop, or a launched one then takes the baked world
   * transform and the baked trailing velocity instead, because the shot left it
   * in a hand or where it landed rather than at its staged spot. Baked samples
   * use the shot clock, but their velocity window begins no earlier than the
   * actor's performance start: a newly starting performance has no trailing
   * velocity history. Nodes without a performance use the shot's zero boundary.
   * The persistent mount binding and ground-IK plants are carried through. Plant
   * intervals are currently selected on the pose-local clock; the production
   * performer writes startOffset zero, where that clock agrees with the shot. A
   * supplied nonzero offset therefore shifts plant selection without shifting
   * baked object transforms.
   *
   * Throws when two motions share an id, two performances share a node, two
   * mounts or two plant entries name the same node, or a node or performance
   * names a motion that `props.motions` does not supply, because a snapshot built
   * from an ambiguous or missing input would hand the next beat a state no shot
   * produced.
   *
   * @param props The compiled shot, its staged scene and motions, and the mount
   *   and plant facts to carry.
   * @param instant Shot-local seconds to sample at.
   * @returns The beat id, the shot id, and one state per scene node.
   */
  export function resolveBeatSnapshot(props: IAutoMovieResolveBeatProps, instant: number): IAutoMovieBeatEndState {
    return resolveBeatSnapshotImplementation(props, instant);
  }

  /**
   * A camera's world placement at shot-local `time`: its staged base transform
   * when the shot has no camera move, else the move's `translation` and
   * `rotation` tracks for the camera node sampled at `time`.
   *
   * A move that lacks one of the two tracks takes that component from the base.
   * Sampling follows {@link sampleClip}: time is clamped to the clip, or wrapped
   * when it loops, and an invalid time or a duplicated track throws. A component
   * taken from the base is the base's own object, not a copy.
   *
   * @param base The staged camera node's translation and rotation.
   * @param cameraMotion The shot's camera clip, or `null` for a static camera.
   * @param cameraId Node id whose tracks are read from the clip.
   * @param time Shot-local seconds.
   * @returns The lens position in metres and its world rotation.
   */
  export function resolveCameraAt(base: IAutoMovieResolveCameraAt.IBase, cameraMotion: IAutoMovieShot["cameraMotion"], cameraId: string, time: number): IAutoMovieResolvedCamera {
    return resolveCameraAtImplementation(base, cameraMotion, cameraId, time);
  }

  /**
   * Resolve one output instant against an already-built {@link sequenceTimeline}:
   * the random-access resolver behind {@link resolveSequencePlayback}.
   *
   * The live entry is the last one whose start is at or before `seconds`, the
   * incoming shot winning inside a transition overlap and the later of two equal
   * starts winning a full-length dissolve; {@link playbackCursor} applies the same
   * rule while sweeping forward, so both return the same sample. Because a cut
   * timeline's starts never decrease and each entry ends at or after the next one
   * starts, that entry is also the last whose span contains the instant.
   *
   * Precondition: `seconds` lies within `[0, runtime)` and the timeline came from
   * a sequence that passed `cutSequence`. Outside that range the answer is the
   * first entry before `0` and the last entry from `runtime` on, which is not a
   * frame anyone draws, so {@link resolveSequencePlayback} range-checks first.
   *
   * @param sequence The cut the timeline was built from.
   * @param timeline The cut laid onto the output clock.
   * @param seconds Output-clock seconds.
   * @returns The live shot and its local time, with the outgoing blend or `null`.
   */
  export function resolveFromTimeline(sequence: IAutoMovieSequence, timeline: IAutoMoviePlaybackTimeline, seconds: number): IAutoMoviePlaybackSample {
    return resolveFromTimelineImplementation(sequence, timeline, seconds);
  }

  /**
   * Resolve a saved take's source occurrence against an already prepared,
   * admitted cut.
   *
   * Output seconds must be finite and in `[0, runtime]`. `after` is the default.
   * `before` is valid at a hard cut or the sequence end; `after` at sequence end
   * and `before` at sequence start are refused. Outgoing selection skips
   * occurrences whose starts coincide with the boundary because they occupy no
   * output time before it. An overlap requires the explicit incoming or outgoing
   * entry. At a selected outgoing endpoint, use the source's exact trim end if
   * present, otherwise its numeric trim or shot end.
   */
  export function resolveMotionTakeAnchor(sequence: IAutoMovieSequence, prepared: IAutoMoviePreparePlaybackTimeline.IResult, selection: {
    outputSeconds: number;
    entry?: number;
    side?: IAutoMovieMotionTakeAnchor["side"];
  }): IAutoMovieMotionTakeAnchor {
    return resolveMotionTakeAnchorImplementation(sequence, prepared, selection);
  }

  /**
   * Project one posed actor's joints to normalized 2D frame keypoints, the
   * OpenPose-style conditioning automovie can emit exactly because it knows every
   * bone's 3D position.
   *
   * Forward kinematics resolves the pose in rig space, the actor's staged node
   * transform lifts each joint into scene world with the renderer's TRS order,
   * and the live camera, sampled at `time`, projects it through an optional
   * delivery crop. `x` grows rightward and `y` downward from the frame's top-left
   * corner, both in `[0, 1]` inside the frame. A joint behind the camera, outside
   * the clip range or outside the frame is still projected, never clamped,
   * because a clamped point reads as a false edge keypoint, and is flagged
   * `inFrame: false`. A requested joint the rig does not have yields no keypoint.
   * The order follows joints. FK uses default engine joint axes and rest frames;
   * coincidence with a renderer requires those same conventions, and these
   * numerical outputs establish no observed rendered pixels.
   *
   * @param props The pose, rig, staged placement, camera, instant and output
   *   options.
   * @returns One keypoint per requested joint the rig has.
   */
  export function resolvePoseKeypoints(props: IAutoMovieResolvePoseKeypoints.IProps): IAutoMoviePoseKeypoint[] {
    return resolvePoseKeypointsImplementation(props);
  }

  /**
   * The exact frame rate a record carries beside its `fps` display scalar, in
   * lowest terms.
   *
   * When `frameRate` is present it is the identity, reduced by
   * {@link canonicalProductionFrameRate}, and `fps` must equal its quotient
   * exactly as a double; when it is absent, `fps` must be a positive safe integer
   * and reads as `fps/1`. A fractional rate therefore always travels as an
   * explicit numerator and denominator, because a decimal such as `29.97` does
   * not identify `30000/1001`.
   *
   * @param props Any record carrying `fps` and an optional exact `frameRate`,
   *   such as a film timeline, a frame format or a sound plan.
   * @returns The reduced numerator and denominator.
   * @throws {Error} When the exact rate has non-positive or non-safe-integer
   *   terms, when `fps` alone is not a positive safe integer, or when `fps`
   *   disagrees with the exact rate.
   */
  export function resolveProductionFrameRate(props: IAutoMovieResolveProductionFrameRate.IProps): IAutoMovieProductionFrameRate {
    return resolveProductionFrameRateImplementation(props);
  }

  /**
   * The production's lights at one story-clock instant.
   *
   * A production source is an ordinary light addressed by an ordinary pointer
   * track, so it is resolved by {@link resolveShotLighting}, the code a shot's
   * `lightMotions` runs through: sampled, checked, accumulated per light and
   * applied the same way. A source no clip touches comes back by identity, and a
   * clip that addresses a missing light or a property its kind does not carry
   * throws, as it does for a shot. `inheritProductionLighting` calls it at the
   * story moment a pinned shot's instant maps to and merges the result into the
   * shot's staged lights.
   *
   * @param props The production lighting and the instant.
   * @returns One light per declared source, in declaration order.
   */
  export function resolveProductionLighting(props: IAutoMovieResolveProductionLighting.IProps): IAutoMovieLight[] {
    return resolveProductionLightingImplementation(props);
  }

  /**
   * What is on screen at one output second: the live entry's shot at its local
   * time and, inside that entry's incoming transition, the previous entry's tail
   * as the `blend` with incoming weight `alpha = elapsed / transition`.
   *
   * Returns `null` for an instant outside `[0, runtime)`, `NaN` included, where
   * there is no frame to draw. It builds the timeline on every call, which suits
   * random single-instant access such as interactive scrubbing; a whole film
   * builds one timeline and drives {@link playbackCursor} or
   * {@link resolveFromTimeline} from it instead. Throws what
   * {@link sequenceTimeline} throws for an empty sequence, a first-entry
   * transition, a missing shot or a duplicated shot id.
   *
   * @param sequence The cut, already accepted by `cutSequence`.
   * @param shots Every shot the cut references.
   * @param seconds Output-clock seconds.
   * @returns The on-screen sample, or `null` outside the runtime.
   */
  export function resolveSequencePlayback(sequence: IAutoMovieSequence, shots: IAutoMovieShot[], seconds: number): IAutoMoviePlaybackSample | null {
    return resolveSequencePlaybackImplementation(sequence, shots, seconds);
  }

  /**
   * Engine-computed visual-read metrics for one compiled shot, filed as advisory
   * `tier: "visual"` review notes after any film-grammar findings passed in. They
   * never fail a gate; they give the review backlog measurable facts about
   * whether the action reads.
   *
   * Every metric reads a performer's world root: its performance's motion sampled
   * at `max(0, t - startOffset)` and folded through its staged node. A
   * performance whose node or motion is missing, or that plays no motion, is
   * skipped.
   *
   * - **Subject in frame**: sampled at `sampleRate` from 0 to the shot's end, a
   *   performer whose root leaves the live camera's frustum, behind the near
   *   plane, past the far plane, or outside the vertical field of view and the
   *   `aspect`-derived horizontal one, gets one note at the first such time.
   * - **Silhouette separation**: at the same times, two performers whose angular
   *   separation from the camera is smaller than the sum of their angular radii,
   *   `atan(silhouetteRadius / distance)` each, get one note at the first such
   *   time; a pair with either root nearer than the near plane at that time is
   *   left to the framing metric.
   * - **Contact connection**: a `hit` or `contact` event with a point and a target
   *   whose performer's root lies farther than `contactRadius` from the point at
   *   the event time gets one note.
   *
   * The first two metrics need a live camera with a finite field of view in `(0,
   * 180)` degrees and `far > near`; without one they are skipped. A root is a
   * point, so a subject whose body is in frame while its root is not is reported;
   * that approximation holds for all three metrics.
   *
   * @param props The shot, its scene and motions, the metric parameters, and the
   *   grammar findings to file first.
   * @returns The grammar notes followed by the visual-read notes.
   */
  export function reviewVisualRead(props: IAutoMovieReviewVisualRead.IProps): IAutoMovieReviewNote[] {
    return reviewVisualReadImplementation(props);
  }

  /**
   * World root velocity of a node playing `clip` at clip-local `localTime`, in
   * metres per second, from a backward difference of the clip's root folded
   * through the node's staged placement.
   *
   * The window ends at `localTime` and spans {@link VELOCITY_DT} where it can. A
   * looping clip's root jumps back at the seam, so the window never crosses it:
   * within a cycle it is the trailing `VELOCITY_DT`, in the cycle's first
   * instants it shrinks to `[0, phase]`, and exactly on the seam it measures the
   * cycle's closing stretch with the clip sampled unlooped, so reading `duration`
   * does not wrap to the cycle start. A one-shot clip sampled at or before its
   * end uses the same trailing window clamped at zero, and a sample after its end
   * answers zero because the pose is held. A window of zero length, such as a
   * one-shot at time zero, answers zero.
   *
   * `resolveBeatSnapshot` stores the result as an actor's `rootVelocity`, the
   * momentum the next beat continues.
   *
   * @param node Scene node whose staged transform the root is folded through.
   * @param clip Motion the node plays.
   * @param localTime Clip-local seconds the velocity is measured at.
   * @returns World velocity in metres per second.
   */
  export function rootVelocityOf(node: IAutoMovieSceneNode, clip: IAutoMovieMotion, localTime: number): IAutoMovieVector3 {
    return rootVelocityOfImplementation(node, clip, localTime);
  }

  /**
   * Read the material at an in-shot time from one admitted practical surface
   * track. The most recent key at or before the requested seconds takes effect.
   */
  export function samplePracticalSurfaceTrackMaterial(track: IAutoMoviePracticalSurfaceTrack, seconds: number): string {
    return samplePracticalSurfaceTrackMaterialImplementation(track, seconds);
  }

  /**
   * Resolve one film-global frame to the shot frames that compose it, with
   * dissolve and fade weights.
   *
   * The active segment is the last one whose `[startFrame, endFrame)` contains
   * the frame; the canonical builder orders segment starts without gaps. Inside
   * an incoming dissolve of `d` frames, at offset `k` into the segment, the
   * outgoing segment's tail frame `sourceOutFrame - d + k` is layered at weight
   * `1 - k / d` under the incoming frame at `k / d`. Otherwise the one layer is
   * weighted by the smaller of an incoming fade's `k / d` and an outgoing fade's
   * `remaining / d`, where `remaining` counts this frame and the ones after it in
   * the segment. The timestamp is independently computed binary64 frame time at
   * the reduced rational rate, not an exact rational value.
   *
   * The answer depends only on the timeline and the frame number, so a browser
   * seek, a render chunk and a full render resolve the same layers. Throws when
   * the frame is not a safe integer inside `[0, totalFrames)`, when no segment
   * contains it, when a dissolving segment has no predecessor, or when the
   * timeline's rate fields disagree.
   *
   * @param timeline The canonical film timeline.
   * @param globalFrame Film-global frame index.
   * @returns The frame index, its time in seconds, and its weighted layers.
   */
  export function sampleProductionRenderFrame(timeline: IAutoMovieFilmTimeline, globalFrame: number): IAutoMovieProductionRenderFrame {
    return sampleProductionRenderFrameImplementation(timeline, globalFrame);
  }

  /**
   * Index of the key in force at shot-local `seconds` on one admitted surface
   * graphic track: the last key whose time is at or before `seconds`, so a key
   * takes effect at its exact time and holds until the next key.
   *
   * The result depends on `seconds` alone, so a seek, a reverse seek and a
   * sequential run read the same key. Admission opens every track at zero, so a
   * key exists at every in-shot time; a time before zero or a non-finite one
   * throws a `RangeError`.
   */
  export function sampleSurfaceGraphicKey(track: IAutoMovieSurfaceGraphicTrack, seconds: number): number {
    return sampleSurfaceGraphicKeyImplementation(track, seconds);
  }

  /**
   * The refinement chain above one screenplay node, nearest first and excluding
   * the node itself: `["scene-1", "act-1", "intent"]` for a beat under that
   * scene.
   *
   * Feedback located on a leaf walks this chain so a correction can target the
   * beat, the scene, the act or the intent; which level to fix is the agent's
   * call. The walker serves trees `validateScriptTree` has accepted, but throws
   * on an unknown `nodeId`, a parent reference that does not resolve, or a parent
   * cycle, naming the id at fault, because a chain that silently stopped short
   * would misdirect the correction round. When ids repeat, the last node with an
   * id is the one walked.
   *
   * @param tree Every node of the screenplay tree.
   * @param nodeId The node whose ancestors are wanted.
   * @returns Ancestor ids from the parent up to the root.
   */
  export function scriptAncestors(tree: readonly IAutoMovieScriptNode[], nodeId: string): string[] {
    return scriptAncestorsImplementation(tree, nodeId);
  }

  /**
   * Place every shot interaction event onto the sequence output clock, once per
   * play.
   *
   * An entry emits the events inside its trimmed source range `[from, to)`, each
   * at `start + (time - offset) / rate`; events outside every trim are omitted.
   * The source end uses the exact symbolic trim boundary when present. An event
   * at that boundary uses the played output end. The range is half-open so an
   * event exactly on a contiguous trim seam is emitted once, by the entry that
   * starts there. It closes at `to` in two cases: when the trim ends at the
   * shot's own end, so a shot-final event is never lost, and when no other entry
   * of the same shot both starts at that shot-local instant and starts at this
   * entry's global end, so cutting away exactly on a hit keeps the hit. A replay
   * of the same source span elsewhere on the output clock, such as a flashback,
   * does not take the seam event from the cut, because only a globally contiguous
   * entry shows the same on-screen instant.
   *
   * Each entry that shows an instant emits that instant's events at its own
   * global time, so an event replayed by a flashback lands once per play. The
   * events are ordered by global time, then entry index, then event id by UTF-16
   * code units. Each keeps its shot-local `time` and adds `shotTime`, `entry`,
   * `shot` and `globalTime`. Throws what {@link sequenceTimeline} throws.
   *
   * @param sequence The cut, already accepted by `cutSequence`.
   * @param shots Every shot the cut references.
   * @returns Every emitted play of every event, in output order.
   *
   *   Symbolic trims and retimed plays use exact event membership. On an adjacent
   *   same-shot hard cut involving either, both plays use exact adjoining edges.
   *   When the edges meet, the incoming source start owns the seam. Numeric
   *   duration reconstruction can disagree with that start by binary64 roundoff.
   *   Outside a shared seam the numeric source end is the binary64 sum of the
   *   start and duration. Select an end event explicitly to keep an independently
   *   authored time. If the numeric sum rounds back to the start, an event at
   *   that instant is still an opening event. Other numeric edges retain the
   *   existing tolerance.
   */
  export function sequenceEventTimeline(sequence: IAutoMovieSequence, shots: IAutoMovieShot[]): IAutoMoviePlaybackEvent[] {
    return sequenceEventTimelineImplementation(sequence, shots);
  }

  /**
   * Lay the cut onto the output clock, the playback mirror of `cutSequence`'s
   * runtime arithmetic: each entry occupies its retained source duration divided
   * by its playback rate, and a transition pulls its entry forward to overlap the
   * previous entry's tail by the transition's duration.
   *
   * Precondition: the sequence passed `cutSequence`, so every trim fits its shot
   * and every transition fits both adjacent output spans. The structural faults
   * this layout cannot proceed past still throw, naming the offending position:
   * an empty sequence, a transition on the first entry, a sequence entry whose
   * shot is not supplied, two supplied shots sharing an id, and a nondefault
   * playback rate that cannot produce a representable output span.
   *
   * @param sequence The cut, already accepted by `cutSequence`.
   * @param shots Every shot the cut references; extra shots are allowed.
   * @returns One placement per sequence entry and the total runtime in seconds.
   */
  export function sequenceTimeline(sequence: IAutoMovieSequence, shots: IAutoMovieShot[]): IAutoMoviePlaybackTimeline {
    return sequenceTimelineImplementation(sequence, shots);
  }

  /**
   * Every bone's rest-pose frame in model space, composed down the parent chain.
   *
   * A bone's frame is its parent's frame composed with its own rest translation
   * and rotation: `translation = parent.translation + parent.rotation ·
   * rest.translation` and `rotation = parent.rotation ∘ rest.rotation`. Rigs keep
   * unit scale, which Engine FK and the viewer both assume, so translation and
   * rotation are the whole transform. Units are the rig's metres.
   *
   * Throws when a bone name is duplicated, a parent is not declared, or the
   * parent links form a cycle, because a rest frame measured from a malformed rig
   * would silently misplace whatever is measured against it.
   */
  export function skeletonRestFrames(skeleton: IAutoMovieSkeleton): ReadonlyMap<
  AutoMovieHumanoidBone,
  Pick<IAutoMovieTransform, "translation" | "rotation">
> {
    return skeletonRestFramesImplementation(skeleton);
  }

  /**
   * The smallest box containing every given box, or null when none were given.
   *
   * The corners are folded one box at a time rather than spread into `Math.min`,
   * so a union over hundreds of thousands of part boxes, such as a building's
   * contents, returns a box instead of throwing a `RangeError` for too many call
   * arguments. A `NaN` corner propagates into the result. The returned box is
   * new; the input boxes are not modified.
   */
  export function unionSubjectBoxes(boxes: readonly IAutoMovieSubjectBox[]): IAutoMovieSubjectBox | null {
    return unionSubjectBoxesImplementation(boxes);
  }

  /**
   * Refuse a camera framing or move the framing grammar cannot compile, and say
   * which of the two are usable.
   *
   * The values are `unknown` because a `frame` action and a blocking coverage
   * intent reach `performShot` in-process without the transport's structural
   * gate. Each unknown value is one `type` violation at `<path>.framing` or
   * `<path>.move` listing the accepted values, the members of
   * {@link CAMERA_FRAMINGS} and {@link CAMERA_MOVES} in declaration order.
   *
   * A refused value whose string conversion throws is described as `an
   * uninspectable value`; its original reference remains in the finding and the
   * other vocabulary is still checked.
   *
   * @param out Collector the violations are pushed into.
   * @param path Violation path of the action or intent.
   * @param framing The framing as authored.
   * @param move The move as authored.
   * @returns Whether the framing and the move are each one the grammar accepts.
   */
  export function validatePerformShotFraming(out: IAutoMovieViolationAppendSink, path: string, framing: unknown, move: unknown): IAutoMovieValidatePerformShotFraming.IResult {
    return validatePerformShotFramingImplementation(out, path, framing, move);
  }

  /**
   * Gate one relation that cites another prop's declared contact point.
   *
   * The cited prop must differ from the citing one and be declared exactly once,
   * its model must declare the cited affordance, and that affordance must have
   * the kind the relation needs: `stack-top` to rest on (`on-support`), `socket`
   * to attach, `hook` to hang (`suspended`). The first failing rule is reported
   * under `<path>.target.prop` or `<path>.target.affordance` and the rest are not
   * judged, because each depends on the one before.
   *
   * @param props.relation The relation whose target is checked; its kind picks
   *   the affordance kind.
   * @param props.target The relation's prop-affordance target.
   * @param props.path Violation path of the relation.
   * @param props.node Node id of the citing prop.
   * @param props.matches Every registry prop declaring the cited node.
   * @param out Collector the violations are appended to.
   */
  export function validatePropAffordanceTarget(props: IAutoMovieValidatePropAffordanceTarget.IProps, out: IAutoMovieViolationCollector): void {
    validatePropAffordanceTargetImplementation(props, out);
  }

  /**
   * Judge every volume the sound part of a prop registry claims: keep-out
   * clearances, pairwise occupancy, support contact, space containment, opening
   * fit and passage intrusion.
   *
   * "Sound" is deliberately narrow: a prop is measured only when it forged, when
   * its node is declared once, when exactly one staged piece places it, and when
   * any footprint it declares is a real volume. Measuring an ambiguous, unforged
   * or degenerate prop would report a second failure caused by the first, and the
   * author would correct the wrong line. Sound props without a `placement` are
   * still measured as occupants others must clear and as hosts others rest on,
   * but claim nothing themselves.
   *
   * Pairwise overlap is checked only when both staged props declare `placement`,
   * and is refused unless one declares contact through a prop affordance. A prop
   * is judged against the environment it occupies, or, when it names no space,
   * the one building all its building relations cite; relations spanning two
   * buildings name no single place and are not measured. An opening is fitted
   * through the rest-pose world box of the element filling it, and a passage the
   * prop fills is not reported as one it blocks. Violations go to `out` in prop
   * declaration order within each check.
   */
  export function validatePropPlacementGeometry(props: IAutoMovieValidatePropPlacementGeometry.IProps): void {
    validatePropPlacementGeometryImplementation(props);
  }

  /**
   * Validate a source-owned prop registry, its unique staged join, its typed
   * building relations, its support graph, the bearing of every prop on the face
   * it says holds it up, and every transformed volume it claims.
   *
   * Registry construction is deliberately a separate first pass. A lamp may cite
   * a table declared later without changing the result, while duplicate prop,
   * set-piece, or building-environment identities stay explicit rather than being
   * hidden by `Map`'s last-write-wins behavior. Each prop is forged with
   * `forgeProp`, whose violations are re-rooted at the prop's path, and must be
   * staged by exactly one set piece drawing its model.
   *
   * A relation must cite a target kind its relation kind accepts, a target that
   * resolves, and, for a prop affordance, a different, uniquely declared prop
   * whose affordance has the kind the relation needs: `stack-top` to rest on,
   * `socket` to attach, `hook` to hang. A prop occupies at most one space and
   * fills at most one opening, every building relation stays in the occupied
   * space's environment, a supporting prop stays there too, and contact relations
   * may not form a cycle. Footprints and clearances need finite, positive extents
   * and clearance ids are unique per prop.
   *
   * A prop omitting placement makes no relation, containment, overlap or passage
   * claim of its own, but its staged occupancy can obstruct another prop's
   * clearance and its model affordances can support another prop. Geometry
   * delegates to validatePropPlacementGeometry: a space subtree with neither
   * cells nor shells imposes no containment restriction, shell-only spaces are
   * measured, and model-less fills or ambiguous staging joins cannot supply the
   * corresponding bounds.
   *
   * Where a prop's appearance came from changes nothing here. A prop drawing an
   * external asset (`IAutoMoviePropSpec.modelRef`) forges like any other, so it
   * is contained, borne, cleared, and judged against passages through exactly
   * these rules, read off the deterministic proxy `propOccupancyBounds` measures
   * and the affordances its own spec declares.
   */
  export function validatePropPlacements(props: IAutoMovieValidatePropPlacements.IProps): IAutoMovieValidation {
    return validatePropPlacementsImplementation(props);
  }

  /**
   * Refuse a prop that transitively rests on, plugs into, or hangs from itself
   * through `prop-affordance` relations.
   *
   * Only props whose node is declared once take part, and a relation citing an
   * unresolved, ambiguous or self-same prop is skipped, because
   * `validatePropPlacements` already refuses those by name. Each encountered DFS
   * back edge is reported at its closing relation under
   * `$input.props[i].placement.relations[j].target.prop`, visiting props in
   * declaration order.
   *
   * @param props The prop registry in declaration order.
   * @param out Collector the violations are appended to.
   */
  export function validatePropSupportCycles(props: readonly IAutoMoviePropSpec[], out: IAutoMovieViolationCollector): void {
    validatePropSupportCyclesImplementation(props, out);
  }

  /**
   * Check a shot runtime's D010 physics advice before `compileDefinedShot` stages
   * anything, returning every `contract-mismatch` diagnostic at once.
   *
   * Each id must be unique, and each decision must match its payload: pending
   * keeps `selected` and `rationale` null, `accepted` selects a response equal to
   * the proposal, `modified` selects a different one, `rejected` selects none,
   * and every decided item states a non-blank rationale. Responses are compared
   * by value with object keys sorted, so key insertion order never decides
   * between `accepted` and `modified`. An empty list means the advice is valid;
   * the advice itself is never applied here.
   */
  export function validateShotPhysicsAdvice(advice: readonly IAutoMovieShotPhysicsAdvice[]): IAutoMovieAuthoringDiagnostic[] {
    return validateShotPhysicsAdviceImplementation(advice);
  }

  /**
   * Hold a built shot program to its registration before `compileDefinedShot`
   * stages it, returning every `build`-phase `contract-mismatch` diagnostic at
   * once; an empty list means the program may be staged.
   *
   * The staged scene id must equal the registered scene, and blocking and
   * performance must both carry the contract's beat and `durationSeconds`
   * exactly. Each actor program must name a distinct staged actor and a model,
   * with a finite speed above zero and a finite non-negative eye height; only the
   * first failing fact of an actor is reported. Event samples must cover every
   * contract event exactly once, each finite and inside its inclusive window in
   * shot-local seconds, and may name no undeclared event.
   */
  export function validateShotProgramContract<Context>(shot: IAutoMovieDefinedShot<Context>, program: IAutoMovieShotProgram): IAutoMovieAuthoringDiagnostic[] {
    return validateShotProgramContractImplementation<Context>(shot, program);
  }

  /**
   * Verify a saved version 1 take against independently reconstructed production
   * facts.
   *
   * Pass production identity, source, parent and freshly measured provenance
   * before rebuilding motion. When an admitted cut has been prepared, pass its
   * rederived anchor too. The ledger order is immaterial. A difference throws a
   * diagnostic identifying the changed field or ledger key.
   */
  export function verifyMotionTake(take: IAutoMovieMotionTake, current: Omit<IAutoMovieMotionTake, "version" | "replay" | "anchor"> & {
    anchor?: IAutoMovieMotionTakeAnchor;
  }): void {
    verifyMotionTakeImplementation(take, current);
  }

  /**
   * Signed distance in metres from a section plane to a world point, `n̂·(p −
   * p0)`.
   *
   * Positive is the removed side, negative is the kept side, and exactly zero is
   * the plane itself, which is kept. A cut taken at a floor's own level puts
   * every vertex of that floor at exactly zero, so dropping them would delete the
   * surface the reviewer asked to stand on. `three.js` discards a fragment only
   * at a negative distance to its own plane, which the viewer builds from the
   * negated normal, so this number and the drawn pixel agree at the boundary.
   *
   * Throws a `RangeError` when the plane's normal is zero or not finite, or its
   * point is not finite, because such a plane names no half-space. A non-finite
   * query point is not refused and yields `NaN`.
   */
  export function autoMovieSectionPlaneDistance(plane: IAutoMovieSectionPlane, point: IAutoMovieVector3): number {
    return autoMovieSectionPlaneDistanceImplementation(plane, point);
  }

  /**
   * Whether every declared section plane keeps this world point.
   *
   * The planes intersect rather than union: a point survives only when no plane
   * removes it, and a point exactly on a plane is kept. That is what `three.js`
   * applies with `clipIntersection` false, which the viewer's
   * `applyAutoMovieSectionPlanes` writes explicitly, so a point this reports as
   * kept is a point the renderer draws. A union would let a second plane restore
   * what the first cut away.
   *
   * An empty plane list keeps everything, which makes "no section" the absence of
   * a declaration rather than a separate mode. A degenerate plane throws the
   * `RangeError` of {@link autoMovieSectionPlaneDistance} when it is reached;
   * evaluation stops at the first plane that removes the point.
   */
  export function autoMovieSectionPlanesKeepPoint(planes: readonly IAutoMovieSectionPlane[], point: IAutoMovieVector3): boolean {
    return autoMovieSectionPlanesKeepPointImplementation(planes, point);
  }

  /**
   * Check that no camera body or parent rig in a performed shot touches a staged
   * node, and return one clear report per envelope-bearing take.
   *
   * The hero take and every coverage take whose staged camera declares
   * `clearance` are inspected; the others are skipped, and a shot with none
   * returns `undefined` without reading `runtime`. Each such take is sampled at
   * {@link cameraClearanceSampleTimes}, and every staged node is an obstacle: a
   * node nothing animates is its rest box through its placement
   * ({@link nodeSubjectBox}), and an animated one is a box around its current root
   * holding {@link cameraClearanceDeformationRadius} scaled by its largest
   * absolute scale component, which stays valid under any rotation or pose.
   * {@link evaluateCameraClearance} then sweeps each interval.
   *
   * Every refusal is pushed to `out` with an author-facing path, and the result
   * is then `undefined`: a hero or coverage camera the scene does not stage, a
   * missing `runtime`, a sample rate that is not finite and positive, a stale
   * geometry revision (one item per take, before any geometry is read), a
   * morph-weight track, a node whose model is absent, fails `validateModel`,
   * draws nothing or whose bound overflows, a motion the clock cannot bound, and
   * every contact the evaluator finds. Items already in `out` belong to the
   * caller and do not count as refusals here.
   */
  export function compileCameraClearanceReports(props: IAutoMovieCompileCameraClearanceReports.IProps): IAutoMovieCameraClearanceReport[] | undefined {
    return compileCameraClearanceReportsImplementation(props);
  }

  /**
   * Sweep one camera take's body and optional parent-rig spheres over every
   * adjacent pair of samples and report each contact with each obstacle.
   *
   * For each interval, each sphere's centre travels the segment between its two
   * transformed positions, its radius grows by the camera's largest absolute
   * scale component and by the sagitta of the arc the centre sweeps under the
   * interval's shortest-path rotation, and that capsule is tested against each
   * obstacle's union of its two endpoint boxes. Touching counts as contact. A
   * single sample is tested as a stationary sphere. A revision mismatch returns a
   * `stale` report with no samples before any geometry is read.
   *
   * The capsule bound assumes linear camera translation, constant camera scale,
   * constant-speed slerp rotation and obstacles contained by their endpoint-box
   * union. The compiler refines keys and keeps staged camera scale, but the
   * sampler uses normalized lerp below about 3.6 degrees; its deviation is not
   * covered by the slerp sagitta. Direct callers must also supply the
   * constant-scale and endpoint-containment premises. Floating geometry remains
   * numerical, without pixel observation.
   *
   * Findings are ordered by interval, then body before parent rig, then obstacle
   * id in UTF-16 code-unit order, so every host reports the same sequence.
   *
   * @param input - Complete current-revision camera and obstacle sample plan.
   * @returns The take's report: `clear` with no findings, `blocked` with each
   *   contact's part, obstacle and inclusive interval, or `stale`.
   * @throws Error when the sample rate or duration is invalid, when the samples
   *   omit a fixed-clock instant, leave `[0, duration]` or are not strictly
   *   increasing, or when a box is non-finite or inverted, an obstacle id repeats
   *   within a sample, or the obstacle id set changes between samples.
   */
  export function evaluateCameraClearance(input: IAutoMovieCameraClearanceEvaluation): IAutoMovieCameraClearanceReport {
    return evaluateCameraClearanceImplementation(input);
  }

  /**
   * The STAGING consumer: fold the script's cast and the staging write's
   * placements into the {@link IAutoMovieScene} every later stage performs into,
   * or return every violation for the correction round.
   *
   * Referential integrity is the core check: every placement names a cast member,
   * every cast member is placed, ids are unique across actors, set pieces,
   * cameras and lights, a mount rides another placed actor, and a camera's
   * `lookAt` node is a placed actor, set piece or camera, the same table the
   * performance stage resolves positional targets against. Scalars are
   * range-checked where a later stage could not use them: finite positions and
   * turns, a unit set rotation not combined with `facingDeg`, a positive finite
   * set scale, a field of view in `(0, 180)` degrees, `0 < near < far`, the
   * camera's depth precision and clearance envelope, a non-negative light
   * intensity, each light's shape, and a finite derived camera look direction
   * that does not collapse to its own position. Geometry is converted, not
   * judged: whether 0.7 m is striking range is the reviewer's business.
   *
   * Conversions: an actor's `facingDeg`, about `+Y` with 0 facing `+Z`, becomes
   * its rotation; a set piece becomes a static node through
   * {@link setPieceTransform}; a camera's `lookAt` resolves to a point and the
   * level-horizon look basis aims its `-Z` there; a light lowers through
   * {@link lowerLightPlacement} to the scene light its `type` names.
   *
   * The optional `space`, the ground's walkable meaning, is accepted by
   * {@link validateSpace} with its paths re-rooted under `$input.space`, and is
   * composed as `space: null` when omitted, the scalar ground plane. An authored
   * `fog` lowers verbatim, while `fogVisibility` solves the density from
   * camera-axis depth and transmittance. {@link resolveStagedFog} admits one form
   * and leaves fog absent when neither is authored. A `medium` is admitted by
   * {@link resolveStagedMedium}, refused beside either fog form, and lowered
   * verbatim. The optional `environment` is checked by
   * {@link validateSceneEnvironment} against the staged lights and lowered
   * verbatim.
   *
   * @param script The screenplay whose cast staging must place.
   * @param staging The staging write.
   * @returns The composed scene with its persistent mounts and authored actor
   *   support scopes, or every violation.
   */
  export function stageScene(script: IAutoMovieScript, staging: IAutoMovieStage): IAutoMovieStagedSet {
    return stageSceneImplementation(script, staging);
  }

  /**
   * Bake the `attachTo` verb into the child object's follow clip, the per-frame
   * realisation of a rigid coupling to a parent's bone (a sword in a hand, a prop
   * on a saddle). The child is not a rig, so, like a projectile, it moves by a
   * node clip of translation and rotation tracks, not a pose motion.
   *
   * Each sample resolves the parent's posed skeleton at that instant through
   * {@link resolveAttachment}, which runs the parent's FK, to compose the child's
   * bone-local offset into the parent's model space, then composes that onto the
   * parent's world frame: its staged placement, or, when the parent itself rides
   * a coupling this shot, its ridden frame from `parentTransformAt` (#1140):
   *
   * - `translation = parentPos + parentRot · childLocal.translation`
   * - `rotation = parentRot ∘ childLocal.rotation`
   *
   * The parent's scale is not applied, which matches the renderer for the
   * unit-scale actors staging places. Pass the same `jointAxes` the renderer
   * poses the parent with (`HUMANOID_JOINT_AXES`), plus the same `restFrames`
   * when parent clips are authored in clinical space, or the child follows a bone
   * where the renderer does not draw it. A parent with no motion holds its rest
   * pose.
   *
   * The clip is shot-local: N = max(1, round(duration × fps)) equal intervals
   * give N + 1 keys including both ends of [start, start + duration], with
   * duration set to `shotDuration`, the same convention as `cameraMotion`. Read
   * alone through `sampleClip` it clamps to the child's first frame before
   * `start`; playback reads it through `sampleClipSequence`, where it writes
   * nothing before `start` and holds its last frame after the coupling ends. The
   * clip id is `attach:<child>`; a caller baking several couplings of one child
   * suffixes repeats. Throws a `RangeError` for nonfinite/nonpositive duration or
   * fps, or an unsafe rounded interval count that cannot support an advancing
   * indexed loop. This representability gate is not a workload cap; callers still
   * own feasible memory use and representable distinct key times.
   */
  export function compileAttach(props: AutoMovieEngineFilmTypes.ICompileAttachProps): IAutoMovieClip {
    return compileAttachImplementation(props);
  }

  /**
   * Bake the object couplings a shot carries, the per-beat `attachTo` handoffs
   * and the persistent staged `mounts` (#674), into follow clips once the
   * parents' poses have compiled.
   *
   * `attachTo`, already validated by `performShot`'s action scan, rides the child
   * on the parent's bone in scene space and emits the grab, attach, detach and
   * release {@link handoffEvents}. Each staged mount descends through the same
   * baker, {@link compileAttach}, spanning the whole shot, so a rider rides every
   * beat without re-issuing `attachTo`; an explicit `attachTo` for the same child
   * this shot replaces its mount, and a mount emits no handoff events because it
   * is standing scene state. A mount's parent rig and bone are validated here,
   * since staging placed the parent without skeletons, and returned as
   * violations.
   *
   * Couplings chain (#1140): a parent that is itself a coupled child this shot,
   * such as a rider mounted on an animal and carrying a pole, is baked first, and
   * its riders compose onto its baked frame per sample through any depth. That
   * frame is read from all of the parent's baked clips through
   * {@link bakedTransformFromClipsAt}, the channel authority playback uses, so
   * before the parent's first coupling starts its riders follow its staged
   * placement and across a handoff they follow whichever coupling is in effect. A
   * coupling cycle has no world composition, so its members are reported in one
   * violation and never baked.
   *
   * Returns the baked clips in bake order, parents before riders, with a child's
   * attach clips in start order and repeats suffixed `attach:<child>:2`, ...; the
   * handoff events; and the violations.
   */
  export function coupleObjects(props: AutoMovieEngineFilmTypes.ICoupleObjectsProps): IAutoMovieCoupleObjects.IResult {
    return coupleObjectsImplementation(props);
  }

  /** Compile one registered shot through the film owner. */
  export function compileDefinedShot<Context>(
    props: IAutoMovieCompileDefinedShot.IProps<Context>,
  ): IAutoMovieCompiledDefinedShot {
    return compileDefinedShotImplementation(props);
  }

  /** Gate one positional target and resolve it to a world point, or null. */
  export function resolvePerformShotTarget(
    context: Pick<IAutoMovieEnginePerformShotGateContext, "out" | "nodeIds" | "nodePositions" | "formationPoints" | "formationById" | "skeleton" | "hasActorContext" | "targetAt">,
    props: IAutoMovieResolvePerformShotTarget.IProps,
  ): IAutoMovieVector3 | null {
    return resolvePerformShotTargetImplementation(context, props);
  }

  /** Build the framing reader for one already-gated camera subject. */
  export function createPerformShotSubjectFramer(
    context: AutoMovieEngineFilmTypes.ICreatePerformShotSubjectFramerContext,
    props: IAutoMovieCreatePerformShotSubjectFramer.IProps,
  ): (on: IAutoMovieActionTarget, start?: number) => IAutoMovieFramedSubject {
    return createPerformShotSubjectFramerImplementation(context, props);
  }

  /** Resolve an already-gated target at the shot's opening. */
  export function resolvedPerformShotPoint(
    context: AutoMovieEngineFilmTypes.IResolvedPerformShotPointContext,
    target: IAutoMovieActionTarget,
  ): IAutoMovieVector3 {
    return resolvedPerformShotPointImplementation(context, target);
  }

  /** Sample a practical surface material at a shot-local instant. */
  export function samplePracticalSurfaceMaterial(
    shot: Pick<IAutoMovieShot, "duration" | "practicalSurfaces">,
    node: string,
    part: string,
    time: number,
  ): string | undefined {
    return samplePracticalSurfaceMaterialImplementation(shot, node, part, time);
  }

  /** Project admitted shot markers through each play of a sequence. */
  export function sequenceEditorialMarkerTimeline(
    sequence: Pick<IAutoMovieSequence, "shots">,
    { timeline, shotById }: {
      timeline: Pick<IAutoMoviePreparePlaybackTimeline.IResult["timeline"], "entries">;
      shotById: ReadonlyMap<string, { shot: Pick<IAutoMovieShot, "duration" | "editorialMarkers"> }>;
    },
  ): IAutoMoviePlaybackEditorialMarker[] {
    return sequenceEditorialMarkerTimelineImplementation(sequence, { timeline, shotById });
  }

  /**
   * Compile admitted actions through an injected synthesizer into exact
   * actor-keyed timelines and deterministic region-loss reports. Null synthesis
   * is skipped; repeat expands one returned cycle, same-region nonoverlapping
   * actions arrange into lanes, and concurrent lanes layer sampled poses.
   */
  export function compilePerformance(actions: IAutoMovieActionCall[], synthesize: IAutoMovieActionSynthesizer): IAutoMovieCompiledPerformance {
    return compilePerformanceImplementation(actions, synthesize);
  }

  /**
   * Resolve a staged node, literal point or complete group to world metres. Node
   * and point results alias their supplied vectors. A group returns a fresh
   * centroid with each named node or formation weighted once; an empty group or
   * any absent member returns null, so resolution never changes the authored
   * group.
   *
   * Relative goals and live bones need facing, camera or rig inputs and return
   * null here. Callers validate target shapes and finite coordinates first. A
   * group naming formations requires their world-point table too.
   *
   * @param target The admitted positional target or unsupported relative/live
   *   kind.
   * @param nodes Staged node and camera positions, read without mutation.
   * @param formations Compact formation positions, each one centroid member.
   * @returns The aliased node/point vector, a fresh group centroid, or null.
   */
  export function resolveTargetPoint(target: IAutoMovieActionTarget, nodes: ReadonlyMap<string, IAutoMovieVector3>, formations?: ReadonlyMap<string, IAutoMovieVector3>): IAutoMovieVector3 | null {
    return resolveTargetPointImplementation(target, nodes, formations);
  }

  /**
   * Build the staged positional-target table from camera translations followed by
   * node translations, in world metres. Node entries win an illegally repeated
   * camera/node id; values are borrowed from the scene and the map belongs to the
   * caller.
   */
  export function scenePlacements(scene: IAutoMovieScene): Map<string, IAutoMovieVector3> {
    return scenePlacementsImplementation(scene);
  }
}
