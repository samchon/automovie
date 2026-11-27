import {
  type AutoMovieBodyRegion,
  type AutoMovieClinicalAxis,
  type AutoMovieHumanoidBone,
  type AutoMovieHumanoidRegion,
  type AutoMovieJointTwistPlacement,
  type IAutoMovieActionCall,
  type IAutoMovieActionTarget,
  type IAutoMovieActorContext,
  type IAutoMovieActorWorldFrame,
  type IAutoMovieAngleRange,
  type IAutoMovieArmChainFault,
  type IAutoMovieArticulatedRig,
  type IAutoMovieArticulatedRigReader,
  type IAutoMovieBodyMomentum,
  type IAutoMovieBodyMeasure,
  type IAutoMovieBoxExcludedSwivels,
  type IAutoMovieFitDigitDescent,
  type IAutoMovieFitDigitToTarget,
  type IAutoMovieGazeChainJoints,
  type IAutoMovieHingedArticulation,
  type IAutoMovieHumanoidSurfaceExtents,
  type IAutoMovieHumanoidSurfaceReader,
  type IAutoMovieHumanoidSurfaces,
  type IAutoMovieJointAxes,
  type IAutoMovieJointAxesIssue,
  type IAutoMovieJointConstraint,
  type IAutoMovieJointPose,
  type IAutoMovieJointRotationDomain,
  type IAutoMovieLookAt,
  type IAutoMovieMark,
  type IAutoMovieMarkBalance,
  type IAutoMovieMarkRomOvershoot,
  type IAutoMovieMotion,
  type IAutoMovieMotionSample,
  type IAutoMoviePhysicalProfile,
  type IAutoMoviePose,
  type IAutoMoviePoseJointCodec,
  type IAutoMoviePoseResolution,
  type IAutoMoviePoseRig,
  type IAutoMovieQuaternion,
  type IAutoMovieResolveBalanceOutcome,
  type IAutoMovieResolveCenterOfMass,
  type IAutoMovieResolveHumanoidRingModules,
  type IAutoMovieResolvedBone,
  type IAutoMovieResolvedJointAngles,
  type IAutoMovieRestFrame,
  type IAutoMovieSkeleton,
  type IAutoMovieSkeletonTopology,
  type IAutoMovieSwivelArcs,
  type IAutoMovieTwoBoneIK,
  type IAutoMovieValidateJointRom,
  type IAutoMovieVector3,
  type IAutoMovieYawPitch,
} from "@automovie/interface";

import { actionRegion as actionRegionImplementation } from "../perform/internal/actionRegion";
import { bodyRegionBones as bodyRegionBonesImplementation } from "../perform/internal/bodyRegionBones";
import { resolveActorWorldFrame as resolveActorWorldFrameImplementation } from "../perform/internal/resolveActorWorldFrame";
import { resolveBoneTarget as resolveBoneTargetImplementation } from "../perform/internal/resolveBoneTarget";
import { AutoMovieEngineClampJointToSkeleton } from "../rom/internal/AutoMovieEngineClampJointToSkeleton";
import { AutoMovieEngineClampPose } from "../rom/internal/AutoMovieEngineClampPose";
import { AutoMovieEngineClinicalAngle } from "../rom/internal/AutoMovieEngineClinicalAngle";
import { AutoMovieEngineJointRomScan } from "../rom/internal/AutoMovieEngineJointRomScan";
import { AutoMovieEngineRigAngle } from "../rom/internal/AutoMovieEngineRigAngle";
import { abductionRange as abductionRangeImplementation } from "../rom/internal/abductionRange";
import { clampJointRom as clampJointRomImplementation } from "../rom/internal/clampJointRom";
import { getConstraint as getConstraintImplementation } from "../rom/internal/getConstraint";
import { restRelativeConstraint as restRelativeConstraintImplementation } from "../rom/internal/restRelativeConstraint";
import { swingConeAngle as swingConeAngleImplementation } from "../rom/internal/swingConeAngle";
import { swingConeBlend as swingConeBlendImplementation } from "../rom/internal/swingConeBlend";
import { validateJointRom as validateJointRomImplementation } from "../rom/internal/validateJointRom";
import type { AutoMovieEngineKinematicsTypes } from "./AutoMovieEngineKinematicsTypes";
import { type distalEndSwivelReadings } from "./distalEndSwivelReadings";
import { type distalTwistSwivelRange } from "./distalTwistSwivelRange";
import { AutoMovieHumanoidDigitSurfaces as AutoMovieHumanoidDigitSurfacesImplementation } from "./internal/AutoMovieHumanoidDigitSurfaces";
import type { AutoMovieHumanoidNeutralBounds } from "./internal/AutoMovieHumanoidNeutralBounds";
import { AutoMovieHumanoidSurfaceExtents as AutoMovieHumanoidSurfaceExtentsImplementation } from "./internal/AutoMovieHumanoidSurfaceExtents";
import { aimRotationImplementation } from "./internal/aimRotationImplementation";
import { aimYawPitch as aimYawPitchImplementation } from "./internal/aimYawPitch";
import { alternateRigJointAngles as alternateRigJointAnglesImplementation } from "./internal/alternateRigJointAngles";
import { armChainFault as armChainFaultImplementation } from "./internal/armChainFault";
import { boxExcludedSwivels as boxExcludedSwivelsImplementation } from "./internal/boxExcludedSwivels";
import { boxLeastSwivels as boxLeastSwivelsImplementation } from "./internal/boxLeastSwivels";
import { clinicalDeviation as clinicalDeviationImplementation } from "./internal/clinicalDeviation";
import { decomposeJointRotation as decomposeJointRotationImplementation } from "./internal/decomposeJointRotation";
import { distalEndSwivelArcs as distalEndSwivelArcsImplementation } from "./internal/distalEndSwivelArcs";
import { distalEndSwivelMiss as distalEndSwivelMissImplementation } from "./internal/distalEndSwivelMiss";
import { distalEndSwivelNearest as distalEndSwivelNearestImplementation } from "./internal/distalEndSwivelNearest";
import { fitDigitDescent as fitDigitDescentImplementation } from "./internal/fitDigitDescent";
import { fitDigitToTarget as fitDigitToTargetImplementation } from "./internal/fitDigitToTarget";
import { gazeChainJointsImplementation } from "./internal/gazeChainJointsImplementation";
import { hingedArmArticulation as hingedArmArticulationImplementation } from "./internal/hingedArmArticulation";
import { hingedSwivelFeasible as hingedSwivelFeasibleImplementation } from "./internal/hingedSwivelFeasible";
import { immobileAxisSwivels as immobileAxisSwivelsImplementation } from "./internal/immobileAxisSwivels";
import { indexSkeletonTopology as indexSkeletonTopologyImplementation } from "./internal/indexSkeletonTopology";
import { indexSkeletonTopologyChildren as indexSkeletonTopologyChildrenImplementation } from "./internal/indexSkeletonTopologyChildren";
import { jointRomOvershoot as jointRomOvershootImplementation } from "./internal/jointRomOvershoot";
import { jointToQuaternion as jointToQuaternionImplementation } from "./internal/jointToQuaternion";
import { markAutoMovieBalance as markAutoMovieBalanceImplementation } from "./internal/markAutoMovieBalance";
import { markAutoMovieRomOvershoot as markAutoMovieRomOvershootImplementation } from "./internal/markAutoMovieRomOvershoot";
import { measureAutoMovieHumanoidBody as measureAutoMovieHumanoidBodyImplementation } from "./internal/measureAutoMovieHumanoidBody";
import { normalizeJointAxes as normalizeJointAxesImplementation } from "./internal/normalizeJointAxes";
import { poseJointCodecImplementation } from "./internal/poseJointCodecImplementation";
import { prepareArticulatedRig as prepareArticulatedRigImplementation } from "./internal/prepareArticulatedRig";
import { prepareAutoMovieMassModel as prepareAutoMovieMassModelImplementation } from "./internal/prepareAutoMovieMassModel";
import { prepareJointRomOvershoot as prepareJointRomOvershootImplementation } from "./internal/prepareJointRomOvershoot";
import { preparePoseResolution as preparePoseResolutionImplementation } from "./internal/preparePoseResolution";
import { reachPose as reachPoseImplementation } from "./internal/reachPose";
import { reachableBoneNames as reachableBoneNamesImplementation } from "./internal/reachableBoneNames";
import { readPreparedBendClinical as readPreparedBendClinicalImplementation } from "./internal/readPreparedBendClinical";
import { resolveAutoMovieBalanceOutcome as resolveAutoMovieBalanceOutcomeImplementation } from "./internal/resolveAutoMovieBalanceOutcome";
import { resolveAutoMovieBoneRates as resolveAutoMovieBoneRatesImplementation } from "./internal/resolveAutoMovieBoneRates";
import { resolveAutoMovieCenterOfMass as resolveAutoMovieCenterOfMassImplementation } from "./internal/resolveAutoMovieCenterOfMass";
import { resolveAutoMovieHumanoidRingModules as resolveAutoMovieHumanoidRingModulesImplementation } from "./internal/resolveAutoMovieHumanoidRingModules";
import { resolveAutoMovieHumanoidSurfaces as resolveAutoMovieHumanoidSurfacesImplementation } from "./internal/resolveAutoMovieHumanoidSurfaces";
import { resolveAutoMovieMomentum as resolveAutoMovieMomentumImplementation } from "./internal/resolveAutoMovieMomentum";
import { resolveAutoMovieMomentumRates as resolveAutoMovieMomentumRatesImplementation } from "./internal/resolveAutoMovieMomentumRates";
import { resolveLookAt as resolveLookAtImplementation } from "./internal/resolveLookAt";
import { resolvePose as resolvePoseImplementation } from "./internal/resolvePose";
import { skeletonJointAxes as skeletonJointAxesImplementation } from "./internal/skeletonJointAxes";
import { solveResolvedRate as solveResolvedRateImplementation } from "./internal/solveResolvedRate";
import { solveTwoBoneIK as solveTwoBoneIKImplementation } from "./internal/solveTwoBoneIK";
import { validateJointAxesBasis as validateJointAxesBasisImplementation } from "./internal/validateJointAxesBasis";
import { type swingTwistRange } from "./swingTwistRange";

/** Pure forward-kinematics and authored-gaze operations for AutoMovie poses. */
export namespace AutoMovieEngineKinematics {
  /**
   * Forward kinematics: resolve a pose against its skeleton into reachable bone
   * transforms in parent-first order. Optional axes, rest frames, topology,
   * prepared adapter and requested bones keep the existing resolvePose
   * contract.
   */
  export function resolvePose(
    pose: IAutoMoviePose,
    skeleton: IAutoMovieSkeleton,
    jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
    restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>,
    topology?: IAutoMovieSkeletonTopology,
    prepared?: IAutoMoviePoseResolution,
    requested?: ReadonlySet<string>,
  ): IAutoMovieResolvedBone[] {
    return resolvePoseImplementation(
      pose,
      skeleton,
      jointAxes,
      restFrames,
      topology,
      prepared,
      requested,
    );
  }

  /**
   * Distribute one solved aim over the gaze chain, `neck` then `head`, so a
   * gaze the rig's declared ranges can hold compiles inside them.
   *
   * The head takes as much of each axis as its range holds, since its
   * rotation points the eyes, and the neck takes what remains up to its own
   * range. An aim the head holds alone therefore compiles to the single
   * `head` joint, and the neck appears only when it carries something.
   * Whatever neither range can hold stays on the head unclamped, so the
   * shot's ROM gate reports the head overshooting by exactly the amount the
   * whole chain falls short, as an impossible reach does; bending the aim
   * into range would point the actor somewhere it was never told to look.
   *
   * Splitting relies on the two joints' angles adding along the chain. Both
   * use the default clinical basis, so this holds exactly for a split on one
   * axis when the head rests unrotated relative to the neck, as the canonical
   * humanoid does. Flexion and twist split together compose two non-commuting
   * rotations, so the combined aim then differs slightly from the single-bone
   * aim.
   *
   * The aim stays on the single `head` joint when there is no rig (`null`;
   * the perform-shot ROM gate does not run for a rig-less actor), when the
   * rig declares no `head` or `neck`, or when the head's parent is not the
   * neck, because rotating a neck the head does not hang from would not move
   * the head. A missing per-bone constraint falls back to the default
   * humanoid ROM, as the gate does.
   *
   * @param props.rig The actor's resolved skeleton, or `null` when it has
   *   none.
   * @param props.flexionDeg Sagittal aim in degrees, `+` down, matching the
   *   pose axis.
   * @param props.twistDeg Transverse aim in degrees about the chain's long
   *   axis.
   * @returns The joints of the aim pose, parent first; abduction is always
   *   `null`, and a neck axis that carries nothing is `null`.
   */
  export function gazeChainJoints(
    props: IAutoMovieGazeChainJoints.IProps,
  ): IAutoMovieJointPose[] {
    return gazeChainJointsImplementation.run(props);
  }

  /** Fixed-rig preparation for the same canonical cervical distribution. */
  /**
   * Bind one unchanged rig for repeated actual clinical-degree aims.
   *
   * @param rig The unchanged resolved skeleton, or null for the original
   *   single-head policy.
   * @returns Fresh parent-first joints at every flexion/twist pair. Rig
   *   structure and constraints are first demanded by an actual query; each
   *   axis and only its used min/max bound is captured on first actual need,
   *   after which that metadata must remain unchanged.
   *
   *   Defines fixed rig/ROM lifetime, degree signs inherited from
   *   AutoMovieEngineKinematics.gazeChainJoints, lazy first-use admission,
   *   original fallback and fresh outputs. The same greedy head-first
   *   capacity and unclamped residual owner distributes every current axis.
   *   Fixed topology selects the same head/neck/default constraints, with
   *   null axes immobile and a missing or disconnected chain retaining the
   *   single-head result. One lazy cervical source preparation feeds the
   *   shared raw numerical owner; private lazy range snapshots preserve
   *   first-needed axis/bound order without a second split algorithm.
   *   Original null/fallback/parent rules, shareOf formulas, residuals,
   *   nullable neck axes and output order remain. Unused bounds are not
   *   eagerly read, failed field reads are not retained, and no aim is
   *   clamped to hide insufficient combined range. Two O(B) bone searches and
   *   constraint selection run once across Q aims; at most four axis
   *   references and eight min/max scalar observations are prepared lazily.
   *   Each query retains fixed scalar arithmetic and fresh output joints,
   *   with no measured speedup claim. This explicit API requires the
   *   rig/default cervical metadata to stay unchanged. Only topology and
   *   first-observed range prerequisites are shared; each flexion/twist
   *   request is evaluated afresh and no joint, pose, direction, target or
   *   time answer is reused. The caller owns one reader, its fixed rig and at
   *   most two constraints/four range snapshots/eight bound scalars until
   *   release. Queries add no retained aim, output, dynamic workspace or
   *   growing history.
   */
  export function prepareGazeChainJoints(
    rig: IAutoMovieSkeleton | null,
  ): (flexionDeg: number, twistDeg: number) => IAutoMovieJointPose[] {
    return gazeChainJointsImplementation.prepare(rig);
  }

  /**
   * Apply a declared bone gaze to a sampled pose. Non-bone or absent gaze, or
   * an expression without gaze channels, returns the input sample itself. A
   * resolved gaze transfers its channels into the authored eye joints.
   */
  export function resolveLookAt(
    sample: IAutoMovieMotionSample,
    lookAt: IAutoMovieLookAt | undefined,
  ): IAutoMovieMotionSample {
    return resolveLookAtImplementation(sample, lookAt);
  }

