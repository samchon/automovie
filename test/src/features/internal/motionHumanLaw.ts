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
 * of complaints, whole or in parts a spec each, and the gathering of every complaint of a test into one
 * assertion.
 *
 * A law test reads several measures off the same displayed frames, and one
 * frame of an arm fitted on the body costs a second, so every measure of a
 * test reads the one film {@link film} remembers.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each helper builds or measures and why the film is remembered.
 * @evidence contracts/development/implementation.md#principled-implementation Every measure reads displayed bones of the real performance through the package entry point.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Seven small helpers over `HumanPerformance` and the audit.
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
   * A part of the generic audit, so a law's audit can be read by several
   * specs each within the time a test may take: `tangle` reads the tangle
   * over the whole film, and `motion-1` to `motion-6` the audit's other
   * checks (the ground, the continuity and the balance) over one sixth of
   * the film each.
   */
  export type AuditPart = "tangle" | `motion-${1 | 2 | 3 | 4 | 5 | 6}`;

  /** The parts of the film the audit's other checks are read over: an arm's carries cost most of a film's audit, and a sixth holds at most about half of one. */
  export const PARTS: number = 6;

  /**
   * One part of the generic audit of a subject, as complaints. The sixths
   * meet at frames of the 24 Hz grid and overlap by two frames, so an
   * interval, its two neighbours and an out-and-back across a meeting are
   * read whole in one of them; each is audited as a view of the film
   * shifted to its start.
   *
   * @param film The film.
   * @param label What the complaints are prefixed with; a sixth adds its start.
   * @param subject The subject.
   * @param body Their body.
   * @param part The part.
   * @returns One complaint per finding of the part; empty when clean.
   */
  export function auditPart(
    film: IAutoMovieMotionHumanAuditMotion,
    label: string,
    subject: string,
    body: IHumanBody,
    part: AuditPart,
  ): string[] {
    if (part === "tangle")
      return audit(film, label, subject, body, {
        limits: {
          tangle: AutoMovieMotionHumanAudit.LIMITS.tangle,
          floor: null,
          slip: null,
          lift: null,
          jump: null,
          reversal: null,
          speed: null,
          balance: null,
        },
      });
    const rate: number = 24;
    const sixth: number = Number(part.slice("motion-".length)) - 1;
    const meet = (k: number): number =>
      k <= 0
        ? 0
        : k >= PARTS
          ? film.duration
          : Math.round(((film.duration * k) / PARTS) * rate) / rate;
    const from: number = Math.max(0, meet(sixth) - (sixth > 0 ? 2 / rate : 0));
    const to: number = Math.min(
      film.duration,
      meet(sixth + 1) + (sixth < PARTS - 1 ? 2 / rate : 0),
    );
    const view: IAutoMovieMotionHumanAuditMotion = {
      duration: to - from,
      bones: (who: string, seconds: number): Bones =>
        film.bones(who, from + seconds),
      segments: (who: string): IAutoMovieMotionHumanAuditMotion.ISpan[] =>
        film.segments(who).map(
          (
            span: IAutoMovieMotionHumanAuditMotion.ISpan,
          ): IAutoMovieMotionHumanAuditMotion.ISpan => ({
            ...span,
            start: span.start - from,
            entryTime: span.entryTime - from,
            end: span.end - from,
          }),
        ),
    };
    return audit(view, `${label} ${from.toFixed(3)} s on`, subject, body, {
      limits: { tangle: null },
    });
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
