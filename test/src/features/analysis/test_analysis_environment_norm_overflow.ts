import { AutoMovieEngineEnvironment } from "@automovie/engine";
import type {
  IAutoMovieEnvironmentContext,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { analysisContext } from "../internal/analysisContext";
import { hasViolation } from "../internal/predicates";

/**
 * A direction with finite components cannot bypass the horizon rule through an overflowing norm.
 *
 * Scenarios:
 * 1. Overflowing site north, ground up and sun directions are refused at their vector paths.
 * 2. Large directions with representable norms keep above-horizon acceptance and below-horizon beam refusal.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Exercises the real environment validator and requires located range violations for overflowing norms, catching the former silent usable-direction skip.
 * @evidence contracts/development/testing.md#independent-expectations Two Number.MAX_VALUE components have an unrepresentable Euclidean norm; vertical finite rescaling preserves the sign of solar elevation. Expected paths follow the public validator contract.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers all three direction owners, nonzero positive beam, representable large positive and negative sun, and a valid rescaled ground normal. Existing context tests own component NaN and zero-length admission.
 * @evidence contracts/development/testing.md#execution-ownership The portable entry constructs local site records and invokes the validator without external weather, a renderer or a host.
 * @evidence contracts/development/common.md#meaningful-documentation Names each overflow path and the accepted/rejected finite twins.
 */
export function test_analysis_environment_norm_overflow(): void {
  for (const field of ["north", "ground", "sun"] as const) {
    const context: IAutoMovieEnvironmentContext = analysisContext();
    const direction: IAutoMovieVector3 = {
      x: Number.MAX_VALUE,
      y: -Number.MAX_VALUE,
      z: 0,
    };
    if (field === "north") context.north = direction;
    else if (field === "ground") context.ground.up = direction;
    else context.instants[0]!.sun = direction;
    const location: string =
      field === "north"
        ? "$input.north"
        : field === "ground"
          ? "$input.ground.up"
          : "$input.instants[0].sun";
    TestValidator.predicate(
      `overflowing ${field} is refused`,
      hasViolation(
        AutoMovieEngineEnvironment.validateContext({ context }),
        "range",
        location,
      ),
    );
  }
  const finite: IAutoMovieEnvironmentContext = analysisContext();
  finite.ground.up = { x: 0, y: 1e300, z: 0 };
  finite.instants[0]!.sun = { x: 0, y: 1e300, z: 0 };
  TestValidator.predicate(
    "large finite norms remain valid",
    AutoMovieEngineEnvironment.validateContext({ context: finite }).success,
  );
  finite.instants[0]!.sun.y = -1e300;
  TestValidator.predicate(
    "finite negative elevation still forbids a beam",
    hasViolation(
      AutoMovieEngineEnvironment.validateContext({ context: finite }),
      "range",
      "$input.instants[0].directNormalIlluminance",
    ),
  );
}
