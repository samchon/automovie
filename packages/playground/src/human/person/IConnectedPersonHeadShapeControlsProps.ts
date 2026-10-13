import type { IAutoMovieHumanPersonHeadShapeSource } from "@automovie/human/human/structures/IAutoMovieHumanPersonHeadShapeSource";

import type { IConnectedPersonEyeControlsProps } from "./IConnectedPersonEyeControlsProps";

/**
 * Source registration and the existing whole-person transaction for head traits.
 * Omitted registration declares unavailable controls, never inferred endpoints.
 *
 * @author Samchon
 */
export interface IConnectedPersonHeadShapeControlsProps extends IConnectedPersonEyeControlsProps {
  /** Exact head-view source registration; omission supplies no trait support. */
  source?: IAutoMovieHumanPersonHeadShapeSource;
}
