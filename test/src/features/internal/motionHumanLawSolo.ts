import {
  AutoMovieMotionHumanAudit,
  AutoMovieMotionHumanAuditDifference,
  HumanChain,
  IAutoMovieMotionHumanAuditMotion,
  type IHumanBody,
} from "@automovie/motions";

import { motionHumanBody } from "./motionHumanBody";
import { motionHumanLaw } from "./motionHumanLaw";

/**
 * Everything any action a person performs alone from quiet standing owes on
 * screen, read off the displayed bones of a body at the origin heading +Z,
 * as complaints.
 *
 * 1. The generic audit over the whole film is clean, but for the checks the
 *    row leaves unread, each with its stated reason (a jump is meant to
 *    leave the floor's support, a lying body is not balanced on its feet).
 * 2. The film is deterministic: performed again with the same seed, every
 *    joint centre is where it was, read 4 times a second, and the film is as
 *    long.
 * 3. A row that returns to standing ends with every joint centre within 10
 *    mm of where it began.
 * 4. A row with a counted measure dips below the middle of that measure's
 *    range its count of times, on the 48 Hz grid: the repetitions asked for
 *    are the repetitions shown.
 * 5. The row's own intent, when it states one.
 *
 * @param row The row.
 * @param name The body.
 * @returns One complaint per expectation that does not hold, with its measured numbers; empty when the row is right.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists every expectation with its bound.
 * @evidence contracts/development/implementation.md#principled-implementation Each expectation is a physical requirement, the request's own count or a repeat of the same film, read off displayed bones.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One film, then one block per expectation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every expectation is evaluated and reported; a refused plan is a complaint, not a skip.
 * @evidence contracts/development/implementation.md#efficient-algorithms Every expectation on the grid reads the film's remembered frames.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `motionHumanLaw` for the film and the audit.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The films are local and released on return.
 */
export function motionHumanLawSolo(
  row: motionHumanLawSolo.IRow,
  name: motionHumanBody.Name = "m-average",
): string[] {
  const body: IHumanBody = motionHumanBody(name);
  const label: string = `${row.label} on ${name}`;
  const perform = (): motionHumanLaw.IFilm =>
    motionHumanLaw.perform(
      "solo",
      [{ subject: "a", body }],
      HumanChain.subject("a").act(row.law, row.params),
    );
  let film: motionHumanLaw.IFilm;
  try {
    film = perform();
  } catch (error) {
    return [`${label}: refused, ${(error as Error).message}`];
  }
  const out: string[] = [];
  try {
    const limits: Partial<AutoMovieMotionHumanAudit.ILimits> = {};
    for (const check of Object.keys(
      row.unread ?? {},
    ) as AutoMovieMotionHumanAudit.Check[])
      limits[check] = null;
    out.push(...motionHumanLaw.audit(film, label, "a", body, { limits }));

    const again: AutoMovieMotionHumanAuditDifference.IResult =
      AutoMovieMotionHumanAuditDifference.measure(film, perform(), "a", {
        rate: 4,
      });
    out.push(
      ...motionHumanLaw.expect(
        `${label}: the same seed differs by ${(again.distance.value * 1000).toFixed(3)} mm at ${again.distance.seconds.toFixed(2)} s (${again.distance.where}) and ${again.duration.toFixed(4)} s`,
        again.distance.value <= 1e-9 && again.duration <= 1e-9,
      ),
    );

    if (row.returns === true) {
      const first: motionHumanLaw.Bones = film.bones("a", 0);
      const last: motionHumanLaw.Bones = film.bones("a", film.duration);
      let worst: number = 0;
      let where: string = "none";
      for (const [bone, resolved] of first) {
        const p = resolved.worldPosition;
        const q = last.get(bone)!.worldPosition;
        const value: number = Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
        if (value > worst) {
          worst = value;
          where = bone;
        }
      }
      out.push(
        ...motionHumanLaw.expect(
          `${label}: ends ${(worst * 1000).toFixed(1)} mm from where it began (${where}), limit 10`,
          worst <= 0.01,
        ),
      );
    }

    if (row.counted !== undefined) {
      const values: number[] = IAutoMovieMotionHumanAuditMotion.grid(
        0,
        film.duration,
        48,
      ).map((t: number): number => row.counted!.read(film.bones("a", t)));
      const middle: number = (Math.max(...values) + Math.min(...values)) / 2;
      let dips: number = 0;
      for (let i: number = 1; i < values.length; i++)
        if (values[i - 1]! >= middle && values[i]! < middle) dips++;
      out.push(
        ...motionHumanLaw.expect(
          `${label}: ${row.counted.what} ${dips} times, asked ${row.counted.count}`,
          dips === row.counted.count,
        ),
      );
    }

    if (row.intent !== undefined)
      out.push(
        ...row
          .intent(film, body)
          .map((line: string): string => `${label}: ${line}`),
      );
  } catch (error) {
    out.push(`${label}: threw, ${(error as Error).message}`);
  }
  return out;
}
/**
 * Companion types of {@link motionHumanLawSolo}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each member of a row.
 * @evidence contracts/development/design.md#principled-representation A row is the action as an author writes it, plus what the generic reading cannot know about it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the solo checker and written by its tables only.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An unread check must carry its reason; nothing is skipped silently.
 */
export namespace motionHumanLawSolo {
  /** One action performed alone. */
  export interface IRow {
    /** The row's name in complaints. */
    label: string;

    /** The action. */
    law: Parameters<HumanChain["act"]>[0];

    /** Its parameters. */
    params: object;

    /** The audit checks the action is not owed, each with the reason. */
    unread?: Partial<Record<AutoMovieMotionHumanAudit.Check, string>>;

    /** Whether the action ends in the quiet standing it began from. */
    returns?: boolean;

    /** A measure that dips once per repetition. */
    counted?: {
      /** What dips, for the complaint. */
      what: string;

      /** The measure at an instant. */
      read: (bones: motionHumanLaw.Bones) => number;

      /** The repetitions asked for. */
      count: number;
    };

    /** The action's own expectations, as complaints. */
    intent?: (film: motionHumanLaw.IFilm, body: IHumanBody) => string[];
  }
}
