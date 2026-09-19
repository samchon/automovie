import { attachPortraitOralMesh } from "../mouth/attachPortraitOralMesh";
import { IPortraitDentalAttachment } from "./structures/IPortraitDentalAttachment";
import { IAutoMovieMesh } from "@automovie/interface";

/**
 * Apply one orthonormal frame to every vertex and normal of the dental group.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Attaches all crowns as one intact enamel group rather than repositioning individual teeth.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Orthogonalizes the dental frame, transforms resident positions and normals together, and refuses degenerate or nonfinite placement.
 */
export function attachPortraitDentalRow(
  input: IAutoMovieMesh,
  attachment: IPortraitDentalAttachment,
): IAutoMovieMesh {
  const { upperLipMiddle, ...frame } = attachment;
  return attachPortraitOralMesh(input, { ...frame, origin: upperLipMiddle });
}
