import type { IAutoMovieMotionHumanRefusal } from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";

/*
 * The missing-performer or missing-prop refusal, listing the performance's own
 * performers or props as its alternatives.
 * Parameter what: Whether a performer or a prop is missing.
 * Parameter subject: The missing subject.
 * Parameter known: The subjects of that kind the performance has.
 * Parameter axis: The refusal's axis; `what` when absent.
 * Returns: The refusal.
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

/*
 * Companion types of HumanPerformanceReadMissing.
 */
export namespace HumanPerformanceReadMissing {
  /*
   * The kinds of subject a performance read can miss.
   */
  export type What = "performer" | "prop";
}
