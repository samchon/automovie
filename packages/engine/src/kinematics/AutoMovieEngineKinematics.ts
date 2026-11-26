import { aimYawPitch as aimYawPitchImplementation } from "./internal/aimYawPitch";
import { alternateRigJointAngles as alternateRigJointAnglesImplementation } from "./internal/alternateRigJointAngles";
import { boxExcludedSwivels as boxExcludedSwivelsImplementation } from "./internal/boxExcludedSwivels";
import { boxLeastSwivels as boxLeastSwivelsImplementation } from "./internal/boxLeastSwivels";
import { clinicalDeviation as clinicalDeviationImplementation } from "./internal/clinicalDeviation";
import { fitDigitDescent as fitDigitDescentImplementation } from "./internal/fitDigitDescent";
import { fitDigitToTarget as fitDigitToTargetImplementation } from "./internal/fitDigitToTarget";
import { hingedSwivelFeasible as hingedSwivelFeasibleImplementation } from "./internal/hingedSwivelFeasible";
import { prepareArticulatedRig as prepareArticulatedRigImplementation } from "./internal/prepareArticulatedRig";
import { normalizeJointAxes as normalizeJointAxesImplementation } from "./internal/normalizeJointAxes";
import { reachPose as reachPoseImplementation } from "./internal/reachPose";
import { resolveAutoMovieBalanceOutcome as resolveAutoMovieBalanceOutcomeImplementation } from "./internal/resolveAutoMovieBalanceOutcome";
import { type resolveAutoMovieMomentum } from "./resolveAutoMovieMomentum";
import { type resolveAutoMovieBoneRates } from "./resolveAutoMovieBoneRates";
import { resolveAutoMovieMomentumRates as resolveAutoMovieMomentumRatesImplementation } from "./internal/resolveAutoMovieMomentumRates";
import { resolveAutoMovieHumanoidRingModules as resolveAutoMovieHumanoidRingModulesImplementation } from "./internal/resolveAutoMovieHumanoidRingModules";
import { AutoMovieHumanoidDigitSurfaces as AutoMovieHumanoidDigitSurfacesImplementation } from "./internal/AutoMovieHumanoidDigitSurfaces";
import { AutoMovieHumanoidSurfaceExtents as AutoMovieHumanoidSurfaceExtentsImplementation } from "./internal/AutoMovieHumanoidSurfaceExtents";
import { skeletonJointAxes as skeletonJointAxesImplementation } from "./internal/skeletonJointAxes";
import { solveTwoBoneIK as solveTwoBoneIKImplementation } from "./internal/solveTwoBoneIK";
import { validateJointAxesBasis as validateJointAxesBasisImplementation } from "./internal/validateJointAxesBasis";
import { markAutoMovieBalance as markAutoMovieBalanceImplementation } from "./internal/markAutoMovieBalance";
import { markAutoMovieRomOvershoot as markAutoMovieRomOvershootImplementation } from "./internal/markAutoMovieRomOvershoot";
import { type distalEndSwivelReadings } from "./distalEndSwivelReadings";
import { distalEndSwivelArcs as distalEndSwivelArcsImplementation } from "./internal/distalEndSwivelArcs";
import { distalEndSwivelMiss as distalEndSwivelMissImplementation } from "./internal/distalEndSwivelMiss";
import { type distalTwistSwivelRange } from "./distalTwistSwivelRange";
import { distalEndSwivelNearest as distalEndSwivelNearestImplementation } from "./internal/distalEndSwivelNearest";
import { immobileAxisSwivels as immobileAxisSwivelsImplementation } from "./internal/immobileAxisSwivels";

import { type AutoMovieHumanoidBone, type IAutoMovieJointAxes, type IAutoMovieLookAt, type IAutoMovieMotionSample, type IAutoMoviePose, type IAutoMoviePoseResolution, type IAutoMovieResolvedBone, type IAutoMovieRestFrame, type IAutoMovieSkeleton, type IAutoMovieSkeletonTopology, type IAutoMovieYawPitch, type IAutoMovieVector3, type IAutoMovieResolvedJointAngles, type AutoMovieJointTwistPlacement, type IAutoMovieBoxExcludedSwivels, type IAutoMovieFitDigitDescent, type IAutoMovieFitDigitToTarget, type IAutoMovieSwivelArcs, type IAutoMovieArticulatedRigReader, type IAutoMovieArticulatedRig, type IAutoMovieResolveBalanceOutcome, type IAutoMovieBodyMomentum, type IAutoMovieResolveCenterOfMass, type IAutoMovieResolveHumanoidRingModules, type AutoMovieHumanoidRegion, type IAutoMovieHumanoidSurfaces, type IAutoMovieHumanoidSurfaceReader, type IAutoMoviePhysicalProfile, type IAutoMovieHumanoidSurfaceExtents, type IAutoMovieTwoBoneIK, type IAutoMovieJointAxesIssue, type IAutoMovieMark, type IAutoMovieMarkBalance, type IAutoMovieMarkRomOvershoot, type IAutoMovieJointConstraint, type IAutoMovieQuaternion } from "@automovie/interface";

