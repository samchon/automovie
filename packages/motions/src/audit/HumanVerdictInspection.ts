import type {
  IAutoMovieInspectionDiagnostics,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanVerdicts,
} from "@automovie/interface";

import { HumanVerdicts } from "./HumanVerdicts";

/** The bounds one performer is read on, in report order. */
const BOUNDS: readonly string[] = [
  "tangle",
  "floor",
  "slip",
  "lift",
  "jump",
  "reversal",
  "speed",
  "balance",
  "skate",
  "loose",
  "afloat",
  "statics",
  "range",
  "unloaded",
  "turn",
  "timing",
];

/** The bounds a performer the floor does not carry is not read on. */
const UNREAD: readonly string[] = [
  "floor",
  "slip",
  "lift",
  "balance",
  "skate",
  "loose",
  "afloat",
  "unloaded",
  "statics",
];

/** Each bound's unit, as its audit owner reads it. */
const UNITS: Readonly<Record<string, string>> = {
  tangle: "m",
  floor: "m",
  slip: "m",
  lift: "m",
  jump: "m",
  reversal: "m",
  speed: "m/s",
  balance: "m",
  skate: "m/s",
  loose: "m/s",
  afloat: "m",
  statics: "m",
  range: "deg",
  unloaded: "deg",
  turn: "deg",
  partner: "m",
  timing: "faults",
};
/** The alternatives of `Packet2`'s site. */
type Packet2 = "findings" | "coverage";

/** What a finding of the shared type holds before and after the collapse. */
type Packet = Pick<IAutoMovieInspectionDiagnostics, Packet2>;

/** The readings of one bound of one performer or pair, collapsed to one. */
interface IGroup {
  /** The paths the finding names. */
  paths: readonly string[];

  /** The worst reading, or the first of the faults' reading for `timing`. */
  worst: IAutoMovieMotionHumanVerdicts.IFinding;

  /** The faults of a `timing` bound; empty for every other. */
  faults: string[];
}

/**
 * The verdict report of a performance as the shared inspection findings and
 * coverage of a capture or a delivery.
 *
 * A finding's identity is its bound (`check` is `human-<bound>` and `code`
 * `<bound>-exceeded`, `human-timing` and `timing-faulty` for the schedule), the
 * performer's subject or the pair's `a+b` as its key, and the performer's
 * entity path or both paths of a pair. The action and its occurrence stay in
 * the message, so a repair that moves the worst reading into another action
 * keeps the finding. A bound read once per unsolved span (`skate`, `loose`,
 * `afloat`, `unloaded`) keeps its worst reading; the `timing` faults of one
 * performer are one finding whose rank is their count.
 *
 * ```ts
 * const { findings, coverage } = HumanVerdictInspection.read({
 *   performance,
 *   paths: { a: "film.performers[0]" },
 * });
 * ```
 */
export namespace HumanVerdictInspection {
  /**
   * Read a performance's verdicts as shared findings and coverage.
   *
   * @param source The performance and the film's entity path of each performer.
   * @returns The findings and the coverage rows of one inspection packet.
   * @throws {Error} When a performer has no path.
   */
  export function read(source: IAutoMovieMotionHumanVerdicts.ISource): Packet {
    return of(
      HumanVerdicts.of(source.performance),
      source.performance.performers.map(
        (
          person: IAutoMovieMotionHumanPerformer,
        ): IAutoMovieMotionHumanVerdicts.IPerformer => ({
          subject: person.subject,
          path: pathOf(source.paths, person.subject),
          airborne: HumanVerdicts.airborne(source.performance, person.subject),
        }),
      ),
    );
  }

