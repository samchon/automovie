import { AutoMovieRenderInspectionKeys } from "../scene/AutoMovieRenderInspectionKeys";

/**
 * Every key `parseCapturePlanRequest` reads, in the order
 * `formatCapturePlanRequest` writes them: the capture's own keys, then
 * `AutoMovieRenderInspectionKeys`.
 *
 * A host maps its source of text onto these names and nothing else, so the
 * page's address, the command line and a component's props offer the same
 * options under the same names, and a test enumerates them against each host's
 * mapping.
 */
export const AutoMovieRenderCapturePlanKeys: readonly string[] = [
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
  ...AutoMovieRenderInspectionKeys,
];
