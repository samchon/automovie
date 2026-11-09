import type { IAutoMovieClip } from "@automovie/interface";

import type { AutoMovieExternalMotionAdoptionDecision } from "./AutoMovieExternalMotionAdoptionDecision";
import type { IAutoMovieExternalMotionNativeHandoff } from "./IAutoMovieExternalMotionNativeHandoff";
import type { IAutoMovieExternalMotionRetargetHandoff } from "./IAutoMovieExternalMotionRetargetHandoff";
import type { IAutoMovieExternalMotionSource } from "./IAutoMovieExternalMotionSource";

/**
 * Receipt connecting one byte-pinned take to native playback or a later engine retarget pass. It copies everything it holds, so mutating it never changes the inspection or the decision it came from.
 *
 * @evidence contracts/development/design.md#principled-representation The receipt pairs the byte identity with a deep copy of the chosen take and its handoff, so later stages work from a snapshot that mutation of the inspection or decision cannot alter.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer repeats `handoff.mode` as top-level `mode` for inventory branching; the independent union fields do not statically correlate, so manually supplied receipts need admission.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The producer copies the selected take and declared decision fields after its mapped-basis checks; the type does not certify every unmapped rig field or authenticate externally constructed receipts.
 * @evidence contracts/development/common.md#meaningful-documentation The comments state that every member is a copy, that the take keeps source track order, and which consumer each handoff arm feeds.
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
