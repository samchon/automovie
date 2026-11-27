import { classifyAutoMovieCameraInspection as classifyAutoMovieCameraInspectionImplementation } from "./internal/classifyAutoMovieCameraInspection";
import { clipTrackShapeFaults as clipTrackShapeFaultsImplementation } from "./internal/clipTrackShapeFaults";
import { isAutoMovieMaterialExtension as isAutoMovieMaterialExtensionImplementation } from "./internal/isAutoMovieMaterialExtension";
import { materialTextureSlots as materialTextureSlotsImplementation } from "./internal/materialTextureSlots";
import { readAutoMovieImageFacts as readAutoMovieImageFactsImplementation } from "./internal/readAutoMovieImageFacts";

import { validateAffordance as validateAffordanceImplementation } from "./internal/validateAffordance";
import { validateAutoMovieFormationMotions as validateAutoMovieFormationMotionsImplementation } from "./internal/validateAutoMovieFormationMotions";
import { validateAffordanceArticulation as validateAffordanceArticulationImplementation } from "./internal/validateAffordanceArticulation";
import { validateAutoMovieFormationGround as validateAutoMovieFormationGroundImplementation } from "./internal/validateAutoMovieFormationGround";
import { validateAutoMovieFormationOverlap as validateAutoMovieFormationOverlapImplementation } from "./internal/validateAutoMovieFormationOverlap";
import { validateAutoMovieFormationSlotMotions as validateAutoMovieFormationSlotMotionsImplementation } from "./internal/validateAutoMovieFormationSlotMotions";
import { affordanceFollowedTravel as affordanceFollowedTravelImplementation } from "./internal/affordanceFollowedTravel";
import { affordanceLeadingTravel as affordanceLeadingTravelImplementation } from "./internal/affordanceLeadingTravel";
import { affordanceTravelRange as affordanceTravelRangeImplementation } from "./internal/affordanceTravelRange";
import { validateAutoMovieEffects as validateAutoMovieEffectsImplementation } from "./internal/validateAutoMovieEffects";
import { validateBalanceSupport as validateBalanceSupportImplementation } from "./internal/validateBalanceSupport";
import { validateClipArtifact as validateClipArtifactImplementation } from "./internal/validateClipArtifact";
import { validateColor as validateColorImplementation } from "./internal/validateColor";
import { validateContinuity as validateContinuityImplementation } from "./internal/validateContinuity";
import { validateDeclaredReferences as validateDeclaredReferencesImplementation } from "./internal/validateDeclaredReferences";
import { validateExpressionResult as validateExpressionResultImplementation } from "./internal/validateExpressionResult";
import { validateExtents as validateExtentsImplementation } from "./internal/validateExtents";
import { validateFilmContinuity as validateFilmContinuityImplementation } from "./internal/validateFilmContinuity";
import { validateFootSkate as validateFootSkateImplementation } from "./internal/validateFootSkate";
import { validateGroundContact as validateGroundContactImplementation } from "./internal/validateGroundContact";
import { validateHonorableChannel as validateHonorableChannelImplementation } from "./internal/validateHonorableChannel";
import { validateJointConstraint as validateJointConstraintImplementation } from "./internal/validateJointConstraint";
import { validateLookAt as validateLookAtImplementation } from "./internal/validateLookAt";
import { validateMaterialLobes as validateMaterialLobesImplementation } from "./internal/validateMaterialLobes";
import { validateMaterialOverlays as validateMaterialOverlaysImplementation } from "./internal/validateMaterialOverlays";
import { validateMaterialProcedural as validateMaterialProceduralImplementation } from "./internal/validateMaterialProcedural";
import { validateMaterialWear as validateMaterialWearImplementation } from "./internal/validateMaterialWear";
import { validateModelImages as validateModelImagesImplementation } from "./internal/validateModelImages";
import { validateMotion as validateMotionImplementation } from "./internal/validateMotion";
import { validatePoseResult as validatePoseResultImplementation } from "./internal/validatePoseResult";
import { validateProfileCapabilities as validateProfileCapabilitiesImplementation } from "./internal/validateProfileCapabilities";
import { validateSceneEnvironment as validateSceneEnvironmentImplementation } from "./internal/validateSceneEnvironment";
import { validateScriptTree as validateScriptTreeImplementation } from "./internal/validateScriptTree";
import { validateSelfIntersection as validateSelfIntersectionImplementation } from "./internal/validateSelfIntersection";
import { validateShotArtifact as validateShotArtifactImplementation } from "./internal/validateShotArtifact";
import { validateSkeletonGraph as validateSkeletonGraphImplementation } from "./internal/validateSkeletonGraph";
import { validateSpace as validateSpaceImplementation } from "./internal/validateSpace";
import { validateSurfaceHeightRule as validateSurfaceHeightRuleImplementation } from "./internal/validateSurfaceHeightRule";
import { validateTextureAssets as validateTextureAssetsImplementation } from "./internal/validateTextureAssets";
import { validateTextureBinding as validateTextureBindingImplementation } from "./internal/validateTextureBinding";

import { validateModel as validateModelImplementation } from "./internal/validateModel";

