import {
  AutoMovieArchetype,
  AutoMovieArchetypeAssembly,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type AutoMovieArchetypeFriction,
} from "@automovie/archetypes";
import { validateModel } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * A mass-weighted friction approximation survives subnormal physical masses.
 *
 * Scenarios:
 * 1. One wood-on-wood member keeps static .5 and kinetic .3 at MIN_VALUE,
 *    unit mass and MAX_VALUE/8 kg; no coefficient-times-mass intermediate
 *    may erase those dimensionless coefficients.
 * 2. Wood on wood and rubber on concrete with masses in the ratio 1:3 give
 *    (.5+3*1)/4=.875 and (.3+3*.7)/4=.6 at all three scales.
 * 3. An undeclared pair keeps both aggregate coefficients absent. A member
 *    with only static wood-on-brick .6 keeps kinetic friction unknown while
 *    the two equally weighted static coefficients average to .55.
 * 4. Authored ordered static/kinetic pairs with a 2^-200 relative mass keep
 *    kinetic<=static under independent mean scaling. Their exact means both
 *    round to .04 in either member order and at two common mass scales.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists four scenarios, cited fixture pairs, explicitly authored rounding-boundary data, the existing mass-weighted approximation, binary64 mass scales and independent dimensionless expectations; no claim of measured compound friction is made.
 * @evidence contracts/development/testing.md#behavioral-verification Builds tiny real bodies and assemblies through public APIs, checks both coefficient projections and model admission, and preserves absent coefficients. Direct subnormal weighted products, unweighted averaging and unknown-as-zero all fail.
 * @evidence contracts/development/testing.md#independent-expectations Published member pairs supply literal .5/.3, 1/.7 and .6/unknown. A singleton's convex mean is its coefficient, 1:3 weights give .875/.6, and equal .5/.6 give .55 independently of implementation normalization. For masses 1:2^-200 and authored static [.04,73/128], kinetic [.04,.5], each mean differs from .04 by less than 2^-200, far below half its binary64 ulp 2^-58, so both must round exactly to .04. That exact expectation catches a one-ulp inversion without relaxing the shared nclose tolerance.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts least-positive, ordinary and large finite masses; singleton versus unequal weights; known static/kinetic versus missing pair or missing kinetic; both orders of a missing member; and ordered authored pairs whose independent floating scales can reverse their aggregate order.
 * @evidence contracts/development/testing.md#execution-ownership One synchronous portable entry owns all models and inputs, launches no host or compiler, and uses no method override, private helper or mutable coefficient patch.
 */
