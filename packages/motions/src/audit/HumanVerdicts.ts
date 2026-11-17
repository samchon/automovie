import { ROM_TOLERANCE } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanAudit,
  IAutoMovieMotionHumanAuditContact,
  IAutoMovieMotionHumanAuditMeasure,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanAuditRange,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanPropOutcome,
  IAutoMovieMotionHumanVerdicts,
} from "@automovie/interface";

import { HumanBound } from "../law/HumanBound";
import { AutoMovieMotionHumanAudit } from "./AutoMovieMotionHumanAudit";
import { AutoMovieMotionHumanAuditContact } from "./AutoMovieMotionHumanAuditContact";
import { AutoMovieMotionHumanAuditPartner } from "./AutoMovieMotionHumanAuditPartner";
import { AutoMovieMotionHumanAuditRange } from "./AutoMovieMotionHumanAuditRange";
import { AutoMovieMotionHumanAuditSpin } from "./AutoMovieMotionHumanAuditSpin";
import { AutoMovieMotionHumanAuditStatics } from "./AutoMovieMotionHumanAuditStatics";
import { AutoMovieMotionHumanAuditTiming } from "./AutoMovieMotionHumanAuditTiming";

/**
 * The verdict report of a performance: every physical bound that holds for
 * any human motion whatever it means to do, read on the film a composition
 * gives, with each finding placed on the performer and the action it
 * happens in.
 *
 * A composition that plans is not yet a composition that performs well: a
 * hand may pass through a hip, a foot may skate. A production checks its own
 * scene with this report before it looks at a single frame, and a scene is
 * accepted only when the report is clean, a cited signature value holds
 * (`HumanSignature`) and the stills show no flaw.
 *
 * ```ts
 * const report = HumanVerdicts.of(performance);
 * if (!report.clean) throw new Error(HumanVerdicts.describe(report));
 * ```
 *
 * The bounds, the ones the vocabulary's own sweep holds every action to:
 *
 * - `timing`: every declared contact window and event is well formed.
 * - `tangle`: no part of a body passes more than 10 mm into another part of
 *   it (the skin's give where a hand rests on the body).
 * - `floor`, `slip`, `lift`: nothing sinks under the floor, and a planted
 *   foot neither slides nor leaves it, each within 5 mm.
 * - `jump`, `reversal`, `speed`: every joint centre travels a continuous
 *   path with no out-and-back spike and no impossible speed.
 * - `balance`: while both feet alone bear the body, its extrapolated centre
 *   of mass stays over them.
 * - `skate`, `loose`, `afloat`: a foot the motion shows on the floor does
 *   not skate, and a declared plant is neither loose nor afloat.
 * - `statics`: while a held body's bearing contacts all declare their load,
 *   the load-weighted contact centre lies under the centre of mass within
 *   2 % of stature (`AutoMovieMotionHumanAuditStatics`).
 * - `range`: every joint stays within its range of motion, within
 *   `ROM_TOLERANCE` (0.01 degrees).
 * - `unloaded`: a foot no plant on the ground holds dorsiflexes no further
 *   than an ankle bearing no weight does (`ANKLE_DORSIFLEXION.unloaded`),
 *   within `ROM_TOLERANCE`.
 * - `turn`: no bone spins more than 5 turns a second between frames.
 * - `partner`: two people do not pass more than 10 mm into each other.
 *
 * A performer who swims or climbs a ladder is not carried by the floor, so
 * the floor, plant and balance bounds are left unread for that performer.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists every bound with its limit, who reads the report and what it leaves unread.
 * @evidence contracts/development/implementation.md#principled-implementation Each bound is read by its audit owner; this owner applies the limits, places each finding on its action and gathers them.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the performers, one over their pairs, and a describer.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A bound is left unread only for the two actions the floor does not carry, named in one table.
 * @evidence contracts/development/implementation.md#efficient-algorithms Every bound reads one film that remembers each instant's bones.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The film is resolved once per instant and shared by every bound of every performer.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The remembered frames live for one report and are released with it.
 */
export namespace HumanVerdicts {
  /** The depth a pressed skin gives, metres: how far two bodies may enter each other. */
  export const SKIN: number = 0.01;

  /** The actions whose body the floor does not carry. */
  export const AIRBORNE: readonly string[] = ["swim", "climbLadder"];

