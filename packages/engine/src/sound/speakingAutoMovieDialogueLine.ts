import type { IAutoMovieDialogueMouthTrack } from "@automovie/interface";

/**
 * The line an actor speaks at a film second, or null while the actor speaks
 * none.
 *
 * The second's frame is `seconds × fps`, taken as the whole frame holding it; a
 * frame within 1e-6 below a whole frame counts as that frame, so `f / fps ×
 * fps` that lands a hair below `f` in double precision still selects frame `f`,
 * while every shutter sample's offset lies far above that tolerance. The line
 * is the actor's whose speech span `[startFrame, endFrame)` holds the frame;
 * where two hold it, the later-starting one, because a new line takes the mouth
 * from its start.
 *
 * @param track The film's mouth track.
 * @param actor The actor whose mouth is read.
 * @param seconds A finite film second.
 * @returns The speaking line and the whole frame, or null outside every line of
 *   the actor.
 */
export function speakingAutoMovieDialogueLine(
  track: IAutoMovieDialogueMouthTrack,
  actor: string,
  seconds: number,
): { line: IAutoMovieDialogueMouthTrack.ILine; frame: number } | null {
  const frame: number = Math.floor(seconds * track.fps + FRAME_TOLERANCE);
  let speaking: IAutoMovieDialogueMouthTrack.ILine | null = null;
  for (const line of track.lines)
    if (
      line.actor === actor &&
      frame >= line.startFrame &&
      frame < line.endFrame &&
      (speaking === null || line.startFrame >= speaking.startFrame)
    )
      speaking = line;
  return speaking === null ? null : { line: speaking, frame };
}

/**
 * Frames within this distance below a whole frame count as that frame: far
 * above the rounding of `f / fps × fps` in double precision and far below any
 * shutter sample's offset.
 */
const FRAME_TOLERANCE: number = 1e-6;
