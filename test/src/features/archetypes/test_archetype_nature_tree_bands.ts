import { ArchetypeUnits, createTree } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/**
 * A white oak stands at its silvics size for every seed, weighs what the allometric equation and the green moisture give its diameter, and offers its bole at breast height.
 *
 * Scenarios:
 * 1. Over 200 seeds, inside the band and spanning at least 80 % of it: 24 to 30 m tall, its trunk 91 to 122 cm across, its crown base at 50 to 60 % of its height.
 * 2. For three seeds, its mass is exp(-2.0127 + 2.4342 ln(dbh in cm)) kg times one plus its drawn moisture, which lies in 0.64 to 0.78; its trunk carries the stem wood's and bark's ratios exp(-0.3065 - 5.424 / dbh) and exp(-2.0129 - 1.6805 / dbh) of it, so its centre of mass lies below the crown base; and its `trunk` contact is on the bole's +Z face at 4.5 ft, facing out.
 * 3. Its lowest point is on the ground.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces the tree for 200 seeds and measures its parts, mass, centre of mass and contact; a size other than the silvics', a mass off the equation, a balance in the crown or a contact off breast height is caught.
 * @evidence contracts/development/testing.md#independent-expectations The silvics manual's sizes, Spiecker's crown base shares, Jenkins et al. 2003's Table 4 and Table 6 coefficients, the Wood Handbook's moisture and the FIA field guide's 4.5 ft, written here as literals.
 * @evidence contracts/development/testing.md#distinguishing-cases The one built species; the others wait for a crown base source.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios and what each pins.
 */
export function test_archetype_nature_tree_bands(): void {
  const oak = (seed: number): ReturnType<typeof createTree> =>
    createTree({ kind: "whiteOak" }, seed);
  const row = (
    name: string,
    minimum: number,
    maximum: number,
    measure: (seed: number) => number,
  ): archetypeBandSweep.IRow => ({
    name,
    minimum,
    maximum,
    source: "USDA silvics and Spiecker 2021",
    measure,
  });
  const findings: string[] = archetypeBandSweep([
    row("height", 24, 30, (s: number): number =>
      archetypeExtent(oak(s), "y").size,
    ),
    row("dbh", 0.91, 1.22, (s: number): number =>
      archetypeExtent(oak(s), "x", ["trunk"]).size,
    ),
    row("crown base", 0.5, 0.6, (s: number): number => {
      const tree: ReturnType<typeof createTree> = oak(s);
      return (
        archetypeExtent(tree, "y", ["trunk"]).high /
        archetypeExtent(tree, "y").high
      );
    }),
  ]);
  for (const seed of [0, 1, 2]) {
    const tree: ReturnType<typeof createTree> = oak(seed);
    const dbh: number = tree.dimensions.dbh! / ArchetypeUnits.CENTIMETRE;
    const moisture: number = tree.dimensions.moisture!;
    const mass: number =
      Math.exp(-2.0127 + 2.4342 * Math.log(dbh)) * (1 + moisture);
    const base: number = archetypeExtent(tree, "y", ["trunk"]).high;
    const contact: ReturnType<typeof tree.affordance> = tree.affordance("trunk");
    if (
      !(moisture >= 0.64 && moisture <= 0.78) ||
      Math.abs(tree.body.mass - mass) > 1e-6 * mass ||
      tree.body.centerOfMass === null ||
      !(tree.body.centerOfMass.y < base) ||
      Math.abs(contact.frame.translation.y - 4.5 * ArchetypeUnits.FOOT) > 1e-9 ||
      Math.abs(
        contact.frame.translation.z -
          archetypeExtent(tree, "z", ["trunk"]).high,
      ) > 1e-9 ||
      Math.abs(archetypeExtent(tree, "y").low) > 1e-9
    )
      findings.push(`oak@${seed}: its mass, balance, contact or footing is off`);
  }
  TestValidator.equals("a white oak stays as its sources give it", findings, []);
}
