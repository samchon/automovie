import {
  IAutoMovieProductionDialogueLine,
  IAutoMovieProductionViseme,
} from "@automovie/interface";

import { IAutoMovieDialogueMouthRange } from "./IAutoMovieDialogueMouthRange";
import { IAutoMovieDialogueSpeakerBinding } from "./IAutoMovieDialogueSpeakerBinding";
import { IAutoMovieDialogueVisemeCompilation } from "./IAutoMovieDialogueVisemeCompilation";

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
 *
 * @evidence contracts/common.md#principled-implementation Exactly one speaker match, a nonblank actor and ordered positive safe-integer half-open ranges are required; the linear cursor inserts explicit rest gaps and produces complete line coverage without sorting.
 * @evidence contracts/common.md#clear-and-simple-design Binding admission and timeline construction stay together, while sampling is a separate cursor-free query; closed not-run reasons expose missing or ambiguous speaker resolution.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No actor is guessed and no external phonemes or acoustic-arrival offset is synthesized. Final-byte provenance and actual compiled actor existence are caller prerequisites, not verified by this join's test-only repository reach.
 * @evidence contracts/common.md#meaningful-documentation Documents emission clock, gap-rest policy, ordering and throws for corrupt timing/targets; successful availability certifies this timing join rather than actor application.
 * @evidence contracts/performance.md#efficient-algorithms B bindings and V visemes require O(B+V) time; the matching subset is temporary and successful output has at most 2V+1 ranges.
 * @evidence contracts/performance.md#reuse-equivalent-work The completed fresh timeline can be sampled repeatedly under arbitrary seeks; changed receipt, line timing or binding requires joining again, without a mutable playback or actor registry.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the outcome and fresh ranges; input receipts and binding records are read but not retained, and no audio, scene node or host task is acquired.
 */
export const joinAutoMovieDialogueVisemes: (props: {
  line: IAutoMovieProductionDialogueLine;
  bindings: readonly IAutoMovieDialogueSpeakerBinding[];
  visemes: readonly IAutoMovieProductionViseme[];
}) => IAutoMovieDialogueVisemeCompilation = (props: {
  /** Dialogue line whose film range is authoritative. */
  line: IAutoMovieProductionDialogueLine;
  /** Explicit speaker-to-actor bindings in authored order. */
  bindings: readonly IAutoMovieDialogueSpeakerBinding[];
  /** Final-byte receipt visemes for this line. */
  visemes: readonly IAutoMovieProductionViseme[];
}): IAutoMovieDialogueVisemeCompilation => {
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
