import type { IAutoMovieProductionDialogueLine } from "../IAutoMovieProductionDialogueLine";
import type { IAutoMovieProductionViseme } from "../IAutoMovieProductionViseme";
import type { IAutoMovieDialogueSpeakerBinding } from "./IAutoMovieDialogueSpeakerBinding";

/** Data and callback contracts shared by the JoinDialogueVisemes operations. */
export namespace IAutoMovieJoinDialogueVisemes {
  /**
   * Join supplied receipt visemes to one explicit actor binding on emission time.
   */
  export type IProps = {
    /** Dialogue line whose film range is authoritative. */
    line: IAutoMovieProductionDialogueLine;
    /** Explicit speaker-to-actor bindings in authored order. */
    bindings: readonly IAutoMovieDialogueSpeakerBinding[];
    /** Final-byte receipt visemes for this line. */
    visemes: readonly IAutoMovieProductionViseme[];
  };
}
