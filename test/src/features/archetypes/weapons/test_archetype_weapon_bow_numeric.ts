import { type AutoMovieArchetype, AutoMovieArchetypeBuilder, AutoMovieArchetypeDrawSession, AutoMovieArchetypeFrame, AutoMovieArchetypeRefusal, AutoMovieArchetypeBow } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

/**
 * Bow launch and limb-table helpers reject malformed mechanics before NaN can
 * escape, while retaining valid zero, full draw and very small positive speed.
 *
 * Scenarios:
 *
 * 1. Each hand-drawn kind rejects zero, negative and non-finite arrow mass and
 *    negative, non-finite or over-stroke travel through its public launch API.
 *    MIN_VALUE and MAX_VALUE are positive masses, not arbitrary cutoff cases.
 * 2. A recurve at travels 1e-134 and 1e-200 m retains representable speed even
 *    though computing stored energy first loses subnormal precision or
 *    underflows. An independent square-root/power energy balance pins it within
 *    1e-12 relative. Finite extreme forces 2^-1000 and MAX_VALUE with
 *    reciprocal extreme arrow masses also retain the full-draw speed given by
 *    the square-root balance.
 * 3. Authored draw metadata that is zero, negative, non-finite or absent is
 *    refused at draw, using a public builder and a real string articulation.
 * 4. Invalid limb lengths, brace lengths and travels, an impossible triangle, and
 *    unrepresentable reach/nock geometry produce structured refusals. A zero
 *    stroke has one neutral row. A 3-4-5 limb/brace/reach triangle at nock
 *    distance 8 m ends with the limb on the draw axis, so its turn is
 *    atan2(3,4), independently within 1e-12 degrees. Scaling that triangle by
 *    1e-200 and drawing 1e-200 m still gives a finite asin(41/50)-atan2(4,3)
 *    endpoint when raw squared sides underflow; scaling by 2^-700 pins the
 *    exact tangent boundary without rounded decimal geometry. With a 1 m half
 *    and brace s=2^-600, travel s rounds to +s/4 radians. Half=2^50 with
 *    brace=travel=1 similarly rounds to 1/(4 half) radians, distinguishing
 *    underflow and normal-square cancellation. Every row stays finite.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies structured input refusal, neutral pose rows, extreme finite samples and the provisional simulation calculation.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public model, pose and simulation entries with finite, nonfinite and extreme numeric cases. Reads actual scene geometry, structured refusal axes and finite positive results under representability limits.
 * @evidence contracts/development/testing.md#independent-expectations The authored right triangle fixes the tangent endpoint and turn independently. Scaled expectations for the tiny and large inputs distinguish a representable result from intermediate overflow or underflow.
 */
