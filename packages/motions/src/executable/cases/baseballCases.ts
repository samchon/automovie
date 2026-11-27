import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBaseball,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanChain } from "../../chain/AutoMovieMotionHumanChain";
import { AutoMovieMotionHumanBody } from "../../body/AutoMovieMotionHumanBody";
import { AutoMovieMotionHumanTouchEffector } from "../../compose/internal/AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanPerformance } from "../../perform/AutoMovieMotionHumanPerformance";
import type { IMotionCaptureCase } from "../internal/IMotionCaptureCase";
import { MotionBodies } from "../internal/MotionBodies";
import type { humanPolygonMan } from "../internal/humanPolygonMan";
import { FamilyCaseKit } from "./FamilyCaseKit";
import { TouchVerdicts } from "./TouchVerdicts";
import { everydayVerdicts } from "./internal/everydayVerdicts";

/*
 * Capture cases of the baseball positions from quiet standing.
 *
 * Every case reports foot slip at most 5 mm (the issue's planted-foot bound)
 * and no range-of-motion overshoot, and each planted foot within 5 mm of the
 * floor. Beyond that, mid-hold:
 *
 * - `baseball-catcherCrouch`: the glove palm at least half an arm ahead of the
 *   chest;
 * - `baseball-groundBall`: the glove palm within 10 cm of the floor;
 * - `baseball-battingStance`: the two fists within a hand's length of each other
 *   at the right shoulder's height, within 10 cm, and the feet at least three
 *   half shoulder widths apart.
 * Parameter bodies: The bodies; `m-average` when absent.
 * Returns: The cases.
 */
export function baseballCases(
  bodies: readonly string[] = ["m-average"],
): IMotionCaptureCase[] {
  const out: IMotionCaptureCase[] = [];
  for (const id of bodies) {
    const man: humanPolygonMan.IPolygonMan = MotionBodies.population(id);
    const body: IAutoMovieMotionHumanBody = AutoMovieMotionHumanBody.create(
      man.body.skeleton,
      man.body.profile,
    );
    const m = body.measure;
    const suffix: string = bodies.length === 1 ? "" : `-${id}`;
    for (const kind of [
      "catcherCrouch",
      "groundBall",
      "battingStance",
    ] as IAutoMovieMotionHumanBaseball.Kind[]) {
      const name: string = `baseball-${kind}${suffix}`;
      let performance: IAutoMovieMotionHumanPerformance;

      // Process boundary: a case that throws is reported as that case's refusal, and the remaining cases still run.
      try {
        performance = new AutoMovieMotionHumanPerformance({
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
          composition: AutoMovieMotionHumanChain.subject("a").act("baseball", { kind }).node,
        });
      } catch (error) {
        out.push(FamilyCaseKit.refused(name, error));
        continue;
      }
      const ready: number = TouchVerdicts.event(performance, "a", "ready");
      const relax: number = TouchVerdicts.event(performance, "a", "relax");
      const mid: number = (ready + relax) / 2;
      const bones = performance.bones("a", mid);
      const at = (bone: AutoMovieHumanoidBone): IAutoMovieVector3 =>
        bones.get(bone)!.worldPosition;
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
          // Above the floor and within 100 mm of it: a palm under the floor
          // is not near it.
          verdicts.push({
            name: "glove palm above the floor",
            passed: glove.y >= 0 && glove.y <= 0.1,
            detail: `${(glove.y * 1000).toFixed(1)} mm (0 to 100.0 mm)`,
          });
          break;
        }
        case "battingStance": {
          verdicts.push(
            everydayVerdicts.within(
              "fists apart on the handle",
              AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(at("leftHand"), at("rightHand"))),
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
