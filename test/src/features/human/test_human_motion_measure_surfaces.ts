import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  fitChainToTarget,
  indexSkeletonTopology,
  resolveAutoMovieHumanoidSurfaces,
  resolvePose,
} from "@automovie/engine";
import type { AutoMovieHumanCanonicalBody } from "@automovie/human";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  AutoMovieHumanoidSocket,
  IAutoMovieBodyMeasure,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { MotionBodies } from "../../../../packages/motions/src/executable/MotionBodies";
import type { humanPolygonMan } from "../../../../packages/motions/src/executable/humanPolygonMan";

/**
 * On polygon men across statures, the measure follows the body, surfaces sit
 * on its colliders and ride its bones, and its limbs bend the human way.
 *
 * Scenarios, on the ANSUR boundary people of the 1st and 99th stature
 * percentiles of each sex (the test suite's short and tall ends):
 * 1. Monotone scaling: every length of the measure grows with stature from
 *    one body to the next of the same sex.
 * 2. Anthropometric relations (Drillis and Contini via Winter fig. 4.1, each
 *    within 25 % to allow individual proportion): thigh, shank, upper arm,
 *    forearm and foot length near 0.245, 0.246, 0.186, 0.146 and 0.152 of
 *    stature, hip joints near 0.53 and shoulders near 0.80 of it.
 * 3. Surfaces sit on the body: the soles lie on the floor and the head top
 *    at the measured stature, within 2 mm.
 * 4. Rigid riding: under a whole-body pose with a turned, moved root, every
 *    region and socket keeps its distance to its bone's joint and to that
 *    bone's child joints within 1 mm.
 * 5. Human limbs: sending an ankle forward and up with the knee hinted
 *    forward lands within 1 mm with the knee in front; hinted backward, the
 *    knee still folds forward because the knee's range of motion forbids
 *    hyperextension; an elbow hinted down sits below one hinted up.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Prepares real Human bodies, resolves their measure and surfaces through the engine and reads distances; a measure read off the wrong bone, a region off its collider, a frame not riding its bone or a limb bending against its range fails.
 * @evidence contracts/development/testing.md#independent-expectations Expectations are the stature monotonicity of human dimensions, Drillis and Contini's published segment shares, the geometric meaning of a surface point and of rigid motion, and the knee's range of motion; none is read from the code under test.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers both sexes and four statures, every region and socket, a rest and a posed state, a reachable leg with two hints and an arm with two hints.
 * @evidence contracts/development/testing.md#execution-ownership A local test: it prepares Human bodies, so its name falls under the CI exclusion of test_human_.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 scenarios and what each pins.
 */
