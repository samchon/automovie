import { createDevice } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/** Apple's tablet specification. */
const IPAD: string = "Apple iPad (10th generation)";

/**
 * A tablet is sized as its maker publishes for every seed, measured on the produced thing, and is held and looked at where its slab is.
 *
 * Scenarios:
 * 1. Over 200 seeds, inside the band and spanning at least 80 % of it where it has width: 248.6 mm high, 179.5 mm wide, 7 mm thick, 477 to 481 g.
 * 2. For three seeds, its `grip` is at the slab's middle across its thickness, and its `screen` covers its whole front, facing `+Z`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces the tablet for 200 seeds and measures its collider, mass and contact frames; a size other than the maker's, a seed that does not vary it, a grip off the slab's middle or a screen off its front is caught.
 * @evidence contracts/development/testing.md#independent-expectations Apple's published dimensions and weights; a slab held across its back closes over its thickness.
 * @evidence contracts/development/testing.md#distinguishing-cases The kind the producer gained; the phone, camera and remote belong to `test_archetype_props_bands`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the two scenarios and what each pins.
 */
export function test_archetype_props_device_bands(): void {
  const row = (
    name: string,
    minimum: number,
    maximum: number,
    measure: (seed: number) => number,
  ): archetypeBandSweep.IRow => ({
    name,
    minimum,
    maximum,
    source: IPAD,
    measure,
  });
  const tablet = (seed: number): ReturnType<typeof createDevice> =>
    createDevice({ kind: "tablet" }, seed);
  const findings: string[] = archetypeBandSweep([
    row("tablet height", 0.2486, 0.2486, (s: number): number =>
      archetypeExtent(tablet(s), "y").size,
    ),
    row("tablet width", 0.1795, 0.1795, (s: number): number =>
      archetypeExtent(tablet(s), "x").size,
    ),
    row("tablet thickness", 0.007, 0.007, (s: number): number =>
      archetypeExtent(tablet(s), "z").size,
    ),
    row("tablet mass", 0.477, 0.481, (s: number): number => tablet(s).body.mass),
  ]);
  for (const seed of [0, 1, 2]) {
    const device: ReturnType<typeof createDevice> = tablet(seed);
    const grip: ReturnType<typeof device.affordance> = device.affordance("grip");
    const screen: ReturnType<typeof device.affordance> =
      device.affordance("screen");
    if (
      Math.abs(grip.frame.translation.y - archetypeExtent(device, "y").size / 2) >
        1e-9 ||
      Math.abs(grip.aperture! - archetypeExtent(device, "z").size) > 1e-9 ||
      Math.abs(screen.frame.translation.z - archetypeExtent(device, "z").high) >
        1e-9 ||
      Math.abs(screen.width! - archetypeExtent(device, "x").size) > 1e-9 ||
      Math.abs(screen.depth! - archetypeExtent(device, "y").size) > 1e-9
    )
      findings.push(`tablet@${seed}: the grip or the screen is off its slab`);
  }
  TestValidator.equals("the tablet stays as published", findings, []);
}
