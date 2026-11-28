import { AutoMovieArchetypeBuilder, AutoMovieArchetypeDrawSession, AutoMovieArchetypeFrame, AutoMovieArchetypeHorse, AutoMovieArchetypeRefusal, AutoMovieArchetypeSite } from "@automovie/archetypes";
import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/**
 * Keep a finite stirrup contact on its moving material owner.
 *
 * Scenarios:
 *
 * 1. Equine tread ends are 50 mm apart.
 * 2. A duplicate position on another part cannot carry the tread.
 * 3. A depthless stirrup stays on its centreline.
 * 4. Serialized strings refuse as normalized site coordinates and opacity.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the named material owner, measured extent, depthless contact and raw ratio refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Queries horse and fixture equipment, compares articulated and independently posed sites, and supplies raw ratios through the builder and site entry points.
 * @evidence contracts/development/testing.md#independent-expectations A 50 mm tread extends 25 mm from centre in each direction. Its part transform carries those endpoints. A coincident decoy and a depthless contact distinguish extent and identity. A serialized string remains distinct from a finite numeric ratio.
 */
export function test_archetypes_core_finite_material_site(): void {
  const horse: ReturnType<typeof AutoMovieArchetypeHorse.create> = AutoMovieArchetypeHorse.create({ tack: "saddle" });
  TestValidator.equals(
    "the left material part comes from the producer",
    horse.affordance("leftStirrup").materialPart,
    "stirrup-left",
  );
  TestValidator.predicate(
    "a real tread extends by 50 mm",
    nclose(
      AutoMovieEngineVector3.distance(
        horse.site("leftStirrup", 0.5, 0).translation,
        horse.site("leftStirrup", 0.5, 1).translation,
      ),
      0.05,
      1e-12,
    ),
  );

  type Id = "pivot" | "tread" | "loop";
  const builder: AutoMovieArchetypeBuilder<Id, never> =
    new AutoMovieArchetypeBuilder({
      material: "steel",
      name: "stirrup fixture",
      draw: new AutoMovieArchetypeDrawSession<never>(
        "stirrup fixture",
        {},
        undefined,
        {},
      ),
    });
  const at = { x: 0, y: 0, z: 1 };
  const dimensions = { x: 0.2, y: 0.01, z: 0.05 };
  builder.box("carrier", dimensions, at);
  builder.box("decoy", dimensions, at);
  builder.affordance({
    id: "pivot",
    kind: "hinge",
    frame: AutoMovieArchetypeFrame.upright({ x: 0, y: 0, z: 0 }),
    extent: null,
    travel: 90,
    parts: ["carrier"],
  });
  const tread: IAutoMovieAffordance<"tread"> = {
    id: "tread",
    kind: "stirrup",
    materialPart: "carrier",
    frame: AutoMovieArchetypeFrame.upright(at),
    extent: null,
    width: 0.2,
    depth: 0.05,
  };
  builder.affordance(tread);
  builder.affordance({ ...tread, id: "loop", depth: undefined });
  const ratio: number = JSON.parse('"0.4"');
  const failures: string[] = [];
  try {
    builder.box("bad-opacity", dimensions, at, { opacity: ratio });
    failures.push("builder opacity accepted a serialized string");
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("opacity"))
      failures.push("builder opacity lost its input-specific refusal");
  }
  const model = builder.build(1);
  const narrow = model.prepareArticulateSite()!;
  for (const pivot of [90, 10, 0, 60, 10]) {
    const moved = model.articulate({ pivot });
    const owner: IAutoMovieTransform = moved.parts.find(
      (part): boolean => part.id === "carrier",
    )!.transform!;
    const posed: IAutoMovieAffordance = narrow("tread", { pivot })!;
    TestValidator.predicate(
      "narrow site follows the displayed owner",
      vclose(posed.frame.translation, owner.translation, 1e-12),
    );
    for (const v of [0, 1])
      TestValidator.predicate(
        `tread endpoint ${v} follows the same material frame`,
        vclose(
          moved.site("tread", 0.5, v).translation,
          AutoMovieArchetypeFrame.point(owner, {
            x: 0,
            y: 0,
            z: (v - 0.5) * 0.05,
          }),
          1e-12,
        ),
      );
    TestValidator.predicate(
      "a depthless loop projects onto its centreline",
      vclose(
        moved.site("loop", 0.5, 0).translation,
        moved.site("loop", 0.5, 1).translation,
        1e-12,
      ),
    );
  }
  const shifted: IAutoMovieTransform = AutoMovieArchetypeFrame.upright({
    x: 2,
    y: 1,
    z: -3,
  });
  const rebound: typeof model = model.reposed(
    model.parts.map((part) =>
      part.id === "carrier" ? { ...part, transform: shifted } : part,
    ),
  );
  TestValidator.predicate(
    "independently posed parts also carry their sites",
    vclose(
      rebound.site("tread", 0.5, 1).translation,
      AutoMovieArchetypeFrame.point(shifted, { x: 0, y: 0, z: 0.025 }),
      1e-12,
    ),
  );
  const badCoordinates: readonly [string, number, number][] = [
    ["u", ratio, 0.5],
    ["v", 0.5, ratio],
  ];
  for (const [axis, u, v] of badCoordinates) {
    try {
      AutoMovieArchetypeSite.at("stirrup fixture", tread, u, v);
      failures.push(`site ${axis} accepted a serialized string`);
    } catch (error) {
      if (!(error instanceof AutoMovieArchetypeRefusal) || error.axis !== `tread.${axis}`)
        failures.push(`site ${axis} lost its input-specific refusal`);
    }
  }
  TestValidator.equals("normalized numeric input refusals", failures, []);
}
