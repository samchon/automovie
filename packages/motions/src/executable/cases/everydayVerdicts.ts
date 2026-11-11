import {
  DEFAULT_HUMANOID_ROM,
  jointRomOvershoot,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../../body/IHumanBody";
import type { HumanPerformance } from "../../perform/HumanPerformance";
import { HumanFoot } from "../../posture/HumanFoot";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { FootSlip } from "./FootSlip";

/**
 * The numeric checks the everyday capture cases report beside their sheets,
 * measured on the displayed poses the sheets draw: foot slip and the foot's
 * height off the floor in the plant windows, a joint's travel per frame,
 * range-of-motion overshoot, and a bounded distance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each check measures and on which poses.
 * @evidence contracts/development/implementation.md#principled-implementation Slip is the sole centre's drift inside each declared plant window on the 24 Hz grid; overshoot is the engine's per-joint measure against the default humanoid range.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Five small measures over one list of plant windows, and one verdict builder.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Measures read displayed poses, never the laws' goals, except where a check names its goal.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in frames times joints.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Run once per capture.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export namespace everydayVerdicts {
  /**
   * The largest slip of a planted foot within any plant window, metres, and
   * where it happens, by the rule of {@link FootSlip} on the 24 Hz grid. A
   * plant may stand on something raised (a step), so no floor height is
   * asked of the contact here.
   *
   * @param performance The performance.
   * @param subject The person.
   * @param body The person's body.
   * @returns Metres, with the action, the foot and the film second of the worst slip.
   */
  export function slip(
    performance: HumanPerformance,
    subject: string,
    body: IHumanBody,
  ): { value: number; where: string } {
    let worst: { value: number; where: string } = { value: 0, where: "none" };
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

  /**
   * The farthest a foot planted on the ground is from the floor within any
   * of its plant windows, metres, and where it happens: the height of the
   * sole point {@link FootSlip} reads as the contact, above or below zero, on
   * the 24 Hz grid. A plant on something raised is not read.
   *
   * @param performance The performance.
   * @param subject The person.
   * @param body The person's body.
   * @returns Metres, with the action, the foot and the film second of the worst height.
   */
  export function grounded(
    performance: HumanPerformance,
    subject: string,
    body: IHumanBody,
  ): { value: number; where: string } {
    let worst: { value: number; where: string } = { value: 0, where: "none" };
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

  /**
   * The farthest a bone's joint travels in one frame of the 24 Hz grid
   * between two film seconds, metres: a speed limit read on displayed poses.
   *
   * @param performance The performance.
   * @param subject The person.
   * @param bone The bone.
   * @param from Film seconds.
   * @param to Film seconds.
   * @returns Metres per 1/24 s.
   */
  export function travel(
    performance: HumanPerformance,
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

  /**
   * The largest range-of-motion overshoot of any joint over the performance, degrees.
   *
   * @param performance The performance.
   * @param subject The person.
   * @returns Degrees; zero when every joint stays inside its range.
   */
  export function overshoot(
    performance: HumanPerformance,
    subject: string,
  ): number {
    let worst: number = 0;
    for (let t: number = 0; t <= performance.duration + 1e-9; t += 1 / 24)
      for (const joint of performance.pose(subject, t)
        .joints as IAutoMovieJointPose[])
        worst = Math.max(
          worst,
          jointRomOvershoot(joint, DEFAULT_HUMANOID_ROM[joint.bone] ?? null),
        );
    return worst;
  }

  /**
   * The margin of stability at a film second (Hof, Gazendam and Sinke 2005):
   * the extrapolated centre of mass, the engine's whole-body centre plus its
   * velocity (a central difference over 1/240 s) over the pendulum's
   * eigenfrequency with a length of 1.34 hip heights, measured to the edge of
   * the hull of both feet's heel, ball and toe points; positive inside.
   *
   * @param performance The performance.
   * @param subject The person.
   * @param body The person's body.
   * @param seconds Film seconds.
   * @returns Metres.
   */
  export function stability(
    performance: HumanPerformance,
    subject: string,
    body: IHumanBody,
    seconds: number,
  ): number {
    const model: resolveAutoMovieCenterOfMass.IModel =
      resolveAutoMovieCenterOfMass(body.skeleton, body.profile);
    const com = (t: number): IAutoMovieVector3 =>
      resolveAutoMovieCenterOfMass.place(model, performance.bones(subject, t));
    const h: number = 1 / 240;
    const a: IAutoMovieVector3 = com(seconds - h);
    const b: IAutoMovieVector3 = com(seconds + h);
    const velocity: IAutoMovieVector3 = {
      x: (b.x - a.x) / (2 * h),
      y: (b.y - a.y) / (2 * h),
      z: (b.z - a.z) / (2 * h),
    };
    const xcom: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.extrapolate(
      com(seconds),
      velocity,
      1.34 * body.measure.hipHeight,
    );
    return resolveAutoMovieCenterOfMass.margin(
      xcom,
      HumanFoot.base(body, performance.bones(subject, seconds)),
    );
  }

  /**
   * A verdict that a measured value stays within a limit.
   *
   * @param name The check.
   * @param value The measure.
   * @param limit The limit.
   * @param unit `mm` (value in metres, shown in millimetres) or `deg`.
   * @returns The verdict.
   */
  export function within(
    name: string,
    value: number,
    limit: number,
    unit: "mm" | "deg",
  ): IMotionCaptureCase.IVerdict {
    const show = (v: number): string =>
      unit === "mm" ? `${(v * 1000).toFixed(1)} mm` : `${v.toFixed(2)} deg`;
    return {
      name,
      passed: value <= limit,
      detail: `${show(value)} (limit ${show(limit)})`,
    };
  }

  /**
   * The standard checks of a performance: foot slip at most 5 mm and no
   * range-of-motion overshoot.
   *
   * @param performance The performance.
   * @param subject The person.
   * @param body The person's body.
   * @returns The verdicts.
   */
  export function standard(
    performance: HumanPerformance,
    subject: string,
    body: IHumanBody,
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

/** A foot's plant window in film seconds, clipped to its action's own span. */
interface IPlant {
  action: string;
  part: "leftFoot" | "rightFoot";
  side: "left" | "right";
  from: number;
  to: number;
  ground: boolean;
}

/** Every foot plant window of a person's performance. */
function plants(performance: HumanPerformance, subject: string): IPlant[] {
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
