import type {
  AutoMovieHumanoidBone,
  IAutoMovieComposition,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanAudit,
  IAutoMovieMotionHumanAuditMeasure,
  IAutoMovieMotionHumanAuditMotion as IAutoMovieMotionHumanAuditMotionType,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanProp,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanPerformance } from "@automovie/motions";
import {
  AutoMovieMotionHumanAudit
} from "../../../../packages/motions/src/audit/internal/AutoMovieMotionHumanAudit";
import {
  AutoMovieMotionHumanAuditMotion
} from "../../../../packages/motions/src/audit/internal/AutoMovieMotionHumanAuditMotion";

import { motionHumanFrame } from "./motionHumanFrame";

/**
 * Shared readers for action-law tests: build a trained performance, remember
 * its displayed frames, locate an event, measure adjacent-frame travel and
 * return complaints from a whole audit or a stated condition. A condition can
 * build its label only on failure. Callers gather these complaints into their
 * own assertions.
 *
 * Measures of one film share its actual FK frames, checked on first read for
 * nonempty bones, finite world positions and finite unit local and world
 * rotations. The film owns this memory; it does not replace the performance or
 * decide whether an action met its intent.
 */
export namespace motionHumanLaw {
  /**
   * A person's displayed bones, indexed by the actual canonical bone id.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the canonical bone key and the public displayed FK record it maps to.
   * @evidence contracts/development/design.md#principled-representation Uses the public resolved bone with world position and local and world rotations for actual-motion observations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One map type shares the public bones result across frame validation and measurement.
   */
  export type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

  /**
   * An actual performance with per-film remembered displayed frames.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the actual performance retained by the displayed-frame reader.
   * @evidence contracts/development/design.md#principled-representation Extends the public audit-motion reader so segment, duration and validated bone reads keep one performance timebase.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Adds only the performance handle needed for event and posture queries.
   */
  export interface IFilm extends IAutoMovieMotionHumanAuditMotionType {
    /** The performance itself. */
    performance: IAutoMovieMotionHumanPerformance;
  }

  /**
   * A performance of people standing at their places, trained.
   *
   * @param seed The seed.
   * @param performers Each subject's body, floor point (the origin when absent)
   *   and heading (+Z when absent).
   * @param composition What they do.
   * @param props The props, none when absent.
   * @returns The film of the performance.
   * @throws {Error} When the public performance refuses its input or its film
   *   duration is invalid.
   * @evidence contracts/development/common.md#meaningful-documentation States the supplied seed, actual performers and composition, trained proficiency and default placement and props.
   * @evidence contracts/development/implementation.md#principled-implementation Creates the real performance from the supplied bodies, seed, props and composition. Missing at and yaw default to the world origin and +Z; delegate planner refusal to the public owner.
   * @evidence contracts/development/implementation.md#efficient-algorithms Copies P performer records and Q prop references once and delegates scheduling and FK to the public performance. The caller receives the film and its later frame memory.
   */
  export function perform(
    seed: string,
    performers: readonly {
      subject: string;
      body: IAutoMovieMotionHumanBody;
      at?: IAutoMovieVector3;
      yaw?: number;
    }[],
    composition: IAutoMovieComposition | IAutoMovieMotionHumanChain,
    props: readonly IAutoMovieMotionHumanProp[] = [],
  ): IFilm {
    return film(
      new AutoMovieMotionHumanPerformance({
        seed,
        performers: performers.map(
          (p: (typeof performers)[number]): IAutoMovieMotionHumanPerformer => ({
            subject: p.subject,
            body: p.body,
            at: p.at ?? { x: 0, y: 0, z: 0 },
            yaw: p.yaw ?? 0,
            proficiency: { level: "trained" as const },
          }),
        ),
        props: [...props],
        composition: "node" in composition ? composition.node : composition,
      }),
    );
  }

