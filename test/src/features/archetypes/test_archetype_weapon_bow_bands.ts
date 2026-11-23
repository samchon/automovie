import {
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  createBow,
} from "@automovie/archetypes";
import { AutoMovieGravity } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/** The string's two halves, each a span from a limb tip to the nock. */
const STRING_PARTS: string[] = ["string-upper", "string-lower"];

/**
 * A longbow, a recurve and a horse bow stay inside their cited sizes for every seed, measured on the produced thing, a longbow braced a twelfth of its length and the others at their read brace heights, each standing on the floor.
 *
 * Scenarios:
 * 1. Over 200 seeds, inside the band and spanning at least 80 % of it where it has width: the string 1.67 m to 66 in nock to nock, the grip 29.79 mm deep, 785 to 905 g, a draw of 101 to 141 lbf; a recurve's string 68 or 70 in, its grip in the power grip band, 1,133 to 1,338 g (its riser's, provisional), a draw of 49 to 54 lbf, braced 8.5 to 9.5 in over its two lengths' bands; a crossbow 10 to 12 lb, its bow 2 ft 6 in between extremes (Payne-Gallwey); a horse bow's string 48 to 53 in, its grip in the 30 to 40 mm power grip band, 315 to 330 g, a draw of 15 to 60 lbf, braced 14 to 15 cm.
 * 2. For three seeds, a longbow's string stands a twelfth of its length clear of the grip's belly, a horse bow's its drawn brace height, the `nock` lies on the string level with the grip and facing the archer's `+Z`, and the lowest point is on the floor.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces the bow for 200 seeds and measures its string, grip width, mass, draw and the string's standoff from the grip with finite-safe comparisons; a length or a section other than the study's, a seed that does not vary it, a string at another brace height, or a bow off the floor is caught.
 * @evidence contracts/development/testing.md#independent-expectations The Mary Rose bow X1-3 and its approximations in Aston and Spencer's study; the brace rule of one twelfth of the length; the Freddie KTB horse bows' dealer figures and Kong and Lowe's power grip band.
 * @evidence contracts/development/testing.md#distinguishing-cases All four built kinds contribute measured dimension rows; the longbow's brace rule is checked against its geometry, with longbow and horse-bow floor checks. No launch speed is inferred for the crossbow's unread force.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the two scenarios and what each pins.
 */
