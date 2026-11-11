import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import type { IHumanBody } from "../../body/IHumanBody";
import { createHumanBody } from "../../body/createHumanBody";
import { AutoMovieMotionHumanTouchEffector } from "../../compose/AutoMovieMotionHumanTouchEffector";
import { HumanPerformance } from "../../perform/HumanPerformance";
import type { baseball } from "../../sport/baseball";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { MotionBodies } from "../MotionBodies";
import type { humanPolygonMan } from "../humanPolygonMan";
import { TouchVerdicts } from "./TouchVerdicts";
import { everydayVerdicts } from "./everydayVerdicts";

/**
 * Capture cases of the baseball positions (#3248) from quiet standing.
 *
 * Every case reports foot slip at most 5 mm (the issue's planted-foot bound)
 * and no range-of-motion overshoot, and each planted foot within 5 mm of the
 * floor. Beyond that, mid-hold:
 *
 * - `baseball-catcherCrouch`: the glove palm at least half an arm ahead of
 *   the chest;
 * - `baseball-groundBall`: the glove palm within 10 cm of the floor;
 * - `baseball-battingStance`: the two fists within a hand's length of each
 *   other at the right shoulder's height, within 10 cm, and the feet at
 *   least three half shoulder widths apart.
 *
 * @param bodies The bodies; `m-average` when absent.
 * @returns The cases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists every case and every verdict with its bound and source.
 * @evidence contracts/development/implementation.md#principled-implementation Runs the real performance and measures displayed bones.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One performance per position, one verdict block per position.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads displayed poses, never the law's goals; a refused plan becomes a failing verdict.
 * @evidence contracts/development/implementation.md#efficient-algorithms One performance per case.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
export function baseballCases(
  bodies: readonly string[] = ["m-average"],
): IMotionCaptureCase[] {
  const out: IMotionCaptureCase[] = [];
  for (const id of bodies) {
    const man: humanPolygonMan.IPolygonMan = MotionBodies.population(id);
    const body: IHumanBody = createHumanBody(
      man.body.skeleton,
      man.body.profile,
    );
    const m = body.measure;
    const suffix: string = bodies.length === 1 ? "" : `-${id}`;
    for (const kind of [
      "catcherCrouch",
      "groundBall",
      "battingStance",
    ] as baseball.Kind[]) {
      const name: string = `baseball-${kind}${suffix}`;
      let performance: HumanPerformance;
      try {
        performance = new HumanPerformance({
          seed: "baseball",
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" as const },
            },
          ],
          composition: HumanChain.subject("a").act("baseball", { kind }).node,
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
      const ready: number = TouchVerdicts.event(performance, "a", "ready");
      const relax: number = TouchVerdicts.event(performance, "a", "relax");
      const mid: number = (ready + relax) / 2;
      const bones = performance.bones("a", mid);
      const at = (bone: string): IAutoMovieVector3 =>
        bones.get(bone as never)!.worldPosition;
      const palm = { surface: "palm", shape: "flat" } as const;
      const off = everydayVerdicts.grounded(performance, "a", body);
      const verdicts: IMotionCaptureCase.IVerdict[] = [
        ...everydayVerdicts.standard(performance, "a", body),
        {
          ...everydayVerdicts.within(
            "planted foot off the floor",
            off.value,
            0.005,
            "mm",
          ),
          detail: `${(off.value * 1000).toFixed(1)} mm (limit 5.0 mm), worst in ${off.where}`,
        },
      ];
      switch (kind) {
        case "catcherCrouch": {
          const glove: IAutoMovieVector3 =
            AutoMovieMotionHumanTouchEffector.point(body, bones, "left", palm);
          const ahead: number = glove.z - at("chest").z;
          verdicts.push({
            name: "glove half an arm ahead of the chest",
            passed: ahead >= 0.5 * (m.upperArm + m.forearm),
            detail: `${(ahead * 1000).toFixed(1)} mm`,
          });
          break;
        }
        case "groundBall": {
          const glove: IAutoMovieVector3 =
            AutoMovieMotionHumanTouchEffector.point(body, bones, "left", palm);
          verdicts.push(
            everydayVerdicts.within(
              "glove palm above the floor",
              Math.abs(glove.y),
              0.1,
              "mm",
            ),
          );
          break;
        }
        case "battingStance": {
          verdicts.push(
            everydayVerdicts.within(
              "fists apart on the handle",
              Vector3.length(Vector3.subtract(at("leftHand"), at("rightHand"))),
              m.hand,
              "mm",
            ),
            everydayVerdicts.within(
              "fists off the right shoulder's height",
              Math.abs(at("rightHand").y - at("rightUpperArm").y),
              0.1,
              "mm",
            ),
          );
          const apart: number = Math.abs(at("leftFoot").x - at("rightFoot").x);
          verdicts.push({
            name: "feet three half shoulder widths apart",
            passed: apart >= 3 * m.shoulderHalfWidth,
            detail: `${(apart * 1000).toFixed(1)} mm`,
          });
          break;
        }
      }
      out.push({
        name,
        times: TouchVerdicts.times(performance.duration, 0.1, [
          [ready, "ready"],
          [relax, "relax"],
        ]),
        performers: [TouchVerdicts.figure(performance, "a", man)],
        verdicts,
      });
    }
  }
  return out;
}
