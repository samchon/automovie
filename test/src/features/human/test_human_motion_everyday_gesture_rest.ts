import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanHand,
  HumanPerformance,
  type IHumanBody,
  createHumanBody,
  type gesture,
  type rest,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { MotionBodies } from "../../../../packages/motions/src/executable/MotionBodies";

/**
 * On polygon men of different statures and proportions, gestures bring
 * their hand surfaces where they mean to, rest places hold the hands on the
 * body, and the feet never slide.
 *
 * Scenarios, on the small woman, the tall man, the long-armed man and the
 * short-legged man:
 * 1. Pointing at a point up and to the left puts the index fingertip within
 *    2 degrees of the line from the right eye to the target in mid-stroke.
 * 2. Touching the forehead and pushing up glasses bring the index finger's
 *    distal phalanx collider (the hand's, on a profile without finger
 *    colliders) within 10 mm of the forehead or nose-bridge region in
 *    mid-stroke.
 * 3. Clapping brings the palms within 10 mm of each other at every beat.
 * 4. Waving, nodding, shrugging and bowing keep both feet planted within
 *    5 mm, and a bow lowers the head by at least 0.9 of what a 30 degree
 *    turn of the rest head about the hip joints' midpoint gives.
 * 5. Rest places bring the hand's collider within 10 mm of the place's
 *    region (the pocket, the hip, the back of the head, the chin), the
 *    crossed palms within 10 mm of the other upper arm's surface, and the
 *    pocket palm does not sink into the thigh's colliders beyond 10 mm.
 * 6. A paired place named for one hand is refused, and pointing without a
 *    target is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs whole performances and reads the posed bones and colliders; a fingertip off the line, a touch that misses, palms that do not meet, a sliding foot or a missing refusal fails.
 * @evidence contracts/development/testing.md#independent-expectations Bounds are the campaign's 2 degree pointing, 10 mm self-touch and contact, 5 mm slip and -10 mm penetration acceptance; distances are measured to the hand's own collider and the body's region points by forward kinematics, never read from the laws' goals.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers one-hand, two-hand, head and trunk gestures, six rest places and two refusals across four bodies; stroke signals and Effort arithmetic are owned by the CI tests.
 * @evidence contracts/development/testing.md#execution-ownership A local test: it prepares polygon men, so its name falls under the CI exclusion of test_human_.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 6 scenarios and what each pins.
 */
