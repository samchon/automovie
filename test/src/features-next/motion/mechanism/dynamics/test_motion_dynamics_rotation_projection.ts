import {
  DEFAULT_JOINT_AXES,
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  Quaternion,
  ROM_TOLERANCE,
  Vector3,
  clampJointToSkeleton,
  fitChainToTarget,
  fitHingedRotationError,
  fitSeededChainToTarget,
  hingedArmSwivel,
  indexSkeletonTopology,
  jointToQuaternionOnBasis,
  normalizeJointAxes,
  prepareChainPlant,
  resolvePose,
  solveDistalTwist,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieFitChainToTargetProps,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieSeededChainFit,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { joint } from "../../../../features/internal/joint";
import { jointRotationOracle as O } from "../../../../features/internal/jointRotationOracle";
import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { nclose } from "../../../../features/internal/nclose";
import { qclose } from "../../../../features/internal/qclose";
import { throwsError } from "../../../../features/internal/throwsError";
import { vclose } from "../../../../features/internal/vclose";

/**
 * Projection onto a bounded hinge discards the perpendicular rotation and clips the requested flexion.
 *
 * Scenarios:
 * 1. Project an off-axis quaternion onto a bounded hinge.
 * 2. Recompose the selected lower and effector frames and independently check two orientation roots.
 * 3. Compare mirrored clinical twists on bent and straight arms.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Recompose world rotation from the selected lower and effector frames, resolve the fitted hinge endpoint and reflect the requested hand frame across the median plane.
 * @evidence contracts/development/testing.md#independent-expectations The hinge dot is proportional to cos((75°−angle)/2) and peaks at the 40° limit. Collinear turns add: fixed 20° and 15° rotations leave a 30° residual when a 120° turn clips to 90°. Reflection preserves the clinical angles of a mirrored arm.
 * @evidence contracts/development/testing.md#distinguishing-cases Compare signed limits with interior turns, unique roots with an equal-distance tie, retained output with mutable clamp records, and bent arms with a full-reach swivel degeneracy.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_rotation_projection(): void {
  pairedProjection();
  hingeRoots();
  mirroredLimb();
  const checks: O.IChecks = O.of();
  const rig: O.IRig = O.rig({
    flexion: { min: -25, max: 40 },
    abduction: null,
    twist: null,
  });
  const target: IAutoMovieQuaternion = Quaternion.multiply(
    Quaternion.fromAxisAngle(O.CANONICAL.flexion, 75),
    Quaternion.fromAxisAngle(O.CANONICAL.abduction, 60),
  );
  const expected: IAutoMovieQuaternion = O.compose([40, 0, 0], rig);
  checks.run(
    "off-axis target projects to hinge boundary",
    rig,
    target,
    expected,
  );
  checks.run(
    "antipodal target",
    rig,
    { x: -target.x, y: -target.y, z: -target.z, w: -target.w },
    expected,
  );
  checks.assert();
}

function pairedProjection(): void {
  const lowerBasis: IAutoMovieJointAxes = normalizeJointAxes(
    {
      flexion: { x: 1, y: 0, z: 0 },
      abduction: { x: 0, y: 1, z: 0 },
      twist: { x: 0, y: 0, z: 1 },
      twistPlacement: "distal",
    },
    "paired distal lower basis",
  );
  const effectorBasis: IAutoMovieJointAxes = normalizeJointAxes(
    {
      flexion: { x: 1, y: 0, z: 0 },
      abduction: { x: 0, y: 1, z: 0 },
      twist: { x: 0, y: 0, z: 1 },
    },
    "paired distal effector basis",
  );
  const lowerConstraint: IAutoMovieJointConstraint = {
    flexion: { min: 0, max: 0 },
    abduction: null,
    twist: { min: -90, max: 90 },
  };
  const effectorConstraint: IAutoMovieJointConstraint = {
    flexion: null,
    abduction: null,
    twist: null,
  };
  const skeleton: IAutoMovieSkeleton = {
    id: "paired-distal-rig",
    bones: [
      {
        bone: "leftLowerArm",
        parent: null,
        axes: lowerBasis,
        constraint: lowerConstraint,
        rest: {
          translation: { x: 0, y: 0, z: 0 },
          rotation: turn(0),
          scale: { x: 1, y: 1, z: 1 },
        },
      },
      {
        bone: "leftHand",
        parent: "leftLowerArm",
        axes: effectorBasis,
        constraint: effectorConstraint,
        rest: {
          translation: { x: 0, y: 0, z: 1 },
          rotation: turn(15),
          scale: { x: 1, y: 1, z: 1 },
        },
      },
    ],
  };
  const fixed: solveDistalTwist.IPrepared = solveDistalTwist.prepare({
    effectorRest: turn(15),
    effectorBasis,
    effectorFrame: undefined,
  });
  const saved: solveDistalTwist.IResult[] = [];
  for (const [desired, expected] of [
    [45, 45],
    [120, 90],
    [-120, -90],
    [-30, -30],
    [45, 45],
  ] as const) {
    const result: solveDistalTwist.IResult = solveDistalTwist.withProjection({
      joint: joint("leftLowerArm", { flexion: 0, abduction: 0, twist: 0 }),
      effector: joint("leftHand", { flexion: 0, abduction: 0, twist: 0 }),
      above: turn(20),
      lowerBasis,
      lowerFrame: undefined,
      effectorRest: turn(15),
      effectorBasis,
      effectorFrame: undefined,
      rotation: turn(35 + desired),
      skeleton,
      preparedEffector: fixed,
    });
    TestValidator.predicate(
      "selected lower turn obeys actual ROM",
      nclose(result.joint.twist!, expected, 1e-8) &&
        result.joint.twist! >= -90 &&
        result.joint.twist! <= 90,
    );
    TestValidator.predicate(
      "retained projection belongs to the selected candidate",
      qclose(result.projection.local, turn(desired - expected), 1e-8) &&
        qclose(result.projection.quaternion, turn(0), 1e-12) &&
        result.projection.joint.bone === "leftHand" &&
        (result.projection.joint.flexion === null ||
          result.projection.joint.flexion === 0) &&
        (result.projection.joint.abduction === null ||
          result.projection.joint.abduction === 0) &&
        (result.projection.joint.twist === null ||
          result.projection.joint.twist === 0) &&
        qclose(
          jointToQuaternionOnBasis(result.projection.joint, effectorBasis),
          result.projection.quaternion,
          1e-12,
        ),
    );
    const lower: IAutoMovieQuaternion = jointToQuaternionOnBasis(
      result.joint,
      lowerBasis,
    );
    const shown: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.multiply(Quaternion.multiply(turn(20), lower), turn(15)),
      result.projection.quaternion,
    );
    TestValidator.predicate(
      "actual shown world orientation preserves the known residual",
      qclose(shown, turn(35 + expected), 1e-8) &&
        nclose(
          (Quaternion.angle(shown, turn(35 + desired)) * 180) / Math.PI,
          Math.abs(desired - expected),
          1e-6,
        ),
    );
    for (const previous of saved)
      TestValidator.predicate(
        "each query owns a fresh selected pair",
        result !== previous &&
          result.joint !== previous.joint &&
          result.projection !== previous.projection &&
          result.projection.joint !== previous.projection.joint &&
          result.projection.local !== previous.projection.local &&
          result.projection.quaternion !== previous.projection.quaternion,
      );
    saved.push(result);
  }
  saved[0]!.joint.twist = 123;
  saved[0]!.projection.local.w = 456;
  saved[0]!.projection.quaternion.x = 789;
  saved[0]!.projection.joint.flexion = 123;
  TestValidator.predicate(
    "earlier output mutation cannot alter the later same target",
    nclose(saved[4]!.joint.twist!, 45, 1e-8) &&
      qclose(saved[4]!.projection.local, turn(0), 1e-8) &&
      qclose(saved[4]!.projection.quaternion, turn(0), 1e-12),
  );
  foreignLower(skeleton, lowerBasis, effectorBasis, fixed);
  proximalScalars();
}

/** Foreign clamp return values are current borrowed records, without genuine immutable provenance. */
function foreignLower(
  skeleton: IAutoMovieSkeleton,
  lowerBasis: IAutoMovieJointAxes,
  effectorBasis: IAutoMovieJointAxes,
  prepared: solveDistalTwist.IPrepared,
): void {
  const actual: ReturnType<typeof clampJointToSkeleton.of> =
    clampJointToSkeleton.of("leftLowerArm", skeleton);
  const shared: ReturnType<typeof joint> = joint("leftLowerArm", {
    flexion: 0,
    abduction: 0,
    twist: 0,
  });
  const lower: typeof actual = (
    input: Parameters<typeof actual>[0],
  ): ReturnType<typeof actual> => Object.assign(shared, actual(input));
  for (const desired of [60, -30, 60]) {
    const result: solveDistalTwist.IResult = solveDistalTwist.withProjection({
      joint: joint("leftLowerArm", { flexion: 0, abduction: 0, twist: 0 }),
      effector: joint("leftHand", { flexion: 0, abduction: 0, twist: 0 }),
      above: turn(20),
      lowerBasis,
      lowerFrame: undefined,
      effectorRest: turn(15),
      effectorBasis,
      effectorFrame: undefined,
      rotation: turn(35 + desired),
      skeleton,
      preparedEffector: prepared,
      clamps: {
        lower,
        effector: clampJointToSkeleton.of("leftHand", skeleton),
      },
    });
    const shown: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.multiply(
        Quaternion.multiply(
          turn(20),
          jointToQuaternionOnBasis(result.joint, lowerBasis),
        ),
        turn(15),
      ),
      result.projection.quaternion,
    );
    TestValidator.predicate(
      "unknown clamp scratch output cannot replace a different probe's selected articulation",
      nclose(result.joint.twist!, desired, 1e-8) &&
        qclose(shown, turn(35 + desired), 1e-8) &&
        qclose(result.projection.local, turn(0), 1e-8) &&
        qclose(result.projection.quaternion, turn(0), 1e-12),
    );
  }
}