  /**
   * The two maps between a joint's clinical angles and its bone-local
   * rotation on one rig, for work that must treat a pose's joints as
   * rotations.
   *
   * A joint's `[flexion, abduction, twist]` is an Euler chart of a rotation:
   * at the chart's gimbal (a hanging arm on a T-pose rig, where the
   * shoulder's abduction is 90 degrees from rest) two of the angles turn
   * about one axis, so nearly equal rotations have far apart triples, and a
   * difference or blend taken per angle swings the bone through poses neither
   * side holds. Differences and blends are therefore taken on the rotation,
   * and the result is lowered to angles once.
   *
   * `rotation` is {@link jointToQuaternion} with the rig's axes (a bone's own
   * declaration before the host table, {@link skeletonJointAxes}) and rest
   * frame. `angles` is {@link decomposeJointRotation} with the same two and
   * the bone's effective range of motion ({@link getConstraint}), so of the
   * equivalent triples it returns the one the range admits best, as the limb
   * fits do. Without a rig both use the default basis with rest-relative
   * angles and the principal chart.
   *
   * That holds for a joint free about all three axes. A hinge or a two-axis
   * joint spans a lower-dimensional set of rotations, which a composed
   * rotation leaves, and its angles have no gimbal inside their range; `ball`
   * tells the two apart so a caller keeps such a joint on its own angles.
   *
   * @param rig The rig the angles are read through; the default basis when
   *   omitted.
   * @returns The forward and inverse maps.
   */
  export function poseJointCodec(
    rig?: IAutoMoviePoseRig,
  ): IAutoMoviePoseJointCodec.ICodec {
    return poseJointCodecImplementation.create(rig);
  }

  /**
   * Own one actual codec across related velocity reads and offset capture.
   * Keep the rig unchanged through those construction stages. The codec is
   * made at preparation. No pose, quaternion or angle result is cached.
   *
   * @param rig The same rig both sampled states and the offset use.
   * @returns A one-codec getter.
   */
  export function preparePoseJointCodec(
    rig?: IAutoMoviePoseRig,
  ): () => IAutoMoviePoseJointCodec.ICodec {
    return poseJointCodecImplementation.prepare(rig);
  }

  /**
   * Fresh clinical tuples indexed in source order, LAST duplicate wins. Null
   * angles keep their clinical-zero reading. The caller owns the map and
   * tuples; nothing is retained. O(J) output and the existing entry array
   * preserve the original map admission, with no per-call mapper closure.
   *
   * @param pose The actual pose whose joint channels are read.
   * @returns Fresh indexed clinical-degree tuples.
   */
  export function indexPoseJoints(
    pose: IAutoMoviePose,
  ): Map<AutoMovieHumanoidBone, [number, number, number]> {
    return poseJointCodecImplementation.index(pose);
  }

  /**
   * The shortest-arc rotation that turns the direction of `from` onto the
   * direction of `to`.
   *
   * It is the core of an aim or look-at driver, such as a light aimed along its
   * direction or a projectile turned along its velocity, and of the analytic
   * two-bone solves (`twoBoneChainArticulation`, `hingedArmArticulation`). Pass
   * the bone's rest forward axis as `from` and `target - bonePosition` as `to`,
   * and the result orients the bone at the target.
   *
   * The direction of each input is normalized and passed to the engine's single
   * shortest-arc primitive {@link rotationBetween}, the same deadzone-free
   * `atan2` helper the world-driver IK path uses, so the analytic and iterative
   * IK families use the same turn. Representable nonzero cross products remain
   * active, subject to binary64 precision in the normalized directions and
   * result.
   *
   * Aligned inputs return the identity, and antiparallel inputs a 180 degree
   * turn about a deterministic perpendicular. A zero-length input has no
   * direction and also returns the identity, which keeps a projectile at rest
   * facing its authored forward axis.
   *
   * @param from Direction to turn, any length.
   * @param to Direction to turn onto, any length.
   * @returns A unit quaternion.
   */
  export function aimRotation(
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
  ): IAutoMovieQuaternion {
    return aimRotationImplementation.run(from, to);
  }

  /** Aiming from one unchanged source direction. */
  /**
   * Prepare the normalized source once and return the reader that turns it
   * onto each target by the exact shortest-arc solve. A changed source
   * requires another reader.
   */
  export function prepareAimRotation(
    from: IAutoMovieVector3,
  ): (to: IAutoMovieVector3) => IAutoMovieQuaternion {
    return aimRotationImplementation.prepare(from);
  }

  /**
   * The yaw and pitch, in degrees, that aim from `from` at `to` for an actor
   * facing `facingDeg` about +Y: the angles a head, an eye or a camera turns
   * through to look at a target.
   *
   * The world direction is rotated by `-facingDeg` into the actor's frame. Yaw is
   * `atan2(localX, localZ)` in `[-180, 180]`, where 0 is straight ahead and +90
   * is the actor's left, the direction-target convention. Pitch is `atan2(dy,
   * horizontal)` in `[-90, 90]`, positive up. A target on `from` has no direction
   * and answers `{ yawDeg: 0, pitchDeg: 0 }`. The caller maps the pair onto a
   * rig, such as a head's twist and flexion or a camera's pan and tilt. Heading
   * is periodic modulo 360 degrees. Finite coordinates are uniformly rescaled
   * when differences overflow or heading rotation risks overflow or subnormal
   * precision loss; angles depend on direction rather than distance.
   *
   * A non-finite coordinate or facing throws an error naming the field, such as
   * `aimYawPitch to.z must be finite, but was Infinity`.
   *
   * @param from Eye or lens position in world metres.
   * @param to Target position in world metres.
   * @param facingDeg Actor heading about +Y in degrees; 0 faces +Z and 90 faces
   *   +X.
   */
  export function aimYawPitch(
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    facingDeg: number,
  ): IAutoMovieYawPitch {
    return aimYawPitchImplementation(from, to, facingDeg);
  }

  /**
   * The second Euler chart of a joint rotation, in rest-relative (rig) degrees:
   * the other triple that composes to the same rotation.
   *
   * A distal twist composes `Ry(a)·Rx(f)·Rz(t)`, whose second chart is `(180 −
   * f, a + 180, t + 180)`; a proximal twist composes `Rz(t)·Ry(a)·Rx(f)`, whose
   * second chart is `(f + 180, 180 − a, t + 180)`. A left-handed basis is
   * extracted against `−twist`, so its twist takes `−180` where a right-handed
   * one takes `+180`, the same rotation by a full turn. No angle is wrapped:
   * the caller chooses the full-turn alias it needs.
   *
   * @param rig The rest-relative angles of one chart, degrees.
   * @param placement Where the basis places the twist; absent means proximal.
   * @param handed `1` for a right-handed basis (`flexion × abduction =
   *   +twist`), `-1` for a left-handed one.
   * @returns The other chart's rest-relative angles, degrees.
   */
  export function alternateRigJointAngles(
    rig: IAutoMovieResolvedJointAngles,
    placement: AutoMovieJointTwistPlacement | undefined,
    handed: 1 | -1,
  ): IAutoMovieResolvedJointAngles {
    return alternateRigJointAnglesImplementation(rig, placement, handed);
  }

  /**
   * The swivels a joint's three-angle box provably refuses: for a joint whose
   * bone-local rotation is a fixed rotation turned about a fixed axis by the
   * swivel (the chain root of `hingedArmSwivel.pose`), a test of whether every
   * swivel from `low` to `high` degrees reads past the joint's box in both of
   * the charts `decomposeJointRotationOnBasis` chooses between, so that
   * `jointRomOvershoot` scores each of them above zero.
   *
   * A rotation turned about a fixed axis by `ψ` has a matrix whose every entry
   * is `a + b cos ψ + c sin ψ` (Rodrigues' formula between two fixed
   * rotations), so every entry the decomposition reads is such a sinusoid,
   * fitted exactly from the rotation at 0, 90 and 180 degrees. Each clinical
   * bound is then a sinusoid's sign, in either chart the decomposition reads
   * (`swivelJointReadings.bounds`). Where one such sinusoid exceeds `MARGIN`,
   * its exact roots bound an arc of swivels (`φ ± acos((MARGIN - a) / R)`), and
   * a reading is refused on the union of its axes' arcs. An abduction ceiling
   * that rises with flexion (`abductionRange`) couples two axes, so its
   * abduction is refused only past the highest ceiling the coupling reaches,
   * which bounds it at every flexion (`swivelJointReadings.interval`). A swing
   * cone (`swingDeg`) couples flexion and abduction too, so no arc of one
   * sinusoid bounds it: each one-degree piece of the turn the axes leave is
   * refused in a chart where the cone's closed-form bound over the piece
   * certainly exceeds it by `MARGIN` (`swivelJointReadings.coneExceeded`). The
   * arcs are `boxRefusedArcs`'s.
   *
   * Every refusal is certain. A sinusoid above `MARGIN` puts its angle past the
   * bound by more than `MARGIN` radians, the joints' tolerance
   * (`ROM_TOLERANCE`, about 1.7e-4), far beyond the rounding of the fit, of the
   * arc's ends and of the decomposition itself (near 1e-15); and an outer
   * angle's vector is then longer than `MARGIN`, past the gimbal band
   * (`sqrt(ε)`, 1.5e-8) inside which the decomposition pins that angle instead.
   * A joint gated by swing and twist, which the box does not score, is read by
   * its range instead (`swingTwistExcludedSwivels`) when the frame the
   * overshoot reads it in is given, and refuses nothing otherwise; an axis
   * without an interval, an outer interval wider than a half turn (whose
   * refusal is an intersection, not a union, of two arcs) and a middle interval
   * met twice by the half turn the middle angle covers refuse nothing, so the
   * test only ever says less than the box would.
   *
   * @param props The joint and its rotation by swivel.
   * @returns Whether every swivel in `[low, high]`, degrees, is refused; a
   *   joint with nothing to refuse refuses no swivel.
   */
  export function boxExcludedSwivels(
    props: IAutoMovieBoxExcludedSwivels.IProps,
  ): (low: number, high: number) => boolean {
    return boxExcludedSwivelsImplementation(props);
  }

  /**
   * The swivels at which each limit of a joint's three-angle box is least
   * violated, for a joint whose bone-local rotation is a fixed rotation turned
   * about a fixed axis by the swivel (the chain root of
   * `hingedArmSwivel.pose`).
   *
   * Each clinical bound, in either chart the decomposition reads, is the sign
   * of a sinusoid of the swivel (`swivelJointReadings.bounds`; Tolani, Goswami
   * and Badler 2000, section 3.2.3: a joint limit maps to a sinusoid of the
   * swivel angle), positive past the bound and growing with the angle's
   * distance past it. Where no swivel is legal, every limit some swivel
   * violates is least violated at its sinusoid's least value, in closed form
   * (`swivelArcs.least`), so these swivels are where a search for the least
   * overshoot starts. They are candidates, not the answer: an outer angle's
   * sinusoid is its vector's length times the sine of its excess, and two
   * limits violated together are least where their sum is, which the caller's
   * own score decides. A bound that no swivel violates, or a constant one,
   * gives no swivel. An abduction ceiling that rises with flexion is read at
   * the highest ceiling the coupling reaches (`swivelJointReadings.interval`),
   * and a swing cone at the swivel where the joint's twist axis turns least
   * from rest, the greatest `cos f · cos a` (`swivelJointReadings.cone`).
   *
   * @param props The joint and its rotation by swivel; `joint` is not read.
   * @returns The swivels, degrees: the cone's and at most one a bound in each
   *   chart; null for an unconstrained joint or one gated by swing and twist,
   *   whose range the box does not read.
   */
  export function boxLeastSwivels(
    props: IAutoMovieBoxExcludedSwivels.IProps,
  ): number[] | null {
    return boxLeastSwivelsImplementation(props);
  }

  /**
   * The squared distance of one joint's clinical angles from the anatomical
   * neutral, `flexion² + abduction² + twist²`, in square degrees.
   *
   * All-zero clinical angles are the standing pose the ROM table is written
   * about, so a smaller value is less articulation. {@link reachPose} sums it
   * over the shoulder and elbow as the least-effort tie-break among arm poses
   * whose ROM overshoot is equal. The value is only meaningful for clinical
   * angles; rest-relative angles have a different origin.
   *
   * @param joint Resolved clinical angles in degrees.
   */
  export function clinicalDeviation(
    joint: IAutoMovieResolvedJointAngles,
  ): number {
    return clinicalDeviationImplementation(joint);
  }

  /**
   * One prioritized descent of a digit's fit: a primary residual (where the
   * point goes) met first, and a secondary one (how it is turned, how its
   * joints couple) bettered only in what the primary leaves free, inside the
   * range the projection keeps.
   *
   * Each step is the damped least-squares step of the primary task, h1 =
   * -(J1'J1
   *
   * - Mu I)^-1 J1'r1, plus the secondary task's damped step taken in the
   *   regularized null complement, N = I - (J1'J1 + mu I)^-1 J1'J1. This damped
   *   complement is not an exact null projector; actual primary admission below
   *   keeps the task priority. The direction follows the task-priority inverse
   *   kinematics of Nakamura, Hanafusa and Yoshikawa 1987 ("Task-priority based
   *   redundancy control of robot manipulators", IJRR 6(2):3-15) in the damped
   *   form of Chiaverini 1997 ("Singularity-robust task-priority redundancy
   *   resolution", IEEE TRA 13(3):398-410). A variable standing on a bound its
   *   descent pushes against (the projection undoes a resolution's move along
   *   the negative gradient) is held for the step, the active set of a
   *   projected Newton method (Bertsekas 1982); the gradient is the primary's
   *   while the primary is unmet, so the secondary never holds a joint the
   *   primary needs.
   *
   * A trial is accepted lexicographically: while the primary is unmet, only
   * when it lowers the primary; once met (within the effector's motion for one
   * resolution step of every joint, `tolerance`), when it keeps the primary met
   * and lowers the secondary. The damping follows Levenberg-Marquardt with
   * Nielsen's update at its bounds (Madsen, Nielsen and Tingleff 2004,
   * Algorithm 3.16, tau = 1e-3): a third on an accepted step, a doubling growth
   * on a rejected one, so the steps shrink until the descent stops, when the
   * step it would take moves no variable by more than `step`. Once the primary
   * is met, a rejected secondary step is first backtracked by halves under the
   * same projected acceptance, down to that original resolution. This admits a
   * feasible shorter step despite the damped complement's primary leakage.
   * Finite differences keep two task probes per variable; a separable clipped
   * coordinate uses its actual feasible span instead of dividing by 2*step,
   * which would halve a derivative at a range end. Interior and coupled
   * projections retain their existing central denominator. Residual, projection
   * and tolerance callbacks are pure functions of their supplied values
   * throughout this synchronous descent, as the finite-difference and damping
   * law require. Rejected damping trials keep the accepted point, Jacobians and
   * active set unchanged; only acceptance rebuilds linearization. A satisfied
   * primary with zero squared secondary cannot admit any strictly improving
   * trial and returns immediately. With no variables, the projected point and
   * empty-column primary Jacobian are the only possible result.
   *
   * @param props The start, the residuals, the projection, the resolution and
   *   the primary's tolerance.
   * @returns The variables where the descent stops, projected.
   */
  export function fitDigitDescent(
    props: IAutoMovieFitDigitDescent.IProps,
  ): number[] {
    return fitDigitDescentImplementation(props);
  }

