import type { IAutoMovieHumanFaceBasisSurface } from "../../../structures/IAutoMovieHumanFaceBasisSurface";
import type { IAutoMovieHumanFacePeriocularCage } from "../../../structures/IAutoMovieHumanFacePeriocularCage";
import type { IHumanFaceSkinHost } from "../../skin/IHumanFaceSkinHost";
import type { IHumanFaceOcularSurface } from "./IHumanFaceOcularSurface";

/** Current source incidence and reference resources for one shared posterior lid sheet.
 *
 *
 * @evidence contracts/common.md#principled-implementation Actual cage/native host/current points and their compiled skin/ocular readers share one source frame and incidence.
 * @evidence contracts/common.md#clear-and-simple-design The tissue builder supplies resources and the band owner compiles one posterior domain before offsets.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Side/upper/tissue identity are explicit and the analytic error is not a seating bonus.
 * @evidence contracts/common.md#meaningful-documentation Fields give head-frame metres, source ordinals, registered lid selection and diagnostic identity.
 * @evidenceExclude contracts/performance.md#efficient-algorithms IHumanFacePeriocularBandInput is an erased geometry/source contract; its concrete producer or reader owns actual algorithms and population traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work IHumanFacePeriocularBandInput declares correspondence only; its concrete owner decides geometry copies, shared readings and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources IHumanFacePeriocularBandInput acquires no runtime buffer, handle or task; concrete builders/readers own referenced arrays and optional callback retention.
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