  /**
   * Read every bound on a performance, or on one span of its film.
   *
   * A span lets a long film be read in parts, each by its own caller: the
   * bounds are read over the span as a film of its own, starting at its
   * `from`, and every finding is placed at its film second. A bound that
   * reads a step between frames reads it only where both frames lie in the
   * span, so parts that are to cover a film whole overlap by two frames of
   * the grid. The timing faults belong to the schedule, not to a span, and
   * are read whatever the span.
   *
   * @param performance The performance.
   * @param rate Grid samples per second for the bounds read on a grid; 24 when absent.
   * @param span The film seconds the bounds are read over; the whole film when absent.
   * @returns The report.
   * @throws {HumanRefusal} When the span does not lie within the film or ends before it starts.
   */
  export function of(
    performance: IAutoMovieMotionHumanPerformance,
    rate: number = 24,
    span?: IAutoMovieMotionHumanVerdicts.IOfSpan,
  ): IAutoMovieMotionHumanVerdicts.IReport {
    const from: number = span?.from ?? 0;
    const to: number = span?.to ?? performance.duration;
    HumanBound.within("span.from", from, 0, performance.duration, "s");
    HumanBound.within("span.to", to, from, performance.duration, "s");
    const motion: IAutoMovieMotionHumanAuditMotion = shifted(
      remember(performance),
      from,
      to,
    );
    const posed: IAutoMovieMotionHumanAuditRange.IPosed = {
      duration: to - from,
      pose: (
        subject: string,
        seconds: number,
      ): ReturnType<IAutoMovieMotionHumanAuditRange.IPosed["pose"]> =>
        performance.pose(subject, from + seconds),
    };
    const people: readonly IAutoMovieMotionHumanPerformer[] =
      performance.performers;
    const findings: IAutoMovieMotionHumanVerdicts.IFinding[] = [];
    const place = (
      subject: string,
      seconds: number,
    ): Pick<IAutoMovieMotionHumanVerdicts.IFinding, "act" | "instance"> => {
      const spans = performance.segments(subject);
      const span = [...spans]
        .reverse()
        .find((s): boolean => s.entryTime <= seconds + 1e-9);
      if (span === undefined) return { act: "", instance: 0 };
      return {
        act: span.name,
        instance: spans.filter(
          (s): boolean => s.id === span.id && s.index <= span.index,
        ).length,
      };
    };
    const measured = (
      subject: string,
      owner: string,
      check: string,
      measure: IAutoMovieMotionHumanAuditMeasure,
      limit: number,
    ): void => {
      if (measure.value > limit + 1e-9)
        findings.push({
          check,
          subject,
          ...place(owner, from + measure.seconds),
          value: measure.value,
          limit,
          seconds: from + measure.seconds,
          where: measure.where,
        });
    };

    for (const person of people) {
      const who: string = person.subject;
      const spans = performance.segments(who);
      const airborne: boolean = spans.some((s): boolean =>
        AIRBORNE.includes(s.law.family ?? s.name),
      );
      for (const fault of AutoMovieMotionHumanAuditTiming.faults(spans))
        findings.push({
          check: "timing",
          subject: who,
          act: "",
          instance: 0,
          value: 0,
          limit: 0,
          seconds: 0,
          where: fault,
        });
      const report: IAutoMovieMotionHumanAudit.IReport =
        AutoMovieMotionHumanAudit.run(motion, who, person.body, {
          rate,
          limits: airborne
            ? { floor: null, slip: null, lift: null, balance: null }
            : {},
        });
      for (const finding of report.findings)
        measured(who, who, finding.check, finding, finding.limit);
      if (!airborne) {
        const contact: IAutoMovieMotionHumanAuditContact.IResult =
          AutoMovieMotionHumanAuditContact.measure(motion, who, person.body);
        for (const check of ["skate", "loose", "afloat"] as const)
          measured(
            who,
            who,
            check,
            contact[check],
            check === "afloat"
              ? AutoMovieMotionHumanAuditContact.HEIGHT
              : AutoMovieMotionHumanAuditContact.SPEED,
          );
        measured(
          who,
          who,
          "statics",
          AutoMovieMotionHumanAuditStatics.measure(
            motion,
            who,
            person.body,
            rate,
          ),
          AutoMovieMotionHumanAuditStatics.SHARE * person.body.measure.stature,
        );
        measured(
          who,
          who,
          "unloaded",
          AutoMovieMotionHumanAuditRange.unloaded(motion, posed, who, rate)
            .overshoot,
          ROM_TOLERANCE,
        );
      }
      measured(
        who,
        who,
        "range",
        AutoMovieMotionHumanAuditRange.measure(posed, who, rate).overshoot,
        ROM_TOLERANCE,
      );
      measured(
        who,
        who,
        "turn",
        AutoMovieMotionHumanAuditSpin.measure(motion, who).turn,
        5,
      );
    }
    for (let i: number = 0; i < people.length; i++)
      for (let j: number = i + 1; j < people.length; j++)
        measured(
          `${people[i]!.subject}+${people[j]!.subject}`,
          people[i]!.subject,
          "partner",
          AutoMovieMotionHumanAuditPartner.measure(
            motion,
            people[i]!,
            people[j]!,
            rate,
          ).worst,
          SKIN,
        );

    // Every launched prop's flights, those still airborne at the end apart.
    const launched: Set<string> = new Set();
    for (const person of people)
      for (const s of performance.segments(person.subject))
        for (const l of s.plan.launches ?? []) launched.add(l.prop);
    const unended: string[] = [];
    for (const prop of launched)
      for (const f of performance.flights(prop)) {
        const last: IAutoMovieMotionHumanPropOutcome.ILeg | undefined =
          f.legs?.at(-1);
        if (
          f.supersededAt === undefined &&
          (f.end === Infinity ||
            (last?.segment.kind === "flight" && last.end === Infinity))
        )
          unended.push(`${prop}@${f.launch.toFixed(3)}`);
      }
    return { clean: findings.length === 0, findings, unended };
  }

