import { IAutoMovieConstraintViolation } from "@automovie/interface";
/**
 * Supply a field-specific channel admission callback to clip artifact validation.
 *
 * @evidence contracts/common.md#principled-implementation The artifact validator narrows a channel record before calling the gate with its located path and shared violation array; field owners choose the targets their actual appliers can write.
 * @evidence contracts/common.md#clear-and-simple-design The callback parameter keeps channel policy with its field while the clip validator owns shared track and timing shape rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type does not enforce append-only behavior or callback purity; a supplied gate's mutation and exceptions remain observable instead of being hidden by a generic fallback.
 * @evidence contracts/common.md#meaningful-documentation Documents the narrowed record, path and borrowed collector, plus the field-specific effect boundary.
 * @evidence contracts/performance.md#efficient-algorithms The type has no runtime work; each gate is invoked per inspected channel and its traversal/allocations belong to that supplied implementation.
 * @evidence contracts/performance.md#reuse-equivalent-work A field's gate can be reused across clips, but effectful calls are executed independently and not cached from equal channel values.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The validator owns the passed collector and callers own the callable; this signature acquires no retained record, task or host handle.
 * @author Samchon
 */
export type IAutoMovieClipChannelGate = (
  channel: Record<string, unknown>,
  path: string,
  violations: IAutoMovieConstraintViolation[],
) => void;
