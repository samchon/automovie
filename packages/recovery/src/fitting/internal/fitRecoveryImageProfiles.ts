import type {
  IAutoMovieEllipticLoft,
  IAutoMovieRecoveryImageProfilesFittingOperation,
  IAutoMovieRecoveryScalarProfilesFittingOperation,
} from "@automovie/interface";

import { fitRecoveryScalarProfiles } from "./fitRecoveryScalarProfiles";

/*
 * Fit the aligned ellipse's four scalar fields with shared cubic algebra.
 * Radius Bernstein controls must all remain positive; this sufficient
 * whole-span condition rejects a candidate instead of clamping its fitted
 * field.
 */
export function fitRecoveryImageProfiles(
  samples: Parameters<IAutoMovieRecoveryImageProfilesFittingOperation.Operation>[0],
  spans: Parameters<IAutoMovieRecoveryImageProfilesFittingOperation.Operation>[1],
  minimumRankRatio: Parameters<IAutoMovieRecoveryImageProfilesFittingOperation.Operation>[2],
): ReturnType<IAutoMovieRecoveryImageProfilesFittingOperation.Operation> {
  const fitted: ReturnType<IAutoMovieRecoveryScalarProfilesFittingOperation.Operation> =
    fitRecoveryScalarProfiles(samples, spans, minimumRankRatio);
  const result: IAutoMovieEllipticLoft = {
    spans: fitted.spans.map(
      (
        span: (typeof fitted.spans)[number],
      ): IAutoMovieEllipticLoft["spans"][number] => {
        if (
          span.profiles.length !== 4 ||
          span.profiles
            .slice(0, 2)
            .some((profile: number[]): boolean =>
              profile.some((value: number): boolean => !(value > 0)),
            )
        )
          throw new Error(
            "unsupported-profile: fitted radius Bernstein controls must remain positive",
          );
        return {
          interval: span.interval,
          radiusX: span.profiles[0],
          radiusZ: span.profiles[1],
          centreX: span.profiles[2],
          centreZ: span.profiles[3],
        };
      },
    ),
  };
  return { loft: result, rankRatio: fitted.rankRatio };
}
