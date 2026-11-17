import type { IAutoMovieClip } from "../../core/IAutoMovieClip";
import type { IAutoMovieExternalModelInspection } from "../../model/import/IAutoMovieExternalModelInspection";

import type { IAutoMovieExternalMotionAdoptionDecision } from "./IAutoMovieExternalMotionAdoptionDecision";
import type { IAutoMovieExternalMotionNativeHandoff } from "./IAutoMovieExternalMotionNativeHandoff";
import type { IAutoMovieExternalMotionRetargetHandoff } from "./IAutoMovieExternalMotionRetargetHandoff";
import type { IAutoMovieExternalMotionSource } from "./IAutoMovieExternalMotionSource";

/**
 * Receipt connecting one byte-pinned take to native playback or a later engine retarget pass. It copies everything it holds, so mutating it never changes the inspection or the decision it came from.
 *
 * @evidence contracts/development/design.md#principled-representation The receipt pairs the byte identity with a deep copy of the chosen take and its handoff, so later stages work from a snapshot that mutation of the inspection or decision cannot alter.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The top-level mode correlates with the handoff arm for receipt inspection; the source identity and selected take occur once. Adoption tests consume these records; a receipt alone performs no native playback or retargeting.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The producer copies the selected take and declared decision fields after its mapped-basis checks; the type does not certify every unmapped rig field or authenticate externally constructed receipts.
 * @evidence contracts/development/common.md#meaningful-documentation The comments state that every member is a copy, that the take keeps source track order, and which consumer each handoff arm feeds.
 */
export type IAutoMovieExternalMotionAdoptionReceipt = {
  /** Copy of the source identity that was checked against the inspection. */
  source: IAutoMovieExternalMotionSource;

  /** Deep copy of the selected take with its tracks in source order. */
  take: IAutoMovieClip;

} & (
  | {
      /** The selected take remains on the declared source rig. */
      mode: "native";

      /** Copied native binding; conversion to executable motion remains a later operation. */
      handoff: IAutoMovieExternalMotionNativeHandoff;
    }
  | {
      /** The selected take requires an explicit later transfer to a target rig. */
      mode: "retarget";

      /** Copied source binding, validated scale and unresolved target identity. */
      handoff: IAutoMovieExternalMotionRetargetHandoff;
    }
);

/** Inputs whose validation produces a motion adoption receipt. */
export namespace IAutoMovieExternalMotionAdoptionReceipt {
  /**
   * One explicit decision against an unmodified resident-byte inspection.
   *
   * Adoption throws at the first failed source-identity, take, mapping, mapped
   * rest-basis or mode-field check. It verifies digest spelling, not byte hashing,
   * and it does not convert the clip or resolve a retarget destination.
   *
   * @evidence contracts/development/design.md#principled-representation Inspection, manifest identity and authored decision are separate premises; the producer validates their relationships and copies a receipt.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The operation consumes these three records without carrying shot/actor authoring metadata from the distinct production adoption contract.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The caller supplies source identity and rig mapping explicitly; no name guessing or implicit take selection occurs.
   * @evidence contracts/development/common.md#meaningful-documentation States borrowing, digest binding, admitted profile, first-refusal behavior and deferred conversion.
   */
  export interface IProps {
    /** Unmodified gltf-motion-v1 result for the exact source bytes, borrowed for this synchronous call. */
    inspection: IAutoMovieExternalModelInspection;

    /** Manifest identity; the caller must establish the digest-to-byte binding before inspection. */
    source: IAutoMovieExternalMotionSource;

    /** Explicit take, source rig and mapping; no fields receive defaults. Borrowed unchanged until adoption completes. */
    decision: IAutoMovieExternalMotionAdoptionDecision;
  }
}
