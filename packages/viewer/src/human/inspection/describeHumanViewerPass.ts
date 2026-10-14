import { getHumanObservationPassDefinition } from "@automovie/viewer/human/common/observation/getHumanObservationPassDefinition";

import type { HumanViewerAddress } from "./HumanViewerAddress.js";

/**
 * Return the product observation owner's actual reading limit for every frame. `flat` is lit grey faceted geometry. `albedo` is unlit authored base colour and alpha, with a named refusal for unsupported shaders. Structural passes may turn alpha cards into opaque surfaces and cannot identify them as tissue. The same definition constructs the display material and supplies its label, so HTTP metadata cannot describe a different rendering method.
 *
 * @evidence contracts/common.md#principled-implementation HTTP reading text comes from the same product pass definition that constructs observation materials, preserving its stated structural and albedo limits.
 * @evidence contracts/common.md#clear-and-simple-design One pass lookup forwards the canonical reading without a separate metadata table or shader interpretation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Structural alpha-card output is not relabeled anatomical tissue, and unsupported albedo shader refusal remains with the product pass owner.
 * @evidence contracts/common.md#meaningful-documentation Documentation differentiates flat/albedo readings and explains why canonical material and label definitions stay together.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A fixed pass-definition lookup performs no input-sized traversal or render processing.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared pass definition is the single canonical source for both material method and reading text; this adapter creates no redundant derived cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returning reading text acquires no material, texture, renderer or mutable observation state.
 */
export function describeHumanViewerPass(
  pass: HumanViewerAddress["pass"],
): string {
  return getHumanObservationPassDefinition(pass).reading;
}
