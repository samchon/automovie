import {
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  createLongTool,
  createTool,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../internal/archetypeExtent";

/**
 * A 6-pdr field gun's sponge and rammer, worm, trail handspike and priming wire are the 1862 Ordnance Manual's, measured on the produced things, and their masses sit where the manual's weights and the woods' densities put them.
 *
 * Scenarios:
 * 1. The sponge and rammer is 77 in long and 4.5 lb, its sponge 2.7 in across with 0.75 in loops round it, its balance where the ash staff and rammer head, the elm sponge head and the 0.25 lb of wool put it; the rammer head's end is its `face`, facing down, and the sponge's end its `tip`, `+Y` along it.
 * 2. The worm is 72 in long and 3.6 lb, its worm 3 in across, and its 1.5 lb of iron lies within the iron's 9 in at its foot; the worm's point is its `face`, `+Y` down along the tool.
 * 3. The trail handspike is 53 in long and 7.25 lb, and the shaft the hands hold is no thinner than its 1.5 in small end and no thicker than its 3 in largest.
 * 4. The priming wire is the 2 in ring and the 8 in stem, the 0.175 in wire pinched at the ring, its point `+Y` along it, and weighs the garrison wire's 0.08 lb scaled by the length of wire in each.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces each implement and measures its colliders, frames, mass and balance; a size, a weight or a wood other than the manual's, or a working end off its place, is caught.
 * @evidence contracts/development/testing.md#independent-expectations The manual's figures (pp. 128-140), The Wood Database's white ash at 675 and American elm at 560 kg per cubic metre, and the wire lengths of a ring and a stem.
 * @evidence contracts/development/testing.md#distinguishing-cases Four implements of two producers, a read split, a split by density and a uniform one; the producers' older kinds belong to their band tests.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios and what each pins.
 */
export function test_archetype_props_field_implements(): void {
  const inch: number = AutoMovieArchetypeUnits.INCH;
  const pound: number = AutoMovieArchetypeUnits.POUND;
  const findings: string[] = [];
  const near: (
    name: string,
    got: number,
    wanted: number,
    tolerance: number,
  ) => void = (
    name: string,
    got: number,
    wanted: number,
    tolerance: number,
  ): void => {
    if (Math.abs(got - wanted) > tolerance)
      findings.push(`${name}: ${got}, ${wanted} expected`);
  };

  // 1. The sponge and rammer.
  const sponge: ReturnType<typeof createLongTool> = createLongTool({
    kind: "spongeRammer",
  });
  near(
    "sponge and rammer length",
    archetypeExtent(sponge, "y").size,
    77 * inch,
    1e-9,
  );
  near("sponge and rammer mass", sponge.body.mass, 4.5 * pound, 1e-9);
  near(
    "sponge across its loops",
    archetypeExtent(sponge, "x").size,
    (2.7 + 2 * 0.75) * inch,
    1e-9,
  );
  const rammer: number = 675 * Math.PI * 1.62 * 1.62 * 4;
  const staff: number = 675 * Math.PI * 0.75 * 0.75 * (77 - 4 - 7.5);
  const head: number = 560 * Math.PI * 1.35 * 1.35 * 7.5;
  const wood: number = (4.5 - 0.25) / (rammer + staff + head);
  const balance: number =
    (wood * rammer * 2 +
      wood * staff * (4 + (77 - 4 - 7.5) / 2) +
      (wood * head + 0.25) * (77 - 7.5 / 2)) /
    4.5;
  near(
    "sponge and rammer balance",
    sponge.body.centerOfMass!.y,
    balance * inch,
    1e-9,
  );
  const face: ReturnType<typeof sponge.affordance> = sponge.affordance("face");
  const tip: ReturnType<typeof sponge.affordance> = sponge.affordance("tip");
  near("rammer face height", face.frame.translation.y, 0, 1e-12);
  near(
    "rammer face looks down",
    AutoMovieArchetypeFrame.axis(face.frame, "y").y,
    -1,
    1e-12,
  );
  near("sponge tip height", tip.frame.translation.y, 77 * inch, 1e-9);
  near(
    "sponge tip runs up",
    AutoMovieArchetypeFrame.axis(tip.frame, "y").y,
    1,
    1e-12,
  );

  // 2. The worm.
  const worm: ReturnType<typeof createLongTool> = createLongTool({
    kind: "worm",
  });
  near("worm length", archetypeExtent(worm, "y").size, 72 * inch, 1e-9);
  near("worm mass", worm.body.mass, 3.6 * pound, 1e-9);
  near("worm circle", archetypeExtent(worm, "x").size, 3 * inch, 1e-9);
  // The staff's 2.1 lb stands between the iron's top and the end; the iron's 1.5 lb within the first 9 in.
  const iron: number =
    (worm.body.centerOfMass!.y * 3.6 - 2.1 * ((9 + 72) / 2) * inch) / 1.5;
  if (iron < 0 || iron > 9 * inch)
    findings.push(`worm iron's balance at ${iron} m, outside its 9 in`);
  const point: ReturnType<typeof worm.affordance> = worm.affordance("face");
  near("worm point height", point.frame.translation.y, 0, 1e-12);
  near(
    "worm point runs down",
    AutoMovieArchetypeFrame.axis(point.frame, "y").y,
    -1,
    1e-12,
  );

  // 3. The trail handspike.
  const handspike: ReturnType<typeof createLongTool> = createLongTool({
    kind: "trailHandspike",
  });
  near(
    "handspike length",
    archetypeExtent(handspike, "y").size,
    53 * inch,
    1e-9,
  );
  near("handspike mass", handspike.body.mass, 7.25 * pound, 1e-9);
  const held: number = handspike.affordance("shaft").aperture!;
  if (held < 1.5 * inch || held > 3 * inch)
    findings.push(`handspike shaft ${held} m across, outside 1.5 to 3 in`);

  // 4. The priming wire.
  const wire: ReturnType<typeof createTool> = createTool({
    kind: "primingWire",
  });
  near("priming wire length", archetypeExtent(wire, "y").size, 10 * inch, 1e-9);
  near("priming wire ring", archetypeExtent(wire, "z").size, 2 * inch, 1e-9);
  const ring: number = Math.PI * (2 - 0.175);
  near(
    "priming wire mass",
    wire.body.mass,
    (0.08 * pound * (8 + ring)) / (14 + ring),
    1e-12,
  );
  near(
    "priming wire pinch",
    wire.affordance("grip").aperture!,
    0.175 * inch,
    1e-12,
  );
  const end: ReturnType<typeof wire.affordance> = wire.affordance("face");
  near("priming wire point", end.frame.translation.y, 10 * inch, 1e-9);
  near(
    "priming wire point runs up",
    AutoMovieArchetypeFrame.axis(end.frame, "y").y,
    1,
    1e-12,
  );

  TestValidator.equals(
    "the field gun's implements are the 1862 Ordnance Manual's",
    findings,
    [],
  );
}
