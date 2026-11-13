import { AUTO_MOVIE_INSPECTION_KEYS } from "../scene/inspection/AUTO_MOVIE_INSPECTION_KEYS.js";

/**
 * Every key `parseAutoMovieCapturePlanRequest` reads, in the order `formatAutoMovieCapturePlanRequest` writes them: the capture's own keys, then `AUTO_MOVIE_INSPECTION_KEYS`.
 *
 * A host maps its source of text onto these names and nothing else, so the page's address, the command line and a component's props offer the same options under the same names, and a test enumerates them against each host's mapping.
 */
export const AUTO_MOVIE_CAPTURE_PLAN_KEYS: readonly string[] = [
  "subject",
  "from",
  "to",
  "rate",
  "at",
  "events",
  "window",
  "threshold",
  "views",
  "passes",
  "sweep",
  "margin",
  "longest",
  "smallest",
  "reduction",
  "round",
  "compare",
  "tolerance",
  ...AUTO_MOVIE_INSPECTION_KEYS,
];
