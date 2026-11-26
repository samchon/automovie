import { AutoMovieEngineConvexSupportLoft } from "@automovie/engine";
import type {
  IAutoMovieRealizeConvexSupportLoft,
  IAutoMovieRecoveryImageFitPolicy,
  IAutoMovieRecoverySupportFitPolicy,
} from "@automovie/interface";
import {
  AutoMovieRecoveryFitting,
  observeAutoMovieRecoveryImages,
} from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/predicates";
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
  const direct: IAutoMovieRealizeConvexSupportLoft.IInput = {
    loft: {
      planes: [
        { id: "right", normal: [1, 0] },
        { id: "front", normal: [0, 1] },
        { id: "left", normal: [-1, 0] },
        { id: "back", normal: [0, -1] },
      ],
      spans: [
        {
          interval: [1, 4],
          offsets: [
            [2, 2, 2, 2],
            [1, 1, 1, 1],
            [1, 1, 1, 1],
            [1, 1, 1, 1],
          ],
        },
      ],
    },
    topologyDomain: "admission-test",
    tolerance: 1e-6,
    maxPlanes: 4,
    maxEvents: 0,
    maxCells: 4,
    maxVertices: 16,
    minimumDirectionSine: 1e-6,
  };
  const realized = AutoMovieEngineConvexSupportLoft.realize(direct);
  TestValidator.equals(
    "valid zero-event generation preserves its geometry",
    [
      (realized.mesh.indices?.length ?? 0) / 3,
      realized.mesh.physicalVertices?.sources.length,
      realized.intervals,
      realized.events,
    ],
    [8, 8, 1, 0],
  );
  const fitted = AutoMovieRecoveryFitting.fitSupportLoft(captured.value, support);
  TestValidator.equals(
    "valid image support fit keeps its status and qualified diagnostics",
    [fitted.status, fitted.diagnostics],
    [
      "partial",
      [
        "Finite-view convex section approximation with supplied cameras and asserted rigidity; hidden concavity, caps and interior remain unobserved",
        "Common-domain interpolation and fitted supports are conditional on segmentation/calibration; true enclosure is not certified",
        "Boundary events and canonical incidence are binary64 numerical constructions, not interval certificates",
      ],
    ],
  );

  type ControlName =
    | "tolerance"
    | "minimumDirectionSine"
    | "maxPlanes"
    | "maxEvents"
    | "maxCells"
    | "maxVertices";
  const positiveBudgetKeys: readonly ControlName[] = [
    "maxPlanes",
    "maxCells",
    "maxVertices",
  ];
  const invalidControls: [ControlName, number][] = [
    ...[Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 0].map(
      (value: number): [ControlName, number] => ["tolerance", value],
    ),
    ...[
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      0,
      1,
    ].map((value: number): [ControlName, number] => [
      "minimumDirectionSine",
      value,
    ]),
    ...positiveBudgetKeys.flatMap((key: ControlName): [ControlName, number][] =>
      [
        Number.NaN,
        Number.POSITIVE_INFINITY,
        Number.NEGATIVE_INFINITY,
        0,
        1.5,
        Number.MAX_SAFE_INTEGER + 1,
      ].map((value: number): [ControlName, number] => [key, value]),
    ),
    ...[
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      -1,
      1.5,
      Number.MAX_SAFE_INTEGER + 1,
    ].map((value: number): [ControlName, number] => ["maxEvents", value]),
  ];
  const unrefused: string[] = [];
  for (const [key, value] of invalidControls) {
    const engineRefused: boolean = throwsError(
      (): unknown =>
        AutoMovieEngineConvexSupportLoft.realize({ ...direct, [key]: value }),
      "invalid-support-loft:",
    );
    if (!engineRefused) unrefused.push(`Engine ${key} ${value}`);
    const policy: IAutoMovieRecoverySupportFitPolicy = {
      ...support,
      generation: { ...support.generation, [key]: value },
    };
    const result = AutoMovieRecoveryFitting.fitSupportLoft(captured.value, policy);
    if (
      result.status !== "refused" ||
      !result.diagnostics.some((message: string): boolean =>
        message.includes("invalid-support-fit:"),
      )
    )
      unrefused.push(`Recovery ${key} ${value}`);
  }
  TestValidator.equals("all invalid controls are refused", unrefused, []);
  TestValidator.predicate(
    "valid vertex cap exhaustion transfers no partial Engine mesh",
    throwsError(
      (): unknown =>
        AutoMovieEngineConvexSupportLoft.realize({
          ...direct,
          maxVertices: 7,
        }),
      "support-vertex-budget-exhausted: no partial mesh transferred",
    ),
  );
  const exhausted = AutoMovieRecoveryFitting.fitSupportLoft(captured.value, {
    ...support,
    generation: { ...support.generation, maxVertices: 1 },
  });
  TestValidator.equals(
    "valid Recovery vertex cap exhaustion is refused",
    exhausted.status,
    "refused",
  );
  TestValidator.predicate(
    "Recovery transfers no value after vertex cap exhaustion",
    !Object.hasOwn(exhausted, "value"),
  );
  TestValidator.predicate(
    "Recovery preserves the no-partial-transfer diagnosis",
    exhausted.diagnostics.some((message: string): boolean =>
      message.includes(
        "support-vertex-budget-exhausted: no partial mesh transferred",
      ),
    ),
  );
  const invalidCounts: number[] = [Number.NaN, Number.POSITIVE_INFINITY, 1.5];
  for (const invalid of invalidCounts) {
    for (const key of ["maxViews", "maxRows", "maxSpans"] as const) {
      const policy: IAutoMovieRecoveryImageFitPolicy = {
        ...ellipse,
        [key]: invalid,
      };
      const result = AutoMovieRecoveryFitting.fitImageLoft(captured.value, policy);
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
      const supportResult = AutoMovieRecoveryFitting.fitSupportLoft(
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
      const result = AutoMovieRecoveryFitting.fitImageLoft(captured.value, policy);
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
    const directionResult = AutoMovieRecoveryFitting.fitImageLoft(
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
      const result = AutoMovieRecoveryFitting.fitSupportLoft(
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
