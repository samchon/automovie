import {
  type AutoMovieComposition,
  Vector3,
  physicalShapeBounds,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanChain } from "../../HumanChain";
import type { IHumanBody } from "../../body/IHumanBody";
import { createHumanBody } from "../../body/createHumanBody";
import { HumanPerformance } from "../../perform/HumanPerformance";
import type { IHumanProp } from "../../perform/IHumanProp";
import { HumanColliders } from "../../posture/HumanColliders";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { MotionBodies } from "../MotionBodies";
import type { humanPolygonMan } from "../humanPolygonMan";
import { everydayVerdicts } from "./everydayVerdicts";

/**
 * The shared steps of the step 2 to 5 family capture cases: a polygon man
 * of the population, one performance of a chain from quiet standing at the
 * origin heading +Z, the drawn figure, the film second of a named event, the
 * drawn instants, and the measures their verdicts read off the displayed
 * bones (a joint's clinical angle, the lowest collider of some bones, the
 * worst margin of stability over a span, a band check).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each helper builds or measures and on which poses.
 * @evidence contracts/development/implementation.md#principled-implementation Every measure reads displayed poses or bones of the real performance, never a law's goals.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Small helpers over `HumanPerformance` and `everydayVerdicts`.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing event throws instead of reading as zero.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the frames sampled.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per case.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export namespace FamilyCaseKit {
  /** A population body prepared for a case. */
  export interface IBody {
    /** Its population name. */
    id: string;

    /** The polygon man drawn. */
    man: humanPolygonMan.IPolygonMan;

    /** The body the laws read. */
    body: IHumanBody;
  }

  /**
   * A population body.
   *
   * @param id Its name in `MotionBodies.SWEEP`.
   * @returns The polygon man and its body.
   */
  export function body(id: string): IBody {
    const man: humanPolygonMan.IPolygonMan = MotionBodies.population(id);
    return {
      id,
      man,
      body: createHumanBody(man.body.skeleton, man.body.profile),
    };
  }

  /**
   * A performance of performers standing at their places.
   *
   * @param seed The chain seed.
   * @param performers Each subject's body, floor point and heading.
   * @param composition What they do.
   * @param props The props, none when absent.
   * @returns The performance.
   */
  export function perform(
    seed: string,
    performers: readonly {
      subject: string;
      body: IHumanBody;
      at?: IAutoMovieVector3;
      yaw?: number;
    }[],
    composition: AutoMovieComposition | HumanChain,
    props: readonly IHumanProp[] = [],
  ): HumanPerformance {
    return new HumanPerformance({
      seed,
      performers: performers.map((p) => ({
        subject: p.subject,
        body: p.body,
        at: p.at ?? { x: 0, y: 0, z: 0 },
        yaw: p.yaw ?? 0,
        proficiency: { level: "trained" as const },
      })),
      props: [...props],
      composition: "node" in composition ? composition.node : composition,
    });
  }

  /**
   * The drawn figure of a performer.
   *
   * @param performance The performance.
   * @param man The polygon man.
   * @param id The subject.
   * @returns The figure.
   */
  export function figure(
    performance: HumanPerformance,
    man: humanPolygonMan.IPolygonMan,
    id: string = "a",
  ): IMotionCaptureCase.IPerformer {
    return {
      id,
      body: man.body,
      pose: (seconds: number): IAutoMoviePose => performance.pose(id, seconds),
    };
  }

  /**
   * The film second of a named event of a subject's first action that has it.
   *
   * @param performance The performance.
   * @param name The event.
   * @param subject The subject.
   * @returns Film seconds.
   * @throws {Error} When no action of the subject has the event.
   */
  export function event(
    performance: HumanPerformance,
    name: string,
    subject: string = "a",
  ): number {
    for (const segment of performance.segments(subject)) {
      const found = segment.plan.events.find((e) => e.name === name);
      if (found !== undefined)
        return segment.start + found.share * segment.plan.duration;
    }
    throw new Error(`${subject} has no event ${name}`);
  }

  /**
   * The whole performance at a fixed step, with named instants in their order.
   *
   * @param performance The performance.
   * @param step Seconds between drawn instants.
   * @param named Instants that must be drawn, with their captions.
   * @returns The instants.
   */
  export function times(
    performance: HumanPerformance,
    step: number,
    named: [number, string][],
  ): IMotionCaptureCase.ITime[] {
    const out: IMotionCaptureCase.ITime[] = named.map(([seconds, label]) => ({
      seconds,
      label,
    }));
    const count: number = Math.ceil(performance.duration / step - 1e-9);
    for (let i: number = 0; i <= count; i++) {
      const seconds: number = Math.min(performance.duration, i * step);
      if (out.every((t) => Math.abs(t.seconds - seconds) > step / 4))
        out.push({ seconds, label: `${seconds.toFixed(2)} s` });
    }
    return out.sort((a, b) => a.seconds - b.seconds);
  }

  /**
   * A joint's displayed clinical angle.
   *
   * @param performance The performance.
   * @param subject The subject.
   * @param seconds Film seconds.
   * @param bone The joint.
   * @param axis 0 flexion, 1 abduction, 2 twist.
   * @returns Degrees; 0 for a joint the pose leaves neutral.
   */
  export function angle(
    performance: HumanPerformance,
    subject: string,
    seconds: number,
    bone: string,
    axis: 0 | 1 | 2 = 0,
  ): number {
    const joint: IAutoMovieJointPose | undefined = performance
      .pose(subject, seconds)
      .joints.find((j: IAutoMovieJointPose): boolean => j.bone === bone);
    if (joint === undefined) return 0;
    return (
      (axis === 0
        ? joint.flexion
        : axis === 1
          ? joint.abduction
          : joint.twist) ?? 0
    );
  }

  /**
   * The lowest point of the colliders of the bones a test selects, at a
   * film second.
   *
   * @param performance The performance.
   * @param body The body.
   * @param subject The subject.
   * @param seconds Film seconds.
   * @param of Which bones.
   * @returns World height, metres; `Infinity` when no bone is selected.
   */
  export function lowest(
    performance: HumanPerformance,
    body: IHumanBody,
    subject: string,
    seconds: number,
    of: (bone: string) => boolean,
  ): number {
    let value: number = Infinity;
    for (const { bone, pose, shapes } of HumanColliders.placed(
      body,
      performance.bones(subject, seconds),
    ))
      if (of(bone))
        for (const shape of shapes)
          value = Math.min(value, physicalShapeBounds(pose, shape).min.y);
    return value;
  }

  /**
   * The worst dynamic margin of stability over a span, on the 24 Hz grid.
   *
   * @param performance The performance.
   * @param subject The subject.
   * @param body The body.
   * @param from Film seconds.
   * @param to Film seconds.
   * @returns The least margin, metres, and its second.
   */
  export function stability(
    performance: HumanPerformance,
    subject: string,
    body: IHumanBody,
    from: number,
    to: number,
  ): { value: number; at: number } {
    let worst: { value: number; at: number } = { value: Infinity, at: from };
    for (let t: number = from; t <= to + 1e-9; t += 1 / 24) {
      const at: number = Math.min(
        performance.duration - 1 / 120,
        Math.max(1 / 120, t),
      );
      const value: number = everydayVerdicts.stability(
        performance,
        subject,
        body,
        at,
      );
      if (value < worst.value) worst = { value, at };
    }
    return worst;
  }

  /**
   * A verdict that a value lies in a band.
   *
   * @param name The check.
   * @param value The measure.
   * @param lo The least allowed.
   * @param hi The most allowed.
   * @param unit `mm` (metres shown in millimetres), `deg` or `s`.
   * @returns The verdict.
   */
  export function band(
    name: string,
    value: number,
    lo: number,
    hi: number,
    unit: "mm" | "deg" | "s",
  ): IMotionCaptureCase.IVerdict {
    const show = (v: number): string =>
      unit === "mm"
        ? `${(v * 1000).toFixed(1)} mm`
        : unit === "deg"
          ? `${v.toFixed(2)} deg`
          : `${v.toFixed(3)} s`;
    return {
      name,
      passed: value >= lo && value <= hi,
      detail: `${show(value)} (band ${show(lo)} to ${show(hi)})`,
    };
  }

  /**
   * The greatest distance of a bone's joint from a point over a span, on the
   * 24 Hz grid.
   *
   * @param performance The performance.
   * @param subject The subject.
   * @param bone The bone.
   * @param point The world point, or a function of film seconds.
   * @param from Film seconds.
   * @param to Film seconds.
   * @returns Metres.
   */
  export function drift(
    performance: HumanPerformance,
    subject: string,
    bone: AutoMovieHumanoidBone,
    point: IAutoMovieVector3 | ((seconds: number) => IAutoMovieVector3),
    from: number,
    to: number,
  ): number {
    let worst: number = 0;
    for (let t: number = from; t <= to + 1e-9; t += 1 / 24) {
      const at: IAutoMovieVector3 = performance
        .bones(subject, t)
        .get(bone)!.worldPosition;
      const goal: IAutoMovieVector3 =
        typeof point === "function" ? point(t) : point;
      worst = Math.max(worst, Vector3.length(Vector3.subtract(at, goal)));
    }
    return worst;
  }
}
