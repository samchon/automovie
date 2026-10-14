import {
  IAutoMoviePlaybackSample,
  IAutoMoviePlaybackTimeline,
  playbackCursor,
  sequenceTimeline,
} from "@automovie/engine";
import {
  IAutoMovieScript,
  IAutoMovieSequence,
  IAutoMovieShot,
} from "@automovie/interface";

import { IAutoMovieBeatCaption } from "./caption/IAutoMovieBeatCaption";
import { beatCaptions } from "./caption/beatCaptions";
import {
  IAutoMovieCaptionEntry,
  IAutoMovieCaptionSidecar,
} from "./captionSidecar";
import { frameTimes } from "./frameTimes";
import { shotBeat } from "./shotBeat";

/**
 * Plan the caption sidecar of one sequence render: which beat's shot is live at every output frame, grouped into spans, each joined to its beat's caption and enclosing scene slug.
 *
 * The cut is laid on the output clock by `sequenceTimeline`, and the output frames are the `frameTimes` schedule `planSequenceRender` captures, so span boundaries land on the same frames as the render. A frame inside a transition belongs to the incoming shot, as in playback. A shot id `shot:<beat>` names that beat; an unprefixed id is taken as the beat id itself. A beat with no caption, or a script without a tree, yields null `caption` and `slug` while the frame-to-beat spans remain.
 *
 * Throws when `fps` is not a finite positive number, when the runtime rounds to zero output frames (the same refusal `planSequenceRender` makes), or when `sequenceTimeline` refuses the cut. Planning only: the host writes the file through `renderCaptionSidecar`.
 *
 * @evidence contracts/common.md#principled-implementation Frames come from frameTimes, the independently computed binary64 i/fps schedule the render plan uses, and a forward-only playbackCursor resolves each instant to the live shot. Division can round, but the positive clock gives the non-decreasing queries the cursor requires; grouping consecutive equal beats into half-open spans covers every scheduled frame exactly once.
 * @evidence contracts/common.md#clear-and-simple-design Timeline layout and live-shot resolution stay in the engine, the beat index in `beatCaptions`, and serialization in `renderCaptionSidecar`; this function owns only sampling, grouping and the join, so the sidecar cannot drift from the render's frame schedule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The `shot:` prefix is the interface's documented shot-to-beat naming, not a fixture case, read through `shotBeat`, which the pose-keypoint plan shares, and no sequence or beat is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The doc states the clock and schedule shared with the render, the transition rule, the shot-to-beat mapping, the null states, every refusal, and that the host writes the file.
 * @evidence contracts/performance.md#efficient-algorithms For S supplied shots, F output frames, E cut entries and N script-tree nodes, timeline indexing, caption indexing and the cursor sweep take O(S+F+E+N) work. The schedule holds F times, the returned range list can also reach F entries, and each range joins the beat index once without retaining a separate playback-sample array.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The planner computes one sidecar per call from caller-supplied values and coordinates no phases; a host that also plans the render recomputes the shared schedule, which is cheap arithmetic.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The frame schedule, cursor and beat index are local and released on return; the returned sidecar, owned by the caller, holds one entry per run of consecutive frames of one beat, at most F.
 * @author Samchon
 */
export const planCaptionSidecar: (props: {
  script: IAutoMovieScript;
  sequence: IAutoMovieSequence;
  shots: IAutoMovieShot[];
  fps: number;
}) => IAutoMovieCaptionSidecar = (props: {
  /** The script whose screenplay tree carries captions and scene slugs. */
  script: IAutoMovieScript;

  /** The cut being rendered. */
  sequence: IAutoMovieSequence;

  /** The shots the cut references, each id at most once. */
  shots: IAutoMovieShot[];

  /**
   * Output frames per second: the render clock, which may differ from `sequence.fps`.
   */
  fps: number;
}): IAutoMovieCaptionSidecar => {
  const script: IAutoMovieScript = props.script;
  const sequence: IAutoMovieSequence = props.sequence;
  const shots: IAutoMovieShot[] = props.shots;
  const fps: number = props.fps;
  if (!Number.isFinite(fps) || fps <= 0)
    throw new Error(`fps must be a finite number > 0, but was ${fps}`);

  const timeline: IAutoMoviePlaybackTimeline = sequenceTimeline(
    sequence,
    shots,
  );
  const times: number[] = frameTimes(fps, timeline.runtime);
  if (times.length === 0)
    throw new Error(
      `planCaptionSidecar requires at least one frame; fps ${fps} and duration ${timeline.runtime} produced zero frames`,
    );
  const captions: Map<string, IAutoMovieBeatCaption> = beatCaptions(script);
  const cursor: (seconds: number) => IAutoMoviePlaybackSample = playbackCursor(
    sequence,
    timeline,
  );

  const entries: IAutoMovieCaptionEntry[] = [];
  times.forEach((time: number, frame: number): void => {
    const beat: string = shotBeat(cursor(time).shot);
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
