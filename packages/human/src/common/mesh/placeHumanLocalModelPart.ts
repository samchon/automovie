import type { IAutoMovieMesh, IAutoMovieModelPart } from "@automovie/interface";

import { createHumanLocalModelPart } from "./createHumanLocalModelPart";
import { placeMeshPreservingFaces } from "./placeMeshPreservingFaces";

/**
 * Carry an existing local part through an owner's source-frame placement.
 * Original TRS is consumed before the placement, then a previously local
 * publication receives one new compensating frame. Parts without a transform
 * remain unframed after placement. Consuming a pure translation leaves normals intact.
 *
 * @evidence contracts/common.md#principled-implementation Original TRS is consumed before the source-frame place callback; pure translation retains normals, other TRS uses canonical face preservation, and prior local publications receive one new compensating frame.
 * @evidence contracts/common.md#clear-and-simple-design Existing transform/frame owners keep math/admission while this coordinator preserves representation through placement order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Identity-linear translation is a real TRS distinction, without specimen branches, foreign method replacement or extra rendered surface.
 * @evidence contracts/common.md#meaningful-documentation The prose states original TRS consumption, placement order, absent-transform behavior and unchanged normals when consuming a translation.
 * @evidence contracts/performance.md#efficient-algorithms For V/T populations, coordinate mapping or canonical placement plus the callback owns its scans; re-publication adds frame checks/cloning rather than constant cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Original TRS is consumed once and canonical owners are reused; callback effects forbid sharing merely equal-looking placements.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Fresh placed/publication results transfer to callers; unchanged attributes remain borrowed and callback resources retain their own owner, without a new cache/task.
 */
export function placeHumanLocalModelPart(
  part: IAutoMovieModelPart,
  place: (mesh: IAutoMovieMesh) => IAutoMovieMesh,
): IAutoMovieModelPart {
  if (part.geometry.type !== "mesh")
    throw new Error("Local human placement requires a mesh part: " + part.id);
  let mesh: IAutoMovieMesh = part.geometry.mesh;
  const transform: IAutoMovieModelPart["transform"] = part.transform;
  if (transform !== null) {
    const translationOnly: boolean =
      transform.rotation.x === 0 &&
      transform.rotation.y === 0 &&
      transform.rotation.z === 0 &&
      transform.rotation.w === 1 &&
      transform.scale.x === 1 &&
      transform.scale.y === 1 &&
      transform.scale.z === 1;
    if (translationOnly) {
      const shift: number[] = [
        transform.translation.x,
        transform.translation.y,
        transform.translation.z,
      ];
      mesh = {
        ...mesh,
        positions: mesh.positions.map(
          (value: number, at: number): number => value + shift[at % 3],
        ),
      };
    } else mesh = placeMeshPreservingFaces(mesh, transform);
  }
  const placed: IAutoMovieModelPart = {
    ...part,
    geometry: { type: "mesh", mesh: place(mesh) },
    transform: null,
  };
  return transform === null ? placed : createHumanLocalModelPart(placed);
}
