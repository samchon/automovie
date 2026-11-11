import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import type { IHumanBody } from "../../body/IHumanBody";
import { createHumanBody } from "../../body/createHumanBody";
import { AutoMovieMotionHumanRange } from "../../compose/AutoMovieMotionHumanRange";
import { AutoMovieMotionHumanTouchEffector } from "../../compose/AutoMovieMotionHumanTouchEffector";
import { stretch } from "../../exercise/stretch";
import { HumanPerformance } from "../../perform/HumanPerformance";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { MotionBodies } from "../MotionBodies";
import type { humanPolygonMan } from "../humanPolygonMan";
import { StanceVerdicts } from "./StanceVerdicts";
import { TouchVerdicts } from "./TouchVerdicts";
import { everydayVerdicts } from "./everydayVerdicts";

/**
 * Capture cases of the standing stretches and yoga poses (#3246), each held
 * 3 s on the right side at moderate intensity from quiet standing.
 *
 * Every case reports foot slip at most 5 mm and no range-of-motion overshoot
 * (the issue's acceptance: every pose inside range of motion). Beyond that,
 * through the hold from `reachEnd` to `release`:
 *
 * - `stretch-neckSide`: the neck's and head's lateral flexion together
 *   within 2 degrees of the declared share of the neck's range;
 * - `stretch-crossBody`: the stretched wrist past the midline toward the
 *   other side;
 * - `stretch-overheadSide`: both wrists above the crown and the head moved
 *   at least 5 cm to the side over the hips;
 * - `stretch-quadriceps`: the hand within 5 cm of the ankle, the knee's
 *   included angle at most 60 degrees, and the centre of mass over the
 *   standing foot (the issue's balance acceptance for `balance: "none"`);
 * - `stretch-tree`: the raised ankle at least half a shank above the
 *   standing ankle, the palms' skins within 10 mm of each other, and the
 *   centre of mass over the standing foot.
 *
 * @param bodies The bodies; `m-average` when absent.
 * @returns The cases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists every case and every verdict with its bound and source.
 * @evidence contracts/development/implementation.md#principled-implementation Runs the real performance and measures displayed bones and the engine's centre of mass.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One performance per pose and body, one verdict block per pose.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads displayed poses, never the law's goals; a refused plan becomes a failing verdict.
 * @evidence contracts/development/implementation.md#efficient-algorithms One performance per case.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
export function stretchCases(
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
      "neckSide",
      "crossBody",
      "overheadSide",
      "quadriceps",
      "tree",
    ] as stretch.Kind[]) {
      const name: string = `stretch-${kind}${suffix}`;
      let performance: HumanPerformance;
      try {
        performance = new HumanPerformance({
          seed: "stretch",
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" as const },
            },
          ],
          composition: HumanChain.subject("a").act("stretch", {
            kind,
            seconds: 3,
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
      const reach: number = TouchVerdicts.event(performance, "a", "reachEnd");
      const release: number = TouchVerdicts.event(performance, "a", "release");
      const mid: number = (reach + release) / 2;
      const bones = performance.bones("a", mid);
      const at = (bone: string): IAutoMovieVector3 =>
        bones.get(bone as never)!.worldPosition;
      const verdicts: IMotionCaptureCase.IVerdict[] = [
        ...everydayVerdicts.standard(performance, "a", body),
      ];
      const balanced = (): void => {
        const w = StanceVerdicts.worstOutside(
          performance,
          "a",
          body,
          "left",
          reach,
          release,
        );
        verdicts.push({
          name: "centre of mass over the standing foot through the hold",
          passed: w.value <= 0,
          detail: `${(w.value * 1000).toFixed(1)} mm outside at ${w.at.toFixed(2)} s`,
        });
      };
      switch (kind) {
        case "neckSide": {
          const bend: number = Math.abs(
            StanceVerdicts.joint(performance, "a", "neck", mid)[1] +
              StanceVerdicts.joint(performance, "a", "head", mid)[1],
          );
          const want: number = Math.abs(
            AutoMovieMotionHumanRange.degrees("neck", "abduction", "deep"),
          );
          verdicts.push({
            name: "neck and head lateral flexion within 2 deg of the declared share",
            passed: Math.abs(bend - want) <= 2,
            detail: `${bend.toFixed(1)} deg against ${want.toFixed(1)} deg`,
          });
          break;
        }
        case "crossBody": {
          const x: number = at("rightHand").x;
          verdicts.push({
            name: "stretched wrist past the midline",
            passed: x > 0,
            detail: `${(x * 1000).toFixed(1)} mm toward the left`,
          });
          break;
        }
        case "overheadSide": {
          const crown: number = TouchVerdicts.place(
            performance,
            { subject: "a", body, region: "crown" },
            mid,
          ).point.y;
          for (const side of ["left", "right"] as const)
            verdicts.push({
              name: `${side} wrist above the crown`,
              passed: at(`${side}Hand`).y > crown,
              detail: `${((at(`${side}Hand`).y - crown) * 1000).toFixed(1)} mm above`,
            });
          const sideways: number = Math.abs(at("head").x - at("hips").x);
          verdicts.push({
            name: "head at least 5 cm to the side over the hips",
            passed: sideways >= 0.05,
            detail: `${(sideways * 1000).toFixed(1)} mm`,
          });
          break;
        }
        case "quadriceps": {
          const grip: number = Vector3.length(
            Vector3.subtract(
              AutoMovieMotionHumanTouchEffector.point(body, bones, "right", {
                surface: "grip",
                shape: "fist",
              }),
              at("rightFoot"),
            ),
          );
          verdicts.push(
            everydayVerdicts.within("hand on the ankle", grip, 0.05, "mm"),
          );
          const knee: number = StanceVerdicts.included(
            performance,
            "a",
            "rightUpperLeg",
            "rightLowerLeg",
            "rightFoot",
            mid,
          );
          verdicts.push(
            everydayVerdicts.within("knee's included angle", knee, 60, "deg"),
          );
          balanced();
          break;
        }
        case "tree": {
          const rise: number = at("rightFoot").y - at("leftFoot").y;
          verdicts.push({
            name: "raised ankle at least half a shank up",
            passed: rise >= body.measure.shank / 2,
            detail: `${(rise * 1000).toFixed(1)} mm`,
          });
          const palm = { surface: "palm", shape: "flat" } as const;
          const gap: number =
            Vector3.length(
              Vector3.subtract(
                AutoMovieMotionHumanTouchEffector.point(
                  body,
                  bones,
                  "left",
                  palm,
                ),
                AutoMovieMotionHumanTouchEffector.point(
                  body,
                  bones,
                  "right",
                  palm,
                ),
              ),
            ) -
            AutoMovieMotionHumanTouchEffector.pad(body, "left", palm) -
            AutoMovieMotionHumanTouchEffector.pad(body, "right", palm);
          verdicts.push(
            everydayVerdicts.within(
              "palms' skins apart",
              Math.abs(gap),
              0.01,
              "mm",
            ),
          );
          balanced();
          break;
        }
      }
      out.push({
        name,
        times: TouchVerdicts.times(performance.duration, 0.25, [
          [reach, "reachEnd"],
          [release, "release"],
        ]),
        performers: [TouchVerdicts.figure(performance, "a", man)],
        verdicts,
      });
    }
  }
  return out;
}