import { type IAutoMovieMesh, type IAutoMovieViolationCollector, type IAutoMovieValidation, type IAutoMovieMeshTopologyValidationProps, type IAutoMovieBody, type IAutoMovieCapsuleProxy, type AutoMovieHumanoidBone, type IAutoMovieValidateTransformScalars, type IAutoMovieConstraintViolation, type IAutoMovieValidateUniqueBy, type IAutoMovieValidateTextureScale, type IAutoMovieBodyCollisionResult, type IAutoMovieDetectBodyCollision, type IAutoMovieFreeFallResult, type IAutoMovieDetectFreeFall, type IAutoMovieSupportResult, type IAutoMovieDetectSupportToppling, type IAutoMoviePlacedContact, type IAutoMoviePlacedContinuity, type IAutoMovieSceneCollision as Collision, type IAutoMovieSweptCapsuleCollision as Sweep, type IAutoMovieValidateModel, type IAutoMovieAffordance, type IAutoMovieDiagnostic, type IAutoMovieShotContract, type IAutoMovieCompiledShotSource, type IAutoMovieValidateFormationGround, type IAutoMovieValidateFormationOverlap, type IAutoMovieValidateFormationSlotMotions, type IAutoMovieAffordanceCoupling, type IAutoMovieAffordanceTravelRange, type IAutoMovieValidateBalanceSupport, type IAutoMovieClip, type IAutoMovieClipChannelGate, type IAutoMovieColor, type IAutoMovieViolationAppendRangeItemsSink, type IAutoMovieValidateContinuity, type IAutoMovieViolationAppendSink, type IAutoMovieExpression, type IAutoMoviePrimitiveShape, type IAutoMovieValidateFilmContinuity, type IAutoMovieValidateFootSkate, type IAutoMovieValidateGroundContact, type IAutoMovieChannel, type IAutoMovieJointConstraint, type IAutoMovieLookAt, type IAutoMovieSkeleton, type IAutoMovieValidateMaterialLobes, type IAutoMovieMaterialOverlay, type IAutoMovieValidateMaterialProcedural, type IAutoMovieMaterialWear, type IAutoMovieImage, type IAutoMovieValidateMotion, type IAutoMoviePose, type IAutoMovieValidateProfileCapabilities, type IAutoMovieValidateSceneEnvironment, type IAutoMovieValidateScriptTree, type IAutoMovieValidateSelfIntersection, type IAutoMovieShot, type IAutoMovieScene, type IAutoMovieValidateSpace, type IAutoMovieHeightRule, type IAutoMovieTextureClosureInput, type AutoMovieTextureBinding, type IAutoMovieCameraInspection, type IAutoMovieClipShapeFault, type IAutoMovieClipTrackShapeFaults, type IAutoMovieMaterialTextureSlotsMaterialTextureSlot, type IAutoMovieMaterial, type IAutoMovieTextureImageFacts } from "@automovie/interface";
import { validateMesh as validateMeshImplementation } from "./internal/validateMesh";
import { validateMeshTopology as validateMeshTopologyImplementation } from "./internal/validateMeshTopology";
import { validateBody as validateBodyImplementation } from "./internal/validateBody";
import { validateCapsule as validateCapsuleImplementation } from "./internal/validateCapsule";
import { validateTransformScalars as validateTransformScalarsImplementation } from "./internal/validateTransformScalars";
import { validateRange as validateRangeImplementation } from "./internal/validateRange";
import { validateUniqueBy as validateUniqueByImplementation } from "./internal/validateUniqueBy";
import { validateUniqueValues as validateUniqueValuesImplementation } from "./internal/validateUniqueValues";
import { validateTextureScale as validateTextureScaleImplementation } from "./internal/validateTextureScale";
import { detectBodyCollision as detectBodyCollisionImplementation } from "./internal/detectBodyCollision";
import { detectFreeFall as detectFreeFallImplementation } from "./internal/detectFreeFall";
import { detectSupportToppling as detectSupportTopplingImplementation } from "./internal/detectSupportToppling";
import { measureAutoMoviePlacedContact as measureAutoMoviePlacedContactImplementation } from "./internal/measureAutoMoviePlacedContact";
import { measureAutoMoviePlacedContinuity as measureAutoMoviePlacedContinuityImplementation } from "./internal/measureAutoMoviePlacedContinuity";
import { measureAutoMovieSceneCollision as measureAutoMovieSceneCollisionImplementation } from "./internal/measureAutoMovieSceneCollision";
import { measureAutoMovieSweptCapsuleCollision as measureAutoMovieSweptCapsuleCollisionImplementation } from "./internal/measureAutoMovieSweptCapsuleCollision";

/** Public operations for Auto Movie Engine Validation. */
export namespace AutoMovieEngineValidation {
  /**
   * Admit tuple/cardinality buffers, dense finite numeric elements, vertex
   * references, skin bindings, morph targets and their drivers, and shared welded
   * topology.
   */
  export function validateMesh(mesh: IAutoMovieMesh, path: string, boneNames: ReadonlySet<string>, collector: IAutoMovieViolationCollector): void {
    validateMeshImplementation(mesh, path, boneNames, collector);
  }

