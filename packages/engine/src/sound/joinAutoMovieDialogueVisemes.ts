import type { IAutoMovieProductionDialogueLine, IAutoMovieProductionViseme } from "@automovie/interface";
import { IAutoMovieDialogueMouthRange } from "./IAutoMovieDialogueMouthRange";
import { IAutoMovieDialogueSpeakerBinding } from "./IAutoMovieDialogueSpeakerBinding";
import { IAutoMovieDialogueVisemeCompilation } from "./IAutoMovieDialogueVisemeCompilation";

const DIALOGUE_VISEMES = new Set<IAutoMovieProductionViseme["viseme"]>([
  "aa",
  "ih",
  "ou",
  "ee",
  "oh",
  "rest",
]);

/**
 * Join final-byte visemes to an explicitly bound actor on emission time.
 *
 * Missing or ambiguous speaker bindings return the shared `not-run` outcome;
 * the engine does not select an actor, synthesize phonemes for external audio,
 * or move mouth motion to the later audible-arrival frame. Valid receipt gaps
 * become explicit `rest` ranges, so silence has a deterministic closed mouth.
 *
 * @evidence requirements/sound/dialogue-voice-and-visemes.md#sound-dialogue-final-bytes-authority Uses only the receipt timeline derived from final audio bytes.
 * @evidence requirements/actors/voice-and-utterance-identity.md#actor-utterance-performance Joins final-byte film ranges to the explicitly resolved speaking actor and exposes that actor's mouth timeline.
 * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#dialogue-voice-consistency-and-phoneme-state Consumes the ordered phoneme state derived from those bytes.
 * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#dialogue-lipsync-join-and-seek Builds the builder-visible emission-clock join.
 * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-voice-utterance-expression Carries actor identity, utterance interval, and proxy viseme ranges into a mouth-only performance channel.
 */
export const joinAutoMovieDialogueVisemes = (props: {
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
  const bindings = props.bindings.filter(
    (binding) => binding.speaker === props.line.speaker,
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
  const binding = bindings[0]!;
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
  let cursor = props.line.startFrame;
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
