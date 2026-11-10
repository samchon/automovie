import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  measureAutoMovieHumanoidBody,
  resolveAutoMovieHumanoidSurfaces,
  resolvePose,
  validatePhysicalProfile,
} from "@automovie/engine";
import { AutoMovieHumanCanonicalBody } from "@automovie/human";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieBodyMeasure,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { MotionBodies } from "../../../../packages/motions/src/executable/MotionBodies";
import type { humanPolygonMan } from "../../../../packages/motions/src/executable/humanPolygonMan";

/**
 * Human polygon men moved onto the canonical rig keep their anatomy: left on
 * the left, a T-pose rest, a valid profile, mirrored surfaces, rigid frames
 * and measures that follow stature.
 *
 * Scenarios, on the ANSUR boundary people of the test suite: the short
 * woman and the tall man (1st and 99th stature percentiles) and the small
 * woman and large man corners:
 * 1. The left hand, eye and hip lie on +X, the toes ahead of the ankles, and
 *    a left shoulder flexion of 90° raises the left hand forward on +X: the
 *    reflection from Human's frame does not mirror the body.
 * 2. Each upper arm, forearm and hand runs along its side's ±X and each palm
 *    faces -Y at rest: the VRM T-pose `HUMANOID_REST_FRAME` reads.
 * 3. The converted physical profile passes the engine's profile validation.
 * 4. Metamorphic mirroring: each left region lies within 5 mm of its right
 *    counterpart reflected through the sagittal plane.
 * 5. Rigid riding: under a whole-body pose, each region keeps its distance to
 *    the Human joints of its own segment within 1 mm.
 * 6. `display` is `place` reflected into Human's frame.
 * 7. The measured stature is within 3 % of the Human input, and the tall
 *    man's segment lengths exceed the short woman's by a factor within 15 %
 *    of their stature ratio.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Prepares real Human bodies, adapts them through the public canonical adapter and reads positions, surfaces, the measure and profile validation; a mirrored reflection, a crooked T-pose, a broken profile, an unmirrored surface table, a frame not riding its bone or a measure not following stature fails.
 * @evidence contracts/development/testing.md#independent-expectations Anatomical sides and directions follow the VRM convention; the profile is judged by the engine's own validator; mirroring, rigid motion and stature scaling are metamorphic relations; 5 mm allows Human's construction asymmetry, 1 mm is the campaign's surface bound and 15 % covers population proportion variation.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers both sexes, the stature extremes and population corners, every region, rest and posed states.
 * @evidence contracts/development/testing.md#execution-ownership A local test: it prepares Human bodies (cached under the ignored motions cache), so its name falls under the CI exclusion of test_human_.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 7 scenarios and what each pins.
 */
