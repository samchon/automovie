import type { IAutoMovieRecoveryInput } from "@automovie/interface";
import { AutoMovieRecoveryObservation } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `createRecoveryObservationPolicy` keeps an input's observation settings
 * without its mesh, and keeps a critical policy only when one is set.
 *
 * Scenarios:
 *
 * 1. An input with a critical policy keeps every setting and that policy.
 * 2. Without one, the policy is the same settings without a critical policy.
 */
export function test_recovery_internal_create_observation_policy(): void {
  const input: IAutoMovieRecoveryInput = {
    verticesMm: [[0, 0, 0]],
    triangles: [[0, 0, 0]],
    axis: [0, 0, 1],
    reference: [1, 0, 0],
    stepMm: 2,
    toleranceMm: 0.1,
    chordToleranceMm: 0.05,
    maxSections: 8,
    maxSpans: 16,
    exactCoordinateAliases: true,
    sourceOrientationSign: -1,
    cornerDegrees: 30,
    criticalPolicy: "boundary-regular-path-v1",
  };
  const {
    verticesMm: _vertices,
    triangles: _triangles,
    ...policy
  }: IAutoMovieRecoveryInput = input;
  TestValidator.equals(
    "with a critical policy",
    AutoMovieRecoveryObservation.createObservationPolicy(input),
    policy,
  );
  const { criticalPolicy: _critical, ...plain }: IAutoMovieRecoveryInput =
    input;
  const {
    criticalPolicy: _policy,
    ...plainPolicy
  }: ReturnType<typeof AutoMovieRecoveryObservation.createObservationPolicy> = policy;
  TestValidator.equals(
    "without one",
    AutoMovieRecoveryObservation.createObservationPolicy(plain),
    plainPolicy,
  );
}
