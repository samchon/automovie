import type {
  IAutoMovieCubicBezierCurve64,
  IAutoMovieRecoveryHermiteCurve,
  IAutoMovieRecoveryHermiteSpan,
} from "@automovie/interface";
import {
  convertAutoMovieRecoveryCurves,
  reconstructAutoMovieRecoveryModel,
} from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { recoveryPrismOracle as prism } from "../../../internal/recoveryPrismOracle";

/** One override in the generic polynomial artifact. */
interface RecoveryCurveOverride {
  curve: IAutoMovieCubicBezierCurve64;
}

/** Independent aliases exercise nested saved-curve publication. */
interface RecoveryCurveArtifact {
  curve: IAutoMovieCubicBezierCurve64;
  open: IAutoMovieCubicBezierCurve64[];
  guide: IAutoMovieCubicBezierCurve64;
  overrides: RecoveryCurveOverride[];
}

/** A cubic record can itself carry another cubic as ordinary metadata. */
interface RecoveryCurveMetadata extends IAutoMovieCubicBezierCurve64 {
  attached: IAutoMovieCubicBezierCurve64;
}

/**
 * Cubic basis selection preserves physical polynomials and source-free geometry.
 *
 * Scenarios:
 * 1. Unequal phase widths reproduce the independent polynomial (s²,s³,2s).
 * 2. Nested open, guide and override references share one converted authority.
 * 3. A horizontal course keeps a nonzero parameter width despite constant Y.
 * 4. Invalid widths and higher-degree curves refuse conversion.
 * 5. A saved Hermite bundle independently generates the uncapped 24-mm² prism side.
 * 6. Nested cubic metadata has the same converted type and runtime representation.
 */
