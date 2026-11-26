import type {
  IAutoMovieRecoveryImageFitPolicy,
  IAutoMovieRecoverySupportFitPolicy,
} from "@automovie/interface";
import {
  fitAutoMovieRecoveryImageLoft,
  fitAutoMovieRecoveryImageSupportLoft,
  observeAutoMovieRecoveryImages,
} from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { recoveryImageFixture } from "../../internal/recoveryImageFixture";

/** Image fitters reject malformed count and numerical admission controls. */
export function test_recovery_fitting_image_admission(): void {
  const captured = observeAutoMovieRecoveryImages(recoveryImageFixture());
  if (captured.status !== "complete" && captured.status !== "partial")
    throw new Error(captured.diagnostics.join("; "));
  const ellipse: IAutoMovieRecoveryImageFitPolicy = {
    family: "aligned-elliptical-sections",
    maxViews: 8,
    maxRows: 4000,
    maxSpans: 8,
    maximumResidualPx: 1,
    minimumDirectionRatio: 0.01,
    minimumSplineRatio: 0.01,
  };
  const support: IAutoMovieRecoverySupportFitPolicy = {
    family: "finite-view-convex-support",
    maxViews: 8,
    maxRows: 4000,
    maxSpans: 8,
    maximumResidualPx: 1,
    minimumSplineRatio: 0.01,
    generation: {
      tolerance: 0.01,
      maxPlanes: 64,
      maxEvents: 10000,
      maxCells: 10000,
      maxVertices: 10000,
      minimumDirectionSine: 0.01,
    },
  };
  const invalidCounts: number[] = [Number.NaN, Number.POSITIVE_INFINITY, 1.5];
  for (const invalid of invalidCounts) {
    for (const key of ["maxViews", "maxRows", "maxSpans"] as const) {
      const policy: IAutoMovieRecoveryImageFitPolicy = {
        ...ellipse,
        [key]: invalid,
      };
      const result = fitAutoMovieRecoveryImageLoft(captured.value, policy);
      TestValidator.equals(
        `ellipse ${key} ${invalid} refusal`,
        result.status,
        "refused",
      );
      TestValidator.predicate(
        `ellipse ${key} ${invalid} admission diagnostic`,
        result.diagnostics.some((message: string): boolean =>
          message.includes("invalid-image-fit"),
        ),
      );
      const supportPolicy: IAutoMovieRecoverySupportFitPolicy = {
        ...support,
        [key]: invalid,
      };
      const supportResult = fitAutoMovieRecoveryImageSupportLoft(
        captured.value,
        supportPolicy,
      );
      TestValidator.equals(
        `support ${key} ${invalid} refusal`,
        supportResult.status,
        "refused",
      );
      TestValidator.predicate(
        `support ${key} ${invalid} admission diagnostic`,
        supportResult.diagnostics.some((message: string): boolean =>
          message.includes("invalid-support-fit"),
        ),
      );
    }
  }
  for (const invalid of [Number.NaN, Number.POSITIVE_INFINITY]) {
    for (const threshold of [
      "maximumResidualPx",
      "minimumSplineRatio",
    ] as const) {
      const policy: IAutoMovieRecoveryImageFitPolicy = {
        ...ellipse,
        [threshold]: invalid,
      };
      const result = fitAutoMovieRecoveryImageLoft(captured.value, policy);
      TestValidator.equals(
        `ellipse ${threshold} ${invalid} refusal`,
        result.status,
        "refused",
      );
      TestValidator.predicate(
        `ellipse ${threshold} ${invalid} admission diagnostic`,
        result.diagnostics.some((message: string): boolean =>
          message.includes("invalid-image-fit"),
        ),
      );
    }
    const directionPolicy: IAutoMovieRecoveryImageFitPolicy = {
      ...ellipse,
      minimumDirectionRatio: invalid,
    };
    const directionResult = fitAutoMovieRecoveryImageLoft(
      captured.value,
      directionPolicy,
    );
    TestValidator.equals(
      `ellipse minimumDirectionRatio ${invalid} refusal`,
      directionResult.status,
      "refused",
    );
    TestValidator.predicate(
      `ellipse minimumDirectionRatio ${invalid} admission diagnostic`,
      directionResult.diagnostics.some((message: string): boolean =>
        message.includes("invalid-image-fit"),
      ),
    );
    for (const threshold of [
      "maximumResidualPx",
      "minimumSplineRatio",
    ] as const) {
      const policy: IAutoMovieRecoverySupportFitPolicy = {
        ...support,
        [threshold]: invalid,
      };
      const result = fitAutoMovieRecoveryImageSupportLoft(
        captured.value,
        policy,
      );
      TestValidator.equals(
        `support ${threshold} ${invalid} refusal`,
        result.status,
        "refused",
      );
      TestValidator.predicate(
        `support ${threshold} ${invalid} admission diagnostic`,
        result.diagnostics.some((message: string): boolean =>
          message.includes("invalid-support-fit"),
        ),
      );
    }
  }
}
