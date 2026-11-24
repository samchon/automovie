import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieComposition,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { createHumanBody } from "../../body/createHumanBody";
import { HumanPerformance } from "../../perform/HumanPerformance";
import { HumanColliders } from "../../posture/HumanColliders";
import type { IMotionCaptureCase } from "../IMotionCaptureCase";
import { MotionBodies } from "../MotionBodies";
import type { humanPolygonMan } from "../humanPolygonMan";
import { everydayVerdicts } from "./everydayVerdicts";

/** The part of a segment its events are read from. */
interface IEventSegment {
  /** Its name, for a refusal. */
  name: IAutoMovieMotionHumanSegment["name"];

  /** Film seconds it starts. */
  start: IAutoMovieMotionHumanSegment["start"];

  /** Its plan's events and duration. */
  plan: Pick<IAutoMovieMotionHumanSegment["plan"], "events" | "duration">;
}

/** A performance's segments, all an event reader reads. */
interface IEventPerformance {
  /** A subject's segments in order. */
  segments(subject: string): readonly IEventSegment[];
}
/** The alternatives of `BandUnit`'s site. */
type BandUnit = "mm" | "deg" | "s";

/** The record of `IStabilityWorst`'s site. */
type IStabilityWorst = { value: number; at: number };

/** The record of `IStabilityResult`'s site. */
type IStabilityResult = { value: number; at: number };

/** The alternatives of `AngleAxis`'s site. */
type AngleAxis = 0 | 1 | 2;

/** The record of `IPerformPerformersItem`'s site. */
type IPerformPerformersItem = {
  subject: string;
  body: IAutoMovieMotionHumanBody;
  at?: IAutoMovieVector3;
  yaw?: number;
};

/**
 * The shared steps of the step 2 to 5 family capture cases: a polygon man of
 * the population, one performance of a chain from quiet standing at the origin
 * heading +Z, the drawn figure, the film second of a named event, the drawn
 * instants, and the measures their verdicts read off the displayed bones (a
 * joint's clinical angle, the lowest collider of some bones, the worst margin
 * of stability over a span, a band check).
 */
export namespace FamilyCaseKit {
  /** A population body prepared for a case. */
  export interface IBody {
    /** Its population name. */
    id: string;

    /** The polygon man drawn. */
    man: humanPolygonMan.IPolygonMan;

    /** The body the laws read. */
    body: IAutoMovieMotionHumanBody;
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
   * @param composition What they do: a composition, or a chain's node.
   * @param props The props, none when absent.
   * @returns The performance.
   */
  export function perform(
    seed: string,
    performers: readonly IPerformPerformersItem[],
    composition: IAutoMovieComposition,
    props: readonly IAutoMovieMotionHumanProp[] = [],
  ): IAutoMovieMotionHumanPerformance {
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
      composition,
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
    performance: Pick<IAutoMovieMotionHumanPerformance, "pose">,
    man: Pick<humanPolygonMan.IPolygonMan, "body">,
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
    performance: IEventPerformance,
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
    performance: Pick<IAutoMovieMotionHumanPerformance, "duration">,
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
    performance: Pick<IAutoMovieMotionHumanPerformance, "pose">,
    subject: string,
    seconds: number,
    bone: string,
    axis: AngleAxis = 0,
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
   * The case of a performance its laws refused: no figure and one failing
   * `planned` verdict that names the refusal, so a refused row shows as a
   * failure rather than vanishing.
   *
   * @param name The case's name.
   * @param error What the performance threw.
   * @returns The case.
   */
  export function refused(name: string, error: unknown): IMotionCaptureCase {
    return {
      name,
      times: [{ seconds: 0, label: "refused" }],
      performers: [],
      verdicts: [
        {
          name: "planned",
          passed: false,
          detail: error instanceof Error ? error.message : String(error),
        },
      ],
    };
  }

  /**
   * A performance, or when its laws refuse it, its refused case pushed in its
   * place so the remaining cases still run.
   *
   * @param out The cases so far; a refusal is appended.
   * @param name The case's name.
   * @param run Builds the performance.
   * @returns The performance, or null when it was refused.
   */
  export function attempt<Performance>(
    out: IMotionCaptureCase[],
    name: string,
    run: () => Performance,
  ): Performance | null {
    // Process boundary: a case that throws is reported as that case's
    // refusal, and the remaining cases still run.
    try {
      return run();
    } catch (error) {
      out.push(refused(name, error));
      return null;
    }
  }
  /**
   * The lowest point of the colliders of the bones a test selects, at a film
   * second.
   *
   * @param performance The performance.
   * @param body The body.
   * @param subject The subject.
   * @param seconds Film seconds.
   * @param of Which bones.
   * @returns World height, metres; `Infinity` when no bone is selected.
   */
  export function lowest(
    performance: IAutoMovieMotionHumanPerformance,
    body: IAutoMovieMotionHumanBody,
    subject: string,
    seconds: number,
    of: (bone: string) => boolean,
  ): number {
    // The collider floor minimum's one owner, over the selected bones.
    return HumanColliders.prepareMinima(body, [
      new Set([...HumanColliders.bones(body)].filter(of)),
    ])(performance.bones(subject, seconds))[0]!;
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
    performance: IAutoMovieMotionHumanPerformance,
    subject: string,
    body: IAutoMovieMotionHumanBody,
    from: number,
    to: number,
  ): IStabilityResult {
    let worst: IStabilityWorst = { value: Infinity, at: from };
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
    unit: BandUnit,
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
   * The greatest distance of a bone's joint from a point over a span, on the 24
   * Hz grid.
   *
   * @param performance The performance.
   * @param subject The subject.
   * @param bone The bone.
   * @param point The world point at a film second.
   * @param from Film seconds.
   * @param to Film seconds.
   * @returns Metres.
   */
  export function drift(
    performance: Pick<IAutoMovieMotionHumanPerformance, "bones">,
    subject: string,
    bone: AutoMovieHumanoidBone,
    point: (seconds: number) => IAutoMovieVector3,
    from: number,
    to: number,
  ): number {
    let worst: number = 0;
    for (let t: number = from; t <= to + 1e-9; t += 1 / 24) {
      const at: IAutoMovieVector3 = performance
        .bones(subject, t)
        .get(bone)!.worldPosition;
      const goal: IAutoMovieVector3 = point(t);
      worst = Math.max(worst, Vector3.length(Vector3.subtract(at, goal)));
    }
    return worst;
  }
}
