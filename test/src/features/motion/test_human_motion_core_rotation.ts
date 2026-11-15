import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieMotionEvent,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  type HumanSegment,
  type IHumanBody,
  type IHumanPosture,
  mixHumanPosture,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A whole-body rotation on the posture, blended as a rotation (#3423):
 * `IHumanPosture.rotation`, resolved by `resolveHumanPosture` and mixed by
 * `mixHumanPosture`.
 *
 * The postures stand with both arms reaching forward to world goals at
 * chest height, or with the left palm attached to the chest (`on`), on the
 * average man and the small woman.
 *
 * Scenarios:
 * 1. Metamorphic: a posture with a rotation about its centre resolves to the
 *    bones of the same posture resolved without it and then turned rigidly
 *    about that point, within 1e-9 m for every bone, for free arm goals and
 *    an attached one, under three turns (a quarter about the left axis, a
 *    half about the long axis, and a tilted 73 degrees).
 * 2. Slerp: mixing two rotations about different axes at 0.25, 0.5 and 0.75
 *    gives turns whose angle from the first is that share of the whole
 *    angle within 1e-9 rad; a posture without a rotation mixes as the
 *    identity about the other's point; neither having one leaves none.
 * 3. Continuity through the vertical: a body pitched through 90 degrees in
 *    steps of a degree while turning about its long axis moves no bone more
 *    between steps than a degree's arc at the stature (no snap at the
 *    heading's singular pitch).
 * 4. A posture with a rotation and a planted world goal is refused, the
 *    message naming the limb.
 * 5. The front crawl rolls on the root: at each breath the pelvis holds the
 *    stroke's own twist (0) and the mouth clears the water plane by the
 *    law's 2 cm within 1 mm (#3423).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Resolves and mixes real postures through the public functions and reads the bones; a goal not turned with the root, an attached goal turned twice, a blend that is not constant-speed, a snap at the vertical or a plant silently turned fails.
 * @evidence contracts/development/testing.md#independent-expectations The rigid motion's definition, slerp's constant angular speed, and an arc's length at the stature.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies, free and attached goals, three turns, three weights, absent rotations on either side, a sweep through the vertical and a planted refusal; the salto's and the swim's re-expression belong to their own tests.
 * @evidence contracts/development/testing.md#execution-ownership In memory on prepared bodies, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios and their bounds.
 */
export function test_human_motion_core_rotation(): void {
  type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  const findings: string[] = [];
  const DEG: number = 180 / Math.PI;

  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const chest: number = body.measure.chestHeight;
    const reach = (side: "left" | "right"): IHumanPosture.IGoal => ({
      point: { x: side === "left" ? 0.15 : -0.15, y: chest, z: 0.35 },
      bend: { x: side === "left" ? 0.5 : -0.5, y: chest - 0.3, z: 0 },
    });
    const free: IHumanPosture = {
      root: { x: 0, y: 0, z: 0 },
      yaw: 0,
      pitch: 0,
      roll: 0,
      joints: {},
      limbs: { leftArm: reach("left"), rightArm: reach("right") },
    };
    const attached: IHumanPosture = {
      ...free,
      limbs: {
        rightArm: reach("right"),
        leftArm: {
          point: { x: -0.05, y: 0.1, z: 0.12 },
          bend: { x: 0.4, y: 0, z: 0 },
          on: "chest",
        },
      },
    };
    const about: IAutoMovieVector3 = {
      x: 0,
      y: 0.55 * body.measure.stature,
      z: 0,
    };
    const turns: IAutoMovieQuaternion[] = [
      Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
      Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 180),
      Quaternion.fromAxisAngle(Vector3.normalize({ x: 1, y: -2, z: 0.7 }), 73),
    ];

    // 1. A rotation is the rigid turn of the unrotated resolution.
    for (const [kind, posture] of [
      ["free", free],
      ["attached", attached],
    ] as const) {
      const plain: Bones = poseBones(body, resolveHumanPosture(body, posture));
      for (const turn of turns) {
        const turned: Bones = poseBones(
          body,
          resolveHumanPosture(body, { ...posture, rotation: { about, turn } }),
        );
        let worst: number = 0;
        for (const [bone, r] of plain) {
          const expected: IAutoMovieVector3 = Vector3.add(
            about,
            Quaternion.rotateVector(
              turn,
              Vector3.subtract(r.worldPosition, about),
            ),
          );
          worst = Math.max(
            worst,
            Vector3.length(
              Vector3.subtract(turned.get(bone)!.worldPosition, expected),
            ),
          );
        }
        if (!(worst <= 1e-9))
          findings.push(
            `${name} ${kind}: a turned posture is ${worst.toExponential(2)} m off the rigidly turned one`,
          );
      }
    }

    // 2. Mixing is a slerp.
    const a: IHumanPosture.IRotation = { about, turn: turns[0]! };
    const b: IHumanPosture.IRotation = { about, turn: turns[2]! };
    const whole: number = Quaternion.angle(a.turn, b.turn);
    for (const w of [0.25, 0.5, 0.75]) {
      const mixed: IHumanPosture = mixHumanPosture(
        { ...free, rotation: a },
        { ...free, rotation: b },
        w,
      );
      const angle: number = Quaternion.angle(a.turn, mixed.rotation!.turn);
      if (Math.abs(angle - w * whole) > 1e-9)
        findings.push(
          `${name}: at ${w} the mix turns ${angle * DEG} degrees of ${whole * DEG}`,
        );
    }
    const one: IHumanPosture = mixHumanPosture(
      free,
      { ...free, rotation: b },
      0.5,
    );
    if (
      one.rotation === undefined ||
      Math.abs(
        Quaternion.angle(Quaternion.identity(), one.rotation.turn) -
          Quaternion.angle(Quaternion.identity(), b.turn) / 2,
      ) > 1e-9
    )
      findings.push(`${name}: a missing rotation does not mix as the identity`);
    if (mixHumanPosture(free, free, 0.5).rotation !== undefined)
      findings.push(`${name}: two postures without a rotation mix into one`);

    // 3. Through the vertical without a snap.
    let previous: Bones | null = null;
    let jump: number = 0;
    for (let d: number = 60; d <= 120; d++) {
      const turn: IAutoMovieQuaternion = Quaternion.multiply(
        Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, d),
        Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 2 * d),
      );
      const bones: Bones = poseBones(
        body,
        resolveHumanPosture(body, { ...free, rotation: { about, turn } }),
      );
      if (previous !== null)
        for (const [bone, r] of bones)
          jump = Math.max(
            jump,
            Vector3.length(
              Vector3.subtract(
                r.worldPosition,
                previous.get(bone)!.worldPosition,
              ),
            ),
          );
      previous = bones;
    }
    // Each step turns about 2.24 degrees (one about the left axis and two
    // about the long axis), so no point at a stature's reach moves further.
    const bound: number = (Math.hypot(1, 2) / DEG) * body.measure.stature;
    if (jump > bound)
      findings.push(
        `${name}: a bone moves ${(1000 * jump).toFixed(1)} mm in one step through the vertical, over ${(1000 * bound).toFixed(1)} mm`,
      );

    // 4. A planted world goal cannot turn.
    const planted: IHumanPosture = {
      ...free,
      limbs: {
        leftLeg: {
          point: { x: 0.1, y: 0.08, z: 0 },
          bend: { x: 0.1, y: 0.5, z: 0.5 },
          planted: true,
        },
      },
      rotation: { about, turn: turns[0]! },
    };
    try {
      resolveHumanPosture(body, planted);
      findings.push(`${name}: a planted world goal is turned with the body`);
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("leftLeg"))
        findings.push(
          `${name}: the refusal does not name the limb: ${String(error)}`,
        );
    }
  }

  // 5. The crawl rolls on the root: its pelvis keeps the stroke's own joint,
  // and each breath clears the mouth over the plane by the law's 2 cm.
  {
    const body: IHumanBody = motionHumanBody("m-average");
    const water: number = 1;
    const p: HumanPerformance = new HumanPerformance({
      seed: "rotation-crawl",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a")
        .stand({ seconds: 0.5 })
        .swim({ kind: "frontCrawl", cycles: 2, water }).node,
    });
    const s: HumanSegment.ISegment = p.segments("a")[1]!;
    for (const e of s.plan.events.filter((x: IAutoMovieMotionEvent): boolean =>
      x.name.startsWith("breath"),
    )) {
      const t: number = s.start + e.share * s.plan.duration;
      const bones: Bones = p.bones("a", t);
      const frame: resolveAutoMovieHumanoidSurfaces.IFrame =
        body.surfaces.regions.mouth;
      const mouth: number = resolveAutoMovieHumanoidSurfaces.place(
        frame,
        bones.get(frame.bone)!,
      ).point.y;
      if (mouth - water < 0.02 - 0.001)
        findings.push(`crawl: the mouth clears the plane by ${(1000 * (mouth - water)).toFixed(1)} mm at ${e.name}`);
      const hips: IAutoMovieJointPose | undefined = p.pose("a", t).joints.find(
        (j: IAutoMovieJointPose): boolean => j.bone === "hips",
      );
      if (hips !== undefined && Math.abs(hips.twist ?? 0) > 1e-9)
        findings.push(`crawl: the pelvis twists ${hips.twist} degrees at ${e.name}, not the stroke's own 0`);
    }
  }
  TestValidator.predicate(
    `whole-body rotation: ${findings.join("; ") || "all hold"}`,
    findings.length === 0,
  );
}
