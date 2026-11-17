import type { IAutoMovieProductionDialogueLine } from "../IAutoMovieProductionDialogueLine";
import type { IAutoMovieProductionViseme } from "../IAutoMovieProductionViseme";
import type { IAutoMovieDialogueSpeakerBinding } from "./IAutoMovieDialogueSpeakerBinding";

/**
 * Data and callback contracts shared by the JoinDialogueVisemes operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Join supplied receipt visemes to one explicit actor binding on emission time. Member documentation states the supplied records, units and absence meanings used by joinAutoMovieDialogueVisemes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The join requires explicit actor binding and receipt intervals; it does not fabricate mouth timing from dialogue text or acoustic arrival delay.
 * @evidence contracts/development/design.md#principled-representation line owns the film-frame range, bindings supplies ordered speaker-to-actor identities and visemes carries final-byte receipt timing on emission time.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieJoinDialogueVisemes, used by joinAutoMovieDialogueVisemes. Its IProps members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export namespace IAutoMovieJoinDialogueVisemes {
  /**
   * Join supplied receipt visemes to one explicit actor binding on emission time.
   *
   * A missing speaker, absent binding or multiple matching bindings returns a
   * not-run outcome with no timeline. A selected binding needs a nonblank actor;
   * the line and each viseme need ordered positive-duration safe-integer frame
   * intervals. Empty timing, unsupported mouth targets, overlaps and intervals
   * outside the line throw. Gaps become explicit rest intervals without sorting.
   * The result owns new range records and borrows no input records. Receipt-byte
   * provenance and actor existence are caller premises; this join applies no
   * expression to a scene actor.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Join supplied receipt visemes to one explicit actor binding on emission time. Member documentation states the supplied records, units and absence meanings used by joinAutoMovieDialogueVisemes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The join requires explicit actor binding and receipt intervals; it does not fabricate mouth timing from dialogue text or acoustic arrival delay.
   * @evidence contracts/development/design.md#principled-representation line owns the film-frame range, bindings supplies ordered speaker-to-actor identities and visemes carries final-byte receipt timing on emission time.
   * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieJoinDialogueVisemes.IProps, used by joinAutoMovieDialogueVisemes. Its line, bindings, visemes members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
   */
  export type IProps = {
    /** Borrowed dialogue line whose half-open film-frame range is authoritative; no speaker yields speaker-not-declared. */
    line: IAutoMovieProductionDialogueLine;
    /** Borrowed speaker-to-actor bindings in authored order; exactly one speaker match is required for an available timeline. */
    bindings: readonly IAutoMovieDialogueSpeakerBinding[];
    /** Borrowed final-byte receipt visemes in emission-frame order; nonempty, nonoverlapping and wholly within the line. Receipt provenance is a caller premise. */
    visemes: readonly IAutoMovieProductionViseme[];
  };
}
