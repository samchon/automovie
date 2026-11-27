import { AutoMovieArchetypeUnits, AutoMovieArchetypeLongTool } from "@automovie/archetypes";
import { Quaternion } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../../internal/archetypeBandSweep";
import { archetypeExtent } from "../../internal/archetypeExtent";

/**
 * A fishing rod and a forest axe stay inside their sources' dimensions for every seed, measured on the produced thing; the rod is held at its butt and cast from its tip, and the axe's handle is as thick as its hickory's mass makes it, its edge ahead of it by the head's length.
 *
 * Scenarios:
 * 1. Over 200 seeds, inside the band and spanning at least 80 % of it where it has width: a rod one of Daiwa's seven Ninja X models, 1.83 to 2.74 m long and 106 to 178 g; an axe 25 in to 0.65 m long, its head 0.163 m from poll to edge, its edge 3.5 in to 0.09 m, its head 0.9 kg to 2 lb, found from the balance, and 1.2 kg whole.
 * 2. For three seeds, the rod's `grip` is at its butt, its centre half the grip's length up the rod, and its `tip` at its top end.
 * 3. For three seeds, the axe's `shaft` aperture is the diameter at which hickory of 800 kg per cubic metre over the handle's length below the head weighs the whole less the head; the head's poll is flush with the handle's back, and the `face` sits on the edge at the head's length less the handle's radius ahead of its axis, facing `+Z`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces the rod and the axe for 200 seeds and measures their colliders, frames, masses and balance; a band other than the citation's, a seed that does not vary it, a rod gripped off its butt or cast from off its end, a handle not sized by its mass, or an edge off the head's front is caught.
 * @evidence contracts/development/testing.md#independent-expectations Daiwa's published length and weights; Gränsfors Bruk's and a retailer's figures for the 430 axe and The Wood Database's hickory density; an angler holds a spinning rod at its butt and the line leaves its tip, and an axe's handle runs through the eye at the head's back.
 * @evidence contracts/development/testing.md#distinguishing-cases The rod and the axe the producer gained; the broom, mop and shovel are pinned by the older band tests and their unchanged contract rows.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios and what each pins.
 */
export function test_archetype_props_longtool_bands(): void {
  const row = (
    name: string,
    minimum: number,
    maximum: number,
    source: string,
    measure: (seed: number) => number,
  ): archetypeBandSweep.IRow => ({ name, minimum, maximum, source, measure });
  const findings: string[] = archetypeBandSweep([
    row(
      "rod length",
      1.83,
      2.74,
      "Daiwa Ninja X",
      (seed: number): number =>
        archetypeExtent(AutoMovieArchetypeLongTool.create({ kind: "fishingRod" }, seed), "y").size,
    ),
    row(
      "rod mass",
      0.106,
      0.178,
      "Daiwa Ninja X",
      (seed: number): number =>
        AutoMovieArchetypeLongTool.create({ kind: "fishingRod" }, seed).body.mass,
    ),
    row(
      "axe length",
      25 * AutoMovieArchetypeUnits.INCH,
      0.65,
      "Gränsfors Bruk 430 and its retailer",
      (seed: number): number =>
        archetypeExtent(AutoMovieArchetypeLongTool.create({ kind: "forestAxe" }, seed), "y").size,
    ),
    row(
      "axe head length",
      0.163,
      0.163,
      "a retailer's measurement of the 430",
      (seed: number): number =>
        archetypeExtent(AutoMovieArchetypeLongTool.create({ kind: "forestAxe" }, seed), "z").size,
    ),
    row(
      "axe edge",
      3.5 * AutoMovieArchetypeUnits.INCH,
      0.09,
      "the Axe Book and a retailer",
      (seed: number): number =>
        AutoMovieArchetypeLongTool.create({ kind: "forestAxe" }, seed).affordance("face").width!,
    ),
    row(
      "axe head mass",
      0.9,
      2 * AutoMovieArchetypeUnits.POUND,
      "the Axe Book and a retailer",
      (seed: number): number => {
        // The head's centre is half the edge up, the handle's half-way between the edge and the top.
        const axe: ReturnType<typeof AutoMovieArchetypeLongTool.create> = AutoMovieArchetypeLongTool.create(
          { kind: "forestAxe" },
          seed,
        );
        const length: number = archetypeExtent(axe, "y").size;
        const edge: number = axe.affordance("face").width!;
        const handle: number = (edge + length) / 2;
        return (
          (axe.body.mass * (handle - axe.body.centerOfMass!.y)) /
          (handle - edge / 2)
        );
      },
    ),
    row(
      "axe mass",
      1.2,
      1.2,
      "Gränsfors Bruk 430",
      (seed: number): number =>
        AutoMovieArchetypeLongTool.create({ kind: "forestAxe" }, seed).body.mass,
    ),
  ]);
  for (const seed of [0, 1, 2]) {
    const rod: ReturnType<typeof AutoMovieArchetypeLongTool.create> = AutoMovieArchetypeLongTool.create(
      { kind: "fishingRod" },
      seed,
    );
    const grip: ReturnType<typeof rod.affordance> = rod.affordance("grip");
    if (
      Math.abs(grip.frame.translation.y - grip.length! / 2) > 1e-12 ||
      Math.abs(
        rod.affordance("tip").frame.translation.y -
          archetypeExtent(rod, "y").high,
      ) > 1e-12
    )
      findings.push(`fishingRod@${seed}: the grip or the tip is off its end`);

    const axe: ReturnType<typeof AutoMovieArchetypeLongTool.create> = AutoMovieArchetypeLongTool.create(
      { kind: "forestAxe" },
      seed,
    );
    const length: number = archetypeExtent(axe, "y").size;
    const face: ReturnType<typeof axe.affordance> = axe.affordance("face");
    const edge: number = face.width!;
    const handle: number = axe.body.mass - axe.dimensions.headMass!;
    const diameter: number = Math.sqrt(
      (4 * handle) / (Math.PI * 800 * (length - edge)),
    );
    const shaft: ReturnType<typeof axe.affordance> = axe.affordance("shaft");
    const out: { x: number; y: number; z: number } = Quaternion.rotateVector(
      face.frame.rotation,
      { x: 0, y: 1, z: 0 },
    );
    if (
      Math.abs(shaft.aperture! - diameter) > 1e-9 ||
      Math.abs(archetypeExtent(axe, "z").low + diameter / 2) > 1e-9 ||
      Math.abs(
        face.frame.translation.z - (axe.dimensions.headLength! - diameter / 2),
      ) > 1e-9 ||
      Math.abs(out.z - 1) > 1e-9
    )
      findings.push(
        `forestAxe@${seed}: the handle is not sized by its hickory, or the edge is off the head's front`,
      );
  }
  TestValidator.equals(
    "the fishing rod and the forest axe stay in their cited bands",
    findings,
    [],
  );
}
