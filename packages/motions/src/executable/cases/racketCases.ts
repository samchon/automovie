import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import type { IHumanBody } from "../../body/IHumanBody";
import { createHumanBody } from "../../body/createHumanBody";
import { HumanPerformance } from "../../perform/HumanPerformance";
import { HumanColliders } from "../../posture/HumanColliders";
import { HumanFoot } from "../../posture/HumanFoot";
import type { racket } from "../../sport/racket";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { MotionBodies } from "../MotionBodies";
import type { humanPolygonMan } from "../humanPolygonMan";
import { TouchVerdicts } from "./TouchVerdicts";
import { everydayVerdicts } from "./everydayVerdicts";

/**
 * Capture cases of the racket and golf positions (#3249) from quiet
 * standing.
 *
 * Every case reports foot slip at most 5 mm (the issue's planted-foot
 * bound, pivot allowed) and no range-of-motion overshoot. Beyond that:
 *
 * - `racket-readyPosition`: the two fists within one and a half hand
 *   lengths of each other on the implied handle and the feet at least three
 *   half shoulder widths apart, mid-hold;
 * - `racket-splitStep`: both soles off the floor by more than 5 mm at the
 *   hop's peak, no collider deeper than 10 mm below the floor (decision
 *   11's penetration bound), and the stance wider after the landing by at
 *   least 0.8 half shoulder widths;
 * - `racket-golfAddress`: the trunk (hips to neck) inclined 25 to 45
 *   degrees from the vertical (provisional band around the law's 35), the
 *   hands within 10 cm horizontally of the shoulders' midpoint (hanging
 *   arms), and two waggles counted as forward extremes of the hands.
 *
 * @param bodies The bodies; `m-average` when absent.
 * @returns The cases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists every case and every verdict with its bound and source.
 * @evidence contracts/development/implementation.md#principled-implementation Runs the real performance and measures displayed bones and colliders.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One performance per position, one verdict block per position.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads displayed poses, never the law's goals; a refused plan becomes a failing verdict.
 * @evidence contracts/development/implementation.md#efficient-algorithms One performance per case.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
export function racketCases(
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
      "readyPosition",
      "splitStep",
      "golfAddress",
    ] as racket.Kind[]) {
      const name: string = `racket-${kind}${suffix}`;
      let performance: HumanPerformance;
      try {
        performance = new HumanPerformance({
          seed: "racket",
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" as const },
            },
          ],
          composition: HumanChain.subject("a").act("racket", { kind }).node,
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
      const strokeStart: number = TouchVerdicts.event(
        performance,
        "a",
        "strokeStart",
      );
      const stroke: number = TouchVerdicts.event(performance, "a", "stroke");
      const strokeEnd: number = TouchVerdicts.event(
        performance,
        "a",
        "strokeEnd",
      );
      const relax: number = TouchVerdicts.event(performance, "a", "relax");
      const at = (t: number, bone: string): IAutoMovieVector3 =>
        performance.bones("a", t).get(bone as never)!.worldPosition;
      const width = (t: number): number =>
        Math.abs(at(t, "leftFoot").x - at(t, "rightFoot").x);
      const verdicts: IMotionCaptureCase.IVerdict[] = [
        ...everydayVerdicts.standard(performance, "a", body),
      ];
      switch (kind) {
        case "readyPosition": {
          const mid: number = (ready + relax) / 2;
          verdicts.push(
            everydayVerdicts.within(
              "fists apart on the handle",
              Vector3.length(
                Vector3.subtract(at(mid, "leftHand"), at(mid, "rightHand")),
              ),
              1.5 * m.hand,
              "mm",
            ),
          );
          verdicts.push({
            name: "feet three half shoulder widths apart",
            passed: width(mid) >= 3 * m.shoulderHalfWidth,
            detail: `${(width(mid) * 1000).toFixed(1)} mm`,
          });
          break;
        }
        case "splitStep": {
          const peak: number = (strokeStart + stroke) / 2;
          const bones = performance.bones("a", peak);
          let low: number = Infinity;
          for (const side of ["left", "right"] as const)
            for (const s of HumanFoot.sockets(body, bones, side))
              low = Math.min(low, s.point.y);
          verdicts.push({
            name: "both soles off the floor at the hop's peak",
            passed: low > 0.005,
            detail: `${(low * 1000).toFixed(1)} mm`,
          });
          let deepest: number = Infinity;
          for (let t: number = 0; t <= performance.duration + 1e-9; t += 1 / 96)
            deepest = Math.min(
              deepest,
              HumanColliders.lowest(body, performance.bones("a", t)),
            );
          verdicts.push(
            everydayVerdicts.within(
              "deepest point below the floor",
              Math.max(0, -deepest),
              0.01,
              "mm",
            ),
          );
          const gained: number = width(strokeEnd) - width(strokeStart);
          verdicts.push({
            name: "stance wider after the landing",
            passed: gained >= 0.8 * m.shoulderHalfWidth,
            detail: `${(gained * 1000).toFixed(1)} mm`,
          });
          break;
        }
        case "golfAddress": {
          const mid: number = ready;
          const trunk: IAutoMovieVector3 = Vector3.subtract(
            at(mid, "neck"),
            at(mid, "hips"),
          );
          const lean: number =
            (Math.acos(trunk.y / Vector3.length(trunk)) * 180) / Math.PI;
          verdicts.push({
            name: "trunk 25 to 45 deg from the vertical",
            passed: lean >= 25 && lean <= 45,
            detail: `${lean.toFixed(1)} deg`,
          });
          const shoulders: IAutoMovieVector3 = Vector3.scale(
            Vector3.add(at(mid, "leftUpperArm"), at(mid, "rightUpperArm")),
            0.5,
          );
          const hands: IAutoMovieVector3 = Vector3.scale(
            Vector3.add(at(mid, "leftHand"), at(mid, "rightHand")),
            0.5,
          );
          verdicts.push(
            everydayVerdicts.within(
              "hands off the line under the shoulders",
              Math.hypot(hands.x - shoulders.x, hands.z - shoulders.z),
              0.1,
              "mm",
            ),
          );
          let waggles: number = 0;
          let prev: number = at(strokeStart, "rightHand").z;
          let rising: boolean = false;
          for (
            let t: number = strokeStart + 1 / 96;
            t <= strokeEnd + 1e-9;
            t += 1 / 96
          ) {
            const z: number = at(t, "rightHand").z;
            if (z > prev) rising = true;
            else if (rising && z < prev) {
              waggles++;
              rising = false;
            }
            prev = z;
          }
          verdicts.push({
            name: "two waggles",
            passed: waggles === 2,
            detail: `${waggles} forward extremes`,
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