/** Read each actual candidate quaternion and commit only successful lower admission. */
function proximalScalars(): void {
  const basis: IAutoMovieJointAxes = normalizeJointAxes(
    {
      flexion: { x: 1, y: 0, z: 0 },
      abduction: { x: 0, y: 1, z: 0 },
      twist: { x: 0, y: 0, z: 1 },
      twistPlacement: "proximal",
    },
    "proximal candidate scalar basis",
  );
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const skeleton: IAutoMovieSkeleton = {
    id: "proximal-candidate-scalars",
    bones: [
      {
        bone: "leftUpperArm",
        parent: null,
        axes: basis,
        constraint: {
          flexion: { min: -180, max: 180 },
          abduction: { min: -180, max: 180 },
          twist: { min: -180, max: 180 },
        },
        rest: {
          translation: { x: 0, y: 0, z: 0 },
          rotation: { ...identity },
          scale: { x: 1, y: 1, z: 1 },
        },
      },
      {
        bone: "leftLowerArm",
        parent: "leftUpperArm",
        axes: basis,
        constraint: {
          flexion: { min: 0, max: 90 },
          abduction: null,
          twist: null,
        },
        rest: {
          translation: { x: 0, y: 0, z: 1 },
          rotation: { ...identity },
          scale: { x: 1, y: 1, z: 1 },
        },
      },
      {
        bone: "leftHand",
        parent: "leftLowerArm",
        axes: basis,
        constraint: { flexion: null, abduction: null, twist: null },
        rest: {
          translation: { x: 0, y: 0, z: 1 },
          rotation: { ...identity },
          scale: { x: 1, y: 1, z: 1 },
        },
      },
    ],
  };
  const props: IAutoMovieFitChainToTargetProps = {
    skeleton,
    pose: { skeleton: skeleton.id, root: null, joints: [] },
    chain: {
      upper: "leftUpperArm",
      lower: "leftLowerArm",
      effector: "leftHand",
    },
    target: { x: 0, y: 0, z: 2 },
    topology: indexSkeletonTopology(skeleton),
  };
  const prepared: ReturnType<typeof prepareChainPlant> =
    prepareChainPlant(props);
  TestValidator.predicate(
    "the cardinal source is an actual connected three-bone chain",
    prepared !== null,
  );
  if (prepared === null)
    throw new Error("cardinal proximal source preparation failed");
  const score: ReturnType<typeof fitHingedRotationError> =
    fitHingedRotationError(props, prepared, basis, identity);
  const lower: IAutoMovieQuaternion = { ...identity };
  for (const degrees of [0, 30, 0]) {
    const half: number = (degrees * Math.PI) / 360;
    lower.x = Math.sin(half);
    lower.w = Math.cos(half);
    const actual: number = score(identity, lower);
    TestValidator.predicate(
      `same lower record carries its actual current ${degrees}-degree residual`,
      nclose(actual, degrees, 1e-8),
    );
  }
  lower.x = NaN;
  for (let attempt: number = 0; attempt < 2; attempt++) {
    let refused: boolean = false;
    try {
      score(identity, lower);
    } catch (error) {
      refused =
        error instanceof Error &&
        error.message.includes("quaternion.x") &&
        error.message.includes("finite");
    }
    TestValidator.predicate(
      `failed lower admission is not a successful reading on attempt${attempt}`,
      refused,
    );
  }
  lower.x = Math.sin(Math.PI / 12);
  lower.w = Math.cos(Math.PI / 12);
  TestValidator.predicate(
    "a repaired same-record candidate recovers its actual displayed residual",
    nclose(score(identity, lower), 30, 1e-8),
  );
}

