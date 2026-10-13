/** One frame-normalized video segment in the canonical film timeline. */
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
    | { kind: "cut" }
    | { kind: "dissolve" | "fade"; durationFrames: number };

  /** Normalized outgoing transition. */
  transitionOut:
    | { kind: "cut" }
    | { kind: "dissolve" | "fade"; durationFrames: number };
}
