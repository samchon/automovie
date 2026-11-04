import { assertHumanCurveKinks } from "../../../../internal/curves/assertHumanCurveKinks";
import { HumanCurveKinkRegions } from "../../../../internal/curves/HumanCurveKinkRegions";

/**
 * Pins that no person's neck front carries waves, ridges or steps between the
 * jugular notch and the chin's underside: every anterior meridian there turns
 * no sharper than smooth skin does.
 *
 * Scenarios:
 * 1. A Gaussian ring 3 mm high and 2 mm wide raised round the neck's axis at mid-front on a copy of f1's skin reads past the bound, at least 1.5 mm above the unedited skin.
 * 2. Every person of `HumanPeople`: nine anterior azimuths are read, and every one past the bound is listed by person, azimuth, station and point.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person's bind skin and cuts the shoulder, neck and lower head chains by half-planes through the neck's axis (neck joint to head joint) every 10 degrees from -40 to 40 degrees of azimuth, from 25 mm above the neck's base to half the way to the head joint, within 0.06 S of the axis, reading each outline's sharpest turn over a 10 mm chord at 1 mm resampling. It catches waves under the chin, a step at the seam between the neck and the head's chains, and a ring printed round the throat.
 * @evidence contracts/testing.md#independent-expectations The bound is the crease definition (`HumanAnatomyShared.CREASE`): the front of the neck from above the jugular notch to below the cervicomental angle runs over the sternocleidomastoids, the infrahyoid muscles and the larynx in broad convex turns, the thyroid prominence among them, with no crease at rest in a young adult (Gray 1918); the notch below 25 mm and the cervicomental angle above half the neck are not read. Proven red on f1 by a 3 mm, 2 mm-wide Gaussian ring. Oracle limits: the neck's length comes from the rig's neck and head joints; transverse neck lines with age are not modelled.
 * @evidence contracts/testing.md#distinguishing-cases The core set's ten people, thin and thick necks, feminine and masculine throats. The neck's girth profile and its creases belong to `test_human_anatomy_trunk`; its base to `test_human_curves_step_neck_base`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curves_rib_neck_front`, generating each person's bind skin in process on the CPU with no renderer, browser or GPU.
 */
export function test_human_curves_rib_neck_front(): void {
  assertHumanCurveKinks(HumanCurveKinkRegions.NECK_FRONT);
}
