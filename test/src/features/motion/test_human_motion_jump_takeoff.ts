import { Transform } from "@automovie/engine";
import type {
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanFrame,
  HumanPerformance,
  type HumanSegment,
  type IHumanBody,
  type IHumanContactWindow,
  type IHumanEntryState,
  type IHumanPosture,
  jump,
  poseBones,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A jump pushes from the entered body's leading planted foot, before its
 * push turns toward the destination.
 *
 * Scenarios:
 * 1. Symmetric standing keeps the left foot; a double support with the left
 *    or right hip flexed 20 degrees and the other extended 20 degrees keeps
 *    that flexed leg. The knees are straight, and ankle counter-rotation
 *    keeps the feet level. These are test inputs inside the clinical ranges,
 *    not claimed measurements of a preferred take-off stance.
 * 2. Each stance on the average man and small woman is placed at the origin
 *    facing +Z and at (3,0,-2) facing +X. Jumps ahead, behind and to the
 *    body's side declare the same initial planted foot in every placement.
 * 3. A sole planted right foot is kept even when the left leg leads.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the actual articulation, placements, requested directions and expected support choice.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the real jump planner with displayed entered joints and reads its initial plant contact; a decision made from rounded world ankles or from the destination's direction fails.
 * @evidence contracts/development/testing.md#independent-expectations The hip's canonical clinical flexion swings the leg toward body +Z; the law's leading-foot rule chooses that leg, exact symmetric double support chooses left, and single support has no choice.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies, symmetric and both staggered double supports, two rigid placements, three jump directions and single support; full flight mechanics belongs to core_flight and jump staging suites.
 * @evidence contracts/development/testing.md#execution-ownership One in-memory unit test using the public planner and actual forward-kinematic feet; it starts no host.
 */
export function test_human_motion_jump_takeoff(): void {
  const findings: string[] = [];
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const performance: HumanPerformance = new HumanPerformance({
      seed: "takeoff",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a").stand({ seconds: 0.3, sway: 0 })
        .node,
    });
    const initial: HumanSegment.ISegment = performance.segments("a")[0]!;
    for (const leading of [null, "left", "right"] as const) {
      const angle = (side: "left" | "right"): number =>
        leading === null ? 0 : leading === side ? 20 : -20;
      const joints: IAutoMovieJointPose[] =
        initial.context.entry.pose.joints.filter(
          (joint: IAutoMovieJointPose): boolean =>
            !/^(left|right)(UpperLeg|LowerLeg|Foot|Toes)$/.test(joint.bone),
        );
      for (const side of ["left", "right"] as const)
        joints.push(
          {
            bone: `${side}UpperLeg`,
            flexion: angle(side),
            abduction: 0,
            twist: 0,
          },
          { bone: `${side}LowerLeg`, flexion: 0, abduction: 0, twist: 0 },
          {
            bone: `${side}Foot`,
            flexion: -angle(side),
            abduction: 0,
            twist: 0,
          },
          { bone: `${side}Toes`, flexion: 0, abduction: 0, twist: 0 },
        );
      const lower: number =
        leading === null
          ? 0
          : (body.measure.thigh + body.measure.shank) *
            (1 - Math.cos((20 * Math.PI) / 180));
      for (const [at, yaw] of [
        [{ x: 0, y: -lower, z: 0 }, 0],
        [{ x: 3, y: -lower, z: -2 }, 90],
      ] as const) {
        const pose: IAutoMoviePose = {
          ...initial.context.entry.pose,
          joints,
          root: Transform.of(at, HumanFrame.turn(yaw)),
        };
        const bones: ReturnType<typeof poseBones> = poseBones(body, pose);
        const posture: IHumanPosture = {
          ...initial.context.entry.posture,
          root: at,
          yaw,
          pitch: 0,
          roll: 0,
        };
        const entry: IHumanEntryState = {
          ...initial.context.entry,
          pose,
          posture,
          feet: {
            left: {
              ...initial.context.entry.feet.left,
              ankle: bones.get("leftFoot")!.worldPosition,
              rotation: bones.get("leftFoot")!.worldRotation,
              planted: true,
            },
            right: {
              ...initial.context.entry.feet.right,
              ankle: bones.get("rightFoot")!.worldPosition,
              rotation: bones.get("rightFoot")!.worldRotation,
              planted: true,
            },
          },
        };
        for (const direction of [
          { x: 0, y: 0, z: 1 },
          { x: 1, y: 0, z: 0 },
          { x: 0, y: 0, z: -1 },
        ]) {
          const to: IAutoMovieVector3 = HumanFrame.point(
            { origin: { ...at, y: 0 }, yaw },
            direction,
          );
          const plan: ReturnType<typeof jump.plan> = jump.plan({
            ...initial.context,
            entry,
            params: { to, apex: 0.5 },
          });
          const parts: string[] = plan.contacts
            .filter(
              (contact: IHumanContactWindow): boolean =>
                contact.from === 0 && contact.kind === "plant",
            )
            .map((contact: IHumanContactWindow): string => contact.part);
          const expected: string = `${leading ?? "left"}Foot`;
          if (parts.length !== 1 || parts[0] !== expected)
            findings.push(
              `${name} ${leading ?? "symmetric"} yaw ${yaw} toward ${JSON.stringify(direction)}: ${parts.join(",")}, expected ${expected}`,
            );
        }
        if (leading === "left") {
          const sole: IHumanEntryState = {
            ...entry,
            feet: {
              ...entry.feet,
              left: { ...entry.feet.left, planted: false },
            },
          };
          const to: IAutoMovieVector3 = HumanFrame.point(
            { origin: { ...at, y: 0 }, yaw },
            { x: 0, y: 0, z: 1 },
          );
          const plan: ReturnType<typeof jump.plan> = jump.plan({
            ...initial.context,
            entry: sole,
            params: { to, apex: 0.5 },
          });
          if (
            !plan.contacts.some(
              (contact: IHumanContactWindow): boolean =>
                contact.from === 0 && contact.part === "rightFoot",
            )
          )
            findings.push(
              `${name} yaw ${yaw}: sole planted right foot was not kept`,
            );
        }
      }
    }
  }
  TestValidator.predicate(
    `jump take-off: ${findings.join("; ") || "all hold"}`,
    findings.length === 0,
  );
}