import { resolveLookAt as resolveLookAtImplementation } from "./resolveLookAt";
import { resolvePose as resolvePoseImplementation } from "./resolvePose";

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
  export function aimYawPitch(from: IAutoMovieVector3, to: IAutoMovieVector3, facingDeg: number): IAutoMovieYawPitch {
    return aimYawPitchImplementation(from, to, facingDeg);
  }

  /**
   * The second Euler chart of a joint rotation, in rest-relative (rig) degrees:
   * the other triple that composes to the same rotation.
   *
   * A distal twist composes `Ry(a)·Rx(f)·Rz(t)`, whose second chart is `(180 − f,
   * a + 180, t + 180)`; a proximal twist composes `Rz(t)·Ry(a)·Rx(f)`, whose
   * second chart is `(f + 180, 180 − a, t + 180)`. A left-handed basis is
   * extracted against `−twist`, so its twist takes `−180` where a right-handed
   * one takes `+180`, the same rotation by a full turn. No angle is wrapped: the
   * caller chooses the full-turn alias it needs.
   *
   * @param rig The rest-relative angles of one chart, degrees.
   * @param placement Where the basis places the twist; absent means proximal.
   * @param handed `1` for a right-handed basis (`flexion × abduction = +twist`),
   *   `-1` for a left-handed one.
   * @returns The other chart's rest-relative angles, degrees.
   */
  export function alternateRigJointAngles(rig: IAutoMovieResolvedJointAngles, placement: AutoMovieJointTwistPlacement | undefined, handed: 1 | -1): IAutoMovieResolvedJointAngles {
    return alternateRigJointAnglesImplementation(rig, placement, handed);
  }

  /**
   * The swivels a joint's three-angle box provably refuses: for a joint whose
   * bone-local rotation is a fixed rotation turned about a fixed axis by the
   * swivel (the chain root of `hingedArmSwivel.pose`), a test of whether every
   * swivel from `low` to `high` degrees reads past the joint's box in both of the
   * charts `decomposeJointRotationOnBasis` chooses between, so that
   * `jointRomOvershoot` scores each of them above zero.
   *
   * A rotation turned about a fixed axis by `ψ` has a matrix whose every entry is
   * `a + b cos ψ + c sin ψ` (Rodrigues' formula between two fixed rotations), so
   * every entry the decomposition reads is such a sinusoid, fitted exactly from
   * the rotation at 0, 90 and 180 degrees. Each clinical bound is then a
   * sinusoid's sign, in either chart the decomposition reads
   * (`swivelJointReadings.bounds`). Where one such sinusoid exceeds `MARGIN`, its
   * exact roots bound an arc of swivels (`φ ± acos((MARGIN - a) / R)`), and a
   * reading is refused on the union of its axes' arcs. An abduction ceiling that
   * rises with flexion (`abductionRange`) couples two axes, so its abduction is
   * refused only past the highest ceiling the coupling reaches, which bounds it
   * at every flexion (`swivelJointReadings.interval`). A swing cone (`swingDeg`)
   * couples flexion and abduction too, so no arc of one sinusoid bounds it: each
   * one-degree piece of the turn the axes leave is refused in a chart where the
   * cone's closed-form bound over the piece certainly exceeds it by `MARGIN`
   * (`swivelJointReadings.coneExceeded`). The arcs are `boxRefusedArcs`'s.
   *
   * Every refusal is certain. A sinusoid above `MARGIN` puts its angle past the
   * bound by more than `MARGIN` radians, the joints' tolerance (`ROM_TOLERANCE`,
   * about 1.7e-4), far beyond the rounding of the fit, of the arc's ends and of
   * the decomposition itself (near 1e-15); and an outer angle's vector is then
   * longer than `MARGIN`, past the gimbal band (`sqrt(ε)`, 1.5e-8) inside which
   * the decomposition pins that angle instead. A joint gated by swing and twist,
   * which the box does not score, is read by its range instead
   * (`swingTwistExcludedSwivels`) when the frame the overshoot reads it in is
   * given, and refuses nothing otherwise; an axis without an interval, an outer
   * interval wider than a half turn (whose refusal is an intersection, not a
   * union, of two arcs) and a middle interval met twice by the half turn the
   * middle angle covers refuse nothing, so the test only ever says less than the
   * box would.
   *
   * @param props The joint and its rotation by swivel.
   * @returns Whether every swivel in `[low, high]`, degrees, is refused; a joint
   *   with nothing to refuse refuses no swivel.
   */
  export function boxExcludedSwivels(props: IAutoMovieBoxExcludedSwivels.IProps): (low: number, high: number) => boolean {
    return boxExcludedSwivelsImplementation(props);
  }

  /**
   * The swivels at which each limit of a joint's three-angle box is least
   * violated, for a joint whose bone-local rotation is a fixed rotation turned
   * about a fixed axis by the swivel (the chain root of `hingedArmSwivel.pose`).
   *
   * Each clinical bound, in either chart the decomposition reads, is the sign of
   * a sinusoid of the swivel (`swivelJointReadings.bounds`; Tolani, Goswami and
   * Badler 2000, section 3.2.3: a joint limit maps to a sinusoid of the swivel
   * angle), positive past the bound and growing with the angle's distance past
   * it. Where no swivel is legal, every limit some swivel violates is least
   * violated at its sinusoid's least value, in closed form (`swivelArcs.least`),
   * so these swivels are where a search for the least overshoot starts. They are
   * candidates, not the answer: an outer angle's sinusoid is its vector's length
   * times the sine of its excess, and two limits violated together are least
   * where their sum is, which the caller's own score decides. A bound that no
   * swivel violates, or a constant one, gives no swivel. An abduction ceiling
   * that rises with flexion is read at the highest ceiling the coupling reaches
   * (`swivelJointReadings.interval`), and a swing cone at the swivel where the
   * joint's twist axis turns least from rest, the greatest `cos f · cos a`
   * (`swivelJointReadings.cone`).
   *
   * @param props The joint and its rotation by swivel; `joint` is not read.
   * @returns The swivels, degrees: the cone's and at most one a bound in each
   *   chart; null for an unconstrained joint or one gated by swing and twist,
   *   whose range the box does not read.
   */
  export function boxLeastSwivels(props: IAutoMovieBoxExcludedSwivels.IProps): number[] | null {
    return boxLeastSwivelsImplementation(props);
  }

  /**
   * The squared distance of one joint's clinical angles from the anatomical
   * neutral, `flexion² + abduction² + twist²`, in square degrees.
   *
   * All-zero clinical angles are the standing pose the ROM table is written
   * about, so a smaller value is less articulation. {@link reachPose} sums it over
   * the shoulder and elbow as the least-effort tie-break among arm poses whose
   * ROM overshoot is equal. The value is only meaningful for clinical angles;
   * rest-relative angles have a different origin.
   *
   * @param joint Resolved clinical angles in degrees.
   */
  export function clinicalDeviation(joint: IAutoMovieResolvedJointAngles): number {
    return clinicalDeviationImplementation(joint);
  }

  /**
   * One prioritized descent of a digit's fit: a primary residual (where the point
   * goes) met first, and a secondary one (how it is turned, how its joints
   * couple) bettered only in what the primary leaves free, inside the range the
   * projection keeps.
   *
   * Each step is the damped least-squares step of the primary task, h1 = -(J1'J1
   * + mu I)^-1 J1'r1, plus the secondary task's damped step taken in the
   * regularized null complement, N = I - (J1'J1 + mu I)^-1 J1'J1. This damped
   * complement is not an exact null projector; actual primary admission below
   * keeps the task priority. The direction follows the task-priority inverse
   * kinematics of Nakamura, Hanafusa and Yoshikawa 1987 ("Task-priority based
   * redundancy control of robot manipulators", IJRR 6(2):3-15) in the damped form
   * of Chiaverini 1997 ("Singularity-robust task-priority redundancy resolution",
   * IEEE TRA 13(3):398-410). A variable standing on a bound its descent pushes
   * against (the projection undoes a resolution's move along the negative
   * gradient) is held for the step, the active set of a projected Newton method
   * (Bertsekas 1982); the gradient is the primary's while the primary is unmet,
   * so the secondary never holds a joint the primary needs.
   *
   * A trial is accepted lexicographically: while the primary is unmet, only when
   * it lowers the primary; once met (within the effector's motion for one
   * resolution step of every joint, `tolerance`), when it keeps the primary met
   * and lowers the secondary. The damping follows Levenberg-Marquardt with
   * Nielsen's update at its bounds (Madsen, Nielsen and Tingleff 2004, Algorithm
   * 3.16, tau = 1e-3): a third on an accepted step, a doubling growth on a
   * rejected one, so the steps shrink until the descent stops, when the step it
   * would take moves no variable by more than `step`. Once the primary is met, a
   * rejected secondary step is first backtracked by halves under the same
   * projected acceptance, down to that original resolution. This admits a
   * feasible shorter step despite the damped complement's primary leakage. Finite
   * differences keep two task probes per variable; a separable clipped coordinate
   * uses its actual feasible span instead of dividing by 2*step, which would
   * halve a derivative at a range end. Interior and coupled projections retain
   * their existing central denominator. Residual, projection and tolerance
   * callbacks are pure functions of their supplied values throughout this
   * synchronous descent, as the finite-difference and damping law require.
   * Rejected damping trials keep the accepted point, Jacobians and active set
   * unchanged; only acceptance rebuilds linearization. A satisfied primary with
   * zero squared secondary cannot admit any strictly improving trial and returns
   * immediately. With no variables, the projected point and empty-column primary
   * Jacobian are the only possible result.
   *
   * @param props The start, the residuals, the projection, the resolution and the
   *   primary's tolerance.
   * @returns The variables where the descent stops, projected.
   */
  export function fitDigitDescent(props: IAutoMovieFitDigitDescent.IProps): number[] {
    return fitDigitDescentImplementation(props);
  }

  /**
   * Put a point of a digit (its tip or its pad, a frame on its distal phalanx) on
   * a world point, with the digit's own joints alone, inside their range of
   * motion: the inverse kinematics of one finger or the thumb with the hand where
   * the pose has placed it.
   *
   * Every free axis of every joint of the digit (an axis its constraint does not
   * hold immobile) is a variable, in clinical degrees. The fit has two tasks in
   * priority order. The first puts the effector on the target: its residual is
   * the distance between them. The second, bettered only in what the first leaves
   * free, turns the effector's normal onto the target normal when one is given
   * (the misalignment scaled by the effector's distance from its joint, an arc
   * length, so a degree of tilt counts as the millimetres it swings the phalanx)
   * and keeps a finger's interphalangeal coupling, the distal joint following the
   * middle one at the ratio `coupling` (the coupling of hand animation, DIP = 2/3
   * PIP, Rijpkema and Girard 1991, SIGGRAPH 25(4):339-348, as relayed by the
   * hand-animation literature; provisional until read at the source), its
   * residual likewise that distance times the angle by which the distal joint
   * misses the ratio. The point goal, optionally eased by soft IK as described
   * below, is never traded against a normal or a coupling it does not allow.
   *
   * Each descent is `fitDigitDescent`: damped task-priority least squares
   * (Nakamura, Hanafusa and Yoshikawa 1987; Chiaverini 1997) with the active set
   * of a projected Newton method (Bertsekas 1982) for the joints on a bound, and
   * Levenberg-Marquardt damping (Madsen, Nielsen and Tingleff 2004). The
   * Jacobians are read by central differences on the engine's own forward
   * kinematics, so the angles mean what `resolvePose` displays, and every trial
   * is projected into the range (`clampJointToSkeleton`) before it is measured.
   * The point counts as reached within the effector's motion for one resolution
   * step of every joint, and a descent stops when its step moves no joint by more
   * than `ROM_TOLERANCE`, the resolution to which the engine resolves a joint's
   * angle. The fit is a continuation: it descends from the pose's own angles for
   * the digit, so a caller that seeds each fit from the one before follows a
   * moving target in one basin, its joints moving continuously. Only when that
   * fit cannot reach the target (the tip farther from it than one joint
   * resolution of every joint would move it) does it restart from the middle of
   * every range, where a digit folded the wrong way round its target is not
   * trapped, keeping the restart only if it comes nearer; it never takes the
   * better of two starts for a target the continued fit reaches, an argmin that
   * would switch basins between neighbouring targets. A caller's `rate` softens
   * the target near full extension, where the exact inverse has an unbounded
   * derivative: an exponential soft IK. Below the soft band the target is
   * unchanged; within it, some reach is traded for a bounded radial extension
   * rate. The band's width comes from the chain's lengths and the requested rate,
   * not the seed's posture. This controls the full-extension singularity, not
   * every possible change of basin of a constrained digit. The result is
   * deterministic for its input: fixed starts, a fixed order of variables and no
   * random draw. A target outside the digit's workspace is fitted as nearly as
   * this constrained local solve reaches it. With `rate` it fits the eased target
   * instead, so its constrained minimum may differ from the original target's. In
   * either case `residual` reports distance to the original target, including any
   * reach traded away, so a caller refuses or accepts by its own bound.
   *
   * @param input The rig, the posed body, the digit's joints and the effector and
   *   target.
   * @returns The digit's fitted joints, the effector's world point and the
   *   residual.
   * @throws {Error} When the digit names no joint, a bone cannot be resolved, or
   *   `rate` is not finite and positive.
   */
  export function fitDigitToTarget(input: IAutoMovieFitDigitToTarget.IInput): IAutoMovieFitDigitToTarget.IResult {
    return fitDigitToTargetImplementation(input);
  }

  /**
   * The feasible swivels of a chain's root joint: the intervals of the swivel its
   * limits leave, for a root whose bone-local rotation is a fixed rotation turned
   * about a fixed axis by the swivel (Tolani, Goswami and Badler 2000, section
   * 3.2.3: each joint limit maps to intervals of the swivel angle, and the
   * feasible swivels are their intersection).
   *
   * They are the complement of the arcs the root's range provably refuses: a
   * box's in either chart `decomposeJointRotationOnBasis` chooses between, so a
   * swivel either chart admits is feasible (`boxRefusedArcs`), and a swing-twist
   * gate's (`swingTwistRefusedArcs`). Every refusal is certain, so every legal
   * swivel lies in a feasible interval; a feasible interval may still hold
   * swivels the full score refuses, where a limit's analysis says less than the
   * range (a swing region's radius below its greatest, a box axis without an
   * interval). The intervals are closed form but for a swing cone, read per
   * one-degree piece (`boxRefusedArcs`).
   *
   * @param props The root joint and its rotation by swivel.
   * @returns The disjoint feasible arcs, degrees, each starting in [0, 360);
   *   every swivel when nothing is refused; none when every swivel is.
   */
  export function hingedSwivelFeasible(props: IAutoMovieBoxExcludedSwivels.IProps): IAutoMovieSwivelArcs.IArc[] | "all" {
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
  export function prepareArticulatedRig<Bone extends string>(rig: IAutoMovieArticulatedRig<Bone>): IAutoMovieArticulatedRigReader<Bone> {
    return prepareArticulatedRigImplementation<Bone>(rig);
  }

  /**
   * Validate a joint-axis basis and return it with unit-length axes, ready for
   * quaternion composition and decomposition.
   *
   * The axes must pass {@link validateJointAxesBasis}: non-zero and mutually
   * orthogonal, with a supported rotation order and compatible twist placement.
   * Otherwise the first issue is thrown as `<path> <expected>`, such as
   * `jointToQuaternion axes.twist must have non-zero length`. The result has unit
   * axes and any declared placement and rotation order; a rig prepares it once
   * and passes the basis to its per-pose readers.
   *
   * @param axes Basis to check; read, never modified.
   * @param path Diagnostic path prefix naming the caller's input.
   */
  export function normalizeJointAxes(axes: IAutoMovieJointAxes, path: string): IAutoMovieJointAxes {
    return normalizeJointAxesImplementation(axes, path);
  }

  /**
   * The arm pose, upper arm and forearm articulation, that brings the `side` hand
   * onto `target` in the skeleton's model space: the harness `reach` verb made
   * concrete with analytic hinge geometry and the original bounded swivel search
   * for its clinical range of motion.
   *
   * Segment offsets and the shoulder's rest frame come from the skeleton's rest
   * pose, and {@link hingedArmArticulation} solves the chain: the elbow turns only
   * about its own flexion axis, so its abduction and twist are zero as an elbow's
   * immobile axes require, and the shoulder spends the chain's exact swivel
   * freedom on staying inside the rig's declared range of motion. An unreachable
   * target extends the arm fully toward it, so the hand stops on the reachable
   * shell instead of failing. A target no legal pose reaches still returns the
   * least-overshoot pose, which the shot's ROM gate then reports.
   *
   * The angles are clinical, so `validatePose` can compare them with the ROM
   * table directly. The clinical axes and the rest frame are two halves of one
   * convention: this function applies {@link HUMANOID_JOINT_AXES} under any axes
   * the arm bones declare ({@link skeletonJointAxes}) and so defaults `restFrames`
   * to the matching {@link HUMANOID_REST_FRAME}. Pass a table for a rig with its
   * own rest convention, or `{}` for raw rest-relative angles.
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
  export function reachPose(skeleton: IAutoMovieSkeleton, side: "left" | "right", target: IAutoMovieVector3, restFrames?: Partial<
    Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>
  >): IAutoMoviePose | null {
    return reachPoseImplementation(skeleton, side, target, restFrames);
  }

  /**
   * What an impulse does to a standing body's balance (#3429): it absorbs it
   * within its base, catches it with capture steps, or falls.
   *
   * The impulse `J` changes the centre of mass's velocity to `v + J / m` and its
   * angular momentum about the centre by `(p - c) × J`. The body is a linear
   * inverted pendulum of length `l` with eigenfrequency `ω0 = sqrt(g / l)`, whose
   * extrapolated centre `ξ = x + v / ω0` must lie within the base of support for
   * the body to stay (Hof, Gazendam and Sinke 2005, J Biomech 38:1-8): inside the
   * support polygon, the body absorbs the push.
   *
   * Outside it, the body steps, the capture point `ξ` diverging from the centre
   * of pressure as the pendulum does, `d(t) = d0 exp(ω0 t)` (the capture point of
   * Pratt, Carff, Drakunov and Goswami 2006, as the stepping literature states
   * it): until the first foot lands, `first` after the impulse, the centre of
   * pressure is held at the base's edge along the lead, so `d0` is the capture
   * point's distance beyond that edge. A foot lands at most `reach` (a leg
   * length, as `stagger` reaches) beyond the last centre of pressure and catches
   * the capture point within its half length, `margin`; one that falls short
   * moves the centre of pressure to its front edge, `reach + margin` on, and
   * leaves the rest to diverge over the next swing, `step`: `d_{k+1} = (d_k -
   * reach - margin) exp(ω0 step)`. The recurrence shrinks to a catch exactly when
   * the first landing's distance is below its fixed point `d* = (reach + margin)
   * a / (a - 1)`, `a = exp(ω0 step)`, the infinite-step capture distance in the
   * framework of Koolen, de Boer, Rebula, Goswami and Pratt 2012
   * ("Capturability-based analysis and control of legged locomotion, Part 1", Int
   * J Robot Res 31(9)); at or past it no number of steps catches the body and it
   * falls. Both papers are located, not yet read at the source; the recurrence is
   * derived here from the linear inverted pendulum's divergence. The steps are
   * laid along the lead from the base's edge.
   *
   * The bounds are the impulse magnitudes along the push's horizontal direction
   * at which the outcome changes: `m ω0 b` to leave the base, with `b` the
   * distance from the current extrapolated centre to the base's edge along the
   * push, and `m ω0 (e + d* exp(-ω0 first) - lead)` to leave the capture region,
   * with `e` the centre's distance to the base's edge along the push and `lead`
   * the current extrapolated centre's distance from the centre.
   *
   * - @param props The body's state, the impulse and the support.
   *
   * @returns The outcome, the steps and the bounds.
   * @throws {Error} When the mass, the length, the reach or the step time is not
   *   positive, the margin is not finite, or there is no support point.
   */
  export function resolveAutoMovieBalanceOutcome(props: IAutoMovieResolveBalanceOutcome.IProps): IAutoMovieResolveBalanceOutcome.IOutcome {
    return resolveAutoMovieBalanceOutcomeImplementation(props);
  }

  /**
   * Instantaneous centroidal momentum from actual bone-origin rates.
   *
   * The model, posed parts, bones and rates must describe the same instant and
   * the same unchanged mass model, in one common frame. Bone linear rates are
   * metres per second and angular rates radians per second in that frame. Parts
   * and their centre come from the existing mass-model pose owner; principal axes
   * retain that owner's actual principal-to-common rotation. A part's centre
   * moves at `v_bone + omega_bone cross (c_part - p_bone)`. The result has the
   * existing momentum shape, with centre and rates at this instant rather than at
   * the middle of a finite interval.
   *
   * Every part remains present, including zero-mass parts whose intrinsic inertia
   * can still contribute spin under the existing mass-model contract. The whole
   * body needs finite positive mass. Inputs are borrowed for this synchronous
   * reduction, and every returned vector is fresh. This function does not replace
   * the two-pose momentum API or certify callback derivatives.
   *
   * @param model The same ordered SI mass model that produced posed.
   * @param posed Its rigid parts and mass-weighted centre at this instant.
   * @param bones The actual common-frame bone poses used to produce posed.
   * @param rates Actual common-frame origin and angular derivatives of bones.
   * @returns Instantaneous centre, centre velocity and linear/angular momentum.
   * @throws {Error} When mass, rates or results are nonfinite, total mass is not
   *   positive, part count/masses do not match, or a segment's bone/rate is
   *   missing.
   */
  export function resolveAutoMovieMomentumRates(model: IAutoMovieResolveCenterOfMass.IModel, posed: resolveAutoMovieMomentum.IPosed, bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>, rates: ReadonlyMap<AutoMovieHumanoidBone, resolveAutoMovieBoneRates.IRate>): IAutoMovieBodyMomentum {
    return resolveAutoMovieMomentumRatesImplementation(model, posed, bones, rates);
  }

  /**
   * The rigid ring modules of a humanoid body, each a short stack of eight-sided
   * sections around one joint's segment, from the rest skeleton alone: joint
   * positions, tips and girth radii.
   *
   * This is the one statement of the body's simple solid form. The polygon
   * drawing lofts a mesh through each module's rings and the physical profile
   * takes the convex hull of the same ring points as that segment's collider, so
   * what is seen and what collides cannot drift apart.
   *
   * The skeleton is in the Human frame at rest: +X forward, +Y up, +Z left,
   * metres. The trunk's modules share their boundary rings (pelvis floor, hip,
   * waist, chest, shoulder, neck base), widened to the hip and shoulder joint
   * spans; the neck runs from the neck joint to the head joint; the head widens
   * to its girth and closes on a pole at its tip; a palm runs from the wrist
   * toward the mean of the four finger roots as far as the farthest of them, so
   * no knuckle is bare beyond it; a foot is two modules through the subtalar and
   * midfoot joints to the toe roots; every other segment is three round rings
   * from its joint to its end, narrowing to the next segment or bevelled at a
   * leaf. Shoulder, scapula, foot, eye, jaw and atlas joints drive others and
   * carry no module.
   *
   * @param bones The rest joints, parent before child, in the Human frame.
   * @returns The modules in drawing order: hips, spine, head, chest, neck, each
   *   side's hand and two foot modules, then every remaining segment in joint
   *   order.
   * @throws {Error} When a joint a module is built from is missing.
   */
  export function resolveAutoMovieHumanoidRingModules(bones: readonly IAutoMovieResolveHumanoidRingModules.IBone[]): IAutoMovieResolveHumanoidRingModules.IModule[] {
    return resolveAutoMovieHumanoidRingModulesImplementation(bones);
  }

  /**
   * The tip and the pad of every digit of both hands, as bone-local frames on
   * each digit's distal phalanx.
   *
   * A digit's tip is where a ray from its last joint, along its distal phalanx
   * (the line from the joint before it), leaves the phalanx's colliders, with the
   * exited collider's outward normal: the index fingertip as
   * `resolveAutoMovieHumanoidSurfaces` has always placed it, now for every digit.
   * Its pad is the palmar face of the same phalanx: where a ray from the middle
   * of the phalanx, between the last joint and the tip, leaves the colliders
   * toward the palm's side. The palm faces -Y in the canonical rest
   * (`HUMANOID_REST_FRAME`), so the palmar direction is -Y made perpendicular to
   * the phalanx; the rig's thumb lies in the palm's plane with its nail up, so
   * its pad faces the same side. A profile with no segment for a phalanx reads
   * the hand's colliders instead, as the index tip did.
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
  export function autoMovieHumanoidDigitSurfaces(rays: Pick<IAutoMovieHumanoidSurfaceReader, "at" | "local" | "surface">, profile: IAutoMoviePhysicalProfile): Partial<Record<AutoMovieHumanoidRegion, IAutoMovieHumanoidSurfaces.IFrame>> {
    return AutoMovieHumanoidDigitSurfacesImplementation(rays, profile);
  }

  /**
   * The extent of every region of a body: the radius of the disc about the
   * region's point that is still that region, read from the body's own rest pose.
   * A named region of the skin reaches until the next one begins, so its disc
   * reaches half way to the nearest other region that faces the same way (two
   * discs overlap on the surface only where they face it from one side, so a palm
   * and the back of the same hand, a chest and an upper back, are never each
   * other's bound), and no farther than half its segment's least breadth, so the
   * disc stays on the face of the segment it lies on (a forearm's disc does not
   * wrap round to the arm's other side). No region is smaller than the 10 mm a
   * pressed skin gives, the contact tolerance a hand on it is read against.
   */
  export function autoMovieHumanoidSurfaceExtents(regions: Readonly<
    Record<AutoMovieHumanoidRegion, IAutoMovieHumanoidSurfaces.IFrame>
  >, at: (bone: AutoMovieHumanoidBone) => IAutoMovieResolvedBone, bounds: IAutoMovieHumanoidSurfaceExtents.ReadBounds): Record<AutoMovieHumanoidRegion, number> {
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
   * validated here: `validateModel` admits them, and `normalizeJointAxes` throws
   * on a malformed basis where it is used.
   *
   * @param skeleton Rig whose bones may declare axes.
   * @param jointAxes Host table for the bones that declare none.
   */
  export function skeletonJointAxes(skeleton: IAutoMovieSkeleton, jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>): Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> {
    return skeletonJointAxesImplementation(skeleton, jointAxes);
  }

  /**
   * The closed-form angles of a two-segment chain whose tip reaches a goal at
   * straight-line `distance` from its root, by the law of cosines.
   *
   * `bend` is the interior angle at the mid joint, 180 straight and smaller as
   * the chain folds; `lift` is the angle between the upper segment and the
   * root-to-goal line. The caller orients the chain toward the goal and turns the
   * mid joint and the root by these angles. A distance below `|upper − lower|` or
   * above `upper + lower` is clamped to that bound and `clamped` is set, so the
   * chain fully folds or extends instead of producing `NaN`. When both segments
   * are equal and the goal is at the root, `lift` is 0.
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
  export function solveTwoBoneIK(upper: number, lower: number, distance: number): IAutoMovieTwoBoneIK {
    return solveTwoBoneIKImplementation(upper, lower, distance);
  }

  /**
   * Every reason a joint-axis basis cannot serve the clinical angle conversions,
   * as located issues; an empty list means the basis is usable.
   *
   * Each axis must have finite components and a length above `1e-9`; it need not
   * be unit length, because {@link normalizeJointAxes} normalizes after this
   * check. When all three axes have a direction, each pair must be orthogonal
   * within an absolute cosine of `1e-6`, so the clinical angles form a real basis
   * instead of silently skewing forward or inverse kinematics. A declared
   * `twistPlacement` must be `"proximal"` or `"distal"`. The only explicit
   * `rotationOrder` is `"flexion-abduction-twist"`, which permits omitted or
   * distal twist placement. Issues are listed in that order, each with a path
   * under `path` such as `<path>.twist.y`.
   *
   * @param axes Basis to check; read, never modified.
   * @param path Diagnostic path prefix naming the caller's input.
   */
  export function validateJointAxesBasis(axes: IAutoMovieJointAxes, path: string): IAutoMovieJointAxesIssue[] {
    return validateJointAxesBasisImplementation(axes, path);
  }

  /**
   * Turn a body's balance at one instant into inspection marks: the centre of
   * mass, or the extrapolated centre the caller balances on, as a point, and the
   * base of support as the polygon around the support points on the floor plane.
   *
   * The base of support is the convex hull of the support points in the
   * horizontal XZ plane, as `resolveAutoMovieCenterOfMass.margin` measures
   * balance on it, drawn as a closed polyline through the hull's points at their
   * own heights; one support point is drawn as a point and two as a segment. The
   * centre is flagged when its margin of stability on that base is negative, that
   * is when it lies outside the base.
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
   *   centre of mass of `resolveAutoMovieCenterOfMass.place`, or its
   *   extrapolation by `resolveAutoMovieCenterOfMass.extrapolate` (Hof 2005).
   * @param props.support The support contact points, world metres.
   * @returns The centre's mark, then the base's.
   */
  export function markAutoMovieBalance(props: IAutoMovieMarkBalance.IProps): IAutoMovieMark[] {
    return markAutoMovieBalanceImplementation(props);
  }

  /**
   * Turn joints' range-of-motion overshoot at one instant into flagged inspection
   * marks at the joints that exceed their range.
   *
   * Each entry is a joint's path, its world position in metres and its overshoot
   * in degrees, as `jointRomOvershoot` measures it. A joint with a positive
   * overshoot, or an unmeasurable one (`Infinity`), becomes one flagged point of
   * kind `rom`, label `range overshoot`, colour olive drab `556b2f`, at path
   * `<path>/rom`; a joint within its range draws nothing. The mark is in world
   * metres and unanchored.
   *
   * It throws for a position that is not finite or an overshoot that is negative
   * or NaN.
   *
   * @param entries Joints with their world positions and measured overshoots.
   * @returns One flagged mark per joint past its range, in the entries' order.
   */
  export function markAutoMovieRomOvershoot(entries: IAutoMovieMarkRomOvershoot.IEntries): IAutoMovieMark[] {
    return markAutoMovieRomOvershootImplementation(entries);
  }

  /**
   * The swivels at which the end joint of a chain whose mid segment twists
   * distally (a wrist beyond a forearm) cannot take a requested rotation inside
   * its range, as arcs in closed form.
   *
   * The end joint's two free angles are read off where the mid segment points in
   * the requested rotation's frame (`distalEndSwivelReadings` states the
   * derivation): the abduction by its sine `-d_flexion`, the flexion by the
   * vector `(d_abduction, d_twist)`, every component a sinusoid of the swivel.
   * Each bound of the joint's box therefore refuses the arc where its sinusoid
   * exceeds the margin (`swivelArcs`), as `boxExcludedSwivels` reads a root
   * joint's box.
   *
   * The arcs say nothing of the mid segment's own twist range: the twist the
   * request leaves it is not a sinusoid of the swivel, though where it meets an
   * end of its range is (`distalTwistSwivelRange`), and the swivel chosen is the
   * caller's to verify.
   *
   * @param props The end joint, the mid segment's direction by swivel and the
   *   margin.
   * @returns The refused arcs merged over a turn, every swivel, or null when the
   *   analysis does not apply (`distalEndSwivelReadings.of`).
   */
  export function distalEndSwivelArcs(props: distalEndSwivelReadings.IProps & {
    /**
     * How far past a bound, in sine or projected units, a reading must lie to
     * be refused; negative keeps the result strictly inside.
     */
    margin: number;
  }): IAutoMovieSwivelArcs.IArc[] | "all" | null {
    return distalEndSwivelArcsImplementation(props);
  }

  /**
   * A certified lower bound, over an interval of swivels, of how far the end
   * joint of a chain whose mid segment twists distally (a wrist beyond a forearm)
   * must miss a requested rotation, degrees.
   *
   * Whatever twist the mid segment takes and wherever in its box the end joint
   * stands, the rotation the chain shows carries the mid segment's world axis `u`
   * to `d(f, a) = (-sin a, cos a sin f, cos a cos f)` in the end joint's basis,
   * with `(f, a)` inside the box (`distalEndSwivelReadings`), while the requested
   * rotation carries it to `x(s)`, the direction the readings give at swivel `s`.
   * A rotation by an angle moves no unit vector by more than that angle, so the
   * angle between the shown and the requested rotation is at least the angle from
   * `x(s)` to the nearest `d(f, a)` of the box: the spherical distance from a
   * point to a rectangle of latitudes (abduction) and longitudes (flexion) about
   * the flexion axis. Inside the rectangle's longitudes that distance is the
   * abduction's excess past its interval; outside them the nearest point lies on
   * one of the two bounding meridians, where the direction's cosine with the
   * meridian point of abduction `a` is `-x_f sin a + c cos a`, `c = x_a sin e +
   * x_t cos e`, greatest at the abduction nearest `atan2(-x_f, c)`.
   *
   * `x(s)` circles an axis as the swivel turns, on a circle whose radius is the
   * norm of its sinusoids' cosine (or sine) coefficients, so it moves by at most
   * that radius per unit of swivel and the distance, which changes by no more
   * than its point moves, is bounded over an interval by its value at the middle
   * less the radius times the half width.
   *
   * The bound is lowered by the joints' tolerance (`ROM_TOLERANCE`), within which
   * a projection onto the box may stand past its ends, so it stays below every
   * miss it bounds.
   *
   * @param props The end joint and the mid segment's direction by swivel.
   * @returns The bound over `low` to `high` degrees, never negative; null when
   *   the analysis does not apply (`distalEndSwivelReadings.of`).
   */
  export function distalEndSwivelMiss(props: distalEndSwivelReadings.IProps): ((low: number, high: number) => number) | null {
    return distalEndSwivelMissImplementation(props);
  }

  /**
   * The swivel nearest a desired one at which a chain whose mid segment twists
   * distally (an arm) can take a requested end rotation: outside the arcs its end
   * joint's box refuses (`distalEndSwivelArcs`) and where the twist the rotation
   * leaves the mid segment lies inside its range (`distalTwistSwivelRange`).
   *
   * The admissible swivels are a union of intervals whose ends are the refused
   * arcs' ends and the twist range's breakpoints, so the admissible swivel
   * nearest the desired one is the desired one itself or one of those ends: each
   * is tested, a breakpoint a step of `APART` either side of itself since the
   * admission changes there, and the nearest admitted is returned (the admissible
   * swivel nearest the desired one, Tolani, Goswami and Badler 2000, section
   * 3.2.4). When none is admitted (no swivel lets the joints take the rotation
   * exactly, or the twist analysis is not given) the result is the swivel outside
   * the refused arcs nearest the desired one, the candidate the box alone gives.
   * The caller verifies the returned swivel by its own score.
   *
   * @param arcs The swivels the end joint's box refuses, merged
   *   (`swivelArcs.union`), or every swivel.
   * @param range The twist range's breakpoints and admission; null when that
   *   analysis does not apply.
   * @param desired The desired swivel, degrees.
   * @returns The swivel, degrees in any turn; null when the box refuses every
   *   swivel.
   */
  export function distalEndSwivelNearest(arcs: readonly IAutoMovieSwivelArcs.IArc[] | "all", range: distalTwistSwivelRange.IRange | null, desired: number): number | null {
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
   * (`swivelJointReadings`): the middle angle `asin(s)` is neutral where `s - sin
   * n` vanishes, and an outer angle `atan2(y, x)` is neutral, in the principal
   * chart or the alternate one a half turn on, where `y cos n - x sin n`
   * vanishes. There are at most two such swivels (`swivelArcs.roots`), Tolani,
   * Goswami and Badler's analytic treatment of a joint limit as a function of the
   * swivel (2000, Graphical Models 62).
   *
   * The roots are candidates, not certificates: the joint's two free axes may
   * still lie outside their intervals there, and a reading inside the
   * decomposition's gimbal band is pinned instead, so the caller scores each and
   * keeps a candidate only when its own measure finds the rotation met.
   *
   * @param props The joint and the rotation demanded of it by swivel.
   * @returns The candidate swivels, degrees in [0, 360), none when the axis never
   *   reads neutral; null when the joint has no range, a swing-twist gate, or not
   *   exactly one immobile axis, so this analysis does not apply.
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
}
