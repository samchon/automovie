import type { AutoMovieProductionFrameCapture } from "@automovie/interface";

import type { IAutoMovieProductionContextOptions } from "./IAutoMovieProductionContextOptions";

/**
 * Capture named context dependencies or the supported positional constructor.
 *
 * Typed capture input is callable and selects the legacy arm; undefined preserves omitted positional capture. A named options object selects a shallow copy without borrowing positional defaults. Subsequent property reassignment on the original record cannot replace captured choices, while nested instruments and callbacks retain their shared identities. Root and namespace admission remain with the context constructor; this helper performs no unknown-input schema admission.
 *
 * @evidence contracts/common.md#principled-implementation Callable input is the legacy capture arm and undefined preserves omitted positional capture; an object selects the named options arm. Shallow copying fixes property assignments while retaining nested instrument/callback identity.
 * @evidence contracts/common.md#clear-and-simple-design AutoMovieProductionContext's overloads share one option normalization owner; project root and namespace admission remain with actual opening.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Named options do not accidentally inherit legacy positional choices, and no capture, evidence reader or archetype registry is inferred when omitted.
 * @evidence contracts/common.md#meaningful-documentation States disjoint input shapes, omitted capture, shallow-copy effect and retained nested identity.
 * @evidence contracts/performance.md#efficient-algorithms Selection is fixed local branching, followed by copying the chosen record's enumerable own properties, including any runtime extras. Work/storage follows that property population and getter effects; no project or artifact scan occurs.
 * @evidence contracts/performance.md#reuse-equivalent-work The resulting context reuses supplied nested capability identities, while property reassignment on the caller's original options cannot change captured choices; this normalizer caches no output.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned record transfers dependency references to the context, whose lifetime controls retention; this operation opens no handle or task and performs no instrument disposal.
 */
export function resolveAutoMovieProductionContextOptions(props: {
  /** Named dependency record, legacy callable capture, or omitted positional capture. */
  input:
    | IAutoMovieProductionContextOptions
    | AutoMovieProductionFrameCapture
    | undefined;

  /** Positional dependencies used only by the callable/undefined input arm. */
  legacy: Omit<IAutoMovieProductionContextOptions, "capture">;
}): IAutoMovieProductionContextOptions {
  return typeof props.input === "function" || props.input === undefined
    ? { ...props.legacy, capture: props.input }
    : { ...props.input };
}