  /**
   * One line per finding, for a failed assertion's message.
   *
   * @param report A report.
   * @returns `clean`, or each finding as `subject.act#instance check value over limit at seconds (where)`.
   */
  export function describe(
    report: IAutoMovieMotionHumanVerdicts.IReport,
  ): string {
    if (report.clean) return "clean";
    return report.findings
      .map((f: IAutoMovieMotionHumanVerdicts.IFinding): string => {
        const place: string =
          f.act === "" ? f.subject : `${f.subject}.${f.act}#${f.instance}`;
        return f.check === "timing"
          ? `${place} timing ${f.where}`
          : `${place} ${f.check} ${f.value.toFixed(4)} over ${f.limit} at ${f.seconds.toFixed(2)} s (${f.where})`;
      })
      .join("; ");
  }
}

/**
 * A motion's span from `from` to `to` as a motion of its own: its seconds
 * start at `from`, and its actions' spans are moved by as much.
 */
const shifted = (
  motion: IAutoMovieMotionHumanAuditMotion,
  from: number,
  to: number,
): IAutoMovieMotionHumanAuditMotion =>
  from === 0 && to === motion.duration
    ? motion
    : {
        duration: to - from,
        bones: (
          subject: string,
          seconds: number,
        ): ReturnType<IAutoMovieMotionHumanAuditMotion["bones"]> =>
          motion.bones(subject, from + seconds),
        segments: (subject: string): IAutoMovieMotionHumanAuditMotion.ISpan[] =>
          motion.segments(subject).map(
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

/** The performance as a motion that resolves each person's instant once, for the span of one report. */
const remember = (
  performance: IAutoMovieMotionHumanPerformance,
): IAutoMovieMotionHumanAuditMotion => {
  const known: Map<
    string,
    ReturnType<IAutoMovieMotionHumanAuditMotion["bones"]>
  > = new Map();
  return {
    duration: performance.duration,
    segments: (subject: string) => performance.segments(subject),
    bones: (
      subject: string,
      seconds: number,
    ): ReturnType<IAutoMovieMotionHumanAuditMotion["bones"]> => {
      const key: string = `${subject}@${seconds}`;
      let bones:
        | ReturnType<IAutoMovieMotionHumanAuditMotion["bones"]>
        | undefined = known.get(key);
      if (bones === undefined) {
        bones = performance.bones(subject, seconds);
        known.set(key, bones);
      }
      return bones;
    },
  };
};
