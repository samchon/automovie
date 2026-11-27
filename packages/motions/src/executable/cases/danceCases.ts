import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanDance,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanChain } from "../../chain/HumanChain";
import { AutoMovieMotionHumanBody } from "../../body/AutoMovieMotionHumanBody";
import { HumanPerformance } from "../../perform/HumanPerformance";
import type { IMotionCaptureCase } from "../internal/IMotionCaptureCase";
import { MotionBodies } from "../internal/MotionBodies";
import type { humanPolygonMan } from "../internal/humanPolygonMan";
import { FamilyCaseKit } from "./FamilyCaseKit";
import { TouchVerdicts } from "./TouchVerdicts";
import { everydayVerdicts } from "./internal/everydayVerdicts";

/** The alternatives of `DanceCasesExtremesSign`'s site. */
type DanceCasesExtremesSign = 1 | -1;

/**
 * Capture cases of the solo dance steps, eight beats at 120 bpm from quiet
 * standing.
 *
 * Every case reports foot slip at most 5 mm and no range-of-motion overshoot.
 * The issue's acceptance, that footfalls and accents land within one frame
 * (1/24 s) of the beat, is read on a 96 Hz grid as:
 *
 * - `dance-bounce`: the hips' lowest point of each beat within one frame of it;
 * - `dance-sway`: the hips' sideways extremes within one frame of beats;
 * - `dance-stepTouch`: each footfall (the first instant the ankle is within 2 mm
 *   of where it comes to rest) within one frame of its beat, and a footfall on
 *   every beat;
 * - `dance-boxStep`: the same two readings of its footfalls.
 *
 * @param bodies The bodies; `m-average` when absent.
 * @returns The cases.
 */
export function danceCases(
  bodies: readonly string[] = ["m-average"],
): IMotionCaptureCase[] {
  const out: IMotionCaptureCase[] = [];
  const frame: number = 1 / 24;
  for (const id of bodies) {
    const man: humanPolygonMan.IPolygonMan = MotionBodies.population(id);
    const body: IAutoMovieMotionHumanBody = AutoMovieMotionHumanBody.create(
      man.body.skeleton,
      man.body.profile,
    );
    const suffix: string = bodies.length === 1 ? "" : `-${id}`;
    for (const kind of [
      "bounce",
      "sway",
      "stepTouch",
      "boxStep",
    ] as IAutoMovieMotionHumanDance.Kind[]) {
      const name: string = `dance-${kind}${suffix}`;
      let performance: IAutoMovieMotionHumanPerformance;

      // Process boundary: a case that throws is reported as that case's refusal, and the remaining cases still run.
      try {
        performance = new HumanPerformance({
          seed: "dance",
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" as const },
            },
          ],
          composition: HumanChain.subject("a").act("dance", {
            kind,
            bpm: 120,
            count: 8,
          }).node,
        });
      } catch (error) {
        out.push(FamilyCaseKit.refused(name, error));
        continue;
      }
      const beats: number[] = [];
      for (let k: number = 1; k <= 8; k++)
        beats.push(TouchVerdicts.event(performance, "a", `beat${k}`));
      const at = (t: number, bone: AutoMovieHumanoidBone): IAutoMovieVector3 =>
        performance.bones("a", t).get(bone)!.worldPosition;
      const grid: number[] = [];
      for (let t: number = 0; t <= performance.duration + 1e-9; t += 1 / 96)
        grid.push(t);
      // The film seconds where a measure has a strict local extreme.
      const extremes = (
        measure: (t: number) => number,
        sign: DanceCasesExtremesSign,
      ): number[] => {
        const v: number[] = grid.map((t: number): number => sign * measure(t));
        const found: number[] = [];
        for (let i: number = 1; i + 1 < v.length; i++)
          if (v[i]! < v[i - 1]! && v[i]! <= v[i + 1]!) found.push(grid[i]!);
        return found;
      };
      // The worst distance from each instant of `of` to its nearest found
      // instant; with nothing to place, none is near, so the reading is
      // infinite rather than the empty maximum's -Infinity.
      const worst: (
        found: readonly number[],
        of: readonly number[],
      ) => number = (
        found: readonly number[],
        of: readonly number[],
      ): number =>
        of.length === 0
          ? Infinity
          : Math.max(
              ...of.map((b: number): number =>
                Math.min(
                  ...found.map((t: number): number => Math.abs(t - b)),
                  Infinity,
                ),
              ),
            );
      const verdicts: IMotionCaptureCase.IVerdict[] = [
        ...everydayVerdicts.standard(performance, "a", body),
      ];
      const timed = (label: string, value: number): void => {
        verdicts.push({
          name: label,
          passed: value <= frame + 1e-9,
          detail: `${(value * 1000).toFixed(1)} ms (limit ${(frame * 1000).toFixed(1)} ms)`,
        });
      };
      switch (kind) {
        case "bounce":
          timed(
            "hips lowest within one frame of every beat",
            worst(
              extremes((t: number): number => at(t, "hips").y, 1),
              beats,
            ),
          );
          break;
        case "sway": {
          const x = (t: number): number => at(t, "hips").x;
          const found: number[] = [...extremes(x, 1), ...extremes(x, -1)];
          timed(
            "hips at a side within one frame of a beat",
            worst(beats, found),
          );
          break;
        }
        case "stepTouch":
        case "boxStep": {
          const falls: number[] = [];
          for (const foot of [
            "leftFoot",
            "rightFoot",
          ] satisfies readonly AutoMovieHumanoidBone[]) {
            const pos: IAutoMovieVector3[] = grid.map((t: number) =>
              at(t, foot),
            );
            let moving: boolean = false;
            for (let i: number = 1; i < pos.length; i++) {
              const step: number = Math.hypot(
                pos[i]!.x - pos[i - 1]!.x,
                pos[i]!.y - pos[i - 1]!.y,
                pos[i]!.z - pos[i - 1]!.z,
              );
              if (step > 0.001) moving = true;
              else if (moving) {
                falls.push(grid[i]!);
                moving = false;
              }
            }
          }
          timed(
            "every footfall within one frame of a beat",
            falls.length === 0 ? Infinity : worst(beats, falls),
          );
          verdicts.push({
            name: "a footfall on every beat",
            passed: falls.length === beats.length,
            detail: `${falls.length} footfalls for ${beats.length} beats`,
          });
          break;
        }
      }
      out.push({
        name,
        times: TouchVerdicts.times(
          performance.duration,
          0.125,
          beats.map((t: number, i: number): [number, string] => [
            t,
            `beat${i + 1}`,
          ]),
        ),
        performers: [TouchVerdicts.figure(performance, "a", man)],
        verdicts,
      });
    }
  }
  return out;
}
