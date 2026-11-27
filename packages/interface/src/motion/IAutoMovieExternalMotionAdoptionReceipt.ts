import type { IAutoMovieClip } from "../core/IAutoMovieClip";
import type { IAutoMovieExternalModelInspection } from "../model/IAutoMovieExternalModelInspection";
import type { IAutoMovieExternalMotionAdoptionDecision } from "./IAutoMovieExternalMotionAdoptionDecision";
import type { IAutoMovieExternalMotionNativeHandoff } from "./IAutoMovieExternalMotionNativeHandoff";
import type { IAutoMovieExternalMotionRetargetHandoff } from "./IAutoMovieExternalMotionRetargetHandoff";
import type { IAutoMovieExternalMotionSource } from "./IAutoMovieExternalMotionSource";

/**
 * Receipt connecting one byte-pinned take to native playback or a later engine
 * retarget pass. It copies everything it holds, so mutating it never changes
 * the inspection or the decision it came from.
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

      /**
       * Copied native binding; conversion to executable motion remains a later
       * operation.
       */
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
   * rest-basis or mode-field check. It verifies digest spelling, not byte
   * hashing, and it does not convert the clip or resolve a retarget
   * destination.
   */
  export interface IProps {
    /**
     * Unmodified gltf-motion-v1 result for the exact source bytes, borrowed for
     * this synchronous call.
     */
    inspection: IAutoMovieExternalModelInspection;

    /**
     * Manifest identity; the caller must establish the digest-to-byte binding
     * before inspection.
     */
    source: IAutoMovieExternalMotionSource;

    /**
     * Explicit take, source rig and mapping; no fields receive defaults.
     * Borrowed unchanged until adoption completes.
     */
    decision: IAutoMovieExternalMotionAdoptionDecision;
  }
}
