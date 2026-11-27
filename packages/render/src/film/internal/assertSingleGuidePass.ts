import type { AutoMovieGuidePass } from "@automovie/interface";

/**
 * Return the one structural pass a guide-pass deliverable declares, or throw.
 *
 * After folding repeats exactly one distinct pass must remain, so one
 * deliverable's failure can never hide inside another's output.
 * `normalizeGuidePasses` is the different, wider rule of the sequence planners,
 * which keeps any number of passes and admits `beauty`.
 */
export const assertSingleGuidePass: (
  passes: readonly Exclude<AutoMovieGuidePass, "beauty">[],
) => Exclude<AutoMovieGuidePass, "beauty"> = (
  passes: readonly Exclude<AutoMovieGuidePass, "beauty">[],
): Exclude<AutoMovieGuidePass, "beauty"> => {
  const distinct: Exclude<AutoMovieGuidePass, "beauty">[] = [];
  for (const pass of passes)
    if (distinct.includes(pass) === false) distinct.push(pass);
  if (distinct.length !== 1)
    throw new Error(
      `A guide-pass deliverable requires exactly one declared pass, but received ${distinct.length}. Declare separate deliverables when the production contract gains per-pass ownership.`,
    );
  return distinct[0]!;
};