  /**
   * Put a point of a digit (its tip or its pad, a frame on its distal phalanx)
   * on a world point, with the digit's own joints alone, inside their range of
   * motion: the inverse kinematics of one finger or the thumb with the hand
   * where the pose has placed it.
   *
   * Every free axis of every joint of the digit (an axis its constraint does
   * not hold immobile) is a variable, in clinical degrees. The fit has two
   * tasks in priority order. The first puts the effector on the target: its
   * residual is the distance between them. The second, bettered only in what
   * the first leaves free, turns the effector's normal onto the target normal
   * when one is given (the misalignment scaled by the effector's distance from
   * its joint, an arc length, so a degree of tilt counts as the millimetres it
   * swings the phalanx) and keeps a finger's interphalangeal coupling, the
   * distal joint following the middle one at the ratio `coupling` (the coupling
   * of hand animation, DIP = 2/3 PIP, Rijpkema and Girard 1991, SIGGRAPH
   * 25(4):339-348, as relayed by the hand-animation literature; provisional
   * until read at the source), its residual likewise that distance times the
   * angle by which the distal joint misses the ratio. The point goal,
   * optionally eased by soft IK as described below, is never traded against a
   * normal or a coupling it does not allow.
   *
   * Each descent is `fitDigitDescent`: damped task-priority least squares
   * (Nakamura, Hanafusa and Yoshikawa 1987; Chiaverini 1997) with the active
   * set of a projected Newton method (Bertsekas 1982) for the joints on a
   * bound, and Levenberg-Marquardt damping (Madsen, Nielsen and Tingleff 2004).
   * The Jacobians are read by central differences on the engine's own forward
   * kinematics, so the angles mean what `resolvePose` displays, and every trial
   * is projected into the range (`clampJointToSkeleton`) before it is measured.
   * The point counts as reached within the effector's motion for one resolution
   * step of every joint, and a descent stops when its step moves no joint by
   * more than `ROM_TOLERANCE`, the resolution to which the engine resolves a
   * joint's angle. The fit is a continuation: it descends from the pose's own
   * angles for the digit, so a caller that seeds each fit from the one before
   * follows a moving target in one basin, its joints moving continuously. Only
   * when that fit cannot reach the target (the tip farther from it than one
   * joint resolution of every joint would move it) does it restart from the
   * middle of every range, where a digit folded the wrong way round its target
   * is not trapped, keeping the restart only if it comes nearer; it never takes
   * the better of two starts for a target the continued fit reaches, an argmin
   * that would switch basins between neighbouring targets. A caller's `rate`
   * softens the target near full extension, where the exact inverse has an
   * unbounded derivative: an exponential soft IK. Below the soft band the
   * target is unchanged; within it, some reach is traded for a bounded radial
   * extension rate. The band's width comes from the chain's lengths and the
   * requested rate, not the seed's posture. This controls the full-extension
   * singularity, not every possible change of basin of a constrained digit. The
   * result is deterministic for its input: fixed starts, a fixed order of
   * variables and no random draw. A target outside the digit's workspace is
   * fitted as nearly as this constrained local solve reaches it. With `rate` it
   * fits the eased target instead, so its constrained minimum may differ from
   * the original target's. In either case `residual` reports distance to the
   * original target, including any reach traded away, so a caller refuses or
   * accepts by its own bound.
   *
   * @param input The rig, the posed body, the digit's joints and the effector
   *   and target.
   * @returns The digit's fitted joints, the effector's world point and the
   *   residual.
   * @throws {Error} When the digit names no joint, a bone cannot be resolved,
   *   or `rate` is not finite and positive.
   */
  export function fitDigitToTarget(
    input: IAutoMovieFitDigitToTarget.IInput,
  ): IAutoMovieFitDigitToTarget.IResult {
    return fitDigitToTargetImplementation(input);
  }

  /**
   * The feasible swivels of a chain's root joint: the intervals of the swivel
   * its limits leave, for a root whose bone-local rotation is a fixed rotation
   * turned about a fixed axis by the swivel (Tolani, Goswami and Badler 2000,
   * section 3.2.3: each joint limit maps to intervals of the swivel angle, and
   * the feasible swivels are their intersection).
   *
   * They are the complement of the arcs the root's range provably refuses: a
   * box's in either chart `decomposeJointRotationOnBasis` chooses between, so a
   * swivel either chart admits is feasible (`boxRefusedArcs`), and a
   * swing-twist gate's (`swingTwistRefusedArcs`). Every refusal is certain, so
   * every legal swivel lies in a feasible interval; a feasible interval may
   * still hold swivels the full score refuses, where a limit's analysis says
   * less than the range (a swing region's radius below its greatest, a box axis
   * without an interval). The intervals are closed form but for a swing cone,
   * read per one-degree piece (`boxRefusedArcs`).
   *
   * @param props The root joint and its rotation by swivel.
   * @returns The disjoint feasible arcs, degrees, each starting in [0, 360);
   *   every swivel when nothing is refused; none when every swivel is.
   */
  export function hingedSwivelFeasible(
    props: IAutoMovieBoxExcludedSwivels.IProps,
  ): IAutoMovieSwivelArcs.IArc[] | "all" {
    return hingedSwivelFeasibleImplementation(props);
  }

  /**
   * Prepare generic rigid FK without a species or humanoid-bone branch.
   *
   * @param rig A connected rigid tree with explicit axes and declared degree
   *   boxes.
   * @returns An independent prepared reader; later mutation of rig data cannot
   *   rewrite it.
   * @throws {Error} For malformed graph, transform, basis or limits, or when a
   *   read names an absent bone or violates a declared box.
   * @throws {RangeError} When a composed world position is nonfinite or its
   *   quaternion is nonfinite or zero, even if all source transforms were
   *   finite.
   */
  export function prepareArticulatedRig<Bone extends string>(
    rig: IAutoMovieArticulatedRig<Bone>,
  ): IAutoMovieArticulatedRigReader<Bone> {
    return prepareArticulatedRigImplementation<Bone>(rig);
  }

  /**
   * Validate a joint-axis basis and return it with unit-length axes, ready for
   * quaternion composition and decomposition.
   *
   * The axes must pass {@link validateJointAxesBasis}: non-zero and mutually
   * orthogonal, with a supported rotation order and compatible twist placement.
   * Otherwise the first issue is thrown as `<path> <expected>`, such as
   * `jointToQuaternion axes.twist must have non-zero length`. The result has
   * unit axes and any declared placement and rotation order; a rig prepares it
   * once and passes the basis to its per-pose readers.
   *
   * @param axes Basis to check; read, never modified.
   * @param path Diagnostic path prefix naming the caller's input.
   */
  export function normalizeJointAxes(
    axes: IAutoMovieJointAxes,
    path: string,
  ): IAutoMovieJointAxes {
    return normalizeJointAxesImplementation(axes, path);
  }

  /**
   * The arm pose, upper arm and forearm articulation, that brings the `side`
   * hand onto `target` in the skeleton's model space: the harness `reach` verb
   * made concrete with analytic hinge geometry and the original bounded swivel
   * search for its clinical range of motion.
   *
   * Segment offsets and the shoulder's rest frame come from the skeleton's rest
   * pose, and {@link hingedArmArticulation} solves the chain: the elbow turns
   * only about its own flexion axis, so its abduction and twist are zero as an
   * elbow's immobile axes require, and the shoulder spends the chain's exact
   * swivel freedom on staying inside the rig's declared range of motion. An
   * unreachable target extends the arm fully toward it, so the hand stops on
   * the reachable shell instead of failing. A target no legal pose reaches
   * still returns the least-overshoot pose, which the shot's ROM gate then
   * reports.
   *
   * The angles are clinical, so `validatePose` can compare them with the ROM
   * table directly. The clinical axes and the rest frame are two halves of one
   * convention: this function applies {@link HUMANOID_JOINT_AXES} under any axes
   * the arm bones declare ({@link skeletonJointAxes}) and so defaults
   * `restFrames` to the matching {@link HUMANOID_REST_FRAME}. Pass a table for a
   * rig with its own rest convention, or `{}` for raw rest-relative angles.
   *
   * Returns `null` when `side` is not `"left"` or `"right"` (the value arrives
   * from runtime calls), when the upper arm, lower arm or hand is missing, when
   * they are not one parent chain (lower arm under upper arm, hand under lower
   * arm), when the chain is not reachable from a root, when the chain is
   * geometrically degenerate, or when {@link armChainFault} finds an elbow that
   * cannot bend the arm.
   *
   * @param skeleton Rig whose arm is solved; read, never modified.
   * @param side Which arm reaches.
   * @param target Point the hand lands on, in the skeleton's model space.
   * @param restFrames Per-bone rest frames for the clinical lift; defaults to
   *   `HUMANOID_REST_FRAME`.
   */
  export function reachPose(
    skeleton: IAutoMovieSkeleton,
    side: "left" | "right",
    target: IAutoMovieVector3,
    restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>,
  ): IAutoMoviePose | null {
    return reachPoseImplementation(skeleton, side, target, restFrames);
  }

  /**
   * What an impulse does to a standing body's balance (#3429): it absorbs it
   * within its base, catches it with capture steps, or falls.
   *
   * The impulse `J` changes the centre of mass's velocity to `v + J / m` and
   * its angular momentum about the centre by `(p - c) × J`. The body is a
   * linear inverted pendulum of length `l` with eigenfrequency `ω0 = sqrt(g /
   * l)`, whose extrapolated centre `ξ = x + v / ω0` must lie within the base of
   * support for the body to stay (Hof, Gazendam and Sinke 2005, J Biomech
   * 38:1-8): inside the support polygon, the body absorbs the push.
   *
   * Outside it, the body steps, the capture point `ξ` diverging from the centre
   * of pressure as the pendulum does, `d(t) = d0 exp(ω0 t)` (the capture point
   * of Pratt, Carff, Drakunov and Goswami 2006, as the stepping literature
   * states it): until the first foot lands, `first` after the impulse, the
   * centre of pressure is held at the base's edge along the lead, so `d0` is
   * the capture point's distance beyond that edge. A foot lands at most `reach`
   * (a leg length, as `stagger` reaches) beyond the last centre of pressure and
   * catches the capture point within its half length, `margin`; one that falls
   * short moves the centre of pressure to its front edge, `reach + margin` on,
   * and leaves the rest to diverge over the next swing, `step`: `d_{k+1} = (d_k
   * - reach - margin) exp(ω0 step)`. The recurrence shrinks to a catch exactly
   * when the first landing's distance is below its fixed point `d* = (reach +
   * margin) a / (a - 1)`, `a = exp(ω0 step)`, the infinite-step capture
   * distance in the framework of Koolen, de Boer, Rebula, Goswami and Pratt
   * 2012 ("Capturability-based analysis and control of legged locomotion, Part
   * 1", Int J Robot Res 31(9)); at or past it no number of steps catches the
   * body and it falls. Both papers are located, not yet read at the source; the
   * recurrence is derived here from the linear inverted pendulum's divergence.
   * The steps are laid along the lead from the base's edge.
   *
   * The bounds are the impulse magnitudes along the push's horizontal direction
   * at which the outcome changes: `m ω0 b` to leave the base, with `b` the
   * distance from the current extrapolated centre to the base's edge along the
   * push, and `m ω0 (e + d* exp(-ω0 first) - lead)` to leave the capture
   * region, with `e` the centre's distance to the base's edge along the push
   * and `lead` the current extrapolated centre's distance from the centre.
   *
   * - @param props The body's state, the impulse and the support.
   *
   * @returns The outcome, the steps and the bounds.
   * @throws {Error} When the mass, the length, the reach or the step time is
   *   not positive, the margin is not finite, or there is no support point.
   */
  export function resolveAutoMovieBalanceOutcome(
    props: IAutoMovieResolveBalanceOutcome.IProps,
  ): IAutoMovieResolveBalanceOutcome.IOutcome {
    return resolveAutoMovieBalanceOutcomeImplementation(props);
  }

  /**
   * Instantaneous centroidal momentum from actual bone-origin rates.
   *
   * The model, posed parts, bones and rates must describe the same instant and
   * the same unchanged mass model, in one common frame. Bone linear rates are
   * metres per second and angular rates radians per second in that frame. Parts
   * and their centre come from the existing mass-model pose owner; principal
   * axes retain that owner's actual principal-to-common rotation. A part's
   * centre moves at `v_bone + omega_bone cross (c_part - p_bone)`. The result
   * has the existing momentum shape, with centre and rates at this instant
   * rather than at the middle of a finite interval.
   *
   * Every part remains present, including zero-mass parts whose intrinsic
   * inertia can still contribute spin under the existing mass-model contract.
   * The whole body needs finite positive mass. Inputs are borrowed for this
   * synchronous reduction, and every returned vector is fresh. This function
   * does not replace the two-pose momentum API or certify callback
   * derivatives.
   *
   * @param model The same ordered SI mass model that produced posed.
   * @param posed Its rigid parts and mass-weighted centre at this instant.
   * @param bones The actual common-frame bone poses used to produce posed.
   * @param rates Actual common-frame origin and angular derivatives of bones.
   * @returns Instantaneous centre, centre velocity and linear/angular momentum.
   * @throws {Error} When mass, rates or results are nonfinite, total mass is
   *   not positive, part count/masses do not match, or a segment's bone/rate is
   *   missing.
   */
  export function resolveAutoMovieMomentumRates(
    model: IAutoMovieResolveCenterOfMass.IModel,
    posed: resolveAutoMovieMomentumImplementation.IPosed,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    rates: ReadonlyMap<
      AutoMovieHumanoidBone,
      AutoMovieEngineKinematicsTypes.IAutoMovieEngineKinematicsBoneRate
    >,
  ): IAutoMovieBodyMomentum {
    return resolveAutoMovieMomentumRatesImplementation(
      model,
      posed,
      bones,
      rates,
    );
  }

  /**
   * The rigid ring modules of a humanoid body, each a short stack of
   * eight-sided sections around one joint's segment, from the rest skeleton
   * alone: joint positions, tips and girth radii.
   *
   * This is the one statement of the body's simple solid form. The polygon
   * drawing lofts a mesh through each module's rings and the physical profile
   * takes the convex hull of the same ring points as that segment's collider,
   * so what is seen and what collides cannot drift apart.
   *
   * The skeleton is in the Human frame at rest: +X forward, +Y up, +Z left,
   * metres. The trunk's modules share their boundary rings (pelvis floor, hip,
   * waist, chest, shoulder, neck base), widened to the hip and shoulder joint
   * spans; the neck runs from the neck joint to the head joint; the head widens
   * to its girth and closes on a pole at its tip; a palm runs from the wrist
   * toward the mean of the four finger roots as far as the farthest of them, so
   * no knuckle is bare beyond it; a foot is two modules through the subtalar
   * and midfoot joints to the toe roots; every other segment is three round
   * rings from its joint to its end, narrowing to the next segment or bevelled
   * at a leaf. Shoulder, scapula, foot, eye, jaw and atlas joints drive others
   * and carry no module.
   *
   * @param bones The rest joints, parent before child, in the Human frame.
   * @returns The modules in drawing order: hips, spine, head, chest, neck, each
   *   side's hand and two foot modules, then every remaining segment in joint
   *   order.
   * @throws {Error} When a joint a module is built from is missing.
   */
  export function resolveAutoMovieHumanoidRingModules(
    bones: readonly IAutoMovieResolveHumanoidRingModules.IBone[],
  ): IAutoMovieResolveHumanoidRingModules.IModule[] {
    return resolveAutoMovieHumanoidRingModulesImplementation(bones);
  }

