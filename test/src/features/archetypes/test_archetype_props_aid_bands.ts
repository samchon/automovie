import { createMobilityAid, createUmbrella } from "@automovie/archetypes";
import type { IAutoMovieAffordance } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/** BLUNT's stick umbrellas. */
const BLUNT: string = "BLUNT Classic and Exec";

/** Drive Medical's cane and walker. */
const DRIVE: string = "Drive Medical offset cane and walker 10210-1";

/**
 * Umbrellas and walking aids stay inside their cited dimensions for every seed, measured on the produced thing, and an umbrella's canopy is there only when it is open.
 *
 * Scenarios:
 * 1. Over 200 seeds, inside the band and spanning at least 80 % of it: a closed umbrella 84 to 95.5 cm long, an open one's canopy 120 to 138 cm across, 660 to 910 g; a cane's handle 30 to 39 in above the floor on a 3/4 in shaft; a walker's rails 32 to 39 in above the floor, the frame 24 in across, 7 to 7.5 lb.
 * 2. A closed umbrella declares no `canopy` and has no canopy part; an open one has both, its `canopy` frame on the canopy's top.
 * 3. A walker's two grips are on its two side rails, the frame's width less one tube apart.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces umbrellas and aids for 200 seeds and measures colliders, grip widths, frames and masses; a band other than the citation's, a seed that does not vary it, a canopy on a closed umbrella, or grips off the rails is caught.
 * @evidence contracts/development/testing.md#independent-expectations BLUNT's comparison table and Drive Medical's product sheets give the sizes and weights; a grip on a rail lies at that rail's centre line by the handle convention.
 * @evidence contracts/development/testing.md#distinguishing-cases Open against closed; both aids; the walker's depth and the cane's weight are search-only and left to the producer's provisional marks.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios and what each pins.
 */
export function test_archetype_props_aid_bands(): void {
  const row = (
    name: string,
    minimum: number,
    maximum: number,
    source: string,
    measure: (seed: number) => number,
  ): archetypeBandSweep.IRow => ({ name, minimum, maximum, source, measure });
  const findings: string[] = archetypeBandSweep([
    row(
      "closed umbrella length",
      0.84,
      0.955,
      BLUNT,
      (seed: number): number =>
        archetypeExtent(createUmbrella({}, seed), "y").size,
    ),
    row(
      "open canopy",
      1.2,
      1.38,
      BLUNT,
      (seed: number): number =>
        archetypeExtent(createUmbrella({ open: true }, seed), "x").size,
    ),
    row(
      "umbrella mass",
      0.66,
      0.91,
      BLUNT,
      (seed: number): number => createUmbrella({}, seed).body.mass,
    ),
    row(
      "cane handle height",
      30 * 0.0254,
      39 * 0.0254,
      DRIVE,
      (seed: number): number =>
        archetypeExtent(createMobilityAid({ kind: "cane" }, seed), "y").high,
    ),
    row(
      "cane shaft",
      0.75 * 0.0254,
      0.75 * 0.0254,
      DRIVE,
      (seed: number): number =>
        archetypeExtent(createMobilityAid({ kind: "cane" }, seed), "x", [
          "shaft",
        ]).size,
    ),
    row(
      "walker height",
      32 * 0.0254,
      39 * 0.0254,
      DRIVE,
      (seed: number): number =>
        archetypeExtent(createMobilityAid({ kind: "walker" }, seed), "y").high,
    ),
    row(
      "walker width",
      24 * 0.0254,
      24 * 0.0254,
      DRIVE,
      (seed: number): number =>
        archetypeExtent(createMobilityAid({ kind: "walker" }, seed), "x").size,
    ),
    row(
      "walker mass",
      7 * 0.4536,
      7.5 * 0.4536,
      DRIVE,
      (seed: number): number =>
        createMobilityAid({ kind: "walker" }, seed).body.mass,
    ),
  ]);

  // 2. The canopy only when open.
  for (const seed of [0, 1, 2]) {
    const closed: ReturnType<typeof createUmbrella> = createUmbrella({}, seed);
    const open: ReturnType<typeof createUmbrella> = createUmbrella(
      { open: true },
      seed,
    );
    const has = (u: ReturnType<typeof createUmbrella>): boolean =>
      u.affordances.some((a: IAutoMovieAffordance): boolean => a.id === "canopy");
    if (
      has(closed) ||
      closed.parts.some((p: { id: string }): boolean => p.id === "canopy") ||
      !has(open) ||
      Math.abs(
        open.affordance("canopy").frame.translation.y -
          archetypeExtent(open, "y", ["canopy"]).high,
      ) > 1e-9
    )
      findings.push(`umbrella@${seed}: the canopy does not follow opening`);
  }

  // 3. The walker's grips on its rails.
  for (const seed of [0, 1, 2]) {
    const walker: ReturnType<typeof createMobilityAid> = createMobilityAid(
      { kind: "walker" },
      seed,
    );
    const apart: number =
      walker.affordance("leftGrip").frame.translation.x -
      walker.affordance("rightGrip").frame.translation.x;
    if (
      Math.abs(
        apart -
          (archetypeExtent(walker, "x").size -
            walker.affordance("leftGrip").aperture!),
      ) > 1e-9
    )
      findings.push(`walker@${seed}: the grips are ${apart} m apart`);
  }
  TestValidator.equals("umbrellas and aids stay in their bands", findings, []);
}
