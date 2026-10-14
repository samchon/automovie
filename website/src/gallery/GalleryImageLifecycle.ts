/**
 * Own current image error authority and its listener release. Replacement and disposal invalidate the prior callback before invoking its release, independently of queued browser errors. Each release is attempted once; a failure remains reportable and prevents a new attachment from silently inheriting failed cleanup.
 *
 * Coordination is constant work plus the supplied attach/release effects. The owner retains one installed release closure and at most one arbitrary failure value until it is discarded; their captured bytes have no imposed bound. Generation identity governs callback authority, without sharing effectful attachment or disposal across images.
 *
 * @evidence contracts/common.md#principled-implementation Monotone generation identity retires queued prior-image callbacks before the previous release is attempted; native adapter attachment must return its listener release and manage any failure before that return.
 * @evidence contracts/common.md#clear-and-simple-design One owner coordinates current-image callback authority independently of controller navigation and native image construction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No delay or foreign error-handler replacement masks stale events; failed release remains observable and blocks a new attachment rather than silently retrying it.
 * @evidence contracts/common.md#meaningful-documentation The comments distinguish callback authority, release attempts, retained failures and native adapter responsibilities.
 * @evidence contracts/performance.md#efficient-algorithms Replacement/disposal coordination uses constant time and state plus the caller's actual attachment, cleanup and callback work.
 * @evidence contracts/performance.md#reuse-equivalent-work Only the current release closure and generation are reused; distinct image attachments are effectful and are not shared merely because URLs match.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Replacement or disposal clears the prior release before invoking it; one release closure and one arbitrary failure remain possible until owner discard, with no imposed captured-byte limit.
 */
export class GalleryImageLifecycle {
  /** Only callbacks bearing the current replacement identity may mutate content. */
  private generation: number = 0;

  /** Current native adapter release, replaced with an inert closure before invocation. */
  private release: () => void = (): void => {};

  /** One sticky release failure, including an undefined thrown value. */
  private releaseFailure: unknown[] = [];

  /**
   * Retire the prior image callback and release its listener, then let the adapter install the next image and current handler. If attachment throws before returning its release, that adapter owns any partial effects.
   *
   * @evidence contracts/common.md#principled-implementation Incrementing generation before release invalidates queued prior-image effects; the attachment closure may run effects only while its captured generation remains current.
   * @evidence contracts/common.md#clear-and-simple-design The adapter owns image construction while this owner controls callback currency and the returned listener release.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A failed previous release blocks attachment instead of silently retrying or inheriting uncertain cleanup.
   * @evidence contracts/common.md#meaningful-documentation The comment explains retirement-before-release ordering and partial attachment failure ownership.
   * @evidence contracts/performance.md#efficient-algorithms Generation and release coordination are constant plus adapter attachment/release work.
   * @evidence contracts/performance.md#reuse-equivalent-work One current release is replaced after each attachment; even matching image URLs do not share listener effects.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The old release is cleared before invocation and the new returned release remains until replacement/disposal; unreturned partial effects are not reachable here.
   */
  public replace(attach: (whenCurrent: (effect: () => void) => void) => (() => void)): void {
    const generation: number = ++this.generation;
    this.releaseCurrent();
    this.release = attach((effect: () => void): void => {
      if (this.generation === generation) effect();
    });
  }

  /**
   * Invalidate callbacks and attempt their release once; repeated calls report a retained failure without retrying it. This is not terminal closure: a later replacement can attach another image after successful disposal.
   *
   * @evidence contracts/common.md#principled-implementation Generation invalidation precedes releaseCurrent, whose cleared release and sticky failure preserve once-only attempts including an undefined thrown value.
   * @evidence contracts/common.md#clear-and-simple-design The same release owner serves replacement and disposal without introducing separate native image cleanup logic.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No stale callback remains authoritative and no failed cleanup is retried to manufacture success.
   * @evidence contracts/common.md#meaningful-documentation The comment states repeated failure behavior and explicitly distinguishes successful release from terminal owner closure.
   * @evidence contracts/performance.md#efficient-algorithms Fixed coordination adds only the actual current release callback's work.
   * @evidence contracts/performance.md#reuse-equivalent-work A saved failed release is reported by identity across calls; a successful cleared release becomes an inert callback rather than repeating native removal.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Current release authority clears before its attempt; one arbitrary failed value may remain until owner discard, without an imposed captured-byte bound.
   */
  public dispose(): void {
    this.generation++;
    this.releaseCurrent();
  }

  /** Retire one callback before executing it, retaining even an undefined thrown value. */
  private releaseCurrent(): void {
    if (this.releaseFailure.length !== 0) throw this.releaseFailure[0];
    const release: () => void = this.release;
    this.release = (): void => {};
    try { release(); }
    catch (error) {
      this.releaseFailure.push(error);
      throw error;
    }
  }
}
