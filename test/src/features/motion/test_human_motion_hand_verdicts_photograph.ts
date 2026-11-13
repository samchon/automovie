import { createDevice } from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditContinuity,
  HumanChain,
  HumanHabit,
  HumanObject,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  type IAutoMovieMotionHumanAuditMeasure,
  type IAutoMovieMotionHumanAuditMotion,
  type IHumanBody,
  type IHumanPosture,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The lexicon's `photograph` row, a camera held in both hands before the
 * eyes, keeps the two hands apart and moves its arms without a break.
 *
 * The camera is held, not implied: the right hand picks it up by its grip
 * for its use, its back (`screen`) at the bridge of the nose and its long
 * axis across the face (`HumanGraspUse`, line `across`), and the row keeps
 * that grasp while the left hand takes the camera's other end. Laid by an
 * implied tool's facing, the right hand stood at the forearm's twist and
 * the wrist's deviation limits and its arm changed solution between two
 * frames (a 20.7 mm step); the grasp chosen for the use asks only what the
 * grip was taken for. The device archetype's compact camera declares one
 * handle, so the stand-in adds its far end as a second handle (a film-props
 * follow-up for the archetype). The whole verdict report took a quarter of
 * an hour on this row, so the test reads the two bounds the row has broken,
 * on one body and a short hold of 0.3 s.
 *
 * Scenarios, on the average man:
 * 1. At the middle of the hold the two wrists are at least half a hand's
 *    length apart (provisional: a compact camera is wider than that, so
 *    hands nearer than this are in each other or in the camera).
 * 2. No joint centre steps more than 5 mm anywhere in the film, read at 6
 *    samples a second with every departing interval quartered (the verdict
 *    report's own continuity bound).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Picks the camera up and performs the row through the public chain and reads displayed joint centres; hands on one spot or an arm that changes its solution between two instants fails, with the posture around the step printed.
 * @evidence contracts/development/testing.md#independent-expectations The 5 mm step is the verdict report's bound for any human motion; the half hand is a compact camera's width, provisional and stated as such.
 * @evidence contracts/development/testing.md#distinguishing-cases The two bounds this row broke; the other rows' full reports are its siblings'.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and one archetype and reads one short film; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what the row was, the held camera and its stand-in, why the reading is cut to two bounds, one body and a short hold, and the 2 scenarios.
 */
export function test_human_motion_hand_verdicts_photograph(): void {
  const body: IHumanBody = motionHumanBody("m-average");

  // The compact camera with its far end declared as a second handle: the
  // grip's frame turned half round the vertical to the body's other end.
  const camera = createDevice({ kind: "camera" });
  const grip: IAutoMovieAffordance = camera.affordance("grip");
  const width: number = camera.dimensions.width!;
  const depth: number = camera.dimensions.thickness!;
  const support: IAutoMovieAffordance = {
    ...grip,
    id: "support",
    frame: {
      ...grip.frame,
      translation: {
        x: width / 2 - depth / 2,
        y: grip.frame.translation.y,
        z: grip.frame.translation.z,
      },
      rotation: Quaternion.normalize(
        Quaternion.multiply(
          Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 180),
          grip.frame.rotation,
        ),
      ),
    },
  };
  const performance: HumanPerformance = new HumanPerformance({
    seed: "verdict",
    laws: [HumanHabit.photograph],
    props: [
      HumanObject.prop(
        "camera",
        {
          affordances: [...camera.affordances, support],
          shapes: () => camera.shapes(),
        },
        {
          at: {
            x: -body.measure.shoulderHalfWidth,
            y: body.measure.waistHeight,
            z: 0.6 * (body.measure.upperArm + body.measure.forearm),
          },
          yaw: 0,
        },
      ),
    ],
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
      .pickUp({
        prop: "camera",
        handle: "grip",
        use: { tip: "screen", line: "across", at: { region: "noseBridge" } },
      })
      .registered("photograph", {
        seconds: 0.3,
        prop: "camera",
        point: "screen",
        grasp: { handle: "grip", line: "across" },
        other: "support",
      }).node,
  });  const complaints: string[] = [];

  // 1. The hands at the camera's two sides.
  const placed: HumanSegment.ISegment = performance.segments("a")[1]!;
  const instant = (event: string): number =>
    placed.start +
    (placed.plan.events.find((e): boolean => e.name === event)?.share ?? NaN) *
      placed.plan.duration;
  const held: number = (instant("strokeEnd") + instant("relax")) / 2;
  const reader: HumanSignature.IReader = HumanSignature.of(
    performance,
    "a",
    body,
    0,
  );
  const left: IAutoMovieVector3 = HumanSignature.joint(reader, held, "leftHand");
  const right: IAutoMovieVector3 = HumanSignature.joint(
    reader,
    held,
    "rightHand",
  );
  const apart: number =
    Math.hypot(left.x - right.x, left.y - right.y, left.z - right.z) /
    body.measure.hand;
  if (!(apart >= 0.5))
    complaints.push(
      `the wrists are ${apart.toFixed(2)} of a hand's length apart at the hold, at least 0.5 expected`,
    );

  // 2. No step in any joint's path: the verdict report's own continuity
  // bound, read at 6 samples a second with every departing interval
  // quartered. A fast smooth return is no step; an arm that changes its
  // solution between two instants is.
  const motion: IAutoMovieMotionHumanAuditMotion = {
    duration: performance.duration,
    segments: (
      subject: string,
    ): ReturnType<IAutoMovieMotionHumanAuditMotion["segments"]> =>
      performance.segments(subject),
    bones: (
      subject: string,
      seconds: number,
    ): ReturnType<IAutoMovieMotionHumanAuditMotion["bones"]> =>
      performance.bones(subject, seconds),
  };
  const jump: IAutoMovieMotionHumanAuditMeasure =
    AutoMovieMotionHumanAuditContinuity.measure(motion, "a", 6).jump;
  if (!(jump.value <= 0.005)) {
    const side: "left" | "right" = jump.where.startsWith("left")
      ? "left"
      : "right";
    complaints.push(
      `a joint steps ${(jump.value * 1000).toFixed(1)} mm at ${jump.seconds.toFixed(3)} s (${jump.where}), within 5 mm expected; instants ${placed.plan.events
        .map(
          (e): string =>
            `${e.name} ${(placed.start + e.share * placed.plan.duration).toFixed(3)}`,
        )
        .join(", ")}; around it ${[-1, 0, 1]
        .map((k: number): string => {
          const at: number = jump.seconds + k / 48;
          const posture: IHumanPosture = performance.posture("a", at);
          const shown = performance
            .pose("a", at)
            .joints.find((j): boolean => j.bone === jump.where);
          return `${at.toFixed(3)} s: joints ${JSON.stringify([
            posture.joints[`${side}UpperArm`],
            posture.joints[`${side}LowerArm`],
            posture.joints[`${side}Hand`],
            posture.joints[jump.where as "rightHand"],
          ])} shown ${jump.where} ${JSON.stringify(shown ?? null)} goal ${JSON.stringify(
            posture.limbs[`${side}Arm`] === undefined
              ? null
              : { ...posture.limbs[`${side}Arm`], clear: undefined },
            (_k: string, v: unknown): unknown =>
              typeof v === "number" ? Math.round(v * 1e4) / 1e4 : v,
          )}`;
        })
        .join(" | ")}; the cut into it at ${placed.transition?.cut.toFixed(3) ?? "none"} s blending ${placed.transition?.blend.toFixed(3) ?? "-"} s; the joint's path ${Array.from(
        { length: 9 },
        (_: unknown, k: number): string => {
          const at: number = jump.seconds - 1 / 48 + k / 192;
          const q = performance.bones("a", at).get(jump.where as "rightHand")!
            .worldPosition;
          return `${at.toFixed(4)}:(${q.x.toFixed(4)},${q.y.toFixed(4)},${q.z.toFixed(4)})`;
        },
      ).join(" ")}; displayed ${[4, 5]
        .map((k: number): string => {
          const at: number = jump.seconds - 1 / 48 + k / 192;
          const pose = performance.pose("a", at);
          const bones = performance.bones("a", at);
          const triple = (bone: string): string => {
            const j = pose.joints.find((x): boolean => x.bone === bone);
            return j === undefined
              ? "null"
              : `[${(j.flexion ?? 0).toFixed(3)},${(j.abduction ?? 0).toFixed(3)},${(j.twist ?? 0).toFixed(3)}]`;
          };
          const where = (bone: "hips" | "chest" | "rightUpperArm" | "rightLowerArm" | "rightHand"): string => {
            const q = bones.get(bone)!.worldPosition;
            return `${bone}(${q.x.toFixed(4)},${q.y.toFixed(4)},${q.z.toFixed(4)})`;
          };
          return `${at.toFixed(4)} s: upper ${triple(`${side}UpperArm`)} lower ${triple(`${side}LowerArm`)} hand ${triple(`${side}Hand`)} ${(["hips", "chest", "rightUpperArm", "rightLowerArm", "rightHand"] as const).map(where).join(" ")}`;
        })
        .join(" | ")}`,
    );
  }
  TestValidator.equals("a photograph's two hands", complaints, []);
}