  /**
   * The tip and the pad of every digit of both hands, as bone-local frames on
   * each digit's distal phalanx.
   *
   * A digit's tip is where a ray from its last joint, along its distal phalanx
   * (the line from the joint before it), leaves the phalanx's colliders, with
   * the exited collider's outward normal: the index fingertip as
   * `resolveAutoMovieHumanoidSurfaces` has always placed it, now for every
   * digit. Its pad is the palmar face of the same phalanx: where a ray from the
   * middle of the phalanx, between the last joint and the tip, leaves the
   * colliders toward the palm's side. The palm faces -Y in the canonical rest
   * (`HUMANOID_REST_FRAME`), so the palmar direction is -Y made perpendicular
   * to the phalanx; the rig's thumb lies in the palm's plane with its nail up,
   * so its pad faces the same side. A profile with no segment for a phalanx
   * reads the hand's colliders instead, as the index tip did.
   *
   * Both sides are resolved; the caller replaces each left frame with its right
   * twin's mirror image, as it does for every region.
   *
   * @param rays The rest-pose readers of the body
   *   (`AutoMovieHumanoidSurfaceRays.tools`).
   * @param profile The body's physical profile, segments keyed by rig bones.
   * @returns The tip and pad frames of every digit, keyed by region.
   * @throws {Error} When a digit bone is missing or a ray misses its colliders.
   */
  export function autoMovieHumanoidDigitSurfaces(
    rays: Pick<IAutoMovieHumanoidSurfaceReader, "at" | "local" | "surface">,
    profile: IAutoMoviePhysicalProfile,
  ): Partial<
    Record<AutoMovieHumanoidRegion, IAutoMovieHumanoidSurfaces.IFrame>
  > {
    return AutoMovieHumanoidDigitSurfacesImplementation(rays, profile);
  }

  /**
   * The extent of every region of a body: the radius of the disc about the
   * region's point that is still that region, read from the body's own rest
   * pose. A named region of the skin reaches until the next one begins, so its
   * disc reaches half way to the nearest other region that faces the same way
   * (two discs overlap on the surface only where they face it from one side, so
   * a palm and the back of the same hand, a chest and an upper back, are never
   * each other's bound), and no farther than half its segment's least breadth,
   * so the disc stays on the face of the segment it lies on (a forearm's disc
   * does not wrap round to the arm's other side). No region is smaller than the
   * 10 mm a pressed skin gives, the contact tolerance a hand on it is read
   * against.
   */
  export function autoMovieHumanoidSurfaceExtents(
    regions: Readonly<
      Record<AutoMovieHumanoidRegion, IAutoMovieHumanoidSurfaces.IFrame>
    >,
    at: (bone: AutoMovieHumanoidBone) => IAutoMovieResolvedBone,
    bounds: IAutoMovieHumanoidSurfaceExtents.ReadBounds,
  ): Record<AutoMovieHumanoidRegion, number> {
    return AutoMovieHumanoidSurfaceExtentsImplementation(regions, at, bounds);
  }

  /**
   * The per-bone clinical axes a skeleton articulates with: each bone's own
   * declared {@link IAutoMovieBone.axes}, then the host's `jointAxes` table.
   *
   * A bone that declares axes describes its own rest frame, so its declaration
   * wins over a table the host chose for a whole family of rigs, such as
   * `HUMANOID_JOINT_AXES`; every other bone keeps the table's entry, and a bone
   * in neither falls through to `DEFAULT_JOINT_AXES` where the caller reads it.
   * Every engine entry that receives both a skeleton and a table, forward or
   * inverse, reads its table through this or applies the same precedence per
   * bone, so pose resolution, baking and the solvers agree on one rig.
   *
   * Returns `jointAxes` itself when no bone declares axes, and a shared frozen
   * empty table when it is also omitted, so the common case allocates nothing;
   * otherwise a new table that the caller owns. The declared axes are not
   * validated here: `validateModel` admits them, and `normalizeJointAxes`
   * throws on a malformed basis where it is used.
   *
   * @param skeleton Rig whose bones may declare axes.
   * @param jointAxes Host table for the bones that declare none.
   */
  export function skeletonJointAxes(
    skeleton: IAutoMovieSkeleton,
    jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
  ): Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> {
    return skeletonJointAxesImplementation(skeleton, jointAxes);
  }

  /**
   * The closed-form angles of a two-segment chain whose tip reaches a goal at
   * straight-line `distance` from its root, by the law of cosines.
   *
   * `bend` is the interior angle at the mid joint, 180 straight and smaller as
   * the chain folds; `lift` is the angle between the upper segment and the
   * root-to-goal line. The caller orients the chain toward the goal and turns
   * the mid joint and the root by these angles. A distance below `|upper −
   * lower|` or above `upper + lower` is clamped to that bound and `clamped` is
   * set, so the chain fully folds or extends instead of producing `NaN`. When
   * both segments are equal and the goal is at the root, `lift` is 0.
   *
   * Lengths and distance share one unit. Throws when a length is not finite and
   * positive, the distance is not finite and non-negative, or relative side
   * products cannot be represented after common rescaling. Extreme common units
   * are rescaled before squaring; ordinary lengths retain their arithmetic
   * order.
   *
   * @param upper Root-to-mid segment length, positive.
   * @param lower Mid-to-tip segment length, positive.
   * @param distance Root-to-goal distance, non-negative.
   */
  export function solveTwoBoneIK(
    upper: number,
    lower: number,
    distance: number,
  ): IAutoMovieTwoBoneIK {
    return solveTwoBoneIKImplementation(upper, lower, distance);
  }

  /**
   * Every reason a joint-axis basis cannot serve the clinical angle
   * conversions, as located issues; an empty list means the basis is usable.
   *
   * Each axis must have finite components and a length above `1e-9`; it need
   * not be unit length, because {@link normalizeJointAxes} normalizes after this
   * check. When all three axes have a direction, each pair must be orthogonal
   * within an absolute cosine of `1e-6`, so the clinical angles form a real
   * basis instead of silently skewing forward or inverse kinematics. A declared
   * `twistPlacement` must be `"proximal"` or `"distal"`. The only explicit
   * `rotationOrder` is `"flexion-abduction-twist"`, which permits omitted or
   * distal twist placement. Issues are listed in that order, each with a path
   * under `path` such as `<path>.twist.y`.
   *
   * @param axes Basis to check; read, never modified.
   * @param path Diagnostic path prefix naming the caller's input.
   */
  export function validateJointAxesBasis(
    axes: IAutoMovieJointAxes,
    path: string,
  ): IAutoMovieJointAxesIssue[] {
    return validateJointAxesBasisImplementation(axes, path);
  }

  /**
   * Turn a body's balance at one instant into inspection marks: the centre of
   * mass, or the extrapolated centre the caller balances on, as a point, and
   * the base of support as the polygon around the support points on the floor
   * plane.
   *
   * The base of support is the convex hull of the support points in the
   * horizontal XZ plane, as `resolveAutoMovieCenterOfMassImplementation.margin`
   * measures balance on it, drawn as a closed polyline through the hull's
   * points at their own heights; one support point is drawn as a point and two
   * as a segment. The centre is flagged when its margin of stability on that
   * base is negative, that is when it lies outside the base.
   *
   * | Kind      | Label             | Colour          | Path             |
   * | --------- | ----------------- | --------------- | ---------------- |
   * | `com`     | `centre of mass`  | Olive `6b8e23`  | `<path>/com`     |
   * | `support` | `base of support` | Sienna `a0522d` | `<path>/support` |
   *
   * Both are in world metres and unanchored. It throws when there is no support
   * point.
   *
   * @param props.path The body's path, which the marks extend.
   * @param props.centre The centre the caller balances on, world metres: the
   *   centre of mass of `resolveAutoMovieCenterOfMassImplementation.place`, or
   *   its extrapolation by
   *   `resolveAutoMovieCenterOfMassImplementation.extrapolate` (Hof 2005).
   * @param props.support The support contact points, world metres.
   * @returns The centre's mark, then the base's.
   */
  export function markAutoMovieBalance(
    props: IAutoMovieMarkBalance.IProps,
  ): IAutoMovieMark[] {
    return markAutoMovieBalanceImplementation(props);
  }

  /**
   * Turn joints' range-of-motion overshoot at one instant into flagged
   * inspection marks at the joints that exceed their range.
   *
   * Each entry is a joint's path, its world position in metres and its
   * overshoot in degrees, as `jointRomOvershoot` measures it. A joint with a
   * positive overshoot, or an unmeasurable one (`Infinity`), becomes one
   * flagged point of kind `rom`, label `range overshoot`, colour olive drab
   * `556b2f`, at path `<path>/rom`; a joint within its range draws nothing. The
   * mark is in world metres and unanchored.
   *
   * It throws for a position that is not finite or an overshoot that is
   * negative or NaN.
   *
   * @param entries Joints with their world positions and measured overshoots.
   * @returns One flagged mark per joint past its range, in the entries' order.
   */
  export function markAutoMovieRomOvershoot(
    entries: IAutoMovieMarkRomOvershoot.IEntries,
  ): IAutoMovieMark[] {
    return markAutoMovieRomOvershootImplementation(entries);
  }

  /**
   * The swivels at which the end joint of a chain whose mid segment twists
   * distally (a wrist beyond a forearm) cannot take a requested rotation inside
   * its range, as arcs in closed form.
   *
   * The end joint's two free angles are read off where the mid segment points
   * in the requested rotation's frame (`distalEndSwivelReadings` states the
   * derivation): the abduction by its sine `-d_flexion`, the flexion by the
   * vector `(d_abduction, d_twist)`, every component a sinusoid of the swivel.
   * Each bound of the joint's box therefore refuses the arc where its sinusoid
   * exceeds the margin (`swivelArcs`), as `boxExcludedSwivels` reads a root
   * joint's box.
   *
   * The arcs say nothing of the mid segment's own twist range: the twist the
   * request leaves it is not a sinusoid of the swivel, though where it meets an
   * end of its range is (`distalTwistSwivelRange`), and the swivel chosen is
   * the caller's to verify.
   *
   * @param props The end joint, the mid segment's direction by swivel and the
   *   margin.
   * @returns The refused arcs merged over a turn, every swivel, or null when
   *   the analysis does not apply (`distalEndSwivelReadings.of`).
   */
  export function distalEndSwivelArcs(
    props: distalEndSwivelReadings.IProps & {
      /**
       * How far past a bound, in sine or projected units, a reading must lie to
       * be refused; negative keeps the result strictly inside.
       */
      margin: number;
    },
  ): IAutoMovieSwivelArcs.IArc[] | "all" | null {
    return distalEndSwivelArcsImplementation(props);
  }

  /**
   * A certified lower bound, over an interval of swivels, of how far the end
   * joint of a chain whose mid segment twists distally (a wrist beyond a
   * forearm) must miss a requested rotation, degrees.
   *
   * Whatever twist the mid segment takes and wherever in its box the end joint
   * stands, the rotation the chain shows carries the mid segment's world axis
   * `u` to `d(f, a) = (-sin a, cos a sin f, cos a cos f)` in the end joint's
   * basis, with `(f, a)` inside the box (`distalEndSwivelReadings`), while the
   * requested rotation carries it to `x(s)`, the direction the readings give at
   * swivel `s`. A rotation by an angle moves no unit vector by more than that
   * angle, so the angle between the shown and the requested rotation is at
   * least the angle from `x(s)` to the nearest `d(f, a)` of the box: the
   * spherical distance from a point to a rectangle of latitudes (abduction) and
   * longitudes (flexion) about the flexion axis. Inside the rectangle's
   * longitudes that distance is the abduction's excess past its interval;
   * outside them the nearest point lies on one of the two bounding meridians,
   * where the direction's cosine with the meridian point of abduction `a` is
   * `-x_f sin a + c cos a`, `c = x_a sin e + x_t cos e`, greatest at the
   * abduction nearest `atan2(-x_f, c)`.
   *
   * `x(s)` circles an axis as the swivel turns, on a circle whose radius is the
   * norm of its sinusoids' cosine (or sine) coefficients, so it moves by at
   * most that radius per unit of swivel and the distance, which changes by no
   * more than its point moves, is bounded over an interval by its value at the
   * middle less the radius times the half width.
   *
   * The bound is lowered by the joints' tolerance (`ROM_TOLERANCE`), within
   * which a projection onto the box may stand past its ends, so it stays below
   * every miss it bounds.
   *
   * @param props The end joint and the mid segment's direction by swivel.
   * @returns The bound over `low` to `high` degrees, never negative; null when
   *   the analysis does not apply (`distalEndSwivelReadings.of`).
   */
  export function distalEndSwivelMiss(
    props: distalEndSwivelReadings.IProps,
  ): ((low: number, high: number) => number) | null {
    return distalEndSwivelMissImplementation(props);
  }

  /**
   * The swivel nearest a desired one at which a chain whose mid segment twists
   * distally (an arm) can take a requested end rotation: outside the arcs its
   * end joint's box refuses (`distalEndSwivelArcs`) and where the twist the
   * rotation leaves the mid segment lies inside its range
   * (`distalTwistSwivelRange`).
   *
   * The admissible swivels are a union of intervals whose ends are the refused
   * arcs' ends and the twist range's breakpoints, so the admissible swivel
   * nearest the desired one is the desired one itself or one of those ends:
   * each is tested, a breakpoint a step of `APART` either side of itself since
   * the admission changes there, and the nearest admitted is returned (the
   * admissible swivel nearest the desired one, Tolani, Goswami and Badler 2000,
   * section 3.2.4). When none is admitted (no swivel lets the joints take the
   * rotation exactly, or the twist analysis is not given) the result is the
   * swivel outside the refused arcs nearest the desired one, the candidate the
   * box alone gives. The caller verifies the returned swivel by its own score.
   *
   * @param arcs The swivels the end joint's box refuses, merged
   *   (`swivelArcs.union`), or every swivel.
   * @param range The twist range's breakpoints and admission; null when that
   *   analysis does not apply.
   * @param desired The desired swivel, degrees.
   * @returns The swivel, degrees in any turn; null when the box refuses every
   *   swivel.
   */
  export function distalEndSwivelNearest(
    arcs: readonly IAutoMovieSwivelArcs.IArc[] | "all",
    range: distalTwistSwivelRange.IRange | null,
    desired: number,
  ): number | null {
    return distalEndSwivelNearestImplementation(arcs, range, desired);
  }

