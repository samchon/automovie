/**
 * Stage an original completed snapshot without publishing its generation.
 * The caller's copy port owns one latest bitmap and leaves it intact on a
 * refused copy. Commit admits that prepared snapshot, or copies a direct
 * active display; only then may the start port encode/upload it. Disposal
 * releases the caller's pending bitmap and forbids further publication.
 * The active query reports lifecycle availability, including uncommitted
 * staging; it does not assert an admitted display or completed filesystem IO.
 *
 * @evidence contracts/common.md#principled-implementation Separates successful original bitmap copy from admitted session/generation and subsequent start; failed copy leaves prior identity/preparation intact, while disposal closes authority before releasing pending work. Caller supplies valid identity and transactional copy behavior; start failure occurs after identity commit and is not rolled back.
 * @evidence contracts/common.md#clear-and-simple-design One small publication state machine owns preparation/commit/change authority while caller ports own actual pixels, encoding/upload and pending bitmap release.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Admission is actual copy success rather than a quiet watcher or fixture generation; closed/precommit branches follow lifecycle meaning, with no replacement native methods or fabricated persisted-frame success.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes original staging, identity commitment, start side effects, active availability and completed filesystem IO; disposal and failed-copy obligations are explicit.
 * @evidence contracts/performance.md#efficient-algorithms Coordinator uses constant scalar state and one optional identity record; real copy/start costs remain accounted by the supplied ports and are not reduced by this wrapper.
 * @evidence contracts/performance.md#reuse-equivalent-work A successful prepare is reused by the next commit without another copy, while changed copies real current pixels under the committed identity; effectful repeated changes are not cached by identity alone.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Holds one identity and prepared/closed flags while the caller owns one pending bitmap; dispose marks closed and invokes release once. A release throw is not retried or memoized as a repeated failure by this primitive, so native bitmap release uncertainty remains with its caller port.
 */
export function createViewerDisplayPublication(props: {
  copy: () => boolean;
  start: (session: string, generation: number) => void;
  release: () => void;
}): { active: () => boolean; prepare: () => boolean; commit: (session: string, generation: number) => boolean; changed: () => boolean; dispose: () => void; } {
  let identity: { session: string; generation: number } | undefined;
  let prepared: boolean = false;
  let disposed: boolean = false;
  return {
    active: (): boolean => !disposed,
    prepare: (): boolean => {
      if (disposed || identity !== undefined) return false;
      const copied: boolean = props.copy();
      if (copied) prepared = true;
      return copied;
    },
    commit: (session: string, generation: number): boolean => {
      if (disposed) return false;
      if (!prepared && !props.copy()) return false;
      identity = { session, generation };
      prepared = false;
      props.start(session, generation);
      return true;
    },
    changed: (): boolean => {
      if (disposed || identity === undefined || !props.copy()) return false;
      props.start(identity.session, identity.generation);
      return true;
    },
    dispose: (): void => {
      if (disposed) return;
      disposed = true;
      props.release();
    },
  };
}
