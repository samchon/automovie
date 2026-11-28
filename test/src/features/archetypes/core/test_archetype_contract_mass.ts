import { type AutoMovieArchetype, AutoMovieArchetypeBuilder, AutoMovieArchetypeDrawSession, AutoMovieArchetypeMass, AutoMovieArchetypeUnits, AutoMovieArchetypeClub } from "@automovie/archetypes";
import type { IAutoMoviePrimitiveShape } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../../internal/predicates";

/** An empty builder for a made-up solid. */
function builder(): AutoMovieArchetypeBuilder<never, never> {
  return new AutoMovieArchetypeBuilder<never, never>({
    material: "steel",
    name: "solid",
    draw: new AutoMovieArchetypeDrawSession<never>("solid", {}, undefined),
  });
}

/**
 * An archetype's mass properties follow from its parts, and a bat's come out where measured bats' do.
 *
 * Scenarios:
 * 1. One box of 0.2 by 0.4 by 0.6 m and 12 kg has its centre of mass at its centre and the textbook moments m (b squared + c squared) / 12 about each axis: 0.52, 0.40 and 0.20 kg m squared.
 * 2. Two equal balls a metre apart on X have their centre of mass midway and, about Y, twice the ball's own 2/5 m r squared plus twice m times a quarter: the parallel-axis theorem.
 * 3. A rod of length 1 m and 3 kg along Y has m l squared / 3 = 1 kg m squared about a perpendicular line through its end, read through `moment`, to within the 3 r squared term of a thin rod.
 * 4. A denser part pulls the centre of mass toward itself: two equal boxes side by side, one three times as dense, balance three quarters of the way to the dense one's centre.
 * 5. Each of the four maple bats of Nathan, Smith and Russell 2026, built as that bat, has a moment of inertia about a line across it 6 in (0.1524 m) from the knob within a tenth of its own measured moment.
 * 6. The S154 bat balances, to a nanometre, at the volume-weighted mean height of the bars it is built of, on its axis: one wood throughout, so its balance follows from its shape alone.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the box, separated sphere, rod, uneven density and bat cases, including their units and axes.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public builder's mass properties and measures bat moments and balance through the resulting archetypes. The assertions distinguish primitive inertia, translation of inertia, mass weighting and geometry-dependent bat balance.
 * @evidence contracts/development/testing.md#independent-expectations Uses closed-form moments for the box, spheres and rod, as well as the volume-weighted centroid of coaxial cylinders. The bat comparison uses each measured result of Nathan, Smith and Russell 2026 with a 10 percent allowance for the stepped model profile.
 */
export function test_archetype_contract_mass(): void {
  const box: AutoMovieArchetypeMass.IProperties = builder()
    .box("box", { x: 0.2, y: 0.4, z: 0.6 }, { x: 1, y: 2, z: 3 })
    .build(12).properties;
  TestValidator.predicate(
    "a box's centre and moments",
    vclose(box.centerOfMass, { x: 1, y: 2, z: 3 }, 1e-12) &&
      nclose(box.inertia.xx, 0.52, 1e-9) &&
      nclose(box.inertia.yy, 0.4, 1e-9) &&
      nclose(box.inertia.zz, 0.2, 1e-9) &&
      nclose(box.inertia.xy, 0, 1e-12),
  );

  const pair: AutoMovieArchetypeMass.IProperties = builder()
    .ball("a", 0.1, { x: -0.5, y: 0, z: 0 })
    .ball("b", 0.1, { x: 0.5, y: 0, z: 0 })
    .build(4).properties;
  TestValidator.predicate(
    "two balls by the parallel-axis theorem",
    vclose(pair.centerOfMass, { x: 0, y: 0, z: 0 }, 1e-12) &&
      nclose(pair.inertia.yy, 2 * (0.4 * 2 * 0.01) + 2 * 2 * 0.25, 1e-9) &&
      nclose(pair.inertia.xx, 2 * (0.4 * 2 * 0.01), 1e-9),
  );

  const rod: AutoMovieArchetype<never, never> = builder()
    .rod("rod", 0.005, { x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 })
    .build(3);
  TestValidator.predicate(
    "a rod about its end",
    nclose(
      rod.moment({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }),
      1 + (3 * 0.005 * 0.005) / 4,
      1e-9,
    ),
  );

  const uneven: AutoMovieArchetypeMass.IProperties = builder()
    .box("light", { x: 1, y: 1, z: 1 }, { x: 0, y: 0, z: 0 })
    .box("dense", { x: 1, y: 1, z: 1 }, { x: 1, y: 0, z: 0 }, { density: 3 })
    .build(8).properties;
  TestValidator.predicate(
    "density shifts the balance",
    nclose(uneven.centerOfMass.x, 0.75, 1e-12),
  );

  // An ounce inch squared in kilogram metres squared.
  const OZ_IN2: number =
    AutoMovieArchetypeUnits.OUNCE *
    AutoMovieArchetypeUnits.INCH *
    AutoMovieArchetypeUnits.INCH;
  for (const [model, measured] of [
    ["s154", 13354],
    ["s155", 13302],
    ["t153", 13117],
    ["t156", 13527],
  ] as const) {
    const swing: number = AutoMovieArchetypeClub.create({ kind: "bat", model }).moment(
      { x: 0, y: 6 * AutoMovieArchetypeUnits.INCH, z: 0 },
      { x: 1, y: 0, z: 0 },
    );
    TestValidator.predicate(
      `the ${model} bat's moment of inertia about the 6 in point, ${swing} kg m^2, is its measured ${measured * OZ_IN2}`,
      Math.abs(swing - measured * OZ_IN2) <= 0.1 * measured * OZ_IN2,
    );
  }
  const bat: ReturnType<typeof AutoMovieArchetypeClub.create> = AutoMovieArchetypeClub.create({
    kind: "bat",
    model: "s154",
  });
  const balance: number = bat.properties.centerOfMass.y;

  // One wood throughout, so each bar weighs as its volume, radius squared times length, and the bat balances at the bars' volume-weighted mean height.
  let volume: number = 0;
  let moment: number = 0;
  for (const part of bat.parts) {
    const shape: IAutoMoviePrimitiveShape | null =
      part.geometry.type === "primitive" ? part.geometry.shape : null;
    if (shape === null || shape.type !== "cylinder")
      throw new Error(`bat part ${part.id} is not a plain bar`);
    volume += shape.radius * shape.radius * shape.height;
    moment +=
      shape.radius *
      shape.radius *
      shape.height *
      part.transform!.translation.y;
  }
  TestValidator.predicate(
    `a bat's balance point, ${balance} m from the knob, is its bars' volume-weighted mean, ${moment / volume} m`,
    nclose(balance, moment / volume, 1e-9) &&
      nclose(bat.properties.centerOfMass.x, 0, 1e-12) &&
      nclose(bat.properties.centerOfMass.z, 0, 1e-12),
  );
}
