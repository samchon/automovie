import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import type { IHumanBody } from "../../body/IHumanBody";
import { createHumanBody } from "../../body/createHumanBody";
import { AutoMovieMotionHumanTouchEffector } from "../../compose/AutoMovieMotionHumanTouchEffector";
import { HumanPerformance } from "../../perform/HumanPerformance";
import type { ballSport } from "../../sport/ballSport";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { MotionBodies } from "../MotionBodies";
import type { humanPolygonMan } from "../humanPolygonMan";
import { TouchVerdicts } from "./TouchVerdicts";
import { everydayVerdicts } from "./everydayVerdicts";

/**
 * Capture cases of the team ball skills (#3247) from quiet standing, with
 * an implied ball.
 *
 * Every case reports foot slip at most 5 mm (decision 11's planted-foot
 * bound) and no range-of-motion overshoot. Beyond that:
 *
 * - `team-ball-dribble`: four pushes counted as palm drops, the palm facing
 *   within 30 degrees of straight down at each lowest point;
 * - `team-ball-dig`: the two wrists within 8 cm of each other at `stroke` and the
 *   forearms pointing between 10 and 60 degrees below the horizontal (the
 *   platform);
 * - `team-ball-set`: both wrists above the crown at `stroke`;
 * - `team-ball-throwIn`: both wrists behind the head at `ready` and, at the
 *   instant the hands move fastest, their path rising between 20 and 40
 *   degrees (about 30 degrees, Linthorne and Everett 2006).
 *
 * @param bodies The bodies; `m-average` when absent.
 * @returns The cases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists every case and every verdict with its bound and source.
 * @evidence contracts/development/implementation.md#principled-implementation Runs the real performance and measures displayed bones.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One performance per skill, one verdict block per skill.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads displayed poses, never the law's goals; a refused plan becomes a failing verdict.
 * @evidence contracts/development/implementation.md#efficient-algorithms One performance per case.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
export function ballSportCases(
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
      "dribble",
      "dig",
      "set",
      "throwIn",
    ] as ballSport.Kind[]) {
      const name: string = `team-ball-${kind}${suffix}`;
      let performance: HumanPerformance;
      try {
        performance = new HumanPerformance({
          seed: "ball",
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" as const },
            },
          ],
          composition: HumanChain.subject("a").act("ballSport", { kind }).node,
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
      const stroke: number = TouchVerdicts.event(performance, "a", "stroke");
      const strokeStart: number = TouchVerdicts.event(
        performance,
        "a",
        "strokeStart",
      );
      const strokeEnd: number = TouchVerdicts.event(
        performance,
        "a",
        "strokeEnd",
      );
      const at = (t: number, bone: string): IAutoMovieVector3 =>
        performance.bones("a", t).get(bone as never)!.worldPosition;
      const verdicts: IMotionCaptureCase.IVerdict[] = [
        ...everydayVerdicts.standard(performance, "a", body),
      ];
      switch (kind) {
        case "dribble": {
          const palm = { surface: "palm", shape: "flat" } as const;
          const lows: number[] = [];
          let last: number = Infinity;
          let falling: boolean = false;
          for (
            let t: number = strokeStart;
            t <= strokeEnd + 1e-9;
            t += 1 / 96
          ) {
            const y: number = AutoMovieMotionHumanTouchEffector.point(
              body,
              performance.bones("a", t),
              "right",
              palm,
            ).y;
            if (y < last) falling = true;
            else if (falling && y > last) {
              lows.push(t - 1 / 96);
              falling = false;
            }
            last = y;
          }
          verdicts.push({
            name: "four pushes",
            passed: lows.length === 4,
            detail: `${lows.length} palm drops`,
          });
          let worst: number = 0;
          for (const t of lows) {
            const hand = performance.bones("a", t).get("rightHand")!;
            const local = AutoMovieMotionHumanTouchEffector.local(
              body,
              "right",
              palm,
            );
            const n: IAutoMovieVector3 = Quaternion.rotateVector(
              hand.worldRotation,
              local.normal,
            );
            worst = Math.max(
              worst,
              (Math.acos(Math.max(-1, Math.min(1, -n.y))) * 180) / Math.PI,
            );
          }
          verdicts.push(
            everydayVerdicts.within(
              "palm off straight down at each push",
              worst,
              30,
              "deg",
            ),
          );
          break;
        }
        case "dig": {
          const apart: number = Vector3.length(
            Vector3.subtract(at(stroke, "leftHand"), at(stroke, "rightHand")),
          );
          verdicts.push(
            everydayVerdicts.within(
              "wrists apart at stroke",
              apart,
              0.08,
              "mm",
            ),
          );
          for (const side of ["left", "right"] as const) {
            const d: IAutoMovieVector3 = Vector3.subtract(
              at(stroke, `${side}Hand`),
              at(stroke, `${side}LowerArm`),
            );
            const below: number =
              (Math.asin(-d.y / Vector3.length(d)) * 180) / Math.PI;
            verdicts.push({
              name: `${side} forearm 10 to 60 deg below the horizontal`,
              passed: below >= 10 && below <= 60,
              detail: `${below.toFixed(1)} deg`,
            });
          }
          break;
        }
        case "set": {
          const crown: number = TouchVerdicts.place(
            performance,
            { subject: "a", body, region: "crown" },
            stroke,
          ).point.y;
          for (const side of ["left", "right"] as const)
            verdicts.push({
              name: `${side} wrist above the crown at stroke`,
              passed: at(stroke, `${side}Hand`).y > crown,
              detail: `${((at(stroke, `${side}Hand`).y - crown) * 1000).toFixed(1)} mm`,
            });
          break;
        }
        case "throwIn": {
          for (const side of ["left", "right"] as const)
            verdicts.push({
              name: `${side} wrist behind the head at ready`,
              passed: at(ready, `${side}Hand`).z < at(ready, "head").z,
              detail: `${((at(ready, `${side}Hand`).z - at(ready, "head").z) * 1000).toFixed(1)} mm ahead`,
            });
          let fastest: { speed: number; v: IAutoMovieVector3 } = {
            speed: 0,
            v: { x: 0, y: 0, z: 0 },
          };
          for (
            let t: number = strokeStart;
            t + 1 / 96 <= stroke + 1e-9;
            t += 1 / 96
          ) {
            const v: IAutoMovieVector3 = Vector3.scale(
              Vector3.subtract(at(t + 1 / 96, "rightHand"), at(t, "rightHand")),
              96,
            );
            if (Vector3.length(v) > fastest.speed)
              fastest = { speed: Vector3.length(v), v };
          }
          const angle: number =
            (Math.atan2(fastest.v.y, Math.hypot(fastest.v.x, fastest.v.z)) *
              180) /
            Math.PI;
          verdicts.push({
            name: "hands' path rising 20 to 40 deg at their fastest",
            passed: angle >= 20 && angle <= 40,
            detail: `${angle.toFixed(1)} deg at ${fastest.speed.toFixed(2)} m/s`,
          });
          break;
        }
      }
      out.push({
        name,
        times: TouchVerdicts.times(performance.duration, 0.1, [
          [ready, "ready"],
          [stroke, "stroke"],
        ]),
        performers: [TouchVerdicts.figure(performance, "a", man)],
        verdicts,
      });
    }
  }
  return out;
}
