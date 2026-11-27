import { AutoMovieArchetypeUnits, createMobilityAid, AutoMovieArchetypeUmbrella } from "@automovie/archetypes";
import type { IAutoMovieAffordance } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../../internal/archetypeBandSweep";
import { archetypeExtent } from "../../internal/archetypeExtent";

/** BLUNT's stick umbrellas. */
const BLUNT: string = "BLUNT Classic and Exec";

/** Provita's infusion stand. */
const PROVITA: string = "Provita I-PRE003 / I-PRE013";

/** Drive Medical's cane and walker. */
const DRIVE: string = "Drive Medical offset cane and walker 10210-1";

/**
 * Umbrellas and walking aids stay inside their cited dimensions for every seed, measured on the produced thing, and an umbrella's canopy is there only when it is open.
 *
 * Scenarios:
 * 1. Over 200 seeds, inside the band and spanning at least 80 % of it: a closed umbrella 84 to 95.5 cm long, an open one's canopy 120 to 138 cm across, 660 to 910 g; a cane's handle 30 to 39 in above the floor on a 3/4 in shaft; an adult walker's rails 32 to 39 in and a junior walker's 25 to 32.25 in above the floor, the frame 24 in across, 7 to 7.5 lb; an infusion stand's hooks 1,430 to 2,260 mm above the floor, its base 630 mm across its castors' outer edges, its outer tube 33.7 mm, 12 kg.
 * 2. A closed umbrella declares no `canopy` and has no canopy part; an open one has both, its `canopy` frame on the canopy's top.
 * 3. A walker's two grips are on its two side rails, the frame's width less one tube apart.
 * 4. For three seeds, an infusion stand rests on its castors on the floor, its `hook` at its top, and its centre of mass lies below the outer tube's middle, as a base of 8.9 kg under 3.1 kg of tubes puts it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces umbrellas and aids for 200 seeds and measures colliders, grip widths, frames and masses; a band other than the citation's, a seed that does not vary it, a canopy on a closed umbrella, grips off the rails, a stand off the floor, a hook off its top or a stand balanced high is caught.
 * @evidence contracts/development/testing.md#independent-expectations BLUNT's comparison table, Drive Medical's product sheets and Provita's catalogue give the sizes and weights; a grip on a rail lies at that rail's centre line by the handle convention.
 * @evidence contracts/development/testing.md#distinguishing-cases Open against closed; the three aids; the walker's depth and the cane's weight are search-only and left to the producer's provisional marks.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios and what each pins.
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
        archetypeExtent(AutoMovieArchetypeUmbrella.create({}, seed), "y").size,
    ),
    row(
      "open canopy",
      1.2,
      1.38,
      BLUNT,
      (seed: number): number =>
        archetypeExtent(AutoMovieArchetypeUmbrella.create({ open: true }, seed), "x").size,
    ),
    row(
      "umbrella mass",
      0.66,
      0.91,
      BLUNT,
      (seed: number): number => AutoMovieArchetypeUmbrella.create({}, seed).body.mass,
    ),
    row(
      "cane handle height",
      30 * AutoMovieArchetypeUnits.INCH,
      39 * AutoMovieArchetypeUnits.INCH,
      DRIVE,
      (seed: number): number =>
        archetypeExtent(createMobilityAid({ kind: "cane" }, seed), "y").high,
    ),
    row(
      "cane shaft",
      0.75 * AutoMovieArchetypeUnits.INCH,
      0.75 * AutoMovieArchetypeUnits.INCH,
      DRIVE,
      (seed: number): number =>
        archetypeExtent(createMobilityAid({ kind: "cane" }, seed), "x", [
          "shaft",
        ]).size,
    ),
    row(
      "adult walker height",
      32 * AutoMovieArchetypeUnits.INCH,
      39 * AutoMovieArchetypeUnits.INCH,
      DRIVE,
      (seed: number): number =>
        archetypeExtent(
          createMobilityAid({ kind: "walker", model: "adult" }, seed),
          "y",
        ).high,
    ),
    row(
      "junior walker height",
      25 * AutoMovieArchetypeUnits.INCH,
      32.25 * AutoMovieArchetypeUnits.INCH,
      DRIVE,
      (seed: number): number =>
        archetypeExtent(
          createMobilityAid({ kind: "walker", model: "junior" }, seed),
          "y",
        ).high,
    ),
    row(
      "walker width",
      24 * AutoMovieArchetypeUnits.INCH,
      24 * AutoMovieArchetypeUnits.INCH,
      DRIVE,
      (seed: number): number =>
        archetypeExtent(createMobilityAid({ kind: "walker" }, seed), "x").size,
    ),
    row(
      "walker mass",
      7 * AutoMovieArchetypeUnits.POUND,
      7.5 * AutoMovieArchetypeUnits.POUND,
      DRIVE,
      (seed: number): number =>
        createMobilityAid({ kind: "walker" }, seed).body.mass,
    ),
    row(
      "stand height",
      1.43,
      2.26,
      PROVITA,
      (seed: number): number =>
        archetypeExtent(createMobilityAid({ kind: "infusionStand" }, seed), "y")
          .high,
    ),
    row(
      "stand base",
      0.63,
      0.63,
      PROVITA,
      // The base's diameter is twice the reach of a castor's outer edge from the tube's axis; the first leg points along +Z.
      (seed: number): number =>
        2 *
        archetypeExtent(
          createMobilityAid({ kind: "infusionStand" }, seed),
          "z",
          ["castor0"],
        ).high,
    ),
    row(
      "stand tube",
      0.0337,
      0.0337,
      PROVITA,
      (seed: number): number =>
        createMobilityAid({ kind: "infusionStand" }, seed).affordance("grip")
          .aperture!,
    ),
    row(
      "stand mass",
      12,
      12,
      PROVITA,
      (seed: number): number =>
        createMobilityAid({ kind: "infusionStand" }, seed).body.mass,
    ),
  ]);

  // 2. The canopy only when open.
  for (const seed of [0, 1, 2]) {
    const closed: ReturnType<typeof AutoMovieArchetypeUmbrella.create> = AutoMovieArchetypeUmbrella.create({}, seed);
    const open: ReturnType<typeof AutoMovieArchetypeUmbrella.create> = AutoMovieArchetypeUmbrella.create(
      { open: true },
      seed,
    );
    const has = (u: ReturnType<typeof AutoMovieArchetypeUmbrella.create>): boolean =>
      u.affordances.some(
        (a: IAutoMovieAffordance): boolean => a.id === "canopy",
      );
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

  // 4. The infusion stand on its castors, its hook on top, its balance low.
  for (const seed of [0, 1, 2]) {
    const stand: ReturnType<typeof createMobilityAid> = createMobilityAid(
      { kind: "infusionStand" },
      seed,
    );
    const outer: ReturnType<typeof archetypeExtent> = archetypeExtent(
      stand,
      "y",
      ["outerTube"],
    );
    if (
      Math.abs(archetypeExtent(stand, "y").low) > 1e-9 ||
      Math.abs(
        stand.affordance("hook").frame.translation.y -
          archetypeExtent(stand, "y").high,
      ) > 1e-9 ||
      stand.body.centerOfMass === null ||
      stand.body.centerOfMass.y > (outer.low + outer.high) / 2
    )
      findings.push(
        `infusion stand@${seed}: off the floor, its hook or its balance`,
      );
  }
  TestValidator.equals("umbrellas and aids stay in their bands", findings, []);
}
