import type { IAutoMovieMotionHumanRefusal } from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";

/**
 * The missing-performer or missing-prop refusal, listing the performance's own
 * performers or props as its alternatives.
 *
 * @param what Whether a performer or a prop is missing.
 * @param subject The missing subject.
 * @param known The subjects of that kind the performance has.
 * @param axis The refusal's axis; `what` when absent.
 * @returns The refusal.
 */
export function HumanPerformanceReadMissing(
  what: HumanPerformanceReadMissing.What,
  subject: string,
  known: readonly string[],
  axis: string = what,
): IAutoMovieMotionHumanRefusal {
  return new HumanRefusal({
    kind: what === "prop" ? "affordance" : "participant",
    axis,
    value: subject,
    feasible: { kind: "alternatives", values: known },
    reason: `the performance has no ${what} named ${subject}`,
    fix: `name one of the performance's ${what}s, or add ${subject} to them`,
  });
}

/** Companion types of {@link HumanPerformanceReadMissing}. */
export namespace HumanPerformanceReadMissing {
  /** The kinds of subject a performance read can miss. */
  export type What = "performer" | "prop";
}
