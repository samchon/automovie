import type { IAutoMovieRecoveryContourResumeInput } from "@automovie/recovery";

/** Invalid saved bindings and target policies for selective-resume refusal.
 *
 * Scenarios:
 * 1. Preserve each original mutation, including successful/foreign/duplicate targets, stale source/frame/lineage and invalid artifact policies.
 *
 * @evidence contracts/testing.md#behavioral-verification The owning contour-resume scenario applies every returned mutation and requires refusal before any fit checkpoint.
 * @evidence contracts/testing.md#independent-expectations Each mutation violates a declared input identity, unique-address or finite-policy premise independently of computed coefficients.
 * @evidence contracts/testing.md#distinguishing-cases Separate source, selection, frame, alias, raw-publication and policy failures distinguish complete preflight from partial target fitting.
 * @evidence contracts/testing.md#execution-ownership This pure helper returns caller-owned closures; no I/O, native resource or Human fixture is used.
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
      value.targets = [...value.targets, ...value.targets];
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
      value.fitPolicies = [...value.fitPolicies, ...value.fitPolicies];
    },
    (value: IAutoMovieRecoveryContourResumeInput): void => {
      value.fitPolicies = [
        ...value.fitPolicies,
        { ...value.fitPolicies[0]!, observationIdentity: "unused-artifact" },
      ];
    },
    (value: IAutoMovieRecoveryContourResumeInput): void => {
      value.fitPolicies[0]!.toleranceMm = Number.NaN;
    },
  ];
}
