import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import type { IHumanBody } from "../../body/IHumanBody";
import { createHumanBody } from "../../body/createHumanBody";
import { HumanPerformance } from "../../perform/HumanPerformance";
import type { swim } from "../../sport/swim";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { MotionBodies } from "../MotionBodies";
import type { humanPolygonMan } from "../humanPolygonMan";
import { TouchVerdicts } from "./TouchVerdicts";
import { everydayVerdicts } from "./everydayVerdicts";

/**
 * Capture cases of swimming (#3254) on a water plane at 1.2 m, drawn as a
 * thin box, three cycles each.
 *
 * Every case reports no range-of-motion overshoot. Beyond that (the M25
 * acceptance):
 *
 * - `swim-treadWater`: the mouth above the plane throughout;
 * - `swim-frontCrawl`: each hand entering ahead of its shoulder by at least
 *   0.3 of the arm along the swim, the mouth above the plane at each
 *   `breath`, and the cycle periodic: the right wrist's place relative to
 *   the hips the same within 10 mm at each cycle's start.
 *
 * @param bodies The bodies; `m-average` when absent.
 * @returns The cases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists every case and every verdict with its bound and source.
 * @evidence contracts/development/implementation.md#principled-implementation Runs the real performance and measures displayed bones and the mouth region against the plane.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One performance per stroke, one verdict block per stroke.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads displayed poses, never the law's curves; a refused plan becomes a failing verdict.
 * @evidence contracts/development/implementation.md#efficient-algorithms One performance per case.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
export function swimCases(
  bodies: readonly string[] = ["m-average"],
): IMotionCaptureCase[] {
  const out: IMotionCaptureCase[] = [];
  const water: number = 1.2;
  for (const id of bodies) {
    const man: humanPolygonMan.IPolygonMan = MotionBodies.population(id);
    const body: IHumanBody = createHumanBody(
      man.body.skeleton,
      man.body.profile,
    );
    const m = body.measure;
    const suffix: string = bodies.length === 1 ? "" : `-${id}`;
    for (const kind of ["treadWater", "frontCrawl"] as swim.Kind[]) {
      const name: string = `swim-${kind}${suffix}`;
      let performance: HumanPerformance;
      try {
        performance = new HumanPerformance({
          seed: "swim",
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" as const },
            },
          ],
          composition: HumanChain.subject("a").act("swim", {
            kind,
            water,
            cycles: 3,
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
      const at = (t: number, bone: string): IAutoMovieVector3 =>
        performance.bones("a", t).get(bone as never)!.worldPosition;
      const mouth = (t: number): number =>
        TouchVerdicts.place(
          performance,
          { subject: "a", body, region: "mouth" },
          t,
        ).point.y;
      const verdicts: IMotionCaptureCase.IVerdict[] = [
        everydayVerdicts.within(
          "a ROM overshoot",
          everydayVerdicts.overshoot(performance, "a"),
          1e-6,
          "deg",
        ),
      ];
      const named: [number, string][] = [];
      if (kind === "treadWater") {
        let low: number = Infinity;
        for (let t: number = 0; t <= performance.duration + 1e-9; t += 1 / 24)
          low = Math.min(low, mouth(t) - water);
        verdicts.push({
          name: "mouth above the plane throughout",
          passed: low > 0,
          detail: `${(low * 1000).toFixed(1)} mm above at its lowest`,
        });
      } else {
        const arm: number = m.upperArm + m.forearm;
        let shortest: number = Infinity;
        let lowest: number = Infinity;
        const starts: number[] = [];
        for (let i: number = 1; i <= 3; i++) {
          for (const side of ["Right", "Left"] as const) {
            const t: number = TouchVerdicts.event(
              performance,
              "a",
              `entry${side}${i}`,
            );
            named.push([t, `entry${side}${i}`]);
            const lower: "left" | "right" = side === "Right" ? "right" : "left";
            shortest = Math.min(
              shortest,
              at(t, `${lower}Hand`).z - at(t, `${lower}UpperArm`).z,
            );
            if (side === "Right") starts.push(t);
          }
          const b: number = TouchVerdicts.event(performance, "a", `breath${i}`);
          named.push([b, `breath${i}`]);
          lowest = Math.min(lowest, mouth(b) - water);
        }
        verdicts.push(
          {
            name: "each hand enters 0.3 arm ahead of its shoulder",
            passed: shortest >= 0.3 * arm,
            detail: `${(shortest * 1000).toFixed(1)} mm (want ${(0.3 * arm * 1000).toFixed(1)} mm)`,
          },
          {
            name: "mouth above the plane at each breath",
            passed: lowest > 0,
            detail: `${(lowest * 1000).toFixed(1)} mm above at the lowest breath`,
          },
        );
        const relative = (t: number): IAutoMovieVector3 =>
          Vector3.subtract(at(t, "rightHand"), at(t, "hips"));
        let drift: number = 0;
        for (const t of starts.slice(1))
          drift = Math.max(
            drift,
            Vector3.length(Vector3.subtract(relative(t), relative(starts[0]!))),
          );
        verdicts.push(
          everydayVerdicts.within(
            "right wrist periodic at each cycle's start",
            drift,
            0.01,
            "mm",
          ),
        );
      }
      out.push({
        name,
        times: TouchVerdicts.times(performance.duration, 0.1, named),
        performers: [TouchVerdicts.figure(performance, "a", man)],
        boxes: [
          {
            centre: { x: 0, y: water - 0.002, z: 2 },
            half: { x: 2, y: 0.002, z: 4 },
            color: 0x4080c0,
          },
        ],
        verdicts,
      });
    }
  }
  return out;
}
