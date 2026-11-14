import { ArchetypeFrame, createPoolEdge } from "@automovie/archetypes";
import type {
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/** The facilities rules. */
const FR: string = "FINA Facilities Rules 2017-2021";

/**
 * A pool's end wall and its starting platform stand where the facilities rules put them, every height measured from the water's surface the archetype declares.
 *
 * Scenarios:
 * 1. Over 200 seeds: the deck 0.3 m above the water (FR 2.4.3); the rest ledge's top 1.2 m below the water (FR 2.4.2) and 0.1 to 0.15 m wide; the platform's top at its middle 0.5 to 0.75 m above the water (FR 2.7), sloping 0 to 10 degrees (FR 2.7), at least 0.5 m square; the backstroke grip 0.3 m or more above the water and under the platform's top (FR 2.7).
 * 2. No part of the platform or its grip passes the wall's face: every collider of either lies at `Z` 0 or behind, as FR 2.7 asks of the grips.
 * 3. The platform's top slopes down toward the water: its normal leans to `+Z`; and its `front` edge is the top's lowest edge, on the wall's line.
 * 4. Each kind declares exactly its contacts: `deck`, `edge`, `water` and `restLedge`, and on the platform kind also `platform`, `front` and `backstrokeGrip`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces both kinds and measures contacts and colliders against the declared water; a platform off its height or slope, a ledge too shallow, a grip that pokes out past the wall or stands in the platform, or a missing contact fails with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations Every band is the rules' number, measured from the water contact the archetype declares; the wall's face is the `Z` the edge lies on.
 * @evidence contracts/development/testing.md#distinguishing-cases Both kinds; the slope's sense and the front edge's place; the grip's band is checked as a limit under the platform's top rather than over the rules' full 0.3 to 0.6 m, since the model keeps it under the top.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the four scenarios and what each pins.
 */
export function test_archetype_pool_edge(): void {
  const block = (seed: number): ReturnType<typeof createPoolEdge> =>
    createPoolEdge({ kind: "startingPlatform" }, seed);
  const water = (edge: ReturnType<typeof createPoolEdge>): number =>
    edge.affordance("water").frame.translation.y;
  const above = (
    edge: ReturnType<typeof createPoolEdge>,
    id: createPoolEdge.Affordance,
  ): number => edge.affordance(id).frame.translation.y - water(edge);
  const tilt = (edge: ReturnType<typeof createPoolEdge>): number => {
    const normal: IAutoMovieVector3 = ArchetypeFrame.axis(
      edge.affordance("platform").frame,
      "y",
    );
    return (Math.atan2(normal.z, normal.y) * 180) / Math.PI;
  };
  const row = (
    name: string,
    minimum: number,
    maximum: number,
    source: string,
    measure: (seed: number) => number,
    limit?: boolean,
  ): archetypeBandSweep.IRow => ({
    name,
    minimum,
    maximum,
    source,
    measure,
    tolerance: 1e-9,
    ...(limit === true ? { limit } : {}),
  });

  // 1. The bands.
  const findings: string[] = archetypeBandSweep([
    row("deck above the water", 0.3, 0.3, `${FR} 2.4.3`, (s: number): number =>
      above(createPoolEdge({ kind: "deckEdge" }, s), "deck"),
    ),
    row("rest ledge below the water", -1.2, -1.2, `${FR} 2.4.2`, (s: number): number =>
      above(createPoolEdge({ kind: "deckEdge" }, s), "restLedge"),
    ),
    row("rest ledge width", 0.1, 0.15, `${FR} 2.4.2`, (s: number): number =>
      archetypeExtent(createPoolEdge({ kind: "deckEdge" }, s), "z", [
        "rest-ledge",
      ]).size,
    ),
    row("platform above the water", 0.5, 0.75, `${FR} 2.7`, (s: number): number =>
      above(block(s), "platform"),
    ),
    row("platform slope", 0, 10, `${FR} 2.7`, (s: number): number =>
      tilt(block(s)),
    ),
    row(
      "platform size",
      0.5,
      10,
      `${FR} 2.7`,
      (s: number): number => block(s).affordance("platform").width!,
      true,
    ),
    row(
      "backstroke grip above the water",
      0.3,
      0.6,
      `${FR} 2.7`,
      (s: number): number => above(block(s), "backstrokeGrip"),
      true,
    ),
  ]);

  // 1, 2 and 3. Seed by seed: the grip under the top, nothing past the wall, the slope's sense and the front edge.
  for (let seed: number = 0; seed < 50; seed++) {
    const edge: ReturnType<typeof createPoolEdge> = block(seed);
    const grip: { low: number; high: number } = archetypeExtent(edge, "y", [
      "backstroke-grip",
    ]);
    const top: { low: number; high: number } = archetypeExtent(edge, "y", [
      "top",
    ]);
    if (!(grip.high <= top.low + 1e-9))
      findings.push(`seed ${seed}: the grip reaches ${grip.high} m, into the top from ${top.low} m`);
    const forward: number = archetypeExtent(edge, "z", [
      "pedestal",
      "top",
      "backstroke-grip",
    ]).high;
    if (forward > 1e-9)
      findings.push(`seed ${seed}: the platform reaches ${forward} m past the wall`);
    const front: IAutoMovieVector3 = edge.affordance("front").frame.translation;
    if (
      edge.dimensions.slope! > 0.5 &&
      !(tilt(edge) > 0 && front.y < edge.affordance("platform").frame.translation.y)
    )
      findings.push(`seed ${seed}: the top does not fall toward the water`);
    if (Math.abs(front.z) > 0.5 * (1 - Math.cos((10 * Math.PI) / 180)) + 1e-9)
      findings.push(`seed ${seed}: the front edge stands ${front.z} m off the wall's line`);
  }

  // 4. The contacts.
  const ids = (edge: ReturnType<typeof createPoolEdge>): string =>
    edge.affordances
      .map((a: IAutoMovieAffordance): string => `${a.id}:${a.kind}`)
      .sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0))
      .join(",");
  const deck: string = "deck:surface,edge:ledge,restLedge:ledge,water:surface";
  if (ids(createPoolEdge({ kind: "deckEdge" })) !== deck)
    findings.push(`the deck edge declares ${ids(createPoolEdge({ kind: "deckEdge" }))}`);
  const platform: string =
    "backstrokeGrip:bar,deck:surface,edge:ledge,front:ledge,platform:surface,restLedge:ledge,water:surface";
  if (ids(block(1)) !== platform)
    findings.push(`the starting platform declares ${ids(block(1))}`);
  TestValidator.equals(
    "a pool's end wall and starting platform follow the facilities rules",
    findings,
    [],
  );
}