  /**
   * Run shared welded topology checks with caller-selected closedness policy and
   * return canonical validation.
   */
  export function validateMeshTopology(props: IAutoMovieMeshTopologyValidationProps): IAutoMovieValidation {
    return validateMeshTopologyImplementation(props);
  }

  /**
   * Require finite positive mass, declared restitution in inclusive [0,1],
   * optional static and kinetic friction, finite optional center-of-mass
   * coordinates and the declared drag and contact ranges, a round body's gyration
   * no more than a thin shell's 2/3, all its mass at its radius. A missing
   * restitution remains unknown and does not invalidate kinematic model
   * construction.
   */
  export function validateBody(body: IAutoMovieBody, path: string, collector: IAutoMovieViolationCollector): void {
    validateBodyImplementation(body, path, collector);
  }

  /**
   * Require distinct skeleton endpoints that are declared and FK-reachable, plus
   * finite positive radius.
   */
  export function validateCapsule(capsule: IAutoMovieCapsuleProxy, path: string, skeletonBones: ReadonlySet<AutoMovieHumanoidBone>, reachableBones: ReadonlySet<AutoMovieHumanoidBone>, collector: IAutoMovieViolationCollector): boolean {
    return validateCapsuleImplementation(capsule, path, skeletonBones, reachableBones, collector);
  }

  /**
   * Append scalar findings for a translation/rotation/scale record. Every
   * component must be finite, each scale axis strictly positive, and rotation's
   * quaternion norm within 1e-6 of one. No value is normalized.
   *
   * @param props.transform The TRS record.
   * @param props.path Prefix of every scalar finding.
   * @param props.label Subject named in the correction text.
   * @param props.collector Caller-owned append-only finding sink.
   */
  export function validateTransformScalars(props: IAutoMovieValidateTransformScalars.IProps): void {
    validateTransformScalarsImplementation(props);
  }

  /**
   * Require a finite value between independently configured open/closed
   * endpoints.
   *
   * Both endpoints default to inclusive. Infinite bounds are permitted, but the
   * tested value must be finite. Refusals retain the authored value.
   */
  export function validateRange(value: number, path: string, min: number, max: number, label: string, violations: IAutoMovieConstraintViolation[], inclusiveMin?: boolean, inclusiveMax?: boolean): void {
    validateRangeImplementation(value, path, min, max, label, violations, inclusiveMin, inclusiveMax);
  }

  /** Scan ids with a seen set, reporting later occurrences at supplied paths. */
  export function validateUniqueBy(entries: IAutoMovieValidateUniqueBy.IEntries, label: string, violations: IAutoMovieConstraintViolation[]): void {
    validateUniqueByImplementation(entries, label, violations);
  }

  /**
   * Append duplicate faults while scanning typed value/path pairs with one local
   * set.
   */
  export function validateUniqueValues(entries: ReadonlyArray<readonly [string, string]>, label: string, collector: IAutoMovieViolationCollector): void {
    validateUniqueValuesImplementation(entries, label, collector);
  }

  /**
   * Measure mesh UV bounding spans, reject normalized spans over1+1e-9 and warn
   * when repeating surface-metre tile size exceeds the span.
   */
  export function validateTextureScale(props: IAutoMovieValidateTextureScale.IProps): IAutoMovieValidation {
    return validateTextureScaleImplementation(props);
  }

  /**
   * Sample two capsule-proxy actors and return overlap advice, contact events and
   * an optional response.
   */
  export function detectBodyCollision(props: IAutoMovieDetectBodyCollision.IProps): IAutoMovieBodyCollisionResult {
    return detectBodyCollisionImplementation(props);
  }

  /**
   * Advise free fall for an unsupported, unattached body that is not already
   * falling.
   */
  export function detectFreeFall(props: IAutoMovieDetectFreeFall.IProps): IAutoMovieFreeFallResult {
    return detectFreeFallImplementation(props);
  }

  /** Advise a topple when an XZ center lies beyond a support hull and margin. */
  export function detectSupportToppling(props: IAutoMovieDetectSupportToppling.IProps): IAutoMovieSupportResult {
    return detectSupportTopplingImplementation(props);
  }

  /**
   * Measure a support or grip using already placed observations at one film
   * instant. Support gives signed normal gap and tangential slip in metres. Grip
   * gives position separation in metres and the shortest orientation separation
   * in radians. An absent sample leaves the check unsupported. Invalid
   * observations or limits produce findings without measurements.
   */
  export function measurePlacedContact(props: IAutoMoviePlacedContact.IProps): IAutoMoviePlacedContact.IResult {
    return measureAutoMoviePlacedContactImplementation(props);
  }

  /**
   * Check one raw placed transform, a declared continuous pair, or a custody
   * rule. The timeline owner supplies actual endpoints in film presentation
   * seconds. Equal times are allowed for a required seam. A known cut or declared
   * discontinuity excludes only the pair comparison. Unavailable observations
   * leave coverage unsupported.
   */
  export function measurePlacedContinuity(props: IAutoMoviePlacedContinuity.IProps): IAutoMoviePlacedContinuity.IResult {
    return measureAutoMoviePlacedContinuityImplementation(props);
  }

