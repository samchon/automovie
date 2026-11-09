import { IAutoMovieConstraintViolation } from "@automovie/interface";

/**
 * Supply a field-specific channel admission callback to clip artifact validation.
 *
 * @evidence contracts/development/design.md#principled-representation The artifact validator narrows a channel record before calling the gate with its located path and shared violation array; field owners choose the targets their actual appliers can write.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The callback parameter keeps channel policy with its field while the clip validator owns shared track and timing shape rules.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The type does not enforce append-only behavior or callback purity; a supplied gate's mutation and exceptions remain observable instead of being hidden by a generic fallback.
 * @evidence contracts/development/common.md#meaningful-documentation Documents the narrowed record, path and borrowed collector, plus the field-specific effect boundary.
 */
export type IAutoMovieClipChannelGate = (
  channel: Record<string, unknown>,
  path: string,
  violations: IAutoMovieConstraintViolation[],
) => void;
