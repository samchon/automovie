import type { IHumanViewerAdmission } from "./IHumanViewerAdmission.js";

/**
 * An admission state recorded for one document at the cache key it was
 * asked for; a different key makes it outdated.
 *
 * @evidence contracts/common.md#principled-implementation A record applies only to the exact key it was made for.
 * @evidence contracts/common.md#meaningful-documentation Names both members.
 *
 * @evidence contracts/common.md#clear-and-simple-design The admission envelope is paired with the exact cache key under which its owner answered.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A verdict for another basis or builder source is not reused merely because the document id stayed the same.
 *
 * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity A record applies only to the exact key it was made for.
 * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation A verdict for another basis or builder source is not reused merely because the document id stayed the same.
 *
 * @author Samchon
 */
export interface IHumanViewerKeyedAdmission {
  /**
   * The cache key the document had when it was asked.
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Binds a stored verdict or waiting cause to the exact document/basis/producer cache identity.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Binds a stored verdict or waiting cause to the exact document/basis/producer cache identity.
   */
  key: string;

  /**
   * The owner's verdict, or the pending state with why it waits.
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Keeps the owner's actual judgement separate from key equality and transport availability.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Keeps the owner's actual judgement separate from key equality and transport availability.
   */
  admission: IHumanViewerAdmission;
}
