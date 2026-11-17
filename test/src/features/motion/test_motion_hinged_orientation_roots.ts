import {
  DEFAULT_JOINT_AXES,
  type IAutoMovieResolvedBone,
  type IAutoMovieSeededChainFit,
  type IFitChainToTargetProps,
  Quaternion,
  ROM_TOLERANCE,
  Vector3,
  fitSeededChainToTarget,
  hingedArmSwivel,
  indexSkeletonTopology,
  resolvePose,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { qclose } from "../internal/qclose";
import { throwsError } from "../internal/throwsError";
import { vclose } from "../internal/vclose";

/**
 * Public prepared continuation must actually use the eligible orientation-root
 * dispatcher before its ordinary near/cold fallback, while preserving actual
 * endpoint, orientation, legal joint bounds and the requested knee hemisphere.
 *
 * Scenarios:
 * 1. A non-distal 0.4 m + 0.4 m leg with authored rotations -30, 60 and
 *    -30 degrees has a vertical ankle, a knee 0.2 m forward and an identity
 *    world foot. A 0.25-degree near offset must try and accept one analytic
 *    root, with no near/cold attempt; full FK checks the independent geometry.
 * 2. An explicit zero reference weight and a distal lower axis each decline
 *    the narrow policy and actually attempt near fitting. A negative weight
 *    retains its original finite/nonnegative admission error.
 * 3. Each of two symmetric orientation roots must be individually accepted
 *    from its own nearby seed and pass physical checks. Their midpoint is
 *    ambiguous; neither may be reported accepted before ordinary near fallback.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the non-distal fixture, independent authored geometry, actual dispatcher events, physical bounds and unsupported/ambiguous fallback cases.
 * @evidence contracts/development/testing.md#behavioral-verification Exercises only public fitSeededChainToTarget.prepare(...).continued and resolvePose. Actual event counts distinguish the new dispatcher from a test that passes through ordinary near fitting alone; output FK, rotation, ROM and knee side still decide physical correctness.
 * @evidence contracts/development/testing.md#independent-expectations The leg triangle follows two 0.4 m segments rotated -30 and +30 degrees in the world: ankle y=1-0.8*cos(30 degrees), knee z=0.2 m and composed foot rotation identity. Expected limits are the fixture's declared boxes, endpoint error is below 1e-7 m and orientation uses the existing ROM_TOLERANCE. The ambiguity case derives its two roots from an independent trigonometric equation, rather than reading producer candidates. Fallback events establish dispatch, not global optimality or an orientation guarantee for an ambiguous solve.
 * @evidence contracts/development/testing.md#distinguishing-cases A genuinely eligible non-distal leg must accept the root path; explicit reference weight, its invalid adjacent value and a distal axis must not enter it. Each symmetric root first proves individually eligible and physically legal through the actual public dispatcher, so their midpoint fallback cannot pass merely because both roots were rejected. Two equally near legal roots must decline instead of silently choosing one. Existing workspace and Human suites own full source admission, arbitrary rigs, contact composition and playback.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable exported in-memory engine unit uses owned skeleton/pose records, public FK and a real optional per-call observer. It starts no host, process, viewer, renderer or GPU and replaces no method or global.
 */
export function test_motion_hinged_orientation_roots(): void {
  const failures: string[] = [];

  /** Retain this inspection round's independent assertions before reporting. */
  const check: (label: string, valid: boolean) => void = (
    label: string,
    valid: boolean,
  ): void => {
    if (!valid) failures.push(label);
  };
  const fixture: IFixture = leg(false);
  const events: string[] = [];
  const workspace: fitSeededChainToTarget.IWorkspace =
    fitSeededChainToTarget.prepare(fixture.source);
  const fitted: IAutoMovieSeededChainFit = workspace.continued(
    fixture.target,
    { branch: 0, swivel: 0.25, tolerance: ROM_TOLERANCE },
    (event: string): void => { events.push(event); },
  );
  check("eligible leg actually tries and accepts one orientation root",
    count(events, "orientationRootTrial") === 1 &&
    count(events, "orientationRootAccepted") === 1 &&
    count(events, "nearAttempt") === 0 && count(events, "coldAttempt") === 0);
  physical(fixture, fitted, check, true, true);
  check("isolated zero swivel stays on branch zero and inside the near bracket",
    fitted.seed !== null && fitted.seed.branch === 0 &&
    nclose(fitted.seed.swivel, 0, ROM_TOLERANCE) &&
    Math.abs(fitted.seed.swivel - 0.25) < hingedArmSwivel.STEP);

  // Unsupported inputs must be observable fallbacks, even when the old fit
  // reaches exactly the same physical pose as the orientation-root policy.
  for (const mode of ["weight", "distal"] as const) {
    const other: IFixture = mode === "distal" ? leg(true) : fixture;
    const source: IFixture["source"] = mode === "weight"
      ? { ...other.source, referenceWeight: 0 } : other.source;
    const observed: string[] = [];
    const result: IAutoMovieSeededChainFit = fitSeededChainToTarget.prepare(source).continued(
      other.target, { branch: 0, swivel: 0.25, tolerance: ROM_TOLERANCE },
      (event: string): void => { observed.push(event); },
    );
    check(`${mode}: unsupported policy actually attempts near fallback`,
      count(observed, "orientationRootTrial") === 0 &&
      count(observed, "orientationRootAccepted") === 0 &&
      count(observed, "nearAttempt") === 1);
    physical(other, result, check, true, false);
  }
  const invalid: string[] = [];
  check("unsupported negative reference weight preserves original admission",
    throwsError((): IAutoMovieSeededChainFit => fitSeededChainToTarget.prepare({
      ...fixture.source, referenceWeight: -1,
    }).continued(fixture.target,
      { branch: 0, swivel: 0.25, tolerance: ROM_TOLERANCE },
      (event: string): void => { invalid.push(event); }), "non-negative") &&
    count(invalid, "orientationRootTrial") === 0 && count(invalid, "nearAttempt") === 1);

  ambiguous(fixture, check);
  TestValidator.predicate(failures.join("; ") || "orientation-root continuation", failures.length === 0);
}

/** Independent dimensions, declared bounds and exact current goal of one leg. */
interface IFixture {
  /** Owned source whose three chain joints are an independently authored legal pose. */
  source: Omit<IFitChainToTargetProps, "target">;
  /** Analytic model-metre ankle point, never a fitted endpoint. */
  target: IAutoMovieVector3;
  /** Analytic knee point of the isolated root. */
  knee: IAutoMovieVector3;
}

/** Build a plain-box leg; distal changes only the real lower-axis convention. */
function leg(distal: boolean): IFixture {
  const lowerAxes: IAutoMovieJointAxes = distal
    ? { ...DEFAULT_JOINT_AXES, twistPlacement: "distal" } : DEFAULT_JOINT_AXES;
  const broad: IAutoMovieJointConstraint = {
    flexion: { min: -120, max: 120 }, abduction: { min: -120, max: 120 },
    twist: { min: -120, max: 120 },
  };
  const knee: IAutoMovieJointConstraint = {
    flexion: { min: -150, max: 150 }, abduction: null, twist: null,
  };
  const foot: IAutoMovieJointConstraint = {
    flexion: { min: -120, max: 120 }, abduction: { min: -120, max: 120 }, twist: null,
  };

  /** Rest translations give a vertical 0.4 m thigh and 0.4 m shank. */
  const bone: (name: AutoMovieHumanoidBone, parent: AutoMovieHumanoidBone | null,
    y: number, constraint: IAutoMovieJointConstraint, axes: IAutoMovieJointAxes) => IAutoMovieBone = (
    name: AutoMovieHumanoidBone, parent: AutoMovieHumanoidBone | null,
    y: number, constraint: IAutoMovieJointConstraint, axes: IAutoMovieJointAxes,
  ): IAutoMovieBone => ({
    bone: name, parent, axes, constraint,
    rest: { translation: { x: 0, y, z: 0 }, rotation: Quaternion.identity(),
      scale: { x: 1, y: 1, z: 1 } },
  });
  const skeleton: IAutoMovieSkeleton = {
    id: "orientation-root-leg",
    bones: [
      bone("hips", null, 1, broad, DEFAULT_JOINT_AXES),
      bone("leftUpperLeg", "hips", 0, broad, DEFAULT_JOINT_AXES),
      bone("leftLowerLeg", "leftUpperLeg", -0.4, knee, lowerAxes),
      bone("leftFoot", "leftLowerLeg", -0.4, foot, DEFAULT_JOINT_AXES),
    ],
  };
  const pose: IAutoMoviePose = {
    skeleton: skeleton.id, root: null,
    joints: [
      { bone: "leftUpperLeg", flexion: -30, abduction: 0, twist: 0 },
      { bone: "leftLowerLeg", flexion: 60, abduction: 0, twist: 0 },
      { bone: "leftFoot", flexion: -30, abduction: 0, twist: 0 },
    ],
  };
  const cosine: number = Math.cos(Math.PI / 6);
  return {
    source: {
      skeleton, pose, topology: indexSkeletonTopology(skeleton),
      chain: { upper: "leftUpperLeg", lower: "leftLowerLeg", effector: "leftFoot" },
      bend: { x: 0, y: 1, z: 1 }, effectorRotation: Quaternion.identity(),
    },
    target: { x: 0, y: 1 - 0.8 * cosine, z: 0 },
    knee: { x: 0, y: 1 - 0.4 * cosine, z: 0.2 },
  };
}

/** Count actual dispatcher observations; their counters never choose the solver. */
function count(events: readonly string[], wanted: string): number {
  return events.filter((event: string): boolean => event === wanted).length;
}

/** Full public FK and declared scalar boxes independently observe a returned pose. */
function physical(fixture: IFixture, fitted: IAutoMovieSeededChainFit,
  check: (label: string, valid: boolean) => void,
  oriented: boolean, isolated: boolean): void {
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map(
    resolvePose(fitted.pose, fixture.source.skeleton).map(
      (bone: IAutoMovieResolvedBone): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [bone.bone, bone],
    ),
  );
  const hip: IAutoMovieResolvedBone = bones.get("leftUpperLeg")!;
  const knee: IAutoMovieResolvedBone = bones.get("leftLowerLeg")!;
  const foot: IAutoMovieResolvedBone = bones.get("leftFoot")!;
  const residual: number = Vector3.distance(foot.worldPosition, fixture.target);
  check("actual FK reaches the independently specified ankle",
    nclose(residual, 0, 1e-7) && residual < 1e-7);
  check("actual thigh and shank retain their declared 0.4 m lengths",
    nclose(Vector3.distance(hip.worldPosition, knee.worldPosition), 0.4, 1e-12) &&
    nclose(Vector3.distance(knee.worldPosition, foot.worldPosition), 0.4, 1e-12));
  check("actual knee stays on the requested forward hemisphere", knee.worldPosition.z > 0);
  if (isolated)
    check("isolated legal root has the independently specified knee", vclose(knee.worldPosition, fixture.knee, 1e-7));
  if (oriented) {
    const goal: IAutoMovieQuaternion = Quaternion.normalize(fixture.source.effectorRotation!);
    const dotTolerance: number = 1 - Math.cos(ROM_TOLERANCE * Math.PI / 360);
    check("actual world foot reaches its independently specified rotation",
      qclose(Quaternion.normalize(foot.worldRotation), goal, dotTolerance + Number.EPSILON) &&
      Quaternion.angleAfterNormalize(foot.worldRotation, goal) * 180 / Math.PI <= ROM_TOLERANCE);
  }
  for (const joint of fitted.pose.joints) {
    const limit: number = joint.bone === "leftLowerLeg" ? 150 : 120;
    check(`${joint.bone}: flexion respects the declared box`,
      Number.isFinite(joint.flexion ?? 0) && Math.abs(joint.flexion ?? 0) <= limit + ROM_TOLERANCE);
    check(`${joint.bone}: abduction respects the declared box`,
      Number.isFinite(joint.abduction ?? 0) &&
      Math.abs(joint.abduction ?? 0) <= (joint.bone === "leftLowerLeg" ? ROM_TOLERANCE : 120 + ROM_TOLERANCE));
    check(`${joint.bone}: twist respects the declared box`,
      Number.isFinite(joint.twist ?? 0) && Math.abs(joint.twist ?? 0) <=
      (joint.bone === "leftUpperLeg" ? 120 + ROM_TOLERANCE : ROM_TOLERANCE));
  }
}

/** A symmetric two-root family must be reported as a decline before near fallback. */
function ambiguous(fixture: IFixture, check: (label: string, valid: boolean) => void): void {
  const halfSeparation: number = 0.5 * Math.PI / 180;
  const roll: number = -Math.atan(Math.cos(halfSeparation) / Math.tan(Math.PI / 6));
  const sine: number = Math.SQRT1_2 * Math.sin(roll / 2);
  const cosine: number = Math.SQRT1_2 * Math.cos(roll / 2);

  // With h=30 degrees, the legal foot family has determinant proportional to
  // cos(h)*cos(roll)*cos(psi)+sin(h)*sin(roll). This choice sets its zeros at
  // +/-0.5 degrees. Equal repeated components represent Ry(90)*Rz(roll)
  // directly and preserve the family's reflection symmetry in the input.
  const goal: IAutoMovieQuaternion = { x: sine, y: cosine, z: sine, w: cosine };
  const source: IFixture["source"] = { ...fixture.source, effectorRotation: goal };
  const workspace: fitSeededChainToTarget.IWorkspace = fitSeededChainToTarget.prepare(source);

  // Prove that both roots are actual eligible, legal candidates before the
  // midpoint case asks the same dispatcher to decline their exact tie.
  for (const expected of [-0.5, 0.5]) {
    const observed: string[] = [];
    const fitted: IAutoMovieSeededChainFit = workspace.continued(
      fixture.target, { branch: 0, swivel: expected, tolerance: ROM_TOLERANCE },
      (event: string): void => { observed.push(event); },
    );
    check(`${expected}: its symmetric orientation root is individually accepted`,
      count(observed, "orientationRootTrial") >= 1 &&
      count(observed, "orientationRootTrial") <= 2 &&
      count(observed, "orientationRootAccepted") === 1 &&
      count(observed, "nearAttempt") === 0 && count(observed, "coldAttempt") === 0);
    check(`${expected}: the selected seed names that independent root`,
      fitted.seed !== null && fitted.seed.branch === 0 &&
      nclose(fitted.seed.swivel, expected, ROM_TOLERANCE) &&
      Math.abs(fitted.seed.swivel - expected) < hingedArmSwivel.STEP);
    physical({ ...fixture, source }, fitted, check, true, false);
  }
  const events: string[] = [];
  const result: IAutoMovieSeededChainFit = workspace.continued(
    fixture.target, { branch: 0, swivel: 0, tolerance: ROM_TOLERANCE },
    (event: string): void => { events.push(event); },
  );
  check("two symmetric in-bracket roots are actually tried before ambiguity fallback",
    count(events, "orientationRootTrial") === 2 &&
    count(events, "orientationRootAccepted") === 0 && count(events, "nearAttempt") === 1);
  physical({ ...fixture, source }, result, check, false, false);
}
