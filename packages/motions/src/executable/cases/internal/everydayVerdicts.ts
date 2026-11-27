import { AutoMovieEngineDefaultHumanoidRom, AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanSide, AutoMovieHumanoidBone, IAutoMovieJointPose, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPerformance, IAutoMovieResolveCenterOfMass, IAutoMovieVector3 } from "@automovie/interface";

import { HumanFoot } from "../../../posture/internal/HumanFoot";
import type { IMotionCaptureCase } from "../../internal/IMotionCaptureCase";
import { FootSlip } from "../FootSlip";

/*
 * The numeric checks the everyday capture cases report beside their sheets,
 * measured on the displayed poses the sheets draw: foot slip and the foot's
 * height off the floor in the plant windows, a joint's travel per frame,
 * range-of-motion overshoot, and a bounded distance.
 */
export namespace everydayVerdicts {
  /*
   * The largest slip of a planted foot within any plant window, metres, and
   * where it happens, by the rule of FootSlip on the 24 Hz grid. A plant
   * may stand on something raised (a step), so no floor height is asked of the
   * contact here.
   * Parameter performance: The performance.
   * Parameter subject: The person.
   * Parameter body: The person's body.
   * Returns: Metres, with the action, the foot and the film second of the worst
   * slip.
   */
  export function slip(
    performance: IAutoMovieMotionHumanPerformance,
    subject: string,
    body: IAutoMovieMotionHumanBody,
  ): ISlipResult {
    let worst: ISlipWorst = { value: 0, where: "none" };
    for (const plant of plants(performance, subject)) {
      const anchors: Map<string, IAutoMovieVector3> = new Map();
      for (let t: number = plant.from; t <= plant.to + 1e-9; t += 1 / 24) {
        const value: number = FootSlip.drift(
          anchors,
          plant.part,
          FootSlip.contact(
            HumanFoot.sockets(body, performance.bones(subject, t), plant.side),
          ),
        );
        if (value > worst.value)
          worst = {
            value,
            where: `${plant.action} ${plant.part} at ${t.toFixed(2)} s`,
          };
      }
    }
    return worst;
  }

  /*
   * The farthest a foot planted on the ground is from the floor within any of
   * its plant windows, metres, and where it happens: the height of the sole
   * point FootSlip reads as the contact, above or below zero, on the 24
   * Hz grid. A plant on something raised is not read.
   * Parameter performance: The performance.
   * Parameter subject: The person.
   * Parameter body: The person's body.
   * Returns: Metres, with the action, the foot and the film second of the worst
   * height.
   */
  export function grounded(
    performance: IAutoMovieMotionHumanPerformance,
    subject: string,
    body: IAutoMovieMotionHumanBody,
  ): IGroundedResult {
    let worst: IGroundedWorst = { value: 0, where: "none" };
    for (const plant of plants(performance, subject)) {
      if (plant.ground === false) continue;
      for (let t: number = plant.from; t <= plant.to + 1e-9; t += 1 / 24) {
        const value: number = Math.abs(
          FootSlip.contact(
            HumanFoot.sockets(body, performance.bones(subject, t), plant.side),
          ).point.y,
        );
        if (value > worst.value)
          worst = {
            value,
            where: `${plant.action} ${plant.part} at ${t.toFixed(2)} s`,
          };
      }
    }
    return worst;
  }

