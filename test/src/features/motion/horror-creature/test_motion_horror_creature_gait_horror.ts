import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanHorrorCreature,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";

import { everydayTake } from "../../internal/everydayTake";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";

/** The read bones of one frame. */
type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

/** Where every walk ends, metres ahead. */
const AHEAD: IAutoMovieVector3 = { x: 0, y: 0, z: 4 };
/**
 * The largest knee flexion of a stiff knee, degrees: under the normal walk's
 * peak swing flexion of about 60 degrees, which a stiff-knee gait does not
 * reach (Perry and Burnfield 2010).
 */
const STIFF: number = 60;
/**
 * How far apart two strikes or two step periods are to read as different,
 * seconds: a tenth of a 24 fps frame.
 */
const STEP: number = 1 / 240;
/** Frames read per second. */
const RATE: number = 30;

/**
 * Horror and fantasy gaits against an ordinary walk on the same course.
 *
 * Scenarios:
 *
 * 1. The shamble's dragged foot rises less in swing than either foot of a walk.
 * 2. The lurch's stiff knee stays under the stiff threshold; the walk's knee
 *    passes it.
 * 3. The stalk's pelvis rides lower than the walk's by more than the walk's own
 *    rise and fall.
 * 4. Ten shamblers on one course, each at its own seeded pace: no two strike
 *    together at the same cadence.
 * 5. Each holds on both canonical bodies.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each signature, its comparison and its bound.
 * @evidence contracts/development/testing.md#behavioral-verification Plans the registered rows and the walk through HumanPerformance and reads displayed bones and the walk's events.
 * @evidence contracts/development/testing.md#independent-expectations The stiff-knee bound is the clinical description's; the pelvis drop is the gait's stated factor; the walk is the reference.
 * @evidence contracts/development/testing.md#distinguishing-cases Each gait against the walk, two bodies and ten seeded members.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_motion_horror_creature_gait_horror(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const cast of ["m-average", "f-small"] as const) {
    try {
      const body: IAutoMovieMotionHumanBody = motionHumanBody(cast);
      const play = (chain: IAutoMovieMotionHumanChain): HumanPerformance =>
        new HumanPerformance({
          seed: "horror-gait",
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" },
            },
          ],
          laws: [
            AutoMovieMotionHumanHorrorCreature.HumanHorrorGait.shamble,
            AutoMovieMotionHumanHorrorCreature.HumanHorrorGait.lurch,
            AutoMovieMotionHumanHorrorCreature.HumanHorrorGait.stalk,
          ],
          composition: chain.node,
        });
      const frames = (film: HumanPerformance): Bones[] => {
        const out: Bones[] = [];
        for (let i: number = 0; i <= film.duration * RATE; ++i)
          out.push(film.bones("a", i / RATE));
        return out;
      };
      const walked: Bones[] = frames(
        play(HumanChain.subject("a").walk({ to: AHEAD })),
      );
      const shambled: Bones[] = frames(
        play(
          HumanChain.subject("a").registered("shamble", {
            to: AHEAD,
            side: "right",
          }),
        ),
      );
      const lurched: Bones[] = frames(
        play(
          HumanChain.subject("a").registered("lurch", {
            to: AHEAD,
            side: "right",
          }),
        ),
      );
      const stalked: Bones[] = frames(
        play(HumanChain.subject("a").registered("stalk", { to: AHEAD })),
      );
      const top = (bones: Bones[], bone: AutoMovieHumanoidBone): number =>
        Math.max(
          ...bones.map((one: Bones): number => one.get(bone)!.worldPosition.y),
        );
      // The middle half of a course, where the gait cruises.
      const cruise = (bones: Bones[], bone: AutoMovieHumanoidBone): number[] =>
        bones
          .slice(
            Math.floor(bones.length / 4),
            Math.ceil((3 * bones.length) / 4),
          )
          .map((one: Bones): number => one.get(bone)!.worldPosition.y);
      const mean = (bones: Bones[], bone: AutoMovieHumanoidBone): number => {
        const heights: number[] = cruise(bones, bone);
        return (
          heights.reduce((sum: number, y: number): number => sum + y, 0) /
          heights.length
        );
      };
      // Half the rise and fall over the cruise.
      const swing = (bones: Bones[], bone: AutoMovieHumanoidBone): number => {
        const heights: number[] = cruise(bones, bone);
        return (Math.max(...heights) - Math.min(...heights)) / 2;
      };
      const knee = (bones: Bones[], side: "left" | "right"): number =>
        Math.max(
          ...bones.map((one: Bones): number =>
            flexion(
              one.get(`${side}UpperLeg`)!.worldPosition,
              one.get(`${side}LowerLeg`)!.worldPosition,
              one.get(`${side}Foot`)!.worldPosition,
            ),
          ),
        );

      checks.check(
        cast + " shamble drags its foot lower than a walk lifts either",
        top(shambled, "rightFoot") <
          Math.min(top(walked, "leftFoot"), top(walked, "rightFoot")),
      );
      checks.check(
        cast +
          ` lurch keeps its stiff knee under the threshold the walk passes (${knee(lurched, "right").toFixed(1)}, ${knee(walked, "right").toFixed(1)})`,
        knee(lurched, "right") < STIFF && knee(walked, "right") > STIFF,
      );
      checks.check(
        cast +
          ` stalk rides lower than a walk (${mean(walked, "hips").toFixed(3)}, ${mean(stalked, "hips").toFixed(3)})`,
        mean(walked, "hips") - mean(stalked, "hips") > swing(walked, "hips"),
      );
    } catch (error: unknown) {
      checks.check(`${String(cast)}: ${everydayTake.describe(error)}`, false);
    }
  }

  // Ten shamblers: no two strike the floor first at the same instant.
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const subjects: string[] = [...new Array(10).keys()].map(
    (k: number): string => "z" + k,
  );
  const crowd: HumanPerformance = new HumanPerformance({
    seed: "horror-crowd",
    performers: subjects.map((subject: string, k: number) => ({
      subject,
      body,
      at: { x: (k - 4.5) * 0.9, y: 0, z: 0 },
      yaw: 0,
      proficiency: { level: "trained" as const },
    })),
    laws: [AutoMovieMotionHumanHorrorCreature.HumanHorrorGait.shamble],
    composition: {
      kind: "parallel",
      parts: subjects.map(
        (subject: string, k: number) =>
          HumanChain.subject(subject).registered("shamble", {
            to: { x: (k - 4.5) * 0.9, y: 0, z: 4 },
          }).node,
      ),
    },
  });
  // Two members are in step when they strike together at the same cadence.
  const steps: readonly [number, number][] = subjects.map(
    (subject: string): [number, number] => {
      const segment: IAutoMovieMotionHumanSegment = crowd.segments(subject)[0]!;
      const strikes: number[] = segment.plan.events
        .filter((event: IAutoMovieMotionEvent): boolean =>
          event.name.includes("HeelStrike"),
        )
        .map(
          (event: IAutoMovieMotionEvent): number =>
            segment.start + event.share * segment.plan.duration,
        );
      return [strikes[2]!, strikes[3]! - strikes[2]!];
    },
  );
  checks.check(
    "no two shamblers move in step",
    steps.every(([a, p]: [number, number], i: number): boolean =>
      steps.every(
        ([b, q]: [number, number], j: number): boolean =>
          i === j || Math.abs(a - b) > STEP || Math.abs(p - q) > STEP,
      ),
    ),
  );
  checks.assert("horror creature gait horror");
}

/** The knee's flexion from the hip, knee and ankle joints, degrees. */
function flexion(
  hip: IAutoMovieVector3,
  knee: IAutoMovieVector3,
  ankle: IAutoMovieVector3,
): number {
  const a: IAutoMovieVector3 = {
    x: knee.x - hip.x,
    y: knee.y - hip.y,
    z: knee.z - hip.z,
  };
  const b: IAutoMovieVector3 = {
    x: ankle.x - knee.x,
    y: ankle.y - knee.y,
    z: ankle.z - knee.z,
  };
  const cos: number =
    (a.x * b.x + a.y * b.y + a.z * b.z) /
    (Math.hypot(a.x, a.y, a.z) * Math.hypot(b.x, b.y, b.z));
  return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
}
