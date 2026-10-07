import { getHumanObservationPassDefinition } from "@automovie/playground/src/human/common/observation/getHumanObservationPassDefinition.ts";

import type { HumanViewerAddress } from "./HumanViewerAddress";

/**
 * Return the product observation owner's actual reading limit for every frame.
 * `flat` is lit grey faceted geometry. `albedo` is unlit authored base colour
 * and alpha, with a named refusal for unsupported shaders. Structural passes
 * may turn alpha cards into opaque surfaces and cannot identify them as tissue.
 * The same definition constructs the display material and supplies its label,
 * so HTTP metadata cannot describe a different rendering method.
 *
 * @evidence contracts/common.md#principled-implementation Delegates to the material construction owner's current meaning rather than restating pass names.
 * @evidence contracts/common.md#clear-and-simple-design The product owns material parameters and reading limits; this adapter exposes that same result over HTTP.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No document or part is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the legacy flat meaning, the authored albedo scope and the structural alpha-card limit.
 */
export function describeHumanViewerPass(
  pass: HumanViewerAddress["pass"],
): string {
  return getHumanObservationPassDefinition(pass).reading;
}
