import type {
  AutoMovieComposition,
  IAutoMovieResolvedBone,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAudit,
  type HumanChain,
  HumanPerformance,
  type IAutoMovieMotionHumanAuditMeasure,
  IAutoMovieMotionHumanAuditMotion,
  type IHumanBody,
  type IHumanProp,
} from "@automovie/motions";

/**
 * The shared steps of the action-law tests: a performance of people standing
 * at their places, that performance as a film whose instants are resolved
 * once however many measures read them, the film second of a named event, the
 * farthest a joint centre travels in one frame, the generic audit as a list
 * of complaints, and the gathering of every complaint of a test into one
 * assertion.
 *
 * A law test reads several measures off the same displayed frames, and one
 * frame of an arm fitted on the body costs a second, so every measure of a
 * test reads the one film {@link film} remembers.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each helper builds or measures and why the film is remembered.
 * @evidence contracts/development/implementation.md#principled-implementation Every measure reads displayed bones of the real performance through the package entry point.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Six small helpers over `HumanPerformance` and the audit.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing event throws instead of reading as zero.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the frames read.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A film resolves each person's instant once for every measure of a test.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A film's frames live as long as the test holds the film.
 */
export namespace motionHumanLaw {
  /** A person's displayed bones. */
  export type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

  /** A performance with its remembered frames. */
  export interface IFilm extends IAutoMovieMotionHumanAuditMotion {
    /** The performance itself. */
    performance: HumanPerformance;
  }

  /**
   * A performance of people standing at their places, trained.
   *
   * @param seed The seed.
   * @param performers Each subject's body, floor point (the origin when absent) and heading (+Z when absent).
   * @param composition What they do.
   * @param props The props, none when absent.
   * @returns The film of the performance.
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
  ): IFilm {
    return film(
      new HumanPerformance({
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
      }),
    );
  }

  /**
   * A performance as a film that resolves each person's instant once.
   *
   * @param performance The performance.
   * @returns The film.
   */
  export function film(performance: HumanPerformance): IFilm {
    const known: Map<string, Bones> = new Map();
    return {
      performance,
      duration: performance.duration,
      segments: (subject: string) => performance.segments(subject),
      bones: (subject: string, seconds: number): Bones => {
        const key: string = `${subject}@${seconds}`;
        let bones: Bones | undefined = known.get(key);
        if (bones === undefined) {
          bones = performance.bones(subject, seconds);
          known.set(key, bones);
        }
        return bones;
      },
    };
  }

  /**
   * The film second of a named event of a subject's first action that has it.
   *
   * @param film The film.
   * @param name The event.
   * @param subject The subject.
   * @returns Film seconds.
   * @throws {Error} When no action of the subject has the event.
   */
  export function event(
    film: IFilm,
    name: string,
    subject: string = "a",
  ): number {
    for (const segment of film.performance.segments(subject)) {
      const found = segment.plan.events.find((e) => e.name === name);
      if (found !== undefined)
        return segment.start + found.share * segment.plan.duration;
    }
    throw new Error(`${subject} has no event ${name}`);
  }

  /**
   * The farthest a bone's joint centre travels between two neighbouring
   * instants of the grid, over the whole film.
   *
   * @param film The film.
   * @param subject The subject.
   * @param bone The bone.
   * @param rate Grid samples per second.
   * @returns Metres per grid interval, the start of the interval and the bone.
   */
  export function travel(
    film: IFilm,
    subject: string,
    bone: AutoMovieHumanoidBone,
    rate: number = 24,
  ): IAutoMovieMotionHumanAuditMeasure {
    const times: number[] = IAutoMovieMotionHumanAuditMotion.grid(
      0,
      film.duration,
      rate,
    );
    const at = (t: number): IAutoMovieVector3 =>
      film.bones(subject, t).get(bone)!.worldPosition;
    let worst: IAutoMovieMotionHumanAuditMeasure = {
      value: 0,
      seconds: 0,
      where: bone,
    };
    for (let i: number = 0; i + 1 < times.length; i++) {
      const a: IAutoMovieVector3 = at(times[i]!);
      const b: IAutoMovieVector3 = at(times[i + 1]!);
      const value: number = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
      if (value > worst.value)
        worst = { value, seconds: times[i]!, where: bone };
    }
    return worst;
  }

  /**
   * The generic audit of a subject, as complaints.
   *
   * @param film The film.
   * @param label What the complaints are prefixed with.
   * @param subject The subject.
   * @param body Their body.
   * @param options The audit's options.
   * @returns One complaint per finding; empty when clean.
   */
  export function audit(
    film: IAutoMovieMotionHumanAuditMotion,
    label: string,
    subject: string,
    body: IHumanBody,
    options: AutoMovieMotionHumanAudit.IOptions = {},
  ): string[] {
    const report: AutoMovieMotionHumanAudit.IReport =
      AutoMovieMotionHumanAudit.run(film, subject, body, options);
    return report.findings.length === 0
      ? []
      : [
          `${label}: ${AutoMovieMotionHumanAudit.describe(report)}${
            report.pairs.length === 0
              ? ""
              : ` [${report.pairs
                  .slice(0, 4)
                  .map(
                    (p) =>
                      `${p.a} in ${p.b} ${(p.depth * 1000).toFixed(1)} mm at ${p.seconds.toFixed(2)} s`,
                  )
                  .join(", ")}]`
          }`,
        ];
  }

  /**
   * A complaint when a condition does not hold.
   *
   * @param label What is expected, with its measured numbers.
   * @param holds Whether it holds.
   * @returns The label when it does not hold; empty when it does.
   */
  export function expect(label: string, holds: boolean): string[] {
    return holds ? [] : [label];
  }
}
