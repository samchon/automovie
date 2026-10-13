/**
 * The numerical preview members persisted in the cache: the model and its
 * numerical readings. Display and photograph data are not members, so they
 * cannot reach the disk through this projection.
 *
 * @evidence contracts/common.md#principled-implementation An explicit member list keeps display metadata out of persistence.
 * @evidence contracts/common.md#meaningful-documentation Names every persisted member.
 *
 * @evidence contracts/common.md#clear-and-simple-design The projection lists numerical model and readings explicitly instead of persisting arbitrary result members.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Display state and photographs have no fields in the disk projection, and construction is not converted into preview.
 *
 * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity An explicit member list keeps display metadata out of persistence.
 * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Display state and photographs have no fields in the disk projection, and construction is not converted into preview.
 *
 * @author Samchon
 */
export interface IHumanViewerPreviewProjection {
  /**
   * Always `preview` for a cached result.
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Retains preview operation identity at the persisted projection boundary rather than converting construction into preview.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Retains preview operation identity at the persisted projection boundary rather than converting construction into preview.
   */
  operation: string;

  /**
   * The numerical model.
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Persists only the original numerical model, keeping canvas and photograph data outside cache storage.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Persists only the original numerical model, keeping canvas and photograph data outside cache storage.
   */
  model?: unknown;

  /**
   * Face articulation reading.
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Retains optional Face articulation readings from the original numerical preview.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Retains optional Face articulation readings from the original numerical preview.
   */
  articulation?: unknown;

  /**
   * Face contact reading.
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Retains optional Face contact readings without deriving them from rendered pixels.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Retains optional Face contact readings without deriving them from rendered pixels.
   */
  contact?: unknown;

  /**
   * Surface crossing reading.
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Retains optional original surface-crossing observations independently of visual acceptance.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Retains optional original surface-crossing observations independently of visual acceptance.
   */
  crossings?: unknown;

  /**
   * Body extras (bones and readings).
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Retains optional Body numerical bones and readings rather than display-only objects.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Retains optional Body numerical bones and readings rather than display-only objects.
   */
  extras?: unknown;

  /**
   * Body anatomy reading.
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Retains optional original Body anatomy readings without a viewer-produced anatomical judgement.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Retains optional original Body anatomy readings without a viewer-produced anatomical judgement.
   */
  anatomy?: unknown;
}
