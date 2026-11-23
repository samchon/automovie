import {
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  createLight,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/** Dietz's lantern, with its handle extended as a museum measured it. */
const LANTERN: string =
  "Dietz #20 Junior, lanternnet.com and the Morehead State museum";

/**
 * Lights stay inside their cited dimensions for every seed, measured on the produced thing; each flame stands on top of what burns, the pendant shines down from its shade, a standing lamp's bulb sits on its lampholder over a heavy base, and a lantern burns at its globe's foot and hangs from its bail.
 *
 * Scenarios:
 * 1. Over 200 seeds, inside the band and spanning at least 80 % of it where it has width: a taper 25 to 26 cm long; a fire torch 16 to 24 in long whose shaft lies in the 30 to 40 mm comfortable power grip band, 205 to 265 g; a pendant's shade 15 in across hanging 4 ft 11 in plus its 11 in shade below its hook.
 * 2. For three seeds of the candle and the torch, the `light` frame is at the top of the taper or the head, `+Y` up.
 * 3. For three seeds of the pendant, the `light` frame is at the shade's lowest point with `+Y` straight down, and its `hook` at the top of its cord.
 * 5. Over 200 seeds, a lantern 12 in high to its cap's top and 16 in to its raised bail's top, its fount 5 1/4 in across, its globe 5 1/2 in high and 2 13/16 in across, 2 lb; for three seeds, its `light` at its globe's foot, `+Y` up, its `hook` and its hooked `grip` on the bail's top wire, the grip along the bail and as long as the base is wide.
 * 4. For three seeds of the table lamp (41 cm, base 15 cm, shade 19 by 15 cm, 0.81 kg) and the floor lamp (153 cm, base 29 cm, shade 42 by 31 cm, 3.55 kg), each also swept in scenario 1: the `light` frame is at the lampholder's read height, 30 or 130 cm, inside the shade, `+Y` up, and the centre of mass lies below half that height, as a heavy base under a light shade puts it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces each light for 200 seeds and measures colliders, grip widths, masses, the centre of mass and the light's, grip's and hook's frames; a band other than the citation's, a seed that does not vary it, a flame off the top of the wick or head or off a lantern's burner, a beam off the shade or pointing up, a bulb off its lampholder, a lamp balanced in its shade, or a lantern hung or carried anywhere but its bail's top is caught.
 * @evidence contracts/development/testing.md#independent-expectations The taper's sizes are IKEA's VINTERFINT and KLOKHET listings; the torch's lengths and masses fire-performance torches'; the shaft band Kong and Lowe 2005; the pendant's sizes IKEA's SKURUP page; the standing lamps' sizes and net weights IKEA's RINGSTA and SKAFTET pages; the lantern's Dietz's #20 Junior page and the Morehead State museum's extended handle; a flame burns from the top of what burns, a shaded lamp's light leaves its shade's mouth, and a standing lamp's bulb sits on its lampholder.
 * @evidence contracts/development/testing.md#distinguishing-cases Each kind's sourced dimensions; a flame against a hanging lamp's beam and a standing lamp's bulb; a lantern's body top against its bail's top.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the five scenarios and what each pins.
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
      16 * AutoMovieArchetypeUnits.INCH,
      24 * AutoMovieArchetypeUnits.INCH,
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
      4 * AutoMovieArchetypeUnits.FOOT +
        (11 + 11) * AutoMovieArchetypeUnits.INCH,
      4 * AutoMovieArchetypeUnits.FOOT +
        (11 + 11) * AutoMovieArchetypeUnits.INCH,
      "IKEA SKURUP, cord and shade",
      (seed: number): number =>
        -archetypeExtent(createLight({ kind: "pendant" }, seed), "y").low,
    ),
    row(
      "pendant shade",
      15 * AutoMovieArchetypeUnits.INCH,
      15 * AutoMovieArchetypeUnits.INCH,
      "IKEA SKURUP",
      (seed: number): number =>
        archetypeExtent(createLight({ kind: "pendant" }, seed), "x", ["shade"])
          .size,
    ),
    ...(
      [
        ["tableLamp", 0.41, 0.15, 0.19, 0.15, 0.62 + 0.19],
        ["floorLamp", 1.53, 0.29, 0.42, 0.31, 3.06 + 0.49],
      ] as const
    ).flatMap(
      ([
        kind,
        overall,
        base,
        shade,
        height,
        mass,
      ]): archetypeBandSweep.IRow[] => {
        const lamp = (seed: number): ReturnType<typeof createLight> =>
          createLight({ kind }, seed);
        const source: string = `IKEA RINGSTA/SKAFTET ${kind}`;
        return [
          row(
            `${kind} overall`,
            overall,
            overall,
            source,
            (s: number): number => archetypeExtent(lamp(s), "y").size,
          ),
          row(
            `${kind} base`,
            base,
            base,
            source,
            (s: number): number => archetypeExtent(lamp(s), "x", ["base"]).size,
          ),
          row(
            `${kind} shade`,
            shade,
            shade,
            source,
            (s: number): number =>
              archetypeExtent(lamp(s), "x", ["shade"]).size,
          ),
          row(
            `${kind} shade height`,
            height,
            height,
            source,
            (s: number): number =>
              archetypeExtent(lamp(s), "y", ["shade"]).size,
          ),
          row(
            `${kind} grip`,
            shade,
            shade,
            source,
            (s: number): number => lamp(s).affordance("grip").aperture!,
          ),
          row(
            `${kind} mass`,
            mass,
            mass,
            source,
            (s: number): number => lamp(s).body.mass,
          ),
        ];
      },
    ),
    ...(
      [
        ["lantern height", "y", ["cap"], "high", 12],
        ["lantern bail", "y", undefined, "high", 16],
        ["lantern base", "x", ["fount"], "size", 5 + 1 / 4],
        ["lantern globe height", "y", ["globe"], "size", 5 + 1 / 2],
        ["lantern globe", "x", ["globe"], "size", 2 + 13 / 16],
      ] as const
    ).map(
      ([name, axis, parts, end, inches]): archetypeBandSweep.IRow =>
        row(
          name,
          inches * AutoMovieArchetypeUnits.INCH,
          inches * AutoMovieArchetypeUnits.INCH,
          LANTERN,
          (seed: number): number =>
            archetypeExtent(
              createLight({ kind: "lantern" }, seed),
              axis,
              parts === undefined ? undefined : [...parts],
            )[end],
        ),
    ),
    row(
      "lantern mass",
      2 * AutoMovieArchetypeUnits.POUND,
      2 * AutoMovieArchetypeUnits.POUND,
      LANTERN,
      (seed: number): number =>
        createLight({ kind: "lantern" }, seed).body.mass,
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
        Math.abs(AutoMovieArchetypeFrame.axis(flame.frame, "y").y - 1) > 1e-12
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
      Math.abs(AutoMovieArchetypeFrame.axis(beam.frame, "y").y + 1) > 1e-12 ||
      Math.abs(
        pendant.affordance("hook").frame.translation.y -
          archetypeExtent(pendant, "y").high,
      ) > 1e-9
    )
      findings.push(`pendant@${seed}: the beam or the hook is off`);

    // 4. A standing lamp's light at its lampholder inside its shade, its balance below its stem's middle.
    for (const [kind, stem] of [
      ["tableLamp", 0.3],
      ["floorLamp", 1.3],
    ] as const) {
      const lamp: ReturnType<typeof createLight> = createLight({ kind }, seed);
      const bulb: ReturnType<typeof lamp.affordance> = lamp.affordance("light");
      const shade: ReturnType<typeof archetypeExtent> = archetypeExtent(
        lamp,
        "y",
        ["shade"],
      );
      if (
        Math.abs(bulb.frame.translation.y - stem) > 1e-9 ||
        bulb.frame.translation.y < shade.low ||
        bulb.frame.translation.y > shade.high ||
        Math.abs(AutoMovieArchetypeFrame.axis(bulb.frame, "y").y - 1) > 1e-12 ||
        lamp.body.centerOfMass === null ||
        lamp.body.centerOfMass.y > stem / 2
      )
        findings.push(`${kind}@${seed}: the light or the balance is off`);
    }

    // 5. A lantern's flame at its globe's foot, hung and carried by its bail's top.
    const lantern: ReturnType<typeof createLight> = createLight(
      { kind: "lantern" },
      seed,
    );
    const flame: ReturnType<typeof lantern.affordance> =
      lantern.affordance("light");
    const grip: ReturnType<typeof lantern.affordance> =
      lantern.affordance("grip");
    const bail: ReturnType<typeof archetypeExtent> = archetypeExtent(
      lantern,
      "y",
      ["bail"],
    );
    const top: number = (bail.low + bail.high) / 2;
    if (
      Math.abs(
        flame.frame.translation.y -
          archetypeExtent(lantern, "y", ["globe"]).low,
      ) > 1e-9 ||
      Math.abs(AutoMovieArchetypeFrame.axis(flame.frame, "y").y - 1) > 1e-12 ||
      Math.abs(lantern.affordance("hook").frame.translation.y - top) > 1e-9 ||
      Math.abs(grip.frame.translation.y - top) > 1e-9 ||
      grip.grip !== "hook" ||
      Math.abs(Math.abs(AutoMovieArchetypeFrame.axis(grip.frame, "x").x) - 1) >
        1e-12 ||
      Math.abs(grip.length! - archetypeExtent(lantern, "x", ["fount"]).size) >
        1e-9
    )
      findings.push(`lantern@${seed}: the flame, the hook or the bail is off`);
  }
  TestValidator.equals("lights stay in their cited bands", findings, []);
}
