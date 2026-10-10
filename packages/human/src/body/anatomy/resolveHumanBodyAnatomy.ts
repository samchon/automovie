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
 * @author Samchon
 */
export function resolveHumanBodyAnatomy(
  basis: IAutoMovieHumanBodyBasis,
  shape: Readonly<Record<string, number>>,
  anatomy: IAutoMovieHumanBodyAnatomicalMeasurements | undefined,
): Record<string, number> {
  if (anatomy === undefined) return { ...shape };
  return solveHumanBodyExteriorRequests(
    basis,
    { ...shape },
    collectHumanBodyExteriorRequests(anatomy),
  );
}
