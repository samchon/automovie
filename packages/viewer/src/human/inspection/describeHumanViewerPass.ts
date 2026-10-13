import { getHumanObservationPassDefinition } from "@automovie/viewer/human/common/observation/getHumanObservationPassDefinition";

import type { HumanViewerAddress } from "./HumanViewerAddress.js";

/**
 * Return the product observation owner's actual reading limit for every frame.
 * `flat` is lit grey faceted geometry. `albedo` is unlit authored base colour
 * and alpha, with a named refusal for unsupported shaders. Structural passes
 * may turn alpha cards into opaque surfaces and cannot identify them as tissue.
 * The same definition constructs the display material and supplies its label,
 * so HTTP metadata cannot describe a different rendering method.
 */
export function describeHumanViewerPass(
  pass: HumanViewerAddress["pass"],
): string {
  return getHumanObservationPassDefinition(pass).reading;
}
