import type {
  IAutoMovieRecoveryCameraSceneEstimate,
  IAutoMovieRecoverySceneCandidate,
  IAutoMovieRecoverySceneRegistration,
} from "@automovie/interface";

/** Describe all requested views against the final accepted component revision. */
export function describeRecoverySceneRegistration(
  result: IAutoMovieRecoveryCameraSceneEstimate,
  support: readonly (readonly IAutoMovieRecoverySceneCandidate[])[],
): IAutoMovieRecoverySceneRegistration[] {
  const last: (number | null)[] = result.poses.map((): null => null);
  result.attempts.forEach(
    (attempt: (typeof result.attempts)[number], at: number): void => {
      last[attempt.viewIndex] = at;
    },
  );
  return result.poses.map(
    (
      pose: (typeof result.poses)[number],
      viewIndex: number,
    ): IAutoMovieRecoverySceneRegistration => {
      const candidates: number = support[viewIndex]!.length;
      const lastAttempt: number | null = last[viewIndex]!;
      if (pose !== null)
        return {
          viewIndex,
          status: "registered",
          candidates,
          lastAttempt,
          reasons: [],
        };
      if (result.registeredViews.length === 0)
        return {
          viewIndex,
          status: "not-attempted",
          candidates,
          lastAttempt,
          reasons: ["seed-component-unavailable"],
        };
      if (candidates < result.policy.minimumResectionInliers)
        return {
          viewIndex,
          status: "insufficient-support",
          candidates,
          lastAttempt,
          reasons: ["insufficient-distinct-existing-map-support"],
        };
      if (
        lastAttempt !== null &&
        result.attempts[lastAttempt]!.revision === result.revision
      )
        return {
          viewIndex,
          status: "refused",
          candidates,
          lastAttempt,
          reasons: result.attempts[lastAttempt]!.reasons.slice(),
        };
      return {
        viewIndex,
        status: "not-attempted",
        candidates,
        lastAttempt,
        reasons: [
          result.stopReason === "budget-exhausted"
            ? "scene-work-budget-exhausted-before-attempt"
            : "no-remaining-qualified-transaction",
        ],
      };
    },
  );
}
