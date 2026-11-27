import { AutoMovieEngineKinematics, Vector3, AutoMovieEngineMath } from "@automovie/engine";
import type { AutoMovieHumanSide, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPerformance, IAutoMovieVector3 } from "@automovie/interface";

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
 * Capture case of the handstand: `gymnastics-handstand`, kicked up from quiet
 * standing, held 2 s and stepped down.
 *
 * It reports foot slip at most 5 mm and no range-of-motion overshoot, the
 * issue's hand slip at most 5 mm from `handsDown` to `release`, and through the
 * hold: both palms within 10 mm of the floor, each wrist within 5 cm
 * horizontally of its shoulder (the stacked handstand), the hips above the
 * shoulders and the ankles above the hips, and the centre of mass within half a
 * hand of the line between the hands (balanced over the hands).
 * Parameter bodies: The bodies; `m-average` when absent.
 * Returns: The cases.
 */
export function gymnasticsCases(
  bodies: readonly string[] = ["m-average"],
): IMotionCaptureCase[] {
  const out: IMotionCaptureCase[] = [];
  for (const id of bodies) {
    const man: humanPolygonMan.IPolygonMan = MotionBodies.population(id);
    const body: IAutoMovieMotionHumanBody = AutoMovieMotionHumanBody.create(
      man.body.skeleton,
      man.body.profile,
    );
    const name: string = `gymnastics-handstand${bodies.length === 1 ? "" : `-${id}`}`;
    let performance: IAutoMovieMotionHumanPerformance;

    // Process boundary: a case that throws is reported as that case's refusal, and the remaining cases still run.
    try {
      performance = new AutoMovieMotionHumanPerformance({
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
        composition: AutoMovieMotionHumanChain.subject("a").act("gymnastics", {}).node,
      });
    } catch (error) {
      out.push(FamilyCaseKit.refused(name, error));
      continue;
    }
    const down: number = TouchVerdicts.event(performance, "a", "handsDown");
    const inverted: number = TouchVerdicts.event(performance, "a", "inverted");
    const release: number = TouchVerdicts.event(performance, "a", "release");
    const palm = { surface: "palm", shape: "flat" } as const;
    const palmAt = (t: number, side: AutoMovieHumanSide): IAutoMovieVector3 =>
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
    const model = AutoMovieEngineKinematics.resolveAutoMovieCenterOfMass(body.skeleton, body.profile);
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
          const com: IAutoMovieVector3 = AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPlace(
            model,
            performance.bones("a", t),
          );
          const a: IAutoMovieVector3 = { ...palmAt(t, "left"), y: 0 };
          const b: IAutoMovieVector3 = { ...palmAt(t, "right"), y: 0 };
          const floor: IAutoMovieVector3 = { ...com, y: 0 };
          return AutoMovieEngineMath.closestPointsBetweenSegments(a, b, floor, floor).distance;
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
