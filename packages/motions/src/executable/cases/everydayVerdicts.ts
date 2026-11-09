import { DEFAULT_HUMANOID_ROM, jointRomOvershoot, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type { IAutoMovieJointPose, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../../body/IHumanBody";
import type { HumanPerformance } from "../../perform/HumanPerformance";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";

/**
 * The numeric checks the everyday capture cases report beside their sheets,
 * measured on the displayed poses the sheets draw: foot slip in the plant
 * windows, range-of-motion overshoot, and a bounded distance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each check measures and on which poses.
 * @evidence contracts/development/implementation.md#principled-implementation Slip is the sole centre's drift inside each declared plant window on the 24 Hz grid; overshoot is the engine's per-joint measure against the default humanoid range.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Three small measures and one verdict builder.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Measures read displayed poses, never the laws' goals, except where a check names its goal.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in frames times joints.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Run once per capture.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export namespace everydayVerdicts {
  /**
   * The largest drift of a planted foot's sole centre within any plant window, metres.
   *
   * @param performance The performance.
   * @param subject The person.
   * @param body The person's body.
   * @returns Metres.
   */
  export function slip(performance: HumanPerformance, subject: string, body: IHumanBody): number {
    let worst: number = 0;
    for (const segment of performance.segments(subject))
      for (const contact of segment.plan.contacts) {
        if (contact.kind !== "plant" || (contact.part !== "leftFoot" && contact.part !== "rightFoot")) continue;
        const frame = body.surfaces.sockets[contact.part === "leftFoot" ? "soleLeft" : "soleRight"];
        const from: number = Math.max(segment.entryTime, segment.start + contact.from * segment.plan.duration);
        const to: number = Math.min(segment.end, segment.start + contact.to * segment.plan.duration);
        let first: IAutoMovieVector3 | undefined;
        for (let t: number = from; t <= to + 1e-9; t += 1 / 24) {
          const p: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(frame, performance.bones(subject, t).get(frame.bone)!).point;
          first ??= p;
          worst = Math.max(worst, Math.hypot(p.x - first.x, p.z - first.z));
        }
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
  export function overshoot(performance: HumanPerformance, subject: string): number {
    let worst: number = 0;
    for (let t: number = 0; t <= performance.duration + 1e-9; t += 1 / 24)
      for (const joint of performance.pose(subject, t).joints as IAutoMovieJointPose[])
        worst = Math.max(worst, jointRomOvershoot(joint, DEFAULT_HUMANOID_ROM[joint.bone] ?? null));
    return worst;
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
  export function within(name: string, value: number, limit: number, unit: "mm" | "deg"): IMotionCaptureCase.IVerdict {
    const show = (v: number): string => (unit === "mm" ? `${(v * 1000).toFixed(1)} mm` : `${v.toFixed(2)} deg`);
    return { name, passed: value <= limit, detail: `${show(value)} (limit ${show(limit)})` };
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
  export function standard(performance: HumanPerformance, subject: string, body: IHumanBody): IMotionCaptureCase.IVerdict[] {
    return [within(`${subject} foot slip`, slip(performance, subject, body), 0.005, "mm"), within(`${subject} ROM overshoot`, overshoot(performance, subject), 1e-6, "deg")];
  }
}