  /**
   * A performance as a film whose bones reader validates each actual displayed
   * frame before returning it and remembers successful reads.
   *
   * @param performance The performance.
   * @returns The film.
   * @throws {Error} When duration is nonfinite or negative, a queried second is
   *   nonfinite, or the displayed frame fails motionHumanFrame.
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the finite nonnegative duration admission, finite frame-query clock and per-film reuse after successful validation.
   * @evidence contracts/development/implementation.md#principled-implementation Admits the owning performance's duration before creating a reader. Each finite query reads the actual public FK map and checks reached world positions and rotations before caching it.
   * @evidence contracts/development/implementation.md#efficient-algorithms A distinct subject/second requires one FK read and O(B) validation over its bone map. Repeating the key returns the same map. The closure owns one map per distinct successful key until film release.
   */
  export function film(performance: IAutoMovieMotionHumanPerformance): IFilm {
    const duration: number = performance.duration;
    if (!Number.isFinite(duration) || duration < 0)
      throw new Error(`invalid film duration ${duration}`);
    const known: Map<string, Bones> = new Map();
    return {
      performance,
      duration,
      segments: (
        subject: string,
      ): readonly IAutoMovieMotionHumanAuditMotionType.ISpan[] =>
        performance.segments(subject),
      bones: (subject: string, seconds: number): Bones => {
        if (!Number.isFinite(seconds))
          throw new Error(`${subject} has nonfinite film second ${seconds}`);
        const key: string = `${subject}@${seconds}`;
        let bones: Bones | undefined = known.get(key);
        if (bones === undefined) {
          bones = performance.bones(subject, seconds);
          motionHumanFrame(bones, `${subject} at ${seconds} s`);
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
   * @evidence contracts/development/common.md#meaningful-documentation Names the first matching action in segment order, default subject a, conversion to film seconds and missing-event refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Reads the actual published segment event and uses its stored share times that plan's duration plus the segment start. Throw when no published event matches.
   * @evidence contracts/development/implementation.md#efficient-algorithms Scans only segments and event lists reached before the first match. The function retains only the returned scalar.
   */
  export function event(
    film: IFilm,
    name: string,
    subject: string = "a",
  ): number {
    for (const segment of film.performance.segments(subject)) {
      const found: IAutoMovieMotionEvent | undefined = segment.plan.events.find(
        (e: IAutoMovieMotionEvent): boolean => e.name === name,
      );
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
   * @evidence contracts/development/common.md#meaningful-documentation States that the returned measure is displacement in metres across the adjacent grid interval reported by its start and bone.
   * @evidence contracts/development/implementation.md#principled-implementation Builds the public audit grid and measures Euclidean distance between displayed world joint centres at consecutive times. Strict improvement preserves the earliest tied maximum; a stationary path keeps the zero record.
   * @evidence contracts/development/implementation.md#efficient-algorithms Uses one O(F) grid and two film reads per interval across F instants. Shared endpoints reuse the film's cached validation; only the worst scalar record leaves the function.
   */
  export function travel(
    film: IFilm,
    subject: string,
    bone: AutoMovieHumanoidBone,
    rate: number = 24,
  ): IAutoMovieMotionHumanAuditMeasure {
    const times: number[] = AutoMovieMotionHumanAuditMotion.grid(
      0,
      film.duration,
      rate,
    );
    const at: (t: number) => IAutoMovieVector3 = (
      t: number,
    ): IAutoMovieVector3 => film.bones(subject, t).get(bone)!.worldPosition;
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
   * @returns Empty when clean, otherwise one prefixed summary with at most four
   *   deepest pair examples.
   * @evidence contracts/development/common.md#meaningful-documentation Names the subject, body, optional audit policy and bounded printed pair context.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates all physical tests and caller limits to the public audit. A clean report returns no complaints; a nonempty report preserves the audit description and adds up to four pair examples in millimetres.
   * @evidence contracts/development/implementation.md#efficient-algorithms Runs the audit once. Only the summary and four optional pair strings leave this helper; measurement and report cost belong to the audit owner.
   */
  export function audit(
    film: IAutoMovieMotionHumanAuditMotionType,
    label: string,
    subject: string,
    body: IAutoMovieMotionHumanBody,
    options: IAutoMovieMotionHumanAudit.IOptions = {},
  ): string[] {
    const report: IAutoMovieMotionHumanAudit.IReport =
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
                    (
                      p: IAutoMovieMotionHumanAudit.IReport["pairs"][number],
                    ): string =>
                      `${p.a} in ${p.b} ${(p.depth * 1000).toFixed(1)} mm at ${p.seconds.toFixed(2)} s`,
                  )
                  .join(", ")}]`
          }`,
        ];
  }

  /**
   * A complaint when a condition does not hold. The label may be given as a
   * function, so a label that resolves poses or formats numbers only to
   * describe a failure is built only when the condition fails.
   *
   * @param label What is expected, with its measured numbers, or what builds
   *   it.
   * @param holds Whether it holds.
   * @returns The label when it does not hold; empty when it does.
   * @evidence contracts/development/common.md#meaningful-documentation Explains the lazy label and empty versus one-complaint return.
   * @evidence contracts/development/implementation.md#principled-implementation The supplied condition directly selects the result. A failing condition uses the exact string or calls its label factory once.
   * @evidence contracts/development/implementation.md#efficient-algorithms An empty success allocates no label work. Failure cost is one caller-defined label evaluation and one returned entry.
   */
  export function expect(
    label: string | (() => string),
    holds: boolean,
  ): string[] {
    return holds ? [] : [typeof label === "string" ? label : label()];
  }
}
