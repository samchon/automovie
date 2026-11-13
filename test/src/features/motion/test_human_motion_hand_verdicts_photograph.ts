import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionClock,
  AutoMovieMotionHumanAuditContinuity,
  AutoMovieMotionHumanTouch,
  AutoMovieMotionHumanTouchEffector,
  AutoMovieMotionHumanTouchForm,
  AutoMovieMotionHumanTouchLaid,
  HumanChain,
  HumanHabit,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  type IAutoMovieMotionHumanAuditMeasure,
  type IAutoMovieMotionHumanAuditMotion,
  type IHumanActionContext,
  type IHumanBody,
  type IHumanPosture,
  type handToFace,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The lexicon's `photograph` row, both hands bringing an implied camera to
 * the eye, keeps the two hands apart and moves its arms without a break.
 *
 * With both palms turned to the face at one point the hands lay 24.7 mm
 * inside each other; they now stand at the camera's two sides. The whole
 * verdict report took a quarter of an hour on this row, so the test reads
 * the two bounds the row has broken, on one body (the claim is the row's
 * hand attitude, not a stature) and a short hold of 0.3 s.
 *
 * Scenarios, on the average man:
 * 1. At the middle of the hold the two wrists are at least half a hand's
 *    length apart (provisional: a compact camera is wider than that, so
 *    hands nearer than this are in each other or in the camera).
 * 2. No joint centre steps more than 5 mm anywhere in the film, read at 6
 *    samples a second with every departing interval quartered (the verdict
 *    report's own continuity bound): the arm that changed its solution
 *    between two frames stepped 243 mm. A bound on a joint's acceleration
 *    read here before called the fast smooth return to rest a break (60.8 mm
 *    second difference at 2.08 s with the joint angles changing steadily).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers the row, performs it through the public chain and reads displayed joint centres; hands on one spot or an arm that changes its solution between two instants fails, with the posture around the step printed.
 * @evidence contracts/development/testing.md#independent-expectations The 5 mm step is the verdict report's bound for any human motion; the half hand is a compact camera's width, provisional and stated as such.
 * @evidence contracts/development/testing.md#distinguishing-cases The two bounds this row broke; the other rows' full reports are its siblings'.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and reads one short film; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what the row was, why the reading is cut to two bounds, one body and a short hold, and the 2 scenarios.
 */
export function test_human_motion_hand_verdicts_photograph(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const performance: HumanPerformance = new HumanPerformance({
    seed: "verdict",
    laws: [HumanHabit.photograph],
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
      .stand({ seconds: 0.3 })
      .registered("photograph", { seconds: 0.3 }).node,
  });
  const complaints: string[] = [];

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
  // The touch's arm goal as its stroke builds it each second, rebuilt from
  // the placed action's own context and parameters, with the end the carry
  // goes toward and the carry's weight: what the reach blends the arm to.
  const touchGoals = (instants: readonly number[]): string[] => {
    const placed = performance.segments("a")[1]!;
    const context = placed.context as IHumanActionContext<never>;
    const body = context.body;
    const row = (placed.params as { task: handToFace.IRow }).task;
    const effector = row.effector;
    const entry: IHumanPosture = context.entry.posture;
    const entryBones = poseBones(body, context.entry.pose);
    const target: AutoMovieMotionTarget = { kind: "self", region: row.region ?? "noseBridge" };
    const place = (posture: IHumanPosture, seconds: number) =>
      AutoMovieMotionHumanTouch.region(
        context,
        target,
        context.start + seconds,
        posture,
        entryBones,
      );
    const bend = AutoMovieMotionHumanTouchLaid.bend(
      body,
      entry,
      "right",
      effector,
      place(entry, 0),
      row.tangent,
      "tangent",
    );
    const reference = AutoMovieMotionHumanTouchLaid.laid(
      body,
      entry,
      "right",
      effector,
      place(entry, 0),
      row.tangent,
      bend,
      "tangent",
    );
    const clock = AutoMovieMotionClock.of(
      placed.plan.duration,
      placed.plan.events.map((e) => ({
        name: e.name,
        seconds: e.share * placed.plan.duration,
      })),
    );
    const standoff: number = AutoMovieMotionHumanTouchEffector.pad(
      body,
      "right",
      effector,
    );
    const round = (_k: string, v: unknown): unknown =>
      typeof v === "number" ? Math.round(v * 1e4) / 1e4 : v;
    return instants.map((film: number): string => {
      const seconds: number = film - placed.start;
      const posture: IHumanPosture = performance.posture("a", film);
      const at = place(posture, seconds);
      const normal = Vector3.normalize(at.normal);
      const along = AutoMovieMotionHumanTouchForm.tangent(
        normal,
        posture.yaw,
        row.tangent,
      );
      const weight: number = clock.envelope(
        ["start", "ready"],
        ["relax", "end"],
        seconds,
      );
      const point = Vector3.add(
        at.point,
        Vector3.scale(normal, standoff + body.measure.hand * (1 - weight)),
      );
      const goal: IHumanPosture.IGoal = {
        ...AutoMovieMotionHumanTouchEffector.goal(
          body,
          "right",
          effector,
          point,
          ...AutoMovieMotionHumanTouchLaid.lie(
            body,
            posture,
            "right",
            "tangent",
            at.point,
            normal,
            along,
          ),
          bend,
        ),
        reference,
      };
      const solved = resolveHumanPosture(body, {
        ...posture,
        limbs: { ...posture.limbs, rightArm: goal },
      });
      const angles = (bone: string): unknown =>
        solved.joints.find((j): boolean => j.bone === bone) ?? null;
      return `touch at ${film.toFixed(3)} s: weight ${weight.toFixed(4)} goal ${JSON.stringify(goal, round)} end ${JSON.stringify([angles("rightUpperArm"), angles("rightLowerArm"), angles("rightHand")], round)}`;
    });
  };
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
      ).join(" ")}; ${touchGoals(
        [-2, -1, 0, 1].map((k: number): number => jump.seconds + k / 192),
      ).join(" | ")}`,
    );
  }
  TestValidator.equals("a photograph's two hands", complaints, []);
}