  /**
   * Measure external interpenetration from the film owner's evaluated parts.
   *
   * Same-layer paths and explicit group ownership govern comparisons. The widest
   * candidate search sorts world group bounds on X and stops at a separating
   * frontier. Optional region bounds are built and compared only for groups that
   * overlap another group. The initialized convex query measures surviving
   * supported pairs without resampling the film. Tangency, native-precision
   * uncertainty and any overlap involving an enclosing or proxy solid are
   * candidates; separation of an enclosing solid proves clearance.
   *
   * @param props Current world parts, local time, supplied convex query and work
   *   budget.
   * @returns Stable measured findings, comparison counts and remaining coverage.
   */
  export function measureSceneCollision(props: Collision.IProps): Collision.IResult {
    return measureAutoMovieSceneCollisionImplementation(props);
  }

  /**
   * Find a sampled depth violation or prove clearance for a certified affine
   * capsule pair, with explicit work and numerical limits.
   *
   * The swept centreline bounds use both endpoints at each end of a cell. Every
   * point of an affine moving segment is a convex combination of those four
   * inputs. Separation of the resulting axis-aligned boxes supplies a lower
   * distance bound. Each ambiguous cell can contribute a sampled witness and
   * split into two cells. The existing segment query only chooses points to
   * verify. Its rounded distance cannot certify a clear interval.
   *
   * @param props A single admitted source interval with no interior trajectory or
   *   allowance knot.
   * @returns Clearance, one sampled violation with its local bracket, or
   *   explicitly incomplete coverage.
   */
  export function measureSweptCapsuleCollision(props: Sweep.IProps): Sweep.IResult {
    return measureAutoMovieSweptCapsuleCollisionImplementation(props);
  }

  /**
   * Assemble id/reference, primitive/mesh, skeleton (with declared joint axes),
   * gaze, transform, body/profile/affordance and material checks in stable
   * order.
   */
  export function validateModel(props: IAutoMovieValidateModel.IProps): IAutoMovieValidation {
    return validateModelImplementation(props);
  }

  /**
   * Admit a finite frame, require every optional dimension present to be finite
   * and positive, admit a surface's drawable outline, then require stack-top
   * extent plan points to span area or point-like kinds to have null extent.
   *
   * An `outline` belongs to a `surface` with a `width` and `depth`; it has at
   * least three finite XZ points, each inside the width by depth rectangle
   * centred on the frame within a nanometre, encloses positive area and is
   * simple, no two of its non-adjacent edges meeting, because the render clips
   * the surface's graphics to it.
   */
  export function validateAffordance(affordance: IAutoMovieAffordance, path: string, collector: IAutoMovieViolationCollector): void {
    validateAffordanceImplementation(affordance, path, collector);
  }

  /**
   * Check bounded formation cues against participating compiled formations,
   * runtime gait repertoire, finite state, layout and nonoverlapping intervals.
   */
  export function validateAutoMovieFormationMotions(contract: IAutoMovieShotContract, value: IAutoMovieCompiledShotSource): IAutoMovieDiagnostic[] {
    return validateAutoMovieFormationMotionsImplementation(contract, value);
  }

  /**
   * Admit a model's articulation references: every `parts` id names a part of the
   * model, sits on an articulation kind and is claimed once; every `rides` and
   * every `follows` chain is independently acyclic; and each coupling names
   * another articulation, gives one finite ratio or a table spanning its leader's
   * range, stays within its follower's range, and is one-to-one when marked
   * reversible.
   *
   * @param affordances The model's affordances, in authored order.
   * @param parts The model's part ids.
   * @param path The caller-relative path of the affordance list, such as
   *   `$input.affordances`.
   * @param collector The caller's collector; each fault is appended at the
   *   offending field.
   */
  export function validateAffordanceArticulation(affordances: readonly IAutoMovieAffordance[], parts: ReadonlySet<string>, path: string, collector: IAutoMovieViolationCollector): void {
    validateAffordanceArticulationImplementation(affordances, parts, path, collector);
  }

  /**
   * Sample actual placed members against authored space coverage and height,
   * reporting the first void or sink per formation.
   */
  export function validateAutoMovieFormationGround(contract: Pick<IAutoMovieShotContract, "id">, value: IAutoMovieValidateFormationGround.IValue): IAutoMovieDiagnostic[] {
    return validateAutoMovieFormationGroundImplementation(contract, value);
  }

  /**
   * Place sampled members in a spatial grid and compare both same-unit and
   * cross-unit distances against height-overlapping runtime columns across every
   * LOD pair.
   */
  export function validateAutoMovieFormationOverlap(contract: Pick<IAutoMovieShotContract, "id">, value: IAutoMovieValidateFormationOverlap.IValue): IAutoMovieDiagnostic[] {
    return validateAutoMovieFormationOverlapImplementation(contract, value);
  }

  /**
   * Validate sparse member cue slots, states, ids, order and participant
   * formation references.
   */
  export function validateAutoMovieFormationSlotMotions(contract: Pick<
    IAutoMovieShotContract,
    "id" | "participants" | "durationSeconds"
  >, value: IAutoMovieValidateFormationSlotMotions.IValue): IAutoMovieDiagnostic[] {
    return validateAutoMovieFormationSlotMotionsImplementation(contract, value);
  }