  /**
   * The swivels at which a joint with one immobile axis can take the rotation
   * asked of it, in closed form.
   *
   * A joint whose range leaves one clinical axis immobile (an ankle's axial
   * twist) has two degrees of freedom, so of a requested three-degree rotation
   * the chain's swivel must supply the third: the joint takes the rotation
   * exactly only where the rotation demanded of it reads that axis at its
   * neutral. For a demanded rotation that is a fixed rotation turned about a
   * fixed axis by the swivel, the reading is a sinusoid's root
   * (`swivelJointReadings`): the middle angle `asin(s)` is neutral where `s -
   * sin n` vanishes, and an outer angle `atan2(y, x)` is neutral, in the
   * principal chart or the alternate one a half turn on, where `y cos n - x sin
   * n` vanishes. There are at most two such swivels (`swivelArcs.roots`),
   * Tolani, Goswami and Badler's analytic treatment of a joint limit as a
   * function of the swivel (2000, Graphical Models 62).
   *
   * The roots are candidates, not certificates: the joint's two free axes may
   * still lie outside their intervals there, and a reading inside the
   * decomposition's gimbal band is pinned instead, so the caller scores each
   * and keeps a candidate only when its own measure finds the rotation met.
   *
   * @param props The joint and the rotation demanded of it by swivel.
   * @returns The candidate swivels, degrees in [0, 360), none when the axis
   *   never reads neutral; null when the joint has no range, a swing-twist
   *   gate, or not exactly one immobile axis, so this analysis does not apply.
   */
  export function immobileAxisSwivels(props: {
    /** The joint's clinical basis, admitted and normalized (`normalizeJointAxes`). */
    basis: IAutoMovieJointAxes;

    /**
     * The rest frame lifting the joint's rest-relative angles to clinical ones;
     * omitted, they are clinical.
     */
    frame?: IAutoMovieRestFrame | undefined;

    /**
     * The joint's resolved range of motion; an axis with a `null` interval is
     * immobile at its clinical zero.
     */
    constraint: IAutoMovieJointConstraint | null;

    /**
     * The bone-local rotation demanded of the joint at a swivel, degrees: a fixed
     * rotation turned about a fixed axis by the swivel.
     */
    rotation: (swivel: number) => IAutoMovieQuaternion;
  }): number[] | null {
    return immobileAxisSwivelsImplementation(props);
  }

  /**
   * Why the analytic arm IK cannot articulate one arm chain of `skeleton`, or
   * `null` when it can.
   *
   * `HUMANOID_JOINT_AXES` puts the arm's flexion on local +Y because the
   * canonical humanoid rests in the VRM T-pose with its arms along local ±X. On
   * a rig whose forearm rests along that flexion axis, such as arms hanging
   * along −Y, elbow flexion only rolls the forearm about its own length: the
   * hand never moves, the chain has one reachable radius instead of a shell,
   * and no reach can be solved. This function reports that rig, naming the
   * lower arm and both directions in `reason`.
   *
   * The test reads the rig, not a pose name, because a retargeted quadruped's
   * front legs ride the arm chains and may legitimately rest along −Y. Callers
   * therefore ask it only where an arm verb is performed: the perform-shot gate
   * refuses the verb with this reason, and {@link reachPose} returns `null`.
   *
   * `null` also answers every case that is not this fault: a missing hand, a
   * hand not parented to the lower arm (its rest offset is then not in the
   * elbow's frame), a zero-length forearm, and an axis table with no or a
   * zero-length elbow flexion axis. {@link reachPose} reports the structural
   * cases itself as a chain it cannot measure.
   *
   * @param skeleton Rig whose arm chain is read; only rest offsets are used.
   * @param side Which arm to test.
   * @param jointAxes Per-bone clinical axes; defaults to `HUMANOID_JOINT_AXES`,
   *   the table every arm computation applies, under any axes the lower arm
   *   declares itself.
   */
  export function armChainFault(
    skeleton: IAutoMovieSkeleton,
    side: "left" | "right",
    jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
  ): IAutoMovieArmChainFault | null {
    return armChainFaultImplementation(skeleton, side, jointAxes);
  }

  /**
   * Recover a joint's flexion, abduction and twist, in degrees, from its
   * bone-local rotation: the inverse of {@link jointToQuaternion} for the same
   * `axes` and `frame`. IK solvers compute quaternions and lower them through
   * this into the angles a pose carries.
   *
   * Changing basis by `M = [flexion | abduction | twist]` turns a proximal
   * twist's `qTwist · qAbduction · qFlexion` into `Rz·Ry·Rx` and a distal
   * twist's `qAbduction · qFlexion · qTwist` into `Ry·Rx·Rz`. The explicit
   * clinical order `qFlexion · qAbduction · qTwist` uses `Rx·Ry·Rz`. The
   * inverse reads each matrix from dot products of the axes with the rotated
   * axes. At the gimbal (middle angle ±90°), only one combination of the outer
   * angles is determined. The inverse pins flexion for a legacy proximal twist,
   * abduction for a legacy distal twist, and twist for the explicit clinical
   * order to zero, preserving the observable combination. The pin holds within
   * a projected cosine of the square root of the unit roundoff, about 1.5e-8,
   * where the two outer angles are otherwise rounding noise and the pinned
   * angles rebuild the rotation within 1e-7 radian. A left-handed basis, such
   * as the default (`flexion × abduction = −twist`), is extracted against
   * `−twist` and the twist sign restored, so the round trip holds for any
   * orthonormal basis.
   *
   * `frame` lifts the rest-relative angles to clinical ones, `clinical = sign ·
   * r
   *
   * - Neutral`. A `domain`with a non-null constraint also considers the
   *   rotation's second Euler chart,`(f + 180, 180 − a, t + 180)`for proximal
   *   twist and flexion-abduction-twist, and`(180 − f, a + 180, t + 180)` for a
   *   distal one, and the full-turn alias of each angle nearest the
   *   constraint's range. The candidate with the least {@link jointRomOvershoot}
   *   wins, the principal chart on a tie. Every candidate is the same rotation,
   *   so a pose no chart can hold keeps its overshoot instead of being
   *   clamped.
   *
   * Throws on a non-finite quaternion component or an invalid axis basis (see
   * {@link normalizeJointAxes}). A non-unit quaternion is read as its rotation
   * matrix, which is only a rotation for a unit quaternion.
   *
   * @param q Bone-local articulation rotation; unit length expected.
   * @param axes Clinical axis basis; defaults to `DEFAULT_JOINT_AXES`.
   * @param frame Rest frame lifting rest-relative angles to clinical ones;
   *   omitted, the angles stay rest-relative.
   * @param domain Bone and resolved ROM that choose among equivalent charts;
   *   omitted or with a `null` constraint, the principal chart is returned.
   */
  export function decomposeJointRotation(
    q: IAutoMovieQuaternion,
    axes?: IAutoMovieJointAxes,
    frame?: IAutoMovieRestFrame,
    domain?: IAutoMovieJointRotationDomain,
  ): IAutoMovieResolvedJointAngles {
    return decomposeJointRotationImplementation(q, axes, frame, domain);
  }

  /**
   * Convert a joint's clinical flexion, abduction and twist, in degrees, into
   * one bone-local rotation quaternion.
   *
   * Flexion turns about `axes.flexion` (default local X, sagittal), abduction
   * about `axes.abduction` (default Z, frontal) and twist about `axes.twist`
   * (default Y, the bone's long axis). The composition follows
   * `axes.twistPlacement`. A proximal twist, the default, turns the swing axes
   * with it, as the head turns below its nodding joint:
   *
   *     q = qTwist · qAbduction · qFlexion
   *
   * A distal twist turns the moved segment about its own long axis before the
   * swing, as the forearm pronates beyond the elbow, so a pose without twist is
   * the same rotation in either placement:
   *
   *     q = qAbduction · qFlexion · qTwist
   *
   * A declared flexion-abduction-twist order takes precedence over twist
   * placement and uses the rig's clinical vectors in the ISB hip sequence
   * (https://www.isbweb.org/standards/hip.pdf, Hip Order of Rotation):
   *
   *     q = qFlexion · qAbduction · qTwist
   *
   * `axes` lets a rig whose bone frames are not aligned to the clinical planes
   * keep flexion sagittal, such as a T-pose arm that needs flexion about Y. A
   * `null` angle contributes no rotation. With a `frame`, each angle is read as
   * clinical and mapped to the rig's rest-relative angle, `r = (clinical −
   * neutral) / sign`, so one clinical convention serves both sides of a
   * mirrored rig. {@link decomposeJointRotation} is the inverse for the same
   * `axes` and `frame`.
   *
   * Throws on a non-finite angle, an invalid axis basis (see
   * {@link normalizeJointAxes}), or an invalid frame sign or neutral.
   *
   * @param joint Clinical angles in degrees; `null` axes are at rest.
   * @param axes Clinical axis basis; defaults to `DEFAULT_JOINT_AXES`.
   * @param frame Rest frame mapping clinical angles to rest-relative ones;
   *   omitted, the angles are already rest-relative.
   */
  export function jointToQuaternion(
    joint: Pick<IAutoMovieJointPose, AutoMovieClinicalAxis>,
    axes?: IAutoMovieJointAxes,
    frame?: IAutoMovieRestFrame,
  ): IAutoMovieQuaternion {
    return jointToQuaternionImplementation(joint, axes, frame);
  }

  /**
   * Index a skeleton's parent-child topology once, for forward-kinematics work
   * repeated over many poses of the same skeleton.
   *
   * `childrenByParent` lists each bone under its parent, in declaration order,
   * with null-parent roots under `SKELETON_ROOT_PARENT`. `reachableBones` holds
   * every bone whose parent chain ends at such a root: a bone whose parent is
   * undeclared, or whose chain is a cycle, is never entered from a root and is
   * absent. The index is a snapshot; it holds the skeleton's bone objects, so a
   * caller that later changes `skeleton.bones` must build a new one. Duplicate
   * bone names throw before traversal because one identity cannot own two
   * parent links or two rest transforms.
   *
   * @param skeleton Rig to index; read, never modified.
   */
  export function indexSkeletonTopology(
    skeleton: IAutoMovieSkeleton,
  ): IAutoMovieSkeletonTopology {
    return indexSkeletonTopologyImplementation(skeleton);
  }

  /**
   * Parent-child indexing for readers that perform their own root traversal.
   *
   * Group declared bones by parent. Reject duplicate names before traversal.
   */
  export function indexSkeletonTopologyChildren(
    skeleton: IAutoMovieSkeleton,
  ): IAutoMovieSkeletonTopology["childrenByParent"] {
    return indexSkeletonTopologyChildrenImplementation(skeleton);
  }

  /**
   * The bones a skeleton's forward-kinematics walk reaches: every bone whose
   * parent chain ends at a null-parent root.
   *
   * The set depends on parent links only, so it is exactly the set of bones
   * {@link resolvePose} returns for any pose. A bone can be declared in
   * `skeleton.bones` yet be detached, with an undeclared parent or a cyclic
   * chain, and then `resolvePose` omits it; a validator gates on this set
   * before reading a bone's resolved position so such a rig is reported instead
   * of crashing the lookup.
   *
   * @param skeleton Rig whose reachable bones are listed.
   * @param topology Index of the same, unchanged skeleton from
   *   {@link AutoMovieEngineKinematics.indexSkeletonTopology}; omitted, one is
   *   built for this call.
   * @returns A new set the caller may modify without affecting `topology`.
   */
  export function reachableBoneNames(
    skeleton: IAutoMovieSkeleton,
    topology?: IAutoMovieSkeletonTopology,
  ): Set<AutoMovieHumanoidBone> {
    return reachableBoneNamesImplementation(skeleton, topology);
  }

  /**
   * Two-bone arm IK whose mid joint bends only about its own flexion hinge,
   * with the chain root's free swivel spent on the rig's range of motion.
   *
   * The elbow rotates by `θ` about `hinge` alone, so its abduction and twist
   * decompose to zero, which is what an elbow's immobile axes require, and the
   * bend plane is the hinge's own plane. Splitting the far segment into the
   * part along the hinge and the part it swings gives the root-to-effector
   * span
   *
   *     |m(θ)|² = k + α·cos θ + β·sin θ
   *
   * So the span equals the target distance where `R·cos(θ − φ) = distance² −
   * k`, with `R = hypot(α, β)` and `φ = atan2(β, α)`: an arccos whose two roots
   * are the chain's two bend branches. A target outside the reachable span
   * takes the fully extended or fully folded root, so the effector stops on the
   * reachable shell along the line to the target. A root outside the mid
   * joint's own `range` stops at the nearer limit in the same way, the effector
   * resting on the legal shell along that line and the result reporting the
   * `shortfall`; of two branches the one stopping nearer the target is swept,
   * because a candidate past the hinge's limit would be clamped by the caller
   * afterwards and land somewhere no candidate was scored at.
   *
   * The root joint first aims `m(θ)` at the target, then any extra rotation
   * about `m(θ)` leaves the effector where it is. The function sweeps that
   * swivel in `SWIVEL_STEP` increments on each branch, ordering candidates by
   * the least `overshoot` (legal, zero, ahead of any other exactly; two
   * positive ones tied within the decomposition's rounding, 1e-9 degree), then
   * the least `deviation`, both from `score`. Every local minimum of a sweep is
   * then refined between its neighbouring steps by golden-section search under
   * the same ordering, and the best of the sweeps and the refinements is
   * returned. A pass whose two probes tie closes the bracket onto both, so a
   * request mirrored left to right, whose probes are the same two exchanged,
   * refines to the mirrored swivel. So the chosen pose follows a moving target
   * continuously rather than in swivel steps, a legal interval narrower than
   * one step is still found from the dip it leaves in the sweep, and between
   * two basins the truly better one wins rather than the one a sample happened
   * to fall nearer the bottom of. The caller owns the decomposition and the
   * rig's ROM, so the geometry here holds no rig policy.
   *
   * A caller that can certify swivels its score refuses (`excluded`) spares
   * their scoring, and the pose is still the full sweep's. A step is skipped
   * when every swivel within two steps of it is refused, and a step whose
   * bracket, a step either way, is refused is not refined; every other step is
   * scored and compared with its true neighbours, since a step that is not
   * skipped and could be refined has both neighbours scored. When the pruned
   * sweep finds a legal candidate, the full sweep's answer is that candidate: a
   * refused swivel, a step or a refinement inside a refused bracket, is never
   * legal, so it can never be ahead of a legal candidate (legality is compared
   * exactly); every legal candidate of the full sweep is a scored step or the
   * refinement of a step that is scored with the same neighbours, so it is the
   * same candidate in both; and the ordering among legal candidates, met in the
   * same order, is the same. When the pruned sweep finds none, the full sweep
   * decides, so a chain that cannot reach legally still returns its least
   * overshoot.
   *
   * A cold fit with `closed` candidates and no `tie` or `minimum` scores them
   * alone and returns the best when it is legal and `met` accepts it: where a
   * requested term is met only at isolated swivels, those are the whole
   * admissible set and no search can add to it.
   *
   * A cold fit with a `pole` and no `tie` or `minimum` searches locally from it
   * (`hingedSwivelPole`) and returns a legal result without the sweep, so it
   * follows the bend hint rather than jumping to a far, marginally better
   * swivel.
   *
   * A cold fit whose caller certifies that no candidate can pass `met`
   * (`unmet`) skips the pole start, whose result `met` would refuse.
   *
   * Each limit of the root joint is a sinusoid of the swivel, so its feasible
   * swivels are intervals in closed form, and the caller's refusal (`excluded`)
   * is their complement (Tolani, Goswami and Badler 2000, section 3.2.3). A
   * cold fit whose refusal covers every swivel of every swept branch has no
   * legal candidate, and its answer is the least overshoot: on each branch the
   * best of the swivels at which a limit is least violated (`least`, in closed
   * form) starts the local search of the full score (`hingedSwivelPole`), and
   * the better branch result answers, with no sweep. Without `least` the sweep
   * decides as before.
   *
   * A caller continuing a fit of a nearby target (`near`) skips the sweep: a
   * `closed` candidate less than a step from the seed answers when legal and
   * met (`hingedSwivelNear`), and otherwise the seed's branch, its swivel
   * refined within one step either way by the same golden-section search under
   * the same ordering, to the seed's `tolerance` (`IAutoMovieSwivelNear`).
   * Every result names its branch and swivel, the seed a nearby fit continues
   * from. If dividing a positive subnormal tolerance by the initial bracket
   * width underflows, the difference of logarithms keeps the mathematically
   * finite refinement count finite; ordinary ratios retain their original
   * expression. A placed pole (`IProps.placed`, a place the law's own elbow
   * search chose) answers at the pole where it is legal. Otherwise a continued
   * fit walks from its seed toward the pole and stops at the edge of the legal
   * interval the seed lies in, and a cold fit takes the legal swivel nearest
   * the pole on any branch, walking out from it both ways; each edge is found
   * by swivel steps and bisection on the candidate's legality. Only where no
   * swivel is legal does the sweep decide. A continued fit never leaves its
   * seed's branch: where the branch holds no legal closed-form candidate, the
   * seed is refined as any other, and its caller's course decides whether that
   * continuation stands. With certified global score minima and no second key,
   * the first scored coarse candidate ends a cold search only if its actual two
   * keys equal both minima exactly. No later candidate can be strictly ahead,
   * so the original candidate and complete-tie seed are preserved; later coarse
   * candidates cannot use this shortcut because earlier refinements precede
   * them.
   *
   * Returns `null` for a degenerate chain: a mid or end offset shorter than
   * `1e-6`, a target within `1e-6` of the chain root, a hinge shorter than
   * `1e-6`, or `R` below `1e-9`, a hinge parallel to the far segment that
   * cannot change the span ({@link armChainFault} reports that rig).
   */
  export function hingedArmArticulation(
    props: AutoMovieEngineKinematicsTypes.IAutoMovieEngineKinematicsHingedArmArticulationProps,
  ): IAutoMovieHingedArticulation | null {
    return hingedArmArticulationImplementation(props);
  }

