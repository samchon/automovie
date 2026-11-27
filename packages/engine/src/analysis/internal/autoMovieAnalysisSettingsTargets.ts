import { IAutoMovieAnalysisTarget } from "@automovie/interface";

/*
 * The declared targets as they enter an analyzer's settings text.
 *
 * Each target is copied to exactly its four contract fields, `key`, `unit`,
 * `value` and `comparison`, in that order and in list order. Extra runtime
 * properties and original property order are ignored; changes to covered JSON
 * values change the settings text, while signed zeros share an encoding and a
 * digest is not a collision-free identity proof.
 * Parameter targets: Targets the study declares, already checked.
 * Returns: New records holding only the four contract fields.
 */
export function autoMovieAnalysisSettingsTargets(
  targets: readonly IAutoMovieAnalysisTarget[],
): IAutoMovieAnalysisTarget[] {
  return targets.map(
    (target: IAutoMovieAnalysisTarget): IAutoMovieAnalysisTarget => ({
      key: target.key,
      unit: target.unit,
      value: target.value,
      comparison: target.comparison,
    }),
  );
}
