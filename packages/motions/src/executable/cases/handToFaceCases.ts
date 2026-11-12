import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieJointPose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanChain } from "../../HumanChain";
import type { IHumanBody } from "../../body/IHumanBody";
import { createHumanBody } from "../../body/createHumanBody";
import { AutoMovieMotionHumanTouchEffector } from "../../compose/AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionHumanTouchForm } from "../../compose/AutoMovieMotionHumanTouchForm";
import { handToFace } from "../../daily/handToFace";
import { HumanPerformance } from "../../perform/HumanPerformance";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { MotionBodies } from "../MotionBodies";
import type { humanPolygonMan } from "../humanPolygonMan";
import { TouchVerdicts } from "./TouchVerdicts";
import { everydayVerdicts } from "./everydayVerdicts";

/**
 * Capture cases of the hand-to-face tasks (#3234) on the polygon man, one
 * per task, standing from quiet standing with the right hand.
 *
 * Every case reports foot slip at most 5 mm and no range-of-motion
 * overshoot (`everydayVerdicts.standard`), and the acting forearm never
 * deeper than 10 mm into the rest of the body (decision 11). Beyond that:
 *
 * - a task that holds still at the face (drink, sip, eat, bite, phone):
 *   the tool's tip within 15 mm of its region from the arrival to the
 *   leave, the issue's acceptance for the rim at the mouth;
 * - a task that strokes at the face (brushing, combing, washing, wiping):
 *   the tip within 10 mm of the region's surface along its normal over the
 *   strokes;
 * - drinking: the cup's axis (the fist's grasp axis) within 10 degrees of vertical at
 *   `atMouth` (the level container of Mayer and Krechetnikov 2012 before a
 *   sip tilts it);
 * - reading: the sheet between 17.5 and 58 cm from the eyes (Bababekova et
 *   al. 2011's range for text) and the neck's and head's flexion from the
 *   upright entry between 33 and 45 degrees at `atSheet` (Lee et al. 2015).
 *
 * @param bodies The bodies; `m-average` when absent.
 * @returns The cases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the cases and every verdict with its bound and source.
 * @evidence contracts/development/implementation.md#principled-implementation Runs the real performance and measures the displayed bones through the touch effector's point and the engine's region placement.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One performance per task and body, then one verdict block per task family.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads the displayed pose, not the law's goals; a refused plan becomes a failing verdict instead of a crash.
 * @evidence contracts/development/implementation.md#efficient-algorithms One performance per task and body.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per run.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Plain data.
 */
export function handToFaceCases(
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
    for (const task of Object.keys(handToFace.ROWS) as handToFace.Task[]) {
      const row: handToFace.IRow = handToFace.ROWS[task];
      let performance: HumanPerformance;
      try {
        performance = perform(
          body,
          HumanChain.subject("a").act("handToFace", { task }),
        );
      } catch (error) {
        out.push({
          name: `hand-face-${task}${suffix}`,
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
      const strokeEnd: number = TouchVerdicts.event(
        performance,
        "a",
        "strokeEnd",
      );
      const relax: number = TouchVerdicts.event(performance, "a", "relax");
      const window: number[] = [];
      for (let t: number = ready; t <= relax + 1e-9; t += 1 / 24)
        window.push(t);
      const verdicts: IMotionCaptureCase.IVerdict[] = [
        ...everydayVerdicts.standard(performance, "a", body),
      ];
      const entered = TouchVerdicts.entry(
        performance,
        "a",
        body,
        "right",
        { subject: "a", body },
        0,
        performance.duration,
      );
      verdicts.push({
        name: "right forearm inside the body",
        passed: entered.gap >= -0.01,
        detail: `${(entered.gap * 1000).toFixed(1)} mm at ${entered.at.toFixed(2)} s (limit -10.0 mm)`,
      });

      if (row.region !== null) {
        const region: TouchVerdicts.IRegion = {
          subject: "a",
          body,
          region: row.region,
        };
        const standoff: number = AutoMovieMotionHumanTouchEffector.pad(
          body,
          "right",
          row.effector,
        );
        if (AutoMovieMotionHumanTouchForm.FORMS[row.kind].travel === 0)
          verdicts.push(
            TouchVerdicts.within(
              `tip on the ${row.region} from arrival to leave`,
              (t: number): number =>
                TouchVerdicts.miss(
                  performance,
                  "a",
                  body,
                  "right",
                  row.effector,
                  region,
                  standoff,
                  t,
                ),
              window,
              0.015,
            ),
          );
        else
          verdicts.push(
            TouchVerdicts.within(
              `tip on the ${row.region}'s surface over the strokes`,
              (t: number): number =>
                Math.abs(
                  TouchVerdicts.off(
                    performance,
                    "a",
                    body,
                    "right",
                    row.effector,
                    region,
                    standoff,
                    t,
                  ),
                ),
              window,
              0.01,
            ),
          );
      }
      if (task === "drink") {
        const at: number = TouchVerdicts.event(performance, "a", "atMouth");
        const hand = performance.bones("a", at).get("rightHand")!;
        // The cup's axis is the axis of the cylinder the fist holds.
        const cup: IAutoMovieVector3 = Vector3.normalize(
          Quaternion.rotateVector(
            hand.worldRotation,
            AutoMovieMotionHumanTouchEffector.axis("right", "grasp"),
          ),
        );
        const tilt: number = (Math.acos(Math.min(1, cup.y)) * 180) / Math.PI;
        verdicts.push(
          everydayVerdicts.within(
            "cup axis off vertical at atMouth",
            tilt,
            10,
            "deg",
          ),
        );
      }
      if (task === "read") {
        const at: number = TouchVerdicts.event(performance, "a", "atSheet");
        const bones = performance.bones("a", at);
        const eyes: IAutoMovieVector3 = Vector3.scale(
          Vector3.add(
            bones.get("leftEye")!.worldPosition,
            bones.get("rightEye")!.worldPosition,
          ),
          0.5,
        );
        const sheet: IAutoMovieVector3 =
          AutoMovieMotionHumanTouchEffector.point(
            body,
            bones,
            "right",
            row.effector,
          );
        const distance: number = Vector3.length(Vector3.subtract(sheet, eyes));
        verdicts.push({
          name: "sheet 17.5 to 58 cm from the eyes at atSheet",
          passed: distance >= 0.175 && distance <= 0.58,
          detail: `${(distance * 100).toFixed(1)} cm`,
        });
        // Lee et al. measure the flexion from the upright stance, which is
        // the entry here.
        let flexion: number = 0;
        for (const [seconds, sign] of [
          [at, 1],
          [0, -1],
        ] as const)
          for (const joint of performance.pose("a", seconds)
            .joints as IAutoMovieJointPose[])
            if (joint.bone === "neck" || joint.bone === "head")
              flexion += sign * (joint.flexion ?? 0);
        verdicts.push({
          name: "neck and head flexion 33 to 45 deg at atSheet",
          passed: flexion >= 33 && flexion <= 45,
          detail: `${flexion.toFixed(1)} deg`,
        });
      }
      out.push({
        name: `hand-face-${task}${suffix}`,
        times: TouchVerdicts.times(performance.duration, 0.1, [
          [ready, row.at],
          [strokeEnd, "taskEnd"],
        ]),
        performers: [TouchVerdicts.figure(performance, "a", man)],
        verdicts,
      });
    }
  }
  return out;
}

/** A performance of one polygon man standing at the origin heading +Z. */
function perform(body: IHumanBody, chain: HumanChain): HumanPerformance {
  return new HumanPerformance({
    seed: "hand-face",
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" as const },
      },
    ],
    composition: chain.node,
  });
}
