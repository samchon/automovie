import {
  type Archetype,
  ArchetypeBuilder,
  ArchetypeMass,
  createClub,
} from "@automovie/archetypes";
import type { AutoMoviePrimitiveShape } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../internal/predicates";

/** An empty builder for a made-up solid. */
function builder(): ArchetypeBuilder<never, never> {
  return new ArchetypeBuilder<never, never>({
    archetype: "solid",
    name: "solid",
    dimensions: {},
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
 * 5. A wood bat of 0.893 m and 0.970 kg, the bats of Nathan, Smith and Russell 2026, has a moment of inertia about a line across it 6 in (0.1524 m) from the knob within a tenth of their measured 0.240 to 0.247 kg m squared.
 * 6. A bat of 0.84 m and 0.849 kg balances, to a nanometre, at the volume-weighted mean height of the bars it is built of, on its axis: one wood throughout, so its balance follows from its shape alone.
 * 7. That bat balances within 5 cm of the 0.526 m from the knob that Cross measured on a bat of that length and mass. The model, with its other dimensions at the middle of their bands, balances at about 0.562 m, 36 mm nearer the tip than the measured bat.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds solids and a bat through the public builder and producer and reads their mass properties; a wrong primitive formula, a missed parallel-axis term, a density applied the wrong way, a bat part weighed other than by its volume or a bat profile that puts the wood in the wrong place is caught.
 * @evidence contracts/development/testing.md#independent-expectations Scenarios 1 to 4 use closed-form rigid-body results worked by hand here. Scenario 5's moments are the four bats of Nathan, Smith and Russell, Studies of the Torpedo Bat, ISEA 2026, Table 1 (13117 to 13527 oz in squared about the standard point 6 in from the knob). Scenario 6 is the centroid of coaxial uniform cylinders, the sum of radius squared times length times centre height over the sum of radius squared times length, worked here from each part's own radius, length and place. Scenario 7's balance point is R. Cross's measured bat (https://www.physics.sydney.edu.au/~cross/baseball.html). The 10 % and 5 cm tolerances allow for a bat's real taper, which the model steps, and for the measured bat's hollow aluminium barrel; the 5 cm is coarse, leaving 14 mm beyond the measured 36 mm gap, so scenario 7 catches only a profile grossly off and scenario 6 is what holds the balance to the shape.
 * @evidence contracts/development/testing.md#distinguishing-cases Each primitive rule alone, then the composite, then a real object against its own shape and against measurement; an aluminium bat's hollow barrel is why scenario 7 is given the wider tolerance.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the seven scenarios and what each pins.
 */
export function test_archetype_contract_mass(): void {
  const box: ArchetypeMass.IProperties = builder()
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

  const pair: ArchetypeMass.IProperties = builder()
    .ball("a", 0.1, { x: -0.5, y: 0, z: 0 })
    .ball("b", 0.1, { x: 0.5, y: 0, z: 0 })
    .build(4).properties;
  TestValidator.predicate(
    "two balls by the parallel-axis theorem",
    vclose(pair.centerOfMass, { x: 0, y: 0, z: 0 }, 1e-12) &&
      nclose(pair.inertia.yy, 2 * (0.4 * 2 * 0.01) + 2 * 2 * 0.25, 1e-9) &&
      nclose(pair.inertia.xx, 2 * (0.4 * 2 * 0.01), 1e-9),
  );

  const rod: Archetype<never, never> = builder()
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

  const uneven: ArchetypeMass.IProperties = builder()
    .box("light", { x: 1, y: 1, z: 1 }, { x: 0, y: 0, z: 0 })
    .box("dense", { x: 1, y: 1, z: 1 }, { x: 1, y: 0, z: 0 }, { density: 3 })
    .build(8).properties;
  TestValidator.predicate(
    "density shifts the balance",
    nclose(uneven.centerOfMass.x, 0.75, 1e-12),
  );

  const wood: ReturnType<typeof createClub> = createClub({
    kind: "bat",
    length: 0.893,
    mass: 0.97,
  });
  const swing: number = wood.moment(
    { x: 0, y: 0.1524, z: 0 },
    { x: 1, y: 0, z: 0 },
  );
  TestValidator.predicate(
    `a wood bat's moment of inertia about the 6 in point, ${swing} kg m^2, is a measured bat's`,
    swing >= 0.24 * 0.9 && swing <= 0.247 * 1.1,
  );
  const bat: ReturnType<typeof createClub> = createClub({
    kind: "bat",
    length: 0.84,
    mass: 0.849,
  });
  const balance: number = bat.properties.centerOfMass.y;

  // One wood throughout, so each bar weighs as its volume, radius squared times length, and the bat balances at the bars' volume-weighted mean height.
  let volume: number = 0;
  let moment: number = 0;
  for (const part of bat.parts) {
    const shape: AutoMoviePrimitiveShape | null =
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
  TestValidator.predicate(
    `a bat's balance point, ${balance} m from the knob, is a measured bat's`,
    Math.abs(balance - 0.526) <= 0.05,
  );
}
