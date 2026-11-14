import { ArchetypeFrame, createVessel } from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/**
 * The pouring and carrying vessels stay inside their cited dimensions for every seed, measured on the produced thing, and each pours from a spout away from its handle.
 *
 * Scenarios:
 * 1. Over 200 seeds, inside the band and spanning at least 80 % of it: a vase's rim 30 cm up and 16 cm across; a jug's rim 26.5 cm up; a teapot's rim 13 cm up; a bucket's rim 26.5 to 27 cm up and 25 to 26.5 cm across; a kettle 24 to 25.3 cm high over its handle; a watering can 20 cm high over its handle.
 * 2. For three seeds of every kind with a spout, the spout's end lies outside the vessel's walls, its `+Y` points out of the vessel and upward, and the end stands no lower than a third of the rim's height; a jug's and a teapot's spout is on the side opposite its handle, and a kettle's and a watering can's handle over the top runs front to back toward its spout.
 * 3. A vase's `body` grip is round its middle: its frame halfway up the rim, its width the vase's measured diameter.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces each vessel for 200 seeds and measures colliders, frames and grip widths; a band other than the citation's, a seed that does not vary it, a spout on the handle's side, inside the walls or pointing down, or a vase held off its middle is caught.
 * @evidence contracts/development/testing.md#independent-expectations The heights and diameters are IKEA's BERÄKNA, TILLBRINGARE and GLADELIG pages, the galvanised 10 l buckets', the Le Creuset Kone kettle's and the VATTENKRASSE can's listings; a spout pours away from the hand that tips the vessel, as every jug, teapot, kettle and watering can is made.
 * @evidence contracts/development/testing.md#distinguishing-cases The six kinds the vessel gained; the older four are pinned by `test_archetype_everyday_placed`; masses from packed weights only bound a vessel from above and are left to the producer's provisional marks.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios and what each pins.
 */
export function test_archetype_props_vessel_bands(): void {
  const row = (
    name: string,
    minimum: number,
    maximum: number,
    source: string,
    measure: (seed: number) => number,
  ): archetypeBandSweep.IRow => ({ name, minimum, maximum, source, measure });
  const rim = (kind: createVessel.Kind, seed: number): number =>
    createVessel({ kind }, seed).affordance("rim").frame.translation.y;
  const findings: string[] = archetypeBandSweep([
    row("vase rim", 0.3, 0.3, "IKEA BERÄKNA", (seed: number): number =>
      rim("vase", seed),
    ),
    row(
      "vase diameter",
      0.16,
      0.16,
      "IKEA BERÄKNA",
      (seed: number): number =>
        archetypeExtent(createVessel({ kind: "vase" }, seed), "x").size,
    ),
    row("jug rim", 0.265, 0.265, "IKEA TILLBRINGARE", (seed: number): number =>
      rim("jug", seed),
    ),
    row("teapot rim", 0.13, 0.13, "IKEA GLADELIG", (seed: number): number =>
      rim("teapot", seed),
    ),
    row(
      "bucket rim",
      0.265,
      0.27,
      "galvanised 10 l buckets",
      (seed: number): number => rim("bucket", seed),
    ),
    row(
      "bucket diameter",
      0.25,
      0.265,
      "galvanised 10 l buckets",
      (seed: number): number =>
        archetypeExtent(createVessel({ kind: "bucket" }, seed), "z").size,
    ),
    row(
      "kettle over its handle",
      0.24,
      0.253,
      "Le Creuset Kone 1.6 l",
      (seed: number): number =>
        archetypeExtent(createVessel({ kind: "kettle" }, seed), "y").size,
    ),
    row(
      "watering can over its handle",
      0.2,
      0.2,
      "IKEA VATTENKRASSE 2.0 l",
      (seed: number): number =>
        archetypeExtent(createVessel({ kind: "wateringCan" }, seed), "y").size,
    ),
  ]);

  // 2. Each spout pours away from its handle, out and up from the walls.
  for (const kind of ["jug", "teapot", "kettle", "wateringCan"] as const)
    for (const seed of [0, 1, 2]) {
      const vessel: ReturnType<typeof createVessel> = createVessel(
        { kind },
        seed,
      );
      const spout: ReturnType<typeof vessel.affordance> =
        vessel.affordance("spout");
      const handle: ReturnType<typeof vessel.affordance> =
        vessel.affordance("handle");
      const out: ReturnType<typeof ArchetypeFrame.axis> = ArchetypeFrame.axis(
        spout.frame,
        "y",
      );
      const at: IAutoMovieVector3 = spout.frame.translation;
      const level: IAutoMovieVector3 = Vector3.normalize({
        x: at.x,
        y: 0,
        z: at.z,
      });
      const radius: number = vessel.dimensions.diameter! / 2;
      if (
        !(Math.hypot(at.x, at.z) > radius) ||
        !(Vector3.dot(out, level) > 0) ||
        !(out.y > 0) ||
        !(at.y >= rim(kind, seed) / 3)
      )
        findings.push(`${kind}@${seed}: the spout is not out and up`);

      // A side handle stands opposite the spout; a handle over the top runs toward it, front to back.
      const opposite: boolean =
        kind === "kettle" || kind === "wateringCan"
          ? Math.abs(
              Math.abs(
                Vector3.dot(level, ArchetypeFrame.axis(handle.frame, "x")),
              ) - 1,
            ) < 1e-9
          : Vector3.dot(
              level,
              Vector3.normalize({
                x: handle.frame.translation.x,
                y: 0,
                z: handle.frame.translation.z,
              }),
            ) < 0;
      if (!opposite)
        findings.push(`${kind}@${seed}: the spout is not across from its handle`);
    }

  // 3. A vase is held round its middle.
  for (const seed of [0, 1, 2]) {
    const vase: ReturnType<typeof createVessel> = createVessel(
      { kind: "vase" },
      seed,
    );
    const body: ReturnType<typeof vase.affordance> = vase.affordance("body");
    if (
      Math.abs(body.frame.translation.y - rim("vase", seed) / 2) > 1e-9 ||
      Math.abs(body.aperture! - archetypeExtent(vase, "x").size) > 1e-9
    )
      findings.push(`vase@${seed}: not held round its middle`);
  }
  TestValidator.equals("the vessels stay in their cited bands", findings, []);
}
