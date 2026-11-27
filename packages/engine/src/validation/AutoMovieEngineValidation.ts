import { validateModel as validateModelImplementation } from "./internal/validateModel";

import { type IAutoMovieMesh, type IAutoMovieViolationCollector, type IAutoMovieValidation, type IAutoMovieMeshTopologyValidationProps, type IAutoMovieBody, type IAutoMovieCapsuleProxy, type AutoMovieHumanoidBone, type IAutoMovieValidateTransformScalars, type IAutoMovieConstraintViolation, type IAutoMovieValidateUniqueBy, type IAutoMovieValidateTextureScale, type IAutoMovieBodyCollisionResult, type IAutoMovieDetectBodyCollision, type IAutoMovieFreeFallResult, type IAutoMovieDetectFreeFall, type IAutoMovieSupportResult, type IAutoMovieDetectSupportToppling, type IAutoMoviePlacedContact, type IAutoMoviePlacedContinuity, type IAutoMovieSceneCollision as Collision, type IAutoMovieSweptCapsuleCollision as Sweep, type IAutoMovieValidateModel } from "@automovie/interface";
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
}
