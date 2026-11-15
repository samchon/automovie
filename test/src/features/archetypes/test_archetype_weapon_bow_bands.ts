import { ArchetypeUnits, ArchetypeCourse, ArchetypeFrame, createBow } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/**
 * A longbow and a horse bow stay inside their cited sizes for every seed, measured on the produced thing, a longbow braced a twelfth of its length and a horse bow at its read brace height, each standing on the floor.
 *
 * Scenarios:
 * 1. Over 200 seeds, inside the band and spanning at least 80 % of it where it has width: the string 1.67 m to 66 in nock to nock, the grip 29.79 mm deep, 785 to 905 g, a draw of 101 to 141 lbf; a horse bow's string 48 to 53 in, its grip in the 30 to 40 mm power grip band, 315 to 330 g, a draw of 15 to 60 lbf, braced 14 to 15 cm.
 * 2. For three seeds, a longbow's string stands a twelfth of its length clear of the grip's belly, a horse bow's its drawn brace height, the `nock` lies on the string level with the grip and facing the archer's `+Z`, and the lowest point is on the floor.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces the bow for 200 seeds and measures its string, grip width, mass, draw and the string's standoff from the grip; a length or a section other than the study's, a seed that does not vary it, a string at another brace height, or a bow off the floor is caught.
 * @evidence contracts/development/testing.md#independent-expectations The Mary Rose bow X1-3 and its approximations in Aston and Spencer's study; the brace rule of one twelfth of the length; the Freddie KTB horse bows' dealer figures and Kong and Lowe's power grip band.
 * @evidence contracts/development/testing.md#distinguishing-cases Both built kinds, a brace by rule against a read one; the bows that wait for sources have no rows.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the two scenarios and what each pins.
 */
export function test_archetype_weapon_bow_bands(): void {
  const bow = (seed: number): ReturnType<typeof createBow> =>
    createBow({ kind: "longbow" }, seed);
  const horse = (seed: number): ReturnType<typeof createBow> =>
    createBow({ kind: "horseBow" }, seed);
  const row = (
    name: string,
    minimum: number,
    maximum: number,
    measure: (seed: number) => number,
  ): archetypeBandSweep.IRow => ({
    name,
    minimum,
    maximum,
    source: "Mary Rose bow X1-3 and its approximations",
    measure,
  });
  const findings: string[] = archetypeBandSweep([
    row(
      "length",
      1.67,
      66 * ArchetypeUnits.INCH,
      (s: number): number => archetypeExtent(bow(s), "y", ["string"]).size,
    ),
    row(
      "grip",
      0.02979,
      0.02979,
      (s: number): number => bow(s).affordance("grip").aperture!,
    ),
    row("mass", 0.785, 0.905, (s: number): number => bow(s).body.mass),
    row(
      "horse bow length",
      48 * ArchetypeUnits.INCH,
      53 * ArchetypeUnits.INCH,
      (s: number): number => archetypeExtent(horse(s), "y", ["string"]).size,
    ),
    row(
      "horse bow grip",
      0.03,
      0.04,
      (s: number): number => horse(s).affordance("grip").aperture!,
    ),
    row("horse bow mass", 0.315, 0.33, (s: number): number => horse(s).body.mass),
    row(
      "horse bow draw",
      15 * ArchetypeUnits.POUND * ArchetypeCourse.GRAVITY,
      60 * ArchetypeUnits.POUND * ArchetypeCourse.GRAVITY,
      (s: number): number => horse(s).dimensions.draw!,
    ),
    row("horse bow brace", 0.14, 0.15, (s: number): number => {
      const made: ReturnType<typeof createBow> = horse(s);
      return (
        archetypeExtent(made, "z", ["string"]).low +
        createBow.STRING -
        archetypeExtent(made, "z", ["grip"]).high
      );
    }),
    row(
      "draw",
      101 * ArchetypeUnits.POUND * ArchetypeCourse.GRAVITY,
      141 * ArchetypeUnits.POUND * ArchetypeCourse.GRAVITY,
      (s: number): number => bow(s).dimensions.draw!,
    ),
  ]);
  for (const seed of [0, 1, 2]) {
    const longbow: ReturnType<typeof createBow> = bow(seed);
    const length: number = archetypeExtent(longbow, "y", ["string"]).size;
    const belly: number = archetypeExtent(longbow, "z", ["grip"]).high;
    const string: number = archetypeExtent(longbow, "z", ["string"]).low;
    const grip: ReturnType<typeof longbow.affordance> =
      longbow.affordance("grip");
    const nock: ReturnType<typeof longbow.affordance> =
      longbow.affordance("nock");
    if (Math.abs(string + createBow.STRING - belly - length / 12) > 1e-9)
      findings.push(`longbow@${seed}: the brace is not a twelfth`);
    if (
      Math.abs(nock.frame.translation.y - grip.frame.translation.y) > 1e-9 ||
      Math.abs(nock.frame.translation.z - (string + createBow.STRING)) > 1e-9 ||
      Math.abs(ArchetypeFrame.axis(nock.frame, "y").z - 1) > 1e-12
    )
      findings.push(`longbow@${seed}: the nock is off the string at the grip`);
    if (Math.abs(archetypeExtent(longbow, "y").low) > 1e-9)
      findings.push(
        `longbow@${seed}: off the floor by ${archetypeExtent(longbow, "y").low} m`,
      );
  }
  for (const seed of [0, 1, 2])
    if (Math.abs(archetypeExtent(horse(seed), "y").low) > 1e-9)
      findings.push(`horse bow@${seed}: off the floor`);
  TestValidator.equals("the bows stay in their cited bands", findings, []);
}
