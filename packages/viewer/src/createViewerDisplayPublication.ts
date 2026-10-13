/**
 * Stage an original completed snapshot without publishing its generation.
 * The caller's copy port owns one latest bitmap and leaves it intact on a
 * refused copy. Commit admits that prepared snapshot, or copies a direct
 * active display; only then may the start port encode/upload it. Disposal
 * releases the caller's pending bitmap and forbids further publication.
 * The active query reports lifecycle availability, including uncommitted
 * staging; it does not assert an admitted display or completed filesystem IO.
 *
 * @evidence contracts/common.md#principled-implementation Candidate snapshot and admitted generation are separate transitions, so a rejected candidate cannot supersede its retained predecessor's saves.
 * @evidence contracts/common.md#clear-and-simple-design One lifecycle operates the existing bitmap owner's copy/start/release ports without a second queue.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No server ordering exception or fabricated frame bypasses parent activation.
 * @evidence contracts/common.md#meaningful-documentation Defines copy refusal, direct commitment, staged activation and disposal effects.
 */
export function createViewerDisplayPublication(props: {
  copy: () => boolean;
  start: (session: string, generation: number) => void;
  release: () => void;
}) {
  let identity: { session: string; generation: number } | undefined;
  let prepared = false;
  let disposed = false;
  return {
    active: (): boolean => !disposed,
    prepare: (): boolean => {
      if (disposed || identity !== undefined) return false;
      const copied = props.copy();
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
