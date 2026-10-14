import type { IAutoMovieExternalMotionAdoption as IAutoMovieIngestExternalMotionAdoption } from "@automovie/ingest";
import type { IAutoMovieExternalMotionAdoption as IAutoMovieProductionExternalMotionAdoption, IAutoMovieExternalMotionBasis, IAutoMovieExternalMotionConversionReceipt, IAutoMovieExternalMotionTake, IAutoMovieMotion } from "@automovie/interface";

/**
 * Adopted normalized motion and the exact provenance facts used by conversion.
 *
 * Inventory admission establishes byte closure, inspected take, source basis and explicit authored actor/clip/mapping choices before the shot resolver performs native compatibility or humanoid retargeting.
 *
 * @evidence contracts/common.md#principled-implementation This input couples the normalized motion with the separately retained declaration and ingest handoff, preserving the byte-grounded basis and take needed to seal a later conversion receipt.
 * @evidence contracts/common.md#clear-and-simple-design productionAssetInventory constructs the adoption and resolveExternalMotionClips consumes it for one actor-bound shot; fixed input provenance stays separate from target conversion output.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record does not infer an actor, mapping, source rig or take from names, and its type does not itself prove byte admission.
 * @evidence contracts/common.md#meaningful-documentation States prior admission, normalized motion, authored decision and source provenance ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The type executes no ingestion or retarget algorithm; inventory and resolver own their costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A record defines no cross-attempt byte-equivalence or cached retarget answer.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The inventory/build attempt owns these referenced records and motion arrays; this declaration opens no handle or task.
 * @author Samchon
 */
export interface IProductionExternalMotionAdoption {
  /** The authored external-motion selection. */
  declaration: IAutoMovieProductionExternalMotionAdoption;

  /** The ingest result that validated the selected input. */
  receipt: IAutoMovieIngestExternalMotionAdoption;

  /** Files and content identities that comprise the external motion input. */
  sourceClosure: IAutoMovieExternalMotionConversionReceipt["source"]["closure"];

  /** Coordinate and unit conventions carried by the source motion. */
  sourceBasis: IAutoMovieExternalMotionBasis;

  /** The selected take within the imported motion input. */
  sourceTake: IAutoMovieExternalMotionTake;

  /** The normalized source motion before target-skeleton retargeting. */
  sourceMotion: IAutoMovieMotion;
}
