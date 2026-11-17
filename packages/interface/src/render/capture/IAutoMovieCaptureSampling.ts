/**
 * The seconds a capture draws besides its event windows.
 *
 * `even` samples `[from, to)` every `1 / rate` seconds, each sample moved to the nearest frame of the subject's grid so it is a frame the subject encodes; `to` null runs to the subject's end. `at` draws the given seconds exactly as written.
 *
 * The parser admits finite nonnegative seconds, a positive rate and a nonempty explicit list; frame planning checks the subject's duration and grid. The list is caller-owned and borrowed by planning.
 *
 * @evidence contracts/development/design.md#principled-representation The two ways to choose seconds need different data, so they are a union keyed by `kind`, and a request cannot give a rate with explicit seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The capture grammar and frame planner exchange the sampling policy independently of the remaining capture request.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The subject's end is null rather than a number guessed before the subject is known.
 * @evidence contracts/development/common.md#meaningful-documentation States each form's rule, units and what a null end means.
 */
export type IAutoMovieCaptureSampling =
  | {
      /** Samples at an even rate. */
      kind: "even";

      /** First second, inclusive, zero or more. */
      from: number;

      /** End second, exclusive, or null for the subject's end. */
      to: number | null;

      /** Stills per second, positive. */
      rate: number;
    }
  | {
      /** Explicit seconds. */
      kind: "at";

      /** The seconds, in the order written, at least one. */
      seconds: number[];
    };
