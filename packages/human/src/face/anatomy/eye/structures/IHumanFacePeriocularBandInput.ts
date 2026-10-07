import type { IAutoMovieHumanFaceBasisSurface } from "../../../structures/IAutoMovieHumanFaceBasisSurface";
import type { IAutoMovieHumanFacePeriocularCage } from "../../../structures/IAutoMovieHumanFacePeriocularCage";
import type { IHumanFaceSkinHost } from "../../skin/IHumanFaceSkinHost";
import type { IHumanFaceOcularSurface } from "./IHumanFaceOcularSurface";

/** Current source incidence and reference resources for one shared posterior lid sheet.
 *
 *
 * @evidence contracts/common.md#principled-implementation The current source incidence and geometric resources consumed together to construct one shared posterior lid reference sheet.
 * @evidence contracts/common.md#clear-and-simple-design Named members keep the represented quantities and their correspondence in one result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries actual represented data without a clinical default, hidden tolerance or replacement geometry.
 * @evidence contracts/common.md#meaningful-documentation Member documentation preserves the numerical meaning, units and ownership required by the consumer.
 *
 * @author Samchon
 */
export interface IHumanFacePeriocularBandInput {
  /** Source-owned station and material-incidence registration for this lid. */
  cage: IAutoMovieHumanFacePeriocularCage;
  /** Native source skin surface whose ordinals the cage addresses. */
  host: IAutoMovieHumanFaceBasisSurface;
  /** Current host positions in source head-frame metres, aligned with native ordinals. */
  points: readonly number[];
  /** Geometric host compiled from these same current native triangles and positions. */
  skinHost: IHumanFaceSkinHost;
  /** Current analytic ocular exterior; numerical deviation is not a seating bonus. */
  surface: IHumanFaceOcularSurface;
  /** Selects the registered upper station rows when true and lower rows otherwise. */
  upper: boolean;
  /** Anatomical side retained independently of coordinate-sign inference. */
  side: "left" | "right";
  /** Requesting tissue identity used in source-support refusal diagnostics. */
  tissue: string;
}
