import { admitPhysicalPointBounds as admitPhysicalPointBoundsImplementation } from "./internal/admitPhysicalPointBounds";
import { impactRecoil as impactRecoilImplementation } from "./internal/impactRecoil";
import { inPhysicalFloorBounds as inPhysicalFloorBoundsImplementation } from "./internal/inPhysicalFloorBounds";
import { physicalPointProjection as physicalPointProjectionImplementation } from "./internal/physicalPointProjection";

import { admitMotionGeometry as admitMotionGeometryImplementation } from "./internal/admitMotionGeometry";
import { attachPhysicalProfileHulls as attachPhysicalProfileHullsImplementation } from "./internal/attachPhysicalProfileHulls";
import { derivePhysicalProfile as derivePhysicalProfileImplementation } from "./internal/derivePhysicalProfile";
import { validatePhysicalProfile as validatePhysicalProfileImplementation } from "./internal/validatePhysicalProfile";
import { physicalJointInertia as physicalJointInertiaImplementation } from "./internal/physicalJointInertia";
import { physicalPrincipalAxes as physicalPrincipalAxesImplementation } from "./internal/physicalPrincipalAxes";
import { physicalModelRestTransforms as physicalModelRestTransformsImplementation } from "./internal/physicalModelRestTransforms";
import { physicalJointPoint as physicalJointPointImplementation } from "./internal/physicalJointPoint";
import { physicalJointRelativeRotation as physicalJointRelativeRotationImplementation } from "./internal/physicalJointRelativeRotation";
import { copyPhysicalTarget as copyPhysicalTargetImplementation } from "./internal/copyPhysicalTarget";
import { projectPhysicalJointRotation as projectPhysicalJointRotationImplementation } from "./internal/projectPhysicalJointRotation";
import { setPhysicalTargetJointRotation as setPhysicalTargetJointRotationImplementation } from "./internal/setPhysicalTargetJointRotation";
import { rebasePhysicalTargets as rebasePhysicalTargetsImplementation } from "./internal/rebasePhysicalTargets";
import { rerootPhysicalProfile as rerootPhysicalProfileImplementation } from "./internal/rerootPhysicalProfile";
import { physicalHullErode as physicalHullErodeImplementation } from "./internal/physicalHullErode";
import { physicalHullFacesErode as physicalHullFacesErodeImplementation } from "./internal/physicalHullFacesErode";
import { physicalHullFacesSegment as physicalHullFacesSegmentImplementation } from "./internal/physicalHullFacesSegment";
import { physicalHullSegment as physicalHullSegmentImplementation } from "./internal/physicalHullSegment";
import { physicalShapeNearest as physicalShapeNearestImplementation } from "./internal/physicalShapeNearest";
import { physicalShapeSpan as physicalShapeSpanImplementation } from "./internal/physicalShapeSpan";
import { physicalShapeSupport as physicalShapeSupportImplementation } from "./internal/physicalShapeSupport";
import { physicalShapeSurfaceAnchor as physicalShapeSurfaceAnchorImplementation } from "./internal/physicalShapeSurfaceAnchor";
import { physicalSupportPoint as physicalSupportPointImplementation } from "./internal/physicalSupportPoint";
import { type IPhysicalCoupledTargetRun } from "./internal/IPhysicalCoupledTargetRun";
import { bindPhysicalKinematicFrame as bindPhysicalKinematicFrameImplementation } from "./internal/bindPhysicalKinematicFrame";
import { createPhysicalKinematicFrame as createPhysicalKinematicFrameImplementation } from "./internal/createPhysicalKinematicFrame";
import { derivePhysicalActuators as derivePhysicalActuatorsImplementation } from "./internal/derivePhysicalActuators";
import { derivePhysicalModelJoints as derivePhysicalModelJointsImplementation } from "./internal/derivePhysicalModelJoints";
import { limitPhysicalSwingTwist as limitPhysicalSwingTwistImplementation } from "./internal/limitPhysicalSwingTwist";
import { linearizePhysicalInterval as linearizePhysicalIntervalImplementation } from "./internal/linearizePhysicalInterval";
import { linearizePhysicalTargetRows as linearizePhysicalTargetRowsImplementation } from "./internal/linearizePhysicalTargetRows";
import { type AutoMoviePhysicalJointChart } from "./AutoMoviePhysicalJointChart";
import { measurePhysicalJointLimits as measurePhysicalJointLimitsImplementation } from "./internal/measurePhysicalJointLimits";
import { measurePhysicalMotionConstraint as measurePhysicalMotionConstraintImplementation } from "./internal/measurePhysicalMotionConstraint";
import { physicalGravityTorques as physicalGravityTorquesImplementation } from "./internal/physicalGravityTorques";
import { physicalJointChain as physicalJointChainImplementation } from "./internal/physicalJointChain";
import { physicalJointEffort as physicalJointEffortImplementation } from "./internal/physicalJointEffort";
import { physicalJointMotorCommand as physicalJointMotorCommandImplementation } from "./internal/physicalJointMotorCommand";
import { projectPhysicalJointVelocity as projectPhysicalJointVelocityImplementation } from "./internal/projectPhysicalJointVelocity";
import { solvePhysicalArticulationTargets as solvePhysicalArticulationTargetsImplementation } from "./internal/solvePhysicalArticulationTargets";
import { solvePhysicalChainTarget as solvePhysicalChainTargetImplementation } from "./internal/solvePhysicalChainTarget";
import { solvePhysicalTargetStep as solvePhysicalTargetStepImplementation } from "./internal/solvePhysicalTargetStep";
import { admitPhysicalContactBindings as admitPhysicalContactBindingsImplementation } from "./internal/admitPhysicalContactBindings";
import { admitPhysicalSupportPattern as admitPhysicalSupportPatternImplementation } from "./internal/admitPhysicalSupportPattern";
import { type AutoMovieXpbdWorld } from "./AutoMovieXpbdWorld";
import { type IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import { collectPhysicalContacts as collectPhysicalContactsImplementation } from "./internal/collectPhysicalContacts";
import { compileImpactEffects as compileImpactEffectsImplementation } from "./internal/compileImpactEffects";
import { distributePhysicalSupportWrench as distributePhysicalSupportWrenchImplementation } from "./internal/distributePhysicalSupportWrench";
import { impulseToRecoilPush as impulseToRecoilPushImplementation } from "./internal/impulseToRecoilPush";
import { isPhysicalPairExcluded as isPhysicalPairExcludedImplementation } from "./internal/isPhysicalPairExcluded";
import { isPhysicalProfilePairExcluded as isPhysicalProfilePairExcludedImplementation } from "./internal/isPhysicalProfilePairExcluded";
import { physicalContactBindingRows as physicalContactBindingRowsImplementation } from "./internal/physicalContactBindingRows";
import { physicalContactSupportGoals as physicalContactSupportGoalsImplementation } from "./internal/physicalContactSupportGoals";
import { physicalContactSupportRows as physicalContactSupportRowsImplementation } from "./internal/physicalContactSupportRows";
import { physicalRecoveryLifted as physicalRecoveryLiftedImplementation } from "./internal/physicalRecoveryLifted";
import { physicalRecoveryLimbSwing as physicalRecoveryLimbSwingImplementation } from "./internal/physicalRecoveryLimbSwing";
import { physicalRecoveryRequested as physicalRecoveryRequestedImplementation } from "./internal/physicalRecoveryRequested";
import { physicalRecoveryStepRecord as physicalRecoveryStepRecordImplementation } from "./internal/physicalRecoveryStepRecord";
import { physicalRecoverySwing as physicalRecoverySwingImplementation } from "./internal/physicalRecoverySwing";
import { physicalSupportRootDrop as physicalSupportRootDropImplementation } from "./internal/physicalSupportRootDrop";
import { planPhysicalContactTargets as planPhysicalContactTargetsImplementation } from "./internal/planPhysicalContactTargets";
import { planPhysicalFloorSupportTargets as planPhysicalFloorSupportTargetsImplementation } from "./internal/planPhysicalFloorSupportTargets";
import { planPhysicalRootSupportTargets as planPhysicalRootSupportTargetsImplementation } from "./internal/planPhysicalRootSupportTargets";
import { planPhysicalSupportTargets as planPhysicalSupportTargetsImplementation } from "./internal/planPhysicalSupportTargets";
import { type solveXpbdContacts } from "./solveXpbdContacts";
import { preparePhysicalContactHooks as preparePhysicalContactHooksImplementation } from "./internal/preparePhysicalContactHooks";
import { projectPhysicalSupportReach as projectPhysicalSupportReachImplementation } from "./internal/projectPhysicalSupportReach";
import { readXpbdManifolds as readXpbdManifoldsImplementation } from "./internal/readXpbdManifolds";
import { recordPhysicalContact as recordPhysicalContactImplementation } from "./internal/recordPhysicalContact";
import { resolveImpact as resolveImpactImplementation } from "./internal/resolveImpact";
import { resolvePhysicalRecoveryStep as resolvePhysicalRecoveryStepImplementation } from "./internal/resolvePhysicalRecoveryStep";
import { resolvePhysicalSupportRedundancy as resolvePhysicalSupportRedundancyImplementation } from "./internal/resolvePhysicalSupportRedundancy";
import { retimePhysicalRecoveryStep as retimePhysicalRecoveryStepImplementation } from "./internal/retimePhysicalRecoveryStep";
import { sampleContactSurfaceResponse as sampleContactSurfaceResponseImplementation } from "./internal/sampleContactSurfaceResponse";
import { samplePhysicalContactEvents as samplePhysicalContactEventsImplementation } from "./internal/samplePhysicalContactEvents";
import { samplePhysicalRecoveryGoal as samplePhysicalRecoveryGoalImplementation } from "./internal/samplePhysicalRecoveryGoal";
import { samplePhysicalRecoverySupport as samplePhysicalRecoverySupportImplementation } from "./internal/samplePhysicalRecoverySupport";
import { solvePhysicalCompliantContacts as solvePhysicalCompliantContactsImplementation } from "./internal/solvePhysicalCompliantContacts";
import { suggestCollisionResponse as suggestCollisionResponseImplementation } from "./internal/suggestCollisionResponse";
import { warmPhysicalSupportTargets as warmPhysicalSupportTargetsImplementation } from "./internal/warmPhysicalSupportTargets";

import { type IAutoMovieCombinePhysicalMassProperties, type IAutoMovieFootfallPattern, type IAutoMovieModel, type IAutoMoviePhysicalHullFaces, type IAutoMoviePhysicalHullMass, type IAutoMoviePhysicalProfile, type IAutoMoviePhysicalShape, type IAutoMoviePhysicalShapePairContact, type IAutoMoviePrimitiveShape, type IAutoMovieRigidTransform, type IAutoMovieVector3, type IAutoMovieMotionGeometry, type IAutoMovieDerivePhysicalProfile, type IAutoMovieQuaternion, type IAutoMoviePrincipalTensorFrame, type IAutoMoviePhysicalJoint, type IAutoMovieSamplePhysicalTarget, type IAutoMoviePhysicalShapeNearest, type IAutoMoviePhysicalShapeSurfaceAnchor, type IAutoMoviePhysicalFrame, type IAutoMoviePhysicalSimulationInput, type IAutoMoviePreparePhysicalGeometry, type IAutoMovieContactReceipt, type IAutoMoviePhysicalSegment, type IAutoMovieDerivePhysicalActuators, type IAutoMoviePoses, type IAutoMovieLinearizePhysicalTargetRows, type IAutoMovieMeasurePhysicalJointLimits, type IAutoMovieMeasurePhysicalMotionConstraint, type IAutoMoviePhysicalSegmentState, type IAutoMoviePhysicalGravityTorques, type IAutoMoviePhysicalJointEffort, type IAutoMoviePhysicalJointMotorCommand, type IAutoMoviePhysicalJointAxis, type IAutoMovieSolvePhysicalArticulationTargets, type IAutoMovieSolvePhysicalChainTarget, type IAutoMovieSolvePhysicalTargetStep, type IAutoMoviePhysicalContactBinding, type IAutoMoviePhysicalPointBound, type IAutoMovieCompiledEffect, type IAutoMovieCompileImpactEffects, type IAutoMovieDistributePhysicalSupportWrench, type IAutoMovieRecoilPush, type IAutoMoviePhysicalContactBindingRows, type IAutoMoviePhysicalContactSupportRows, type IAutoMoviePhysicalRecoveryState, type IAutoMovieStepPlanner, type IAutoMoviePhysicalSupportRootDrop, type IAutoMoviePlanPhysicalContactTargets, type IAutoMoviePlanPhysicalFloorSupportTargets, type IAutoMoviePlanPhysicalRootSupportTargets, type IAutoMoviePlanPhysicalSupportTargets, type IAutoMovieProjectPhysicalSupportReach, type IAutoMovieRecordPhysicalContact, type IAutoMovieImpact, type IAutoMovieImpactBodyState, type IAutoMovieResolvePhysicalSupportRedundancy, type IAutoMovieSampleContactSurfaceResponse, type IAutoMovieSamplePhysicalRecoveryGoal, type IAutoMovieSamplePhysicalRecoverySupport, type IAutoMovieSolvePhysicalCompliantContacts, type IAutoMovieCollisionResponse, type IAutoMovieSuggestCollisionResponse, type IAutoMovieWarmPhysicalSupportTargets, type IAutoMoviePose, type AutoMovieHumanoidBone, type IAutoMovieSkeleton } from "@automovie/interface";

import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import { bodyCenterOfMass } from "./internal/bodyCenterOfMass";
import { combinePhysicalMassProperties } from "./internal/combinePhysicalMassProperties";
import { deriveCenterOfMass as derivePhysicalCenterOfMass } from "./internal/deriveCenterOfMass";
import { physicalHullFacesMass } from "./internal/physicalHullFacesMass";
import { physicalHullMass } from "./internal/physicalHullMass";
import { physicalShapePairContact } from "./internal/physicalShapePairContact";
import { physicalSupportFootprint } from "./internal/physicalSupportFootprint";
import { primitiveCentroid as readPrimitiveCentroid } from "./internal/primitiveCentroid";
import { primitiveVolume as readPrimitiveVolume } from "./internal/primitiveVolume";

/** Neutral contact, mass and support geometry operations. */
export namespace AutoMovieEnginePhysics {
  /** Reads the declared center of mass or derives it from primitive solids. */
  export function centerOfMass(model: IAutoMovieModel): IAutoMovieVector3 | null {
    return bodyCenterOfMass(model);
  }

  /** Derives a model's volume-weighted center of mass from primitive solids. */
  export function deriveCenterOfMass(model: IAutoMovieModel): IAutoMovieVector3 | null {
    return derivePhysicalCenterOfMass(model);
  }

  /** Combines rigid-part mass and inertia properties in one frame. */
  export function combineMassProperties(
    parts: readonly IAutoMovieCombinePhysicalMassProperties.IPart[],
  ): IAutoMovieCombinePhysicalMassProperties.IPart {
    return combinePhysicalMassProperties(parts);
  }

  /** Returns a primitive's geometric centroid in its local frame. */
  export function primitiveCentroid(shape: IAutoMoviePrimitiveShape): IAutoMovieVector3 {
    return readPrimitiveCentroid(shape);
  }

  /** Returns the analytic solid volume of a primitive in cubic metres. */
  export function primitiveVolume(shape: IAutoMoviePrimitiveShape): number {
    return readPrimitiveVolume(shape);
  }

  /** Computes the volume, centroid and principal inertia of a convex hull. */
  export function hullFacesMass(
    hull: IAutoMoviePhysicalHullFaces.IHull,
  ): IAutoMoviePhysicalHullMass.IResult {
    return physicalHullFacesMass(hull);
  }

  /** Builds a convex hull from points and computes its mass properties. */
  export function hullMass(
    points: readonly IAutoMovieVector3[],
  ): IAutoMoviePhysicalHullMass.IResult {
    return physicalHullMass(points);
  }

  /** Computes signed distance and witnesses between two convex shapes. */
  export function shapePairContact(
    poseA: IAutoMovieRigidTransform,
    shapeA: IAutoMoviePhysicalShape,
    poseB: IAutoMovieRigidTransform,
    shapeB: IAutoMoviePhysicalShape,
  ): IAutoMoviePhysicalShapePairContact {
    return physicalShapePairContact(poseA, shapeA, poseB, shapeB);
  }

  /** Projects the support shapes of one limb onto the floor plane. */
  export function supportFootprint(
    profile: IAutoMoviePhysicalProfile,
    poses:
      | ReadonlyMap<string, AutoMovieXpbdBody>
      | Readonly<Record<string, IAutoMovieRigidTransform>>,
    limb: IAutoMovieFootfallPattern["limbs"][number],
    floor: number,
  ): IAutoMovieVector3[] {
    return physicalSupportFootprint(profile, poses, limb, floor);
  }

  /**
   * Admit geometry and observed frames without borrowing the native mass/tree
   * contract. Every collider still has a solid shape, material, local frame and
   * known joint carriers.
   */
  export function admitMotionGeometry(geometry: IAutoMovieMotionGeometry): void {
    admitMotionGeometryImplementation(geometry);
  }

  /**
   * A profile whose hull shapes each carry their hull, built once here so that
   * every later query reads it.
   *
   * @param profile A profile, possibly stored without its derived hulls.
   * @returns A copy whose hull shapes carry a hull, the others unchanged.
   */
  export function attachPhysicalProfileHulls(profile: IAutoMoviePhysicalProfile): IAutoMoviePhysicalProfile {
    return attachPhysicalProfileHullsImplementation(profile);
  }

  /**
   * Build a physical provider from primitive parts, density and explicit joint
   * declarations. Imported geometry requires a caller-supplied segment override.
   * Non-box primitives use conservative box colliders unless spherical/capsular
   * scale is uniform. Mass is analytic volume times density. Spheres use solid
   * sphere inertia; other primitives use their bounding-box inertia
   * approximation. Aggregation uses the parallel-axis theorem. Overrides replace
   * entire segments.
   */
  export function derivePhysicalProfile(model: IAutoMovieModel, options: IAutoMovieDerivePhysicalProfile.IOptions): IAutoMoviePhysicalProfile {
    return derivePhysicalProfileImplementation(model, options);
  }

  /**
   * Collect every range, reference, mass and tree defect before simulation. This
   * gate never repairs inputs. Mass/centre comparisons allow 1e-8 relative
   * floating-point accumulation; length is in metres. Reference searches and
   * ancestor walks can be quadratic in the declared segment/joint population.
   */
  export function validatePhysicalProfile(profile: IAutoMoviePhysicalProfile): string[] {
    return validatePhysicalProfileImplementation(profile);
  }

  /**
   * Project both bodies' world inverse inertia tensors onto each joint axis,
   * giving relative-rotation inertia.
   */
  export function physicalJointInertia(frame: IAutoMovieQuaternion, child: AutoMovieXpbdBody, parent?: AutoMovieXpbdBody): IAutoMovieVector3 {
    return physicalJointInertiaImplementation(frame, child, parent);
  }

  /**
   * The principal moments and axes of a symmetric 3x3 inertia tensor, by a Jacobi
   * diagonalization of the tensor divided by its largest entry, so the stopping
   * criterion compares dimensionless numbers at any SI scale.
   *
   * The moments come back in ascending order with their axes as a right-handed
   * rotation from the principal frame to the tensor's frame. The input rows are
   * modified in place.
   *
   * @param tensor Three rows of three finite numbers, symmetric, kg m² or any one
   *   unit; modified in place.
   * @returns The ascending principal moments in the tensor's unit and the
   *   rotation whose columns are their axes.
   * @throws {Error} When every entry is zero.
   */
  export function physicalPrincipalAxes(tensor: number[][]): IAutoMoviePrincipalTensorFrame {
    return physicalPrincipalAxesImplementation(tensor);
  }

  /**
   * Neutral bone transforms in the model frame, using the same unscaled rest FK
   * as pose resolution.
   */
  export function physicalModelRestTransforms(model: IAutoMovieModel): Map<string, IAutoMovieRigidTransform> {
    return physicalModelRestTransformsImplementation(model);
  }

  /**
   * Locate the actual joint anchor even when a primitive's bone origin is its
   * solid centre.
   */
  export function physicalJointPoint(profile: IAutoMoviePhysicalProfile, bone: string, targets: Readonly<Record<string, IAutoMovieRigidTransform>>): IAutoMovieVector3 {
    return physicalJointPointImplementation(profile, bone, targets);
  }

  /**
   * Parent-frame to child-frame rotation of one joint in a pose record, as the
   * native motor owner reads it.
   */
  export function physicalJointRelativeRotation(poses: Readonly<Record<string, IAutoMovieRigidTransform>>, joint: IAutoMoviePhysicalJoint): IAutoMovieRigidTransform["rotation"] {
    return physicalJointRelativeRotationImplementation(poses, joint);
  }

  /**
   * Own sample/pose containers before replacing their fields. Metric vector
   * values remain borrowed immutable inputs until replaced.
   */
  export function copyPhysicalTarget(source: IAutoMovieSamplePhysicalTarget.IResult): IAutoMovieSamplePhysicalTarget.IResult {
    return copyPhysicalTargetImplementation(source);
  }

  /**
   * Admit a relative joint rotation to the joint's one admitted set. A ball joint
   * gated by swing and twist (`range`) is admitted on that gate, the set the
   * range-of-motion gate and the take's range verdict read: the bone's
   * rest-relative rotation in its own frame (`basis q basis^-1`) brought into the
   * range (`swingTwistRange.project`: its direction back along its great circle
   * from rest to the region's radius there, its twist clamped to its interval),
   * closed form. In the range's own chart the set is convex, the unit disc of
   * directions times the twist interval (`swingTwistRange.chart`), and the
   * projection clamps each factor; no box applies, the clinical angles being
   * readings of such a joint, not limits. A joint declaring a sequential chart
   * (`order`) is admitted in it (`AutoMoviePhysicalJointChart`): each Tait-Bryan
   * angle clamped into its free axis's range, a locked one held at zero.
   * Otherwise the solver's independent twist coordinates, 2 atan(q.axis / w) per
   * free axis: with positive quaternion w, each free coordinate is 2 atan(q.axis
   * / w); locked coordinates require a zero numerator. This projects that
   * coordinate box, rather than claiming a nearest rotation in geodesic distance.
   * At a half turn the finite Rodrigues representation stops within 1e-12
   * radians.
   */
  export function projectPhysicalJointRotation(joint: IAutoMoviePhysicalJoint, rotation: IAutoMovieRigidTransform["rotation"]): IAutoMovieRigidTransform["rotation"] {
    return projectPhysicalJointRotationImplementation(joint, rotation);
  }

  /**
   * Apply one admitted parent-joint-relative rotation to its declared descendant
   * tree, preserving every rigid anchor. Motor targets are mutable working
   * copies, never solved bodies.
   */
  export function setPhysicalTargetJointRotation(targets: Record<string, IAutoMovieRigidTransform>, joint: IAutoMoviePhysicalJoint, descendants: readonly string[], relative: IAutoMovieRigidTransform["rotation"]): void {
    setPhysicalTargetJointRotationImplementation(targets, joint, descendants, relative);
  }

  /**
   * Rigidly carry a copied articulation from its reference root into a declared
   * root frame, preserving every relative joint transform and fixed anchor.
   */
  export function rebasePhysicalTargets(targets: Readonly<Record<string, IAutoMovieRigidTransform>>, root: string, pose: IAutoMovieRigidTransform): Record<string, IAutoMovieRigidTransform> {
    return rebasePhysicalTargetsImplementation(targets, root, pose);
  }

  /**
   * The same articulated tree held from another segment: every joint on the path
   * from the old root to the new one is inverted, so the new root is the fixed
   * base of a fixed-pivot solve and the old root moves through the inverted
   * joints.
   *
   * Inverting a joint swaps its parent and child with their frames and mirrors
   * each axis range to `[-maximum, -minimum]`. This is exact for the solvers'
   * coordinates: a relative rotation is `normalize(tan(a_x / 2), tan(a_y / 2),
   * tan(a_z / 2), 1)` and its inverse negates the three vector parts, so the
   * inverted joint's coordinates are the negated originals and every ROM limit is
   * kept.
   *
   * @param profile An admitted fixed-pivot tree.
   * @param root The segment to hold.
   * @returns The rerooted profile, sharing every unchanged joint and segment.
   */
  export function rerootPhysicalProfile(profile: IAutoMoviePhysicalProfile, root: string): IAutoMoviePhysicalProfile {
    return rerootPhysicalProfileImplementation(profile, root);
  }

  /**
   * The vertices of a convex hull of a point set shrunk inward by a depth,
   * searching its hull afresh (see `physicalHullFacesErode`).
   *
   * @param points The hull's shape-local points, metres, spanning a volume.
   * @param depth The inward offset, metres; below the hull's `depth` about its
   *   centre, so the eroded solid keeps a volume.
   * @returns The eroded solid's vertices in the points' frame.
   * @throws {Error} When the depth leaves no volume.
   */
  export function physicalHullErode(points: readonly IAutoMovieVector3[], depth: number): IAutoMovieVector3[] {
    return physicalHullErodeImplementation(points, depth);
  }

  /**
   * The vertices of a convex hull shrunk inward by a depth: every face plane
   * moves inward by `depth`, and the eroded solid is what remains behind all of
   * them.
   *
   * A vertex of the eroded solid is the meeting point of three moved planes that
   * lies behind every other moved plane, so each triple of faces is solved by
   * Cramer's rule and kept when it does.
   *
   * @param hull The hull, built once with its shape, spanning a volume.
   * @param depth The inward offset, metres; below the hull's `depth` about its
   *   centre, so the eroded solid keeps a volume.
   * @returns The eroded solid's vertices in the points' frame.
   * @throws {Error} When the depth leaves no volume.
   */
  export function physicalHullFacesErode(hull: IAutoMoviePhysicalHullFaces.IHull, depth: number): IAutoMovieVector3[] {
    return physicalHullFacesErodeImplementation(hull, depth);
  }

  /**
   * The unit parameter of the point of a segment nearest a convex hull, or
   * deepest inside it, in the hull's own frame.
   *
   * Apart, the nearest pair of a hull and a segment is the point of their
   * Minkowski difference nearest the origin, which the Gilbert-Johnson-Keerthi
   * iteration finds exactly for two polytopes: each step adds the difference's
   * support point against the current nearest point and keeps the face of the
   * simplex nearest the origin (Ericson's region tests), and the segment
   * parameter is the barycentric mix of the simplex's segment ends. Once the
   * difference reaches within the hull's tolerance of the origin, the segment
   * meets the hull, and its deepest point minimises the greatest face plane
   * distance along it: a convex piecewise linear function of the parameter, whose
   * least value the walk along its upper envelope reaches exactly. A segment that
   * only grazes the hull within the tolerance takes the iteration's parameter:
   * that of its nearest point, or of the origin's barycentric mix when a
   * tetrahedron of the difference holds the origin.
   *
   * @param hull The hull, built once with its shape, spanning a volume.
   * @param a The segment's start, at parameter 0, in the same frame.
   * @param b Its end, at parameter 1.
   * @returns The parameter in [0, 1].
   * @throws {Error} When the points span no volume.
   */
  export function physicalHullFacesSegment(hull: IAutoMoviePhysicalHullFaces.IHull, a: IAutoMovieVector3, b: IAutoMovieVector3): number {
    return physicalHullFacesSegmentImplementation(hull, a, b);
  }

  /**
   * The parameter of the deepest point of a segment inside a convex hull of a
   * point set, searching its hull afresh (see `physicalHullFacesSegment`).
   *
   * @param points The hull's shape-local points, metres, spanning a volume.
   * @param a The segment's start, at parameter 0, in the same frame.
   * @param b Its end, at parameter 1.
   * @returns The parameter in [0, 1].
   * @throws {Error} When the points span no volume.
   */
  export function physicalHullSegment(points: readonly IAutoMovieVector3[], a: IAutoMovieVector3, b: IAutoMovieVector3): number {
    return physicalHullSegmentImplementation(points, a, b);
  }

  /**
   * Where a world segment comes nearest an admitted sphere, Y capsule, oriented
   * box or convex hull placed by a parent pose: the signed distance, negative
   * when the segment enters the shape, the point of the shape's surface there,
   * the outward normal at that point and the point of the segment. A segment
   * whose two ends coincide is a point, so this is also the point query.
   *
   * The shape's frame is the parent pose composed with the shape's own transform,
   * as in `physicalShapeBounds`. A sphere is its centre and a capsule its axis
   * segment, each widened by the radius, so both reduce to the closest points
   * between two segments (`closestPointsBetweenSegments`, Eberly 2023); the
   * normal runs from the axis point to the segment point. A hull's nearest or
   * deepest segment parameter is exact from `physicalHullSegment`. A box is
   * convex, so its signed distance is convex along the segment, and 44
   * golden-section steps narrow the segment's unit parameter below 1e-9 before
   * the least of both ends and the two final probes is taken. The point and the
   * normal are read at that parameter from the box's exact signed distance or
   * from `physicalHullNearest`.
   *
   * When the segment passes through a sphere's centre or a capsule's axis, no
   * direction is nearest; the normal is then the shape's local X axis, a
   * direction perpendicular to a capsule's axis.
   *
   * A segment widened by a radius that runs linearly from one end to the other (a
   * tapered capsule, the round cone of a limb that narrows toward its far joint)
   * is read by the same search: its signed distance is the least over the
   * segment's points of the point's signed distance less the radius there. The
   * point's distance to a convex shape is convex along the segment (the distance
   * to a convex set is a convex function and the segment's points are affine in
   * the parameter), and the radius is affine in it, so the difference is convex
   * and the golden-section search finds its minimum for every shape kind, a
   * sphere and a capsule included.
   *
   * @param pose The shape's parent pose, world metres.
   * @param shape The admitted shape.
   * @param a One end of the segment, world metres.
   * @param b The other end, world metres.
   * @param taper The radii the segment is widened by at `a` and at `b`, metres,
   *   not negative; absent for the bare segment.
   * @returns The signed distance in metres (less the widening, for a tapered
   *   segment), the surface point, the outward unit normal and the segment point,
   *   all in the world frame.
   */
  export function physicalShapeNearest(pose: IAutoMovieRigidTransform, shape: IAutoMoviePhysicalShape, a: IAutoMovieVector3, b: IAutoMovieVector3, taper?: readonly [number, number]): IAutoMoviePhysicalShapeNearest.IResult {
    return physicalShapeNearestImplementation(pose, shape, a, b, taper);
  }

  /**
   * The interval an admitted shape covers along a world direction: the lowest and
   * highest projections of its points onto a unit axis, metres from the world
   * origin. The shape is placed by its parent pose composed with its own
   * transform.
   *
   * @param pose The shape's parent pose, world metres.
   * @param shape The shape.
   * @param axis A unit direction, world frame.
   * @returns The low and high projections, metres along the axis.
   */
  export function physicalShapeSpan(pose: IAutoMovieRigidTransform, shape: IAutoMoviePhysicalShape, axis: IAutoMovieVector3): readonly [number, number] {
    return physicalShapeSpanImplementation(pose, shape, axis);
  }

  /**
   * A convex collider's support point: its world point farthest along a
   * direction, `s(d) = argmax_{p in S} p . d`, the mapping GJK and EPA query a
   * convex solid through (Gilbert, Johnson and Keerthi 1988; van den Bergen 2003,
   * "Collision Detection in Interactive 3D Environments", ch. 4).
   *
   * A sphere's is its centre plus its radius along the direction; a capsule's the
   * axis end farther along it plus the radius; a box's the corner whose signs
   * match the direction's in the box frame; a hull's the vertex of greatest dot
   * product. A zero direction returns the shape's centre.
   *
   * @param pose The shape's parent pose, world metres.
   * @param shape The shape.
   * @param direction A world direction; its length is not used.
   * @returns The support point, world metres.
   */
  export function physicalShapeSupport(pose: IAutoMovieRigidTransform, shape: IAutoMoviePhysicalShape, direction: IAutoMovieVector3): IAutoMovieVector3 {
    return physicalShapeSupportImplementation(pose, shape, direction);
  }

  /**
   * A collider's exact support surface in a specified bone-local outward
   * direction. Capsule ties select the segment midpoint rather than an arbitrary
   * cap; boxes select the face centre on tied coordinates; hulls select the mean
   * of the tied vertices.
   */
  export function physicalShapeSurfaceAnchor(pose: IAutoMovieRigidTransform, shape: IAutoMoviePhysicalShape, normal: IAutoMovieVector3): IAutoMoviePhysicalShapeSurfaceAnchor.IResult {
    return physicalShapeSurfaceAnchorImplementation(pose, shape, normal);
  }

  /**
   * Resolve an authored support point from its owning bone, including rigs
   * without a separate foot bone.
   */
  export function physicalSupportPoint(pose: IAutoMovieRigidTransform, localPoint?: IAutoMovieVector3): IAutoMovieVector3 {
    return physicalSupportPointImplementation(pose, localPoint);
  }

  /**
   * Evaluate one frame's coupled and ordinary relationships against the same
   * pre-binding snapshot. Geometric receipts retain null impulse.
   */
  export function bindPhysicalKinematicFrame(input: IAutoMoviePhysicalSimulationInput.IInput, step: number, frame: IAutoMoviePhysicalFrame, previous: IAutoMoviePhysicalFrame | undefined, geometry: IAutoMoviePreparePhysicalGeometry.IQueries, contacts: IAutoMovieContactReceipt[], profiles?: Record<string, IAutoMoviePhysicalProfile>, coupling?: IPhysicalCoupledTargetRun): IAutoMoviePhysicalFrame {
    return bindPhysicalKinematicFrameImplementation(input, step, frame, previous, geometry, contacts, profiles, coupling);
  }

  /**
   * Authored state remains first-class and uses finite differences only for
   * reported velocities.
   */
  export function createPhysicalKinematicFrame(input: IAutoMoviePhysicalSimulationInput.IInput, step: number): IAutoMoviePhysicalFrame {
    return createPhysicalKinematicFrameImplementation(input, step);
  }

  /**
   * Size declared actuators from the entire neutral downstream load about each
   * joint. The parallel-axis term includes equipment and small coordinate
   * carriers without altering physical masses. These are control assumptions, not
   * muscle measurements. Active gains use an isotropic upper bound on the neutral
   * subtree tensor: bending a downstream limb can move its load off the neutral
   * twist axis. Passive damping uses directional inertia and has no preferred
   * rest angle.
   */
  export function derivePhysicalActuators(segments: readonly IAutoMoviePhysicalSegment[], joints: readonly IAutoMoviePhysicalJoint[], options: IAutoMovieDerivePhysicalActuators.IOptions): IAutoMoviePhysicalJoint[] {
    return derivePhysicalActuatorsImplementation(segments, joints, options);
  }

  /**
   * Map actual rig-local clinical axes and degree limits into physical joint
   * frames.
   */
  export function derivePhysicalModelJoints(model: IAutoMovieModel, segments: readonly IAutoMoviePhysicalSegment[], actuator: IAutoMovieDerivePhysicalActuators.IOptions): IAutoMoviePhysicalJoint[] {
    return derivePhysicalModelJointsImplementation(model, segments, actuator);
  }

  /**
   * A joint rotation brought inside its clinical swing-twist limit (Baerlocher
   * and Boulic 2001, "Parametrization and range of motion of the ball-and-socket
   * joint", The Visual Computer 17(7)).
   *
   * The rotation splits as `q = swing * twist`: the twist is the rotation about
   * the twist axis `a` with the same projection, `twist = normalize(w, (v . a)
   * a)`, and the swing is `q * twist^-1`, a rotation about an axis perpendicular
   * to `a`. The twist angle is clamped into its range. The swing's rotation
   * vector has components `u` and `v` about the two swing axes; outside the
   * quadrant's ellipse `(u / U)^2 + (v / V)^2 <= 1`, with `U` and `V` the range
   * ends on the vector's side, it is scaled back onto the ellipse along its own
   * direction. The limited rotation is the limited swing times the limited twist;
   * a rotation inside the limit is returned as given.
   *
   * @param limit The joint's swing-twist limit.
   * @param rotation The joint frame's relative rotation.
   * @returns The limited rotation.
   */
  export function limitPhysicalSwingTwist(limit: IAutoMoviePhysicalJoint.ISwingTwist, rotation: IAutoMovieQuaternion): IAutoMovieQuaternion {
    return limitPhysicalSwingTwistImplementation(limit, rotation);
  }

  /**
   * Freeze only strictly violated inequality rows for finite-difference probes.
   * Exact one-sided boundaries remain free to depart into slack; equal finite
   * sides use one signed row selected to match the current nonlinear error.
   * Nonlinear merit remains clamped separately.
   */
  export function linearizePhysicalInterval(value: number, minimum?: number, maximum?: number): (probe: number) => number[] {
    return linearizePhysicalIntervalImplementation(value, minimum, maximum);
  }

  /**
   * Freeze local witnesses once and differentiate only rows affected by the
   * probed joint subtree. Every row remains present, including invariant self
   * distances.
   */
  export function linearizePhysicalTargetRows(rows: readonly IAutoMovieLinearizePhysicalTargetRows.IRows[], accepted: IAutoMoviePoses): (probe: IAutoMoviePoses, moved?: ReadonlySet<string>) => number[] {
    return linearizePhysicalTargetRowsImplementation(rows, accepted);
  }

  /**
   * Measure every native angular constraint from displayed bone frames. A ball
   * joint gated by swing and twist (`range`) is measured on that gate, the set
   * its projection admits (`projectPhysicalJointRotation`): the swing (`x`) past
   * the region's radius on its great circle and the twist (`y`) past its
   * interval, radians, the third entry zero. A joint that declares a sequential
   * chart (`order`) is read in it, as the solver admits it
   * (`projectPhysicalJointRotation`): each Tait-Bryan angle of the chart's
   * reading (`AutoMoviePhysicalJointChart.nearest`) against its free axis's
   * range, a locked axis's, with the turn that reading leaves about it, against
   * zero; a pose the solver admitted then reads within its limits. Otherwise
   * free-axis limits use the wrapped twist projection 2 atan2(q.axis,q.w). Locked
   * coordinates use 2 asin(q.axis), avoiding a false pi error when another free
   * axis is at a half turn. Results are radians; native numerical tolerance
   * belongs to the caller, rather than being subtracted from the measurement.
   */
  export function measurePhysicalJointLimits(joint: IAutoMovieMotionGeometry["joints"][number] &
    Pick<AutoMoviePhysicalJointChart.IJoint, "order"> &
    Pick<IAutoMoviePhysicalJoint, "range">, parent: IAutoMovieRigidTransform, child: IAutoMovieRigidTransform): IAutoMovieMeasurePhysicalJointLimits.IResult {
    return measurePhysicalJointLimitsImplementation(joint, parent, child);
  }

  /**
   * Measure authored endpoint, separation and bend promises from displayed bone
   * frames. No clinical catalogue, species, actor or screenplay window is
   * selected here. A missing frame, coincident ray or zero-length angle refuses
   * the audit instead of turning an undefined measurement into a passing zero.
   */
  export function measurePhysicalMotionConstraint(constraint: IAutoMovieMeasurePhysicalMotionConstraint.IConstraint, states: Readonly<Record<string, IAutoMoviePhysicalSegmentState>>, seconds: number): number {
    return measurePhysicalMotionConstraintImplementation(constraint, states, seconds);
  }

  /**
   * Counter actual downstream gravitational moments through the same bounded
   * joint motors. Joints arrive in postorder, so one mass/first-moment
   * accumulation includes every attachment in linear work. This is feed-forward
   * actuator demand, not an additional unbounded force or a change to any
   * physical mass or gravity.
   */
  export function physicalGravityTorques(profile: IAutoMoviePhysicalProfile, order: readonly IAutoMoviePhysicalJoint[], segments: ReadonlyMap<string, AutoMovieXpbdBody>, gravity: IAutoMovieVector3): IAutoMoviePhysicalGravityTorques.IResult {
    return physicalGravityTorquesImplementation(profile, order, segments, gravity);
  }

  /**
   * Read a proximal-to-distal actuator path from an admitted tree. The fixed root
   * has no incoming actuator and is omitted.
   */
  export function physicalJointChain(profile: IAutoMoviePhysicalProfile, bone: string): string[] {
    return physicalJointChainImplementation(profile, bone);
  }

  /**
   * Effective tracking fraction of one joint motor at one native tick.
   *
   * An explicit per-joint override replaces the body's effort; a joint inside a
   * moving recovery limb takes the balance policy's joint fraction; a joint whose
   * child received a disturbance stays compliant, multiplied by the declared
   * compliance fraction, until its softening deadline has passed. The factors are
   * independent, so they multiply.
   */
  export function physicalJointEffort(input: IAutoMoviePhysicalJointEffort.IInput): number {
    return physicalJointEffortImplementation(input);
  }

  /**
   * The bounded quaternion PD command of one joint for the solver's implicit
   * velocity motors.
   *
   * A per-axis positional motor measuring 2 asin(qi) while using the plain joint
   * axis as its Jacobian disagrees under compound rotations. The error is
   * therefore the geodesic rotation vector of target times inverse current, on
   * the short arc. Each axis drives an implicit velocity motor with damping d =
   * (c + k dt) strength-scaled plus passive damping and target speed (k e +
   * c_active w_target + f strength) / d_active+passive, the backward-Euler form
   * of PD with stiffness k = stiffness strength. With positive strength the
   * requested velocity is projected into the joint's limit box for the next
   * substep, read in its chart when it declares one, as the solver limits it. The
   * cap is the axis torque when any gain is active and zero otherwise. Saturation
   * is a demand forecast |d (speed - velocity)| > cap at the command's velocity,
   * before the substeps run.
   */
  export function physicalJointMotorCommand(input: IAutoMoviePhysicalJointMotorCommand.IInput): IAutoMoviePhysicalJointMotorCommand.IOutput {
    return physicalJointMotorCommandImplementation(input);
  }

  /**
   * Project a motor's requested relative angular velocity onto the linearized
   * native coordinate box for the next substep: each coordinate's rate held
   * between the rates that reach its axis's ends within the substep.
   *
   * The box is read in the coordinates the solver limits the joint in. A joint
   * declaring a sequential chart (`order`) is limited on its chart's angles
   * (`projectPhysicalJointRotation`, `measurePhysicalJointLimits`), so its box is
   * read there, each free axis's rate the rate of its chart angle, as the
   * articulation drives it along the chart's axes (`solveXpbdArticulation`). A
   * compound rotation's independent twist coordinates differ from its chart
   * angles, and a box read in them sees ends the solver does not enforce: a
   * rotation inside its chart box read a fixed angle e past an end would ask e /
   * h of the motor every substep h, a speed growing as h shrinks that no position
   * correction removes, since the solver's velocities follow from its corrected
   * poses alone (Mueller, Macklin, Chentanez, Jeschke and Kim 2020, "Detailed
   * Rigid Body Simulation with Extended Position Based Dynamics", section 3.3, v
   * = dx / h). Otherwise, for theta = 2 atan2(qi, qw), the exact differential
   * includes the other quaternion components; projecting only the named
   * angular-velocity component fails at compound rotations, and eight cyclic
   * half-space passes bound work and preserve already admissible requests. This
   * constrains motor intent, not actual velocities or poses; native constraints
   * and the declared motor torque caps still govern motion.
   *
   * @param current The joint's relative rotation.
   * @param axes Its free axes and their ranges.
   * @param requested The requested relative angular velocity, per axis.
   * @param dt The substep, seconds.
   * @param order The joint's sequential chart, when it declares one.
   * @returns The projected velocity.
   */
  export function projectPhysicalJointVelocity(current: IAutoMovieQuaternion, axes: readonly IAutoMoviePhysicalJointAxis[], requested: IAutoMovieVector3, dt: number, order?: readonly IAutoMoviePhysicalJointAxis["axis"][]): IAutoMovieVector3 {
    return projectPhysicalJointVelocityImplementation(current, axes, requested, dt, order);
  }

  /**
   * Solve a bounded metre residual for one admitted articulation with fixed
   * pivots and projected joint ranges. The caller supplies the pose and row
   * callbacks in its own bone names.
   */
  export function solvePhysicalArticulationTargets(input: IAutoMovieSolvePhysicalArticulationTargets.IInput): IAutoMovieSolvePhysicalArticulationTargets.IResult {
    return solvePhysicalArticulationTargetsImplementation(input);
  }

  /**
   * Bounded damped least squares on the admitted profile's actual joint frames,
   * its damping adapted to the chain's smallest singular value (Nakamura and
   * Hanafusa 1986; Buss 2004). This changes motor targets, never solved bodies.
   * Each angular update stays inside its source-derived box limit and rotates the
   * complete child subtree. The returned residual explicitly retains an
   * unreachable endpoint goal. Unchanged branches are borrowed; every written
   * pose shell is detached first.
   */
  export function solvePhysicalChainTarget(input: IAutoMovieSolvePhysicalChainTarget.IInput): IAutoMovieSolvePhysicalChainTarget.IResult {
    return solvePhysicalChainTargetImplementation(input);
  }

  /**
   * Damped least-squares target update with an active set at box boundaries.
   * Re-solve on free columns when a bound coordinate requests outward travel;
   * clipping a complete unconstrained step can otherwise stall every coordinate.
   * SVD acts on the original design. Bounds constrain the search direction and
   * the nonlinear caller still owns backtracking and actual residual admission.
   */
  export function solvePhysicalTargetStep(input: IAutoMovieSolvePhysicalTargetStep.IInput): number[] {
    return solvePhysicalTargetStepImplementation(input);
  }

  /**
   * Both relationship populations share identities, residual rows and articulated
   * coordinate budgets before solver allocation.
   */
  export function admitPhysicalContactBindings(input: IAutoMoviePhysicalSimulationInput.IInput, body: IAutoMoviePhysicalSimulationInput.IBody, bindings: IAutoMoviePhysicalContactBinding[] | undefined, pointBounds?: IAutoMoviePhysicalPointBound[]): void {
    admitPhysicalContactBindingsImplementation(input, body, bindings, pointBounds);
  }

  /**
   * Admit shared support geometry before tracking or recovery can dereference a
   * carrier.
   */
  export function admitPhysicalSupportPattern(profile: IAutoMoviePhysicalProfile, pattern: IAutoMovieFootfallPattern, stepping: boolean): void {
    admitPhysicalSupportPatternImplementation(profile, pattern, stepping);
  }

  /**
   * Record the rigid contacts the world's last step solved, one receipt sample
   * per touching collider pair, in the world's canonical pair order
   * (`AutoMovieXpbdWorld.manifolds`: creation order of the first collider, then
   * of the second).
   *
   * A manifold's impulse is the sum of the normal impulses the step applied at
   * its patch points, newton seconds over the substep; its separation is the
   * least end-of-step separation of those points, metres; its point is the first
   * patch point's witness midpoint; its normal points from the first collider
   * toward the second. A manifold that received no positive impulse, or whose
   * points all ended separated, records nothing. Sensor overlaps are not
   * manifolds; the compliant law reads them. Pairs of one scene body's own
   * colliders and colliders the binding does not identify are skipped. A body in
   * exaggerated mode then receives the extra share `(gain - 1)` of the impulse
   * its side took, at the same point, so its response is the declared multiple of
   * the solved one; a share whose Float64 product overflows throws instead of
   * giving the body an infinite velocity.
   *
   * @param world The world, after a step.
   * @param input The admitted simulation input; its bodies' modes and rate.
   * @param bound The world's binding: collider identities and segment bodies.
   * @param seconds Cache-frame seconds that stamp the samples.
   * @param contacts The run's receipts, appended to.
   * @param active Open receipts by pair key, updated.
   * @param found Pair keys touched in this cache frame, added to.
   */
  export function collectPhysicalContacts(world: AutoMovieXpbdWorld, input: IAutoMoviePhysicalSimulationInput.IInput, bound: Bound, seconds: number, contacts: IAutoMovieContactReceipt[], active: Map<string, IAutoMovieContactReceipt>, found: Set<string>): void {
    collectPhysicalContactsImplementation(world, input, bound, seconds, contacts, active, found);
  }

  /**
   * Compile contact-driven spray through the existing effect stream and sampler.
   * Colour, accumulation and physical coefficients belong to the provider or
   * production; Engine has no skin, coat, blood or species preset. Each stream
   * seed/digest covers actual contact bytes and its complete recipe. Kinematic
   * callers must explicitly supply their formula-derived impulse estimate.
   */
  export function compileImpactEffects(input: IAutoMovieCompileImpactEffects.IInput): IAutoMovieCompiledEffect[] {
    return compileImpactEffectsImplementation(input);
  }

  /**
   * Allocate a requested floating-base wrench at actual floor points. Unilateral
   * normal forces and the inscribed |fx|+|fz|<=mu*fy pyramid imply Coulomb
   * friction even for diagonal demand. Moments use each actual lever, including
   * yaw. Caron et al. 2015, Eqs.2–7, distinguish these conditions from CoP alone.
   * This bounded virtual-model allocation is not full inverse dynamics: native
   * constraints and motor caps still determine the actual response. Returned
   * wrench residuals expose infeasible demand rather than inventing support.
   */
  export function distributePhysicalSupportWrench(input: IAutoMovieDistributePhysicalSupportWrench.IInput): IAutoMovieDistributePhysicalSupportWrench.IResult {
    return distributePhysicalSupportWrenchImplementation(input);
  }

  /**
   * Bridge an {@link IAutoMovieImpact}'s impulse to a recoil
   * {@link IAutoMovieRecoilPush}: the missing consumer between collision response
   * and flinch. The impulse magnitude (N·s) scaled by `gainDegPerImpulse` becomes
   * the `flexion` the struck body yields; {@link impactRecoil} then bounds that
   * push by joint ROM and spreads it down the chain. Kept deliberately simple
   * (one dominant flexion axis): it is an AI hint, not a solved contact
   * response.
   */
  export function impulseToRecoilPush(impulse: IAutoMovieVector3, gainDegPerImpulse: number): IAutoMovieRecoilPush {
    return impulseToRecoilPushImplementation(impulse, gainDegPerImpulse);
  }

  /**
   * Resolve only provider-declared overlapping pivot neighbours, never all self
   * contact.
   */
  export function isPhysicalPairExcluded(input: IAutoMoviePhysicalSimulationInput.IInput, bound: Bound, first: number, second: number): boolean {
    return isPhysicalPairExcludedImplementation(input, bound, first, second);
  }

  /**
   * Shared self-contact exclusions for native filtering, goal fitting and audit.
   * Same owners, direct joint neighbours and declared overlapping pivot regions
   * cannot collide with themselves.
   */
  export function isPhysicalProfilePairExcluded(profile: IAutoMoviePhysicalProfile, a: string, b: string): boolean {
    return isPhysicalProfilePairExcludedImplementation(profile, a, b);
  }

  /**
   * Prepare one body's relationship witnesses. Same-body endpoints follow the
   * candidate and outside receivers read the original actual snapshot.
   */
  export function physicalContactBindingRows(input: IAutoMoviePhysicalContactBindingRows.IInput): IAutoMoviePhysicalContactBindingRows.IResult {
    return physicalContactBindingRowsImplementation(input);
  }

  /**
   * Preserve original enabled endpoint promises and explicitly stationary support
   * patches. Recovery goals come from the declared trajectory, never an unmet
   * fitted pose; moving or reserved endpoints retain XYZ without a planted-plane
   * claim.
   */
  export function physicalContactSupportGoals(body: IAutoMoviePhysicalSimulationInput.IBody, target: IAutoMoviePhysicalSimulationInput.ITarget, floor: number, tolerance: number, seconds: number, rate: number, step: number, state?: IAutoMoviePhysicalRecoveryState): IAutoMoviePhysicalContactSupportRows.ISupport[] {
    return physicalContactSupportGoalsImplementation(body, target, floor, tolerance, seconds, rate, step, state);
  }

  /**
   * Keep an endpoint's existing XYZ promise and its explicitly declared real
   * support plane in the same solve. Geometry, witnesses and original goals are
   * borrowed only for this invocation.
   */
  export function physicalContactSupportRows(input: IAutoMoviePhysicalContactSupportRows.IInput): IAutoMovieLinearizePhysicalTargetRows.IRows[] {
    return physicalContactSupportRowsImplementation(input);
  }

  /**
   * The limbs a recovery swing has lifted: under way and no longer seated, which
   * the stance and support tracking no longer carry.
   *
   * @param state The recovery's state, if any.
   * @returns Their endpoint bones, the swing's first.
   */
  export function physicalRecoveryLifted(state: IAutoMoviePhysicalRecoveryState | undefined): string[] {
    return physicalRecoveryLiftedImplementation(state);
  }

  /**
   * The step under way for a limb, if any.
   *
   * @param state The recovery's state, if any.
   * @param bone The limb's endpoint bone.
   * @returns Its step, or undefined.
   */
  export function physicalRecoveryLimbSwing(state: IAutoMoviePhysicalRecoveryState | undefined, bone: string): IAutoMovieStepPlanner.IStep | undefined {
    return physicalRecoveryLimbSwingImplementation(state, bone);
  }

  /**
   * The limbs asked to step that have not lifted: still support, each giving up
   * its share over its unloading ramp.
   *
   * @param state The recovery's state, if any.
   * @returns Their endpoint bones, the swing's first.
   */
  export function physicalRecoveryRequested(state: IAutoMoviePhysicalRecoveryState | undefined): string[] {
    return physicalRecoveryRequestedImplementation(state);
  }

  /**
   * Where a limb's step under way is recorded: its latest unresolved record.
   *
   * @param steps The recovery's recorded steps, in time order.
   * @param bone The limb's endpoint bone.
   * @returns The record's index, or -1 when the limb has none.
   */
  export function physicalRecoveryStepRecord(steps: IAutoMoviePhysicalRecoveryState["steps"], bone: string): number {
    return physicalRecoveryStepRecordImplementation(steps, bone);
  }

  /**
   * The steps a recovery has under way (`advancePhysicalBalance`), any limbs at
   * once. Each lifts as its step begins.
   *
   * @param state The recovery's state, if any.
   * @returns The swing, then the swings in the order they lifted; empty with
   *   none.
   */
  export function physicalRecoverySwing(state: IAutoMoviePhysicalRecoveryState | undefined): IAutoMovieStepPlanner.IStep[] {
    return physicalRecoverySwingImplementation(state);
  }

  /**
   * Compute the unchanged reach-sphere root-lowering request without running
   * endpoint IK whose poses would be discarded. This is a bounded motor intent,
   * never a correction to an actual root.
   */
  export function physicalSupportRootDrop(input: IAutoMoviePhysicalSupportRootDrop.IInput): number {
    return physicalSupportRootDropImplementation(input);
  }

  /**
   * Fit one body's contact, support, floor and avoidance goals at its actual
   * root. An external receiver stays at the simultaneous actual placement.
   */
  export function planPhysicalContactTargets(input: IAutoMoviePlanPhysicalContactTargets.IInput): IAutoMoviePlanPhysicalContactTargets.IResult {
    return planPhysicalContactTargetsImplementation(input);
  }

  /**
   * Fit declared support patches to a plane using their actual convex geometry.
   * Keep authored endpoint goals and their floor constraints in the same fit,
   * retaining any unresolved residual. A shared root-drop budget is consumed
   * across passes; cached bodies are never corrected. Non-planted patches
   * preserve their authored clearance, clamped to the floor, so a root-drop
   * correction cannot drive a swinging sole below it.
   */
  export function planPhysicalFloorSupportTargets(input: IAutoMoviePlanPhysicalFloorSupportTargets.IInput): IAutoMoviePlanPhysicalFloorSupportTargets.IResult {
    return planPhysicalFloorSupportTargetsImplementation(input);
  }

  /**
   * Correct support joint goals for the root's actual placement, so root tracking
   * error does not become foot sliding.
   */
  export function planPhysicalRootSupportTargets(input: IAutoMoviePlanPhysicalRootSupportTargets.IInput): Record<string, IAutoMovieRigidTransform> {
    return planPhysicalRootSupportTargetsImplementation(input);
  }

  /**
   * Feed a changed support placement back to bounded joint goals. Root lowering
   * follows the actual chain reach sphere and an explicit posture budget; it
   * never teleports a body or moves the requested support to hide a residual.
   */
  export function planPhysicalSupportTargets(input: IAutoMoviePlanPhysicalSupportTargets.IInput): IAutoMoviePlanPhysicalSupportTargets.IResult {
    return planPhysicalSupportTargetsImplementation(input);
  }

  /**
   * Build the world's collider-pair filter for one bound run: two colliders of
   * the same segment, of a joint's two segments, or of a pair the profile
   * declares in `collisionExclusions` never touch; colliders of different scene
   * bodies, and a body's undeclared non-adjacent segments, always may. The world
   * consults the filter for contact response and for sensor overlaps alike, so
   * the compliant layer sees the same pairs as the rigid solve. Every collider of
   * a segment shares its record, including a compliant surface's rigid core. A
   * collider the binding does not identify is resolved by
   * `isPhysicalPairExcluded` on the live input, which the floor and unknown
   * colliders pass.
   *
   * @param input The admitted simulation input: profiles, joints and exclusions.
   * @param bound The world's binding: collider identities by handle.
   * @returns The filter `AutoMovieXpbdWorld.step` takes; true admits the pair.
   */
  export function preparePhysicalContactHooks(input: IAutoMoviePhysicalSimulationInput.IInput, bound: Bound): solveXpbdContacts.Filter {
    return preparePhysicalContactHooksImplementation(input, bound);
  }

  /**
   * Bounded cyclic projection of a common root translation onto support-reach
   * balls. Each limb origin translates equally; support goals remain fixed. This
   * produces a kinematic seed, never teleports a simulated body. Convex
   * projection can exhaust its finite budget or meet incompatible balls; the
   * original residual remains observable and no goal is moved to hide it.
   */
  export function projectPhysicalSupportReach(input: IAutoMovieProjectPhysicalSupportReach.IInput): IAutoMovieProjectPhysicalSupportReach.IResult {
    return projectPhysicalSupportReachImplementation(input);
  }

  /**
   * A step's touching pairs that responded, one manifold each: non-sensor pairs
   * with their normal from the first collider toward the second and every patch
   * point's world witness midpoint, its separation where the step found it and
   * the normal impulse the step transferred there: the position passes'
   * multiplier over the substep, `lambda / h`, plus the velocity passes' impulse,
   * which together are the momentum the contact gave each body.
   *
   * @param contacts The step's contacts, the points of one pair adjacent.
   * @param h The substep, seconds.
   * @returns Fresh manifolds, in pair order; their colliders are the contacts'.
   */
  export function readXpbdManifolds(contacts: readonly solveXpbdContacts.IContact[], h: number): AutoMovieXpbdWorld.IManifold[] {
    return readXpbdManifoldsImplementation(contacts, h);
  }

  /** Merge core and compliant-surface impulses into one shape-pair episode. */
  export function recordPhysicalContact(input: IAutoMovieRecordPhysicalContact.IInput): IAutoMovieContactReceipt {
    return recordPhysicalContactImplementation(input);
  }

  /**
   * Resolve a collision between bodies `a` and `b` across unit contact `normal`
   * (pointing from `a` to `b`) into an abstracted {@link IAutoMovieImpact}.
   *
   * Impulse is the textbook normal response, `jn = (1+e)·closing / (1/mₐ +
   * 1/m_b)`, but the **effective restitution and a qualitative kind** come from a
   * cheap, deterministic material heuristic rather than a contact solver: a fast
   * strike into a soft, penetrable body **embeds** (no rebound) or, if very fast
   * and very soft, passes **through** (only a fraction of the momentum
   * transfers); a hard, bouncy pair **bounces**; otherwise it **deflects**.
   * Bodies already separating yield a pure `deflect` with no impulse.
   */
  export function resolveImpact(a: IAutoMovieImpactBodyState, b: IAutoMovieImpactBodyState, normal: IAutoMovieVector3): IAutoMovieImpact {
    return resolveImpactImplementation(a, b, normal);
  }

  /**
   * The recorded steps with a limb's step under way resolved: its latest
   * unresolved record marked with when and how it ended, for replay, audio and
   * support audits.
   *
   * @param steps The recovery's recorded steps, in time order.
   * @param bone The limb's endpoint bone.
   * @param resolved When the step was resolved, local seconds, and how.
   * @returns A new list, or the input itself when the limb has no record.
   */
  export function resolvePhysicalRecoveryStep(steps: IAutoMoviePhysicalRecoveryState["steps"], bone: string, resolved: NonNullable<
    IAutoMoviePhysicalRecoveryState["steps"][number]["resolved"]
  >): IAutoMoviePhysicalRecoveryState["steps"] {
    return resolvePhysicalRecoveryStepImplementation(steps, bone, resolved);
  }

  /**
   * Return a warm support seed's redundant coordinates to the authored posture.
   *
   * A warm seed keeps the previous fit's task-space choice, such as which way a
   * near-straight chain bends. The support task constrains only each endpoint and
   * its planted floor witnesses, so a coordinate change in that task's null space
   * (a limb swivel or patch yaw) has no restoring term in the least-squares fit,
   * whose steps never leave the row space. Carried forward from step to step,
   * such a change accumulates under root sway. This applies Liégeois's redundancy
   * resolution once to the seed: the coordinate difference to the admitted
   * authored posture is split along the right singular directions of the
   * support-task Jacobian. Directions are returned to authored from the smallest
   * linearized task effect upward while the root-sum-square of those effects
   * stays within the fit's own residual tolerance; the remaining directions keep
   * the warm task-space choice. The null space therefore always returns, and a
   * near-singular row (whose singular value is small but whose task effect is
   * second order) does not hold a first-order posture offset. The subsequent
   * bounded fit corrects the task within the same tolerance.
   *
   * Coordinates are the native independent twist coordinates θ = 2 atan(q_axis /
   * w) owned by {@link projectPhysicalJointRotation}. The Jacobian uses central
   * differences with the error-optimal step ε^(1/3); its truncation and rounding
   * noise is of relative order ε^(2/3), far below the tolerance budget, so
   * numerically null directions always return. ROM projection follows the
   * update.
   */
  export function resolvePhysicalSupportRedundancy(input: IAutoMovieResolvePhysicalSupportRedundancy.IInput): Record<string, IAutoMovieRigidTransform> {
    return resolvePhysicalSupportRedundancyImplementation(input);
  }

  /**
   * A step timed from a moment again: its start moved there and its end with it,
   * keeping its duration. A request not yet lifted keeps being timed from now
   * until it lifts, and is timed from its lift-off then.
   *
   * @param step The step.
   * @param seconds The new start, local seconds.
   * @returns A new step; the input is unchanged.
   */
  export function retimePhysicalRecoveryStep(step: IAutoMovieStepPlanner.IStep, seconds: number): IAutoMovieStepPlanner.IStep {
    return retimePhysicalRecoveryStepImplementation(step, seconds);
  }

  /**
   * Local accumulating appearance weight at an actual provider surface point.
   * Provider-owned colour/roughness channels consume this scalar. Each contact
   * centre is supplied in the same current provider frame as the sample, so skin
   * marks follow the struck region through later articulation. Engine does not
   * choose a whole-part tint or assert a medical bruise model.
   */
  export function sampleContactSurfaceResponse(input: IAutoMovieSampleContactSurfaceResponse.IInput): number {
    return sampleContactSurfaceResponseImplementation(input);
  }

  /**
   * Admit a contact receipt and return completed measurements no later than the
   * nonnegative film second. The default Infinity reads the whole valid episode.
   * Geometric events carry no solved impulse or completed solver samples. A
   * malformed receipt or cutoff throws before the caller receives any events.
   */
  export function samplePhysicalContactEvents(receipt: IAutoMovieContactReceipt, seconds?: number): IAutoMovieContactReceipt[] {
    return samplePhysicalContactEventsImplementation(receipt, seconds);
  }

  /**
   * Sample the declared recovery trajectory and its derivative at one clock,
   * independently of native control or cache-frame ownership.
   */
  export function samplePhysicalRecoveryGoal(input: IAutoMovieSamplePhysicalRecoveryGoal.IInput): IAutoMovieSamplePhysicalRecoveryGoal.IResult {
    return samplePhysicalRecoveryGoalImplementation(input);
  }

  /**
   * Replay a support's actual controller ownership and accepted goal adjustment
   * at one second. Completed future landings cannot alter an earlier sample;
   * authored handoffs end endpoint ownership while retaining the independently
   * adopted body displacement.
   */
  export function samplePhysicalRecoverySupport(state: IAutoMoviePhysicalRecoveryState | undefined, bone: string, seconds: number): IAutoMovieSamplePhysicalRecoverySupport.IResult {
    return samplePhysicalRecoverySupportImplementation(state, bone, seconds);
  }

  /**
   * Apply implicit Kelvin-Voigt surface impulses to the sensor overlaps of the
   * world's last step. A compliant surface is a sensor collider; its rigid core,
   * a separate collider at the declared compression limit, takes part in the
   * rigid solve instead.
   *
   * Each overlapping pair with a compliant first surface (`surfaces`, the lower
   * collider order first) is measured once at the current poses by convex signed
   * distance (`physicalShapePairContact`); a pair that has separated, or whose
   * surfaces belong to one scene body, gets nothing. The normal impulse `j`
   * solves the implicit law over the substep `dt`, with the two compliances
   * `c_a`, `c_b` in series, the compliance-weighted damping `c_d` and the
   * effective inverse mass `w` of both bodies at the witness midpoint along the
   * normal: `j = (dt d + dt (dt + c_d) v_n) / (c_a + c_b + dt (dt + c_d) w)`,
   * evaluated in compliance-normalized form and clamped at zero, where `d` is the
   * depth and `v_n` the approach speed. Coulomb friction opposes the tangential
   * slip, bounded by the mean friction times `j` and by the impulse that stops
   * the slip. Each dynamic body receives the combined impulse times its surface's
   * response gain, the first body along the normal's reverse; a kinematic body
   * receives none. A transferred impulse whose Float64 product overflows throws,
   * as does a non-finite effective mass or impulse. The next step integrates the
   * response.
   *
   * @param world The world, after a step; its sensor overlaps and bodies.
   * @param surfaces Each bound collider's compliance (m/N), damping (s), friction
   *   and gain, by handle.
   * @param seconds Seconds that stamp the measurements.
   * @param dt The substep, seconds.
   * @returns One measurement per responding pair: the handles, point, normal from
   *   the first toward the second, impulse (N s), the normal impulse each side
   *   received, and the separation (m).
   */
  export function solvePhysicalCompliantContacts(world: AutoMovieXpbdWorld, surfaces: ReadonlyMap<
    number,
    IAutoMovieSolvePhysicalCompliantContacts.ISurface
  >, seconds: number, dt: number): IAutoMovieSolvePhysicalCompliantContacts.IMeasurement[] {
    return solvePhysicalCompliantContactsImplementation(world, surfaces, seconds, dt);
  }

  /**
   * Suggest how a collision resolves: run {@link resolveImpact} for the impulse,
   * bridge it to a recoil push, and (when a struck `chain` + `skeleton` are
   * given) bound that push by joint ROM into a flinch pose via
   * {@link impactRecoil}. This is the reusable core the pipeline (and
   * {@link detectBodyCollision}) attaches to a contact warning; it wires together
   * resolveImpact and impactRecoil, whose consumer was previously missing.
   */
  export function suggestCollisionResponse(props: IAutoMovieSuggestCollisionResponse.IProps): IAutoMovieCollisionResponse {
    return suggestCollisionResponseImplementation(props);
  }

  /**
   * Carry the previous local support correction through an authored change
   * instead of selecting a fresh straight-chain bend branch, then return its
   * support-task null space to the authored posture so unconstrained swivel or
   * patch yaw cannot accumulate across steps. The original world endpoints, root
   * intent and ROM remain the fitting constraints.
   */
  export function warmPhysicalSupportTargets(input: IAutoMovieWarmPhysicalSupportTargets.IInput): Record<string, IAutoMovieRigidTransform> {
    return warmPhysicalSupportTargetsImplementation(input);
  }

  /**
   * Admit candidate-relative point intervals without inventing anatomy, axes or a
   * goal point.
   */
  export function admitPhysicalPointBounds(profiles: Readonly<Record<string, IAutoMoviePhysicalProfile>>, body: string, bounds: readonly IAutoMoviePhysicalPointBound[], ids: Set<string>): void {
    admitPhysicalPointBoundsImplementation(profiles, body, bounds, ids);
  }

  /**
   * Build the **flinch** a struck body yields under an impact: the reactive
   * `push` (a deflection driven by the impulse) propagates down a `chain` of
   * bones (from the contact bone toward the body) losing strength by `falloff`
   * each link, and **each joint only yields as far as its ROM allows**
   * ({@link IAutoMovieJointConstraint}). So what the hit _does_ to the body is
   * bounded by the same joint ranges the engine already validates against: a neck
   * can only snap so far, a spine only bend so much.
   *
   * This is the ROM-aware half of collision response: the reactive force decides
   * how hard the push is, the joint ROM decides how far the body actually goes.
   * The caller maps an {@link IAutoMovieImpact}'s impulse to the `push`
   * magnitude.
   */
  export function impactRecoil(push: IAutoMovieRecoilPush, chain: AutoMovieHumanoidBone[], skeleton: IAutoMovieSkeleton, falloff?: number): IAutoMoviePose {
    return impactRecoilImplementation(push, chain, skeleton, falloff);
  }

  /**
   * Refuse a nonfinite or out-of-domain shape before it can leave the declared
   * finite floor.
   */
  export function inPhysicalFloorBounds(pose: IAutoMovieRigidTransform, shape: IAutoMoviePhysicalShape, floor: IAutoMoviePhysicalSimulationInput.IInput["floorBounds"]): boolean {
    return inPhysicalFloorBoundsImplementation(pose, shape, floor);
  }

  /**
   * Evaluate one scalar relationship with coherent same-body motion and an actual
   * external reference. The shape direction is converted from world to bone-local
   * coordinates.
   */
  export function physicalPointProjection(body: string, profiles: Readonly<Record<string, IAutoMoviePhysicalProfile>>, actual: Readonly<
    Record<string, Readonly<Record<string, IAutoMovieRigidTransform>>>
  >, bound: IAutoMoviePhysicalPointBound, poses: Readonly<Record<string, IAutoMovieRigidTransform>>): number {
    return physicalPointProjectionImplementation(body, profiles, actual, bound, poses);
  }
}