  /**
   * A follower's travel at its leader's travel, by the rule its `follows`
   * declares: the leader's travel times `ratio`, or the piecewise-linear
   * interpolation of `table`.
   *
   * A leader's travel outside the table's first and last inputs takes the nearer
   * end's output; engine admission requires a table to cover the leader's whole
   * range, so an admitted model never reaches that case. Interior reads reorder
   * the arithmetic when an intermediate width or product loses range.
   *
   * @param follows The follower's rule.
   * @param leader The leader's travel, in its kind's unit.
   * @returns The follower's travel, in its kind's unit.
   */
  export function affordanceFollowedTravel(follows: IAutoMovieAffordanceCoupling, leader: number): number {
    return affordanceFollowedTravelImplementation(follows, leader);
  }

  /**
   * The unique leader travel that gives a requested follower travel.
   *
   * @param follows The coupling, in each articulation's travel unit.
   * @param follower The requested follower travel.
   * @param domain The leader's legal range, when known. Its forward images admit
   *   and recover the exact endpoints before inverse arithmetic can round outside
   *   them.
   * @returns The leader travel, or null for a non-finite value, a zero ratio, a
   *   malformed or non-monotone table, or a request outside the table's image.
   *   This does not grant permission to drive a follower; `reversible` grants
   *   that at the state boundary.
   */
  export function affordanceLeadingTravel(follows: IAutoMovieAffordanceCoupling, follower: number, domain?: IAutoMovieAffordanceTravelRange.IResult): number | null {
    return affordanceLeadingTravelImplementation(follows, follower, domain);
  }

  /**
   * The travel range of an articulation affordance, in its kind's unit: degrees
   * for a `hinge`, `knob`, `crank` and `wheel`, metres for a `slider`, `button`,
   * `pedal` and `trigger`.
   *
   * A `wheel` turns `travel` to either side, a `crank` without `travel` has no
   * limit, a `hinge`, `knob` or `slider` runs from minus its `reverse` to
   * `travel`, and every other kind runs from 0 to `travel`, as
   * `IAutoMovieAffordance.travel` and `reverse` state; without `reverse` the
   * least travel is 0, the one-way articulation. An articulation without `travel`
   * other than a crank does not move forward, so its greatest travel is 0. The
   * kind is not checked: the caller passes an articulation.
   *
   * @param affordance The articulation.
   * @returns The least and greatest travel; null for an end without a limit.
   */
  export function affordanceTravelRange(affordance: IAutoMovieAffordance): IAutoMovieAffordanceTravelRange.IResult {
    return affordanceTravelRangeImplementation(affordance);
  }

  /**
   * Validate cue ids, intervals, intensities, compiled stream correspondence,
   * event inclusion and same-zone ordering. Each source cue must match its unique
   * materialized stream's envelope and event binding. Event times must be finite
   * and inside the cue's half-open shot interval.
   */
  export function validateAutoMovieEffects(contract: IAutoMovieShotContract, value: IAutoMovieCompiledShotSource): IAutoMovieDiagnostic[] {
    return validateAutoMovieEffectsImplementation(contract, value);
  }

  /**
   * Sample FK within valid support windows, project a single-bone or weighted
   * joint-position center onto XZ, and warn beyond the support hull plus a finite
   * nonnegative margin in metres. Invalid rates and margins give range findings.
   */
  export function validateBalanceSupport(props: IAutoMovieValidateBalanceSupport.IProps): IAutoMovieValidation {
    return validateBalanceSupportImplementation(props);
  }

  /**
   * Admit clip duration, track uniqueness, channel addressing and shared sampler
   * track-shape faults.
   */
  export function validateClipArtifact(clip: IAutoMovieClip, path: string, violations: IAutoMovieConstraintViolation[], channelGate?: IAutoMovieClipChannelGate): void {
    validateClipArtifactImplementation(clip, path, violations, channelGate);
  }

  /**
   * Append every out-of-range linear RGBA field and contradictory display label.
   * RGB and non-null alpha must be finite within [0,1]. Hex is null or #RRGGBB
   * and, when present, must equal the quantized sRGB encoding of the linear RGB
   * values, ignoring letter case. Alpha does not enter that display swatch.
   *
   * It reports individual fields below `path`, without mutating or decoding the
   * label into the authoritative numeric channels. An out-of-range RGB triple
   * skips only the dependent label-consistency check.
   *
   * @param color The color record.
   * @param path Prefix used for every field finding.
   * @param collector Caller-owned sink receiving findings in RGB, alpha, hex
   *   order.
   */
  export function validateColor(color: IAutoMovieColor, path: string, collector: IAutoMovieViolationAppendRangeItemsSink): void {
    validateColorImplementation(color, path, collector);
  }

  /**
   * Compare every prior-end actor to the incoming opening for missing presence,
   * Euclidean drift, facing angle and persistent mount changes.
   */
  export function validateContinuity(props: IAutoMovieValidateContinuity.IProps): IAutoMovieValidation {
    return validateContinuityImplementation(props);
  }