export function test_archetype_weapon_bow_bands(): void {
  const bow: (seed: number) => ReturnType<typeof createBow> = (
    seed: number,
  ): ReturnType<typeof createBow> => createBow({ kind: "longbow" }, seed);
  const horse: (seed: number) => ReturnType<typeof createBow> = (
    seed: number,
  ): ReturnType<typeof createBow> => createBow({ kind: "horseBow" }, seed);
  const recurve: (seed: number) => ReturnType<typeof createBow> = (
    seed: number,
  ): ReturnType<typeof createBow> => createBow({ kind: "recurve" }, seed);
  const row: (
    name: string,
    minimum: number,
    maximum: number,
    measure: (seed: number) => number,
  ) => archetypeBandSweep.IRow = (
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
      66 * AutoMovieArchetypeUnits.INCH,
      (s: number): number => archetypeExtent(bow(s), "y", STRING_PARTS).size,
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
      48 * AutoMovieArchetypeUnits.INCH,
      53 * AutoMovieArchetypeUnits.INCH,
      (s: number): number => archetypeExtent(horse(s), "y", STRING_PARTS).size,
    ),
    row(
      "horse bow grip",
      0.03,
      0.04,
      (s: number): number => horse(s).affordance("grip").aperture!,
    ),
    row(
      "horse bow mass",
      0.315,
      0.33,
      (s: number): number => horse(s).body.mass,
    ),
    row(
      "horse bow draw",
      15 * AutoMovieArchetypeUnits.POUND * AutoMovieGravity.STANDARD,
      60 * AutoMovieArchetypeUnits.POUND * AutoMovieGravity.STANDARD,
      (s: number): number => horse(s).dimensions.draw!,
    ),
    row("horse bow brace", 0.14, 0.15, (s: number): number => {
      const made: ReturnType<typeof createBow> = horse(s);
      return (
        archetypeExtent(made, "z", STRING_PARTS).low +
        createBow.STRING -
        archetypeExtent(made, "z", ["grip"]).high
      );
    }),
    row(
      "recurve length",
      68 * AutoMovieArchetypeUnits.INCH,
      70 * AutoMovieArchetypeUnits.INCH,
      (s: number): number =>
        archetypeExtent(recurve(s), "y", STRING_PARTS).size,
    ),
    row(
      "recurve grip",
      0.03,
      0.04,
      (s: number): number => recurve(s).affordance("grip").aperture!,
    ),
    row(
      "recurve mass",
      1.133,
      1.338,
      (s: number): number => recurve(s).body.mass,
    ),
    row(
      "recurve draw",
      49 * AutoMovieArchetypeUnits.POUND * AutoMovieGravity.STANDARD,
      54 * AutoMovieArchetypeUnits.POUND * AutoMovieGravity.STANDARD,
      (s: number): number => recurve(s).dimensions.draw!,
    ),
    row(
      "recurve brace",
      8.5 * AutoMovieArchetypeUnits.INCH,
      9.5 * AutoMovieArchetypeUnits.INCH,
      (s: number): number => {
        const made: ReturnType<typeof createBow> = recurve(s);
        return (
          archetypeExtent(made, "z", STRING_PARTS).low +
          createBow.STRING -
          archetypeExtent(made, "z", ["grip"]).high
        );
      },
    ),
    row(
      "crossbow mass",
      10 * AutoMovieArchetypeUnits.POUND,
      12 * AutoMovieArchetypeUnits.POUND,
      (s: number): number => createBow({ kind: "crossbow" }, s).body.mass,
    ),
    row(
      "crossbow bow",
      30 * AutoMovieArchetypeUnits.INCH,
      30 * AutoMovieArchetypeUnits.INCH,
      (s: number): number =>
        createBow({ kind: "crossbow" }, s).dimensions.length!,
    ),
    row(
      "draw",
      101 * AutoMovieArchetypeUnits.POUND * AutoMovieGravity.STANDARD,
      141 * AutoMovieArchetypeUnits.POUND * AutoMovieGravity.STANDARD,
      (s: number): number => bow(s).dimensions.draw!,
    ),
  ]);
  for (const seed of [0, 1, 2]) {
    const longbow: ReturnType<typeof createBow> = bow(seed);
    const length: number = archetypeExtent(longbow, "y", STRING_PARTS).size;
    const belly: number = archetypeExtent(longbow, "z", ["grip"]).high;
    const string: number = archetypeExtent(longbow, "z", STRING_PARTS).low;
    const grip: ReturnType<typeof longbow.affordance> =
      longbow.affordance("grip");
    const nock: ReturnType<typeof longbow.affordance> =
      longbow.affordance("nock");
    if (!(Math.abs(string + createBow.STRING - belly - length / 12) <= 1e-9))
      findings.push(`longbow@${seed}: the brace is not a twelfth`);
    if (
      !(
        Math.abs(nock.frame.translation.y - grip.frame.translation.y) <= 1e-9
      ) ||
      !(
        Math.abs(nock.frame.translation.z - (string + createBow.STRING)) <= 1e-9
      ) ||
      !(Math.abs(AutoMovieArchetypeFrame.axis(nock.frame, "y").z - 1) <= 1e-12)
    )
      findings.push(`longbow@${seed}: the nock is off the string at the grip`);
    if (!(Math.abs(archetypeExtent(longbow, "y").low) <= 1e-9))
      findings.push(
        `longbow@${seed}: off the floor by ${archetypeExtent(longbow, "y").low} m`,
      );
  }
  for (const seed of [0, 1, 2])
    if (!(Math.abs(archetypeExtent(horse(seed), "y").low) <= 1e-9))
      findings.push(`horse bow@${seed}: off the floor`);
  TestValidator.equals("the bows stay in their cited bands", findings, []);
}
