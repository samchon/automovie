import {
  ArchetypeFrame,
  createBoxingGlove,
  createHeavyBag,
} from "@automovie/archetypes";
import { physicalShapeSegmentDistance } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMoviePhysicalProfile,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";
import { archetypePlaced } from "../internal/archetypePlaced";

/** The boxing rules. */
const IBA: string = "IBA Technical and Competition Rules 2026";

/**
 * A boxing glove is sized and weighed as the boxing rules give it, worn through its cuff and struck with its knuckle face, and a heavy bag hangs below its hook with its target on its own surface.
 *
 * Scenarios:
 * 1. A glove placed on a 0.9 m table through the public chain rests there within a millimetre, its contacts named points of the prop.
 * 2. Over 200 seeds: the glove's fist 0.20 m long and 0.14 to 0.16 m high, its cuff 0.08 to 0.10 m (IBA Appendix 11), its mass 0.227 to 0.340 kg, the 8 to 12 oz of IBA rule 45.6; the bag 1.168 to 1.499 m tall and 0.33 to 0.368 m across (provisional listings).
 * 3. The glove's `wear` socket lies inside the fist and its `+Y` points back out through the cuff, along `-Z`; its `face` lies on the fist's knuckle end, its `+Y` along `+Z`, and it states the `normal` direction of a working face.
 * 4. The bag hangs wholly below its `hook` at the origin; a centimetre behind its `target` along `-Y` lies in the bag and a centimetre out along `+Y` in no collider.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces the glove and the bag, places the glove through the public chain and measures colliders and contacts; a glove off the rules' sizes or weights, a socket that opens the wrong way, a face off the knuckles, a bag above its hook or a target off its surface fails with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations The bands are the rules' figure and clause, written here; the target's sides are found by the engine's point distance to the bag's own collider.
 * @evidence contracts/development/testing.md#distinguishing-cases The worn and the hung thing, both sides of the target; striking a bag is a motion law's and is not tested here.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man for the placing performance and in-memory models; it runs locally and wherever CI runs the archetype tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the four scenarios and what each pins.
 */
export function test_archetype_boxing_equipment(): void {
  // 1. The glove placed.
  const findings: string[] = archetypePlaced([
    { name: "boxingGlove", archetype: createBoxingGlove(), yaw: 30, on: 0.9 },
  ]);

  // 2. The bands.
  const row = (
    name: string,
    minimum: number,
    maximum: number,
    source: string,
    measure: (seed: number) => number,
  ): archetypeBandSweep.IRow => ({
    name,
    minimum,
    maximum,
    source,
    measure,
    tolerance: 1e-9,
  });
  findings.push(
    ...archetypeBandSweep([
      row("glove length", 0.2, 0.2, `${IBA}, Appendix 11`, (s: number): number =>
        archetypeExtent(createBoxingGlove({}, s), "z", ["fist"]).size,
      ),
      row("glove height", 0.14, 0.16, `${IBA}, Appendix 11`, (s: number): number =>
        archetypeExtent(createBoxingGlove({}, s), "y", ["fist"]).size,
      ),
      row("glove cuff", 0.08, 0.1, `${IBA}, Appendix 11`, (s: number): number =>
        archetypeExtent(createBoxingGlove({}, s), "z", ["cuff"]).size,
      ),
      row("glove weight", 0.227, 0.34, `${IBA}, rule 45.6`, (s: number): number =>
        createBoxingGlove({}, s).body.mass,
      ),
      row("bag height", 1.168, 1.499, "listings", (s: number): number =>
        archetypeExtent(createHeavyBag({}, s), "y", ["bag"]).size,
      ),
      row("bag diameter", 0.33, 0.368, "listings", (s: number): number =>
        archetypeExtent(createHeavyBag({}, s), "x", ["bag"]).size,
      ),
    ]),
  );

  // 3. Worn through the cuff, struck with the knuckles.
  const glove: ReturnType<typeof createBoxingGlove> = createBoxingGlove({}, 4);
  const wear: IAutoMovieAffordance = glove.affordance("wear");
  const face: IAutoMovieAffordance = glove.affordance("face");
  const fist: { low: number; high: number } = archetypeExtent(glove, "z", [
    "fist",
  ]);
  const out: IAutoMovieVector3 = ArchetypeFrame.axis(wear.frame, "y");
  if (
    !(
      wear.frame.translation.z > fist.low &&
      wear.frame.translation.z < fist.high &&
      out.z < -0.999
    )
  )
    findings.push("the glove's socket is not in the fist opening toward the cuff");
  if (
    Math.abs(face.frame.translation.z - fist.high) > 1e-9 ||
    ArchetypeFrame.axis(face.frame, "y").z < 0.999 ||
    face.direction !== "normal"
  )
    findings.push("the glove's face is not the knuckle end facing +Z as a working face");

  // 4. The bag below its hook, its target on its surface.
  const bag: ReturnType<typeof createHeavyBag> = createHeavyBag({}, 4);
  if (archetypeExtent(bag, "y").high > 1e-9)
    findings.push("a part of the bag stands above its hook");
  const origin: IAutoMoviePhysicalProfile.ITransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const inside = (along: number): boolean => {
    const at: IAutoMovieVector3 = ArchetypeFrame.point(
      bag.affordance("target").frame,
      { x: 0, y: along, z: 0 },
    );
    return bag
      .shapes()
      .some(
        (shape: IAutoMoviePhysicalProfile.IShape): boolean =>
          physicalShapeSegmentDistance(origin, shape, at, at) <= 1e-9,
      );
  };
  if (!inside(-0.01) || inside(0.01))
    findings.push("the bag's target is not on its surface");
  TestValidator.equals(
    "boxing gloves and bags are sized, worn and struck where they are",
    findings,
    [],
  );
}
