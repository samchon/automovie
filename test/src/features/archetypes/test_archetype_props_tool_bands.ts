import { ArchetypeFrame, createTool } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/**
 * The wrench, the drill driver, the trowel and the ladle stay inside their cited dimensions for every seed, measured on the produced thing, and each works from where its makers put the working end.
 *
 * Scenarios:
 * 1. Over 200 seeds, inside the band and spanning at least 80 % of it: a wrench 169 to 185 mm long, 85 g; a drill driver's head 5.88 in to 179 mm long and the whole 7.97 in to 212 mm high, 2.42 lb to 1.1 kg; a trowel 11.5 in to 318 mm long with a 150 mm to 6 in blade; a ladle 31 to 32 cm long with a 9 cm bowl, 218 g.
 * 2. For three seeds, a drill driver's chuck (`face`) is the head's front, `+Y` forward along `+Z`; its `trigger` is on the grip's front below the head; its grip is upright under the head.
 * 3. For three seeds, a wrench's jaw is at its tip, `+Y` along it; a trowel's and a ladle's face look `+Z` from their blade or bowl.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces each tool for 200 seeds and measures colliders, frames and masses; a band other than the citation's, a seed that does not vary it, a chuck facing back, a trigger off the grip, or a working face off its part is caught.
 * @evidence contracts/development/testing.md#independent-expectations The sizes and masses are Gedore's (at Fabory), Makita's, DeWalt's, Spear & Jackson's, Rösle's and IKEA's published figures; a drill drives along its head, a wrench's jaw meets a nut at its end.
 * @evidence contracts/development/testing.md#distinguishing-cases The four kinds added; the older kinds belong to `test_archetype_props_bands` and `test_archetype_props_tableware_bands`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios and what each pins.
 */
export function test_archetype_props_tool_bands(): void {
  const row = (
    name: string,
    minimum: number,
    maximum: number,
    source: string,
    measure: (seed: number) => number,
  ): archetypeBandSweep.IRow => ({ name, minimum, maximum, source, measure });
  const extent = (
    kind: createTool.Kind,
    axis: "x" | "y" | "z",
    seed: number,
    parts?: readonly string[],
  ): number => archetypeExtent(createTool({ kind }, seed), axis, parts).size;
  const findings: string[] = archetypeBandSweep([
    row("wrench length", 0.169, 0.185, "Gedore and Bahco", (s: number): number => extent("wrench", "y", s)),
    row("wrench mass", 0.085, 0.085, "Gedore at Fabory", (s: number): number => createTool({ kind: "wrench" }, s).body.mass),
    row("drill head", 5.88 * 0.0254, 0.179, "DeWalt and Makita", (s: number): number => extent("powerDrill", "z", s, ["head"])),
    row("drill height", 7.97 * 0.0254, 0.212, "DeWalt and Makita", (s: number): number => extent("powerDrill", "y", s)),
    row("drill mass", 2.42 * 0.4536, 1.1, "DeWalt and Makita", (s: number): number => createTool({ kind: "powerDrill" }, s).body.mass),
    row("trowel length", 11.5 * 0.0254, 0.318, "Radius and Spear & Jackson", (s: number): number => extent("trowel", "y", s)),
    row("trowel blade", 0.15, 6 * 0.0254, "Spear & Jackson and Radius", (s: number): number => extent("trowel", "y", s, ["blade"])),
    row("ladle length", 0.31, 0.32, "IKEA and Rösle", (s: number): number => extent("ladle", "y", s)),
    row("ladle bowl", 0.09, 0.09, "Rösle", (s: number): number => extent("ladle", "x", s, ["bowl"])),
    row("ladle mass", 0.218, 0.218, "Rösle", (s: number): number => createTool({ kind: "ladle" }, s).body.mass),
  ]);

  for (const seed of [0, 1, 2]) {
    // 2. The drill drives forward from its head, the trigger at the grip's front.
    const drill: ReturnType<typeof createTool> = createTool({ kind: "powerDrill" }, seed);
    const chuck: ReturnType<typeof drill.affordance> = drill.affordance("face");
    const trigger: ReturnType<typeof drill.affordance> = drill.affordance("trigger");
    const head: ReturnType<typeof archetypeExtent> = archetypeExtent(drill, "y", ["head"]);
    const handle: ReturnType<typeof archetypeExtent> = archetypeExtent(drill, "z", ["handle"]);
    if (
      Math.abs(ArchetypeFrame.axis(chuck.frame, "y").z - 1) > 1e-12 ||
      Math.abs(chuck.frame.translation.z - archetypeExtent(drill, "z", ["head"]).high) > 1e-9 ||
      Math.abs(trigger.frame.translation.z - handle.high) > 1e-9 ||
      !(trigger.frame.translation.y < head.low) ||
      Math.abs(archetypeExtent(drill, "y", ["handle"]).high - head.low) > 1e-9
    )
      findings.push(`powerDrill@${seed}: the chuck, the trigger or the grip is off`);

    // 3. A wrench works at its tip; a trowel and a ladle look +Z.
    const wrench: ReturnType<typeof createTool> = createTool({ kind: "wrench" }, seed);
    if (
      Math.abs(wrench.affordance("face").frame.translation.y - archetypeExtent(wrench, "y").high) > 1e-9 ||
      Math.abs(ArchetypeFrame.axis(wrench.affordance("face").frame, "y").y - 1) > 1e-12
    )
      findings.push(`wrench@${seed}: the jaw is off its tip`);
    for (const kind of ["trowel", "ladle"] as const) {
      const tool: ReturnType<typeof createTool> = createTool({ kind }, seed);
      const part: string = kind === "trowel" ? "blade" : "bowl";
      const face: ReturnType<typeof tool.affordance> = tool.affordance("face");
      if (
        Math.abs(ArchetypeFrame.axis(face.frame, "y").z - 1) > 1e-12 ||
        Math.abs(face.frame.translation.z - archetypeExtent(tool, "z", [part]).high) > 1e-9
      )
        findings.push(`${kind}@${seed}: the face is off its ${part}`);
    }
  }
  TestValidator.equals("the added tools stay in their cited bands", findings, []);
}