  /*
   * The farthest a bone's joint travels in one frame of the 24 Hz grid between
   * two film seconds, metres: a speed limit read on displayed poses.
   * Parameter performance: The performance.
   * Parameter subject: The person.
   * Parameter bone: The bone.
   * Parameter from: Film seconds.
   * Parameter to: Film seconds.
   * Returns: Metres per 1/24 s.
   */
  export function travel(
    performance: IAutoMovieMotionHumanPerformance,
    subject: string,
    bone: AutoMovieHumanoidBone,
    from: number,
    to: number,
  ): number {
    const at = (t: number): IAutoMovieVector3 =>
      performance.bones(subject, t).get(bone)!.worldPosition;
    let worst: number = 0;
    for (let t: number = from; t + 1 / 24 <= to + 1e-9; t += 1 / 24) {
      const a: IAutoMovieVector3 = at(t);
      const b: IAutoMovieVector3 = at(t + 1 / 24);
      worst = Math.max(worst, Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z));
    }
    return worst;
  }

  /*
   * The largest range-of-motion overshoot of any joint over the performance,
   * degrees.
   * Parameter performance: The performance.
   * Parameter subject: The person.
   * Returns: Degrees; zero when every joint stays inside its range.
   */
  export function overshoot(
    performance: IAutoMovieMotionHumanPerformance,
    subject: string,
  ): number {
    let worst: number = 0;
    for (let t: number = 0; t <= performance.duration + 1e-9; t += 1 / 24)
      for (const joint of performance.pose(subject, t)
        .joints as IAutoMovieJointPose[])
        worst = Math.max(
          worst,
          AutoMovieEngineKinematics.jointRomOvershoot(joint, AutoMovieEngineDefaultHumanoidRom[joint.bone] ?? null),
        );
    return worst;
  }

  /*
   * The margin of stability at a film second (Hof, Gazendam and Sinke 2005):
   * the extrapolated centre of mass, the engine's whole-body centre plus its
   * velocity (a central difference over 1/240 s) over the pendulum's
   * eigenfrequency with a length of 1.34 hip heights, measured to the edge of
   * the hull of both feet's heel, ball and toe points; positive inside.
   * Parameter performance: The performance.
   * Parameter subject: The person.
   * Parameter body: The person's body.
   * Parameter seconds: Film seconds.
   * Returns: Metres.
   */
  export function stability(
    performance: IAutoMovieMotionHumanPerformance,
    subject: string,
    body: IAutoMovieMotionHumanBody,
    seconds: number,
  ): number {
    const model: IAutoMovieResolveCenterOfMass.IModel =
      AutoMovieEngineKinematics.resolveAutoMovieCenterOfMass(body.skeleton, body.profile);
    const com = (t: number): IAutoMovieVector3 =>
      AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPlace(model, performance.bones(subject, t));
    const h: number = 1 / 240;
    const a: IAutoMovieVector3 = com(seconds - h);
    const b: IAutoMovieVector3 = com(seconds + h);
    const velocity: IAutoMovieVector3 = {
      x: (b.x - a.x) / (2 * h),
      y: (b.y - a.y) / (2 * h),
      z: (b.z - a.z) / (2 * h),
    };
    const xcom: IAutoMovieVector3 = AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassExtrapolate(
      com(seconds),
      velocity,
      AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPendulum(body.measure.hipHeight),
    );
    return AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassMargin(
      xcom,
      HumanFoot.base(body, performance.bones(subject, seconds)),
    );
  }

  /*
   * A verdict that a measured value stays within a limit.
   * Parameter name: The check.
   * Parameter value: The measure.
   * Parameter limit: The limit.
   * Parameter unit: `mm` (value in metres, shown in millimetres) or `deg`.
   * Returns: The verdict.
   */
  export function within(
    name: string,
    value: number,
    limit: number,
    unit: WithinUnit,
  ): IMotionCaptureCase.IVerdict {
    const show = (v: number): string =>
      unit === "mm" ? `${(v * 1000).toFixed(1)} mm` : `${v.toFixed(2)} deg`;
    return {
      name,
      passed: value <= limit,
      detail: `${show(value)} (limit ${show(limit)})`,
    };
  }

  /*
   * The standard checks of a performance: foot slip at most 5 mm and no
   * range-of-motion overshoot.
   * Parameter performance: The performance.
   * Parameter subject: The person.
   * Parameter body: The person's body.
   * Returns: The verdicts.
   */
  export function standard(
    performance: IAutoMovieMotionHumanPerformance,
    subject: string,
    body: IAutoMovieMotionHumanBody,
  ): IMotionCaptureCase.IVerdict[] {
    const slipped = slip(performance, subject, body);
    const verdict: IMotionCaptureCase.IVerdict = within(
      `${subject} foot slip`,
      slipped.value,
      0.005,
      "mm",
    );
    return [
      { ...verdict, detail: `${verdict.detail}, worst in ${slipped.where}` },
      within(
        `${subject} ROM overshoot`,
        overshoot(performance, subject),
        1e-6,
        "deg",
      ),
    ];
  }
}

/*
 * The alternatives of `WithinUnit`'s site.
 */
type WithinUnit = "mm" | "deg";

/*
 * The record of `IGroundedWorst`'s site.
 */
type IGroundedWorst = { value: number; where: string };

/*
 * The record of `IGroundedResult`'s site.
 */
type IGroundedResult = { value: number; where: string };

/*
 * The record of `ISlipWorst`'s site.
 */
type ISlipWorst = { value: number; where: string };

/*
 * The record of `ISlipResult`'s site.
 */
type ISlipResult = { value: number; where: string };
/*
 * The alternatives of `PlantPart`'s site.
 */
type PlantPart = "leftFoot" | "rightFoot";

/*
 * A foot's plant window in film seconds, clipped to its action's own span.
 */
interface IPlant {
  action: string;
  part: PlantPart;
  side: AutoMovieHumanSide;
  from: number;
  to: number;
  ground: boolean;
}

/*
 * Every foot plant window of a person's performance.
 */
function plants(
  performance: IAutoMovieMotionHumanPerformance,
  subject: string,
): IPlant[] {
  const out: IPlant[] = [];
  for (const segment of performance.segments(subject))
    for (const contact of segment.plan.contacts) {
      if (
        contact.kind !== "plant" ||
        (contact.part !== "leftFoot" && contact.part !== "rightFoot")
      )
        continue;
      out.push({
        action: segment.name,
        part: contact.part,
        side: contact.part === "leftFoot" ? "left" : "right",
        from: Math.max(
          segment.entryTime,
          segment.start + contact.from * segment.plan.duration,
        ),
        to: Math.min(
          segment.end,
          segment.start + contact.to * segment.plan.duration,
        ),
        ground: contact.support?.kind === "ground",
      });
    }
  return out;
}
