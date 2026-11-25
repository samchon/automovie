import { physicalShapeBounds } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCollapse,
  IAutoMovieMotionTarget,
  IAutoMoviePhysicalSegment,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanFall,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../internal/motionHumanBody";
import { observeCollapseTrajectory } from "./observeCollapseTrajectory";

/** One case: a direction and a tone. */
interface ICase {
  /** Where the body goes down. */
  direction: IAutoMovieMotionHumanCollapse.Direction;

  /** How it meets the floor. */
  tone: IAutoMovieMotionHumanCollapse.Tone;
}

/** The read bones of one frame. */
type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

/** The directions crossed with both tones, and the backward knockdown. */
const CASES: readonly ICase[] = [
  { direction: "forward", tone: "limp" },
  { direction: "forward", tone: "protective" },
  { direction: "sideways", tone: "limp" },
  { direction: "sideways", tone: "protective" },
  { direction: "inPlace", tone: "limp" },
  { direction: "backward", tone: "limp" },
];

/** A blow from behind the performer, who faces +Z. */
const BEHIND: IAutoMovieMotionTarget = {
  kind: "point",
  frame: "world",
  at: { x: 0, y: 1.2, z: -2 },
};
/** A blow from the performer's right. */
const RIGHT: IAutoMovieMotionTarget = {
  kind: "point",
  frame: "world",
  at: { x: -2, y: 1.2, z: 0 },
};
/** A blow from in front. */
const AHEAD: IAutoMovieMotionTarget = {
  kind: "point",
  frame: "world",
  at: { x: 0, y: 1.2, z: 2 },
};
/** How far below the floor a joint centre may sink, metres: none. */
const FLOOR: number = 0;
/** How far from standing and from rest the chest is while it goes down, metres: a hand's breadth. */
const ABOVE: number = 0.08;
/** How far ahead of the chest a reaching hand is, metres: a hand's breadth. */
const REACH: number = 0.08;