export function test_human_motion_everyday_gesture_rest(): void {
  const failures: string[] = [];
  const check = (label: string, ok: boolean): void => {
    if (!ok) failures.push(label);
  };
  for (const name of ["f-small", "m-tall", "m-long-armed", "m-short-legged"]) {
    const man = MotionBodies.population(name);
    const body: IHumanBody = createHumanBody(
      man.body.skeleton,
      man.body.profile,
    );
    const perform = (chain: HumanChain): HumanPerformance =>
      new HumanPerformance({
        seed: `gesture-${name}`,
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: chain.node,
      });
    const one = (params: gesture.IParams) => {
      const performance: HumanPerformance = perform(
        HumanChain.subject("a").gesture(params),
      );
      const segment = performance.segments("a")[0]!;
      const at = (event: string): number =>
        segment.start +
        segment.plan.events.find((e) => e.name === event)!.share *
          segment.plan.duration;
      return {
        performance,
        segment,
        start: at("strokeStart"),
        end: at("strokeEnd"),
      };
    };

    // Pointing: the fingertip on the eye-to-target line.
    const goal: IAutoMovieVector3 = { x: 1.5, y: 2.2, z: 3 };
    const pointing = one({
      kind: "point",
      side: "right",
      target: { kind: "point", at: goal, frame: "world" },
    });
    const mid: number = (pointing.start + pointing.end) / 2;
    const bones = pointing.performance.bones("a", mid);
    const eye: IAutoMovieVector3 = bones.get("rightEye")!.worldPosition;
    const tip: IAutoMovieVector3 = HumanHand.frame(
      body,
      bones,
      "right",
      "indexTip",
      "point",
    ).point;
    const angle: number = degrees(
      Vector3.subtract(tip, eye),
      Vector3.subtract(goal, eye),
    );
    check(`${name} pointing ${angle.toFixed(2)} deg`, angle <= 2);
    check(`${name} pointing slip`, slip(pointing.performance, body) <= 0.005);

    // Self-touch.
    for (const [kind, region] of [
      ["touchFace", "forehead"],
      ["pushGlasses", "noseBridge"],
    ] as const) {
      const touch = one({ kind, side: "right", region: "forehead" });
      const t: number = (touch.start + touch.end) / 2;
      const b = touch.performance.bones("a", t);
      const d: number = boneDistance(
        body,
        b,
        body.profile.segments.some((x) => x.bone === "rightIndexDistal")
          ? "rightIndexDistal"
          : "rightHand",
        place(body, b, region),
      );
      check(`${name} ${kind} ${(d * 1000).toFixed(1)} mm`, Math.abs(d) <= 0.01);
    }

    // Claps meet on every beat.
    const clap = one({ kind: "clap", count: 4 });
    for (let k: number = 0; k < 4; k++) {
      const t: number = clap.start + ((k + 0.5) / 4) * (clap.end - clap.start);
      const b = clap.performance.bones("a", t);
      const gap: number = Vector3.length(
        Vector3.subtract(
          HumanHand.frame(body, b, "left", "palm").point,
          HumanHand.frame(body, b, "right", "palm").point,
        ),
      );
      check(`${name} clap ${k} gap ${(gap * 1000).toFixed(1)} mm`, gap <= 0.01);
    }

    // Planted feet through the other gestures; a bow lowers the head.
    for (const kind of ["wave", "nod", "shrug", "bow"] as const) {
      const g = one({ kind });
      check(
        `${name} ${kind} slip ${slip(g.performance, body).toFixed(4)}`,
        slip(g.performance, body) <= 0.005,
      );
      if (kind === "bow") {
        const hip: number =
          (body.rest.get("leftUpperLeg")!.y +
            body.rest.get("rightUpperLeg")!.y) /
          2;
        const want: number =
          0.9 * (body.rest.get("head")!.y - hip) * (1 - Math.cos(Math.PI / 6));
        const drop: number =
          g.performance.bones("a", 0).get("head")!.worldPosition.y -
          g.performance.bones("a", g.start).get("head")!.worldPosition.y;
        check(
          `${name} bow lowers the head ${(drop * 1000).toFixed(1)} mm (at least ${(want * 1000).toFixed(1)})`,
          drop >= want,
        );
      }
    }

    // Rest places.
    const resting = (
      params: rest.IParams,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
      const performance: HumanPerformance = perform(
        HumanChain.subject("a").rest({ ...params, seconds: 2 }),
      );
      return performance.bones("a", performance.segments("a")[0]!.end);
    };
    for (const [placeName, region] of [
      ["pocket", "pocketFrontRight"],
      ["hip", "hipRight"],
      ["chinRest", "chin"],
    ] as const) {
      const b = resting({ right: placeName });
      const d: number = handDistance(body, b, "right", place(body, b, region));
      check(
        `${name} rest ${placeName} ${(d * 1000).toFixed(1)} mm`,
        Math.abs(d) <=
          0.01 +
            (placeName === "hip"
              ? 0.5 * (body.measure.waistHeight - body.measure.hipHeight)
              : 0),
      );
      if (placeName === "pocket") {
        const sink: number = boneDistance(
          body,
          b,
          "rightUpperLeg",
          HumanHand.frame(body, b, "right", "palm").point,
        );
        check(
          `${name} pocket penetration ${(sink * 1000).toFixed(1)} mm`,
          sink >= -0.01,
        );
      }
    }
    const behind = resting({ left: "behindHead", right: "behindHead" });
    check(
      `${name} behind the head`,
      Math.abs(
        handDistance(body, behind, "left", place(body, behind, "headBack")),
      ) <=
        0.01 + 0.25 * body.measure.headRadius,
    );
    const crossed = resting({ left: "crossed", right: "crossed" });
    for (const side of ["left", "right"] as const) {
      const other: "left" | "right" = side === "left" ? "right" : "left";
      const palm: IAutoMovieVector3 = HumanHand.frame(
        body,
        crossed,
        side,
        "palm",
      ).point;
      const d: number =
        segmentDistance(
          palm,
          crossed.get(`${other}UpperArm`)!.worldPosition,
          crossed.get(`${other}LowerArm`)!.worldPosition,
        ) - body.measure.upperArmRadius;
      check(
        `${name} crossed ${side} ${(d * 1000).toFixed(1)} mm`,
        Math.abs(d) <= 0.01,
      );
    }
  }
  const body: IHumanBody = ((): IHumanBody => {
    const man = MotionBodies.population("m-tall");
    return createHumanBody(man.body.skeleton, man.body.profile);
  })();
  const performer = {
    subject: "a",
    body,
    at: { x: 0, y: 0, z: 0 },
    yaw: 0,
    proficiency: { level: "trained" as const },
  };
  TestValidator.error(
    "one-handed crossed arms",
    (): unknown =>
      new HumanPerformance({
        seed: "x",
        performers: [performer],
        composition: HumanChain.subject("a").rest({ left: "crossed" }).node,
      }),
  );
  TestValidator.error(
    "pointing at nothing",
    (): unknown =>
      new HumanPerformance({
        seed: "x",
        performers: [performer],
        composition: HumanChain.subject("a").gesture({ kind: "point" }).node,
      }),
  );
  TestValidator.predicate(
    failures.join("; ") || "all checks",
    failures.length === 0,
  );
}

