import { IAutoMovieMesh } from "@automovie/interface";

import { preparePortraitDentalCrown } from "./preparePortraitDentalCrown";
import { IPortraitDentalCrown } from "./structures/IPortraitDentalCrown";

/**
 * Build the standalone enamel mesh through the same native crown producer used
 * by dental rows. Existing callers retain the mesh-only API and owned buffers.
 *
 * @evidence contracts/common.md#principled-implementation The standalone enamel mesh comes from the same native loft producer and mesial-direction admission used by complete dental rows.
 * @evidence contracts/common.md#clear-and-simple-design A mesh-only compatibility adapter delegates construction and returns the prepared mesh while cervical correspondence remains available to native consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No second crown construction or expected-answer geometry substitutes for the canonical producer's dimensions/caps/normals.
 * @evidence contracts/common.md#meaningful-documentation The prose states standalone compatibility and fresh owned mesh buffers; the signature exposes the positive-default mesial direction.
 * @evidence contracts/performance.md#efficient-algorithms The native producer's fixed 32 angular columns and at-most-13 height levels bound crown generation; the adapter itself performs no additional mesh traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work Standalone and row builds reuse preparePortraitDentalCrown's geometry/cervical construction logic, with each invocation producing its own mesh.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned mesh survives; the unused preparation cycle and temporaries expire, with no cached crown or resource.
 */
export function buildPortraitDentalCrown(
  shape: IPortraitDentalCrown,
  mesialDirection: number = 1,
): IAutoMovieMesh {
  return preparePortraitDentalCrown(shape, mesialDirection).mesh;
}