/**
 * Staged collapses in each direction and tone, on two body sizes.
 *
 * Scenarios:
 * 1. Every direction ends with the pelvis and head on the floor and no joint
 *    centre below it at any sampled frame.
 * 2. A blow from behind sends a forward fall ahead of the feet, a blow from
 *    the right a sideways fall to the left, and a blow from ahead the
 *    unchanged backward knockdown behind them.
 * 3. A protective forward fall reaches both hands ahead of the chest toward
 *    the floor while the trunk goes down; a limp one's hands trail.
 * 4. An in-place collapse ends with the pelvis within a foot length of where
 *    the feet stood.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each case, the blow, the floor and hand bounds and what is compared.
 * @evidence contracts/development/testing.md#behavioral-verification Plans the registered collapse through HumanPerformance and reads the displayed bones over the fall.
 * @evidence contracts/development/testing.md#independent-expectations The blows' sides set the expected fall sides; the lying and touch heights are body half-depths with margin; the foot length is the body's own measure.
 * @evidence contracts/development/testing.md#distinguishing-cases Four directions, two tones, three blow sides and two body sizes.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_motion_fall_collapse_directions(): void {
  const failures: string[] = [];
  const trace: boolean = process.env.AUTOMOVIE_COLLAPSE_TRACE === "1";
  const casts: readonly motionHumanBody.Name[] = trace
    ? motionHumanBody.EXTREMES
    : ["m-average", "f-small"];
  for (const cast of casts) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(cast);
    for (const one of CASES) {
      const label: string = `${cast} ${one.direction} ${one.tone}`;
      try {
        const from: IAutoMovieMotionTarget =
          one.direction === "forward" || one.direction === "inPlace"
            ? BEHIND
            : one.direction === "sideways"
              ? RIGHT
              : AHEAD;
        const film: HumanPerformance = new HumanPerformance({
          seed: "collapse-directions",
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" },
            },
          ],
          laws: [AutoMovieMotionHumanFall.collapse],
          composition: HumanChain.subject("a")
            .stand({ hold: 0.3, sway: 0 })
            .registered(AutoMovieMotionHumanFall.collapse.name, {
              direction: one.direction,
              tone: one.tone,
              target: from,
            }).node,
        });
        const end: number = film.duration;
        const standing: number = film.bones("a", 0).get("chest")!.worldPosition
          .y;
        const last: Bones = film.bones("a", end);
        if (trace) observeCollapseTrajectory(film, body, { cast, ...one });
        const hips: IAutoMovieVector3 = last.get("hips")!.worldPosition;
        const head: IAutoMovieVector3 = last.get("head")!.worldPosition;
        const check = (what: string, ok: boolean): void => {
          if (!ok)
            failures.push(
              `${label}: ${what} (hips ${hips.x.toFixed(2)} ${hips.y.toFixed(2)} ${hips.z.toFixed(2)}, head ${head.x.toFixed(2)} ${head.y.toFixed(2)} ${head.z.toFixed(2)}, lowest colliders ${floorWitnesses(body, last)})`,
            );
        };
        // Lying on the front or the back, the pelvis is within a trunk's
        // depth of the floor; on the side, the trunk rests on the shoulder
        // over the arm beneath, the pelvis up to a thigh's radius higher.
        const m = body.measure;
        const lying: number =
          one.direction === "sideways"
            ? m.shoulderHalfWidth + 2 * m.upperArmRadius + m.thighRadius
            : m.chestDepth;
        check(
          "the pelvis rests on the floor",
          hips.y <= lying || one.direction === "inPlace",
        );
        check(
          "the head rests near the floor",
          head.y <= lying + m.headRadius || one.direction === "inPlace",
        );
        for (let i: number = 0; i <= 30; ++i) {
          const t: number = (end * i) / 30;
          const lowest: number = Math.min(
            ...[...film.bones("a", t).values()].map(
              (bone: IAutoMovieResolvedBone): number => bone.worldPosition.y,
            ),
          );
          check(
            `no joint sinks below the floor at ${t.toFixed(2)}`,
            lowest >= FLOOR - 1e-3,
          );
        }
        if (one.direction === "forward")
          check("the body falls ahead of its feet", head.z > 0.5);
        if (one.direction === "backward")
          check("the body falls behind its feet", head.z < -0.5);
        if (one.direction === "sideways")
          check("the body falls to its left, away from the blow", head.x > 0.4);
        if (one.direction === "inPlace")
          check(
            "the pelvis stays over the feet",
            Math.hypot(hips.x, hips.z) <= body.measure.footLength,
          );
        if (one.direction === "forward") {
          // A protective body reaches ahead of its chest toward the floor
          // while the trunk goes down; a limp one's arms trail at its sides.
          let ahead: boolean = false;
          let behind: boolean = true;
          for (let i: number = 0; i <= 60; ++i) {
            const t: number = (end * i) / 60;
            const bones: Bones = film.bones("a", t);
            const chest: IAutoMovieVector3 = bones.get("chest")!.worldPosition;
            if (chest.y <= last.get("chest")!.worldPosition.y + ABOVE) continue;
            if (chest.y >= standing - ABOVE) continue;
            const left: number = bones.get("leftHand")!.worldPosition.z;
            const right: number = bones.get("rightHand")!.worldPosition.z;
            if (Math.min(left, right) > chest.z + REACH) ahead = true;
            if (Math.max(left, right) > chest.z) behind = false;
          }
          check(
            one.tone === "protective"
              ? "both hands reach ahead of the chest as it goes down"
              : "the hands trail behind the chest as it goes down",
            one.tone === "protective" ? ahead : behind,
          );
        }
      } catch (error: unknown) {
        failures.push(
          label +
            " refused: " +
            (error instanceof Error ? error.message : String(error)),
        );
      }
    }
  }
  TestValidator.equals("collapse findings", failures, []);
}

/** Name the closest final colliders and their heights above the floor in mm. */
function floorWitnesses(body: IAutoMovieMotionHumanBody, bones: Bones): string {
  return body.profile.segments
    .flatMap((segment: IAutoMoviePhysicalSegment): { name: string; y: number }[] => {
      const bone: IAutoMovieResolvedBone | undefined = bones.get(
        segment.bone as AutoMovieHumanoidBone,
      );
      if (bone === undefined) return [];
      return segment.shapes.map((shape) => ({
        name: shape.id,
        y: physicalShapeBounds(
          { position: bone.worldPosition, rotation: bone.worldRotation },
          shape,
        ).min.y,
      }));
    })
    .sort((a, b) => a.y - b.y)
    .slice(0, 4)
    .map(({ name, y }): string => `${name} ${(1000 * y).toFixed(2)} mm`)
    .join(", ");
}
