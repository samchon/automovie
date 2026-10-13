import type { IAutoMovieModel } from "@automovie/interface";

import type { ConnectedBodyPart } from "./ConnectedBodyPart";

/** Portable model metadata paired with transferable part geometry.
 * @author Samchon
 */
export interface ConnectedBodyModel extends Omit<IAutoMovieModel, "parts"> {
  /** Draw-order parts, each with its own transfer ownership. */
  parts: ConnectedBodyPart[];
}
