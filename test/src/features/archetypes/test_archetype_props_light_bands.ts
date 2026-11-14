import { createLight } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/** The Dietz #76 as its maker's distributor gives it. */
const DIETZ: string = "W.T. Kirkman, Dietz #76 Original";

/**
 * Lights stay inside their cited dimensions for every seed, measured on the produced thing, and each declares its flame above what burns.
 *
 * Scenarios:
 * 1. Over 200 seeds, inside the band and spanning at least 80 % of it: a taper 25 to 26 cm long standing on a holder 4 to 7 cm high; a lantern 10 1/2 in to its top and 4 3/4 in across its fount, 1.08 to 1.25 lb; a fire torch 16 to 24 in long whose shaft lies in the 30 to 40 mm comfortable power grip band.
 * 2. For three seeds of each kind, the `light` frame stands above every part but a lantern's bail, its ears and its globe: over a candle's taper and a torch's head, and at the middle of a lantern's globe; its `+Y` points up.
 * 3. A lantern's `hook` is on its bail, above every other part.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces each light for 200 seeds and measures colliders, grip widths, masses and the flame's and hook's frames; a band other than the citation's, a seed that does not vary it, a flame inside the wax or the wick, or a hook below the lantern's top is caught.
 * @evidence contracts/development/testing.md#independent-expectations The taper's and holder's sizes are IKEA's VINTERFINT, KLOKHET, FINSMAK and TJÄRLEK pages; the lantern's height, base and weight the Dietz #76's at its distributor and retailers; the torch's lengths fire-performance torches'; the shaft band Kong and Lowe 2005; the flame above the fuel is the physical arrangement of a lit candle, lantern and torch.
 * @evidence contracts/development/testing.md#distinguishing-cases Each kind's sourced dimensions; the flame's place against the part that burns; the parts no source sizes are left to the producer's named estimates.
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
        archetypeExtent(createLight({ kind: "candle" }, seed), "y", ["taper"])
          .size,
    ),
    row(
      "holder height",
      0.04,
      0.07,
      "IKEA FINSMAK and TJÄRLEK candlesticks",
      (seed: number): number =>
        archetypeExtent(createLight({ kind: "candle" }, seed), "y", ["taper"])
          .low,
    ),
    row(
      "lantern height",
      10.5 * 0.0254,
      10.5 * 0.0254,
      DIETZ,
      (seed: number): number =>
        archetypeExtent(createLight({ kind: "lantern" }, seed), "y", [
          "fount",
          "globe",
          "top",
        ]).size,
    ),
    row(
      "lantern base",
      4.75 * 0.0254,
      4.75 * 0.0254,
      DIETZ,
      (seed: number): number =>
        archetypeExtent(createLight({ kind: "lantern" }, seed), "x", ["fount"])
          .size,
    ),
    row(
      "lantern mass",
      1.08 * 0.4536,
      1.25 * 0.4536,
      DIETZ,
      (seed: number): number =>
        createLight({ kind: "lantern" }, seed).body.mass,
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
  ]);

  // 2. and 3. The flame above what burns, the hook atop the lantern.
  const above: Readonly<Record<createLight.Kind, readonly string[]>> = {
    candle: ["dish", "socket", "taper"],
    lantern: ["fount"],
    fireTorch: ["shaft", "head"],
  };
  for (const kind of createLight.KINDS)
    for (const seed of [0, 1, 2]) {
      const light: ReturnType<typeof createLight> = createLight({ kind }, seed);
      const flame: ReturnType<typeof light.affordance> =
        light.affordance("light");
      if (
        !(
          flame.frame.translation.y >
          archetypeExtent(light, "y", above[kind]).high
        ) ||
        Math.abs(flame.frame.rotation.w) < 1 - 1e-12
      )
        findings.push(`${kind}@${seed}: the flame is not above the fuel, upright`);
      if (kind === "lantern") {
        const globe: ReturnType<typeof archetypeExtent> = archetypeExtent(
          light,
          "y",
          ["globe"],
        );
        if (
          Math.abs(flame.frame.translation.y - (globe.low + globe.high) / 2) >
          1e-9
        )
          findings.push(`lantern@${seed}: the flame is off the globe's middle`);
        if (
          Math.abs(
            light.affordance("hook").frame.translation.y -
              archetypeExtent(light, "y").high,
          ) > 1e-9
        )
          findings.push(`lantern@${seed}: the hook is not atop the bail`);
      }
    }
  TestValidator.equals("lights stay in their cited bands", findings, []);
}