/** Construct the cardinal Z rotation directly from its half-angle formula. */
function turn(degrees: number): IAutoMovieQuaternion {
  const half: number = (degrees * Math.PI) / 360;
  return { x: 0, y: 0, z: Math.sin(half), w: Math.cos(half) };
}

function hingeRoots(): void {
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
    (event: string): void => {
      events.push(event);
    },
  );
  check(
    "eligible leg actually tries and accepts one orientation root",
    count(events, "orientationRootTrial") === 1 &&
      count(events, "orientationRootAccepted") === 1 &&
      count(events, "nearAttempt") === 0 &&
      count(events, "coldAttempt") === 0,
  );
  physical(fixture, fitted, check, true, true);
  check(
    "isolated zero swivel stays on branch zero and inside the near bracket",
    fitted.seed !== null &&
      fitted.seed.branch === 0 &&
      nclose(fitted.seed.swivel, 0, ROM_TOLERANCE) &&
      Math.abs(fitted.seed.swivel - 0.25) < hingedArmSwivel.STEP,
  );

  // Unsupported inputs must be observable fallbacks, even when the old fit
  // reaches exactly the same physical pose as the orientation-root policy.
  for (const mode of ["weight", "distal"] as const) {
    const other: IFixture = mode === "distal" ? leg(true) : fixture;
    const source: IFixture["source"] =
      mode === "weight"
        ? { ...other.source, referenceWeight: 0 }
        : other.source;
    const observed: string[] = [];
    const result: IAutoMovieSeededChainFit = fitSeededChainToTarget
      .prepare(source)
      .continued(
        other.target,
        { branch: 0, swivel: 0.25, tolerance: ROM_TOLERANCE },
        (event: string): void => {
          observed.push(event);
        },
      );
    check(
      `${mode}: unsupported policy actually attempts near fallback`,
      count(observed, "orientationRootTrial") === 0 &&
        count(observed, "orientationRootAccepted") === 0 &&
        count(observed, "nearAttempt") === 1,
    );
    physical(other, result, check, true, false);
  }
  const invalid: string[] = [];
  check(
    "unsupported negative reference weight preserves original admission",
    throwsError(
      (): IAutoMovieSeededChainFit =>
        fitSeededChainToTarget
          .prepare({
            ...fixture.source,
            referenceWeight: -1,
          })
          .continued(
            fixture.target,
            { branch: 0, swivel: 0.25, tolerance: ROM_TOLERANCE },
            (event: string): void => {
              invalid.push(event);
            },
          ),
      "non-negative",
    ) &&
      count(invalid, "orientationRootTrial") === 0 &&
      count(invalid, "nearAttempt") === 1,
  );

  ambiguous(fixture, check);
  TestValidator.predicate(
    failures.join("; ") || "orientation-root continuation",
    failures.length === 0,
  );
}

