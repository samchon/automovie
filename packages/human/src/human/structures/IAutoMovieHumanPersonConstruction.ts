import type { IAutoMovieHumanConstructionAdmission } from "../../common/structures/IAutoMovieHumanConstructionAdmission";
import type { IAutoMovieHumanPersonGenerationBuild } from "./IAutoMovieHumanPersonGenerationBuild";

/**
 * Complete same-source person model/body/bones/source context with combined admission and the original face-only admission kept separately. Resident/source/geometry checks still execute and can throw before any result. A completed rejected coarse construction is inspectable but the ordinary builder refuses it; explicit construction export may encode its actual geometry under exporter checks. Observational drafts, census and stage callbacks do not turn rejection into clinical or editor acceptance.
 *
 * @evidence contracts/common.md#principled-implementation Actual combined face/body-layer failures and unchanged face-only report remain attached to the same performed construction rather than inferred from a display label.
 * @evidence contracts/common.md#clear-and-simple-design Inherited generation output carries geometry/context while two canonical admission records separate person acceptance from original face census.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Inspectability or explicit draft export does not grant accepted ordinary output, and source/resident checks are not bypassed to manufacture a rejected result.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes thrown construction, completed rejection, face-only versus combined reports and inspection/export boundaries.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This result schema executes no construction or admission combination; existing geometry owners perform those operations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Runtime reuse of one accepted/rejected construction is concrete cache behavior rather than work performed by this carrier.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no renderer or source task; actual caller/build records own geometry, report and census lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonConstruction extends IAutoMovieHumanPersonGenerationBuild {
  /** Rejected coarse geometry remains inspectable and is never an accepted editor result. */
  admission: IAutoMovieHumanConstructionAdmission;

  /**
   * Original face-only admission and its own census before body-layer refusals enter combined person acceptance.
   */
  faceAdmission: IAutoMovieHumanConstructionAdmission;
}
