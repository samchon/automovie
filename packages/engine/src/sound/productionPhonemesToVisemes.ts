import type { IAutoMovieProductionPhonemeChunk, IAutoMovieProductionViseme } from "@automovie/interface";

/**
 * Derive a bounded frame-normalized VRM mouth sequence from Kokoro phonemes.
 *
 * @evidence requirements/sound/dialogue-voice-and-visemes.md#sound-dialogue-final-bytes-authority Converts timings derived from adopted dialogue bytes into the mouth sequence.
 * @evidence requirements/sound/dialogue-voice-and-visemes.md#sound-word-phoneme-timing Maps ordered phoneme sample ranges from the adopted source duration into bounded viseme frame intervals.
 * @evidence specifications/simulation-effects-and-sound/sound-sources-events-dialogue-and-foley.md#dialogue-voice-consistency-and-phoneme-state Preserves ordered phoneme state while mapping it to bounded visemes.
 */
export const productionPhonemesToVisemes = (props: {
  chunks: readonly IAutoMovieProductionPhonemeChunk[];
  sourceSamples: number;
  startFrame: number;
  endFrame: number;
}): IAutoMovieProductionViseme[] => {
  const duration = props.endFrame - props.startFrame;
  if (duration <= 0 || props.sourceSamples <= 0) return [];
  const output: IAutoMovieProductionViseme[] = [];
  let cursor = props.startFrame;
  for (const chunk of props.chunks) {
    const tokens = Array.from(chunk.phonemes.normalize("NFKC")).filter(
      (token) => /\s/u.test(token) === false,
    );
    if (tokens.length === 0) continue;
    const chunkStart = Math.max(
      cursor,
      props.startFrame +
        Math.floor((duration * chunk.startSample) / props.sourceSamples),
    );
    const chunkEnd =
      props.startFrame +
      Math.max(
        1,
        Math.ceil((duration * chunk.endSample) / props.sourceSamples),
      );
    const frames = Math.max(1, Math.min(props.endFrame, chunkEnd) - chunkStart);
    if (chunkStart >= props.endFrame) {
      const previous = output.at(-1);
      if (previous !== undefined) previous.phoneme += tokens.join("");
      continue;
    }
    const bins = Math.min(tokens.length, frames);
    for (let index = 0; index < bins; ++index) {
      const tokenStart = Math.floor((tokens.length * index) / bins);
      const tokenEnd = Math.floor((tokens.length * (index + 1)) / bins);
      const phonemes = tokens.slice(tokenStart, tokenEnd).join("");
      output.push({
        phoneme: phonemes,
        viseme: phonemeViseme(tokens[tokenStart]!),
        startFrame: chunkStart + Math.floor((frames * index) / bins),
        endFrame: chunkStart + Math.floor((frames * (index + 1)) / bins),
      });
    }
    cursor = chunkStart + frames;
  }
  if (output.length === 0)
    return [
      {
        phoneme: "",
        viseme: "rest",
        startFrame: props.startFrame,
        endFrame: props.endFrame,
      },
    ];
  return output;
};