  /**
   * Propagate declared instantaneous local rotation rates through native FK.
   *
   * Every input bone must come from the same current resolvePose snapshot and
   * unchanged unit-rotation rig as topology, including the ancestors of every
   * demanded bone. Root placement must likewise have a unit rotation. Local
   * angular rates are radians per second in the moving bone's frame:
   * localRotation^-1 times its derivative has vector part omega/2. Root rates
   * are in the resolved bones' common frame, with linear velocity at position.
   * A missing local rate is unknown, including on an unlisted pose joint; a
   * producer that proves rest articulation constant supplies an explicit zero.
   *
   * Native FK applies no root/rest scale and holds each rest translation and
   * rest rotation fixed. This entry differentiates precisely that convention.
   * Changing rest transforms, changing axes/rest frames, or an independently
   * scaled/transformed bone snapshot needs a different derivative producer.
   * Missing ancestors/rates and non-finite inputs return undefined so the owner
   * can retain its generic sampled path. Inputs are read without modification;
   * the successful map and every velocity record are fresh and caller-owned.
   */
  export function resolveAutoMovieBoneRates(
    topology: IAutoMovieSkeletonTopology,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    localBodyAngularRates: ReadonlyMap<
      AutoMovieHumanoidBone,
      IAutoMovieVector3
    >,
    root: AutoMovieEngineKinematicsTypes.IAutoMovieEngineKinematicsRootRate,
  ):
    | Map<
        AutoMovieHumanoidBone,
        AutoMovieEngineKinematicsTypes.IAutoMovieEngineKinematicsBoneRate
      >
    | undefined {
    return resolveAutoMovieBoneRatesImplementation(
      topology,
      bones,
      localBodyAngularRates,
      root,
    );
  }

  /**
   * Solve the current square differential kinematics J(q) qdot = goalRate. Rows
   * and the matching goal rate use the same task frame and physical unit; each
   * column uses its actual coordinate unit, so output is that unit/second.
   * Positive rowScale divides both sides of each row, for example the current
   * chain length for metre rows and one for radian rows. It changes neither the
   * equality nor the coordinate rates and never weights a residual fit. Keep
   * all supplied numeric rows and vectors unchanged until return.
   *
   * The caller owns an actual analytic Jacobian and goal derivative on one
   * smooth branch. Uncontrolled ancestor/root motion must be included in that
   * Jacobian or subtracted from the goal rate in the same task frame. This
   * numerical leaf neither samples a pose nor proves that a supplied matrix is
   * its derivative. Active constraints, changing active sets, rectangular
   * systems and unsupported charts need the caller's explicit derivative
   * fallback; no clamped or damped answer is manufactured here.
   *
   * The existing LU owner's pivot refusal is retained, not interpreted as a
   * nonsingularity certificate. A solved result reports actual original-unit
   * residuals, scaled backward errors, an inverse-based infinity condition
   * estimate and the computed inverse defect. These are numerical diagnostics,
   * not certified forward-error bounds or a physical acceptance tolerance.
   *
   * @param jacobian Current finite nonempty square task-row/coordinate-column
   *   matrix.
   * @param goalRate Current finite task derivative, in the same row
   *   units/second.
   * @param rowScale Positive finite physical scale for each task row, unchanged
   *   during the call.
   * @returns Fresh rates/diagnostics, or an explicit unsupported, pivot-refused
   *   or unrepresentable result.
   */
  export function solveResolvedRate(
    jacobian: readonly (readonly number[])[],
    goalRate: readonly number[],
    rowScale: readonly number[],
  ): AutoMovieEngineKinematicsTypes.IAutoMovieEngineKinematicsSolveResolvedRateResult {
    return solveResolvedRateImplementation(jacobian, goalRate, rowScale);
  }

  /**
   * The total range-of-motion overshoot of one joint's clinical angles, in
   * degrees, or `0` when the joint is within its constraint.
   *
   * It sums the overshoot of every fault
   * {@link AutoMovieEngineKinematics.scanJointRom} reports, the measure the pose
   * gate's `validateJointRom` words into its violations, so a solver that ranks
   * candidates by this number cannot judge itself by a kinder rule than the
   * gate, and a ranking over hundreds of candidates builds no message for any
   * of them. A non-finite angle is reported without an overshoot and scores
   * `Infinity`, so it never wins a ranking. A `null` constraint scores `0`.
   *
   * @param joint Clinical angles of one joint; `null` axes are at rest.
   * @param constraint The joint's resolved ROM, or `null` when unconstrained.
   * @param rig The bone's frame as the caller's rig resolves it, for a joint
   *   gated by swing and twist; the humanoid tables' when absent.
   */
  export function jointRomOvershoot(
    joint: IAutoMovieJointPose,
    constraint: IAutoMovieJointConstraint | null,
    rig?: swingTwistRange.IPrepared,
  ): number {
    return jointRomOvershootImplementation(joint, constraint, rig);
  }

  /**
   * Prepare the gate's exact overshoot sum for joints of one fixed bone. The
   * bone, constraint and optional frame stay unchanged for the scorer's
   * synchronous operation. A null constraint still scores zero without
   * admitting any coordinate. The scanner owns lazy prepared basis/factor
   * sharing for gated joints; every candidate retains its original finite
   * checks, numerical reading and fault order.
   *
   * Constant setup owns one closure and the scanner's fixed-size optional
   * frame/composer until caller release. No target or joint result survives a
   * score, and a changed rig or ROM requires a new scorer.
   *
   * Every supplied joint must name the prepared bone. The scanner keeps its
   * canonical humanoid frame fallback when no rig is supplied and owns all
   * finite, interval, cone and swing-twist rules. Preparation adds no
   * tolerance, alternative frame or candidate-answer cache; each actual score
   * is scanned. The optional rotation is the one the angles were read from on
   * the range's own frame (`AutoMovieEngineKinematics.prepareJointRomScan`).
   */
  export function prepareJointRomOvershoot(
    bone: AutoMovieHumanoidBone,
    constraint: IAutoMovieJointConstraint | null,
    rig?: swingTwistRange.IPrepared,
  ): (joint: IAutoMovieJointPose, rotation?: IAutoMovieQuaternion) => number {
    return prepareJointRomOvershootImplementation(bone, constraint, rig);
  }

  /**
   * A joint's admitted abduction interval at a flexion: its `abduction`
   * interval, the ceiling raised linearly with flexion by its `abductionFlexed`
   * coupling up to that coupling's flexion and held beyond
   * (`IAutoMovieFlexedAbduction`); extension keeps the neutral ceiling.
   *
   * @param constraint The joint's range.
   * @param flexion Its flexion, degrees, or null at rest; a non-finite flexion
   *   reads as rest.
   * @returns The interval, the constraint's own when it has no coupling or the
   *   flexion adds nothing; null for an immobile axis.
   */
  export function abductionRange(
    constraint: IAutoMovieJointConstraint,
    flexion: number | null,
  ): IAutoMovieAngleRange | null {
    return abductionRangeImplementation(constraint, flexion);
  }

  /**
   * Project one joint into admitted axis intervals, preserving null rest and
   * forcing specified immobile axes to zero. Specified nonfinite angles first
   * become neutral. A swing cap blends toward the box point nearest neutral;
   * unrestricted multi-turn overrides are outside the bisection's
   * monotonic-segment guarantee.
   *
   * A ball joint whose constraint declares `swingTwist`, on a bone with axes in
   * its frame (the caller's `rig`, or the humanoid tables' through
   * `swingTwistRange.of`), is instead brought into its range as a rotation
   * (`swingTwistRange.project`: its direction along its great circle from rest,
   * its twist clamped) and read back in the reading the three-angle box
   * prefers; a joint already inside comes back as given.
   *
   * @param joint The joint's clinical angles.
   * @param constraint Its resolved range.
   * @param rig The bone's frame as the caller's rig resolves it; the humanoid
   *   tables' when absent.
   * @returns The joint in range: a value, the input record itself where every
   *   projected angle is its own, else a fresh record; neither is to be
   *   edited.
   */
  export function clampJointRom(
    joint: IAutoMovieJointPose,
    constraint: IAutoMovieJointConstraint,
    rig?: swingTwistRange.IPrepared,
  ): IAutoMovieJointPose {
    return clampJointRomImplementation(joint, constraint, rig);
  }

  /**
   * Clamp one joint using its skeleton override, otherwise the humanoid
   * default table. Unconstrained joints return by identity. This targeted
   * seam lets derived contact/retarget corrections leave authored neighboring
   * joints alone.
   */
  export function clampJointToSkeleton(
    joint: Parameters<
      typeof AutoMovieEngineClampJointToSkeleton.clampJointToSkeleton
    >[0],
    skeleton: Parameters<
      typeof AutoMovieEngineClampJointToSkeleton.clampJointToSkeleton
    >[1],
  ): ReturnType<
    typeof AutoMovieEngineClampJointToSkeleton.clampJointToSkeleton
  > {
    return AutoMovieEngineClampJointToSkeleton.clampJointToSkeleton(
      joint,
      skeleton,
    );
  }

  /**
   * Prepare actual joint clamps for one unchanged rig operation. The first
   * requested joint builds a first-bone index; each distinct name then reads
   * its constraint and frame once, and every incoming joint is projected.
   *
   * An optional axes table must be the complete result of
   * skeletonJointAxes(skeleton, HUMANOID_JOINT_AXES) for this same operation.
   * Without it, that merge is made only when a constrained joint first needs
   * its frame. Axis admission still occurs inside the actual projection.
   *
   * Metadata setup costs O(B+D), followed by the existing projection per
   * input joint, for B bones and D requested names. The returned function
   * owns at most B first-bone records, D clamp closures with optional lazy
   * swing-twist bases and one axes table; release it when the operation ends,
   * including failure. A later solve creates a new preparation, so no mutable
   * skeleton identity is cached.
   *
   * @param skeleton The rig, unchanged until the returned clamp is released.
   * @param resolvedAxes Its already resolved canonical axes table, when
   *   available.
   * @returns A clamp that preserves each unconstrained input joint by
   *   identity, carrying its angle-taking form (IPrepared.values).
   */
  export function prepareClampJointToSkeleton(
    skeleton: Parameters<
      typeof AutoMovieEngineClampJointToSkeleton.prepareClampJointToSkeleton
    >[0],
    resolvedAxes?: Parameters<
      typeof AutoMovieEngineClampJointToSkeleton.prepareClampJointToSkeleton
    >[1],
  ): ReturnType<
    typeof AutoMovieEngineClampJointToSkeleton.prepareClampJointToSkeleton
  > {
    return AutoMovieEngineClampJointToSkeleton.prepareClampJointToSkeleton(
      skeleton,
      resolvedAxes,
    );
  }

  /**
   * One bone's clamp under a skeleton, its override or the humanoid table and
   * its swing-twist frame resolved once, for a caller that clamps the same
   * bone many times within one solve (a sweep's candidates): each call clamps
   * exactly as `AutoMovieEngineKinematics.clampJointToSkeleton` does with the
   * skeleton as it stood when the clamp was made. Nothing is kept beyond the
   * closure, since a skeleton's contents may change between solves.
   *
   * @param bone The bone.
   * @param skeleton The skeleton.
   * @returns The clamp of a joint of that bone.
   *
   *   States the one-bone closure, fixed-input operation scope, skeleton
   *   mutation boundary and caller-owned lifetime. Uses the first matching
   *   bone for override precedence and the shared private constraint gate,
   *   resolving a current skeleton frame only for an actual swing-twist
   *   clamp. One first-bone lookup and one shared clamp preparation;
   *   numerical projection stays in clampJointRom. Missing bones preserve
   *   default ROM, and an unconstrained bone never resolves a swing-twist
   *   frame. O(B) lookup and, only for a swing-twist constraint, an O(B) axis
   *   merge are paid once per closure; box/cone clamps skip unused axes
   *   metadata and later invocations perform the existing projection only.
   *   The closure borrows this operation's resolved constraint and frame; a
   *   new preparation reads current skeleton contents, including axes
   *   replaced on the same bones list. The caller owns one closure borrowing
   *   one constraint and frame until its solve ends; no global skeleton
   *   cache, task or handle is retained.
   */
  export function clampJointToSkeletonOf(
    bone: Parameters<
      typeof AutoMovieEngineClampJointToSkeleton.clampJointToSkeletonOf
    >[0],
    skeleton: Parameters<
      typeof AutoMovieEngineClampJointToSkeleton.clampJointToSkeletonOf
    >[1],
  ): ReturnType<
    typeof AutoMovieEngineClampJointToSkeleton.clampJointToSkeletonOf
  > {
    return AutoMovieEngineClampJointToSkeleton.clampJointToSkeletonOf(
      bone,
      skeleton,
    );
  }

