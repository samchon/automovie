/** One half-open frame-normalized video segment in the canonical film timeline. */
export interface IAutoMovieFilmTimelineSegment {
  /** Current compiled shot id. */
  shot: string;

  /** Inclusive source frame. */
  sourceInFrame: number;

  /** Exclusive source frame. */
  sourceOutFrame: number;

  /** Film-global inclusive start frame. */
  startFrame: number;

  /** Film-global exclusive end frame. */
  endFrame: number;

  /** Available incoming handle frames. */
  headHandleFrames: number;

  /** Available outgoing handle frames. */
  tailHandleFrames: number;

  /** Normalized incoming transition. */
  transitionIn:
    | {
        /** Zero-duration boundary. */
        kind: "cut";
      }
    | {
        /** Overlap or in-segment fade, respectively. */
        kind: "dissolve" | "fade";

        /** Admitted transition length in production frames. */
        durationFrames: number;
      };

  /** Normalized outgoing transition. */
  transitionOut:
    | {
        /** Zero-duration boundary. */
        kind: "cut";
      }
    | {
        /** Overlap or in-segment fade, respectively. */
        kind: "dissolve" | "fade";

        /** Admitted transition length in production frames. */
        durationFrames: number;
      };
}