  /**
   * Report each reference in a list that resolves to no declared id or repeats an
   * earlier one.
   *
   * Reference `i` is checked at `<path>[i]`: one that is not in `targets` gets a
   * `type` violation `<label> "<id>" does not resolve`, and one equal to an
   * earlier entry gets a `type` violation `<label> "<id>" is duplicated`. A
   * reference that is both gets both.
   *
   * @param references Referenced ids, in authored order.
   * @param targets Ids the references may name, usually from
   *   {@link collectDeclaredIds}.
   * @param path Violation path of the reference list itself.
   * @param label Name of the referenced record in the messages.
   * @param collector Sink that receives the violations.
   */
  export function validateDeclaredReferences(references: readonly string[], targets: ReadonlySet<string>, path: string, label: string, collector: IAutoMovieViolationAppendSink): void {
    validateDeclaredReferencesImplementation(references, targets, path, label, collector);
  }

  /**
   * Convert validateExpression's collected violations into the canonical
   * validation result.
   */
  export function validateExpressionResult(expression: IAutoMovieExpression): IAutoMovieValidation {
    return validateExpressionResultImplementation(expression);
  }

  /**
   * Switch on primitive shape and require finite positive supported dimensions,
   * including capsule length policy.
   */
  export function validateExtents(shape: IAutoMoviePrimitiveShape, path: string, collector: IAutoMovieViolationCollector): void {
    validateExtentsImplementation(shape, path, collector);
  }

  /**
   * Resolve end/opening states in playback order and compare adjacent beat
   * boundaries for advisory discontinuity.
   */
  export function validateFilmContinuity(props: IAutoMovieValidateFilmContinuity.IProps): IAutoMovieValidation {
    return validateFilmContinuityImplementation(props);
  }

  /**
   * Sample admitted contact windows, resolve FK and warn when adjacent foot XZ
   * displacement divided by elapsed seconds exceeds the declared speed. Rates
   * must be finite and positive and contact speed limits finite and nonnegative.
   */
  export function validateFootSkate(props: IAutoMovieValidateFootSkate.IProps): IAutoMovieValidation {
    return validateFootSkateImplementation(props);
  }

  /**
   * Sample FK and compare configured foot points and valid capsule endpoints to
   * scalar/height-source ground minus tolerance. A nonfinite tolerance or a
   * nonfinite or nonpositive rate yields a range finding before the pose sweep.
   */
  export function validateGroundContact(props: IAutoMovieValidateGroundContact.IProps): IAutoMovieValidation {
    return validateGroundContactImplementation(props);
  }

  /**
   * Require node channels, matching transform-clip appliers: the pipeline
   * resolves node channels onto scene nodes and honors no other target on a
   * transform clip.
   */
  export function validateHonorableChannel(channel: IAutoMovieChannel, path: string, violations: IAutoMovieConstraintViolation[]): void {
    validateHonorableChannelImplementation(channel, path, violations);
  }

  /**
   * Check finite ordered degree intervals and whether the admitted
   * flexion/abduction box reaches the declared swing cone.
   */
  export function validateJointConstraint(constraint: IAutoMovieJointConstraint, path: string, collector: IAutoMovieViolationCollector): void {
    validateJointConstraintImplementation(constraint, path, collector);
  }

  /**
   * Admit a model's gaze declaration against its skeleton.
   *
   * An `"expression"` gaze needs nothing. A `"bone"` gaze needs a skeleton that
   * declares `leftEye` and `rightEye`, and each range finite and at least `0`.
   * Each range must also fit both eyes' range of motion in its direction, read
   * from the bone's constraint or the default humanoid table: down is positive
   * flexion and up negative; toward the model's left is positive twist, which is
   * outward for the left eye and inward for the right. An axis the constraint
   * declares immobile (`null`) holds only `0`, and an eye with no constraint at
   * all bounds nothing. Every other `type` is refused.
   *
   * @param lookAt The model's gaze declaration.
   * @param skeleton The model's rig, or `null` for an unrigged model.
   * @param path Diagnostic path of `lookAt`.
   * @param collector Receives the violations.
   */
  export function validateLookAt(lookAt: IAutoMovieLookAt, skeleton: IAutoMovieSkeleton | null, path: string, collector: IAutoMovieViolationCollector): void {
    validateLookAtImplementation(lookAt, skeleton, path, collector);
  }

  /**
   * Admit the optional anisotropy, sheen and specular-intensity lobes of one
   * material: record shapes, `[0, 1]` strengths and roughness, a finite rotation
   * and a linear sheen colour.
   *
   * Absent lobes are left alone, because omission is the renderer's neutral
   * response. The anisotropy direction image is admitted with every other binding
   * by `materialTextureSlots`, and a part citing an anisotropic material must be
   * a mesh carrying UV0, because the highlight direction is measured in that
   * tangent frame and tessellated primitives emit no texture coordinates.
   */
  export function validateMaterialLobes(props: IAutoMovieValidateMaterialLobes.IProps): void {
    validateMaterialLobesImplementation(props);
  }

  /**
   * Admit optional overlay lists: their count, strength and optional numeric
   * factors.
   */
  export function validateMaterialOverlays(overlays: readonly IAutoMovieMaterialOverlay[] | undefined, path: string, collector: IAutoMovieViolationCollector): void {
    validateMaterialOverlaysImplementation(overlays, path, collector);
  }