/** A region's world point on posed bones. */
function place(
  body: IHumanBody,
  bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  region: AutoMovieHumanoidRegion,
): IAutoMovieVector3 {
  const frame = body.surfaces.regions[region];
  return resolveAutoMovieHumanoidSurfaces.place(frame, bones.get(frame.bone)!)
    .point;
}

/** Signed distance from a point to the hand's colliders (negative inside), metres. */
function handDistance(
  body: IHumanBody,
  bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  side: "left" | "right",
  point: IAutoMovieVector3,
): number {
  return boneDistance(body, bones, `${side}Hand`, point);
}

/** Signed distance from a point to one bone's colliders (negative inside), metres. */
function boneDistance(
  body: IHumanBody,
  bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  bone: AutoMovieHumanoidBone,
  point: IAutoMovieVector3,
): number {
  const segment = body.profile.segments.find((s) => s.bone === bone)!;
  const hand: IAutoMovieResolvedBone = bones.get(bone)!;
  const rest: IAutoMovieVector3 = body.rest.get(bone)!;
  let best: number = Infinity;
  for (const shape of segment.shapes) {
    const restCentre: IAutoMovieVector3 = Vector3.add(
      segment.neutral.position,
      Quaternion.rotateVector(
        segment.neutral.rotation,
        shape.transform.position,
      ),
    );
    const centre: IAutoMovieVector3 = Vector3.add(
      hand.worldPosition,
      Quaternion.rotateVector(
        hand.worldRotation,
        Vector3.subtract(restCentre, rest),
      ),
    );
    const rotation = Quaternion.multiply(
      hand.worldRotation,
      Quaternion.multiply(segment.neutral.rotation, shape.transform.rotation),
    );
    const local: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(rotation),
      Vector3.subtract(point, centre),
    );
    if (shape.kind === "box") {
      const q: IAutoMovieVector3 = {
        x: Math.abs(local.x) - shape.halfExtents.x,
        y: Math.abs(local.y) - shape.halfExtents.y,
        z: Math.abs(local.z) - shape.halfExtents.z,
      };
      const outside: number = Vector3.length({
        x: Math.max(q.x, 0),
        y: Math.max(q.y, 0),
        z: Math.max(q.z, 0),
      });
      best = Math.min(best, outside + Math.min(Math.max(q.x, q.y, q.z), 0));
    } else if (shape.kind === "sphere")
      best = Math.min(best, Vector3.length(local) - shape.radius);
    else
      best = Math.min(
        best,
        segmentDistance(
          local,
          { x: 0, y: -shape.halfLength, z: 0 },
          { x: 0, y: shape.halfLength, z: 0 },
        ) - shape.radius,
      );
  }
  return best;
}

/** Distance from a point to a segment. */
function segmentDistance(
  p: IAutoMovieVector3,
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
): number {
  const ab: IAutoMovieVector3 = Vector3.subtract(b, a);
  const t: number = Math.max(
    0,
    Math.min(1, Vector3.dot(Vector3.subtract(p, a), ab) / Vector3.dot(ab, ab)),
  );
  return Vector3.length(
    Vector3.subtract(p, Vector3.add(a, Vector3.scale(ab, t))),
  );
}

/** Angle between two vectors, degrees. */
function degrees(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
  return (
    (Math.acos(
      Math.max(
        -1,
        Math.min(1, Vector3.dot(Vector3.normalize(a), Vector3.normalize(b))),
      ),
    ) *
      180) /
    Math.PI
  );
}

/** The largest horizontal drift of each foot's sole centre over a performance where both feet stay planted. */
function slip(performance: HumanPerformance, body: IHumanBody): number {
  let worst: number = 0;
  for (const side of ["Left", "Right"] as const) {
    const frame = body.surfaces.sockets[`sole${side}`];
    let first: IAutoMovieVector3 | undefined;
    for (let t: number = 0; t <= performance.duration + 1e-9; t += 1 / 24) {
      const p: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
        frame,
        performance.bones("a", t).get(frame.bone)!,
      ).point;
      first ??= p;
      worst = Math.max(worst, Math.hypot(p.x - first.x, p.z - first.z));
    }
  }
  return worst;
}
