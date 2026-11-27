import type {
  AutoMovieViseme,
  IAutoMovieDialogueMouthRange,
  IAutoMovieDialogueSpeakerBinding,
  IAutoMovieDialogueVisemeCompilation,
  IAutoMovieJoinDialogueVisemes,
} from "@automovie/interface";

/*
 * Bind a line's timed visemes to its speaker's actor and place them on the
 * emission clock.
 *
 * Each viseme's sample bounds become film frames from the line's start frame at
 * the film's rate, `frame = line.startFrame + sample × fps / sourceSampleRate`,
 * which is the clock the line's samples play on; no propagation delay is added.
 * Pauses between visemes become `sil` ranges, so a pause inside a line closes
 * the mouth. The weights layer over the actor's authored expression
 * (`mouth-layer-over-authored-expression`).
 * Parameter props: The line, the film's speaker bindings, the timed visemes and the
 * two rates.
 * Returns: The join outcome, with the timeline when it is available.
 */
export function joinDialogueVisemes(
  props: IAutoMovieJoinDialogueVisemes.IProps,
): IAutoMovieDialogueVisemeCompilation {
  if (props.line.speaker === undefined)
    return {
      join: { status: "not-run", reason: "speaker-not-declared" },
      timeline: null,
    };
  const bindings: IAutoMovieDialogueSpeakerBinding[] = props.bindings.filter(
    (binding: IAutoMovieDialogueSpeakerBinding): boolean =>
      binding.speaker === props.line.speaker,
  );
  if (bindings.length === 0)
    return {
      join: { status: "not-run", reason: "speaker-actor-not-found" },
      timeline: null,
    };
  if (bindings.length > 1)
    return {
      join: { status: "not-run", reason: "speaker-actor-ambiguous" },
      timeline: null,
    };
  const binding: IAutoMovieDialogueSpeakerBinding = bindings[0]!;
  if (props.visemes.length === 0)
    throw new Error(`dialogue line "${props.line.id}" has no viseme timing`);
  if (
    props.line.startFrame < 0 ||
    props.line.endFrame <= props.line.startFrame ||
    !(props.sourceSampleRate > 0) ||
    !(props.fps > 0)
  )
    throw new Error(
      `dialogue line "${props.line.id}" has an invalid range or rate`,
    );

  const frame: (sample: number) => number = (sample: number): number =>
    props.line.startFrame + (sample * props.fps) / props.sourceSampleRate;
  const ranges: IAutoMovieDialogueMouthRange[] = [];
  let cursor: number = props.visemes[0]!.startSample;
  for (const [index, viseme] of props.visemes.entries()) {
    if (!VISEMES.has(viseme.viseme))
      throw new Error(
        `dialogue line "${props.line.id}" viseme[${index}] has unsupported mouth target "${String(viseme.viseme)}"`,
      );
    if (
      viseme.startSample < cursor ||
      viseme.startSample < 0 ||
      viseme.endSample <= viseme.startSample ||
      frame(viseme.endSample) > props.line.endFrame
    )
      throw new Error(
        `dialogue line "${props.line.id}" viseme[${index}] is outside or overlaps its emission range`,
      );
    if (viseme.startSample > cursor)
      ranges.push({
        startFrame: frame(cursor),
        endFrame: frame(viseme.startSample),
        viseme: "sil",
      });
    ranges.push({
      startFrame: frame(viseme.startSample),
      endFrame: frame(viseme.endSample),
      viseme: viseme.viseme,
    });
    cursor = viseme.endSample;
  }
  return {
    join: {
      status: "available",
      actor: binding.actor,
      timing: "emission",
      composition: "mouth-layer-over-authored-expression",
    },
    timeline: { line: props.line.id, actor: binding.actor, ranges },
  };
}

/*
 * The 15 MPEG-4 visemes; a timed viseme a receipt reports is checked against
 * them at runtime.
 */
const VISEMES: ReadonlySet<AutoMovieViseme> = new Set<AutoMovieViseme>([
  "sil",
  "PP",
  "FF",
  "TH",
  "DD",
  "kk",
  "CH",
  "SS",
  "nn",
  "RR",
  "aa",
  "E",
  "I",
  "O",
  "U",
]);
