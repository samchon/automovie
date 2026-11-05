import {
  AutoMovieLoftSectionNative,
  AutoMovieLoftViewRead,
  AutoMovieLoftViewSource,
  AutoMovieViewAxis,
  AutoMovieViewSection,
  type IAutoMovieViewPart,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** A local native point and its phase derivatives, without station derivatives. */
type Phase = ReturnType<ReturnType<typeof AutoMovieLoftSectionNative.phase>>;

/** The six Cartesian total-order-two components of the same local source. */
type Jet = ReturnType<ReturnType<typeof AutoMovieLoftSectionNative.jet>>;

/**
 * Public original-field reading preserves authored scalars without lofting.
 *
 * Scenarios:
 * 1. Three radius scales on the same one-mm station interval read the authored circle r(s)=scale*(1+s*s), including all six independently differentiated Cartesian components between knots and negative phases. A second principal interpolation would lose the quadratic midpoint.
 * 2. An eccentric ellipse reads its closed implicit polar intersection through common-shoulder and four-top-shoulder public inputs. A fresh returned point cannot rewrite a held reader or the original part.
 * 3. A one-pole source retains sqrt(s) values and regular station jets. At a positive near-pole station, finite scalar values survive unavailable physical2; at the true zero, scalar values survive while native positive-section preparation refuses it.
 * 4. Generic girth remains explicit source absence, a broken signed outline preserves its admission diagnostic, and a closed-pole outside query returns its original failure.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises package-public Source.create, Read.values/jets and Native.phase/jet directly from an original part. No ViewLoft, chain, world frame, merge or Human preparation supplies the result.
 * @evidence contracts/testing.md#independent-expectations Differentiating r(s)*(cos(phi),sin(phi)) gives p,s,t,ss,st,tt. Ellipse radius is1/hypot(cos(phi)/a,sin(phi)/b). The one-pole two-knot source is sqrt(s), whose first and second station derivatives are1/(2sqrt(s)) and-1/(4s^(3/2)). The2e-9 times radius-scale budget covers these finite binary64 readings; it is not a full coordinate-unit conversion, global conditioning or world cap certificate.
 * @evidence contracts/testing.md#distinguishing-cases Separates three radius scales, between-knot curvature, negative/cardinal phases, direct shoulder/top ownership, eccentric geometry, fresh outputs and unchanged inputs, positive cap values versus unavailable physical2, truezero refusal, generic-girth absence and malformed original admission. Existing conic_field owns broader G2/source-Hessian cases; source_curves/source_jets own scalar interpolation and authored parameter/range cases.
 * @evidence contracts/testing.md#execution-ownership One discoverable synchronous CPU question under --include construction_source_field. Synthetic original parts only; no person, process, viewer, GPU or whole realization is created.
 */
export function test_construction_source_field(): void {
  const failures: string[] = [];

  for (const scale of [0.001, 1, 1000]) {
    const part: IAutoMovieViewPart = circle(scale);
    const before: string = JSON.stringify(part);
    const source: AutoMovieLoftViewSource.ISource = prepare(part);

    for (const station of [0, 0.125, 0.5, 0.875, 1]) {
      const scalar: AutoMovieLoftViewRead.IJets | string =
        AutoMovieLoftViewRead.jets(source, station);
      if (typeof scalar === "string") throw new Error(scalar);
      const read: (phi: number) => Jet = AutoMovieLoftSectionNative.jet(scalar);
      const r: number = scale * (1 + station * station);
      const first: number = 2 * scale * station;

      for (const phi of [-0.31, 0, Math.PI / 2, 2.1, Math.PI, 4.7]) {
        const c: number = Math.cos(phi);
        const s: number = Math.sin(phi);
        const actual: Jet = read(phi);
        const expected: Jet = {
          p: [r * c, r * s],
          s: [first * c, first * s],
          t: [-r * s, r * c],
          ss: [2 * scale * c, 2 * scale * s],
          st: [-first * s, first * c],
          tt: [-r * c, -r * s],
        };
        for (const key of ["p", "s", "t", "ss", "st", "tt"] as const)
          close(
            actual[key],
            expected[key],
            scale,
            `${key}/${station}/${phi}`,
            failures,
          );
      }
    }

    const values: AutoMovieLoftViewRead.IValues | string =
      AutoMovieLoftViewRead.values(source, 0.5);
    if (typeof values === "string") throw new Error(values);
    close(
      values.extents,
      [1.25, 1.25, 1.25, 1.25].map((r: number): number => r * scale),
      scale,
      "original quadratic midpoint",
      failures,
    );
    if (JSON.stringify(part) !== before)
      failures.push(
        "Reading rewrote the original signed outlines or stations.",
      );
  }

  const ellipse: IAutoMovieViewPart = {
    ...circle(1),
    front: { positive: constant(3), negative: constant(-3) },
    side: { positive: constant(2), negative: constant(-2) },
  };
  const values: AutoMovieLoftViewRead.IValues | string =
    AutoMovieLoftViewRead.values(prepare(ellipse), 0.37);
  if (typeof values === "string") throw new Error(values);
  const read: (phi: number) => Phase = AutoMovieLoftSectionNative.phase(values);
  for (const phi of [-0.71, 0, 0.57, 1.4, 3.8, 5.7]) {
    const c: number = Math.cos(phi);
    const s: number = Math.sin(phi);
    const radius: number = 1 / Math.hypot(c / 3, s / 2);
    close(
      read(phi).p,
      [radius * c, radius * s],
      3,
      "implicit ellipse",
      failures,
    );
  }
  const changed: Phase = read(0);
  changed.p[0] = 1234;
  close(read(0).p, [3, 0], 3, "fresh local output", failures);

  const top: AutoMovieLoftViewSource.ISource = prepare({
    ...ellipse,
    fullness: {
      kind: "top",
      shoulders: [
        constant(AutoMovieViewSection.ELLIPSE),
        constant(AutoMovieViewSection.ELLIPSE),
        constant(AutoMovieViewSection.ELLIPSE),
        constant(AutoMovieViewSection.ELLIPSE),
      ],
    },
  });
  const topInputs: AutoMovieLoftViewRead.IJets | string =
    AutoMovieLoftViewRead.jets(top, 0.37);
  if (typeof topInputs === "string") throw new Error(topInputs);
  const topPoint: Jet = AutoMovieLoftSectionNative.jet(topInputs)(0.57);
  const topRadius: number =
    1 / Math.hypot(Math.cos(0.57) / 3, Math.sin(0.57) / 2);
  close(
    topPoint.p,
    [topRadius * Math.cos(0.57), topRadius * Math.sin(0.57)],
    3,
    "four top shoulders",
    failures,
  );
  close(topPoint.s, [0, 0], 3, "constant top station derivative", failures);

  cap(failures);

  const generic: IAutoMovieViewPart = {
    ...ellipse,
    fullness: { kind: "girth", girth: constant(12) },
  };
  if (AutoMovieLoftViewSource.create(generic) !== null)
    failures.push("Generic girth was assigned an invented direct source.");
  const broken: AutoMovieLoftViewSource.IResult | null =
    AutoMovieLoftViewSource.create({
      ...ellipse,
      front: {
        ...ellipse.front,
        positive: {
          knots: [
            { site: "duplicate.a", station: 0, value: 3 },
            { site: "duplicate.b", station: 0, value: 3 },
          ],
        },
      },
    });
  if (
    broken === null ||
    broken.source !== null ||
    broken.diagnostics.length === 0
  )
    failures.push("A broken present outline was confused with source absence.");

  TestValidator.predicate(
    `${failures.length} public source-field findings:\n${failures.join("\n")}`,
    (): boolean => failures.length === 0,
  );
}

/** Closed pole inputs distinguish finite values, positive sections and physical2. */
function cap(failures: string[]): void {
  /** These two root-coordinate knots define the independent square-root source. */
  const outline: (sign: number) => IAutoMovieViewPart.IOutline = (
    sign: number,
  ): IAutoMovieViewPart.IOutline => ({
    knots: [
      { site: "pole", station: 0, value: 0 },
      { site: "regular", station: 1, value: sign },
    ],
  });
  const part: IAutoMovieViewPart = {
    ...circle(1),
    stations: [0, 0.25, 1],
    front: { positive: outline(1), negative: outline(-1) },
    side: { positive: outline(1), negative: outline(-1) },
    pole: "bottom",
  };
  const source: AutoMovieLoftViewSource.ISource = prepare(part);
  const scalar: AutoMovieLoftViewRead.IJets | string =
    AutoMovieLoftViewRead.jets(source, 0.25);
  if (typeof scalar === "string") throw new Error(scalar);
  close(scalar.extents[0]!, [0.5, 1, -2], 1, "root physical2", failures);
  close(
    AutoMovieLoftSectionNative.jet(scalar)(0).p,
    [0.5, 0],
    1,
    "regular cap point",
    failures,
  );

  const tiny: AutoMovieLoftViewRead.IValues | string =
    AutoMovieLoftViewRead.values(source, 1e-220);
  if (typeof tiny === "string" || !(tiny.extents[0]! > 0))
    failures.push("Finite positive near-pole scalar values were lost.");
  if (typeof AutoMovieLoftViewRead.jets(source, 1e-220) !== "string")
    failures.push("Overflowing near-pole physical2 was fabricated.");
  const zero: AutoMovieLoftViewRead.IValues | string =
    AutoMovieLoftViewRead.values(source, 0);
  if (typeof zero === "string") throw new Error(zero);
  close(zero.extents, [0, 0, 0, 0], 1, "true pole scalar values", failures);
  if (typeof AutoMovieLoftViewRead.jets(source, 0) !== "string")
    failures.push("A singular true-pole physical2 was fabricated.");
  let refused: boolean = false;
  try {
    AutoMovieLoftSectionNative.phase(zero);
  } catch (error: unknown) {
    refused =
      error instanceof Error &&
      error.message.startsWith("Native value source:");
  }
  if (!refused)
    failures.push("A truezero was silently admitted as a positive section.");
  if (typeof AutoMovieLoftViewRead.values(source, -0.01) !== "string")
    failures.push("A query beyond the declared closed pole lost its failure.");
}

/** One original quadratic radius, authored with normalized endpoint derivatives. */
function circle(scale: number): IAutoMovieViewPart {
  /** Original physical station spans one mm, so its normalized jets agree here. */
  const outline: (sign: number) => IAutoMovieViewPart.IOutline = (
    sign: number,
  ): IAutoMovieViewPart.IOutline => ({
    knots: [0, 1].map(
      (s: number): IAutoMovieViewPart.IKnot => ({
        site: `source.${s}`,
        station: s,
        value: sign * scale * (1 + s * s),
        jet: { first: 2 * sign * scale * s, second: 2 * sign * scale },
      }),
    ),
  });
  return {
    name: "public-original-field",
    axis: AutoMovieViewAxis.horizontal(),
    stations: [0, 1],
    front: { positive: outline(1), negative: outline(-1) },
    side: { positive: outline(1), negative: outline(-1) },
    fullness: {
      kind: "shoulder",
      shoulder: constant(AutoMovieViewSection.ELLIPSE),
    },
    order: 16,
    samples: 16,
  };
}

/** A direct constant source on the common one-mm physical station interval. */
function constant(value: number): IAutoMovieViewPart.IOutline {
  return {
    knots: [
      { site: "start", station: 0, value },
      { site: "end", station: 1, value },
    ],
  };
}

/** Original scalar admission remains visible before any native geometry is read. */
function prepare(part: IAutoMovieViewPart): AutoMovieLoftViewSource.ISource {
  const result: AutoMovieLoftViewSource.IResult | null =
    AutoMovieLoftViewSource.create(part);
  if (
    result === null ||
    result.source === null ||
    result.diagnostics.length !== 0
  )
    throw new Error(
      `Unexpected original source refusal: ${JSON.stringify(result)}`,
    );
  return result.source;
}

/** Finite component comparisons use a declared absolute budget in the case's unit. */
function close(
  actual: readonly number[],
  expected: readonly number[],
  scale: number,
  label: string,
  failures: string[],
): void {
  if (
    actual.length !== expected.length ||
    actual.some(
      (v: number, i: number): boolean => !nclose(v, expected[i]!, 2e-9 * scale),
    )
  )
    failures.push(
      `${label}: ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`,
    );
}
