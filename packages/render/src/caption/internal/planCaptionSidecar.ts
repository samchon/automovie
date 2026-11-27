import { AutoMovieEngineFilm } from "@automovie/engine";
import type {
  IAutoMovieBeatCaption,
  IAutoMovieCaptionEntry,
  IAutoMovieCaptionSidecar,
  IAutoMoviePlanCaptionSidecarProps,
  IAutoMoviePlaybackTimeline,
  IAutoMovieScript,
  IAutoMovieSequence,
  IAutoMovieShot,
} from "@automovie/interface";

import { beatCaptions } from "./beatCaptions.js";
import { frameTimes } from "../../internal/frameTimes.js";
import { shotBeat } from "../../shotBeat.js";

/**
 * Plan the caption sidecar of one sequence render: which beat's shot is live at
 * every output frame, grouped into spans, each joined to its beat's caption and
 * enclosing scene slug.
 *
 * The cut is laid on the output clock by `sequenceTimeline`, and the output
 * frames are the `frameTimes` schedule `planSequenceRender` captures, so span
 * boundaries land on the same frames as the render. A frame inside a transition
 * belongs to the shot the picture shows most of, `playbackShownLayer` of its
 * layers: a fade's or a dissolve's outgoing shot before the midpoint, and the
 * incoming shot from it. A shot id `shot:<beat>` names that beat; an unprefixed
 * id is taken as the beat id itself. A beat with no caption, or a script
 * without a tree, yields null `caption` and `slug` while the frame-to-beat
 * spans remain.
 *
 * Throws when `fps` is not a finite positive number, when the runtime rounds to
 * zero output frames (the same refusal `planSequenceRender` makes), or when
 * `sequenceTimeline` refuses the cut. Planning only: the host writes the file
 * through `AutoMovieRenderCaption.renderSidecar`.
 */
export const planCaptionSidecar: (
  props: IAutoMoviePlanCaptionSidecarProps,
) => IAutoMovieCaptionSidecar = (
  props: IAutoMoviePlanCaptionSidecarProps,
): IAutoMovieCaptionSidecar => {
  const script: IAutoMovieScript = props.script;
  const sequence: IAutoMovieSequence = props.sequence;
  const shots: IAutoMovieShot[] = props.shots;
  const fps: number = props.fps;
  if (fps <= 0)
    throw new Error(`fps must be a finite number > 0, but was ${fps}`);

  const timeline: IAutoMoviePlaybackTimeline = AutoMovieEngineFilm.sequenceTimeline(
    sequence,
    shots,
  );
  const times: number[] = frameTimes(fps, timeline.runtime);
  if (times.length === 0)
    throw new Error(
      `planCaptionSidecar requires at least one frame; fps ${fps} and duration ${timeline.runtime} produced zero frames`,
    );
  const captions: Map<string, IAutoMovieBeatCaption> = beatCaptions(script);
  const entries: IAutoMovieCaptionEntry[] = [];
  times.forEach((time: number, frame: number): void => {
    const beat: string = shotBeat(
      AutoMovieEngineFilm.playbackShownLayer(AutoMovieEngineFilm.playbackLayersAt(sequence, timeline, time)).shot,
    );
    const last: IAutoMovieCaptionEntry | undefined =
      entries[entries.length - 1];
    if (last !== undefined && last.beat === beat) {
      last.frameEnd = frame + 1;
      return;
    }
    const authored: IAutoMovieBeatCaption | undefined = captions.get(beat);
    entries.push({
      frameStart: frame,
      frameEnd: frame + 1,
      beat,
      caption: authored?.caption ?? null,
      slug: authored?.slug ?? null,
    });
  });
  return { target: sequence.id, fps, frameCount: times.length, entries };
};
