import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyAnatomicalMeasurements } from "./measurements/IAutoMovieHumanBodyAnatomicalMeasurements";
import { collectHumanBodyExteriorRequests } from "./surface/collectHumanBodyExteriorRequests";
import { solveHumanBodyExteriorRequests } from "./surface/solveHumanBodyExteriorRequests";

/**
 * Turn a body document's admitted anatomical measurements into the channel
 * weights that meet them on its shape.
 *
 * The bound surface targets (`collectHumanBodyExteriorRequests`) are solved
 * together over the document's own weights (`solveHumanBodyExteriorRequests`),
 * so the solved channels join the authored ones and every other weight is
 * kept. Without anatomy the shape is returned as authored. The returned
 * record is new; the caller's shape is not changed. Admission
 * (`admitHumanBodyDocumentAnatomy`) has already refused unconsumable paths and
 * a bound channel authored beside its measurement.
 *
 * @evidence contracts/common.md#principled-implementation The exterior request owners solve the document's measurements, so the editor, the builder and the exterior report share one solve.
 * @evidence contracts/common.md#clear-and-simple-design Collect, then solve over the authored weights.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No measurement is approximated by another channel; unmet targets refuse in the solver.
 * @evidence contracts/common.md#meaningful-documentation States what is solved, what is kept and the admission precondition.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It defines no part.
 * @evidence contracts/modeling.md#parameter-channels Named measurements set only their bound channels; authored weights are kept.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It returns weights, not geometry.
 * @evidence contracts/modeling.md#spatial-conventions Measurements are metres on the source-rest skin.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The builder owns the shared skin.
 * @evidenceExclude contracts/modeling.md#rendered-observation The builder's consumer renders the result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The rules own their definitions.
 * @evidence contracts/anatomy.md#permitted-range Channel reach and joint consistency refuse unsupported targets in the solver.
 * @evidence contracts/anatomy.md#parametric-authority Named anatomical measurements become private weights deterministically.
 * @author Samchon
 */
export function resolveHumanBodyAnatomy(
  basis: IAutoMovieHumanBodyBasis,
  shape: Readonly<Record<string, number>>,
  anatomy: IAutoMovieHumanBodyAnatomicalMeasurements | undefined,
): Record<string, number> {
  if (anatomy === undefined) return { ...shape };
  return solveHumanBodyExteriorRequests(basis, { ...shape }, collectHumanBodyExteriorRequests(anatomy));
}
