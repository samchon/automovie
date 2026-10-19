import type { IAutoMovieEllipticLoft } from "@automovie/interface";

import { fitRecoveryScalarProfiles } from "./fitRecoveryScalarProfiles";

/**
 * Fit the aligned ellipse's four scalar fields with shared cubic algebra.
 * Radius Bernstein controls must all remain positive; this sufficient whole-span
 * condition rejects a candidate instead of clamping its fitted field.
 *
 * @evidence contracts/common.md#principled-implementation The shared Householder spline fitter supplies metre Bernstein controls and rank diagnostics; positive radius controls preserve positive radii throughout each span by the Bernstein convex-hull property.
 * @evidence contracts/common.md#clear-and-simple-design This family adapter owns ellipse field ordering and positivity while shared scalar fitting owns basis, QR and exact interval conversion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No coefficient clamp, expected profile or independent per-field parameterization changes the fitted result; unsupported radius controls reject the candidate.
 * @evidence contracts/common.md#meaningful-documentation States four-field ordering, sufficient whole-span positivity and refusal without field modification; the delegated scalar owner documents units and numerical rank limits.
 * @evidence contracts/performance.md#efficient-algorithms Delegated fitting costs O(N K squared + N K F) for F=4 and K=spans+3; O(spans) mapping/positivity work is linear in required output.
 * @evidence contracts/performance.md#reuse-equivalent-work One shared fit serves all four fields and returns the same common interval/endpoint identities.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Scalar fit scratch dies with the call and mapped coefficient records transfer without handles or global retention.
 */
export function fitRecoveryImageProfiles(
  samples: readonly { yMm: number; values: [number, number, number, number] }[],
  spans: number,
  minimumRankRatio: number,
): { loft: IAutoMovieEllipticLoft; rankRatio: number } {
  const fitted: ReturnType<typeof fitRecoveryScalarProfiles> =
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
