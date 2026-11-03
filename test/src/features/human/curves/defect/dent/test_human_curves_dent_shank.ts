import { assertHumanCurveKinks } from "../../../../internal/curves/assertHumanCurveKinks";
import { HumanCurveKinkRegions } from "../../../../internal/curves/HumanCurveKinkRegions";

/**
 * Pins that no person's shank carries a dent, ridge or step between the knee
 * and the ankle: every meridian round the tibia turns no sharper than smooth
 * skin does, on both legs.
 *
 * Scenarios:
 * 1. A Gaussian ring 3 mm high and 2 mm wide raised round each shank's axis at mid-shank on a copy of f1's skin reads past the bound, at least 1.5 mm above the unedited skin.
 * 2. Every person of `HumanPeople`: both shanks are read at 24 azimuths each, and every one past the bound is listed by person, side, azimuth, station and point.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person's bind skin and cuts each leg chain by half-planes through the shank's axis (knee joint to ankle joint) every 15 degrees, from a tenth to 0.85 of the shank, within 0.05 S of the axis, reading each outline's sharpest turn over a 10 mm chord at 1 mm resampling. It catches calf and ankle dents, a ring printed round the shank at a layer, and a step where two spans meet.
 * @evidence contracts/testing.md#independent-expectations The bound is the crease definition (`HumanAnatomyShared.CREASE`): the gastrocnemius bellies, the soleus, the tibial crest and the extensor mass make broad convex turns, and the shank carries no crease standing (Gray 1918); the knee above a tenth and the malleoli below 0.85 are not read. Proven red on f1 by a 3 mm, 2 mm-wide Gaussian ring. Oracle limits: the axis is the rig's tibia; the tibial crest's own turn under thin skin on a very lean person reads near the bound.
 * @evidence contracts/testing.md#distinguishing-cases Both legs of the core set's ten people, slender and heavy calves of both sexes. The shank's girth profile belongs to `test_human_curves_profile_leg` and `test_human_anatomy_leg`; this test owns the skin's freedom from kinks across it.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curves_dent_shank`, generating the cached people's bind skin in process on the CPU with no renderer, browser or GPU.
 */
export function test_human_curves_dent_shank(): void {
  const failures: string[] = [];
  for (const side of ["left", "right"] as const) {
    try {
      assertHumanCurveKinks(HumanCurveKinkRegions.shank(side));
    } catch (error) {
      failures.push((error as Error).message);
    }
  }
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
