import { assertHumanCurveKinks } from "../../../../internal/curves/assertHumanCurveKinks";
import { HumanCurveKinkRegions } from "../../../../internal/curves/HumanCurveKinkRegions";

/**
 * Pins that no person's thigh root carries a ledge where the leg leaves the
 * trunk: every lateral meridian round the femur, from just below the hip
 * joint to a third of the femur, turns no sharper than smooth skin does, on
 * both legs.
 *
 * Scenarios:
 * 1. A Gaussian ring 3 mm high and 2 mm wide raised round each femur's axis on a copy of f1's skin reads past the bound, at least 1.5 mm above the unedited skin.
 * 2. Every person of `HumanPeople`: both thighs' lateral meridians are read, and every one past the bound is listed by person, side, azimuth, station and point.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person's bind skin and cuts each thigh's root by half-planes through the femur's axis (hip joint to knee joint) every 15 degrees over the lateral 120 degrees, from 0.05 to 0.35 of the femur below the hip joint, within 0.12 S of the axis, reading each outline's sharpest turn over a 10 mm chord at 1 mm resampling. It catches the ledge at the thigh root the viewer frames show, a step where the leg's top layer meets the trunk's crotch ring, and a ridge round the thigh.
 * @evidence contracts/testing.md#independent-expectations The bound is the crease definition (`HumanAnatomyShared.CREASE`): the thigh's lateral root over the greater trochanter and tensor fasciae latae carries no crease (Gray 1918); the medial side, with the inguinal crease in front and the gluteal sulcus behind, has real creases and is not read. Proven red on f1 by a 3 mm, 2 mm-wide Gaussian ring, 2.87 mm of sagitta over the chord. Oracle limits: the axis is the rig's femur; the bind's A-pose is read, not the neutral.
 * @evidence contracts/testing.md#distinguishing-cases Both legs of the core set's ten people. The crotch seam's gap and angle belong to `test_human_curves_seam_limbs`, the thigh's girth profile to `test_human_curves_profile_leg`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curves_step_groin`, generating the cached people's bind skin in process on the CPU with no renderer, browser or GPU.
 */
export function test_human_curves_step_groin(): void {
  const failures: string[] = [];
  for (const side of ["left", "right"] as const) {
    try {
      assertHumanCurveKinks(HumanCurveKinkRegions.groin(side));
    } catch (error) {
      failures.push((error as Error).message);
    }
  }
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
