import type { IAutoMovieHumanPersonHeadShapeSource } from "@automovie/human/human/structures/IAutoMovieHumanPersonHeadShapeSource";

import type { IConnectedPersonEyeControlsProps } from "./IConnectedPersonEyeControlsProps";

/**
 * Source registration and the existing whole-person transaction for head traits.
 * Omitted registration declares unavailable controls, never inferred endpoints.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Supplies the registered anatomical traits whose numerical controls the person screen displays.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Carries source units and support into the existing person transaction without evaluating geometry.
 * @author Samchon
 */
export interface IConnectedPersonHeadShapeControlsProps extends IConnectedPersonEyeControlsProps {
  /** Exact head-view source registration; omission supplies no trait support. */
  source?: IAutoMovieHumanPersonHeadShapeSource;
}