export function test_archetype_weapon_bow_numeric(): void {
  const findings: string[] = [];
  for (const kind of ["longbow", "recurve", "horseBow"] as const) {
    const bow: ReturnType<typeof AutoMovieArchetypeBow.create> = AutoMovieArchetypeBow.create({ kind });
    const stroke: number = bow.affordance("string").travel!;
    for (const mass of [0, -1, Number.NaN, Infinity, -Infinity])
      if (!refuses((): number => AutoMovieArchetypeBow.launchSpeed(bow, mass, 0), "mass"))
        findings.push(`${kind}: invalid arrow mass ${mass} was accepted`);
    for (const travel of [
      -Number.MIN_VALUE,
      stroke * 2,
      Number.NaN,
      Infinity,
      -Infinity,
    ])
      if (
        !refuses(
          (): number => AutoMovieArchetypeBow.launchSpeed(bow, 0.02, travel),
          "travel",
        )
      )
        findings.push(`${kind}: invalid string travel ${travel} was accepted`);
    if (AutoMovieArchetypeBow.launchSpeed(bow, 0.02, 0) !== 0)
      findings.push(`${kind}: brace does not have exactly zero speed`);
    for (const mass of [Number.MIN_VALUE, 0.02, Number.MAX_VALUE]) {
      const speed: number = AutoMovieArchetypeBow.launchSpeed(bow, mass, stroke);
      if (!(speed > 0))
        findings.push(
          `${kind}: positive arrow mass ${mass} lost a finite positive speed`,
        );
    }
  }
  const bow: ReturnType<typeof AutoMovieArchetypeBow.create> = AutoMovieArchetypeBow.create({ kind: "recurve" });
  const stroke: number = bow.affordance("string").travel!;
  const virtual: number = (0.02 * (1 - 0.765)) / 0.765;
  for (const tiny of [1e-134, 1e-200]) {
    const expected: number =
      ((Math.sqrt(2 * 0.426) *
        Math.sqrt(bow.dimensions.draw!) *
        Math.sqrt(stroke)) /
        Math.sqrt(0.02 + virtual)) *
      (tiny / stroke) ** (1 / (2 * 0.426));
    const speed: number = AutoMovieArchetypeBow.launchSpeed(bow, 0.02, tiny);
    if (!(expected > 0 && speed > 0 && Math.abs(speed / expected - 1) <= 1e-12))
      findings.push(
        `representable speed at travel ${tiny} lost energy-first precision`,
      );
  }
  for (const [force, mass] of [
    [2 ** -1000, Number.MAX_VALUE],
    [Number.MAX_VALUE, Number.MIN_VALUE],
  ] as const) {
    const expected: number =
      (Math.sqrt(2 * 0.426) * Math.sqrt(force)) / Math.sqrt(mass + virtual);
    const speed: number = AutoMovieArchetypeBow.launchSpeed(metadata(force), mass, 1);
    if (!(speed > 0 && Math.abs(speed / expected - 1) <= 1e-12))
      findings.push(
        "a representable extreme full-draw speed was lost to radicand scale",
      );
    if (AutoMovieArchetypeBow.launchSpeed(metadata(force), mass, 0) !== 0)
      findings.push("an extreme finite draw force did not preserve brace zero");
  }
  for (const draw of [undefined, 0, -1, Number.NaN, Infinity, -Infinity])
    if (
      !refuses(
        (): number => AutoMovieArchetypeBow.launchSpeed(metadata(draw), 0.02, 0.5),
        "draw",
      )
    )
      findings.push(`unknown or invalid draw force ${draw} was accepted`);

  for (const value of [0, -1, Number.NaN, Infinity, -Infinity]) {
    if (
      !refuses((): [number, number][] => AutoMovieArchetypeBow.limbs(value, 4, 1), "half")
    )
      findings.push(`invalid limb length ${value} was accepted`);
    if (
      !refuses((): [number, number][] => AutoMovieArchetypeBow.limbs(3, value, 1), "brace")
    )
      findings.push(`invalid brace length ${value} was accepted`);
  }
  for (const travel of [-1, 5, Number.NaN, Infinity, -Infinity])
    if (
      !refuses(
        (): [number, number][] => AutoMovieArchetypeBow.limbs(3, 4, travel),
        "travel",
      )
    )
      findings.push(
        `invalid or impossible table travel ${travel} was accepted`,
      );
  for (const [half, brace, travel] of [
    [Number.MAX_VALUE, Number.MAX_VALUE, 0],
    [1, Number.MAX_VALUE, Number.MAX_VALUE],
    [1, Number.MAX_VALUE, 3],
  ] as const)
    if (
      !refuses(
        (): [number, number][] => AutoMovieArchetypeBow.limbs(half, brace, travel),
        "geometry",
      )
    )
      findings.push("unrepresentable limb/nock geometry emitted a table");
  const neutral: [number, number][] = AutoMovieArchetypeBow.limbs(3, 4, 0);
  if (neutral.length !== 1 || neutral[0]?.[0] !== 0 || neutral[0]?.[1] !== 0)
    findings.push("zero stroke did not have exactly one neutral row");
  const tangent: [number, number][] = AutoMovieArchetypeBow.limbs(3, 4, 4);
  const last: [number, number] | undefined = tangent[tangent.length - 1];
  if (
    !(
      last !== undefined &&
      last[0] === 4 &&
      Math.abs(last[1] - (Math.atan2(3, 4) * 180) / Math.PI) <= 1e-12
    )
  )
    findings.push("the 3-4-5 triangle's tangent endpoint has the wrong turn");
  const small: [number, number][] = AutoMovieArchetypeBow.limbs(3e-200, 4e-200, 1e-200);
  const smallLast: [number, number] | undefined = small[small.length - 1];
  const smallExpected: number =
    ((Math.asin(41 / 50) - Math.atan2(4, 3)) * 180) / Math.PI;
  if (
    !(
      smallLast !== undefined &&
      smallLast[0] === 1e-200 &&
      Math.abs(smallLast[1] - smallExpected) <= 1e-12
    )
  )
    findings.push(
      "the finite small triangle lost its angle to squared-length underflow",
    );
  const scale: number = 2 ** -700;
  const scaledTangent: [number, number][] = AutoMovieArchetypeBow.limbs(
    3 * scale,
    4 * scale,
    4 * scale,
  );
  const scaledLast: [number, number] | undefined =
    scaledTangent[scaledTangent.length - 1];
  if (
    !(
      scaledLast !== undefined &&
      scaledLast[0] === 4 * scale &&
      Math.abs(scaledLast[1] - (Math.atan2(3, 4) * 180) / Math.PI) <= 1e-12
    )
  )
    findings.push(
      "the exactly scaled tangent triangle lost its finite endpoint",
    );
  for (const [half, brace] of [
    [1, 2 ** -600],
    [2 ** 50, 1],
  ] as const) {
    const narrowRows: [number, number][] = AutoMovieArchetypeBow.limbs(half, brace, brace);
    const narrowLast: [number, number] | undefined =
      narrowRows[narrowRows.length - 1];
    const narrowExpected: number = ((brace / half / 4) * 180) / Math.PI;
    if (
      !(
        narrowLast !== undefined &&
        narrowLast[1] > 0 &&
        Math.abs(narrowLast[1] / narrowExpected - 1) <= 1e-12
      )
    )
      findings.push(
        "a finite small positive limb turn became zero or negative by cancellation",
      );
  }
  let previous: number = -1;
  for (const [travel] of tangent) {
    if (!(travel > previous))
      findings.push("the limb table contains a repeated input row");
    previous = travel;
  }
  TestValidator.equals(
    "bow mechanics admit physical numeric inputs",
    findings,
    [],
  );

  /** A public producer fixture isolates declared force without mutating a bow. */
  function metadata(
    force: number | undefined,
  ): AutoMovieArchetype<AutoMovieArchetypeBow.Affordance, AutoMovieArchetypeBow.Dimension> {
    const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeBow.Dimension> =
      new AutoMovieArchetypeDrawSession("bow", AutoMovieArchetypeBow.UNITS, undefined, {});
    if (force !== undefined) draw.derive("draw", force);
    return new AutoMovieArchetypeBuilder<
      AutoMovieArchetypeBow.Affordance,
      AutoMovieArchetypeBow.Dimension
    >({
      name: "bow force fixture",
      material: "composite",
      draw,
    })
      .box("body", { x: 1, y: 1, z: 1 }, { x: 0, y: 0, z: 0 })
      .affordance({
        id: "string",
        kind: "slider",
        extent: null,
        travel: 1,
        parts: ["body"],
        frame: AutoMovieArchetypeFrame.upright({ x: 0, y: 0, z: 0 }),
      })
      .build(1);
  }

  /** Check the repair axis without accepting an unrelated exception. */
  function refuses(run: () => unknown, axis: string): boolean {
    try {
      run();
    } catch (error) {
      return error instanceof AutoMovieArchetypeRefusal && error.axis === axis;
    }
    return false;
  }
}
