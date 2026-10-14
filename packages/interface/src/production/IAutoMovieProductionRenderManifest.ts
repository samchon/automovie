import { IAutoMovieProductionPublicationIdentity } from "./IAutoMovieProductionPublicationIdentity";
import { IAutoMovieProductionRenderedDeliverable } from "./IAutoMovieProductionRenderedDeliverable";

/**
 * Aggregate delivery ledger bound to one exact render-plan runtime and its materialized output claims.
 *
 * @evidence contracts/common.md#principled-implementation The aggregate manifest binds deliverable file identities to compile and recomputable publication identity; terminal publication probes supplied bytes and final validation compares the matching renderer receipt and current final plan.
 * @evidence contracts/common.md#clear-and-simple-design One ledger groups required and optional deliverables under a shared publication identity rather than giving each output an unrelated render generation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Stored claims alone cannot pass final delivery: missing receipts, stale compile or plan generations, byte changes and parser fact mismatches refuse.
 * @evidence contracts/common.md#meaningful-documentation Defines aggregate format, exact compile input, structured publication identity and the materialized deliverable population.
 * @author Samchon
 */
export interface IAutoMovieProductionRenderManifest {
  /** Aggregate manifest format. */
  version: 2;

  /** Exact builder input that produced every listed output. */
  compileFingerprint: string;

  /** Structured and self-verifying render-plan identity. */
  publication: IAutoMovieProductionPublicationIdentity;

  /** Materialized required and optional deliverables. */
  deliverables: IAutoMovieProductionRenderedDeliverable[];
}
