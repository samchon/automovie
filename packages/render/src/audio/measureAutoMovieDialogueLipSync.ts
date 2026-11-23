import {
  AUTOMOVIE_LIP_SYNC,
  joinAutoMovieDialogueVisemes,
  measureAutoMovieLipSyncLag,
  productionDialogueFrameLevels,
  productionPhonemesToVisemes,
  sampleAutoMovieDialogueVisemeWeights,
} from "@automovie/engine";
import type {
  IAutoMovieDialogueLipSync,
  IAutoMovieDialogueSpeakerBinding,
  IAutoMovieDialogueVisemeCompilation,
  IAutoMovieMixFilmSound,
  IAutoMovieProductionPhonemeChunk,
  IAutoMovieProductionSoundPlan,
} from "@automovie/interface";

import { autoMovieVisemeChannelWeights } from "../scene/autoMovieVisemeChannelWeights.js";

/**
 * Measure each adopted line's lip-sync lag from the mouth values the render
 * hands to the drawing, without reading pixels.
 *
 * A line whose receipt has phoneme chunks is timed and bound to its speaker's
 * actor (`productionPhonemesToVisemes`, `joinAutoMovieDialogueVisemes`). Over
 * its speech span widened by `ceil(0.25 × fps)` frames on each side and clipped
 * to the film, the mouth series is the `jawOpen` channel weight its
 * coarticulated viseme weights give a VRM or imported model
 * (`autoMovieVisemeChannelWeights`), and the level series is the line's frame
 * level (`productionDialogueFrameLevels`), zero outside the span.
 * `measureAutoMovieLipSyncLag` names the lag and the verdict. The Human and the
 * polygon man receive only the envelope jaw until #3185 resolves viseme shapes,
 * so the `jawOpen` series is the one phoneme timing drives. A line without
 * chunks is `envelope-jaw`, and a line whose speaker binds to no single actor
 * is `speaker-not-bound`.
 *
 * @param props The adopted lines as mixed, the film's speaker bindings and the
 *   plan's clock.
 * @returns One entry per line, in list order.
 */
export function measureAutoMovieDialogueLipSync(props: {
  /** The adopted lines with their receipts and 48 kHz samples. */
  lines: readonly IAutoMovieMixFilmSound.ILine[];

  /** The film's speaker-to-actor bindings. */
  speakers: readonly IAutoMovieDialogueSpeakerBinding[];

  /** The plan the lines were mixed in, for its clock and frame count. */
  plan: IAutoMovieProductionSoundPlan;
}): IAutoMovieDialogueLipSync[] {
  const fps: number =
    props.plan.frameRate === undefined
      ? props.plan.fps
      : props.plan.frameRate.numerator / props.plan.frameRate.denominator;
  const reach: number = Math.ceil(AUTOMOVIE_LIP_SYNC.windowSeconds * fps);
  return props.lines.map(
    (entry: IAutoMovieMixFilmSound.ILine): IAutoMovieDialogueLipSync => {
      const chunks: readonly IAutoMovieProductionPhonemeChunk[] =
        entry.receipt.phonemeChunks ?? [];
      const bound: IAutoMovieDialogueSpeakerBinding[] = props.speakers.filter(
        (binding: IAutoMovieDialogueSpeakerBinding): boolean =>
          entry.line.speaker !== undefined &&
          binding.speaker === entry.line.speaker,
      );
      if (bound.length !== 1)
        return {
          line: entry.line.id,
          actor: null,
          status: "unmeasured",
          reason: "speaker-not-bound",
        };
      if (chunks.length === 0)
        return {
          line: entry.line.id,
          actor: bound[0]!.actor,
          status: "unmeasured",
          reason: "envelope-jaw",
        };
      const joined: IAutoMovieDialogueVisemeCompilation =
        joinAutoMovieDialogueVisemes({
          line: entry.line,
          bindings: bound,
          visemes: productionPhonemesToVisemes({ chunks }),
          sourceSampleRate: entry.receipt.sourceSampleRate,
          fps,
        });
      if (joined.timeline === null)
        throw new Error(
          `Dialogue line "${entry.line.id}" bound to one actor did not join its visemes.`,
        );

      const first: number = Math.max(0, entry.line.startFrame - reach);
      const last: number = Math.min(
        props.plan.totalFrames,
        entry.line.endFrame + reach,
      );
      const levels: Float64Array = productionDialogueFrameLevels(
        props.plan,
        entry.line,
        entry.samples,
      );
      const mouth: number[] = [];
      const level: number[] = [];
      for (let frame: number = first; frame < last; ++frame) {
        mouth.push(
          autoMovieVisemeChannelWeights(
            sampleAutoMovieDialogueVisemeWeights({
              timeline: joined.timeline,
              frame,
              fps,
            }),
          ).get("jawOpen") ?? 0,
        );
        level.push(levels[frame - entry.line.startFrame] ?? 0);
      }
      return {
        line: entry.line.id,
        actor: joined.timeline.actor,
        status: "measured",
        ...measureAutoMovieLipSyncLag({ mouth, level, fps }),
      };
    },
  );
}
