import {
  clampJointToSkeleton,
  clampPose,
  jointToQuaternion,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { qclose } from "../../../internal/qclose";

/**
 * Pose clamping reads current rig metadata without caching a joint's answer.
 *
 * Scenarios:
 *
 * 1. Duplicate bone declarations use the first constraint. Repeated joint names
 *    retain input order and independently clip 35, -40 and 4 into [-10, 20].
 *    The unconstrained joint and root keep their exact references. One
 *    fixed-rig prepared pose/joint factory also handles A-to-B-to-A input edits
 *    without changing previously returned constrained joint records.
 * 2. A missing elbow and a first declaration with a null override both use the
 *    named hinge fallback: an admitted flexion stays 7 and abduction becomes
 *    0.
 * 3. Mutating plain scalar bounds on the same skeleton and bones array affects the
 *    next clampPose and newly prepared clampJointToSkeleton.of call.
 * 4. Last declared axes win, including across a final undefined declaration. A
 *    pure 50-degree twist clips to 15 degrees; a zero declared axis throws.
 *    Replacing an axes record on the same rig is observed by the next call.
 * 5. Invalid axes on an unconstrained joint are not admitted, while constrained
 *    malformed joints fail in input order. Empty input preserves root
 *    identity.
 *
 * Scalar endpoints follow authored intervals, not a copy of a default maximum.
 * The axial quaternion is independently (0, 0, sin(15deg/2), cos(15deg/2)).
 * Scalar answers compare exactly; angular extraction and unit quaternion
 * reconstruction use the existing nclose/qclose rounding bounds. These are
 * engine ROM records, not a fabricated Human or a clinical model. A prepared
 * closure borrows one unchanged solve's inputs: this test prepares a new
 * closure after mutation. Coupled-region in-place mutation and performance are
 * outside its claims.
 */
export function test_unit_engine_rom_clamp_pose_current_rig(): void {
  const failures: string[] = [];
  const check: (label: string, condition: boolean) => void = (
    label: string,
    condition: boolean,
  ): void => {
    if (!condition) failures.push(label);
  };
  const scenario: (label: string, task: () => void) => void = (
    label: string,
    task: () => void,
  ): void => {
    try {
      task();
    } catch (error) {
      failures.push(`${label}: ${String(error)}`);
    }
  };
  const rejectsAxis: (
    label: string,
    task: () => unknown,
    axis: string,
  ) => void = (label: string, task: () => unknown, axis: string): void => {
    try {
      task();
      failures.push(`${label}: missing axis rejection`);
    } catch (error) {
      check(
        label,
        error instanceof Error &&
          error.name === "Error" &&
          error.message.includes(`axes.${axis}`) &&
          error.message.includes("must have non-zero length"),
      );
    }
  };
  const rest: IAutoMovieTransform = {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  };
  const bone: (
    name: AutoMovieHumanoidBone,
    constraint: IAutoMovieJointConstraint | null,
    axes?: IAutoMovieJointAxes,
  ) => IAutoMovieBone = (
    name: AutoMovieHumanoidBone,
    constraint: IAutoMovieJointConstraint | null,
    axes?: IAutoMovieJointAxes,
  ): IAutoMovieBone => ({
    bone: name,
    parent: null,
    rest,
    constraint,
    ...(axes === undefined ? {} : { axes }),
  });
  const angles: (
    label: string,
    actual: IAutoMovieJointPose,
    expected: readonly [number | null, number | null, number | null],
  ) => void = (
    label: string,
    actual: IAutoMovieJointPose,
    expected: readonly [number | null, number | null, number | null],
  ): void => {
    check(`${label} flexion`, actual.flexion === expected[0]);
    check(`${label} abduction`, actual.abduction === expected[1]);
    check(`${label} twist`, actual.twist === expected[2]);
  };
  const pose: (joints: IAutoMovieJointPose[]) => IAutoMoviePose = (
    joints: IAutoMovieJointPose[],
  ): IAutoMoviePose => ({ skeleton: "current-rig", root: rest, joints });

  scenario("first constraint and per-record projection", (): void => {
    const first: IAutoMovieJointConstraint = {
      flexion: { min: -10, max: 20 },
      abduction: null,
      twist: null,
    };
    const later: IAutoMovieJointConstraint = {
      flexion: { min: -40, max: 50 },
      abduction: null,
      twist: null,
    };
    const skeleton: IAutoMovieSkeleton = {
      id: "current-rig",
      bones: [bone("leftLowerArm", first), bone("leftLowerArm", later)],
    };
    const untouched: IAutoMovieJointPose = {
      bone: "hips",
      flexion: 999,
      abduction: Number.NaN,
      twist: null,
    };
    const input: IAutoMoviePose = pose([
      { bone: "leftLowerArm", flexion: 35, abduction: 31, twist: null },
      untouched,
      { bone: "leftLowerArm", flexion: -40, abduction: -3, twist: 10 },
      { bone: "leftLowerArm", flexion: 4, abduction: null, twist: null },
    ]);
    const out: IAutoMoviePose = clampPose(input, skeleton);
    check(
      "new pose and joint list",
      out !== input && out.joints !== input.joints,
    );
    check("borrowed root", out.root === input.root);
    check("preserved skeleton id", out.skeleton === input.skeleton);
    check("all records retained", out.joints.length === 4);
    check(
      "unconstrained record identity at original index",
      out.joints[1] === untouched,
    );
    angles("first duplicate", out.joints[0]!, [20, 0, null]);
    angles("second duplicate", out.joints[2]!, [-10, 0, 0]);
    angles("third duplicate", out.joints[3]!, [4, null, null]);
    for (const index of [0, 2, 3])
      check(`bone at ${index}`, out.joints[index]?.bone === "leftLowerArm");
    check(
      "original out-of-range angle unchanged",
      input.joints[0]?.flexion === 35,
    );

    const preparedPose: (value: IAutoMoviePose) => IAutoMoviePose =
      clampPose.prepare(skeleton);
    const preparedJoint: (value: IAutoMovieJointPose) => IAutoMovieJointPose =
      clampJointToSkeleton.prepare(skeleton);
    const a: IAutoMoviePose = preparedPose(input);
    const jointA: IAutoMovieJointPose = preparedJoint(input.joints[0]!);
    angles("prepared A first", a.joints[0]!, [20, 0, null]);
    angles("prepared A second", a.joints[2]!, [-10, 0, 0]);
    angles("prepared joint A", jointA, [20, 0, null]);

    // Only pose data changes while these factories borrow the fixed rig.
    input.joints[0]!.flexion = -12;
    input.joints[2]!.flexion = 35;
    const b: IAutoMoviePose = preparedPose({
      ...input,
      root: null,
      joints: [input.joints[2]!, untouched, input.joints[0]!],
    });
    angles("prepared B reordered first", b.joints[0]!, [20, 0, 0]);
    angles("prepared B reordered last", b.joints[2]!, [-10, 0, null]);
    angles("prepared joint B", preparedJoint(input.joints[0]!), [-10, 0, null]);
    angles("earlier pose answer remains A", a.joints[0]!, [20, 0, null]);
    angles("earlier joint answer remains A", jointA, [20, 0, null]);

    input.joints[0]!.flexion = 35;
    input.joints[2]!.flexion = -40;
    const restored: IAutoMoviePose = preparedPose(input);
    angles("prepared restored first", restored.joints[0]!, [20, 0, null]);
    angles("prepared restored second", restored.joints[2]!, [-10, 0, 0]);
    angles("prepared restored third", restored.joints[3]!, [4, null, null]);
    angles("prepared joint restored", preparedJoint(input.joints[0]!), [
      20,
      0,
      null,
    ]);
    angles("earlier B answer remains B", b.joints[2]!, [-10, 0, null]);
    check(
      "prepared roots retain each input",
      a.root === input.root && b.root === null && restored.root === input.root,
    );
    check(
      "prepared order and counts",
      a.joints.length === 4 &&
        b.joints.length === 3 &&
        restored.joints.length === 4,
    );
    check(
      "prepared wrappers and lists remain independent",
      a !== restored &&
        a.joints !== restored.joints &&
        a.joints[0] !== restored.joints[0],
    );
    check(
      "prepared unconstrained identity",
      a.joints[1] === untouched &&
        b.joints[1] === untouched &&
        restored.joints[1] === untouched &&
        preparedJoint(untouched) === untouched,
    );
  });

  scenario("missing and null-first hinge fallback", (): void => {
    const input: IAutoMoviePose = pose([
      { bone: "rightLowerArm", flexion: 7, abduction: 31, twist: null },
    ]);
    const missing: IAutoMovieSkeleton = { id: "current-rig", bones: [] };
    const nullFirst: IAutoMovieSkeleton = {
      id: "current-rig",
      bones: [
        bone("rightLowerArm", null),
        bone("rightLowerArm", {
          flexion: { min: -1, max: 1 },
          abduction: { min: -1, max: 1 },
          twist: { min: -1, max: 1 },
        }),
      ],
    };
    for (const skeleton of [missing, nullFirst]) {
      angles("fallback pose", clampPose(input, skeleton).joints[0]!, [
        7,
        0,
        null,
      ]);
      angles(
        "fallback prepared",
        clampJointToSkeleton.of("rightLowerArm", skeleton)(input.joints[0]!),
        [7, 0, null],
      );
    }
  });

  scenario("current plain bounds on unchanged list", (): void => {
    const range: IAutoMovieAngleRange = { min: -10, max: 20 };
    const skeleton: IAutoMovieSkeleton = {
      id: "current-rig",
      bones: [
        bone("leftLowerArm", { flexion: range, abduction: null, twist: null }),
      ],
    };
    const input: IAutoMoviePose = pose([
      { bone: "leftLowerArm", flexion: 35, abduction: null, twist: null },
      { bone: "leftLowerArm", flexion: -40, abduction: null, twist: null },
    ]);
    const inspect: (label: string, upper: number, lower: number) => void = (
      label: string,
      upper: number,
      lower: number,
    ): void => {
      const out: IAutoMoviePose = clampPose(input, skeleton);
      const prepared: (joint: IAutoMovieJointPose) => IAutoMovieJointPose =
        clampJointToSkeleton.of("leftLowerArm", skeleton);
      angles(`${label} pose upper`, out.joints[0]!, [upper, null, null]);
      angles(`${label} pose lower`, out.joints[1]!, [lower, null, null]);
      angles(`${label} prepared upper`, prepared(input.joints[0]!), [
        upper,
        null,
        null,
      ]);
      angles(`${label} prepared lower`, prepared(input.joints[1]!), [
        lower,
        null,
        null,
      ]);
    };
    inspect("before mutation", 20, -10);
    range.min = -4;
    range.max = 7;
    inspect("after mutation", 7, -4);
  });

  const valid: IAutoMovieJointAxes = {
    flexion: { x: 1, y: 0, z: 0 },
    abduction: { x: 0, y: 1, z: 0 },
    twist: { x: 0, y: 0, z: 1 },
  };
  const badFlexion: IAutoMovieJointAxes = {
    ...valid,
    flexion: { x: 0, y: 0, z: 0 },
  };
  const badAbduction: IAutoMovieJointAxes = {
    ...valid,
    abduction: { x: 0, y: 0, z: 0 },
  };
  const gated: IAutoMovieJointConstraint = {
    flexion: { min: -30, max: 30 },
    abduction: { min: -30, max: 30 },
    twist: { min: -90, max: 90 },
    swingTwist: { twist: { min: -15, max: 15 } },
  };
  const axial: IAutoMovieJointPose = {
    bone: "spine",
    flexion: 0,
    abduction: 0,
    twist: 50,
  };
  // Spine has no clinical sign/neutral offset. Zero swing fixes the limb axis;
  // nearest rotation on the allowed axial arc ends at +15 degrees.
  const expected: IAutoMovieQuaternion = {
    x: 0,
    y: 0,
    z: Math.sin(Math.PI / 24),
    w: Math.cos(Math.PI / 24),
  };
  const axialResult: (label: string, out: IAutoMovieJointPose) => void = (
    label: string,
    out: IAutoMovieJointPose,
  ): void => {
    check(`${label} flexion`, nclose(out.flexion ?? Number.NaN, 0));
    check(`${label} abduction`, nclose(out.abduction ?? Number.NaN, 0));
    check(`${label} twist`, nclose(out.twist ?? Number.NaN, 15));
    check(
      `${label} physical quaternion`,
      qclose(jointToQuaternion(out, valid), expected),
    );
  };
  const axialCalls: (label: string, skeleton: IAutoMovieSkeleton) => void = (
    label: string,
    skeleton: IAutoMovieSkeleton,
  ): void => {
    scenario(`${label} pose`, (): void => {
      axialResult(label, clampPose(pose([axial]), skeleton).joints[0]!);
    });
    scenario(`${label} prepared`, (): void => {
      axialResult(label, clampJointToSkeleton.of("spine", skeleton)(axial));
    });
  };
  const invalidCalls: (label: string, skeleton: IAutoMovieSkeleton) => void = (
    label: string,
    skeleton: IAutoMovieSkeleton,
  ): void => {
    rejectsAxis(
      `${label} pose`,
      (): IAutoMoviePose => clampPose(pose([axial]), skeleton),
      "flexion",
    );
    rejectsAxis(
      `${label} prepared`,
      (): IAutoMovieJointPose =>
        clampJointToSkeleton.of("spine", skeleton)(axial),
      "flexion",
    );
  };

  axialCalls("last declared valid axes", {
    id: "current-rig",
    bones: [
      bone("spine", gated, badFlexion),
      bone("spine", gated, valid),
      bone("spine", gated),
    ],
  });
  invalidCalls("undefined tail retains invalid axes", {
    id: "current-rig",
    bones: [
      bone("spine", gated, valid),
      bone("spine", gated, badFlexion),
      bone("spine", gated),
    ],
  });
  const current: IAutoMovieBone = bone("spine", gated, valid);
  const changing: IAutoMovieSkeleton = { id: "current-rig", bones: [current] };
  axialCalls("before axes replacement", changing);
  current.axes = badFlexion;
  invalidCalls("after invalid axes replacement", changing);
  current.axes = { ...valid };
  axialCalls("after valid axes replacement", changing);

  scenario("lazy gate and input failure order", (): void => {
    const unconstrained: IAutoMovieJointPose = {
      bone: "hips",
      flexion: Number.NaN,
      abduction: 999,
      twist: null,
    };
    const noGate: IAutoMovieSkeleton = {
      id: "current-rig",
      bones: [bone("hips", null, badFlexion)],
    };
    check(
      "unconstrained pose does not admit axes",
      clampPose(pose([unconstrained]), noGate).joints[0] === unconstrained,
    );
    check(
      "unconstrained preparation does not admit axes",
      clampJointToSkeleton.of("hips", noGate)(unconstrained) === unconstrained,
    );
    const ordered: IAutoMovieSkeleton = {
      id: "current-rig",
      bones: [
        bone("spine", gated, badFlexion),
        bone("chest", gated, badAbduction),
      ],
    };
    const chest: IAutoMovieJointPose = { ...axial, bone: "chest" };
    rejectsAxis(
      "spine first",
      (): IAutoMoviePose => clampPose(pose([axial, chest]), ordered),
      "flexion",
    );
    rejectsAxis(
      "chest first",
      (): IAutoMoviePose => clampPose(pose([chest, axial]), ordered),
      "abduction",
    );
    const empty: IAutoMoviePose = pose([]);
    const out: IAutoMoviePose = clampPose(empty, ordered);
    check(
      "empty input avoids unused axes",
      out.joints.length === 0 && out.root === empty.root,
    );
    const nullRoot: IAutoMoviePose = { ...empty, root: null };
    check("null root preserved", clampPose(nullRoot, ordered).root === null);
  });

  TestValidator.predicate(
    `current rig projection failures: ${failures.join("; ")}`,
    failures.length === 0,
  );
}
