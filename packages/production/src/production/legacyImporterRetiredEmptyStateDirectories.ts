

/**
 * The complete empty review-directory population emitted by older imported state before the review ledger was retired. Exact verification accepts all of it or none, and still refuses any unexpected file or partial directory set.
 */
export const legacyImporterRetiredEmptyStateDirectories: Set<string> = new Set([
  "reviews",
  "reviews/design",
  "reviews/design/models",
  "reviews/design/formations",
  "reviews/design/shots",
  "reviews/design/acceptances",
  "reviews/source",
  "reviews/shots",
  "reviews/film",
]);
