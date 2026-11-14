import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanDrill,
  HumanFloorFall,
  HumanPerformance,
  type HumanSegment,
  HumanSportGym,
  HumanVerdicts,
  type IHumanBody,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A crouch keeps the feet on the floor and bends the knees whatever act it
 * is entered from: a squat after a calf raise, whose legs are joint angles
 * with no leg goal, and the crouch a goalkeeper's dive takes off from.
 *
 * The knee's flexion is read as 180 degrees less the angle at the knee
 * joint between the thigh (hip joint to knee) and the shank (knee to
 * ankle), on the displayed bones.
 *
 * Scenarios, on the smallest and the largest body of the sweep (`f-small`
 * and `m-large`):
 * 1. `calfRaise` (one repetition) then `squats` (one, at the default
 *    parallel depth) plan.
 * 2. At the squat's `bottom1` both knees flex at least 90 degrees: at
 *    parallel depth the thigh is level over a shank no further back than
 *    upright (ACSM's Guidelines for Exercise Testing and Prescription,
 *    11th ed.), so the knee is at least a right angle.
 * 3. Through the squat no collider sinks below the floor beyond the
 *    verdicts' floor limit, and the balls of both feet stay within 5 mm of
 *    where they stood as the squat began (the verdicts' slip limit).
 * 4. `stand` (0.3 s) then `goalkeeperDiveLeft` plan, and at the dive's
 *    `takeOff` both knees flex at least 20 degrees more than at its start:
 *    the hips go down into the take-off by bending the planted legs.
 * 5. From the dive's start to 0.1 s after `takeOff`, no collider sinks
 *    below the floor beyond the verdicts' floor limit and no joint centre
 *    jumps (the verdicts' `floor` and `jump` checks), so the legs leave the
 *    crouch continuously.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds both performances through the public chain and reads displayed bones and the verdicts over each act's span; a crouch that lowers straight legs through the floor, or a take-off that snaps the knees straight, fails with its body and numbers.
 * @evidence contracts/development/testing.md#independent-expectations The right angle of a parallel squat is the exercise's definition; the floor, slip and jump limits are the verdicts' own bounds for any human motion; the 20 degrees of the take-off only states that the knees bend at all under a lowered hip.
 * @evidence contracts/development/testing.md#distinguishing-cases A crouch entered from joint angles alone (the squat after the calf raise) and from a stance with leg goals (the dive after the stand), on the two extreme bodies; the crouch primitive's own sweep over depths and pitches is `motionComposeTrunk.crouch`'s.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds four short performances in memory; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, how the knee is read and the 5 scenarios with their bounds and sources.
 */
export function test_human_motion_crouch_planted_entry(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const mm = (metres: number): string => (metres * 1000).toFixed(0);
  for (const name of ["f-small", "m-large"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const perform = (
      composition: { node: HumanPerformance.IInput["composition"] },
      label: string,
    ): HumanPerformance | undefined => {
      try {
        return new HumanPerformance({
          seed: "crouch-entry",
          laws: [
            HumanSportGym.calfRaise,
            HumanDrill.squats,
            HumanFloorFall.goalkeeperDiveLeft,
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
          composition: composition.node,
        });
      } catch (error) {
        all.check(
          `${name} ${label}: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
          false,
        );
        return undefined;
      }
    };
    const knee = (
      performance: HumanPerformance,
      seconds: number,
      side: "left" | "right",
    ): number => {
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        performance.bones("a", seconds);
      const hip: IAutoMovieVector3 = bones.get(`${side}UpperLeg`)!
        .worldPosition;
      const at: IAutoMovieVector3 = bones.get(`${side}LowerLeg`)!.worldPosition;
      const ankle: IAutoMovieVector3 = bones.get(`${side}Foot`)!.worldPosition;
      const u: number[] = [hip.x - at.x, hip.y - at.y, hip.z - at.z];
      const v: number[] = [ankle.x - at.x, ankle.y - at.y, ankle.z - at.z];
      const cos: number =
        (u[0]! * v[0]! + u[1]! * v[1]! + u[2]! * v[2]!) /
        (Math.hypot(u[0]!, u[1]!, u[2]!) * Math.hypot(v[0]!, v[1]!, v[2]!));
      return 180 - (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
    };
    const instant = (placed: HumanSegment.ISegment, event: string): number =>
      placed.start +
      (placed.plan.events.find((e): boolean => e.name === event)?.share ??
        NaN) *
        placed.plan.duration;
    const findings = (
      performance: HumanPerformance,
      from: number,
      to: number,
      checks: readonly string[],
    ): string[] =>
      HumanVerdicts.of(performance, 24, { from, to })
        .findings.filter((f): boolean => checks.includes(f.check))
        .map(
          (f): string =>
            `${f.check} ${f.value.toFixed(4)} over ${f.limit} at ${f.seconds.toFixed(2)} s (${f.where})`,
        );

    // 1 to 3. A squat entered from a calf raise's joint angles.
    const squatting: HumanPerformance | undefined = perform(
      HumanChain.subject("a")
        .registered("calfRaise", { reps: 1 })
        .registered("squats", { reps: 1 }),
      "calfRaise then squats",
    );
    if (squatting !== undefined) {
      const squat: HumanSegment.ISegment = squatting.segments("a")[1]!;
      const bottom: number = instant(squat, "bottom1");
      for (const side of ["left", "right"] as const) {
        const flexion: number = knee(squatting, bottom, side);
        all.check(
          `${name} squat: at the bottom the ${side} knee flexes ${flexion.toFixed(1)} degrees, at least 90 expected`,
          flexion >= 90,
        );
      }
      const balls = (seconds: number): IAutoMovieVector3[] => {
        const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          squatting.bones("a", seconds);
        return [
          bones.get("leftToes")!.worldPosition,
          bones.get("rightToes")!.worldPosition,
        ];
      };
      const stood: IAutoMovieVector3[] = balls(squat.entryTime);
      let slip: number = 0;
      for (
        let seconds: number = squat.entryTime;
        seconds <= squat.end;
        seconds += 1 / 24
      )
        balls(seconds).forEach((ball: IAutoMovieVector3, i: number): void => {
          slip = Math.max(
            slip,
            Math.hypot(
              ball.x - stood[i]!.x,
              ball.y - stood[i]!.y,
              ball.z - stood[i]!.z,
            ),
          );
        });
      all.check(
        `${name} squat: the balls of the feet move up to ${mm(slip)} mm, within 5 expected`,
        slip <= 0.005,
      );
      all.equals(
        `${name} squat: nothing sinks below the floor`,
        findings(squatting, squat.entryTime, squat.end, ["floor"]),
        [],
      );
    }

    // 4 and 5. The crouch a dive takes off from.
    const diving: HumanPerformance | undefined = perform(
      HumanChain.subject("a")
        .stand({ seconds: 0.3 })
        .registered("goalkeeperDiveLeft", {}),
      "stand then goalkeeperDiveLeft",
    );
    if (diving !== undefined) {
      const dive: HumanSegment.ISegment = diving.segments("a")[1]!;
      const takeOff: number = instant(dive, "takeOff");
      for (const side of ["left", "right"] as const) {
        const bent: number =
          knee(diving, takeOff, side) - knee(diving, dive.entryTime, side);
        all.check(
          `${name} dive: the ${side} knee flexes ${bent.toFixed(1)} degrees more at take-off than at the start, at least 20 expected`,
          bent >= 20,
        );
      }
      all.equals(
        `${name} dive: nothing sinks below the floor and no joint jumps into the take-off`,
        findings(diving, dive.entryTime, takeOff + 0.1, ["floor", "jump"]),
        [],
      );
    }
  }
  all.assert("a crouch bends planted legs whatever it is entered from");
}
