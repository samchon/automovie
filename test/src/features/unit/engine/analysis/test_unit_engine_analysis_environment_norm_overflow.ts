import { validateAutoMovieEnvironmentContext } from "@automovie/engine";
import type {
  IAutoMovieEnvironmentContext,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { analysisContext } from "../../../internal/analysisContext";
import { hasViolation } from "../../../internal/predicates";

/**
 * A direction with finite components cannot bypass the horizon rule through an overflowing norm.
 *
 * Scenarios:
 * 1. Overflowing site north, ground up and sun directions are refused at their vector paths.
 * 2. Large directions with representable norms keep above-horizon acceptance and below-horizon beam refusal.
 */
export function test_unit_engine_analysis_environment_norm_overflow(): void {
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
        validateAutoMovieEnvironmentContext({ context }),
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
    validateAutoMovieEnvironmentContext({ context: finite }).success,
  );
  finite.instants[0]!.sun.y = -1e300;
  TestValidator.predicate(
    "finite negative elevation still forbids a beam",
    hasViolation(
      validateAutoMovieEnvironmentContext({ context: finite }),
      "range",
      "$input.instants[0].directNormalIlluminance",
    ),
  );
}
