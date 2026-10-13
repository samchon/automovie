import {
  AUTO_MOVIE_AUTHORING_PRODUCTION_KINDS,
  AUTO_MOVIE_AUTHORING_REACHABILITY,
  AUTO_MOVIE_CAMERA_ACTIONS,
  inspectAutoMovieAuthoringReachability,
  isAutoMovieAuthoringProductionKind,
} from "@automovie/template";
import { TestValidator } from "@nestia/e2e";

/**
 * Author discovery publishes immutable routes for film, brief and reusable
 * libraries, keeping actual consumers separate from truthful inapplicability.
 *
 * Scenarios:
 *
 * 1. Public kind and camera grammars retain their closed order and frozen arrays.
 * 2. Every published row is frozen and passes the same complete route inspector.
 * 3. Timed productions own film and camera routes; libraries keep common source
 *    capabilities and explicitly refuse timed-only design and acceptance rows.
 * 4. Unknown, non-string and prototype-inherited kind names remain unsupported.
 */
export const test_template_authoring_reachability = (): void => {
  TestValidator.equals("production kind order", AUTO_MOVIE_AUTHORING_PRODUCTION_KINDS,
    ["film", "brief", "library"]);
  TestValidator.equals("executable camera actions", AUTO_MOVIE_CAMERA_ACTIONS,
    ["static", "follow", "orbit", "push-in", "truck", "whip"]);
  TestValidator.predicate("public inventories and rows are frozen",
    Object.isFrozen(AUTO_MOVIE_AUTHORING_PRODUCTION_KINDS) &&
    Object.isFrozen(AUTO_MOVIE_CAMERA_ACTIONS) &&
    Object.isFrozen(AUTO_MOVIE_AUTHORING_REACHABILITY) &&
    AUTO_MOVIE_AUTHORING_REACHABILITY.every(Object.isFrozen));
  TestValidator.equals("complete advertised routes admit",
    inspectAutoMovieAuthoringReachability(AUTO_MOVIE_AUTHORING_REACHABILITY), []);
  for (const kind of AUTO_MOVIE_AUTHORING_PRODUCTION_KINDS) {
    TestValidator.predicate("published kind is supported", isAutoMovieAuthoringProductionKind(kind));
    const rows = AUTO_MOVIE_AUTHORING_REACHABILITY.filter((row) => row.kind === kind);
    const settings = rows.find((row) => row.capability === "settings")!;
    TestValidator.predicate("common routes remain available",
      settings.inapplicableReason === null && settings.owner !== null && settings.consumer !== null);
    const camera = rows.find((row) => row.capability === "camera-actions")!;
    const field = rows.find((row) => row.capability === "production-design-field")!;
    TestValidator.predicate("field population is present", field.field !== null);
    if (kind === "library") {
      TestValidator.predicate("library timed routes are explicitly inapplicable",
        camera.inapplicableReason !== null && field.inapplicableReason !== null &&
        camera.choices === null && camera.route === null && field.input === null);
    } else {
      TestValidator.predicate("timed routes retain the public camera grammar",
        camera.inapplicableReason === null && camera.choices === AUTO_MOVIE_CAMERA_ACTIONS &&
        field.inapplicableReason === null);
      const sources = rows.find((row) => row.capability === "film-sources")!;
      TestValidator.equals("timed source ownership", sources.owner,
        kind === "film" ? "docs/final/screenplays" : "docs/briefs");
    }
  }
  for (const value of [null, undefined, 3, {}, "unknown", "toString", "__proto__"])
    TestValidator.equals("unsupported kind stays false", isAutoMovieAuthoringProductionKind(value), false);
};
