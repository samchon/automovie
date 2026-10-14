import type { AutoMovieProductionFrameCapture } from "@automovie/interface";

import type { IAutoMovieProductionContextOptions } from "./IAutoMovieProductionContextOptions";

/**
 * Capture named context dependencies or the supported positional constructor.
 *
 * A capture is callable, so it is disjoint from the named option record.
 * Undefined preserves the positional constructor's omitted capture. Copying
 * the record captures the host's choices without letting a later property
 * reassignment change the context; nested instruments and callbacks retain
 * their intended identities. Root and namespace admission remain with the
 * context constructor rather than being repeated here.
 *
 * @evidence contracts/common.md#principled-implementation Callable input is the legacy capture arm and undefined preserves omitted positional capture; an object selects the named options arm. Shallow copying fixes property assignments while retaining nested instrument/callback identity.
 * @evidence contracts/common.md#clear-and-simple-design AutoMovieProductionContext's overloads share one option normalization owner; project root and namespace admission remain with actual opening.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Named options do not accidentally inherit legacy positional choices, and no capture, evidence reader or archetype registry is inferred when omitted.
 * @evidence contracts/common.md#meaningful-documentation States disjoint input shapes, omitted capture, shallow-copy effect and retained nested identity.
 * @evidence contracts/performance.md#efficient-algorithms Input selection and copying visit the option record's enumerable property population, with shallow space proportional to that fixed supported dependency record; no project or artifact scan occurs.
 * @evidence contracts/performance.md#reuse-equivalent-work The resulting context reuses supplied nested capability identities, while property reassignment on the caller's original options cannot change captured choices; this normalizer caches no output.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned record transfers dependency references to the context, whose lifetime controls retention; this operation opens no handle or task and performs no instrument disposal.
 */
export function resolveAutoMovieProductionContextOptions(props: {
  input:
    | IAutoMovieProductionContextOptions
    | AutoMovieProductionFrameCapture
    | undefined;
  legacy: Omit<IAutoMovieProductionContextOptions, "capture">;
}): IAutoMovieProductionContextOptions {
  return typeof props.input === "function" || props.input === undefined
    ? { ...props.legacy, capture: props.input }
    : { ...props.input };
}
