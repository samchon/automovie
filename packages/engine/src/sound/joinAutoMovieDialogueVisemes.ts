import {
  type IAutoMovieDialogueMouthRange,
  type IAutoMovieDialogueSpeakerBinding,
  type IAutoMovieDialogueVisemeCompilation,
  type IAutoMovieJoinDialogueVisemes,
  IAutoMovieProductionViseme,
} from "@automovie/interface";

const DIALOGUE_VISEMES: Set<"rest" | "aa" | "ih" | "ou" | "ee" | "oh"> =
  new Set<IAutoMovieProductionViseme["viseme"]>([
    "aa",
    "ih",
    "ou",
    "ee",
    "oh",
    "rest",
  ]);

/**
 * Join supplied receipt visemes to one explicit actor binding on emission time.
 */
export const joinAutoMovieDialogueVisemes: (
  props: IAutoMovieJoinDialogueVisemes.IProps,
) => IAutoMovieDialogueVisemeCompilation = (
  props: IAutoMovieJoinDialogueVisemes.IProps,
): IAutoMovieDialogueVisemeCompilation => {
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
  if (binding.actor.trim().length === 0)
    throw new Error("dialogue actor binding must not be blank");
  if (props.visemes.length === 0)
    throw new Error(
      `dialogue line "${props.line.id}" has no final-byte viseme timing`,
    );
  if (
    !Number.isSafeInteger(props.line.startFrame) ||
    !Number.isSafeInteger(props.line.endFrame) ||
    props.line.startFrame < 0 ||
    props.line.endFrame <= props.line.startFrame
  )
    throw new Error(`dialogue line "${props.line.id}" has an invalid range`);

  const ranges: IAutoMovieDialogueMouthRange[] = [];
  let cursor: number = props.line.startFrame;
  for (const [index, viseme] of props.visemes.entries()) {
    if (!DIALOGUE_VISEMES.has(viseme.viseme))
      throw new Error(
        `dialogue line "${props.line.id}" viseme[${index}] has unsupported mouth target "${String(viseme.viseme)}"`,
      );
    if (
      !Number.isSafeInteger(viseme.startFrame) ||
      !Number.isSafeInteger(viseme.endFrame) ||
      viseme.startFrame < cursor ||
      viseme.endFrame <= viseme.startFrame ||
      viseme.endFrame > props.line.endFrame
    )
      throw new Error(
        `dialogue line "${props.line.id}" viseme[${index}] is outside or overlaps its emission range`,
      );
    if (viseme.startFrame > cursor)
      ranges.push({
        startFrame: cursor,
        endFrame: viseme.startFrame,
        viseme: "rest",
      });
    ranges.push({
      startFrame: viseme.startFrame,
      endFrame: viseme.endFrame,
      viseme: viseme.viseme,
    });
    cursor = viseme.endFrame;
  }
  if (cursor < props.line.endFrame)
    ranges.push({
      startFrame: cursor,
      endFrame: props.line.endFrame,
      viseme: "rest",
    });
  return {
    join: {
      status: "available",
      actor: binding.actor,
      timing: "emission",
      composition: "mouth-layer-over-authored-expression",
    },
    timeline: { line: props.line.id, actor: binding.actor, ranges },
  };
};
