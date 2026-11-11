import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import type { IHumanBody } from "../../body/IHumanBody";
import { createHumanBody } from "../../body/createHumanBody";
import { exercise } from "../../exercise/exercise";
import { HumanPerformance } from "../../perform/HumanPerformance";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { MotionBodies } from "../MotionBodies";
import type { humanPolygonMan } from "../humanPolygonMan";
import { TouchVerdicts } from "./TouchVerdicts";
import { everydayVerdicts } from "./everydayVerdicts";

/**
 * Capture cases of the standing exercises (#3245), three repetitions each
 * from quiet standing.
 *
 * Every case reports foot slip at most 5 mm and no range-of-motion overshoot
 * (decision 11) and the exact count the issue asks for: the hips' (squat,
 * lunge), the raised ankle's (high knees) or the wrists' (jumping jack)
 * excursions counted on the 48 Hz grid. Beyond that:
 *
 * - `exercise-squat` (parallel): the thigh within 5 degrees of the declared
 *   angle from the horizontal at every `bottom`, and both feet within 5 mm
 *   of the floor while planted;
 * - `exercise-lunge`: the trailing knee within 15 cm of the floor at every
 *   `bottom` (the back knee nearly touches the floor), and the lead ankle
 *   back within 5 mm of its stance at the end;
 * - `exercise-highKnees`: the raised thigh within 15 degrees of the
 *   horizontal at every `bottom`;
 * - `exercise-jumpingJack`: both wrists above the crown at every `bottom`.
 *
 * @param bodies The bodies; `m-average` when absent.
 * @returns The cases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists every case and every verdict with its bound and source.
 * @evidence contracts/development/implementation.md#principled-implementation Runs the real performance and measures displayed bones.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One performance per exercise and body, one verdict block per exercise.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads displayed poses, never the law's goals; a refused plan becomes a failing verdict.
 * @evidence contracts/development/implementation.md#efficient-algorithms One performance per case.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
export function exerciseCases(
  bodies: readonly string[] = ["m-average"],
): IMotionCaptureCase[] {
  const out: IMotionCaptureCase[] = [];
  for (const id of bodies) {
    const man: humanPolygonMan.IPolygonMan = MotionBodies.population(id);
    const body: IHumanBody = createHumanBody(
      man.body.skeleton,
      man.body.profile,
    );
    const suffix: string = bodies.length === 1 ? "" : `-${id}`;
    for (const kind of [
      "squat",
      "lunge",
      "highKnees",
      "jumpingJack",
    ] as exercise.Kind[]) {
      const name: string = `exercise-${kind}${suffix}`;
      let performance: HumanPerformance;
      try {
        performance = new HumanPerformance({
          seed: "exercise",
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" as const },
            },
          ],
          composition: HumanChain.subject("a").act("exercise", {
            kind,
            reps: 3,
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
      const bottoms: number[] = [1, 2, 3].map((i: number): number =>
        TouchVerdicts.event(performance, "a", `bottom${i}`),
      );
      const at = (t: number, bone: string): IAutoMovieVector3 =>
        performance.bones("a", t).get(bone as never)!.worldPosition;
      const thigh = (t: number, side: "left" | "right"): number => {
        const hip: IAutoMovieVector3 = at(t, `${side}UpperLeg`);
        const knee: IAutoMovieVector3 = at(t, `${side}LowerLeg`);
        const d: number = Math.hypot(
          knee.x - hip.x,
          knee.y - hip.y,
          knee.z - hip.z,
        );
        return (
          (Math.asin(Math.max(-1, Math.min(1, (hip.y - knee.y) / d))) * 180) /
          Math.PI
        );
      };
      // How many times a measure dips below its midpoint and comes back, on a 48 Hz grid.
      const excursions = (measure: (t: number) => number): number => {
        const values: number[] = [];
        for (let t: number = 0; t <= performance.duration + 1e-9; t += 1 / 48)
          values.push(measure(t));
        const hi: number = Math.max(...values);
        const lo: number = Math.min(...values);
        const mid: number = (hi + lo) / 2;
        let n: number = 0;
        for (let i: number = 1; i < values.length; i++)
          if (values[i - 1]! >= mid && values[i]! < mid) n++;
        return n;
      };
      const verdicts: IMotionCaptureCase.IVerdict[] = [
        ...everydayVerdicts.standard(performance, "a", body),
      ];
      const counted = (label: string, measure: (t: number) => number): void => {
        const n: number = excursions(measure);
        verdicts.push({
          name: `${label} 3 times`,
          passed: n === 3,
          detail: `${n} counted`,
        });
      };
      switch (kind) {
        case "squat": {
          counted("hips go down", (t: number): number => at(t, "hips").y);
          let worst: number = -Infinity;
          for (const t of bottoms)
            worst = Math.max(
              worst,
              thigh(t, "left") - exercise.THIGH.parallel,
              thigh(t, "right") - exercise.THIGH.parallel,
            );
          verdicts.push(
            everydayVerdicts.within(
              "thigh above the declared angle at bottom",
              Math.max(0, worst),
              5,
              "deg",
            ),
          );
          const off = everydayVerdicts.grounded(performance, "a", body);
          verdicts.push({
            ...everydayVerdicts.within(
              "planted foot off the floor",
              off.value,
              0.005,
              "mm",
            ),
            detail: `${(off.value * 1000).toFixed(1)} mm (limit 5.0 mm), worst in ${off.where}`,
          });
          break;
        }
        case "lunge": {
          counted("hips go down", (t: number): number => at(t, "hips").y);
          let worst: number = 0;
          for (const t of bottoms)
            worst = Math.max(worst, at(t, "leftLowerLeg").y);
          verdicts.push(
            everydayVerdicts.within(
              "trailing knee above the floor at bottom",
              worst,
              0.15,
              "mm",
            ),
          );
          const a0: IAutoMovieVector3 = at(0, "rightFoot");
          const a1: IAutoMovieVector3 = at(performance.duration, "rightFoot");
          verdicts.push(
            everydayVerdicts.within(
              "lead ankle back on its stance at the end",
              Math.hypot(a1.x - a0.x, a1.y - a0.y, a1.z - a0.z),
              0.005,
              "mm",
            ),
          );
          break;
        }
        case "highKnees": {
          counted(
            "an ankle rises",
            (t: number): number =>
              -Math.max(at(t, "leftFoot").y, at(t, "rightFoot").y),
          );
          let worst: number = 0;
          for (const t of bottoms)
            worst = Math.max(
              worst,
              Math.min(thigh(t, "left"), thigh(t, "right")),
            );
          verdicts.push(
            everydayVerdicts.within(
              "raised thigh off the horizontal at bottom",
              worst,
              15,
              "deg",
            ),
          );
          break;
        }
        case "jumpingJack": {
          counted(
            "the wrists rise",
            (t: number): number => -at(t, "rightHand").y,
          );
          for (const t of bottoms) {
            const crown: number = TouchVerdicts.place(
              performance,
              { subject: "a", body, region: "crown" },
              t,
            ).point.y;
            const low: number = Math.min(
              at(t, "leftHand").y,
              at(t, "rightHand").y,
            );
            verdicts.push({
              name: `wrists above the crown at ${t.toFixed(2)} s`,
              passed: low > crown,
              detail: `${((low - crown) * 1000).toFixed(1)} mm above`,
            });
          }
          break;
        }
      }
      out.push({
        name,
        times: TouchVerdicts.times(
          performance.duration,
          0.2,
          bottoms.map((t: number, i: number): [number, string] => [
            t,
            `bottom${i + 1}`,
          ]),
        ),
        performers: [TouchVerdicts.figure(performance, "a", man)],
        verdicts,
      });
    }
  }
  return out;
}
