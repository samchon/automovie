import type { IAutoMovieHumanFaceLipMargin } from "@automovie/human/face/structures/IAutoMovieHumanFaceLipMargin";

/** Actual native contact registration and its source-authoring record.
 * @author Samchon
 */
export interface IHumanSourceLipMarginRegistration {
  /** Explicit native course representation, never a vertex approximation. */
  margin: IAutoMovieHumanFaceLipMargin;

  /** Published method/station/incidence qualification. */
  record: Record<string, unknown>;
}
