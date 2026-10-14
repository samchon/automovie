import type { IAutoMovieExternalMotionConversionReceipt, IAutoMovieMotion } from "@automovie/interface";

/**
 * Conversion facts and normalized motion before generated output bytes are sealed.
 *
 * Generated materialization serializes candidate receipt bytes and adds the final actor performance's canonical motion and shot-byte identities; the project transaction publishes them later. A draft is neither that generated result nor a published receipt or authorization.
 *
 * @evidence contracts/common.md#principled-implementation Omit removes the generated result identity; motion holds accepted pre-enact input, while later sealing selects the compiled actor performance's actual motion and serialized shot bytes rather than hashing this draft motion as the enacted result.
 * @evidence contracts/common.md#clear-and-simple-design resolveExternalMotionClips produces the draft and materializeGeneratedFiles seals candidate identities, separating semantic conversion, generated serialization and project-owned physical publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A draft makes no physical-publication claim and usable warning findings are not manufactured semantic-loss approvals.
 * @evidence contracts/common.md#meaningful-documentation States pre-serialization status, normalized motion ownership and the missing result identity.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This type performs no conversion, hashing or serialization; its producer and materializer own those algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A draft describes one conversion and offers no reuse policy across changed source/target bases.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The build attempt owns draft motion and metadata until materialization or refusal; the declaration acquires no handle or task.
 * @author Samchon
 */
export interface IProductionExternalMotionConversionDraft extends Omit<
  IAutoMovieExternalMotionConversionReceipt,
  "result"
> {
  /** Accepted native or retargeted motion copied into the draft; final enacted result identity is sealed separately. */
  motion: IAutoMovieMotion;
}
