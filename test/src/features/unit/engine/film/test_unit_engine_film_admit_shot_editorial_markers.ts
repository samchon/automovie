import { admitShotEditorialMarkers } from "@automovie/engine/internal";
import type {
  IAutoMovieConstraintViolation,
  IAutoMovieEditorialMarker,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Editorial marker admission owns the source clock and the copied authoring
 * data.
 *
 * Scenarios:
 *
 * 1. A marker can end at the shot tail, and the returned record has its own
 *    identity.
 * 2. A duplicate id, blank label and invalid interval report all source fields.
 */
export function test_unit_engine_film_admit_shot_editorial_markers(): void {
  const violations: IAutoMovieConstraintViolation[] = [];
  const marker: IAutoMovieEditorialMarker = {
    id: "beat",
    label: "Dialogue",
    startSeconds: 0,
    endSeconds: 2,
  };
  const authored: IAutoMovieEditorialMarker[] = [marker];
  const admitted: IAutoMovieEditorialMarker[] | undefined =
    admitShotEditorialMarkers(authored, 2, violations);
  TestValidator.equals("valid marker", admitted, authored);
  TestValidator.predicate(
    "the returned list and record are owned copies",
    admitted !== authored && admitted?.[0] !== marker,
  );
  TestValidator.equals("no findings on admission", violations, []);

  TestValidator.equals(
    "no partial result on refusal",
    admitShotEditorialMarkers(
      [
        marker,
        { id: "beat", label: " ", startSeconds: 2, endSeconds: 1 },
        { id: "tail", label: "Tail", startSeconds: 1, endSeconds: Infinity },
      ],
      2,
      violations,
    ),
    undefined,
  );
  TestValidator.equals(
    "precise source fields",
    violations.map(({ kind, path }) => [kind, path]),
    [
      ["type", "$input.editorialMarkers[1].label"],
      ["type", "$input.editorialMarkers[1].id"],
      ["range", "$input.editorialMarkers[1].startSeconds"],
      ["range", "$input.editorialMarkers[1].endSeconds"],
      ["range", "$input.editorialMarkers[2].endSeconds"],
    ],
  );
}
