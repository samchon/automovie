import type { IAutoMovieRecoveryContourResumeInput } from "@automovie/interface";

/** Invalid saved bindings and target policies for selective-resume refusal.
 *
 * Scenarios:
 * 1. Preserve each original binding mutation: successful and foreign targets, stale source/frame/lineage and missing, foreign or unused artifact policies.
 *
 * @evidence contracts/development/testing.md#behavioral-verification The owning contour-resume scenario applies every returned mutation and requires refusal before any fit checkpoint.
 * @evidence contracts/development/testing.md#independent-expectations Each mutation breaks a saved binding, a target's failed raw address or an artifact policy's binding, independently of computed coefficients.
 * @evidence contracts/development/testing.md#distinguishing-cases Separate source, selection, frame, alias, raw-publication and policy failures distinguish complete preflight from partial target fitting.
 * @evidence contracts/development/testing.md#execution-ownership This pure helper returns caller-owned closures; no I/O, native resource or Human fixture is used.
 */
export function createRecoveryContourResumeMutations(): Array<
  (value: IAutoMovieRecoveryContourResumeInput) => void
> {
  return [
    (value: IAutoMovieRecoveryContourResumeInput): void => {
      value.targets = [{ coordinateMm: 1, contourIndex: 0 }];
    },
    (value: IAutoMovieRecoveryContourResumeInput): void => {
      value.targets = [{ coordinateMm: 2, contourIndex: 1 }];
    },

    (value: IAutoMovieRecoveryContourResumeInput): void => {
      value.savedSections[0]!.sourceLineage =
        value.savedSections[0]!.sourceLineage.slice(1);
    },
    (value: IAutoMovieRecoveryContourResumeInput): void => {
      Object.assign(value.savedSections[0]!.sourceLineage[1]!, {
        exactSourceTriangleIds: [0],
      });
    },
    (value: IAutoMovieRecoveryContourResumeInput): void => {
      value.savedSections[0]!.sourceIdentity = "stale-source";
    },
    (value: IAutoMovieRecoveryContourResumeInput): void => {
      value.savedSections[0]!.sourceSelectionIdentity = "stale-selection";
    },
    (value: IAutoMovieRecoveryContourResumeInput): void => {
      value.savedSections[0]!.frame = {
        ...value.savedSections[0]!.frame,
        n: [0, -1, 0],
      };
    },
    (value: IAutoMovieRecoveryContourResumeInput): void => {
      value.savedSections[0]!.exactCoordinateAliases = true;
    },
    (value: IAutoMovieRecoveryContourResumeInput): void => {
      value.fitPolicies = [];
    },
    (value: IAutoMovieRecoveryContourResumeInput): void => {
      value.fitPolicies[0]!.observationIdentity = "different-artifact";
    },

    (value: IAutoMovieRecoveryContourResumeInput): void => {
      value.fitPolicies = [
        ...value.fitPolicies,
        { ...value.fitPolicies[0]!, observationIdentity: "unused-artifact" },
      ];
    },

  ];
}
