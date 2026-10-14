import { IAutoMovieMesh } from "@automovie/interface";

import { attachPortraitOralMesh } from "../mouth/attachPortraitOralMesh";
import { IPortraitDentalAttachment } from "./structures/IPortraitDentalAttachment";

/**
 * Apply one orthonormal frame to every vertex and normal of the dental group.
 *
 * @evidence contracts/common.md#principled-implementation The dental attachment's lip-midpoint origin and orthonormal chord/up frame rigidly transport every local vertex and normal through the shared oral owner.
 * @evidence contracts/common.md#clear-and-simple-design A small adapter renames upperLipMiddle to the general oral origin while leaving finite/independence admission and buffer transformation to attachPortraitOralMesh.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rigid placement does not change crown distances or reuse an independently fitted tooth frame; degenerate guides retain the delegated refusal.
 * @evidence contracts/common.md#meaningful-documentation The public description states one orthonormal frame for the complete dental group and its normals.
 * @evidence contracts/performance.md#efficient-algorithms Attachment performs O(V) coordinate/normal transport and copies the actual mesh buffers through the shared oral producer; the adapter adds fixed-size frame assembly.
 * @evidence contracts/performance.md#reuse-equivalent-work Dental rows reuse the same oral rigid-placement instrument rather than repeating projection or deriving per-tooth frames.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned mesh buffers are independently owned; attachment/frame temporaries expire and the input row is neither mutated nor retained.
 */
export function attachPortraitDentalRow(
  input: IAutoMovieMesh,
  attachment: IPortraitDentalAttachment,
): IAutoMovieMesh {
  const { upperLipMiddle, ...frame }: IPortraitDentalAttachment = attachment;
  return attachPortraitOralMesh(input, { ...frame, origin: upperLipMiddle });
}
