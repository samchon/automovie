import type { HumanPerformance } from "../perform/HumanPerformance";
import type { IHumanPerformer } from "../perform/IHumanPerformer";
import { AutoMovieMotionHumanAudit } from "./AutoMovieMotionHumanAudit";
import { AutoMovieMotionHumanAuditContact } from "./AutoMovieMotionHumanAuditContact";
import { AutoMovieMotionHumanAuditPartner } from "./AutoMovieMotionHumanAuditPartner";
import { AutoMovieMotionHumanAuditRange } from "./AutoMovieMotionHumanAuditRange";
import { AutoMovieMotionHumanAuditSpin } from "./AutoMovieMotionHumanAuditSpin";
import { AutoMovieMotionHumanAuditTiming } from "./AutoMovieMotionHumanAuditTiming";
import type { IAutoMovieMotionHumanAuditMeasure } from "./IAutoMovieMotionHumanAuditMeasure";
import type { IAutoMovieMotionHumanAuditMotion } from "./IAutoMovieMotionHumanAuditMotion";

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
 * - `range`: every joint stays within its range of motion, within 0.01.
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

  /** A bound that does not hold. */
  export interface IFinding {
    /** The bound. */
    check: string;

    /** The performer, or `a+b` for a bound between two. */
    subject: string;

    /** The action the finding's instant lies in; empty before the performer's first action or for a bound read over the whole film. */
    act: string;

    /** Which occurrence of that action in the performer's chain, from 1; 0 when `act` is empty. */
    instance: number;

    /** The reading; for `timing`, 0. */
    value: number;

    /** The limit it exceeds; for `timing`, 0. */
    limit: number;

    /** The film second of the reading. */
    seconds: number;

    /** What the reading is of: a bone, a pair of parts, or the fault's text. */
    where: string;
  }

  /** The report of a performance. */
  export interface IReport {
    /** Whether every bound holds. */
    clean: boolean;

    /** The bounds that do not hold, performer by performer in the order they were given. */
    findings: IFinding[];
  }

  /**
   * Read every bound on a performance.
   *
   * @param performance The performance.
   * @param rate Grid samples per second for the bounds read on a grid; 24 when absent.
   * @returns The report.
   */
  export function of(
    performance: HumanPerformance,
    rate: number = 24,
  ): IReport {
    const motion: IAutoMovieMotionHumanAuditMotion = remember(performance);
    const people: readonly IHumanPerformer[] = performance.performers;
    const findings: IFinding[] = [];
    const place = (
      subject: string,
      seconds: number,
    ): Pick<IFinding, "act" | "instance"> => {
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
          ...place(owner, measure.seconds),
          value: measure.value,
          limit,
          seconds: measure.seconds,
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
      const report: AutoMovieMotionHumanAudit.IReport =
        AutoMovieMotionHumanAudit.run(motion, who, person.body, {
          rate,
          limits: airborne
            ? { floor: null, slip: null, lift: null, balance: null }
            : {},
        });
      for (const finding of report.findings)
        measured(who, who, finding.check, finding, finding.limit);
      if (!airborne) {
        const contact: AutoMovieMotionHumanAuditContact.IResult =
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
      }
      measured(
        who,
        who,
        "range",
        AutoMovieMotionHumanAuditRange.measure(performance, who, rate)
          .overshoot,
        0.01,
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
    return { clean: findings.length === 0, findings };
  }

  /**
   * One line per finding, for a failed assertion's message.
   *
   * @param report A report.
   * @returns `clean`, or each finding as `subject.act#instance check value over limit at seconds (where)`.
   */
  export function describe(report: IReport): string {
    if (report.clean) return "clean";
    return report.findings
      .map((f: IFinding): string => {
        const place: string =
          f.act === "" ? f.subject : `${f.subject}.${f.act}#${f.instance}`;
        return f.check === "timing"
          ? `${place} timing ${f.where}`
          : `${place} ${f.check} ${f.value.toFixed(4)} over ${f.limit} at ${f.seconds.toFixed(2)} s (${f.where})`;
      })
      .join("; ");
  }
}

/** The performance as a motion that resolves each person's instant once, for the span of one report. */
const remember = (
  performance: HumanPerformance,
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
