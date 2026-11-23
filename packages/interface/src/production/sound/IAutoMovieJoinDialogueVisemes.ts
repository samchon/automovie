import type { IAutoMovieProductionDialogueLine } from "../IAutoMovieProductionDialogueLine";
import type { IAutoMovieProductionViseme } from "../IAutoMovieProductionViseme";
import type { IAutoMovieDialogueSpeakerBinding } from "./IAutoMovieDialogueSpeakerBinding";

/** Data and callback contracts shared by the JoinDialogueVisemes operations. */
export namespace IAutoMovieJoinDialogueVisemes {
  /**
   * Join supplied receipt visemes to one explicit actor binding on emission
   * time.
   *
   * A missing speaker, absent binding or multiple matching bindings returns a
   * not-run outcome with no timeline. A selected binding needs a nonblank
   * actor; the line and each viseme need ordered positive-duration safe-integer
   * frame intervals. Empty timing, unsupported mouth targets, overlaps and
   * intervals outside the line throw. Gaps become explicit rest intervals
   * without sorting. The result owns new range records and borrows no input
   * records. Receipt-byte provenance and actor existence are caller premises;
   * this join applies no expression to a scene actor.
   */
  export type IProps = {
    /**
     * Borrowed dialogue line whose half-open film-frame range is authoritative;
     * no speaker yields speaker-not-declared.
     */
    line: IAutoMovieProductionDialogueLine;
    /**
     * Borrowed speaker-to-actor bindings in authored order; exactly one speaker
     * match is required for an available timeline.
     */
    bindings: readonly IAutoMovieDialogueSpeakerBinding[];
    /**
     * Borrowed final-byte receipt visemes in emission-frame order; nonempty,
     * nonoverlapping and wholly within the line. Receipt provenance is a caller
     * premise.
     */
    visemes: readonly IAutoMovieProductionViseme[];
  };
}
