import type { IAutoMovieExternalMotionSource } from "./IAutoMovieExternalMotionSource";
import type { AutoMovieExternalMotionAdoptionDecision } from "./AutoMovieExternalMotionAdoptionDecision";
import type { IAutoMovieClip } from "@automovie/interface";
import type { IAutoMovieExternalMotionNativeHandoff } from "./IAutoMovieExternalMotionNativeHandoff";
import type { IAutoMovieExternalMotionRetargetHandoff } from "./IAutoMovieExternalMotionRetargetHandoff";

/**
 * Receipt connecting one byte-pinned take to native playback or a later engine retarget pass. It copies everything it holds, so mutating it never changes the inspection or the decision it came from.
 *
 * @evidence contracts/common.md#principled-implementation The receipt pairs the byte identity with a deep copy of the chosen take and its handoff, so later stages work from a snapshot that mutation of the inspection or decision cannot alter.
 * @evidence contracts/common.md#clear-and-simple-design `mode` repeats `handoff.mode` at the top level so the production inventory can branch on the receipt without opening the handoff.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The receipt adds no inferred data: every field is either a copy of a validated input or the selected inspected take.
 * @evidence contracts/common.md#meaningful-documentation The comments state that every member is a copy, that the take keeps source track order, and which consumer each handoff arm feeds.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The receipt is the result type of adoption and runs no code.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No work is attached to the receipt.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The receipt owns its copies and is retained by its caller; the cost of building it is counted on `adoptAutoMovieExternalMotion`.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionAdoption {
  /** Copy of the source identity that was checked against the inspection. */
  source: IAutoMovieExternalMotionSource;

  /** The decision's mode, repeated by `handoff.mode`. */
  mode: AutoMovieExternalMotionAdoptionDecision["mode"];

  /** Deep copy of the selected take with its tracks in source order. */
  take: IAutoMovieClip;

  /** Mode-specific inputs for the builder or the retarget pass. */
  handoff:
    | IAutoMovieExternalMotionNativeHandoff
    | IAutoMovieExternalMotionRetargetHandoff;
}
