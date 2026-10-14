import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyAnatomicalMeasurements } from "./measurements/IAutoMovieHumanBodyAnatomicalMeasurements";
import { collectHumanBodyExteriorRequests } from "./surface/collectHumanBodyExteriorRequests";
import { solveHumanBodyExteriorRequests } from "./surface/solveHumanBodyExteriorRequests";

/**
 * Turn a body document's admitted anatomical measurements into the channel weights that meet them on its shape.
 *
 * The bound surface targets (`collectHumanBodyExteriorRequests`) are solved together over the document's own weights (`solveHumanBodyExteriorRequests`), so the solved channels join the authored ones and every other weight is kept. Without anatomy the shape is returned as authored. The returned record is new; the caller's shape is not changed. Admission (`admitHumanBodyDocumentAnatomy`) has already refused unconsumable paths and a bound channel authored beside its measurement.
 *
 * @evidence contracts/common.md#principled-implementation Admitted surface measurements become ordered requests solved on a copy of the authored shape, preserving weights outside bound channels and propagating acquisition/inconsistency failures.
 * @evidence contracts/common.md#clear-and-simple-design This document-to-shape boundary delegates request collection and coupled numerical solving to their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It relies on prior anatomy admission and does not substitute external skin dimensions for internal anatomical parts or silently accept failed targets.
 * @evidence contracts/common.md#meaningful-documentation The prose gives admission premises, absent-anatomy behavior, caller-shape preservation and how solved channels join authored weights.
 * @evidence contracts/performance.md#efficient-algorithms Copying costs O(W) authored weights; anatomy collection scans the fixed binding table and the solver's repeated skin measurements dominate, including coupled finite-difference/Broyden fallback.
 * @evidence contracts/performance.md#reuse-equivalent-work All targets share the same supplied basis and authored shape; this entry adds no cross-request cache because basis, weights and targets decide equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Shape copies, requests and solver intermediates are call-local; the returned weights escape without retaining the borrowed basis or measurement readers.
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
