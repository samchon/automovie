import { IAutoMovieMesh } from "@automovie/interface";

import { attachPortraitOralMesh } from "../mouth/attachPortraitOralMesh";
import { IPortraitDentalAttachment } from "./structures/IPortraitDentalAttachment";

/**
 * Apply one orthonormal frame to every vertex and normal of the dental group.
 *
 * @evidence contracts/common.md#principled-implementation It renames the group's upper-lip midpoint to the oral attachment's origin and delegates, so the row is placed by the same rigid frame as the tongue and lower enamel.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or fixture is named; it forwards to the shared transform.
 * @evidence contracts/common.md#meaningful-documentation The comment states that one orthonormal frame is applied to every vertex and normal.
 * @evidence contracts/modeling.md#spatial-conventions Input positions are local millimetres and outputs are head millimetres, converted by the shared attachment.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function delegates a transform and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidence contracts/modeling.md#shared-boundaries The row shares one frame definition with the tongue and the lower enamel through `attachPortraitOralMesh`, so the three interiors cannot be placed under different frames.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input shapes a form through this function.
 */
export function attachPortraitDentalRow(
  input: IAutoMovieMesh,
  attachment: IPortraitDentalAttachment,
): IAutoMovieMesh {
  const { upperLipMiddle, ...frame } = attachment;
  return attachPortraitOralMesh(input, { ...frame, origin: upperLipMiddle });
}
