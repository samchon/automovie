import {
  Quaternion,
  getConstraint,
  preparePoseResolution,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanMount,
  AutoMovieMotionHumanStance,
} from "@automovie/motions";
import {
  AutoMovieMotionHumanChannel,
  HumanTrunk,
  HumanTrunkTurn,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { qclose } from "../../../../features/internal/qclose";
import { throwsError } from "../../../../features/internal/throwsError";
import { vclose } from "../../../../features/internal/vclose";

/**
 * A trunk turned toward a side by a share of its range
 * (`HumanTrunkTurn.turned`): the spine and the chest each go the share of the
 * way to their own range's ends toward the side, and the neck and the head
 * take back what they turned, within their ranges.
 *
 * The posture is the average man's quiet stance with the spine and the chest
 * already bent 10 degrees forward, 3 to the right and twisted 4 to the right,
 * so the share is measured from a turned start.
 *
 * Scenarios:
 * 1. A share of 0 leaves the spine, the chest, the neck and the head as they
 *    were.
 * 2. A share of 1 toward the left puts the spine's and the chest's side bend
 *    at its range's minimum and their twist at its maximum (the side bend is
 *    negative and the twist positive to the left); toward the right, the
 *    other ends; the forward bend is kept.
 * 3. A share of 0.5 toward the left puts each halfway from its start to that
 *    end, and a share of -0.5 halfway to the other end.
 * 4. At a share of 0.2 the neck's and the head's side bend and twist together
 *    change by the opposite of the spine's and the chest's (within their
 *    ranges there), and at a share of 1 each lies within its range.
 * 5. Righting: at a share of 0.2 toward the left the head's world up turns
 *    less than the chest's from where they stood.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public turn on a real body's ranges and reads the joints it writes and the trunk the posture places; a wrong side, a share read from zero instead of the start, a head left to turn with the trunk or carried past its range fails with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations The ends are the rig's ranges read through the engine's constraint; the halfway points and the take-back are arithmetic on them; the righting is read on the placed bones.
 * @evidence contracts/development/testing.md#distinguishing-cases Both sides, the shares 0, 0.2, 0.5, -0.5 and 1, a turned start.
 * @evidence contracts/development/testing.md#execution-ownership In memory, a few trunk placements on one prepared body; it is a real-body test; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the posture and the 5 scenarios with their bounds.
 */
export function test_motion_posture_trunk_frame(): void {
  for (const bone of [
    "spine",
    "chest",
    "upperChest",
    "hips",
    "leftShoulder",
    "neck",
  ] as const) {
    TestValidator.equals(
      "axial claim covers thoracic joints only",
      AutoMovieMotionHumanChannel.covers(["trunkTurn"], bone),
      ["spine", "chest", "upperChest"].includes(bone),
    );
  }
  const idle: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 1, z: 0 },
    yaw: 0,
    pitch: 1,
    roll: 2,
    joints: {
      hips: [1, 0, 0],
      spine: [2, 0, 0],
      chest: [3, 0, 0],
      leftShoulder: [4, 0, 0],
    },
    limbs: {},
  };
  const merged = AutoMovieMotionHumanChannel.merge(
    idle,
    {
      ...idle,
      yaw: 30,
      joints: {
        hips: [10, 0, 0],
        spine: [20, 0, 0],
        chest: [30, 0, 0],
        leftShoulder: [40, 0, 0],
      },
    },
    ["trunkTurn"],
  );
  TestValidator.equals(
    "only claimed joints are replaced",
    [
      merged.joints.hips![0],
      merged.joints.spine![0],
      merged.joints.chest![0],
      merged.joints.leftShoulder![0],
      merged.yaw,
    ],
    [1, 20, 30, 4, 0],
  );
  TestValidator.predicate(
    "the two carriers yield axial turning",
    [
      AutoMovieMotionHumanMount.rideHorse.ride,
      AutoMovieMotionHumanStance.stand,
    ].every((law) => law.yields?.includes("trunkTurn")),
  );
  stagedTrunkInput();
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const base: IAutoMovieMotionHumanPosture =
    AutoMovieMotionHumanStance.stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
  const posture: IAutoMovieMotionHumanPosture = {
    ...base,
    joints: {
      ...base.joints,
      leftLowerArm: [35, 0, 0],
      spine: [10, 3, -4],
      chest: [10, 3, -4],
    },
  };
  const complaints: string[] = [];
  TestValidator.equals(
    "turning the trunk preserves the unrelated elbow",
    HumanTrunkTurn.turned(body, posture, 0.5, "left").joints.leftLowerArm,
    posture.joints.leftLowerArm,
  );
  const near = (a: number, b: number): boolean => Math.abs(a - b) <= 1e-9;
  const of = (
    p: IAutoMovieMotionHumanPosture,
    bone: TrunkJoint,
  ): readonly [number, number, number] => p.joints[bone] ?? [0, 0, 0];
  const range = (bone: AutoMovieHumanoidBone): Constraint =>
    getConstraint(
      bone,
      body.skeleton.bones.find((b: IAutoMovieBone): boolean => b.bone === bone)
        ?.constraint ?? null,
    )!;

  // 1. Nothing at a share of 0.
  const still: IAutoMovieMotionHumanPosture = HumanTrunkTurn.turned(
    body,
    posture,
    0,
    "left",
  );
  for (const bone of ["spine", "chest", "neck", "head"] as const)
    if (JSON.stringify(of(still, bone)) !== JSON.stringify(of(posture, bone)))
      complaints.push(
        `a share of 0 changes the ${bone} from ${JSON.stringify(of(posture, bone))} to ${JSON.stringify(of(still, bone))}`,
      );

  // 2 and 3. The ends and the halfway points.
  for (const [share, side, roll, twist] of [
    [1, "left", "min", "max"],
    [1, "right", "max", "min"],
    [0.5, "left", "min", "max"],
    [-0.5, "left", "max", "min"],
  ] as const) {
    const turned: IAutoMovieMotionHumanPosture = HumanTrunkTurn.turned(
      body,
      posture,
      share,
      side,
    );
    for (const bone of ["spine", "chest"] as const) {
      const limits: Constraint = range(bone);
      const start: readonly [number, number, number] = of(posture, bone);
      const fraction: number = Math.abs(share);
      const expected: [number, number, number] = [
        start[0],
        start[1] + fraction * (limits.abduction![roll] - start[1]),
        start[2] + fraction * (limits.twist![twist] - start[2]),
      ];
      const got: readonly [number, number, number] = of(turned, bone);
      if (!expected.every((v: number, i: number): boolean => near(v, got[i]!)))
        complaints.push(
          `a share of ${share} toward the ${side} puts the ${bone} at ${JSON.stringify(got)}, ${JSON.stringify(expected)} expected`,
        );
    }
  }

  // 4. The neck and the head take it back.
  const small: IAutoMovieMotionHumanPosture = HumanTrunkTurn.turned(
    body,
    posture,
    0.2,
    "left",
  );
  for (const axis of [1, 2] as const) {
    const trunk: number =
      of(small, "spine")[axis] -
      of(posture, "spine")[axis] +
      of(small, "chest")[axis] -
      of(posture, "chest")[axis];
    const head: number =
      of(small, "neck")[axis] -
      of(posture, "neck")[axis] +
      of(small, "head")[axis] -
      of(posture, "head")[axis];
    if (!near(head, -trunk))
      complaints.push(
        `at a share of 0.2 the neck and the head turn ${head.toFixed(4)} about axis ${axis} against the trunk's ${trunk.toFixed(4)}, its opposite expected`,
      );
  }
  const whole: IAutoMovieMotionHumanPosture = HumanTrunkTurn.turned(
    body,
    posture,
    1,
    "left",
  );
  for (const bone of ["neck", "head"] as const) {
    const limits: Constraint = range(bone);
    const got: readonly [number, number, number] = of(whole, bone);
    for (const [axis, interval] of [
      [1, limits.abduction],
      [2, limits.twist],
    ] as const)
      if (
        interval !== null &&
        interval !== undefined &&
        !(got[axis] >= interval.min - 1e-9 && got[axis] <= interval.max + 1e-9)
      )
        complaints.push(
          `at a share of 1 the ${bone} turns ${got[axis].toFixed(3)} about axis ${axis}, inside ${interval.min} to ${interval.max} expected`,
        );
  }

  // 5. The head stays more upright than the chest.
  const up = (
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    bone: AutoMovieHumanoidBone,
  ): IAutoMovieQuaternion => bones.get(bone)!.worldRotation;
  const before: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    HumanTrunk.resolve(body, posture);
  const after: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    HumanTrunk.resolve(body, small);
  const tilt = (bone: AutoMovieHumanoidBone): number => {
    const a: IAutoMovieVector3 = Quaternion.rotateVector(up(before, bone), {
      x: 0,
      y: 1,
      z: 0,
    });
    const b: IAutoMovieVector3 = Quaternion.rotateVector(up(after, bone), {
      x: 0,
      y: 1,
      z: 0,
    });
    return (
      (Math.acos(Math.min(1, a.x * b.x + a.y * b.y + a.z * b.z)) * 180) /
      Math.PI
    );
  };
  if (!(tilt("head") < tilt("chest")))
    complaints.push(
      `at a share of 0.2 the head's up turns ${tilt("head").toFixed(2)} degrees and the chest's ${tilt("chest").toFixed(2)}, less for the head expected`,
    );
  TestValidator.equals(
    "a trunk turns by a share of its range and the head rights against it",
    complaints,
    [],
  );
}

