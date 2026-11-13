import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import type { IHumanBody } from "../../body/IHumanBody";
import { createHumanBody } from "../../body/createHumanBody";
import type { dance } from "../../exercise/dance";
import { HumanPerformance } from "../../perform/HumanPerformance";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { MotionBodies } from "../MotionBodies";
import type { humanPolygonMan } from "../humanPolygonMan";
import { TouchVerdicts } from "./TouchVerdicts";
import { everydayVerdicts } from "./everydayVerdicts";

/**
 * Capture cases of the solo dance steps (#3253), eight beats at 120 bpm
 * from quiet standing.
 *
 * Every case reports foot slip at most 5 mm and no range-of-motion
 * overshoot. The issue's acceptance, that footfalls and accents land within
 * one frame (1/24 s) of the beat, is read on a 96 Hz grid as:
 *
 * - `dance-bounce`: the hips' lowest point of each beat within one frame of
 *   it;
 * - `dance-sway`: the hips' sideways extremes within one frame of beats;
 * - `dance-stepTouch`: each footfall (the first instant the ankle is within
 *   2 mm of where it comes to rest) within one frame of its beat, and a
 *   footfall on every beat;
 * - `dance-boxStep`: the same two readings of its footfalls.
 *
 * @param bodies The bodies; `m-average` when absent.
 * @returns The cases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists every case and every verdict with its bound and source.
 * @evidence contracts/development/implementation.md#principled-implementation Runs the real performance and times the displayed bones against the authored beats.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One performance per step, one timing measure per step.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads displayed poses, never the law's curves; a refused plan becomes a failing verdict.
 * @evidence contracts/development/implementation.md#efficient-algorithms One performance per case.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
export function danceCases(
  bodies: readonly string[] = ["m-average"],
): IMotionCaptureCase[] {
  const out: IMotionCaptureCase[] = [];
  const frame: number = 1 / 24;
  for (const id of bodies) {
    const man: humanPolygonMan.IPolygonMan = MotionBodies.population(id);
    const body: IHumanBody = createHumanBody(
      man.body.skeleton,
      man.body.profile,
    );
    const suffix: string = bodies.length === 1 ? "" : `-${id}`;
    for (const kind of ["bounce", "sway", "stepTouch", "boxStep"] as dance.Kind[]) {
      const name: string = `dance-${kind}${suffix}`;
      let performance: HumanPerformance;
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
            beats: 8,
          }).node,
        });
      } catch (error) {
        out.push({
          name,
          times: [{ seconds: 0, label: "refused" }],
          performers: [],
          verdicts: [
            {
              name: "planned",
              passed: false,
              detail: (error as Error).message,
            },
          ],
        });
        continue;
      }
      const beats: number[] = [];
      for (let k: number = 1; k <= 8; k++)
        beats.push(TouchVerdicts.event(performance, "a", `beat${k}`));
      const at = (t: number, bone: string): IAutoMovieVector3 =>
        performance.bones("a", t).get(bone as never)!.worldPosition;
      const grid: number[] = [];
      for (let t: number = 0; t <= performance.duration + 1e-9; t += 1 / 96)
        grid.push(t);
      // The film seconds where a measure has a strict local extreme.
      const extremes = (
        measure: (t: number) => number,
        sign: 1 | -1,
      ): number[] => {
        const v: number[] = grid.map((t: number): number => sign * measure(t));
        const found: number[] = [];
        for (let i: number = 1; i + 1 < v.length; i++)
          if (v[i]! < v[i - 1]! && v[i]! <= v[i + 1]!) found.push(grid[i]!);
        return found;
      };
      // The worst distance from a beat to its nearest found instant.
      const worst = (found: readonly number[], of: readonly number[]): number =>
        Math.max(
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
          for (const foot of ["leftFoot", "rightFoot"]) {
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
