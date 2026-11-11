import {
  Vector3,
  closestPointsBetweenSegments,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import type { IHumanBody } from "../../body/IHumanBody";
import { createHumanBody } from "../../body/createHumanBody";
import { AutoMovieMotionHumanTouchEffector } from "../../compose/AutoMovieMotionHumanTouchEffector";
import { HumanPerformance } from "../../perform/HumanPerformance";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { MotionBodies } from "../MotionBodies";
import type { humanPolygonMan } from "../humanPolygonMan";
import { TouchVerdicts } from "./TouchVerdicts";
import { everydayVerdicts } from "./everydayVerdicts";

/**
 * Capture case of the handstand (#3251): `gymnastics-handstand`, kicked up
 * from quiet standing, held 2 s and stepped down.
 *
 * It reports foot slip at most 5 mm and no range-of-motion overshoot, the
 * issue's hand slip at most 5 mm from `handsDown` to `release`, and through
 * the hold: both palms within 10 mm of the floor, each wrist within 5 cm
 * horizontally of its shoulder (the stacked handstand), the hips above the
 * shoulders and the ankles above the hips, and the centre of mass within
 * half a hand of the line between the hands (balanced over the hands).
 *
 * @param bodies The bodies; `m-average` when absent.
 * @returns The cases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the case and every verdict with its bound and source.
 * @evidence contracts/development/implementation.md#principled-implementation Runs the real performance and measures displayed bones and the engine's centre of mass.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One performance and one verdict block per body.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads displayed poses, never the law's goals; a refused plan becomes a failing verdict.
 * @evidence contracts/development/implementation.md#efficient-algorithms One performance per body.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
export function gymnasticsCases(
  bodies: readonly string[] = ["m-average"],
): IMotionCaptureCase[] {
  const out: IMotionCaptureCase[] = [];
  for (const id of bodies) {
    const man: humanPolygonMan.IPolygonMan = MotionBodies.population(id);
    const body: IHumanBody = createHumanBody(
      man.body.skeleton,
      man.body.profile,
    );
    const name: string = `gymnastics-handstand${bodies.length === 1 ? "" : `-${id}`}`;
    let performance: HumanPerformance;
    try {
      performance = new HumanPerformance({
        seed: "gymnastics",
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" as const },
          },
        ],
        composition: HumanChain.subject("a").act("gymnastics", {}).node,
      });
    } catch (error) {
      out.push({
        name,
        times: [{ seconds: 0, label: "refused" }],
        performers: [],
        verdicts: [
          { name: "planned", passed: false, detail: (error as Error).message },
        ],
      });
      continue;
    }
    const down: number = TouchVerdicts.event(performance, "a", "handsDown");
    const inverted: number = TouchVerdicts.event(performance, "a", "inverted");
    const release: number = TouchVerdicts.event(performance, "a", "release");
    const palm = { surface: "palm", shape: "flat" } as const;
    const palmAt = (t: number, side: "left" | "right"): IAutoMovieVector3 =>
      AutoMovieMotionHumanTouchEffector.point(
        body,
        performance.bones("a", t),
        side,
        palm,
      );
    const hold: number[] = [];
    for (let t: number = inverted; t <= release + 1e-9; t += 1 / 24)
      hold.push(t);
    const contact: number[] = [];
    for (let t: number = down; t <= release + 1e-9; t += 1 / 24)
      contact.push(t);
    const verdicts: IMotionCaptureCase.IVerdict[] = [
      ...everydayVerdicts.standard(performance, "a", body),
    ];
    const model = resolveAutoMovieCenterOfMass(body.skeleton, body.profile);
    for (const side of ["left", "right"] as const) {
      const first: IAutoMovieVector3 = palmAt(down, side);
      verdicts.push(
        TouchVerdicts.within(
          `${side} hand slip`,
          (t: number): number =>
            Vector3.length(Vector3.subtract(palmAt(t, side), first)),
          contact,
          0.005,
        ),
        TouchVerdicts.within(
          `${side} palm on the floor`,
          (t: number): number =>
            Math.abs(
              palmAt(t, side).y -
                AutoMovieMotionHumanTouchEffector.pad(body, side, palm),
            ),
          hold,
          0.01,
        ),
        TouchVerdicts.within(
          `${side} wrist under its shoulder`,
          (t: number): number => {
            const bones = performance.bones("a", t);
            const w: IAutoMovieVector3 = bones.get(
              `${side}Hand`,
            )!.worldPosition;
            const s: IAutoMovieVector3 = bones.get(
              `${side}UpperArm`,
            )!.worldPosition;
            return Math.hypot(w.x - s.x, w.z - s.z);
          },
          hold,
          0.05,
        ),
      );
    }
    const mid: number = (inverted + release) / 2;
    const bones = performance.bones("a", mid);
    const shoulders: number =
      (bones.get("leftUpperArm")!.worldPosition.y +
        bones.get("rightUpperArm")!.worldPosition.y) /
      2;
    const hips: number = bones.get("hips")!.worldPosition.y;
    const ankles: number = Math.min(
      bones.get("leftFoot")!.worldPosition.y,
      bones.get("rightFoot")!.worldPosition.y,
    );
    verdicts.push(
      {
        name: "hips above the shoulders",
        passed: hips > shoulders,
        detail: `${((hips - shoulders) * 1000).toFixed(1)} mm`,
      },
      {
        name: "ankles above the hips",
        passed: ankles > hips,
        detail: `${((ankles - hips) * 1000).toFixed(1)} mm`,
      },
      TouchVerdicts.within(
        "centre of mass over the hands",
        (t: number): number => {
          const com: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(
            model,
            performance.bones("a", t),
          );
          const a: IAutoMovieVector3 = { ...palmAt(t, "left"), y: 0 };
          const b: IAutoMovieVector3 = { ...palmAt(t, "right"), y: 0 };
          const floor: IAutoMovieVector3 = { ...com, y: 0 };
          return closestPointsBetweenSegments(a, b, floor, floor).distance;
        },
        hold,
        body.measure.hand / 2,
      ),
    );
    out.push({
      name,
      times: TouchVerdicts.times(performance.duration, 0.125, [
        [down, "handsDown"],
        [inverted, "inverted"],
        [release, "release"],
      ]),
      performers: [TouchVerdicts.figure(performance, "a", man)],
      verdicts,
    });
  }
  return out;
}