export function test_archetype_assembly_friction_numeric(): void {
  const findings: string[] = [];
  const origin: AutoMovieArchetypeAssembly.IMember["placement"] =
    AutoMovieArchetypeFrame.upright({ x: 0, y: 0, z: 0 });
  const scales: readonly number[] = [Number.MIN_VALUE, 1, Number.MAX_VALUE / 8];

  /** The builder selects an existing measured pair without changing its table. */
  const build: (
    mass: number,
    rests?: AutoMovieArchetypeFriction.Material,
    ground?: AutoMovieArchetypeFriction.Material,
  ) => AutoMovieArchetype = (
    mass: number,
    rests?: AutoMovieArchetypeFriction.Material,
    ground?: AutoMovieArchetypeFriction.Material,
  ): AutoMovieArchetype =>
    new AutoMovieArchetypeBuilder<never, never>({
      material: "composite",
      name: "assembly contact fixture",
      draw: new AutoMovieArchetypeDrawSession<never>(
        "assembly contact fixture",
        {},
        undefined,
      ),
    })
      .box("body", { x: 1, y: 1, z: 1 }, { x: 0, y: 0, z: 0 })
      .build(mass, { rests, ground });

  /** A second nonoverlapping member retains a separately placed local solid. */
  const combine: (
    a: AutoMovieArchetype,
    b: AutoMovieArchetype,
  ) => AutoMovieArchetype = (
    a: AutoMovieArchetype,
    b: AutoMovieArchetype,
  ): AutoMovieArchetype =>
    AutoMovieArchetypeAssembly.of("contact pair", "assembly contact fixture", {
      a: { archetype: a, placement: origin },
      b: {
        archetype: b,
        placement: AutoMovieArchetypeFrame.upright({ x: 2, y: 0, z: 0 }),
      },
    });

  for (const mass of scales) {
    const wood: AutoMovieArchetype = build(mass, "wood", "wood");
    const single: AutoMovieArchetype = AutoMovieArchetypeAssembly.of(
      "single",
      "assembly contact fixture",
      {
        a: { archetype: wood, placement: origin },
      },
    );
    const weighted: AutoMovieArchetype = combine(
      wood,
      build(3 * mass, "rubber", "concrete"),
    );
    if (
      !nclose(single.body.friction ?? NaN, 0.5) ||
      !nclose(single.body.kineticFriction ?? NaN, 0.3)
    )
      findings.push(
        `${mass}: one member's known friction was lost to physical scale`,
      );
    if (
      !nclose(weighted.body.friction ?? NaN, 0.875) ||
      !nclose(weighted.body.kineticFriction ?? NaN, 0.6)
    )
      findings.push(
        `${mass}: unequal mass-weighted friction changed with scale`,
      );
    if (
      !validateModel({ model: single }).success ||
      !validateModel({ model: weighted }).success
    )
      findings.push(
        `${mass}: finite mass/coefficient assemblies failed model admission`,
      );
  }

  const known: AutoMovieArchetype = build(Number.MIN_VALUE, "wood", "wood");
  const unknown: AutoMovieArchetype = build(Number.MIN_VALUE);
  for (const members of [
    [known, unknown],
    [unknown, known],
  ] as const) {
    const assembled: AutoMovieArchetype = combine(members[0], members[1]);
    if (
      assembled.body.friction !== undefined ||
      assembled.body.kineticFriction !== undefined
    )
      findings.push(
        "an unknown member acquired aggregate contact coefficients",
      );
  }
  const staticOnly: AutoMovieArchetype = combine(
    known,
    build(Number.MIN_VALUE, "wood", "brick"),
  );
  if (
    !nclose(staticOnly.body.friction ?? NaN, 0.55) ||
    staticOnly.body.kineticFriction !== undefined
  )
    findings.push(
      "a missing kinetic measurement erased known static friction or became zero",
    );

  /** Transfer one public builder's neutral solid into explicitly authored contact metadata. */
  const authored: (
    mass: number,
    friction: number,
    kinetic: number,
  ) => AutoMovieArchetype = (
    mass: number,
    friction: number,
    kinetic: number,
  ): AutoMovieArchetype => {
    const solid: AutoMovieArchetype = build(mass);
    const name: string | null = solid.name;
    if (name === null)
      throw new Error(
        "the authored contact fixture needs its builder's named solid",
      );
    return new AutoMovieArchetype<never, never>({
      archetype: solid.archetype,
      id: solid.id,
      name,
      parts: solid.parts,
      affordances: [],
      materials: solid.materials,
      properties: solid.properties,
      friction,
      kineticFriction: kinetic,
      material: "composite",
      restitution: null,
      surfaces: {},
      drag: null,
      contact: null,
      fractures: [],
      masses: { body: mass },
      dimensions: {},
      provenance: { bands: {}, models: {}, figures: {}, units: {} },
      spans: [],
    });
  };
  for (const scale of [1, 2 ** 200]) {
    const a: AutoMovieArchetype = authored(scale, 0.04, 0.04);
    const b: AutoMovieArchetype = authored(scale * 2 ** -200, 73 / 128, 0.5);
    for (const pair of [
      [a, b],
      [b, a],
    ] as const) {
      const assembled: AutoMovieArchetype = combine(pair[0], pair[1]);
      if (
        !nclose(assembled.body.friction ?? NaN, 0.04, 0) ||
        !nclose(assembled.body.kineticFriction ?? NaN, 0.04, 0) ||
        !validateModel({ model: assembled }).success
      )
        findings.push(
          "independent mean rounding reversed an authored static/kinetic order",
        );
    }
  }

  TestValidator.equals(
    "assembly friction retains its declared weighted approximation at every finite mass scale",
    findings,
    [],
  );
}
