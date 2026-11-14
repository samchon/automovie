import { ArchetypeFrame, createLongTool } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/**
 * The two-hand field tools and the fishing rod stay inside their cited dimensions for every seed, measured on the produced thing, and each swung head faces the way the swing goes.
 *
 * Scenarios:
 * 1. Over 200 seeds, inside the band and spanning at least 80 % of it: a splitting axe 70 to 80 cm long, 2.085 to 2.3 kg; a rake 58 to 68 in long with a 16 to 30 in head, 3 to 3.5 lb; a hay fork 1.54 to 1.55 m with its tines; a hoe 58 in with a 6.25 in blade; a sledgehammer weighing its 4.5 kg head and a mattock its 2.3 kg head; a fishing rod 2.13 m, 131 to 133 g.
 * 2. For three seeds of the axe, the mattock and the sledgehammer, the `face` lies on the head's `+Z` side facing `+Z`, and the shaft rises from the head's top.
 * 3. For three seeds of the rake, the fork and the hoe, the `face` lies on the floor facing down, the head's width across it.
 * 4. A fishing rod's `grip` is at its butt and its `tip` at its top, `+Y` up along it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces each tool for 200 seeds and measures colliders, frames and masses; a band other than the citation's, a seed that does not vary it, a swung face pointing down or a ground face pointing sideways, or a rod gripped off its butt is caught.
 * @evidence contracts/development/testing.md#independent-expectations The lengths, widths and masses are Husqvarna's, Gränsfors Bruk's, Truper's, Estwing's, Bully Tools', Spear & Jackson's and Daiwa's published figures; an axe's edge and a hammer's face meet their target square to the swing, a rake's and a hoe's head work on the ground.
 * @evidence contracts/development/testing.md#distinguishing-cases Swung heads against ground heads, a one-hand rod against two-hand shafts; the broom, mop and shovel are pinned by the older band tests and their unchanged contract rows.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios and what each pins.
 */
export function test_archetype_props_longtool_bands(): void {
  const row = (
    name: string,
    minimum: number,
    maximum: number,
    source: string,
    measure: (seed: number) => number,
  ): archetypeBandSweep.IRow => ({ name, minimum, maximum, source, measure });
  const size = (kind: createLongTool.Kind, axis: "x" | "y", seed: number): number =>
    archetypeExtent(createLongTool({ kind }, seed), axis).size;
  const mass = (kind: createLongTool.Kind, seed: number): number =>
    createLongTool({ kind }, seed).body.mass;
  const findings: string[] = archetypeBandSweep([
    row("axe length", 0.7, 0.8, "Husqvarna and Gränsfors", (s: number): number => size("axe", "y", s)),
    row("axe mass", 2.085, 2.3, "Husqvarna and Gränsfors", (s: number): number => mass("axe", s)),
    row("rake length", 58 * 0.0254, 68 * 0.0254, "Bully Tools rakes", (s: number): number => size("rake", "y", s)),
    row("rake head", 16 * 0.0254, 30 * 0.0254, "Bully Tools rakes", (s: number): number => size("rake", "x", s)),
    row("rake mass", 3 * 0.4536, 3.5 * 0.4536, "Bully Tools rakes", (s: number): number => mass("rake", s)),
    row("fork length", 1.54, 1.55, "Truper and Spear & Jackson forks", (s: number): number => size("pitchfork", "y", s)),
    row("hoe length", 58 * 0.0254, 58 * 0.0254, "Bully Tools hoe", (s: number): number => size("hoe", "y", s)),
    row("hoe blade", 6.25 * 0.0254, 6.25 * 0.0254, "Bully Tools hoe", (s: number): number => size("hoe", "x", s)),
    row("sledgehammer mass", 4.5, 4.5, "Truper and Estwing heads", (s: number): number => mass("sledgehammer", s)),
    row("mattock mass", 2.3, 2.3, "Truper TP-5M head", (s: number): number => mass("pickaxe", s)),
    row("rod length", 2.13, 2.13, "Daiwa Ninja X", (s: number): number => size("fishingRod", "y", s)),
    row("rod mass", 0.131, 0.133, "Daiwa Ninja X", (s: number): number => mass("fishingRod", s)),
  ]);

  for (const seed of [0, 1, 2]) {
    // 2. A swung head faces the swing.
    for (const kind of ["axe", "pickaxe", "sledgehammer"] as const) {
      const tool: ReturnType<typeof createLongTool> = createLongTool({ kind }, seed);
      const face: ReturnType<typeof tool.affordance> = tool.affordance("face");
      if (
        Math.abs(ArchetypeFrame.axis(face.frame, "y").z - 1) > 1e-12 ||
        Math.abs(face.frame.translation.z - archetypeExtent(tool, "z", ["head"]).high) > 1e-9 ||
        Math.abs(
          archetypeExtent(tool, "y", ["shaft"]).low -
            archetypeExtent(tool, "y", ["head"]).high,
        ) > 1e-9
      )
        findings.push(`${kind}@${seed}: the head does not face the swing`);
    }

    // 3. A ground head faces down, as wide as the head.
    for (const kind of ["rake", "pitchfork", "hoe"] as const) {
      const tool: ReturnType<typeof createLongTool> = createLongTool({ kind }, seed);
      const face: ReturnType<typeof tool.affordance> = tool.affordance("face");
      if (
        Math.abs(ArchetypeFrame.axis(face.frame, "y").y + 1) > 1e-12 ||
        Math.abs(face.frame.translation.y) > 1e-12 ||
        Math.abs(face.width! - archetypeExtent(tool, "x", ["head"]).size) > 1e-9
      )
        findings.push(`${kind}@${seed}: the head does not face the ground`);
    }

    // 4. A rod is gripped at its butt and cast from its tip.
    const rod: ReturnType<typeof createLongTool> = createLongTool(
      { kind: "fishingRod" },
      seed,
    );
    const grip: ReturnType<typeof rod.affordance> = rod.affordance("grip");
    if (
      Math.abs(grip.frame.translation.y - grip.length! / 2) > 1e-12 ||
      Math.abs(rod.affordance("tip").frame.translation.y - rod.dimensions.length!) > 1e-12
    )
      findings.push(`fishingRod@${seed}: the grip or the tip is off its end`);
  }
  TestValidator.equals("the field tools stay in their cited bands", findings, []);
}
