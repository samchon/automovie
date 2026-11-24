import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanMartialArt,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import { createHumanBody } from "../../body/createHumanBody";
import { AutoMovieMotionHumanTouchEffector } from "../../compose/AutoMovieMotionHumanTouchEffector";
import { HumanPerformance } from "../../perform/HumanPerformance";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { MotionBodies } from "../MotionBodies";
import type { humanPolygonMan } from "../humanPolygonMan";
import { FamilyCaseKit } from "./FamilyCaseKit";
import { StanceVerdicts } from "./StanceVerdicts";
import { TouchVerdicts } from "./TouchVerdicts";
import { everydayVerdicts } from "./everydayVerdicts";

/** The record of `IMartialArtCasesPeaksItem`'s site. */
type IMartialArtCasesPeaksItem = {
  t: number;
  side: AutoMovieHumanSide;
  reach: number;
};

/**
 * Capture cases of the martial-art techniques from quiet standing.
 *
 * Every case reports foot slip at most 5 mm (the issue's stance contacts) and
 * no range-of-motion overshoot. Beyond that:
 *
 * - `martial-horseStance`: the feet within 20 mm of two shoulder widths apart and
 *   both knees bent below 165 degrees in the hold;
 * - `martial-chokuZuki`: four punches counted as fist extensions, each fist at
 *   least 0.85 of its arm's reach from its shoulder at its peak, and each peak
 *   within 400 ms of its punch's start (VencesBrito et al. 2011);
 * - `martial-taiChiPush`: the palms at least 0.6 of the arm ahead of their
 *   shoulders at the push's end, and no palm faster than 0.5 m/s (provisional
 *   bound for the slow, continuous form).
 *
 * @param bodies The bodies; `m-average` when absent.
 * @returns The cases.
 */