/** Independent dimensions, declared bounds and exact current goal of one leg. */
interface IFixture {
  /** Owned source whose three chain joints are an independently authored legal pose. */
  source: Omit<IAutoMovieFitChainToTargetProps, "target">;
  /** Analytic model-metre ankle point, never a fitted endpoint. */
  target: IAutoMovieVector3;
  /** Analytic knee point of the isolated root. */
  knee: IAutoMovieVector3;
}

/** Build a plain-box leg; distal changes only the real lower-axis convention. */
function leg(distal: boolean): IFixture {
  const lowerAxes: IAutoMovieJointAxes = distal
    ? { ...DEFAULT_JOINT_AXES, twistPlacement: "distal" }
    : DEFAULT_JOINT_AXES;
  const broad: IAutoMovieJointConstraint = {
    flexion: { min: -120, max: 120 },
    abduction: { min: -120, max: 120 },
    twist: { min: -120, max: 120 },
  };
  const knee: IAutoMovieJointConstraint = {
    flexion: { min: -150, max: 150 },
    abduction: null,
    twist: null,
  };
  const foot: IAutoMovieJointConstraint = {
    flexion: { min: -120, max: 120 },
    abduction: { min: -120, max: 120 },
    twist: null,
  };

  /** Rest translations give a vertical 0.4 m thigh and 0.4 m shank. */
  const bone: (
    name: AutoMovieHumanoidBone,
    parent: AutoMovieHumanoidBone | null,
    y: number,
    constraint: IAutoMovieJointConstraint,
    axes: IAutoMovieJointAxes,
  ) => IAutoMovieBone = (
    name: AutoMovieHumanoidBone,
    parent: AutoMovieHumanoidBone | null,
    y: number,
    constraint: IAutoMovieJointConstraint,
    axes: IAutoMovieJointAxes,
  ): IAutoMovieBone => ({
    bone: name,
    parent,
    axes,
    constraint,
    rest: {
      translation: { x: 0, y, z: 0 },
      rotation: Quaternion.identity(),
      scale: { x: 1, y: 1, z: 1 },
    },
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
    skeleton: skeleton.id,
    root: null,
    joints: [
      { bone: "leftUpperLeg", flexion: -30, abduction: 0, twist: 0 },
      { bone: "leftLowerLeg", flexion: 60, abduction: 0, twist: 0 },
      { bone: "leftFoot", flexion: -30, abduction: 0, twist: 0 },
    ],
  };
  const cosine: number = Math.cos(Math.PI / 6);
  return {
    source: {
      skeleton,
      pose,
      topology: indexSkeletonTopology(skeleton),
      chain: {
        upper: "leftUpperLeg",
        lower: "leftLowerLeg",
        effector: "leftFoot",
      },
      bend: { x: 0, y: 1, z: 1 },
      effectorRotation: Quaternion.identity(),
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
function physical(
  fixture: IFixture,
  fitted: IAutoMovieSeededChainFit,
  check: (label: string, valid: boolean) => void,
  oriented: boolean,
  isolated: boolean,
): void {
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map(
    resolvePose(fitted.pose, fixture.source.skeleton).map(
      (
        bone: IAutoMovieResolvedBone,
      ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [bone.bone, bone],
    ),
  );
  const hip: IAutoMovieResolvedBone = bones.get("leftUpperLeg")!;
  const knee: IAutoMovieResolvedBone = bones.get("leftLowerLeg")!;
  const foot: IAutoMovieResolvedBone = bones.get("leftFoot")!;
  const residual: number = Vector3.distance(foot.worldPosition, fixture.target);
  check(
    "actual FK reaches the independently specified ankle",
    nclose(residual, 0, 1e-7) && residual < 1e-7,
  );
  check(
    "actual thigh and shank retain their declared 0.4 m lengths",
    nclose(
      Vector3.distance(hip.worldPosition, knee.worldPosition),
      0.4,
      1e-12,
    ) &&
      nclose(
        Vector3.distance(knee.worldPosition, foot.worldPosition),
        0.4,
        1e-12,
      ),
  );
  check(
    "actual knee stays on the requested forward hemisphere",
    knee.worldPosition.z > 0,
  );
  if (isolated)
    check(
      "isolated legal root has the independently specified knee",
      vclose(knee.worldPosition, fixture.knee, 1e-7),
    );
  if (oriented) {
    const goal: IAutoMovieQuaternion = Quaternion.normalize(
      fixture.source.effectorRotation!,
    );
    const dotTolerance: number = 1 - Math.cos((ROM_TOLERANCE * Math.PI) / 360);
    check(
      "actual world foot reaches its independently specified rotation",
      qclose(
        Quaternion.normalize(foot.worldRotation),
        goal,
        dotTolerance + Number.EPSILON,
      ) &&
        (Quaternion.angleAfterNormalize(foot.worldRotation, goal) * 180) /
          Math.PI <=
          ROM_TOLERANCE,
    );
  }
  for (const joint of fitted.pose.joints) {
    const limit: number = joint.bone === "leftLowerLeg" ? 150 : 120;
    check(
      `${joint.bone}: flexion respects the declared box`,
      Number.isFinite(joint.flexion ?? 0) &&
        Math.abs(joint.flexion ?? 0) <= limit + ROM_TOLERANCE,
    );
    check(
      `${joint.bone}: abduction respects the declared box`,
      Number.isFinite(joint.abduction ?? 0) &&
        Math.abs(joint.abduction ?? 0) <=
          (joint.bone === "leftLowerLeg" ? ROM_TOLERANCE : 120 + ROM_TOLERANCE),
    );
    check(
      `${joint.bone}: twist respects the declared box`,
      Number.isFinite(joint.twist ?? 0) &&
        Math.abs(joint.twist ?? 0) <=
          (joint.bone === "leftUpperLeg" ? 120 + ROM_TOLERANCE : ROM_TOLERANCE),
    );
  }
}

/** A symmetric two-root family must be reported as a decline before near fallback. */
function ambiguous(
  fixture: IFixture,
  check: (label: string, valid: boolean) => void,
): void {
  const halfSeparation: number = (0.5 * Math.PI) / 180;
  const roll: number = -Math.atan(
    Math.cos(halfSeparation) / Math.tan(Math.PI / 6),
  );
  const sine: number = Math.SQRT1_2 * Math.sin(roll / 2);
  const cosine: number = Math.SQRT1_2 * Math.cos(roll / 2);

  // With h=30 degrees, the legal foot family has determinant proportional to
  // cos(h)*cos(roll)*cos(psi)+sin(h)*sin(roll). This choice sets its zeros at
  // +/-0.5 degrees. Equal repeated components represent Ry(90)*Rz(roll)
  // directly and preserve the family's reflection symmetry in the input.
  const goal: IAutoMovieQuaternion = { x: sine, y: cosine, z: sine, w: cosine };
  const source: IFixture["source"] = {
    ...fixture.source,
    effectorRotation: goal,
  };
  const workspace: fitSeededChainToTarget.IWorkspace =
    fitSeededChainToTarget.prepare(source);

  // Prove that both roots are actual eligible, legal candidates before the
  // midpoint case asks the same dispatcher to decline their exact tie.
  for (const expected of [-0.5, 0.5]) {
    const observed: string[] = [];
    const fitted: IAutoMovieSeededChainFit = workspace.continued(
      fixture.target,
      { branch: 0, swivel: expected, tolerance: ROM_TOLERANCE },
      (event: string): void => {
        observed.push(event);
      },
    );
    check(
      `${expected}: its symmetric orientation root is individually accepted`,
      count(observed, "orientationRootTrial") >= 1 &&
        count(observed, "orientationRootTrial") <= 2 &&
        count(observed, "orientationRootAccepted") === 1 &&
        count(observed, "nearAttempt") === 0 &&
        count(observed, "coldAttempt") === 0,
    );
    check(
      `${expected}: the selected seed names that independent root`,
      fitted.seed !== null &&
        fitted.seed.branch === 0 &&
        nclose(fitted.seed.swivel, expected, ROM_TOLERANCE) &&
        Math.abs(fitted.seed.swivel - expected) < hingedArmSwivel.STEP,
    );
    physical({ ...fixture, source }, fitted, check, true, false);
  }
  const events: string[] = [];
  const result: IAutoMovieSeededChainFit = workspace.continued(
    fixture.target,
    { branch: 0, swivel: 0, tolerance: ROM_TOLERANCE },
    (event: string): void => {
      events.push(event);
    },
  );
  check(
    "two symmetric in-bracket roots are actually tried before ambiguity fallback",
    count(events, "orientationRootTrial") === 2 &&
      count(events, "orientationRootAccepted") === 0 &&
      count(events, "nearAttempt") === 1,
  );
  physical({ ...fixture, source }, result, check, false, false);
}

function mirroredLimb(): void {
  const body = motionHumanBody("f-small");
  const rest: IAutoMoviePose = {
    skeleton: body.skeleton.id,
    root: null,
    joints: [],
  };
  const frames = (pose: IAutoMoviePose) =>
    new Map(
      resolvePose(
        pose,
        body.skeleton,
        HUMANOID_JOINT_AXES,
        HUMANOID_REST_FRAME,
      ).map((b) => [b.bone, b]),
    );
  const initial = frames(rest);
  const shoulder = initial.get("rightUpperArm")!.worldPosition;
  const elbow = initial.get("rightLowerArm")!.worldPosition;
  const wrist = initial.get("rightHand")!.worldPosition;
  const fullReach =
    Vector3.distance(shoulder, elbow) + Vector3.distance(elbow, wrist);
  const sideFit = (
    side: AutoMovieHumanSide,
    pose: IAutoMoviePose,
    target: IAutoMovieVector3,
    rotation?: IAutoMovieQuaternion,
    straight = false,
  ): IAutoMoviePose =>
    fitChainToTarget({
      skeleton: body.skeleton,
      pose,
      target,
      chain: {
        upper: `${side}UpperArm`,
        lower: `${side}LowerArm`,
        effector: `${side}Hand`,
      },
      effectorRotation: rotation,
      obstruction: straight ? () => 1 : undefined,
      topology: body.topology,
      jointAxes: HUMANOID_JOINT_AXES,
      restFrames: HUMANOID_REST_FRAME,
    });
  const mirror = (pose: IAutoMoviePose): IAutoMoviePose => ({
    ...pose,
    joints: pose.joints.map((j) => ({
      ...j,
      bone: j.bone.replace(/^right/, "left") as AutoMovieHumanoidBone,
    })),
  });
  const reflect = (q: IAutoMovieQuaternion): IAutoMovieQuaternion => ({
    x: q.x,
    y: -q.y,
    z: -q.z,
    w: q.w,
  });
  const compare = (
    right: IAutoMoviePose,
    left: IAutoMoviePose,
    tolerance: number,
  ): void => {
    const expected = mirror(right);
    for (const bone of ["leftUpperArm", "leftLowerArm", "leftHand"] as const) {
      const actual = left.joints.find((j) => j.bone === bone),
        wanted = expected.joints.find((j) => j.bone === bone);
      for (const axis of ["flexion", "abduction", "twist"] as const)
        TestValidator.predicate(
          "reflected wrists retain clinical angles",
          nclose(actual?.[axis] ?? 0, wanted?.[axis] ?? 0, tolerance),
        );
    }
  };
  const reach = Vector3.add(shoulder, { x: -0.1, y: -0.15, z: 0.35 });
  const entry = sideFit(
    "right",
    {
      ...rest,
      joints: [{ bone: "rightHand", flexion: -20, abduction: -10, twist: 0 }],
    },
    reach,
  );
  const before = frames(entry),
    hand = before.get("rightHand")!.worldRotation;
  const axis = Vector3.normalize(
    Quaternion.rotateVector(
      before.get("rightLowerArm")!.worldRotation,
      HUMANOID_JOINT_AXES.rightLowerArm!.twist,
    ),
  );
  const across = Vector3.normalize(Vector3.cross(axis, { x: 0, y: 1, z: 0 }));
  const mixed = Vector3.normalize(Vector3.add(axis, across));
  const twist = (pose: IAutoMoviePose): number =>
    pose.joints.find((j) => j.bone === "rightLowerArm")?.twist ?? 0;
  for (const [direction, degrees] of [
    [axis, -12],
    [across, 12],
    [mixed, 12],
  ] as const) {
    const demand = Quaternion.normalize(
      Quaternion.multiply(Quaternion.fromAxisAngle(direction, degrees), hand),
    );
    const solved = sideFit("right", entry, reach, demand);
    const moved = Math.abs(twist(solved) - twist(entry));
    TestValidator.predicate(
      "forearm twist only supplies the requested residual",
      moved <= Math.abs(degrees) + 1e-3 &&
        (direction !== axis || Math.abs(moved - Math.abs(degrees)) <= 1e-3),
    );
    TestValidator.predicate(
      "bent wrist reaches the requested orientation",
      (Quaternion.angle(
        frames(solved).get("rightHand")!.worldRotation,
        demand,
      ) *
        180) /
        Math.PI <=
        1e-3,
    );
    const other = sideFit(
      "left",
      mirror(entry),
      { ...reach, x: -reach.x },
      reflect(demand),
    );
    compare(solved, other, 1e-5);
  }
  const target = Vector3.add(
    shoulder,
    Vector3.scale(Vector3.normalize({ x: -0.2, y: -0.6, z: 0.5 }), fullReach),
  );
  const demand = Quaternion.normalize(
    Quaternion.fromAxisAngle({ x: 0.3, y: 0.2, z: 0.9 }, 40),
  );
  compare(
    sideFit("right", rest, target, demand, true),
    sideFit("left", rest, { ...target, x: -target.x }, reflect(demand), true),
    1e-2,
  );
}
