import { createStreetFixture } from "@automovie/archetypes";
import type { IAutoMovieAffordance } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/** A millimetre, the tolerance of #3368 for a placed contact. */
const MM: number = 1e-3;

/**
 * Traffic cones, bollards, hydrants and lamp posts stand at their sources' sizes, with their contacts where a hand meets them.
 *
 * Scenarios:
 * 1. A cone stands between the MUTCD's 18 and 28 in, its base 13.4 in for every 28 in of height as the Brimar cone's, lifted by a handle at its top.
 * 2. A bollard stands Reliance's 36 in, between its 4.50 and 10.75 in pipes, its post a bar the shaft's height and its top a face at the top.
 * 3. A hydrant stands Mueller's 32 in with its nozzles' centreline 24 in up, the pumper toward `+Z` and the hose nozzles toward `+X` and `-X`, its nut a knob on top.
 * 4. A lamp post's shaft stands Wave's 12 ft on a 9 1/4 in base under Sternberg's 21 in by 40 in luminaire, its post a bar from the base's top to the shaft's top.
 * 5. A sign post holds a 30 to 36 in STOP sign with its bottom edge at the MUTCD's 7 ft on Atkore's 2 in post, the post below the sign a bar.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Measures the produced colliders and contacts over the seeds; a fixture off its source's size or a contact off its part is caught with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations Every figure is the MUTCD's or the makers' restated here in metres.
 * @evidence contracts/development/testing.md#distinguishing-cases Five kinds with different contacts: a handle, a post with a top, a knob, a post on a base, a post under a sign.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the five scenarios and what each pins.
 */
export function test_archetype_street_fixtures(): void {
  const findings: string[] = [];
  const near = (what: string, got: number, wanted: number): void => {
    if (!(Math.abs(got - wanted) <= MM))
      findings.push(`${what}: ${got}, ${wanted} expected`);
  };
  const make = (
    kind: createStreetFixture.Kind,
    seed: number,
  ): ReturnType<typeof createStreetFixture> =>
    createStreetFixture({ kind }, seed);

  // 1. The cone.
  findings.push(
    ...archetypeBandSweep([
      {
        name: "cone height",
        measure: (seed: number): number =>
          archetypeExtent(make("trafficCone", seed), "y").size,
        minimum: 0.4572,
        maximum: 0.7112,
        source: "MUTCD 6F.64",
      },
      {
        name: "bollard diameter",
        measure: (seed: number): number =>
          archetypeExtent(make("bollard", seed), "x").size,
        minimum: 0.1143,
        maximum: 0.2731,
        source: "Reliance R-1007",
      },
    ]),
  );
  for (const seed of [0, 9]) {
    const cone: ReturnType<typeof createStreetFixture> = make("trafficCone", seed);
    const height: number = archetypeExtent(cone, "y").size;
    near(
      `cone ${seed}: the base`,
      archetypeExtent(cone, "x", ["base"]).size,
      (13.4 / 28) * height,
    );
    near(
      `cone ${seed}: the handle at the top`,
      cone.affordance("top").frame.translation.y,
      height,
    );
  }

  // 2. The bollard.
  const bollard: ReturnType<typeof createStreetFixture> = make("bollard", 3);
  near("the bollard's height", archetypeExtent(bollard, "y").high, 0.9144);
  near("the bollard's post", bollard.affordance("post").length!, 0.9144);
  near(
    "the bollard's top",
    bollard.affordance("top").frame.translation.y,
    0.9144,
  );

  // 3. The hydrant.
  const hydrant: ReturnType<typeof createStreetFixture> = make("hydrant", 3);
  near("the hydrant's height", archetypeExtent(hydrant, "y").high, 0.8128);
  for (const part of ["pumper", "hose-left", "hose-right"]) {
    const y: { low: number; high: number } = archetypeExtent(hydrant, "y", [
      part,
    ]);
    near(`the hydrant's ${part} centreline`, (y.low + y.high) / 2, 0.6096);
  }
  const barrel: number = archetypeExtent(hydrant, "x", ["barrel"]).high;
  if (!(archetypeExtent(hydrant, "z", ["pumper"]).high > barrel))
    findings.push("the pumper nozzle does not face +Z");
  if (
    !(
      archetypeExtent(hydrant, "x", ["hose-left"]).high > barrel &&
      archetypeExtent(hydrant, "x", ["hose-right"]).low < -barrel
    )
  )
    findings.push("the hose nozzles do not face +X and -X");
  const nut: IAutoMovieAffordance = hydrant.affordance("nut");
  near("the hydrant's nut", nut.frame.translation.y, 0.8128);

  // 4. The lamp post.
  const lamp: ReturnType<typeof createStreetFixture> = make("lampPost", 3);
  near("the lamp post's height", archetypeExtent(lamp, "y", ["shaft"]).high, 3.6576);
  near("the luminaire's width", archetypeExtent(lamp, "x", ["luminaire"]).size, 0.5334);
  near("the luminaire's height", archetypeExtent(lamp, "y", ["luminaire"]).size, 1.016);
  near("the lamp post's base", archetypeExtent(lamp, "x", ["base"]).size, 0.235);
  const post: IAutoMovieAffordance = lamp.affordance("post");
  near(
    "the lamp post's bar",
    post.length!,
    3.6576 - archetypeExtent(lamp, "y", ["base"]).high,
  );
  // 5. The sign post.
  findings.push(
    ...archetypeBandSweep([
      {
        name: "STOP sign side",
        measure: (seed: number): number =>
          archetypeExtent(make("signPost", seed), "x", ["sign"]).size,
        minimum: 0.762,
        maximum: 0.9144,
        source: "MUTCD Table 2B-1",
      },
    ]),
  );
  const sign: ReturnType<typeof createStreetFixture> = make("signPost", 3);
  near("the sign's bottom edge", archetypeExtent(sign, "y", ["sign"]).low, 2.1336);
  near("the sign post's side", archetypeExtent(sign, "x", ["post"]).size, 0.0508);
  near("the sign post's bar", sign.affordance("post").length!, 2.1336);
  TestValidator.equals(
    "street fixtures stand at their sources",
    findings,
    [],
  );
}
