import {
  AUTOMOVIE_LIP_SYNC,
  measureAutoMovieLipSyncLag,
  productionDialogueFrameLevels,
} from "@automovie/engine";
import type {
  IAutoMovieDialogueLipSync,
  IAutoMovieDialogueMouthTrack,
  IAutoMovieDrawnMouth,
  IAutoMovieMixFilmSound,
  IAutoMovieProductionSoundPlan,
} from "@automovie/interface";

import { autoMovieVisemeChannelWeights } from "../scene/autoMovieVisemeChannelWeights.js";

/**
 * Measure each adopted line's lip-sync lag from the mouth the drawn figures
 * showed on each frame, without reading pixels.
 *
 * `drawn[f]` holds what the actors' bound figures showed at output frame `f`,
 * as the draw page records it after placing that frame
 * (`AutoMovieDialogueMouthStage`). A line missing from the track binds to no
 * single actor and is `speaker-not-bound`; a line without phoneme chunks is
 * `envelope-jaw`. For a phoneme-driven line, the window is its speech span
 * widened by `ceil(0.25 × fps)` frames on each side and clipped to the film.
 * When a figure of the actor showed visemes on a frame of the span, the mouth
 * series is, per window frame, the `jawOpen` channel weight those visemes give
 * a VRM or imported model (`autoMovieVisemeChannelWeights`), 0 on a frame where
 * none showed, and the level series is the line's frame level
 * (`productionDialogueFrameLevels`), 0 outside the span;
 * `measureAutoMovieLipSyncLag` names the lag and the verdict. When the actor's
 * figures showed only a jaw, the figure follows the line's own loudness, as the
 * Human and the polygon man do until #3185 resolves viseme shapes, and the line
 * is `envelope-jaw`. When no figure showed the mouth, because the actor has no
 * figure bound under its node or the figure has no part to show it on, the line
 * is `mouth-not-drawn`.
 *
 * @param props The adopted lines, the mouth track handed to the page, the
 *   plan's clock and frame count, and the mouths shown on each drawn frame.
 * @returns One entry per line, in list order.
 */
export function measureAutoMovieDialogueLipSync(props: {
  /** The adopted lines with their receipts and 48 kHz samples. */
  lines: readonly IAutoMovieMixFilmSound.ILine[];

  /** The mouth track the page was handed. */
  track: IAutoMovieDialogueMouthTrack;

  /** The film clock at 48 kHz and its frame count. */
  plan: Pick<
    IAutoMovieProductionSoundPlan,
    "fps" | "frameRate" | "sampleRate" | "totalFrames"
  >;

  /**
   * The mouths the figures showed at each output frame, by frame index; absent
   * where the page handed no mouths.
   */
  drawn: readonly (readonly IAutoMovieDrawnMouth[] | undefined)[];
}): IAutoMovieDialogueLipSync[] {
  const fps: number = props.track.fps;
  const reach: number = Math.ceil(AUTOMOVIE_LIP_SYNC.windowSeconds * fps);
  const read: (
    frame: number,
    actor: string,
  ) => IAutoMovieDrawnMouth | undefined = (
    frame: number,
    actor: string,
  ): IAutoMovieDrawnMouth | undefined =>
    props.drawn[frame]?.find(
      (mouth: IAutoMovieDrawnMouth): boolean => mouth.actor === actor,
    );
  return props.lines.map(
    (entry: IAutoMovieMixFilmSound.ILine): IAutoMovieDialogueLipSync => {
      const planned: IAutoMovieDialogueMouthTrack.ILine | undefined =
        props.track.lines.find(
          (line: IAutoMovieDialogueMouthTrack.ILine): boolean =>
            line.line === entry.line.id,
        );
      if (planned === undefined)
        return {
          line: entry.line.id,
          actor: null,
          status: "unmeasured",
          reason: "speaker-not-bound",
        };
      if (planned.ranges === null)
        return unmeasured(entry, planned, "envelope-jaw");

      // How the actor's figures showed the mouth during the line.
      let visemes: boolean = false;
      let jaw: boolean = false;
      for (
        let frame: number = planned.startFrame;
        frame < planned.endFrame;
        ++frame
      ) {
        const mouth: IAutoMovieDrawnMouth | undefined = read(
          frame,
          planned.actor,
        );
        visemes ||= mouth?.visemes !== undefined;
        jaw ||= mouth?.jaw !== undefined;
      }
      if (!visemes)
        return unmeasured(
          entry,
          planned,
          jaw ? "envelope-jaw" : "mouth-not-drawn",
        );

      const first: number = Math.max(0, planned.startFrame - reach);
      const last: number = Math.min(
        props.plan.totalFrames,
        planned.endFrame + reach,
      );
      const levels: Float64Array = productionDialogueFrameLevels(
        props.plan,
        entry.line,
        entry.samples,
      );
      const mouth: number[] = [];
      const level: number[] = [];
      for (let frame: number = first; frame < last; ++frame) {
        const weights: IAutoMovieDrawnMouth["visemes"] = read(
          frame,
          planned.actor,
        )?.visemes;
        mouth.push(
          weights === undefined
            ? 0
            : (autoMovieVisemeChannelWeights(weights).get("jawOpen") ?? 0),
        );
        level.push(levels[frame - entry.line.startFrame] ?? 0);
      }
      return {
        line: entry.line.id,
        actor: planned.actor,
        status: "measured",
        ...measureAutoMovieLipSyncLag({ mouth, level, fps }),
      };
    },
  );
}

/** The entry of a line bound to an actor but not measured. */
const unmeasured: (
  entry: IAutoMovieMixFilmSound.ILine,
  planned: IAutoMovieDialogueMouthTrack.ILine,
  reason: "envelope-jaw" | "mouth-not-drawn",
) => IAutoMovieDialogueLipSync = (
  entry: IAutoMovieMixFilmSound.ILine,
  planned: IAutoMovieDialogueMouthTrack.ILine,
  reason: "envelope-jaw" | "mouth-not-drawn",
): IAutoMovieDialogueLipSync => ({
  line: entry.line.id,
  actor: planned.actor,
  status: "unmeasured",
  reason,
});
