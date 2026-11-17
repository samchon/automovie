import type { IAutoMovieHumanoidSurfaces, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanColliders, IAutoMovieMotionHumanPerformance, IAutoMovieMotionHumanPosture, IAutoMovieResolvedBone, AutoMovieHumanoidRegion, IAutoMoviePose, IAutoMovieVector3 } from "@automovie/interface";
import { Quaternion, Vector3, physicalShapeSegmentDistance, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";

import { AutoMovieMotionHumanChannel, HumanChain, HumanColliders, HumanGrip, HumanPerformance, HumanVerdicts, poseBones, resolveHumanPosture } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/** A digit region's world point on a pose. */
const at = (
  body: IAutoMovieMotionHumanBody,
  pose: IAutoMoviePose,
  region: AutoMovieHumanoidRegion,
): IAutoMovieVector3 => {
  const frame: IAutoMovieHumanoidSurfaces.IFrame =
    body.surfaces.regions[region];
  const bone: IAutoMovieResolvedBone = poseBones(body, pose).get(frame.bone)!;
  return resolveAutoMovieHumanoidSurfaces.place(frame, bone).point;
};

/**
 * Digit goals on the posture and digit claims (#3445).
 *
 * The average man stands with his right arm forward, the hand held by an
 * arm goal; digit goals are given on top.
 *
 * Scenarios:
 *
 * 1. A forefinger goal at a reachable point (the tip under a known pinch) is
 *    met within 0.5 mm in the resolved pose, the issue's bound, on both sides.
 * 2. A goal on a bone rides it: the thumb's tip on the forefinger's pad
 *    (`on` its distal phalanx) is met within 0.5 mm.
 * 3. A posture with no digit goals resolves exactly as before: the same
 *    pose, to the bit, as one whose `digits` is empty.
 * 4. Claims: a hand's channel covers its five digits' bones and goals, a
 *    digit claim covers only its own, and a digit never covers its hand.
 * 5. Merge: a digit claim takes that digit's joints and goal from the written
 *    posture and leaves the hand's other digits as the base has them.
 * 6. A right hand at rest in the pocket, on the hip and at the side lays its
 *    digits on the body: no phalanx (a capsule of the profile's radius) lies
 *    deeper in another part of the body than the verdicts' skin
 *    (`HumanVerdicts.SKIN`), the tangle audit's give.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Resolves postures with digit goals on a generated body and exercises the claim helpers and the merge.
 * @evidence contracts/development/testing.md#independent-expectations Goals are surface points of in-range poses, so reachable; the bound is the issue's; claims follow the hand-digit partition.
 * @evidence contracts/development/testing.md#distinguishing-cases Both sides, a world and a bone goal, empty goals, hand and digit claims.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit test preparing one polygon man; no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the cast and the six scenarios.
 */
export function test_human_motion_core_digits(): void {
  const complaints: string[] = [];
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
  const forward = (side: "left" | "right"): IAutoMovieMotionHumanPosture => ({
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {
      [`${side}Arm`]: {
        point: {
          x: (side === "left" ? 1 : -1) * m.shoulderHalfWidth,
          y: m.shoulderHeight - 0.2,
          z: 0.8 * (m.upperArm + m.forearm),
        },
        bend: { x: (side === "left" ? 1 : -1) * 0.5, y: 0, z: 0 },
        rotation: Quaternion.identity(),
      },
    },
  });

  // 1. A reachable forefinger point, on both sides.
  for (const side of ["left", "right"] as const) {
    const Side: string = side === "left" ? "Left" : "Right";
    const base: IAutoMovieMotionHumanPosture = forward(side);
    const pinch: IAutoMovieMotionHumanPosture = {
      ...base,
      joints: {
        [`${side}IndexProximal`]: [40, 0, 0],
        [`${side}IndexIntermediate`]: [40, 0, 0],
        [`${side}IndexDistal`]: [26.67, 0, 0],
      },
    };
    const goal: IAutoMovieVector3 = at(
      body,
      resolveHumanPosture(body, pinch),
      `indexTip${Side}` as AutoMovieHumanoidRegion,
    );
    const reached: IAutoMoviePose = resolveHumanPosture(body, {
      ...base,
      digits: { [`${side}Index`]: { point: goal, surface: "tip" } },
    });
    const miss: number = Vector3.length(
      Vector3.subtract(
        at(body, reached, `indexTip${Side}` as AutoMovieHumanoidRegion),
        goal,
      ),
    );
    if (!(miss <= 5e-4))
      complaints.push(
        `${side}: the forefinger's tip misses its goal by ${(miss * 1000).toFixed(3)} mm, within 0.5 mm expected`,
      );
  }

  // 2. A goal on a bone: the thumb's tip on the forefinger's pad.
  const base: IAutoMovieMotionHumanPosture = {
    ...forward("right"),
    joints: {
      rightIndexProximal: [45, 0, 0],
      rightIndexIntermediate: [45, 0, 0],
      rightIndexDistal: [30, 0, 0],
    },
  };
  const pad: IAutoMovieHumanoidSurfaces.IFrame =
    body.surfaces.regions.indexPadRight;
  const pinched: IAutoMoviePose = resolveHumanPosture(body, {
    ...base,
    digits: {
      rightThumb: {
        point: pad.point,
        normal: pad.normal,
        surface: "tip",
        on: pad.bone,
      },
    },
  });
  const opposition: number = Vector3.length(
    Vector3.subtract(
      at(body, pinched, "thumbTipRight"),
      at(body, pinched, "indexPadRight"),
    ),
  );
  if (!(opposition <= 5e-4))
    complaints.push(
      `the thumb's tip misses the forefinger's pad by ${(opposition * 1000).toFixed(3)} mm, within 0.5 mm expected`,
    );

  // 3. No digit goals: the pose as before.
  const plain: IAutoMoviePose = resolveHumanPosture(body, forward("right"));
  const empty: IAutoMoviePose = resolveHumanPosture(body, {
    ...forward("right"),
    digits: {},
  });
  if (JSON.stringify(plain) !== JSON.stringify(empty))
    complaints.push(
      "a posture with empty digit goals resolves differently from one with none",
    );

  // 4. Claims.
  const C = AutoMovieMotionHumanChannel;
  const facts: [string, boolean][] = [
    [
      "a hand covers its thumb's bone",
      C.covers(["rightHand"], "rightThumbDistal"),
    ],
    [
      "a hand covers its little finger's bone",
      C.covers(["rightHand"], "rightLittleProximal"),
    ],
    [
      "a thumb claim covers its own bone",
      C.covers(["rightThumb"], "rightThumbMetacarpal"),
    ],
    [
      "a thumb claim does not cover the forefinger",
      !C.covers(["rightThumb"], "rightIndexDistal"),
    ],
    [
      "a right claim does not cover the left",
      !C.covers(["rightHand"], "leftThumbDistal"),
    ],
    [
      "a hand's claim covers its digit's claim",
      C.claims(["leftHand"], "leftIndex"),
    ],
    [
      "a digit's claim does not cover its hand",
      !C.claims(["leftIndex"], "leftHand"),
    ],
    [
      "a digit names its bone",
      C.digit("leftMiddleIntermediate") === "leftMiddle",
    ],
    ["a wrist names no digit", C.digit("leftHand") === undefined],
  ];
  for (const [label, ok] of facts) if (!ok) complaints.push(label);

  // 5. Merge by a digit claim.
  const under: IAutoMovieMotionHumanPosture = {
    ...forward("right"),
    joints: { rightIndexProximal: [10, 0, 0], rightThumbProximal: [10, 0, 0] },
  };
  const written: IAutoMovieMotionHumanPosture = {
    ...forward("right"),
    joints: { rightIndexProximal: [50, 0, 0], rightThumbProximal: [50, 0, 0] },
    digits: { rightThumb: { point: { x: 0, y: 1, z: 0 }, surface: "pad" } },
  };
  const merged: IAutoMovieMotionHumanPosture = C.merge(under, written, ["rightThumb"]);
  if (
    !(
      merged.joints.rightThumbProximal?.[0] === 50 &&
      merged.joints.rightIndexProximal?.[0] === 10
    )
  )
    complaints.push("a thumb claim did not take the thumb's joint alone");
  if (
    merged.digits?.rightThumb === undefined ||
    merged.digits?.rightIndex !== undefined
  )
    complaints.push("a thumb claim did not take the thumb's goal alone");

  // 6. A hand at rest on the body lays its digits on it: no phalanx of the
  // resting hand lies deeper in another part of the body than the skin's
  // give, for each place a hand rests against the thigh or hip.
  for (const place of ["pocket", "hip", "side"] as const)
    try {
      const performance: IAutoMovieMotionHumanPerformance = new HumanPerformance({
        seed: "digits",
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("a").rest({ right: place, seconds: 1 })
          .node,
      });
      const bones = performance.bones("a", performance.duration - 0.05);
      const others: readonly IAutoMovieMotionHumanColliders.IPlaced[] = HumanColliders.placed(
        body,
        bones,
      ).filter(
        (p: IAutoMovieMotionHumanColliders.IPlaced): boolean =>
          !/^right(Hand|Thumb|Index|Middle|Ring|Little|LowerArm)/.test(p.bone),
      );
      for (const digit of ["Thumb", "Index", "Middle", "Ring", "Little"] as const) {
        const chain = HumanGrip.chain(body, "right", digit);
        const points: IAutoMovieVector3[] = chain.bones.map(
          (b) => bones.get(b)!.worldPosition,
        );
        const last = bones.get(chain.bones.at(-1)!)!;
        points.push(
          Vector3.add(
            last.worldPosition,
            Quaternion.rotateVector(last.worldRotation, chain.tip),
          ),
        );
        let deepest: number = 0;
        let into: string = "";
        for (const p of others)
          for (const shape of p.shapes)
            points.slice(1).forEach((b: IAutoMovieVector3, i: number): void => {
              const depth: number =
                chain.radius -
                physicalShapeSegmentDistance(p.pose, shape, points[i]!, b);
              if (depth > deepest) {
                deepest = depth;
                into = p.bone;
              }
            });
        if (!(deepest <= HumanVerdicts.SKIN))
          complaints.push(
            `rest at ${place}: the right ${digit.toLowerCase()} lies ${(deepest * 1000).toFixed(1)} mm in ${into}, within the skin's ${HumanVerdicts.SKIN * 1000} mm expected`,
          );
      }
    } catch (error) {
      complaints.push(
        `rest at ${place}: expected to plan, got ${(error as Error).message}`,
      );
    }
  TestValidator.equals("digit goals and digit claims", complaints, []);
}
