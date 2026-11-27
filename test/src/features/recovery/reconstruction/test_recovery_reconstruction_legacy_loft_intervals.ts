import type {
  IAutoMovieRecoveryImageLoft,
  IAutoMovieRecoveryImageLoftBudget,
  IAutoMovieRecoverySupportLoft,
} from "@automovie/interface";
import { AutoMovieRecoveryCompilation } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * Compile image loft recipes saved before Y intervals had named fields.
 *
 * Scenarios:
 *
 * 1. An elliptical loft accepts legacy endpoints and applies the height scale.
 * 2. A support loft accepts the same legacy endpoints and applies the scale.
 * 3. Nonfinite or overflowing Y intervals refuse before geometry generation.
 */
export function test_recovery_reconstruction_legacy_loft_intervals(): void {
  const base = {
    objectId: "legacy-loft",
    frame: "fixture",
    dimensions: { widthScale: 1, depthScale: 1, heightScale: 1.5 },
  };
  const coverage = {
    endCaps: "unobserved",
    interior: "unobserved",
    cameras: "supplied",
  } as const;
  const image: IAutoMovieRecoveryImageLoft = JSON.parse(
    JSON.stringify({
      ...base,
      family: "aligned-elliptical-sections",
      coverage: {
        ...coverage,
        lateralSurface: "inferred-under-aligned-ellipse-prior",
      },
      loft: {
        spans: [
          {
            interval: [1, 3],
            radiusX: [0.02, 0.02, 0.02, 0.02],
            radiusZ: [0.01, 0.01, 0.01, 0.01],
            centreX: [0, 0, 0, 0],
            centreZ: [0, 0, 0, 0],
          },
        ],
      },
    }),
  );
  const support: IAutoMovieRecoverySupportLoft = JSON.parse(
    JSON.stringify({
      ...base,
      family: "finite-view-convex-support",
      coverage: {
        ...coverage,
        lateralSurface: "inferred-finite-view-convex-support",
        hiddenConcavities: "unobserved",
        enclosure: "not-certified",
      },
      loft: {
        planes: [
          { id: "right", normal: [1, 0] },
          { id: "front", normal: [0, 1] },
          { id: "left", normal: [-1, 0] },
          { id: "back", normal: [0, -1] },
        ],
        spans: [
          {
            interval: [1, 3],
            offsets: [
              [2, 2, 2, 2],
              [1, 1, 1, 1],
              [1, 1, 1, 1],
              [1, 1, 1, 1],
            ],
          },
        ],
      },
    }),
  );
  const imageBudget: IAutoMovieRecoveryImageLoftBudget = {
    tolerance: 1e-4,
    maxCells: 20_000,
    maxVertices: 30_000,
  };
  const outcomes = [
    AutoMovieRecoveryCompilation.compileImageLoft(image, imageBudget),
    AutoMovieRecoveryCompilation.compileSupportLoft(support, {
      tolerance: 1e-6,
      maxPlanes: 4,
      maxEvents: 0,
      maxCells: 4,
      maxVertices: 16,
      minimumDirectionSine: 1e-6,
    }),
  ];
  for (const outcome of outcomes) {
    if (!("value" in outcome)) throw new Error(outcome.diagnostics.join(" "));
    const heights: number[] = outcome.value.construction.flatMap((line) =>
      line.points.map((point): number => point[1]),
    );
    TestValidator.predicate(
      `${outcome.operator} preserves the lower anchor and scales the span`,
      nclose(Math.min(...heights), 1, 1e-12) &&
        nclose(Math.max(...heights), 4, 1e-12),
    );
  }
  for (const interval of [
    { lowerY: -Infinity, upperY: 3 },
    { lowerY: 1, upperY: Number.MAX_VALUE },
  ]) {
    const refusal = AutoMovieRecoveryCompilation.compileImageLoft(
      { ...image, loft: { spans: [{ ...image.loft.spans[0]!, interval }] } },
      imageBudget,
    );
    TestValidator.predicate(
      "invalid Y endpoints are rejected before geometry generation",
      refusal.status === "refused" &&
        refusal.diagnostics.some((line: string): boolean =>
          line.includes("finite, increasing Y endpoints"),
        ),
    );
  }
}