export function test_unit_recovery_curves_curve_format(): void {
  const curve: IAutoMovieCubicBezierCurve64 = {
    type: "cubicBezier",
    name: "polynomial",
    closed: false,
    unit: "mm",
    phaseUnit: "mm",
    phaseIntervals: [2, 3],
    spans: [
      [
        [0, 0, 0],
        [0, 0, 4 / 3],
        [4 / 3, 0, 8 / 3],
        [4, 8, 4],
      ],
      [
        [4, 8, 4],
        [8, 20, 6],
        [15, 50, 8],
        [25, 125, 10],
      ],
    ],
  };
  const input: RecoveryCurveArtifact = {
    curve,
    open: [curve],
    guide: curve,
    overrides: [{ curve }],
  };
  const before: string = JSON.stringify(input);
  const saved: ReturnType<
    typeof convertAutoMovieRecoveryCurves<typeof input, "hermite">
  > = convertAutoMovieRecoveryCurves(input, "hermite");
  TestValidator.equals("basis", saved.curve.type, "cubicHermite");
  TestValidator.predicate(
    "shared authority",
    saved.curve === saved.open[0] &&
      saved.curve === saved.guide &&
      saved.curve === saved.overrides[0]!.curve,
  );
  TestValidator.equals("input unchanged", JSON.stringify(input), before);
  for (const [index, span] of saved.curve.spans.entries()) {
    const h: number = saved.curve.phaseIntervals[index]!;
    const origin: number = index === 0 ? 0 : 2;
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const s: number = origin + h * t;
      const basis: number[] = [
        2 * t ** 3 - 3 * t ** 2 + 1,
        -2 * t ** 3 + 3 * t ** 2,
        t ** 3 - 2 * t ** 2 + t,
        t ** 3 - t ** 2,
      ];
      const expected: number[] = [s * s, s * s * s, 2 * s];
      for (let axis: number = 0; axis < 3; axis++) {
        const actual: number =
          basis[0]! * span.start[axis]! +
          basis[1]! * span.end[axis]! +
          h *
            (basis[2]! * span.startDerivative[axis]! +
              basis[3]! * span.endDerivative[axis]!);
        TestValidator.predicate(
          "physical polynomial",
          nclose(actual, expected[axis]!, 1e-11),
        );
      }
    }
  }
  const horizontal: IAutoMovieCubicBezierCurve64 = {
    ...curve,
    phaseUnit: "normalized",
    phaseIntervals: [2],
    spans: [
      [
        [0, 7, 0],
        [2, 7, 0],
        [3, 7, 1],
        [4, 7, 2],
      ],
    ],
  };
  const horizontalSaved: ReturnType<
    typeof convertAutoMovieRecoveryCurves<
      IAutoMovieCubicBezierCurve64,
      "hermite"
    >
  > = convertAutoMovieRecoveryCurves(horizontal, "hermite");
  TestValidator.predicate(
    "horizontal chart derivative",
    nclose(horizontalSaved.spans[0]!.startDerivative[0], 3, 1e-12),
  );
  TestValidator.predicate(
    "horizontal Y derivative",
    nclose(horizontalSaved.spans[0]!.startDerivative[1], 0),
  );
  const restored: IAutoMovieCubicBezierCurve64 = convertAutoMovieRecoveryCurves(
    saved.curve,
    "bezier",
  );
  for (const [i, span] of restored.spans.entries())
    for (let j: number = 0; j < 4; j++)
      for (let axis: number = 0; axis < 3; axis++)
        TestValidator.predicate(
          "inverse coefficients",
          nclose(span[j]![axis]!, curve.spans[i]![j]![axis]!, 1e-11),
        );
  for (const width of [0, -1]) {
    let refused: boolean = false;
    try {
      convertAutoMovieRecoveryCurves(
        { ...horizontal, phaseIntervals: [width] },
        "hermite",
      );
    } catch {
      refused = true;
    }
    TestValidator.predicate("invalid phase refusal", refused);
  }
  let degreeRefused: boolean = false;
  try {
    convertAutoMovieRecoveryCurves({ type: "bernstein", degree: 4 }, "hermite");
  } catch {
    degreeRefused = true;
  }
  TestValidator.predicate("no degree reduction", degreeRefused);
  const broken: IAutoMovieRecoveryHermiteSpan = {
    ...horizontalSaved.spans[0]!,
    startDerivative: [0, 0],
  };
  let nonfiniteRefused: boolean = false;
  try {
    convertAutoMovieRecoveryCurves(
      { ...horizontalSaved, spans: [broken] },
      "bezier",
    );
  } catch {
    nonfiniteRefused = true;
  }
  TestValidator.predicate("nonfinite derivative refusal", nonfiniteRefused);
  const metadata: RecoveryCurveMetadata = { ...horizontal, attached: curve };
  const nested: ReturnType<
    typeof convertAutoMovieRecoveryCurves<RecoveryCurveMetadata, "hermite">
  > = convertAutoMovieRecoveryCurves(metadata, "hermite");
  const nestedType: "cubicHermite" = nested.attached.type;
  TestValidator.equals(
    "nested metadata type follows runtime",
    nestedType,
    "cubicHermite",
  );
  TestValidator.predicate(
    "nested metadata preserves the independent polynomial endpoint",
    nclose(nested.attached.spans[1]!.end[0], 25) &&
      nclose(nested.attached.spans[1]!.end[1], 125) &&
      nclose(nested.attached.spans[1]!.end[2], 10),
  );
  const bundle: ReturnType<typeof prism.makeInput> = prism.makeInput(false);
  const generated: ReturnType<typeof reconstructAutoMovieRecoveryModel> =
    reconstructAutoMovieRecoveryModel(
      convertAutoMovieRecoveryCurves(bundle, "hermite"),
    );
  if (!("value" in generated))
    throw new Error(generated.diagnostics.join("; "));
  let area: number = 0;
  for (const part of generated.value.model.parts) {
    if (part.geometry.type !== "mesh") continue;
    const positions: readonly number[] = part.geometry.mesh.positions;
    const indices: readonly number[] = part.geometry.mesh.indices!;
    for (let i: number = 0; i < indices.length; i += 3) {
      const a: number = indices[i]! * 3,
        b: number = indices[i + 1]! * 3,
        c: number = indices[i + 2]! * 3;
      const u: number[] = [0, 1, 2].map(
        (axis: number): number => positions[b + axis]! - positions[a + axis]!,
      );
      const v: number[] = [0, 1, 2].map(
        (axis: number): number => positions[c + axis]! - positions[a + axis]!,
      );
      area +=
        Math.hypot(
          u[1]! * v[2]! - u[2]! * v[1]!,
          u[2]! * v[0]! - u[0]! * v[2]!,
          u[0]! * v[1]! - u[1]! * v[0]!,
        ) / 2;
    }
  }
  TestValidator.predicate("analytic prism area", nclose(area, 24e-6, 1e-12));
}