  /**
   * Prepare the same one-bone clamp from a caller's first matching bone and
   * frame reader, allowing one pose operation to share its index and axes.
   * The supplied record must belong to bone; undefined preserves named
   * default ROM. The frame reader runs only after the joint is constrained.
   *
   * @param bone The joint's bone name.
   * @param found The first matching skeleton bone, or undefined when absent.
   * @param readRig The frame resolved from that same unchanged skeleton.
   * @returns A clamp for joints of bone, borrowing the resolved constraint
   *   and frame.
   *
   *   States lookup provenance, absent-bone default behavior, frame-reader
   *   ordering and the closure's fixed bone and lifetime. getConstraint owns
   *   override/default precedence; an unconstrained joint returns by
   *   identity, otherwise the frame is read once and clampJointRom performs
   *   each actual projection. This shared preparation separates bone lookup
   *   from the unchanged constraint gate and projection used by standalone
   *   and full-pose clamps. Does not validate skeleton membership, repair
   *   axes or cache a clamped answer; the caller supplies the actual first
   *   matching bone and same-skeleton rig reader. Constant preparation apart
   *   from the caller's frame reader, then the existing projection for every
   *   joint; no bone scan is performed here. Reuses this operation's
   *   constraint/frame and a swing-twist frame's lazy basis while preserving
   *   every actual projection; no state is shared across solves. One returned
   *   clamp owns its optional prepared frame, private readers and at most one
   *   admitted-axis reference and one swing basis plus borrowed
   *   constraint/axis/frame records, released with the operation; ordinary
   *   box clamps keep no prepared swing basis and a one-shot swing clamp pays
   *   the fixed-size wrapper and its three closures.
   */
  export function clampJointToSkeletonResolved(
    bone: Parameters<
      typeof AutoMovieEngineClampJointToSkeleton.clampJointToSkeletonResolved
    >[0],
    found: Parameters<
      typeof AutoMovieEngineClampJointToSkeleton.clampJointToSkeletonResolved
    >[1],
    readRig: Parameters<
      typeof AutoMovieEngineClampJointToSkeleton.clampJointToSkeletonResolved
    >[2],
  ): ReturnType<
    typeof AutoMovieEngineClampJointToSkeleton.clampJointToSkeletonResolved
  > {
    return AutoMovieEngineClampJointToSkeleton.clampJointToSkeletonResolved(
      bone,
      found,
      readRig,
    );
  }

  /**
   * Borrow this owner's exact factory callable for synchronous scratch
   * inputs. The returned function is the original callable, with no
   * replacement or extra invocation. Its closure stores only fixed source
   * metadata and never an input or result joint. Unconstrained projection can
   * return the input itself; copy a selected/retained result before editing
   * that scratch again.
   *
   * The private `owned` mark comes only from of/resolved/prepare production.
   * Unknown, wrapped, proxied or bound callbacks return undefined, so their
   * original fresh-input/callback behavior remains the consumer's fallback.
   * This lookup certifies no ROM, matching domain, projection outcome or
   * input validity. It costs constant work, stores no joint and retains no
   * callable strongly; release the borrowed function with its owning
   * operation.
   */
  export function borrowClampJoint(
    clamp: Parameters<
      typeof AutoMovieEngineClampJointToSkeleton.borrowClampJoint
    >[0],
  ): ReturnType<typeof AutoMovieEngineClampJointToSkeleton.borrowClampJoint> {
    return AutoMovieEngineClampJointToSkeleton.borrowClampJoint(clamp);
  }

  /**
   * Test whether a genuine one-joint clamp owns the exact borrowed
   * constraint. All-bone clamps and opaque callbacks have no one-joint
   * constraint identity.
   *
   * The same private constructor binds and weakly registers the constraint.
   * Identity proves the fixed domain without constructing a joint, invoking
   * the clamp or retaining an input or projection result.
   */
  export function clampJointToSkeletonOwnsConstraint(
    clamp: Parameters<
      typeof AutoMovieEngineClampJointToSkeleton.clampJointToSkeletonOwnsConstraint
    >[0],
    constraint: Parameters<
      typeof AutoMovieEngineClampJointToSkeleton.clampJointToSkeletonOwnsConstraint
    >[1],
  ): boolean {
    return AutoMovieEngineClampJointToSkeleton.clampJointToSkeletonOwnsConstraint(
      clamp,
      constraint,
    );
  }

  /**
   * Return a new pose/joint array by applying effective skeleton ROM to each
   * joint. Root and unconstrained joint records remain borrowed;
   * pose/skeleton identity admission and unrestricted multi-turn cone
   * correctness are separate responsibilities.
   */
  export function clampPose(
    pose: Parameters<typeof AutoMovieEngineClampPose.clampPose>[0],
    skeleton: Parameters<typeof AutoMovieEngineClampPose.clampPose>[1],
  ): ReturnType<typeof AutoMovieEngineClampPose.clampPose> {
    return AutoMovieEngineClampPose.clampPose(pose, skeleton);
  }

  /**
   * Prepare the metadata of repeated full-pose clamps during one operation.
   * The skeleton and its records must stay unchanged until this function is
   * released; every pose's numerical projection still runs, including when a
   * caller intentionally clamps an earlier clamp's result again.
   *
   * The shared joint owner lazily indexes B bones and prepares D requested
   * names once. Each call still costs O(J) projections and creates a fresh
   * wrapper and joint array, borrowing its root and unconstrained records.
   * The caller releases the closure on completion or failure; no pose or
   * projected result is retained between calls.
   *
   * @param skeleton The unchanged rig used by every pose of this operation.
   * @returns A full-pose clamp borrowing only operation-scoped rig metadata,
   *   carrying its one-joint clamp (`IPrepared.joints`) and that clamp's
   *   angle-taking form (`IPrepared.values`) as its own members.
   */
  export function prepareClampPose(
    skeleton: Parameters<typeof AutoMovieEngineClampPose.prepareClampPose>[0],
  ): ReturnType<typeof AutoMovieEngineClampPose.prepareClampPose> {
    return AutoMovieEngineClampPose.prepareClampPose(skeleton);
  }

  /**
   * Measure one joint against its range of motion and report each fault to
   * the caller, building no message: the single owner of what counts as a ROM
   * fault and how far past the limit it lies, read by the pose gate
   * ({@link validateJointRom}), which words each fault, and by the solvers'
   * candidate ranking (`jointRomOvershoot`), which only sums them.
   *
   * Faults are reported in axis order (flexion, abduction, twist), then the
   * combined swing. A `null` angle is rest and reports nothing on its own
   * axis; `0` reports nothing on an immobile (`null`) axis, whose rest it is,
   * but is measured against a range that excludes it. A non-finite angle is
   * reported with an `undefined` overshoot, since it has no distance to a
   * limit. An angle on an immobile axis overshoots by its whole magnitude,
   * and one outside its interval by its distance to the nearer bound. The
   * swing is the coupling of flexion and abduction, a `null` axis
   * contributing its actual rotation, `0`, and overshoots by what it exceeds
   * `swingDeg`.
   *
   * A ball joint whose constraint declares `swingTwist` is measured by its
   * rotation instead (`swingTwistRange`), in the frame of its bone the
   * caller's rig resolves (`rig`), or the humanoid tables'
   * (`swingTwistRange.of`): a `swing` fault by the degrees its direction lies
   * past the reach of its flexion and abduction ranges, then a `twist` fault
   * by the degrees its turn about its own axis lies past `swingTwist.twist`.
   * A non-finite angle is reported as above and nothing else is measured. A
   * bone with no axes in that frame keeps the three-angle scan.
   *
   * @param joint Joint angles in the constraint's degree frame; `null` is
   *   rest.
   * @param constraint Finite ordered axis intervals and an optional swing
   *   cone.
   * @param report Called once per fault with the faulted part, the measured
   *   value in degrees and its overshoot in degrees, `undefined` for a
   *   non-finite value.
   * @param rig The bone's frame as the caller's rig resolves it
   *   (`swingTwistRange.of(bone, skeleton)`); the humanoid tables' when
   *   absent.
   */
  export function scanJointRom(
    joint: Parameters<typeof AutoMovieEngineJointRomScan.scanJointRom>[0],
    constraint: Parameters<typeof AutoMovieEngineJointRomScan.scanJointRom>[1],
    report: Parameters<typeof AutoMovieEngineJointRomScan.scanJointRom>[2],
    rig?: Parameters<typeof AutoMovieEngineJointRomScan.scanJointRom>[3],
  ): ReturnType<typeof AutoMovieEngineJointRomScan.scanJointRom> {
    return AutoMovieEngineJointRomScan.scanJointRom(
      joint,
      constraint,
      report,
      rig,
    );
  }

  /**
   * Sum the same faults in their report order, without a collector closure.
   * Missing distances are nonfinite faults and add Infinity, never zero. This
   * entry runs the same full scan with its existing rig admission and owns
   * only a local number; it retains no joint, constraint or result.
   *
   * @param joint The actual clinical angles, degrees.
   * @param constraint Their effective admitted ROM.
   * @param rig The caller's existing clinical frame, when supplied.
   * @returns The ordered overshoot sum in degrees, or Infinity for an
   *   unmeasurable fault.
   */
  export function scanJointRomOvershoot(
    joint: Parameters<
      typeof AutoMovieEngineJointRomScan.scanJointRomOvershoot
    >[0],
    constraint: Parameters<
      typeof AutoMovieEngineJointRomScan.scanJointRomOvershoot
    >[1],
    rig?: Parameters<
      typeof AutoMovieEngineJointRomScan.scanJointRomOvershoot
    >[2],
  ): number {
    return AutoMovieEngineJointRomScan.scanJointRomOvershoot(
      joint,
      constraint,
      rig,
    );
  }

  /**
   * Prepare numerical scans for one bone's unchanged constraint and clinical
   * frame. Every input joint must name that bone. The canonical humanoid
   * frame remains the fallback when no rig is supplied, as in a direct scan.
   * Creating the scorer admits no axis or angle; the first finite gated
   * candidate admits its basis at the original composition site. Later
   * candidates share only that basis and their pure axis factors, while all
   * finite checks, swing/twist readings and ordered additions still run.
   *
   * Preparation is constant work. One closure owns one optional prepared
   * frame and lazy joint composer for this synchronous operation, released
   * with the scorer. No joint, quaternion result or target history is
   * cached.
   *
   * The same private fault scan evaluates every candidate, with finite checks
   * before any composition. Only the gated frame and composition factors are
   * prepared, without duplicating interval, cone or swing-twist fault rules.
   * Canonical fallback, ordered additions and tolerances remain unchanged.
   * Exact unchanged bone/constraint/axes/frame inputs justify that
   * preparation; each candidate still owns its fresh outer product and actual
   * reading.
   *
   * A caller that read the joint's angles off a rotation, on a basis and rest
   * frame that are the range's own (`readsSwingTwistFrame`), passes that
   * rotation: a gated joint's range then reads it instead of the rotation its
   * angles compose back to, the same rotation up to the rounding of the round
   * trip, and composes nothing.
   */
  export function prepareJointRomScan(
    bone: Parameters<typeof AutoMovieEngineJointRomScan.prepareJointRomScan>[0],
    constraint: Parameters<
      typeof AutoMovieEngineJointRomScan.prepareJointRomScan
    >[1],
    rig?: Parameters<typeof AutoMovieEngineJointRomScan.prepareJointRomScan>[2],
  ): ReturnType<typeof AutoMovieEngineJointRomScan.prepareJointRomScan> {
    return AutoMovieEngineJointRomScan.prepareJointRomScan(
      bone,
      constraint,
      rig,
    );
  }

  /**
   * The same overshoot sum for one bone gated by swing and twist, read from
   * the joint's rotation alone: what `prepare`'s scorer returns for a joint
   * whose angles were read off that rotation on the range's own basis and
   * rest frame (`readsSwingTwistFrame`), the gate's swing then twist faults
   * in their order, with no angles to read. Such angles, read off a finite
   * rotation, are finite, so the scorer's finite checks on them have nothing
   * to report; a rotation with a non-finite component is the caller's to
   * refuse. Null for an unconstrained or ungated bone, whose scan reads the
   * angles themselves.
   *
   * @param bone The bone.
   * @param constraint Its effective ROM.
   * @param rig Its frame as the caller's rig resolves it; the humanoid
   *   tables' when absent.
   * @returns The scorer of a rotation, degrees, or null.
   */
  export function prepareRotatedJointRomScan(
    bone: Parameters<
      typeof AutoMovieEngineJointRomScan.prepareRotatedJointRomScan
    >[0],
    constraint: Parameters<
      typeof AutoMovieEngineJointRomScan.prepareRotatedJointRomScan
    >[1],
    rig?: Parameters<
      typeof AutoMovieEngineJointRomScan.prepareRotatedJointRomScan
    >[2],
  ): ReturnType<typeof AutoMovieEngineJointRomScan.prepareRotatedJointRomScan> {
    return AutoMovieEngineJointRomScan.prepareRotatedJointRomScan(
      bone,
      constraint,
      rig,
    );
  }

  /**
   * Convert rig degrees to clinical = sign * rig + neutral. Null rest remains
   * null and an absent frame preserves the angle; an invalid supplied
   * sign/neutral throws when used. prepare reads the same expression
   * repeatedly on unchanged frame objects: construction admits nothing, first
   * nonnull use captures the actual final sign/neutral operands after
   * original validation and replacement admits anew.
   */
  export function toClinicalAngle(
    rig: Parameters<typeof AutoMovieEngineClinicalAngle.toClinicalAngle>[0],
    frame: Parameters<typeof AutoMovieEngineClinicalAngle.toClinicalAngle>[1],
  ): ReturnType<typeof AutoMovieEngineClinicalAngle.toClinicalAngle> {
    return AutoMovieEngineClinicalAngle.toClinicalAngle(rig, frame);
  }

  /**
   * Prepare one lazy reader without reading a frame or angle. Null bypasses
   * unused frames; each used frame object stays unchanged until replacement
   * or release, and failed admission leaves any valid prior reading intact.
   */
  export function prepareToClinicalAngle(): ReturnType<
    typeof AutoMovieEngineClinicalAngle.prepareToClinicalAngle
  > {
    return AutoMovieEngineClinicalAngle.prepareToClinicalAngle();
  }

  /**
   * Convert clinical degrees to rig = (clinical - neutral) / sign. Null rest
   * remains null and an absent frame preserves the angle; an invalid supplied
   * sign/neutral throws when used. prepare supplies a lazy operation reader
   * for unchanged frame objects. Null reads admit no frame; the first nonnull
   * read validates and captures the exact neutral/sign used by the original
   * expression. Replacing the frame admits it again, while unchanged identity
   * reuses only those affine scalars.
   */
  export function toRigAngle(
    clinical: Parameters<typeof AutoMovieEngineRigAngle.toRigAngle>[0],
    frame: Parameters<typeof AutoMovieEngineRigAngle.toRigAngle>[1],
  ): ReturnType<typeof AutoMovieEngineRigAngle.toRigAngle> {
    return AutoMovieEngineRigAngle.toRigAngle(clinical, frame);
  }

  /**
   * Prepare one lazy converter; construction reads no frame or angle. Null
   * remains null without admission. Each same-identity frame must stay
   * unchanged until replacement or reader release. A replacement runs the
   * original checks, and failed admission never replaces valid metadata.
   */
  export function prepareToRigAngle(): ReturnType<
    typeof AutoMovieEngineRigAngle.prepareToRigAngle
  > {
    return AutoMovieEngineRigAngle.prepareToRigAngle();
  }
  /**
   * Borrow a nonnull supplied override, otherwise the default humanoid
   * constraint, otherwise null. Null override means fallback rather than explicit
   * disablement; this lookup validates no numerical bounds.
   */
  export function getConstraint(
    bone: AutoMovieHumanoidBone,
    override: IAutoMovieJointConstraint | null,
  ): IAutoMovieJointConstraint | null {
    return getConstraintImplementation(bone, override);
  }

  /**
   * Convert clinical degree interval endpoints by (clinical - neutral) / sign
   * and reorder mirrored bounds. Null axes remain immobile and absent frames
   * retain range identity. swingDeg is carried as the existing rest-deviation
   * policy; arbitrary neutral shifts do not prove clinical swing-metric
   * invariance.
   */
  export function restRelativeConstraint(
    clinical: IAutoMovieJointConstraint,
    frame: IAutoMovieRestFrame,
  ): IAutoMovieJointConstraint {
    return restRelativeConstraintImplementation(clinical, frame);
  }

