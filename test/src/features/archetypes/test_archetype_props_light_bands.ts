import { ArchetypeFrame, createLight } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/**
 * Lights stay inside their cited dimensions for every seed, measured on the produced thing; each flame stands on top of what burns and the pendant shines down from its shade.
 *
 * Scenarios:
 * 1. Over 200 seeds, inside the band and spanning at least 80 % of it where it has width: a taper 25 to 26 cm long; a fire torch 16 to 24 in long whose shaft lies in the 30 to 40 mm comfortable power grip band, 205 to 265 g; a pendant's shade 15 in across hanging 4 ft 11 in plus its 11 in shade below its hook.
 * 2. For three seeds of the candle and the torch, the `light` frame is at the top of the taper or the head, `+Y` up.
 * 3. For three seeds of the pendant, the `light` frame is at the shade's lowest point with `+Y` straight down, and its `hook` at the top of its cord.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces each light for 200 seeds and measures colliders, grip widths, masses and the light's and hook's frames; a band other than the citation's, a seed that does not vary it, a flame off the top of the wick or head, or a beam off the shade or pointing up is caught.
 * @evidence contracts/development/testing.md#independent-expectations The taper's sizes are IKEA's VINTERFINT and KLOKHET listings; the torch's lengths and masses fire-performance torches'; the shaft band Kong and Lowe 2005; the pendant's sizes IKEA's SKURUP page; a flame burns from the top of what burns and a shaded lamp's light leaves its shade's mouth.
 * @evidence contracts/development/testing.md#distinguishing-cases Each kind's sourced dimensions; a flame against a lamp's beam.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios and what each pins.
 */
export function test_archetype_props_light_bands(): void {
  const row = (
    name: string,
    minimum: number,
    maximum: number,
    source: string,
    measure: (seed: number) => number,
  ): archetypeBandSweep.IRow => ({ name, minimum, maximum, source, measure });
  const findings: string[] = archetypeBandSweep([
    row(
      "taper length",
      0.25,
      0.26,
      "IKEA VINTERFINT and KLOKHET tapers",
      (seed: number): number =>
        archetypeExtent(createLight({ kind: "candle" }, seed), "y").size,
    ),
    row(
      "torch length",
      16 * 0.0254,
      24 * 0.0254,
      "fire-performance torches, 16 to 24 in",
      (seed: number): number =>
        archetypeExtent(createLight({ kind: "fireTorch" }, seed), "y").size,
    ),
    row(
      "torch shaft",
      0.03,
      0.04,
      "Kong and Lowe 2005",
      (seed: number): number =>
        createLight({ kind: "fireTorch" }, seed).affordance("grip").aperture!,
    ),
    row(
      "torch mass",
      0.205,
      0.265,
      "fire-performance torches",
      (seed: number): number =>
        createLight({ kind: "fireTorch" }, seed).body.mass,
    ),
    row(
      "pendant drop",
      (4 * 12 + 11 + 11) * 0.0254,
      (4 * 12 + 11 + 11) * 0.0254,
      "IKEA SKURUP, cord and shade",
      (seed: number): number =>
        -archetypeExtent(createLight({ kind: "pendant" }, seed), "y").low,
    ),
    row(
      "pendant shade",
      15 * 0.0254,
      15 * 0.0254,
      "IKEA SKURUP",
      (seed: number): number =>
        archetypeExtent(createLight({ kind: "pendant" }, seed), "x", ["shade"])
          .size,
    ),
  ]);
  for (const seed of [0, 1, 2]) {
    // 2. A flame on top of the taper or the head.
    for (const kind of ["candle", "fireTorch"] as const) {
      const light: ReturnType<typeof createLight> = createLight({ kind }, seed);
      const flame: ReturnType<typeof light.affordance> =
        light.affordance("light");
      if (
        Math.abs(flame.frame.translation.y - archetypeExtent(light, "y").high) >
          1e-9 ||
        Math.abs(ArchetypeFrame.axis(flame.frame, "y").y - 1) > 1e-12
      )
        findings.push(`${kind}@${seed}: the flame is not on top, upright`);
    }

    // 3. The pendant's beam down from its shade, its hook atop its cord.
    const pendant: ReturnType<typeof createLight> = createLight(
      { kind: "pendant" },
      seed,
    );
    const beam: ReturnType<typeof pendant.affordance> =
      pendant.affordance("light");
    if (
      Math.abs(
        beam.frame.translation.y - archetypeExtent(pendant, "y", ["shade"]).low,
      ) > 1e-9 ||
      Math.abs(ArchetypeFrame.axis(beam.frame, "y").y + 1) > 1e-12 ||
      Math.abs(
        pendant.affordance("hook").frame.translation.y -
          archetypeExtent(pendant, "y").high,
      ) > 1e-9
    )
      findings.push(`pendant@${seed}: the beam or the hook is off`);
  }
  TestValidator.equals("lights stay in their cited bands", findings, []);
}
