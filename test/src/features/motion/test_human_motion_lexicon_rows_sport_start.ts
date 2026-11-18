import {
  Quaternion,
  Vector3,
  physicalShapeBounds,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanColliders,
  HumanFoot,
  HumanHand,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Check the displayed sprint set on the small woman, average man and large
 * man: front knee 90 degrees within the angle of a
 * 1 mm fit error, rear knee 117 +/- 11 and front hip 43 +/- 6 degrees
 * (Cavedon et al. 2019, table 2), and the sex-matched centre of mass within
 * 1 mm of 16.2 or 22.9 cm behind the start line (Ciacci et al. 2017 and
 * Slawinski et al. 2010, as reported by Valamatos et al. 2022).
 *
 * Scenarios:
 * 1. At set, the thumb and index pads meet the starter's line and the front
 *    foot remains at the anthropometry-driven block distance. The four
 *    supports bear just above the track through the hold.
 * 2. The displayed knees, hip and centre of mass meet the measured set
 *    geometry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three bodies, displayed measurements, study values, precision and complaint ownership.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed joints, finger pads, contact surfaces and segmental centre of mass at the set, and the two planted rotations again at the end of the hold. A fit that stops before attaining a contact or loses it in its display fails.
 * @evidence contracts/development/testing.md#independent-expectations Cavedon's block spacing and included-angle data and the two sex-specific centre distances fix the expected geometry. The start line and floor come from the fixture, and the no-motion relation compares the same block during its hold.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks both feet and both hands, at the set and hold boundaries, on one small, one average and one large body. The one frontal target is body-scaled and the centre targets are sex-specific, not a mean replayed across bodies.
 * @evidence contracts/development/testing.md#execution-ownership One in-memory performance per body, two displayed bone reads per performance, shared by the measurements. No draw or physics host is involved.
 */
export function test_human_motion_lexicon_rows_sport_start(): void {
  const complaints: string[] = [];
  const included: (
    a: IAutoMovieVector3,
    knee: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ) => number = (
    a: IAutoMovieVector3,
    knee: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): number => {
    const u: IAutoMovieVector3 = Vector3.subtract(a, knee);
    const v: IAutoMovieVector3 = Vector3.subtract(b, knee);
    return (
      (Math.acos(
        Math.max(
          -1,
          Math.min(
            1,
            Vector3.dot(u, v) / (Vector3.length(u) * Vector3.length(v)),
          ),
        ),
      ) *
        180) /
      Math.PI
    );
  };
  for (const name of ["f-small", "m-average", "m-large"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    // The fixtures' bodies are named by sex (`f-`, `m-`), the stratum the
    // centre of mass's measured distance is read in.
    const sex: Sex = name.startsWith("f-") ? "female" : "male";
    let built: IAutoMovieMotionHumanPerformance;
    try {
      built = new HumanPerformance({
        seed: "sport",
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "elite" },
          },
        ],
        composition: HumanChain.subject("a").athletics({ sex }).node,
      });
    } catch (error) {
      complaints.push(
        `${name} sprint start: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    const placed: ReturnType<
      IAutoMovieMotionHumanPerformance["segments"]
    >[number] = built.segments("a")[0]!;
    const set: number =
      placed.start +
      (placed.plan.events.find(
        (e: IAutoMovieMotionEvent): boolean => e.name === "set",
      )?.share ?? NaN) *
        placed.plan.duration;
    if (Number.isNaN(set)) {
      complaints.push(`${name} sprint start: no set event`);
      continue;
    }
    const bones: ReturnType<IAutoMovieMotionHumanPerformance["bones"]> =
      built.bones("a", set);
    const gun: number =
      placed.start +
      (placed.plan.events.find(
        (e: IAutoMovieMotionEvent): boolean => e.name === "gun",
      )?.share ?? NaN) *
        placed.plan.duration;
    if (!Number.isFinite(gun) || !(gun > set)) {
      complaints.push(`${name} sprint start: no hold from set to gun`);
      continue;
    }
    const held: ReturnType<IAutoMovieMotionHumanPerformance["bones"]> =
      built.bones("a", gun);
    checkSupports(complaints, name, body, bones, held);
    const at: (bone: AutoMovieHumanoidBone) => IAutoMovieVector3 = (
      bone: AutoMovieHumanoidBone,
    ): IAutoMovieVector3 => bones.get(bone)!.worldPosition;

    // The front knee: 90 degrees within the angle a 1 mm miss of its
    // hip-to-ankle distance d turns it by, dd = (a b sin(theta) / d) dtheta.
    {
      const hip: IAutoMovieVector3 = at("leftUpperLeg");
      const knee: IAutoMovieVector3 = at("leftLowerLeg");
      const ankle: IAutoMovieVector3 = at("leftFoot");
      const thigh: number = Vector3.length(Vector3.subtract(knee, hip));
      const shank: number = Vector3.length(Vector3.subtract(ankle, knee));
      const d: number = Vector3.length(Vector3.subtract(ankle, hip));
      const bound: number =
        ((0.001 * d) / (thigh * shank * Math.sin(Math.PI / 2))) *
        (180 / Math.PI);
      const got: number = included(hip, knee, ankle);
      if (!(Math.abs(got - 90) <= bound))
        complaints.push(
          `${name} sprint start: the front knee is ${got.toFixed(2)} degrees at the set, 90 within ${bound.toFixed(2)} expected`,
        );
    }

    // The angles the block setting leaves, within one standard deviation of
    // Cavedon et al.'s means: the rear knee 117 (SD 11), the front hip 43
    // (SD 6), the hip angle between the thigh and the trunk's line from the
    // hip joint to the shoulder.
    const shoulder: IAutoMovieVector3 = Vector3.lerp(
      at("leftUpperArm"),
      at("rightUpperArm"),
      0.5,
    );
    for (const [label, got, mean, sd] of [
      [
        "rear knee",
        included(at("rightUpperLeg"), at("rightLowerLeg"), at("rightFoot")),
        117,
        11,
      ],
      [
        "front hip",
        included(at("leftLowerLeg"), at("leftUpperLeg"), shoulder),
        43,
        6,
      ],
    ] as const)
      if (!(Math.abs(got - mean) <= sd))
        complaints.push(
          `${name} sprint start: the ${label} is ${got.toFixed(1)} degrees at the set, ${mean} within ${sd} expected`,
        );

    // The whole body's centre of mass behind the line (the entry's foot
    // length ahead of the root, where the hands lie): 16.2 cm for women and
    // 22.9 cm for men (Ciacci et al. 2017; Slawinski et al. 2010, as
    // Valamatos et al. 2022 report them), within the limb fit's 1 mm.
    const centre: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(
      resolveAutoMovieCenterOfMass(body.skeleton, body.profile),
      bones,
    );
    const measured: number = sex === "female" ? 0.162 : 0.229;
    const behind: number = body.measure.footLength - centre.z;
    if (!(Math.abs(behind - measured) <= 0.001))
      complaints.push(
        `${name} sprint start: the centre of mass stands ${(100 * behind).toFixed(1)} cm behind the line at the set, ${(100 * measured).toFixed(1)} within 0.1 expected`,
      );
  }
  TestValidator.equals(
    "the displayed sprint start meets its set geometry",
    complaints,
    [],
  );
}

/** Study strata for the expected sagittal centre-of-mass position. */
type Sex = "female" | "male";

/** One displayed pose from the public performance, indexed by bone. */
type Bones = ReturnType<IAutoMovieMotionHumanPerformance["bones"]>;

/** The limb fit resolves contacts to one millimetre in the displayed position. */
const CONTACT_TOLERANCE: number = 0.001;

/** Check the track and start line on the displayed body, independent of the solver's target records. */
function checkSupports(
  complaints: string[],
  name: string,
  body: IAutoMovieMotionHumanBody,
  set: Bones,
  held: Bones,
): void {
  const line: number = body.measure.footLength;
  // Cavedon et al. 2019 places the front block at 60% of measured leg length
  // behind the line. The rear block must remain behind the fixed front one.
  const front: number = line - 0.6 * (body.measure.thigh + body.measure.shank);
  for (const [phase, bones] of [
    ["set", set],
    ["gun", held],
  ] as const) {
    for (const side of ["left", "right"] as const) {
      for (const pad of ["indexPad", "thumbPad"] as const) {
        const hand: IAutoMovieVector3 = HumanHand.frame(
          body,
          bones,
          side,
          pad,
          "flat",
        ).point;
        if (!(Math.abs(hand.z - line) <= CONTACT_TOLERANCE))
          complaints.push(
            `${name} ${phase}: ${side} ${pad} is ${(1000 * (hand.z - line)).toFixed(2)} mm from the start line`,
          );
      }
      const foot: IAutoMovieResolvedBone = bones.get(`${side}Foot`)!;
      const ball: IAutoMovieVector3 = HumanFoot.point(body, side, "ball", {
        ankle: foot.worldPosition,
        rotation: foot.worldRotation,
      });
      const reaches: boolean =
        side === "left"
          ? Math.abs(ball.z - front) <= CONTACT_TOLERANCE
          : ball.z < front;
      if (!reaches)
        complaints.push(
          `${name} ${phase}: ${side} ball at ${ball.z.toFixed(4)} m, front block at ${front.toFixed(4)} m`,
        );
    }
    for (const { bone, pose, shapes } of HumanColliders.placed(body, bones))
      for (const shape of shapes) {
        const height: number = physicalShapeBounds.lowest(pose, shape);
        if (!(height >= -CONTACT_TOLERANCE))
          complaints.push(
            `${name} ${phase}: ${bone} sinks ${(-height * 1000).toFixed(2)} mm below the track`,
          );
      }
  }
  for (const side of ["left", "right"] as const) {
    const before: IAutoMovieResolvedBone = set.get(`${side}Foot`)!;
    const after: IAutoMovieResolvedBone = held.get(`${side}Foot`)!;
    const radians: number = Quaternion.angle(
      before.worldRotation,
      after.worldRotation,
    );
    // The fit's rotational tolerance is 0.5 mrad per axis. The norm bound
    // follows from the three orthogonal angular components.
    const rotationTolerance: number = Math.sqrt(3) * 0.0005;
    if (!(radians <= rotationTolerance))
      complaints.push(
        `${name} ${side} foot turns ${radians.toFixed(4)} rad during its planted hold`,
      );
  }
}