  /**
   * Admit one material's procedural surface: a safe-integer seed within [0, 2³² −
   * 1], a positive scale, two linear colours, two roughness values within [0, 1],
   * a nonnegative relief, an axis exactly when the kind is directional, and a
   * pattern piece's positive tile lengths.
   *
   * A material that also binds `baseColorTexture` or `metallicRoughnessTexture`
   * is refused at `procedural`, since both would state its colour and roughness.
   * A piece samples its sheet through UV0, so every part citing a material whose
   * surface has a piece must be a mesh with UV0. An absent surface is left
   * alone.
   */
  export function validateMaterialProcedural(props: IAutoMovieValidateMaterialProcedural.IProps): void {
    validateMaterialProceduralImplementation(props);
  }

  /**
   * Admit one material's wear record: a safe-integer seed within [0, 2³² − 1], at
   * least one of `edge` and `grime`, and in each present layer a linear colour, a
   * roughness within [0, 1], a width above zero and an amount within (0, 1]. An
   * absent record is left alone; findings are reported at each field's own path.
   *
   * @param wear The `wear` field.
   * @param path Diagnostic path of the field.
   * @param collector Caller-owned sink receiving findings in field order.
   */
  export function validateMaterialWear(wear: IAutoMovieMaterialWear | undefined, path: string, collector: IAutoMovieViolationCollector): void {
    validateMaterialWearImplementation(wear, path, collector);
  }

  /**
   * Admit the images a model carries: unique ids, strict base64 data, and a PNG
   * header inside the subset the viewer decodes.
   *
   * The header is the IHDR chunk (W3C PNG, 2nd edition, section 11.2.2): a
   * 13-byte body whose bit depth must be 8, colour type 0, 2, 4 or 6,
   * compression, filter and interlace methods 0, and whose edges must be positive
   * and at most `AUTO_MOVIE_MAX_TEXTURE_EDGE`. Only the first 44 base64
   * characters are decoded, so a corrupt compressed stream or a wrong checksum
   * after the header passes here and is refused when the viewer decodes the
   * image.
   */
  export function validateModelImages(images: readonly IAutoMovieImage[] | undefined, path: string, collector: IAutoMovieViolationCollector): void {
    validateModelImagesImplementation(images, path, collector);
  }

  /**
   * Admit the motion's skeleton, positive duration, ordered in-range times,
   * bezier controls, frame pose/expression and adjacent-axis speed.
   */
  export function validateMotion(props: IAutoMovieValidateMotion.IProps): IAutoMovieValidation {
    return validateMotionImplementation(props);
  }

  /**
   * Expose validatePose's collector as a finished success/failure report for the
   * supplied rig.
   */
  export function validatePoseResult(pose: IAutoMoviePose, skeleton: IAutoMovieSkeleton): IAutoMovieValidation {
    return validatePoseResultImplementation(pose, skeleton);
  }

  /**
   * Admit profile id/name uniqueness and mountable/destructible trait fields:
   * seats/payload, durability and impact-body coefficients.
   */
  export function validateProfileCapabilities(props: IAutoMovieValidateProfileCapabilities.IProps): IAutoMovieValidation {
    return validateProfileCapabilitiesImplementation(props);
  }

  /**
   * Admit environment image/background, intensity, exposure and shadow policy.
   *
   * A declared image requires a null flat background. Color delegates to
   * validateColor's linear RGBA and matching sRGB label contract. Intensity is
   * finite and nonnegative, exposure finite and positive, and rotation finite
   * degrees.
   *
   * Supplying admitted light traits also checks the supported shadow profile,
   * retaining its original scene-light paths on refusal. It collects all
   * independent faults without changing input or requiring a renderer.
   */
  export function validateSceneEnvironment(props: IAutoMovieValidateSceneEnvironment.IProps): IAutoMovieValidation {
    return validateSceneEnvironmentImplementation(props);
  }

  /**
   * Validate the screenplay refinement tree against its script's flat beats, the
   * structural gate a script with a `tree` must pass before commit.
   *
   * Checks, all `error` severity:
   *
   * - Node ids are non-empty and unique.
   * - Exactly one root (`parent: null`) exists and it is the `intent`: the tree
   *   refines one film-level thought; a rootless forest or a second root is two
   *   films in one script.
   * - Every `parent` resolves, the refinement axis is acyclic, and each child's
   *   kind may refine its parent's kind ({@link ALLOWED_PARENTS}); a beat is
   *   always a leaf.
   * - `temporal` and every `interactsWith` entry resolve to an existing node and
   *   never to the node itself.
   * - Beat-kind nodes join the flat `beats` 1:1: every beat node names a real beat
   *   id, no two nodes claim one beat, and every beat is claimed: a tree that
   *   forgets a beat silently drops authored structure.
   * - Dialogue anchors are finite and `>= 0` when non-null.
   * - Intent logline and theme are nonblank and exactly match the flat script
   *   header, so screenplay rendering cannot silently replace authored metadata.
   * - Group rationales are nonblank prose, rather than empty bracketed headings.
   *
   * The cross-edge semantics (feedback propagation up the refinement chain) are
   * consumed later; this validator only guarantees the graph is well-formed.
   */
  export function validateScriptTree(props: IAutoMovieValidateScriptTree.IProps): IAutoMovieValidation {
    return validateScriptTreeImplementation(props);
  }