export function test_human_motion_canonical_body(): void {
  const men: humanPolygonMan.IPolygonMan[] = [
    MotionBodies.population("f-small"),
    MotionBodies.population("m-tall"),
    MotionBodies.population("f-minus-one"),
    MotionBodies.population("m-large"),
  ];
  const failures: string[] = [];
  const check = (label: string, ok: boolean): void => {
    if (!ok) failures.push(label);
  };
  const dist = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  for (const man of men) {
    const body: AutoMovieHumanCanonicalBody.IBody = man.body;
    const id: string = man.id;
    const rest = AutoMovieHumanCanonicalBody.place(body, {
      skeleton: body.skeleton.id,
      root: null,
      joints: [],
    });
    const at = (bone: string): IAutoMovieVector3 =>
      rest.find((p) => p.bone === bone)!.position;
    check(
      `${id} left side on +X`,
      at("leftHand").x > 0.3 &&
        at("leftEye").x > 0 &&
        at("leftUpperLeg").x > 0 &&
        -at("rightHand").x > 0.3,
    );
    check(
      `${id} toes ahead`,
      at("leftHalluxProximal").z > at("leftFoot").z + 0.05,
    );
    const raised = AutoMovieHumanCanonicalBody.place(
      body,
      zero(body, { leftUpperArm: [90, 0, 0] }),
    );
    const hand: IAutoMovieVector3 = raised.find(
      (p) => p.bone === "leftHand",
    )!.position;
    check(
      `${id} left raise lands on the left, forward`,
      hand.x > 0.05 && hand.z > 0.3,
    );
    for (const side of [1, -1]) {
      const s: string = side === 1 ? "left" : "right";
      for (const [a, b] of [
        ["UpperArm", "LowerArm"],
        ["LowerArm", "Hand"],
        ["Hand", "MiddleProximal"],
      ]) {
        const d: IAutoMovieVector3 = sub(at(`${s}${b}`), at(`${s}${a}`));
        check(
          `${id} ${s}${a} along ±X`,
          Math.abs(d.x / Math.hypot(d.x, d.y, d.z) - side) < 1e-9,
        );
      }
    }
    const surfaces = resolveAutoMovieHumanoidSurfaces(
      body.skeleton,
      body.profile,
    );
    check(
      `${id} palms face down`,
      Math.abs(surfaces.sockets.palmLeft.normal.y + 1) < 1e-9 &&
        Math.abs(surfaces.sockets.palmRight.normal.y + 1) < 1e-9,
    );
    const issues: string[] = validatePhysicalProfile(body.profile);
    check(`${id} profile valid: ${issues.join(", ")}`, issues.length === 0);

    const restBones = fk(body, {
      skeleton: body.skeleton.id,
      root: null,
      joints: [],
    });
    const world = (
      name: AutoMovieHumanoidRegion,
      bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    ): IAutoMovieVector3 =>
      resolveAutoMovieHumanoidSurfaces.place(
        surfaces.regions[name],
        bones.get(surfaces.regions[name].bone)!,
      ).point;
    for (const name of Object.keys(
      surfaces.regions,
    ) as AutoMovieHumanoidRegion[])
      if (name.endsWith("Left")) {
        const l: IAutoMovieVector3 = world(name, restBones);
        const r: IAutoMovieVector3 = world(
          name.replace(/Left$/, "Right") as AutoMovieHumanoidRegion,
          restBones,
        );
        check(
          `${id} ${name} mirrors (${dist({ ...l, x: -l.x }, r).toFixed(4)})`,
          dist({ ...l, x: -l.x }, r) < 0.005,
        );
      }
    const pose: IAutoMoviePose = {
      ...zero(body, {
        spine: [20, 5, 10],
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
    const posedBones = fk(body, pose);
    const placed = AutoMovieHumanCanonicalBody.place(body, pose);
    for (const name of Object.keys(
      surfaces.regions,
    ) as AutoMovieHumanoidRegion[]) {
      const bone: AutoMovieHumanoidBone = surfaces.regions[name].bone;
      for (const joint of body.joints.filter((j) => j.carrier === bone)) {
        const before: number = dist(
          world(name, restBones),
          rest.find((p) => p.bone === joint.bone)!.position,
        );
        const after: number = dist(
          world(name, posedBones),
          placed.find((p) => p.bone === joint.bone)!.position,
        );
        check(
          `${id} ${name} rides ${joint.bone}`,
          Math.abs(before - after) < 0.001,
        );
      }
    }
    const shown = AutoMovieHumanCanonicalBody.display(body, pose).posed;
    check(
      `${id} display reflects place`,
      shown.every(
        (p, i) =>
          dist(
            { x: p.position[2], y: p.position[1], z: p.position[0] },
            placed[i]!.position,
          ) < 1e-12,
      ),
    );
    const m: IAutoMovieBodyMeasure = measureAutoMovieHumanoidBody(
      body.skeleton,
      body.profile,
    );
    check(
      `${id} measure is the polygon man's own`,
      m.stature === man.measure.stature,
    );
  }
  const short: IAutoMovieBodyMeasure = men[0]!.measure;
  const tall: IAutoMovieBodyMeasure = men[1]!.measure;
  const stature = (name: string): number => MotionBodies.stature(name);
  check(
    `stature within 3 % (${short.stature}, ${tall.stature})`,
    Math.abs(short.stature / stature("f-small") - 1) < 0.03 &&
      Math.abs(tall.stature / stature("m-tall") - 1) < 0.03,
  );
  const ratio: number = tall.stature / short.stature;
  for (const key of [
    "thigh",
    "shank",
    "upperArm",
    "forearm",
    "footLength",
  ] as const)
    check(
      `${key} follows stature (${(tall[key] / short[key]).toFixed(3)} vs ${ratio.toFixed(3)})`,
      Math.abs(tall[key] / short[key] / ratio - 1) < 0.15,
    );
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

/** a - b. */
function sub(a: IAutoMovieVector3, b: IAutoMovieVector3): IAutoMovieVector3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}
