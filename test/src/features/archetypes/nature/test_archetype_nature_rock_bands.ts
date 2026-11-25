import { createRock } from "@automovie/archetypes";
import { physicalHullMass } from "@automovie/engine";
import type { IAutoMoviePhysicalShape } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../../internal/archetypeBandSweep";
import { archetypeExtent } from "../../internal/archetypeExtent";

/** The Udden-Wentworth classes. */
const WENTWORTH: string = "Udden-Wentworth scale";

/**
 * Stones stay inside their size classes for every seed, measured on the
 * produced thing, weigh what granite of their size weighs, and rest on their
 * lowest point.
 *
 * Scenarios:
 *
 * 1. Over 200 seeds, inside the band and spanning at least 80 % of it: a cobble 64
 *    to 256 mm across, a boulder 256 to 1024 mm.
 * 2. For ten seeds of each class, the mass is the collider's volume (its convex
 *    hull's, or a ball's pi d cubed over six) at the drawn specific gravity,
 *    within 2.6 to 2.72 times water's density.
 * 3. For three seeds, a stone's lowest point is at the origin, a cobble's grip is
 *    its whole width, and a boulder's `top` is its highest point.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces stones for 200 seeds and measures colliders, masses and frames; a class other than the scale's, a seed that does not vary it, a mass off granite's density, a stone that floats or sinks, or a contact off its surface is caught.
 * @evidence contracts/development/testing.md#independent-expectations The classes are the Udden-Wentworth scale's; granite's density is its measured mean plus and minus one standard deviation; the volume is the engine's hull volume of the collider's corners, or a sphere's pi d cubed over six, worked here.
 * @evidence contracts/development/testing.md#distinguishing-cases Both classes at both ends; a cobble's grip against a boulder's top.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios and what each pins.
 */
export function test_archetype_nature_rock_bands(): void {
  const row = (
    name: string,
    minimum: number,
    maximum: number,
    source: string,
    measure: (seed: number) => number,
  ): archetypeBandSweep.IRow => ({ name, minimum, maximum, source, measure });
  const findings: string[] = archetypeBandSweep([
    row(
      "cobble",
      0.064,
      0.256,
      WENTWORTH,
      (seed: number): number =>
        archetypeExtent(createRock({ kind: "cobble" }, seed), "x").size,
    ),
    row(
      "boulder",
      0.256,
      1.024,
      WENTWORTH,
      (seed: number): number =>
        archetypeExtent(createRock({ kind: "boulder" }, seed), "x").size,
    ),
  ]);
  for (const kind of createRock.KINDS)
    for (let seed: number = 0; seed < 10; seed++) {
      const stone: ReturnType<typeof createRock> = createRock({ kind }, seed);
      const d: number = archetypeExtent(stone, "x").size;
      const shape: IAutoMoviePhysicalShape = stone.shapes()[0]!;
      const volume: number =
        shape.kind === "hull"
          ? physicalHullMass(shape.points).volume
          : (Math.PI / 6) * d ** 3;
      const gravity: number = stone.body.mass / (volume * 1000);
      if (!(gravity >= 2.6 - 1e-9 && gravity <= 2.72 + 1e-9))
        findings.push(`${kind}@${seed}: weighs as specific gravity ${gravity}`);
      if (seed < 3) {
        const low: number = archetypeExtent(stone, "y").low;
        const placed: boolean =
          kind === "cobble"
            ? Math.abs(stone.affordance("grip").aperture! - d) < 1e-9
            : Math.abs(
                stone.affordance("top").frame.translation.y -
                  archetypeExtent(stone, "y").high,
              ) < 1e-9;
        if (Math.abs(low) > 1e-9 || !placed)
          findings.push(`${kind}@${seed}: off the ground or its contact`);
      }
    }
  TestValidator.equals("stones stay in their classes", findings, []);
}
