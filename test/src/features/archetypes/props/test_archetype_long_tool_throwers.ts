import { type AutoMovieArchetype, createLongTool } from "@automovie/archetypes";
import { validateModel } from "@automovie/engine";
import type { IAutoMovieAffordance } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../internal/archetypeExtent";

/** An inch, metres. */
const IN: number = 0.0254;

/**
 * A sling and an atlatl are their sources' throwers, with the contacts a throw reads.
 *
 * Scenarios:
 * 1. A sling is Finney's measured Bolivian sling: 1780 mm in all (its two cords and its pouch), 6 mm cords, a pouch 155 by 40 mm; its launch speed lies in Skov's 32.1 to 43.3 m/s over 200 seeds, both ends reached; its mass band is marked provisional.
 * 2. Its `grip` (the finger loop, a hook grip) and its `release` (the knot, a lateral grip) stand together at the top, and its `pouch` is a socket at the bottom facing up.
 * 3. An atlatl is Kidder and Guernsey's Basketmaker atlatl: 26 in long and 1 3/8 in wide, its spur 3 in from the far end and its handle proper beginning 4 in from the butt; its launch speed lies in Pettigrew's 16.7 to 28.7 m/s over 200 seeds.
 * 4. Its `grip` is a handle as long as the handle's setback, and its `spur` a socket the spur's setback from the far end, facing back along the shaft.
 * 5. Both are admitted models.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces each thrower for 200 seeds, measures its parts and reads its contacts; a size off its source, a speed outside its measured spread, a misplaced contact or a refused model is caught.
 * @evidence contracts/development/testing.md#independent-expectations The figures are written here from Finney, Skov, Kidder and Guernsey and Pettigrew.
 * @evidence contracts/development/testing.md#distinguishing-cases Both throwers, their speed bands' ends, and each contact.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the five scenarios and what each pins.
 */
export function test_archetype_long_tool_throwers(): void {
  const findings: string[] = [];
  const close = (a: number, b: number, tolerance: number = 1e-9): boolean =>
    Math.abs(a - b) <= tolerance;
  const sweep = (kind: "sling" | "atlatl", low: number, high: number): void => {
    let least: number = Infinity;
    let most: number = -Infinity;
    for (let seed: number = 0; seed < 200; seed++) {
      const speed: number = createLongTool({ kind }, seed).dimensions
        .launchSpeed!;
      least = Math.min(least, speed);
      most = Math.max(most, speed);
      if (!(speed >= low - 1e-9 && speed <= high + 1e-9))
        findings.push(`${kind}@${seed}: launch speed ${speed}`);
    }
    if (!(least < low + (high - low) / 4 && most > high - (high - low) / 4))
      findings.push(`${kind}: speeds span only ${least} to ${most}`);
  };

  const sling: AutoMovieArchetype<
    createLongTool.Affordance,
    createLongTool.Dimension
  > = createLongTool({ kind: "sling" }, 1);
  const s: Readonly<Partial<Record<createLongTool.Dimension, number>>> =
    sling.dimensions;
  for (const [name, expected] of [
    ["length", 1.78],
    ["shaftDiameter", 0.006],
    ["pouchLength", 0.155],
    ["pouchWidth", 0.04],
  ] as const)
    if (!close(s[name]!, expected))
      findings.push(`sling ${name} is ${s[name]}, not ${expected}`);
  sweep("sling", 32.1, 43.3);
  if (sling.provenance.bands.mass?.provisional !== true)
    findings.push("the sling's mass is not marked provisional");
  const loop: IAutoMovieAffordance = sling.affordance("grip");
  const knot: IAutoMovieAffordance = sling.affordance("release");
  const pouch: IAutoMovieAffordance = sling.affordance("pouch");
  if (loop.grip !== "hook" || knot.grip !== "lateral")
    findings.push(`the sling's grips are ${loop.grip} and ${knot.grip}`);
  if (
    !close(loop.frame.translation.y, knot.frame.translation.y) ||
    !(loop.frame.translation.y > pouch.frame.translation.y)
  )
    findings.push(
      "the loop and the knot do not stand together above the pouch",
    );
  if (pouch.kind !== "socket")
    findings.push("the sling's pouch is not a socket");
  if (!close(archetypeExtent(sling, "z", ["pouch"]).size, 0.155, 1e-6))
    findings.push("the pouch part is not 155 mm long");

  const atlatl: AutoMovieArchetype<
    createLongTool.Affordance,
    createLongTool.Dimension
  > = createLongTool({ kind: "atlatl" }, 1);
  const a: Readonly<Partial<Record<createLongTool.Dimension, number>>> =
    atlatl.dimensions;
  for (const [name, expected] of [
    ["length", 26 * IN],
    ["width", (11 / 8) * IN],
    ["spurSetback", 3 * IN],
    ["gripSetback", 4 * IN],
  ] as const)
    if (!close(a[name]!, expected))
      findings.push(`atlatl ${name} is ${a[name]}, not ${expected}`);
  sweep("atlatl", 16.7, 28.7);
  const spur: IAutoMovieAffordance = atlatl.affordance("spur");
  if (spur.kind !== "socket" || !close(spur.frame.translation.y, 23 * IN))
    findings.push(`the spur stands at ${spur.frame.translation.y}`);
  const grip: IAutoMovieAffordance = atlatl.affordance("grip");
  if (grip.kind !== "handle" || !close(grip.length!, 4 * IN))
    findings.push(
      `the atlatl's grip is a ${grip.kind} of length ${grip.length}`,
    );
  if (!close(archetypeExtent(atlatl, "y", ["shaft"]).size, 26 * IN, 1e-6))
    findings.push("the atlatl's shaft is not 26 in");

  for (const tool of [sling, atlatl])
    if (!validateModel({ model: tool }).success)
      findings.push(`the ${tool.name} is refused`);
  TestValidator.equals("the throwers are their sources'", findings, []);
}
