import { attachPortraitOralMesh } from "../mouth/attachPortraitOralMesh";
import { IPortraitDentalAttachment } from "./structures/IPortraitDentalAttachment";
import { IAutoMovieMesh } from "@automovie/interface";

/**
 * Apply one orthonormal frame to every vertex and normal of the dental group.
 */
export function attachPortraitDentalRow(
  input: IAutoMovieMesh,
  attachment: IPortraitDentalAttachment,
): IAutoMovieMesh {
  const { upperLipMiddle, ...frame } = attachment;
  return attachPortraitOralMesh(input, { ...frame, origin: upperLipMiddle });
}
