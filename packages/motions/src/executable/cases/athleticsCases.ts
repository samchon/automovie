
import { AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanSide, AutoMovieHumanoidBone, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPerformance, IAutoMovieResolveCenterOfMass, IAutoMovieResolvedBone, IAutoMovieVector3 } from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import { AutoMovieMotionHumanBody } from "../../body/AutoMovieMotionHumanBody";
import { AutoMovieMotionHumanTouchEffector } from "../../compose/AutoMovieMotionHumanTouchEffector";
import { HumanPerformance } from "../../perform/HumanPerformance";
import { athletics } from "../../sport/internal/athletics";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { MotionBodies } from "../MotionBodies";
import type { humanPolygonMan } from "../internal/humanPolygonMan";
import { FamilyCaseKit } from "./FamilyCaseKit";
import { StanceVerdicts } from "./StanceVerdicts";
import { TouchVerdicts } from "./TouchVerdicts";
import { everydayVerdicts } from "./internal/everydayVerdicts";

/**
 * Capture case of the sprint start: `athletics-set`, the crouch from quiet
 * standing into the set position, held 1.5 s to the gun.
 *
 * It reports foot slip at most 5 mm in the set (the issue's block contact bound
 * before block clearance) and no range-of-motion overshoot; through the hold,
 * the front knee's included angle within 10 degrees of 90 and the rear knee's
 * within one standard deviation (11 degrees) of 117 (Cavedon et al. 2019, table
 * 2, anthropometry-driven setting). Both palms stay within 10 mm of the floor,
 * and the centre of mass stays 22.9 cm behind the line within the limb fit's 1
 * mm (Slawinski et al. 2010, as Valamatos et al. 2022, section 4.1.2, report
 * it). The block settings determine hip height; it is not a fixed level
 * relative to the shoulders.
 *
 * @param bodies The bodies; `m-average` when absent.
 * @returns The cases.
 */
export function athleticsCases(
  bodies: readonly string[] = ["m-average"],
): IMotionCaptureCase[] {
  const out: IMotionCaptureCase[] = [];
  for (const id of bodies) {
    const man: humanPolygonMan.IPolygonMan = MotionBodies.population(id);
    const body: IAutoMovieMotionHumanBody = AutoMovieMotionHumanBody.create(
      man.body.skeleton,
      man.body.profile,
    );
    const name: string = `athletics-set${bodies.length === 1 ? "" : `-${id}`}`;
    let performance: IAutoMovieMotionHumanPerformance;

    // Process boundary: a case that throws is reported as that case's refusal, and the remaining cases still run.
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
      out.push(FamilyCaseKit.refused(name, error));
      continue;
    }
    const set: number = TouchVerdicts.event(performance, "a", "set");
    const gun: number = TouchVerdicts.event(performance, "a", "gun");
    const window: number[] = [];
    for (let t: number = set; t <= gun + 1e-9; t += 1 / 24) window.push(t);
    const mass: IAutoMovieResolveCenterOfMass.IModel =
      AutoMovieEngineKinematics.resolveAutoMovieCenterOfMass(body.skeleton, body.profile);
    const knee = (
      side: AutoMovieHumanSide,
      want: number,
      limit: number,
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
        limit,
        "deg",
      );
    const palm = { surface: "palm", shape: "flat" } as const;
    const verdicts: IMotionCaptureCase.IVerdict[] = [
      ...everydayVerdicts.standard(performance, "a", body),
      knee("left", athletics.FRONT, 10),
      knee("right", 117, 11),
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
        "centre of mass behind the start line",
        (t: number): number => {
          const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
            performance.bones("a", t);
          const centre: IAutoMovieVector3 = AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPlace(
            mass,
            bones,
          );
          return Math.abs(
            body.measure.footLength - centre.z - athletics.CENTRE.male,
          );
        },
        window,
        0.001,
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