export function martialArtCases(
  bodies: readonly string[] = ["m-average"],
): IMotionCaptureCase[] {
  const out: IMotionCaptureCase[] = [];
  for (const id of bodies) {
    const man: humanPolygonMan.IPolygonMan = MotionBodies.population(id);
    const body: IAutoMovieMotionHumanBody = createHumanBody(
      man.body.skeleton,
      man.body.profile,
    );
    const m = body.measure;
    const suffix: string = bodies.length === 1 ? "" : `-${id}`;
    for (const kind of [
      "horseStance",
      "chokuZuki",
      "taiChiPush",
    ] as const satisfies readonly IAutoMovieMotionHumanMartialArt.Kind[]) {
      const name: string = `martial-${kind}${suffix}`;
      let performance: IAutoMovieMotionHumanPerformance;

      // Process boundary: a case that throws is reported as that case's refusal, and the remaining cases still run.
      try {
        performance = new HumanPerformance({
          seed: "martial",
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" as const },
            },
          ],
          composition: HumanChain.subject("a").act("martialArt", { kind }).node,
        });
      } catch (error) {
        out.push(FamilyCaseKit.refused(name, error));
        continue;
      }
      const ready: number = TouchVerdicts.event(performance, "a", "ready");
      const relax: number = TouchVerdicts.event(performance, "a", "relax");
      const mid: number = (ready + relax) / 2;
      const at = (t: number, bone: AutoMovieHumanoidBone): IAutoMovieVector3 =>
        performance.bones("a", t).get(bone)!.worldPosition;
      const verdicts: IMotionCaptureCase.IVerdict[] = [
        ...everydayVerdicts.standard(performance, "a", body),
      ];
      const arm: number = m.upperArm + m.forearm;
      switch (kind) {
        case "horseStance": {
          const apart: number = Math.abs(
            at(mid, "leftFoot").x - at(mid, "rightFoot").x,
          );
          verdicts.push(
            everydayVerdicts.within(
              "feet off two shoulder widths apart",
              Math.abs(apart - 4 * m.shoulderHalfWidth),
              0.02,
              "mm",
            ),
          );
          for (const side of ["left", "right"] as const) {
            const knee: number = StanceVerdicts.included(
              performance,
              "a",
              `${side}UpperLeg`,
              `${side}LowerLeg`,
              `${side}Foot`,
              mid,
            );
            verdicts.push({
              name: `${side} knee bent below 165 deg`,
              passed: knee < 165,
              detail: `${knee.toFixed(1)} deg`,
            });
          }
          break;
        }
        case "chokuZuki": {
          const fist = { surface: "fist", shape: "fist" } as const;
          const reach = (t: number, side: AutoMovieHumanSide): number =>
            Vector3.length(
              Vector3.subtract(
                AutoMovieMotionHumanTouchEffector.point(
                  body,
                  performance.bones("a", t),
                  side,
                  fist,
                ),
                at(t, `${side}UpperArm`),
              ),
            );
          const peaks: IMartialArtCasesPeaksItem[] = [];
          for (const side of ["left", "right"] as const) {
            const grid: number[] = [];
            for (let t: number = ready; t <= relax + 1e-9; t += 1 / 96)
              grid.push(t);
            const v: number[] = grid.map((t: number): number => reach(t, side));
            for (let i: number = 1; i + 1 < v.length; i++)
              if (v[i]! > v[i - 1]! && v[i]! >= v[i + 1]! && v[i]! > 0.6 * arm)
                peaks.push({ t: grid[i]!, side, reach: v[i]! });
          }
          peaks.sort((a, b) => a.t - b.t);
          verdicts.push({
            name: "four punches",
            passed: peaks.length === 4,
            detail: `${peaks.length} fist extensions`,
          });
          const short: number = Math.max(
            0,
            ...peaks.map((p) => 0.85 * arm - p.reach),
          );
          verdicts.push(
            everydayVerdicts.within(
              "fist short of 0.85 reach at its peak",
              short,
              0,
              "mm",
            ),
          );
          const late: number = Math.max(
            0,
            ...peaks.map((p, i) => p.t - (ready + 2 * i * 0.2)),
          );
          verdicts.push({
            name: "each punch peaks within 400 ms of its start",
            passed: peaks.length > 0 && late <= 0.4,
            detail: `${(late * 1000).toFixed(0)} ms worst`,
          });
          break;
        }
        case "taiChiPush": {
          const end: number = TouchVerdicts.event(performance, "a", "stroke");
          const palm = { surface: "palm", shape: "flat" } as const;
          let ahead: number = Infinity;
          for (const side of ["left", "right"] as const) {
            const p: IAutoMovieVector3 =
              AutoMovieMotionHumanTouchEffector.point(
                body,
                performance.bones("a", end),
                side,
                palm,
              );
            ahead = Math.min(ahead, p.z - at(end, `${side}UpperArm`).z);
          }
          verdicts.push({
            name: "palms 0.6 arm ahead of the shoulders at the push's end",
            passed: ahead >= 0.6 * arm,
            detail: `${(ahead * 1000).toFixed(1)} mm (want ${(0.6 * arm * 1000).toFixed(1)} mm)`,
          });
          let fastest: number = 0;
          for (const side of ["left", "right"] as const)
            for (
              let t: number = 0;
              t + 1 / 24 <= performance.duration;
              t += 1 / 24
            ) {
              const a = AutoMovieMotionHumanTouchEffector.point(
                body,
                performance.bones("a", t),
                side,
                palm,
              );
              const b = AutoMovieMotionHumanTouchEffector.point(
                body,
                performance.bones("a", t + 1 / 24),
                side,
                palm,
              );
              fastest = Math.max(
                fastest,
                Vector3.length(Vector3.subtract(b, a)) * 24,
              );
            }
          verdicts.push({
            name: "palms no faster than 0.5 m/s",
            passed: fastest <= 0.5,
            detail: `${fastest.toFixed(2)} m/s`,
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