export function test_human_motion_measure_surfaces(): void {
  const failures: string[] = [];
  const check = (label: string, ok: boolean): void => {
    if (!ok) failures.push(label);
  };
  const dist = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  const groups: humanPolygonMan.IPolygonMan[][] = [
    [MotionBodies.population("f-small"), MotionBodies.population("f-tall")],
    [MotionBodies.population("m-short"), MotionBodies.population("m-tall")],
  ];
  const lengths: (keyof IAutoMovieBodyMeasure)[] = [
    "stature",
    "hipHeight",
    "shoulderHeight",
    "thigh",
    "shank",
    "upperArm",
    "forearm",
    "footLength",
    "shoulderHalfWidth",
  ];
  for (const [small, large] of groups)
    for (const key of lengths)
      check(
        `${key} grows with stature (${small!.id} ${large!.id})`,
        large!.measure[key] > small!.measure[key],
      );
  for (const man of groups.flat()) {
    const m: IAutoMovieBodyMeasure = man.measure;
    for (const [key, share] of [
      ["thigh", 0.245],
      ["shank", 0.246],
      ["upperArm", 0.186],
      ["forearm", 0.146],
      ["footLength", 0.152],
      ["hipHeight", 0.53],
      ["shoulderHeight", 0.8],
    ] as const)
      check(
        `${man.id} ${key} share ${(m[key] / m.stature).toFixed(3)} near ${share}`,
        Math.abs(m[key] / m.stature / share - 1) < 0.25,
      );
    const body: AutoMovieHumanCanonicalBody.IBody = man.body;
    const surfaces = resolveAutoMovieHumanoidSurfaces(
      body.skeleton,
      body.profile,
    );
    const rest = fk(body, {
      skeleton: body.skeleton.id,
      root: null,
      joints: [],
    });
    const place = (
      frame: resolveAutoMovieHumanoidSurfaces.IFrame,
      bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    ) => resolveAutoMovieHumanoidSurfaces.place(frame, bones.get(frame.bone)!);
    check(
      `${man.id} soles on the floor`,
      Math.abs(place(surfaces.sockets.soleLeft, rest).point.y) < 0.002 &&
        Math.abs(place(surfaces.sockets.heelRight, rest).point.y) < 0.002,
    );
    check(
      `${man.id} head top at stature`,
      Math.abs(place(surfaces.regions.crown, rest).point.y - m.stature) < 0.002,
    );
    const pose: IAutoMoviePose = {
      ...zero(body, {
        spine: [20, 5, 10],
        chest: [10, 0, 10],
        leftUpperArm: [60, 30, 20],
        leftLowerArm: [70, 0, 30],
        rightUpperLeg: [50, 10, 0],
        rightLowerLeg: [60, 0, 0],
        head: [10, 0, 20],
      }),
      root: {
        translation: { x: 0.3, y: -0.1, z: 0.5 },
        rotation: { x: 0, y: Math.sin(0.4), z: 0, w: Math.cos(0.4) },
        scale: { x: 1, y: 1, z: 1 },
      },
    };
    const posed = fk(body, pose);
    const frames: [string, resolveAutoMovieHumanoidSurfaces.IFrame][] = [
      ...(Object.entries(surfaces.regions) as [
        AutoMovieHumanoidRegion,
        resolveAutoMovieHumanoidSurfaces.IFrame,
      ][]),
      ...(Object.entries(surfaces.sockets) as [
        AutoMovieHumanoidSocket,
        resolveAutoMovieHumanoidSurfaces.IFrame,
      ][]),
    ];
    for (const [name, frame] of frames) {
      // Points fixed to the same bone: its own joint and its children's joints.
      const rigid: AutoMovieHumanoidBone[] = [
        frame.bone,
        ...body.skeleton.bones
          .filter((b) => b.parent === frame.bone)
          .map((b) => b.bone),
      ];
      for (const joint of rigid) {
        const before: number = dist(
          place(frame, rest).point,
          rest.get(joint)!.worldPosition,
        );
        const after: number = dist(
          place(frame, posed).point,
          posed.get(joint)!.worldPosition,
        );
        check(
          `${man.id} ${name} rides ${frame.bone} (${joint}: ${(after - before).toFixed(5)})`,
          Math.abs(before - after) < 0.001,
        );
      }
    }

    // Human limbs: the knee folds forward, the elbow follows its hint.
    const zeroPose: IAutoMoviePose = zero(body, {});
    const hip: IAutoMovieVector3 = rest.get("leftUpperLeg")!.worldPosition;
    const ankle: IAutoMovieVector3 = {
      x: hip.x,
      y: hip.y - 0.55 * (m.thigh + m.shank),
      z: 0.35 * (m.thigh + m.shank),
    };
    const leg = (bend: IAutoMovieVector3) =>
      fk(
        body,
        fitChainToTarget({
          skeleton: body.skeleton,
          pose: zeroPose,
          chain: {
            upper: "leftUpperLeg",
            lower: "leftLowerLeg",
            effector: "leftFoot",
          },
          target: ankle,
          bend,
          topology: indexSkeletonTopology(body.skeleton),
          jointAxes: HUMANOID_JOINT_AXES,
          restFrames: HUMANOID_REST_FRAME,
        }),
      );
    for (const [label, bend] of [
      ["forward", { x: hip.x, y: hip.y, z: 2 }],
      ["backward", { x: hip.x, y: hip.y, z: -2 }],
    ] as const) {
      const bones = leg(bend);
      const knee: IAutoMovieVector3 = bones.get("leftLowerLeg")!.worldPosition;
      const lineZ: number =
        hip.z + ((ankle.z - hip.z) * (hip.y - knee.y)) / (hip.y - ankle.y);
      check(
        `${man.id} knee hinted ${label} reaches`,
        dist(bones.get("leftFoot")!.worldPosition, ankle) < 0.001,
      );
      check(
        `${man.id} knee hinted ${label} folds forward`,
        knee.z > lineZ + 0.02,
      );
    }
    const shoulder: IAutoMovieVector3 = rest.get("leftUpperArm")!.worldPosition;
    const wrist: IAutoMovieVector3 = {
      x: shoulder.x + 0.35 * m.upperArm,
      y: shoulder.y - 0.3 * m.upperArm,
      z: 0.9 * m.forearm,
    };
    const arm = (bend: IAutoMovieVector3) =>
      fk(
        body,
        fitChainToTarget({
          skeleton: body.skeleton,
          pose: zeroPose,
          chain: {
            upper: "leftUpperArm",
            lower: "leftLowerArm",
            effector: "leftHand",
          },
          target: wrist,
          bend,
          topology: indexSkeletonTopology(body.skeleton),
          jointAxes: HUMANOID_JOINT_AXES,
          restFrames: HUMANOID_REST_FRAME,
        }),
      );
    const down = arm({ x: shoulder.x + 0.3, y: shoulder.y - 1, z: 0 });
    const up = arm({ x: shoulder.x + 0.3, y: shoulder.y + 1, z: 0 });
    check(
      `${man.id} arm reaches with either hint`,
      dist(down.get("leftHand")!.worldPosition, wrist) < 0.001 &&
        dist(up.get("leftHand")!.worldPosition, wrist) < 0.001,
    );
    check(
      `${man.id} elbow follows its hint`,
      down.get("leftLowerArm")!.worldPosition.y <
        up.get("leftLowerArm")!.worldPosition.y - 0.03,
    );
  }
  TestValidator.predicate(
    failures.join("; ") || "all checks",
    failures.length === 0,
  );
}

/** A full clinical-zero pose with some bones set. */
function zero(
  body: AutoMovieHumanCanonicalBody.IBody,
  set: Partial<Record<AutoMovieHumanoidBone, [number, number, number]>>,
): IAutoMoviePose {
  return {
    skeleton: body.skeleton.id,
    root: null,
    joints: body.skeleton.bones.map((b) => {
      const a: [number, number, number] = set[b.bone] ?? [0, 0, 0];
      return { bone: b.bone, flexion: a[0], abduction: a[1], twist: a[2] };
    }),
  };
}

/** Forward kinematics with the canonical reading. */
function fk(
  body: AutoMovieHumanCanonicalBody.IBody,
  pose: IAutoMoviePose,
): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
  return new Map(
    resolvePose(
      pose,
      body.skeleton,
      HUMANOID_JOINT_AXES,
      HUMANOID_REST_FRAME,
    ).map((r) => [r.bone, r]),
  );
}
