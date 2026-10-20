import type { IAutoMovieCurve64 as C } from "@automovie/engine/geometry/curve";
import {
  type IAutoMovieRecoveryHermiteCurve,
  type IAutoMovieRecoveryHermiteSpan,
  convertAutoMovieRecoveryCurves,
  reconstructAutoMovieRecoveryModel,
} from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { recoveryPrismOracle as prism } from "../internal/recoveryPrismOracle";

/** One override in the generic polynomial artifact. */
interface RecoveryCurveOverride {
  curve: C.Cubic;
}

/** Independent aliases exercise nested saved-curve publication. */
interface RecoveryCurveArtifact {
  curve: C.Cubic;
  open: C.Cubic[];
  guide: C.Cubic;
  overrides: RecoveryCurveOverride[];
}

/** A cubic record can itself carry another cubic as ordinary metadata. */
interface RecoveryCurveMetadata extends C.Cubic {
  attached: C.Cubic;
}

/** A named malformed coefficient case whose own data are changed locally. */
interface RecoveryMalformedCurve {
  name: string;
  value: C.Cubic | IAutoMovieRecoveryHermiteCurve;
}

/**
 * Cubic basis selection preserves physical polynomials and source-free geometry.
 *
 * Scenarios:
 * 1. Unequal phase widths reproduce the independent polynomial (s²,s³,2s).
 * 2. Nested open, guide and override references share one converted authority.
 * 3. A horizontal course keeps a nonzero parameter width despite constant Y.
 * 4. Invalid widths, nonfinite derivatives and higher-degree curves refuse conversion.
 * 5. A saved Hermite bundle independently generates the uncapped 24-mm² prism side.
 * 6. Nested cubic metadata has the same converted type and runtime representation.
 * 7. Sparse or inherited coefficients and accessor-backed vectors refuse without invoking a getter.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls public conversion and reconstruction, evaluates saved Hermite endpoints and derivatives, checks input nonmutation and measures generated triangle area.
 * @evidence contracts/testing.md#independent-expectations Authored coefficients encode the analytic polynomial (s²,s³,2s) over [0,2] and [2,5]; the separate square prism has perimeter 12 mm and height 2 mm, hence area 24e-6 m².
 * @evidence contracts/testing.md#distinguishing-cases Unequal widths and a horizontal ring expose unit-parameter or Y-difference mistakes; nested aliases and a cubic attached to another cubic expose incomplete publication and mismatched recursive typing. Sparse outer spans, controls, vector components, widths and Hermite derivatives, an inherited coordinate and accessor-backed coefficients expose fabricated own data or premature getter execution.
 * @evidence contracts/testing.md#execution-ownership The portable scenario owns only small generic coefficients and CPU geometry, with no Human input, renderer, filesystem, subprocess or native artifact; the central runner owns execution.
 */
export function test_recovery_curve_format(): void {
  const curve: C.Cubic = {
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
  const horizontal: C.Cubic = {
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
    typeof convertAutoMovieRecoveryCurves<C.Cubic, "hermite">
  > = convertAutoMovieRecoveryCurves(horizontal, "hermite");
  TestValidator.predicate(
    "horizontal chart derivative",
    nclose(horizontalSaved.spans[0]!.startDerivative[0], 3, 1e-12),
  );
  TestValidator.predicate(
    "horizontal Y derivative",
    nclose(horizontalSaved.spans[0]!.startDerivative[1], 0),
  );
  const restored: C.Cubic = convertAutoMovieRecoveryCurves(
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
  for (const width of [0, -1, Infinity, NaN]) {
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
    startDerivative: [Infinity, 0, 0],
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
  const malformed: RecoveryMalformedCurve[] = [];
  for (const target of ["spans", "controls", "components", "widths"] as const) {
    const value: C.Cubic = structuredClone(horizontal);
    const population: readonly unknown[] =
      target === "spans"
        ? value.spans
        : target === "controls"
          ? value.spans[0]!
          : target === "components"
            ? value.spans[0]![0]
            : value.phaseIntervals;
    Reflect.deleteProperty(population, "0");
    malformed.push({ name: `sparse ${target}`, value });
  }
  const extraCoordinate: C.Cubic = structuredClone(horizontal);
  Reflect.set(extraCoordinate.spans[0]![0], "3", 11);
  malformed.push({ name: "non-triple coordinate", value: extraCoordinate });
  const extraControl: C.Cubic = structuredClone(horizontal);
  Reflect.set(extraControl.spans[0]!, "4", [5, 7, 3]);
  malformed.push({ name: "non-cubic control count", value: extraControl });
  const nonfiniteControl: C.Cubic = structuredClone(horizontal);
  Reflect.set(nonfiniteControl.spans[0]![0], "0", Infinity);
  malformed.push({ name: "nonfinite Bezier control", value: nonfiniteControl });
  const inherited: C.Cubic = structuredClone(horizontal);
  Reflect.deleteProperty(inherited.spans[0]![0], "1");
  Object.setPrototypeOf(
    inherited.spans[0]![0],
    Object.assign(Object.create(Array.prototype), { 1: 7 }),
  );
  malformed.push({ name: "inherited coordinate", value: inherited });
  const sparseDerivative: IAutoMovieRecoveryHermiteCurve =
    structuredClone(horizontalSaved);
  Reflect.deleteProperty(sparseDerivative.spans[0]!.startDerivative, "1");
  malformed.push({ name: "sparse Hermite derivative", value: sparseDerivative });
  const missingEndpoint: IAutoMovieRecoveryHermiteCurve =
    structuredClone(horizontalSaved);
  Reflect.deleteProperty(missingEndpoint.spans[0]!, "end");
  malformed.push({ name: "missing Hermite endpoint", value: missingEndpoint });
  let getterReads: number = 0;
  const accessorControl: C.Cubic = structuredClone(horizontal);
  Object.defineProperty(accessorControl.spans[0]![0], "0", {
    enumerable: true,
    configurable: true,
    get: (): number => {
      getterReads++;
      return 0;
    },
  });
  malformed.push({ name: "accessor Bezier coordinate", value: accessorControl });
  const accessorDerivative: IAutoMovieRecoveryHermiteCurve =
    structuredClone(horizontalSaved);
  Object.defineProperty(accessorDerivative.spans[0]!.startDerivative, "0", {
    enumerable: true,
    configurable: true,
    get: (): number => {
      getterReads++;
      return 3;
    },
  });
  malformed.push({ name: "accessor Hermite derivative", value: accessorDerivative });
  for (const candidate of malformed) {
    for (const format of ["hermite", "bezier"] as const) {
      let rejected: boolean = false;
      try {
        convertAutoMovieRecoveryCurves(candidate.value, format);
      } catch {
        rejected = true;
      }
      TestValidator.predicate(`${candidate.name} refuses ${format}`, rejected);
    }
  }
  TestValidator.equals("coefficient getters are never executed", getterReads, 0);
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
