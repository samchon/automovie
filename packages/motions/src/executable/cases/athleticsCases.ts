import { HumanChain } from "../../HumanChain";
import type { IHumanBody } from "../../body/IHumanBody";
import { createHumanBody } from "../../body/createHumanBody";
import { AutoMovieMotionHumanTouchEffector } from "../../compose/AutoMovieMotionHumanTouchEffector";
import { HumanPerformance } from "../../perform/HumanPerformance";
import { athletics } from "../../sport/athletics";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { MotionBodies } from "../MotionBodies";
import type { humanPolygonMan } from "../humanPolygonMan";
import { StanceVerdicts } from "./StanceVerdicts";
import { TouchVerdicts } from "./TouchVerdicts";
import { everydayVerdicts } from "./everydayVerdicts";

/**
 * Capture case of the sprint start (#3250): `athletics-set`, the crouch
 * from quiet standing into the set position, held 1.5 s to the gun.
 *
 * It reports foot slip at most 5 mm in the set (the issue's block contact
 * bound before block clearance) and no range-of-motion overshoot; through
 * the hold, the front knee's included angle within 10 degrees of 90 and the
 * rear knee's within 10 degrees of 130 (Harland and Steele 1997), both
 * palms within 10 mm of the floor, and the hips within 5 cm of the
 * shoulders' height (the law's declared level hips).
 *
 * @param bodies The bodies; `m-average` when absent.
 * @returns The cases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the case and every verdict with its bound and source.
 * @evidence contracts/development/implementation.md#principled-implementation Runs the real performance and measures displayed bones.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One performance and one verdict block per body.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads displayed poses, never the law's goals; a refused plan becomes a failing verdict.
 * @evidence contracts/development/implementation.md#efficient-algorithms One performance per body.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
export function athleticsCases(
  bodies: readonly string[] = ["m-average"],
): IMotionCaptureCase[] {
  const out: IMotionCaptureCase[] = [];
  for (const id of bodies) {
    const man: humanPolygonMan.IPolygonMan = MotionBodies.population(id);
    const body: IHumanBody = createHumanBody(
      man.body.skeleton,
      man.body.profile,
    );
    const name: string = `athletics-set${bodies.length === 1 ? "" : `-${id}`}`;
    let performance: HumanPerformance;
    try {
      performance = new HumanPerformance({
        seed: "athletics",
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" as const },
          },
        ],
        composition: HumanChain.subject("a").act("athletics", {}).node,
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
    const set: number = TouchVerdicts.event(performance, "a", "set");
    const gun: number = TouchVerdicts.event(performance, "a", "gun");
    const window: number[] = [];
    for (let t: number = set; t <= gun + 1e-9; t += 1 / 24) window.push(t);
    const knee = (
      side: "left" | "right",
      want: number,
    ): IMotionCaptureCase.IVerdict =>
      everydayVerdicts.within(
        `${side} knee's included angle off ${want} deg through the set`,
        Math.max(
          ...window.map((t: number): number =>
            Math.abs(
              StanceVerdicts.included(
                performance,
                "a",
                `${side}UpperLeg`,
                `${side}LowerLeg`,
                `${side}Foot`,
                t,
              ) - want,
            ),
          ),
        ),
        10,
        "deg",
      );
    const palm = { surface: "palm", shape: "flat" } as const;
    const verdicts: IMotionCaptureCase.IVerdict[] = [
      ...everydayVerdicts.standard(performance, "a", body),
      knee("left", athletics.FRONT),
      knee("right", athletics.REAR),
    ];
    for (const side of ["left", "right"] as const)
      verdicts.push(
        TouchVerdicts.within(
          `${side} palm on the floor`,
          (t: number): number =>
            Math.abs(
              AutoMovieMotionHumanTouchEffector.point(
                body,
                performance.bones("a", t),
                side,
                palm,
              ).y - AutoMovieMotionHumanTouchEffector.pad(body, side, palm),
            ),
          window,
          0.01,
        ),
      );
    verdicts.push(
      TouchVerdicts.within(
        "hips level with the shoulders",
        (t: number): number => {
          const bones = performance.bones("a", t);
          const shoulders: number =
            (bones.get("leftUpperArm")!.worldPosition.y +
              bones.get("rightUpperArm")!.worldPosition.y) /
            2;
          return Math.abs(bones.get("hips")!.worldPosition.y - shoulders);
        },
        window,
        0.05,
      ),
    );
    out.push({
      name,
      times: TouchVerdicts.times(performance.duration, 0.125, [
        [set, "set"],
        [gun, "gun"],
      ]),
      performers: [TouchVerdicts.figure(performance, "a", man)],
      verdicts,
    });
  }
  return out;
}