/** A joint's range on the rig. */
type Constraint = NonNullable<ReturnType<typeof getConstraint>>;

/** A joint recruited by the axial turn. */
type TrunkJoint = "spine" | "chest" | "neck" | "head";

function stagedTrunkInput(): void {
  const canonical: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const trace: string[] = [];
  const body: IAutoMovieMotionHumanBody = {
    ...canonical,
    get skeleton(): IAutoMovieSkeleton {
      trace.push("skeleton");
      return canonical.skeleton;
    },
  };
  const demand: ReadonlySet<AutoMovieHumanoidBone> = new Set(["head"]);
  const prepared: ReturnType<typeof HumanTrunk.prepareResolve> =
    HumanTrunk.prepareResolve(body, demand);
  const state: ITrunkReadState = {
    flexion: NaN,
    lateFails: true,
    rootFails: false,
    supplierFails: false,
    root: { x: 0, y: 0, z: 0 },
  };
  const lateError: Error = new Error("owned later trunk tuple failure");
  const rootError: Error = new Error("owned trunk root failure");
  const supplierError: Error = new Error("owned trunk supplier failure");
  const head: readonly [number, number, number] = [0, 0, 0];
  const finger: readonly [number, number, number] = [0, 0, 0];
  for (const [tuple, name] of [
    [head, "head"],
    [finger, "finger"],
  ] as const)
    for (const axis of [0, 1, 2])
      Object.defineProperty(tuple, axis, {
        get: (): number => {
          trace.push(`${name}.${axis}`);
          if (name === "finger" && axis === 0 && state.lateFails)
            throw lateError;
          return name === "head" && axis === 0 ? state.flexion : 0;
        },
      });
  const joints: IAutoMovieMotionHumanPosture["joints"] = {
    get head(): readonly [number, number, number] {
      trace.push("map.head");
      return head;
    },
    get leftIndexDistal(): readonly [number, number, number] {
      trace.push("map.finger");
      return finger;
    },
  };
  const posture: IAutoMovieMotionHumanPosture = {
    get root(): IAutoMovieVector3 {
      trace.push("root");
      if (state.rootFails) throw rootError;
      return state.root;
    },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints,
    limbs: {},
  };
  const supplier: () => ReturnType<
    typeof preparePoseResolution
  > = (): ReturnType<typeof preparePoseResolution> => {
    trace.push("supplier");
    if (state.supplierFails) throw supplierError;
    return preparePoseResolution();
  };
  const allScalars: string[] = [
    "map.head",
    "map.finger",
    "head.0",
    "head.1",
    "head.2",
    "finger.0",
    "finger.1",
    "finger.2",
  ];
  const complete: string[] = [...allScalars, "root", "skeleton", "supplier"];
  const readers: readonly [
    string,
    () => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ][] = [
    [
      "raw",
      (): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
        HumanTrunk.resolve(body, posture, joints, supplier, demand),
    ],
    [
      "prepared",
      (): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
        prepared(posture, supplier),
    ],
  ];
  for (const [name, read] of readers) {
    state.flexion = NaN;
    state.lateFails = true;
    state.rootFails = false;
    state.supplierFails = false;
    trace.length = 0;
    TestValidator.predicate(
      `${name} completes later tuple access before early numeric admission`,
      caught(read) === lateError,
    );
    TestValidator.equals(
      `${name} reads all map values before the tuple failure`,
      trace,
      allScalars.slice(0, 6),
    );
    state.lateFails = false;
    state.rootFails = true;
    trace.length = 0;
    TestValidator.predicate(
      `${name} constructs its actual root before native finite admission`,
      caught(read) === rootError,
    );
    TestValidator.equals(
      `${name} root failure follows every scalar read`,
      trace,
      [...allScalars, "root"],
    );
    state.rootFails = false;
    state.supplierFails = true;
    trace.length = 0;
    TestValidator.predicate(
      `${name} requests its actual workspace before finite admission`,
      caught(read) === supplierError,
    );
    TestValidator.equals(
      `${name} supplier failure keeps the original staging/root/carrier order`,
      trace,
      complete,
    );
    state.supplierFails = false;
    trace.length = 0;
    TestValidator.predicate(
      `${name} finally refuses the actual unchanged NaN`,
      throwsError(read, ["flexion", "finite"]),
    );
    TestValidator.equals(
      `${name} numeric refusal retains all earlier observable work`,
      trace,
      complete,
    );
    state.flexion = 0;
    state.root = { x: 0, y: 0, z: 0 };
    const initial: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = read();
    TestValidator.equals(
      `${name} emits only the demanded head`,
      Array.from(initial.keys()),
      ["head"],
    );
    const first: IAutoMovieResolvedBone = initial.get("head")!;
    const point: IAutoMovieVector3 = { ...first.worldPosition };
    first.worldPosition.x = 999;
    state.root = { x: 1, y: 2, z: 3 };
    const shifted: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = read();
    TestValidator.predicate(
      `${name} observes current root translation with independently owned frames`,
      shifted !== initial &&
        shifted.get("head") !== first &&
        vclose(
          shifted.get("head")!.worldPosition,
          { x: point.x + 1, y: point.y + 2, z: point.z + 3 },
          1e-9,
        ) &&
        qclose(
          shifted.get("head")!.worldRotation,
          first.worldRotation,
          1e-12,
        ) &&
        Object.is(first.worldPosition.x, 999),
    );
  }
  TestValidator.predicate(
    "the actual prepared consumer admits even an unrequested malformed override",
    throwsError(
      (): unknown =>
        prepared(posture, supplier, {
          head: [0, 0, 0],
          leftIndexDistal: [NaN, 0, 0],
        }),
      ["flexion", "finite"],
    ),
  );
}

/** Observe only the owned action's actual failure; assertion predicates stay outside the catch. */
function caught(action: () => unknown): unknown {
  try {
    action();
  } catch (error) {
    return error;
  }
  return undefined;
}

interface ITrunkReadState {
  flexion: number;
  lateFails: boolean;
  rootFails: boolean;
  supplierFails: boolean;
  root: IAutoMovieVector3;
}
