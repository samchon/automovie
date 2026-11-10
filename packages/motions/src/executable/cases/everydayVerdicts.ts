import {
  DEFAULT_HUMANOID_ROM,
  jointRomOvershoot,
  resolveAutoMovieCenterOfMass,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  IAutoMovieJointPose,
  IAutoMovieVector3,
} from "@automovie/interface";

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
   * The largest slip of a planted foot within any plant window, metres, and
   * where it happens. A planted foot rolls on its heel, flat and on its ball
   * (the rockers of stance), so its contact is its lowest sole socket (heel,
   * ball or toe), and the slip is that socket's horizontal drift from where
   * it first became the contact in the window, on the 24 Hz grid.
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
    for (const segment of performance.segments(subject))
      for (const contact of segment.plan.contacts) {
        if (
          contact.kind !== "plant" ||
          (contact.part !== "leftFoot" && contact.part !== "rightFoot")
        )
          continue;
        const side: "Left" | "Right" =
          contact.part === "leftFoot" ? "Left" : "Right";
        const from: number = Math.max(
          segment.entryTime,
          segment.start + contact.from * segment.plan.duration,
        );
        const to: number = Math.min(
          segment.end,
          segment.start + contact.to * segment.plan.duration,
        );
        const anchors: Map<string, IAutoMovieVector3> = new Map();
        for (let t: number = from; t <= to + 1e-9; t += 1 / 24) {
          const bones = performance.bones(subject, t);
          let lowest: [string, IAutoMovieVector3] | undefined;
          for (const name of ["heel", "ball", "toe"] as const) {
            const frame = body.surfaces.sockets[`${name}${side}`];
            const p: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
              frame,
              bones.get(frame.bone)!,
            ).point;
            if (lowest === undefined || p.y < lowest[1].y - 1e-6)
              lowest = [name, p];
          }
          const [name, p] = lowest!;
          const anchor: IAutoMovieVector3 = anchors.get(name) ?? p;
          anchors.set(name, anchor);
          const value: number = Math.hypot(p.x - anchor.x, p.z - anchor.z);
          if (value > worst.value)
            worst = {
              value,
              where: `${segment.name} ${contact.part} at ${t.toFixed(2)} s`,
            };
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
    const bones = performance.bones(subject, seconds);
    const support: IAutoMovieVector3[] = [];
    for (const side of ["Left", "Right"] as const)
      for (const point of ["heel", "ball", "toe"] as const) {
        const frame = body.surfaces.sockets[`${point}${side}`];
        support.push(
          resolveAutoMovieHumanoidSurfaces.place(frame, bones.get(frame.bone)!)
            .point,
        );
      }
    return resolveAutoMovieCenterOfMass.margin(xcom, support);
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