  /**
   * Compute combined orthogonal-axis swing as 2 * acos(cos(flexion/2) *
   * cos(abduction/2)), with degree inputs/output. Finite representable
   * arithmetic returns the closed range [0, 360]; multi-turn inputs are
   * periodic and are not universally monotonic from zero.
   */
  export function swingConeAngle(flexion: number, abduction: number): number {
    return swingConeAngleImplementation(flexion, abduction);
  }

  /**
   * From a feasible anchor toward an outside endpoint, the greatest parameter
   * read whose swing stays inside the cone, to the width forty bisections leave
   * (`HALVINGS`). The swing along the segment is continuous, so the bracket is
   * closed by false position and whatever width that leaves by bisection
   * (`bracketedCrossing`); the retained lower end is a parameter actually read
   * inside the cone. The largest-boundary interpretation requires monotonic
   * swing on that segment, a premise current admission does not prove for
   * unrestricted multi-turn overrides. An already admitted endpoint returns
   * one.
   */
  export function swingConeBlend(
    flexion: number,
    abduction: number,
    anchorFlexion: number,
    anchorAbduction: number,
    swingDeg: number,
  ): number {
    return swingConeBlendImplementation(
      flexion,
      abduction,
      anchorFlexion,
      anchorAbduction,
      swingDeg,
    );
  }

  /**
   * Append axis range/ROM violations and a combined swing violation to the
   * caller's collector. Null angles mean rest and contribute zero to swing;
   * immobile axes admit null/zero. Field paths and degree overshoots preserve
   * correction provenance, while constraint admission is separate.
   */
  export function validateJointRom(
    props: IAutoMovieValidateJointRom.IProps,
  ): void {
    validateJointRomImplementation(props);
  }

  /**
   * Read the fixed humanoid bone partition for lowerBody, upperBody and head.
   * Face owns expression channels and returns no bones; fullBody returns their
   * union. Fixed partition arrays are borrowed readonly values.
   */
  export function bodyRegionBones(
    region: AutoMovieBodyRegion,
  ): readonly AutoMovieHumanoidBone[] {
    return bodyRegionBonesImplementation(region);
  }

  /**
   * Resolve an admitted motion root at shot-local seconds through the context's
   * staged rigid world frame. Missing motion or a null sampled root returns
   * null. Output rotation and heading include the motion root; root scale is
   * not represented.
   */
  export function resolveActorWorldFrame(
    context: IAutoMovieActorContext,
    motion: IAutoMovieMotion | undefined,
    seconds: number,
  ): IAutoMovieActorWorldFrame | null {
    return resolveActorWorldFrameImplementation(context, motion, seconds);
  }

  /**
   * Resolve a bone action target to world metres using its actor rig and
   * sampled motion, or the rest pose when motion is absent. Non-bone targets,
   * unknown actors/rigs or absent resolved bones return null. Staged
   * heading/position are applied after pose-root FK exactly once.
   */
  export function resolveBoneTarget(
    target: IAutoMovieActionTarget,
    contexts: ReadonlyMap<string, IAutoMovieActorContext>,
    motions: Readonly<Record<string, IAutoMovieMotion>> | undefined,
    seconds: number,
  ): IAutoMovieVector3 | null {
    return resolveBoneTargetImplementation(target, contexts, motions, seconds);
  }

  /**
   * Prepare pure joint-composition readers for one synchronous motion
   * evaluation.
   */
  export function preparePoseResolution(): IAutoMoviePoseResolution {
    return preparePoseResolutionImplementation();
  }

  /** Capture current clinical directions and limits in comparison order. */
  export function readPreparedBendClinical(
    input: AutoMovieEngineKinematicsTypes.IReadPreparedBendClinicalInput,
  ): readonly (number | string | null | undefined)[] {
    return readPreparedBendClinicalImplementation(input);
  }
  /**
   * Resolve an action's explicit body region, else its gesture-kind default, verb
   * default, or fullBody. Head-only and whole-body gesture defaults match the
   * actual reference gesture channels; explicit overrides remain authoritative.
   */
  export function actionRegion(
    action: IAutoMovieActionCall,
  ): AutoMovieBodyRegion {
    return actionRegionImplementation(action);
  }

  /** Measure a humanoid body from its canonical rest rig and physical profile. */
  export function measureAutoMovieHumanoidBody(
    skeleton: IAutoMovieSkeleton,
    profile: IAutoMoviePhysicalProfile,
    neutral?: IPreparedHumanoidNeutralBounds,
  ): IAutoMovieBodyMeasure {
    return measureAutoMovieHumanoidBodyImplementation.run(
      skeleton,
      profile,
      neutral,
    );
  }

  /** Measure a body and derive its surfaces in one unchanged-profile scope. */
  export const measureAutoMovieHumanoidBodyWithSurfaces: typeof measureAutoMovieHumanoidBodyImplementation.withSurfaces =
    measureAutoMovieHumanoidBodyImplementation.withSurfaces;

  /** Resolve anatomical regions and contact sockets onto a humanoid rig. */
  export function resolveAutoMovieHumanoidSurfaces(
    skeleton: IAutoMovieSkeleton,
    profile: IAutoMoviePhysicalProfile,
    neutral?: IPreparedHumanoidNeutralBounds,
  ): IHumanoidSurfaces {
    return resolveAutoMovieHumanoidSurfacesImplementation.run(
      skeleton,
      profile,
      neutral,
    );
  }

  /** Place a bone-local surface point in world coordinates. */
  export const resolveAutoMovieHumanoidSurfacePoint: typeof resolveAutoMovieHumanoidSurfacesImplementation.point =
    resolveAutoMovieHumanoidSurfacesImplementation.point;
  /** Place a bone-local surface normal in world coordinates. */
  export const resolveAutoMovieHumanoidSurfaceNormal: typeof resolveAutoMovieHumanoidSurfacesImplementation.normal =
    resolveAutoMovieHumanoidSurfacesImplementation.normal;
  /** Place a bone-local point and normal in world coordinates. */
  export const resolveAutoMovieHumanoidSurfacePointNormal: typeof resolveAutoMovieHumanoidSurfacesImplementation.pointNormal =
    resolveAutoMovieHumanoidSurfacesImplementation.pointNormal;
  /** Place a complete bone-local surface frame in world coordinates. */
  export const resolveAutoMovieHumanoidSurfacePlace: typeof resolveAutoMovieHumanoidSurfacesImplementation.place =
    resolveAutoMovieHumanoidSurfacesImplementation.place;
  /** Whether the named region is defined by a ray exit. */
  export const resolveAutoMovieHumanoidSurfaceRayed: typeof resolveAutoMovieHumanoidSurfacesImplementation.rayed =
    resolveAutoMovieHumanoidSurfacesImplementation.rayed;
  /** Offset a surface frame by a distance along its normal. */
  export const resolveAutoMovieHumanoidSurfaceOffset: typeof resolveAutoMovieHumanoidSurfacesImplementation.offset =
    resolveAutoMovieHumanoidSurfacesImplementation.offset;
  /** Read the mirrored partner of a surface region, when it has one. */
  export const resolveAutoMovieHumanoidSurfaceTwin: typeof resolveAutoMovieHumanoidSurfacesImplementation.twin =
    resolveAutoMovieHumanoidSurfacesImplementation.twin;
  /** Whether a surface region lies on the body's median plane. */
  export const resolveAutoMovieHumanoidSurfaceMedian: typeof resolveAutoMovieHumanoidSurfacesImplementation.median =
    resolveAutoMovieHumanoidSurfacesImplementation.median;
  /** Center a surface frame on the median plane. */
  export const resolveAutoMovieHumanoidSurfaceCentred: typeof resolveAutoMovieHumanoidSurfacesImplementation.centred =
    resolveAutoMovieHumanoidSurfacesImplementation.centred;
  /** Mirror a surface frame across the body's median plane. */
  export const resolveAutoMovieHumanoidSurfaceMirrored: typeof resolveAutoMovieHumanoidSurfacesImplementation.mirrored =
    resolveAutoMovieHumanoidSurfacesImplementation.mirrored;

  /** Prepare a mass-model snapshot for a synchronous physical operation. */
  export function prepareAutoMovieMassModel(
    source: IMassModel,
  ): IPreparedMassModel {
    return prepareAutoMovieMassModelImplementation.run(source);
  }
  /** Opaque prepared mass-model handle, invalid after release. */
  export type IPreparedMassModel =
    prepareAutoMovieMassModelImplementation.IPrepared;
  /** Internal neutral-bound scope shared by a measure-and-surfaces read. */
  export type IPreparedHumanoidNeutralBounds =
    AutoMovieHumanoidNeutralBounds.IPrepared;
  /** Resolved surface frames and contact sockets of a humanoid. */
  export type IHumanoidSurfaces = IAutoMovieHumanoidSurfaces.ISurfaces;
  /** Segmental mass model for a humanoid rig and physical profile. */
  export type IMassModel = IAutoMovieResolveCenterOfMass.IModel;
  /** Read the bones represented by a prepared mass model. */
  export const prepareAutoMovieMassModelBones: typeof prepareAutoMovieMassModelImplementation.bones =
    prepareAutoMovieMassModelImplementation.bones;
  /** Pose the segments of a prepared mass model. */
  export const prepareAutoMovieMassModelPose: typeof prepareAutoMovieMassModelImplementation.pose =
    prepareAutoMovieMassModelImplementation.pose;
  /** Place a prepared body's centre of mass under a posed skeleton. */
  export const prepareAutoMovieMassModelPlace: typeof prepareAutoMovieMassModelImplementation.place =
    prepareAutoMovieMassModelImplementation.place;
  /** Read a prepared body's inertia tensor. */
  export const prepareAutoMovieMassModelInertia: typeof prepareAutoMovieMassModelImplementation.inertia =
    prepareAutoMovieMassModelImplementation.inertia;
  /** Read momentum between two poses of a prepared mass model. */
  export const prepareAutoMovieMassModelBetween: typeof prepareAutoMovieMassModelImplementation.between =
    prepareAutoMovieMassModelImplementation.between;
  /** Read momentum from supplied segment bone rates. */
  export const prepareAutoMovieMassModelRates: typeof prepareAutoMovieMassModelImplementation.rates =
    prepareAutoMovieMassModelImplementation.rates;
  /** Release the operation-owned prepared mass-model handle. */
  export const releaseAutoMovieMassModel: typeof prepareAutoMovieMassModelImplementation.release =
    prepareAutoMovieMassModelImplementation.release;

  /** Resolve a body's segmental mass model from its rig and physical profile. */
  export function resolveAutoMovieCenterOfMass(
    skeleton: IAutoMovieSkeleton,
    profile: IAutoMoviePhysicalProfile,
  ): IMassModel {
    return resolveAutoMovieCenterOfMassImplementation.run(skeleton, profile);
  }
  /** Pendulum length as a share of hip height. */
  export const AUTO_MOVIE_CENTER_OF_MASS_PENDULUM =
    resolveAutoMovieCenterOfMassImplementation.PENDULUM;
  /** Resolve a mass model from a prepared immutable rig. */
  export const resolveAutoMovieCenterOfMassFromRig: typeof resolveAutoMovieCenterOfMassImplementation.fromRig =
    resolveAutoMovieCenterOfMassImplementation.fromRig;
  /** Pendulum length as a share of hip height. */
  export const resolveAutoMovieCenterOfMassPendulum: typeof resolveAutoMovieCenterOfMassImplementation.pendulum =
    resolveAutoMovieCenterOfMassImplementation.pendulum;
  /** Inverted-pendulum frequency at a hip height. */
  export const resolveAutoMovieCenterOfMassFrequency: typeof resolveAutoMovieCenterOfMassImplementation.frequency =
    resolveAutoMovieCenterOfMassImplementation.frequency;
  /** Place a model's centre of mass under a resolved pose. */
  export const resolveAutoMovieCenterOfMassPlace: typeof resolveAutoMovieCenterOfMassImplementation.place =
    resolveAutoMovieCenterOfMassImplementation.place;
  /** Place a segment's centre of mass under a resolved bone. */
  export const resolveAutoMovieCenterOfMassPoint: typeof resolveAutoMovieCenterOfMassImplementation.point =
    resolveAutoMovieCenterOfMassImplementation.point;
  /** Find the mass-weighted mean of segment points. */
  export const resolveAutoMovieCenterOfMassMean: typeof resolveAutoMovieCenterOfMassImplementation.mean =
    resolveAutoMovieCenterOfMassImplementation.mean;
  /** Extrapolate the centre of mass from its velocity. */
  export const resolveAutoMovieCenterOfMassExtrapolate: typeof resolveAutoMovieCenterOfMassImplementation.extrapolate =
    resolveAutoMovieCenterOfMassImplementation.extrapolate;
  /** Read the margin of stability against a support hull. */
  export const resolveAutoMovieCenterOfMassMargin: typeof resolveAutoMovieCenterOfMassImplementation.margin =
    resolveAutoMovieCenterOfMassImplementation.margin;

  /** Resolve linear and angular momentum over a positive pose interval. */
  export function resolveAutoMovieMomentum(
    model: IMassModel,
    before: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    after: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    seconds: number,
  ): IAutoMovieBodyMomentum {
    return resolveAutoMovieMomentumImplementation.run(
      model,
      before,
      after,
      seconds,
    );
  }
  /** A body pose represented by its segment centres and frames. */
  export type IPosedBody = resolveAutoMovieMomentumImplementation.IPosed;
  /** Momentum measured at a posed body's instant. */
  export type IMomentumMeasure =
    resolveAutoMovieMomentumImplementation.IMomentum;
  /** The principal frame of a body's inertia tensor. */
  export type IPrincipalMassFrame =
    resolveAutoMovieMomentumImplementation.IPrincipal;
  /** Read segment poses from the resolved bones of a mass model. */
  export const resolveAutoMovieMomentumPose: typeof resolveAutoMovieMomentumImplementation.pose =
    resolveAutoMovieMomentumImplementation.pose;
  /** Read momentum between two posed states. */
  export const resolveAutoMovieMomentumBetween: typeof resolveAutoMovieMomentumImplementation.between =
    resolveAutoMovieMomentumImplementation.between;
  /** Prepare interval scratch for repeated momentum reads. */
  export const prepareAutoMovieMomentumIntervals: typeof resolveAutoMovieMomentumImplementation.prepareIntervals =
    resolveAutoMovieMomentumImplementation.prepareIntervals;
  /** Read a body's inertia tensor at a posed state. */
  export const resolveAutoMovieMomentumInertia: typeof resolveAutoMovieMomentumImplementation.inertia =
    resolveAutoMovieMomentumImplementation.inertia;
  /** Read the principal frame and moments of an inertia tensor. */
  export const resolveAutoMovieMomentumPrincipal: typeof resolveAutoMovieMomentumImplementation.principal =
    resolveAutoMovieMomentumImplementation.principal;
  /** Apply an inertia tensor to an angular velocity. */
  export const applyAutoMovieMomentumTensor: typeof resolveAutoMovieMomentumImplementation.apply =
    resolveAutoMovieMomentumImplementation.apply;
  /** Read each segment's contribution to whole-body momentum. */
  export const resolveAutoMovieMomentumParts: typeof resolveAutoMovieMomentumImplementation.parts =
    resolveAutoMovieMomentumImplementation.parts;
}
