/**
 * One half-open frame-normalized video segment in the canonical film timeline.
 *
 * @evidence contracts/common.md#principled-implementation Pairs source and film-global half-open frame intervals so integer frame counts and trims remain exact; normalized transitions retain their admitted duration and available source handles.
 * @evidence contracts/common.md#clear-and-simple-design One record contains only the shot mapping and its two boundary transitions; shot content stays in the compiled shot and non-video placements stay in the timeline tracks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Cut has no duration and fade or dissolve carries an explicit frame count; the record does not fabricate missing source frames or substitute another shot.
 * @evidence contracts/common.md#meaningful-documentation States inclusive and exclusive source and film endpoints, handle units and the normalized transition fields.
 * @author Samchon
 */
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