  /**
   * Sample valid capsule pairs through FK and warn when segment distance is less
   * than summed radii. A nonfinite or nonpositive rate yields a range finding
   * before the pose sweep.
   */
  export function validateSelfIntersection(props: IAutoMovieValidateSelfIntersection.IProps): IAutoMovieValidation {
    return validateSelfIntersectionImplementation(props);
  }

  /**
   * Admit shot/scene/camera references, performances, motion clips, polygon body
   * cue, practical surface track, flame cue, surface graphic track and font
   * source staged-node references, a bound flame's light clip, a feed camera
   * other than the shot's own, metadata and delivered-camera clearance
   * correspondence.
   *
   * A replay host can pass its staged skeleton resolver to check polygon cue
   * pivots and branch overlap on the same rig it will draw. Without a resolver,
   * cue checks cover staged node ids, duplicate targets and fields.
   */
  export function validateShotArtifact(shot: IAutoMovieShot, scene: IAutoMovieScene, motionIds: ReadonlySet<string> | null, skeleton?: (subject: string) => IAutoMovieSkeleton | null): IAutoMovieValidation {
    return validateShotArtifactImplementation(shot, scene, motionIds, skeleton);
  }

  /**
   * Require one connected root and resolvable acyclic ancestry using declared
   * names, parent edges and traversal.
   */
  export function validateSkeletonGraph(skeleton: IAutoMovieSkeleton, path: string, collector: IAutoMovieViolationCollector): void {
    validateSkeletonGraphImplementation(skeleton, path, collector);
  }

  /**
   * Admit unique surface ids and resolving walkable ids, finite XZ footprint
   * rings with strictly interior disjoint holes, one ground rule and optional
   * opaque color.
   */
  export function validateSpace(props: IAutoMovieValidateSpace.IProps): IAutoMovieValidation {
    return validateSpaceImplementation(props);
  }

  /**
   * Admit constant/plane finite parameters or a finite heightfield with positive
   * pitch, safe dimensions>=2 and exact row-major count.
   */
  export function validateSurfaceHeightRule(rule: IAutoMovieHeightRule, path: string, collector: IAutoMovieViolationCollector): void {
    validateSurfaceHeightRuleImplementation(rule, path, collector);
  }

  /**
   * Cross-check every sampled material, environment and surface-graphic image
   * with manifest registration, production consumer authorization, media/edge
   * facts and consistent color intent. A binding or surface image that names an
   * image its model carries skips the ledger, which holds project files only, and
   * joins the colour-intent check under that model; a surface image that resolves
   * nowhere is refused as unregistered.
   */
  export function validateTextureAssets(props: IAutoMovieTextureClosureInput): IAutoMovieValidation {
    return validateTextureAssetsImplementation(props);
  }

  /**
   * Admit a structured texture binding's coordinate set, color space and
   * transform scale against the slot's expected decoding. A legacy asset id
   * string carries none of those and is left alone.
   */
  export function validateTextureBinding(binding: AutoMovieTextureBinding | null | undefined, path: string, expectedColorSpace: "srgb" | "linear", collector: IAutoMovieViolationCollector): void {
    validateTextureBindingImplementation(binding, path, expectedColorSpace, collector);
  }

  /**
   * Grades one active requirement against delivery framing and occlusion
   * evidence.
   */
  export function classifyAutoMovieCameraInspection(input: IAutoMovieCameraInspection): IAutoMovieCameraInspection.IResult {
    return classifyAutoMovieCameraInspectionImplementation(input);
  }

  /** Accumulate ordered keyframe-clock, finite-value and stride faults. */
  export function clipTrackShapeFaults(track: IAutoMovieClipTrackShapeFaults.ITrack, duration: number): IAutoMovieClipShapeFault[] {
    return clipTrackShapeFaultsImplementation(track, duration);
  }

  /**
   * Split an extension name on underscores and recognize
   * material/materials/texture/textures segments case-insensitively.
   */
  export function isAutoMovieMaterialExtension(name: string): boolean {
    return isAutoMovieMaterialExtensionImplementation(name);
  }

  /**
   * Enumerate present baseColor, metalRough, normal, detailNormal, occlusion,
   * emissive and thickness bindings, the anisotropy direction binding, then
   * overlay color/normal bindings, carrying exact suffixes and decoding intent.
   */
  export function materialTextureSlots(material: IAutoMovieMaterial): IAutoMovieMaterialTextureSlotsMaterialTextureSlot[] {
    return materialTextureSlotsImplementation(material);
  }

  /**
   * Probe PNG, JPEG, WebP and Radiance dimension headers in order, returning
   * media/edge facts or null.
   */
  export function readAutoMovieImageFacts(bytes: Uint8Array | null | undefined): IAutoMovieTextureImageFacts | null {
    return readAutoMovieImageFactsImplementation(bytes);
  }
}
