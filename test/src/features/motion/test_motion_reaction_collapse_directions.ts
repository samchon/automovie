import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCollapse,
  IAutoMovieMotionTarget,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance, collapse } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

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
/** How high a lying pelvis's or head's joint may sit above the floor, metres: a lying torso's half depth with margin. */
const LYING: number = 0.3;
/** How far below the floor a joint centre may sink, metres: none. */
const FLOOR: number = 0;
/** How near its lowest height a hand is when it is on the floor, metres: three centimetres. */
const SETTLE: number = 0.03;
/** How far above its resting height the trunk still is while the hands bear, metres: a hand's breadth. */
const ABOVE: number = 0.08;

/**
 * Staged collapses in each direction and tone, on two body sizes.
 *
 * Scenarios:
 * 1. Every direction ends with the pelvis and head on the floor and no joint
 *    centre below it at any sampled frame.
 * 2. A blow from behind sends a forward fall ahead of the feet, a blow from
 *    the right a sideways fall to the left, and a blow from ahead the
 *    unchanged backward knockdown behind them.
 * 3. A protective forward fall reaches the floor with both hands before the
 *    chest; a limp one does not.
 * 4. An in-place collapse ends with the pelvis within a foot length of where
 *    the feet stood.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each case, the blow, the floor and hand bounds and what is compared.
 * @evidence contracts/development/testing.md#behavioral-verification Plans the registered collapse through HumanPerformance and reads the displayed bones over the fall.
 * @evidence contracts/development/testing.md#independent-expectations The blows' sides set the expected fall sides; the lying and touch heights are body half-depths with margin; the foot length is the body's own measure.
 * @evidence contracts/development/testing.md#distinguishing-cases Four directions, two tones, three blow sides and two body sizes.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_motion_reaction_collapse_directions(): void {
  const failures: string[] = [];
  for (const cast of ["m-average", "f-small"] as const) {
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
          laws: [collapse],
          composition: HumanChain.subject("a")
            .stand({ seconds: 0.3, sway: 0 })
            .registered(collapse.name, {
              direction: one.direction,
              tone: one.tone,
              from,
            }).node,
        });
        const end: number = film.duration;
        const last: Bones = film.bones("a", end);
        const hips: IAutoMovieVector3 = last.get("hips")!.worldPosition;
        const head: IAutoMovieVector3 = last.get("head")!.worldPosition;
        const check = (what: string, ok: boolean): void => {
          if (!ok)
            failures.push(
              `${label}: ${what} (hips ${hips.x.toFixed(2)} ${hips.y.toFixed(2)} ${hips.z.toFixed(2)}, head ${head.x.toFixed(2)} ${head.y.toFixed(2)} ${head.z.toFixed(2)})`,
            );
        };
        check(
          "the pelvis rests on the floor",
          hips.y <= LYING || one.direction === "inPlace",
        );
        check(
          "the head rests near the floor",
          head.y <= LYING + 0.2 || one.direction === "inPlace",
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
          // The hands are on the floor while the trunk is still a hand's
          // breadth above where it comes to rest.
          const height = (bones: Bones, bone: AutoMovieHumanoidBone): number =>
            bones.get(bone)!.worldPosition.y;
          const samples: Bones[] = [];
          for (let i: number = 0; i <= 120; ++i)
            samples.push(film.bones("a", (end * i) / 120));
          const floor: number = Math.min(
            ...samples.flatMap((bones: Bones): number[] => [
              height(bones, "leftHand"),
              height(bones, "rightHand"),
            ]),
          );
          const braced: boolean = samples.some(
            (bones: Bones): boolean =>
              height(bones, "leftHand") <= floor + SETTLE &&
              height(bones, "rightHand") <= floor + SETTLE &&
              height(bones, "spine") >= height(last, "spine") + ABOVE,
          );
          check(
            (one.tone === "protective"
              ? "both hands reach the floor before the chest"
              : "no hand reaches the floor before the chest") +
              ` (floor ${floor.toFixed(3)}, spine at rest ${height(last, "spine").toFixed(3)}, ` +
              samples
                .filter((_: Bones, i: number): boolean => i % 12 === 0)
                .map(
                  (bones: Bones): string =>
                    `${Math.max(height(bones, "leftHand"), height(bones, "rightHand")).toFixed(2)}/${height(bones, "spine").toFixed(2)}`,
                )
                .join(" ") +
              ")",
            one.tone === "protective" ? braced : !braced,
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