  /**
   * Map a verdict report to shared findings and coverage.
   *
   * Each performer is covered on its sixteen bounds, a pair on `partner`; the
   * nine bounds the floor does not carry are `excluded` for a performer who
   * swims or climbs a ladder.
   *
   * @param report The report.
   * @param performers The report's performers in its order.
   * @returns The findings and the coverage rows of one inspection packet.
   * @throws {Error} When a finding names a performer or a pair not given.
   */
  export function of(
    report: IAutoMovieMotionHumanVerdicts.IReport,
    performers: readonly IAutoMovieMotionHumanVerdicts.IPerformer[],
  ): Packet {
    const paths: Map<string, readonly string[]> = new Map();
    const coverage: IAutoMovieInspectionDiagnostics.ICoverage[] = [];
    for (let i: number = 0; i < performers.length; i++) {
      const person: IAutoMovieMotionHumanVerdicts.IPerformer = performers[i]!;
      paths.set(person.subject, [person.path]);
      for (const bound of BOUNDS)
        coverage.push(
          person.airborne && UNREAD.includes(bound)
            ? {
                check: `human-${bound}`,
                key: person.subject,
                required: false,
                status: "excluded",
                reason: `The ${bound} bound reads a body the floor carries, and this performer swims or climbs a ladder.`,
              }
            : {
                check: `human-${bound}`,
                key: person.subject,
                required: true,
                status: "checked",
              },
        );
      for (let j: number = i + 1; j < performers.length; j++) {
        const other: IAutoMovieMotionHumanVerdicts.IPerformer = performers[j]!;
        const key: string = `${person.subject}+${other.subject}`;
        paths.set(
          key,
          [person.path, other.path].sort((x: string, y: string): number =>
            x < y ? -1 : x > y ? 1 : 0,
          ),
        );
        coverage.push({
          check: "human-partner",
          key,
          required: true,
          status: "checked",
        });
      }
    }

    const groups: Map<string, IGroup> = new Map();
    for (const finding of report.findings) {
      const named: readonly string[] | undefined = paths.get(finding.subject);
      if (named === undefined)
        throw new Error(
          `The verdict on ${finding.subject} names no performer or pair given.`,
        );
      const id: string = JSON.stringify([finding.check, finding.subject]);
      const group: IGroup | undefined = groups.get(id);
      if (group === undefined)
        groups.set(id, {
          paths: named,
          worst: finding,
          faults: finding.check === "timing" ? [finding.where] : [],
        });
      else if (finding.check === "timing") group.faults.push(finding.where);
      else if (
        finding.value > group.worst.value ||
        (finding.value === group.worst.value &&
          finding.seconds < group.worst.seconds)
      )
        group.worst = finding;
    }
    return {
      findings: [...groups.values()].map(toFinding),
      coverage,
    };
  }
}

/** One collapsed bound as a finding of the shared type. */
const toFinding = (group: IGroup): IAutoMovieInspectionDiagnostics.IFinding => {
  const { worst } = group;
  const timing: boolean = worst.check === "timing";
  const unit: string = UNITS[worst.check]!;
  const rank: number = timing ? group.faults.length : worst.value;
  return {
    check: `human-${worst.check}`,
    key: worst.subject,
    code: `${worst.check}-${timing ? "faulty" : "exceeded"}`,
    paths: group.paths,
    category: "error",
    confidence: "confirmed",
    message: timing
      ? `${worst.subject} timing: ${group.faults.join("; ")}`
      : `${worst.subject}${place(worst)} ${worst.check} ${reading(worst.value, unit)} over ${reading(worst.limit, unit)} at ${worst.seconds.toFixed(3)} s (${worst.where})`,
    witness: {
      // A non-finite angle reads infinitely out of range; a rank is finite.
      rank: Number.isFinite(rank) ? rank : Number.MAX_VALUE,
      measurements: timing
        ? [{ name: "faults", value: rank, unit }]
        : [
            {
              name: worst.check,
              value: Number.isFinite(worst.value) ? worst.value : "Infinity",
              limit: worst.limit,
              unit,
            },
            { name: "seconds", value: worst.seconds, unit: "s" },
          ],
    },
  };
};

/** The action a finding lies in, as its message names it. */
const place = (finding: IAutoMovieMotionHumanVerdicts.IFinding): string =>
  finding.act === "" ? "" : `.${finding.act}#${finding.instance}`;

/** A reading with its unit, metres in millimetres. */
const reading = (value: number, unit: string): string =>
  unit === "m"
    ? `${(value * 1000).toFixed(1)} mm`
    : `${Number.isFinite(value) ? value.toFixed(3) : "infinite"} ${unit}`;

/** The entity path of one performer. */
const pathOf = (
  paths: Readonly<Record<string, string>>,
  subject: string,
): string => {
  const path: string | undefined = paths[subject];
  if (path === undefined)
    throw new Error(`The film gives no entity path for performer ${subject}.`);
  return path;
};
