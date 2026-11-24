import { AutoMovieArchetypeUnits, createTree } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../../../internal/archetypeBandSweep";
import { archetypeExtent } from "../../../internal/archetypeExtent";

/**
 * A white oak and a Douglas-fir stand at their sources' sizes for every seed, weigh what the allometric equation and the green moisture give their diameter, balance where their stem's share puts them, and offer their bole at breast height.
 *
 * Scenarios:
 * 1. Over 200 seeds, inside the band and spanning at least 80 % of it: a white oak 24 to 30 m tall, its trunk 91 to 122 cm across, its crown base at 50 to 60 % of its height; a Douglas-fir 50.8 to 61.6 m tall, 87.1 to 153.5 cm across, its crown base at 36 to 55 % of its height.
 * 2. For three seeds of each, its mass is exp(b0 + b1 ln(dbh in cm)) kg times one plus its drawn moisture, inside the Wood Handbook's band (0.64 to 0.78 for white oak, 0.37 to 1.15 for Douglas-fir), with Jenkins et al.'s b0 and b1 (-2.0127 and 2.4342; -2.2304 and 2.4435); its centre of mass stands where its trunk, carrying the stem wood's and bark's ratios of the mass (hardwood -0.3065, -5.424 and -2.0129, -1.6805; softwood -0.3737, -1.8055 and -2.098, -1.1432), and its crown, carrying the rest, put it; its `trunk` contact is on the bole's +Z face at 4.5 ft, facing out; its lowest point is on the ground.
 */
export function test_unit_archetypes_nature_nature_tree_bands(): void {
  const tree = (
    kind: "whiteOak" | "douglasFir",
    seed: number,
  ): ReturnType<typeof createTree> => createTree({ kind }, seed);
  const row = (
    name: string,
    minimum: number,
    maximum: number,
    measure: (seed: number) => number,
  ): archetypeBandSweep.IRow => ({
    name,
    minimum,
    maximum,
    source: "USDA silvics, Spiecker 2021, Ishii and Wilson 2001, Hummel 2009",
    measure,
  });
  const share = (made: ReturnType<typeof createTree>): number =>
    archetypeExtent(made, "y", ["trunk"]).high /
    archetypeExtent(made, "y").high;
  const findings: string[] = archetypeBandSweep([
    row(
      "oak height",
      24,
      30,
      (s: number): number => archetypeExtent(tree("whiteOak", s), "y").size,
    ),
    row(
      "oak dbh",
      0.91,
      1.22,
      (s: number): number =>
        archetypeExtent(tree("whiteOak", s), "x", ["trunk"]).size,
    ),
    row("oak crown base", 0.5, 0.6, (s: number): number =>
      share(tree("whiteOak", s)),
    ),
    row(
      "fir height",
      50.8,
      61.6,
      (s: number): number => archetypeExtent(tree("douglasFir", s), "y").size,
    ),
    row(
      "fir dbh",
      0.871,
      1.535,
      (s: number): number =>
        archetypeExtent(tree("douglasFir", s), "x", ["trunk"]).size,
    ),
    row("fir crown base", 1 - 0.64, 1 - 0.45, (s: number): number =>
      share(tree("douglasFir", s)),
    ),
  ]);
  const READ = {
    whiteOak: {
      b: [-2.0127, 2.4342],
      wood: [-0.3065, -5.424],
      bark: [-2.0129, -1.6805],
      moisture: [0.64, 0.78],
    },
    douglasFir: {
      b: [-2.2304, 2.4435],
      wood: [-0.3737, -1.8055],
      bark: [-2.098, -1.1432],
      moisture: [0.37, 1.15],
    },
  } as const;
  for (const seed of [0, 1, 2])
    for (const kind of ["whiteOak", "douglasFir"] as const) {
      const made: ReturnType<typeof createTree> = tree(kind, seed);
      const read: (typeof READ)[typeof kind] = READ[kind];
      const dbh: number =
        made.dimensions.dbh! / AutoMovieArchetypeUnits.CENTIMETRE;
      const moisture: number = made.dimensions.moisture!;
      const mass: number =
        Math.exp(read.b[0] + read.b[1] * Math.log(dbh)) * (1 + moisture);
      const trunk: number =
        Math.exp(read.wood[0] + read.wood[1] / dbh) +
        Math.exp(read.bark[0] + read.bark[1] / dbh);
      const base: number = archetypeExtent(made, "y", ["trunk"]).high;
      const top: number = archetypeExtent(made, "y").high;
      const balance: number =
        trunk * (base / 2) + (1 - trunk) * ((base + top) / 2);
      const contact: ReturnType<typeof made.affordance> =
        made.affordance("trunk");
      if (
        !(moisture >= read.moisture[0] && moisture <= read.moisture[1]) ||
        Math.abs(made.body.mass - mass) > 1e-6 * mass ||
        made.body.centerOfMass === null ||
        Math.abs(made.body.centerOfMass.y - balance) > 1e-6 * top ||
        Math.abs(
          contact.frame.translation.y - 4.5 * AutoMovieArchetypeUnits.FOOT,
        ) > 1e-9 ||
        Math.abs(
          contact.frame.translation.z -
            archetypeExtent(made, "z", ["trunk"]).high,
        ) > 1e-9 ||
        Math.abs(archetypeExtent(made, "y").low) > 1e-9
      )
        findings.push(
          `${kind}@${seed}: its mass, balance, contact or footing is off`,
        );
    }
  TestValidator.equals(
    "the trees stay as their sources give them",
    findings,
    [],
  );
}
