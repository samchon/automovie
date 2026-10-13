/** One decoded project revision record, or the refusal to read it as one. */
export type AutoMovieProjectRevisionDecision =
  | {
      /** The persisted value belongs to the project-revision domain. */
      state: "current";
      /** The current non-negative safe integer. */
      revision: number;
    }
  | {
      /** A present record did not contain one valid revision. */
      state: "invalid";
    };

/** The outcome of asking one current project revision to advance. */
export type AutoMovieProjectRevisionAdvance =
  | {
      /** The current revision has one exactly representable successor. */
      state: "next";
      /** The successor to publish after the guarded mutation succeeds. */
      revision: number;
    }
  | {
      /** The current value is outside the revision domain. */
      state: "invalid";
    }
  | {
      /** The current value is valid but has no safe-integer successor. */
      state: "exhausted";
    };

/**
 * Decode one optional project-revision record without treating malformed data
 * as the legacy missing-file default.
 */
export const decodeAutoMovieProjectRevision = (
  value: unknown,
): AutoMovieProjectRevisionDecision => {
  if (value === undefined) return { state: "current", revision: 0 };
  const revision = (value as { revision?: unknown } | null)?.revision;
  return typeof revision === "number" &&
    Number.isSafeInteger(revision) &&
    revision >= 0
    ? { state: "current", revision }
    : { state: "invalid" };
};

/**
 * Decide the next project revision before any guarded mutation writes bytes.
 */
export const advanceAutoMovieProjectRevision = (
  revision: number,
): AutoMovieProjectRevisionAdvance => {
  if (Number.isSafeInteger(revision) === false || revision < 0)
    return { state: "invalid" };
  if (revision === Number.MAX_SAFE_INTEGER) return { state: "exhausted" };
  return { state: "next", revision: revision + 1 };
};
