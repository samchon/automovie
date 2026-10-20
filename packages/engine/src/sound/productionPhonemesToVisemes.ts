import {
  IAutoMovieProductionPhonemeChunk,
  IAutoMovieProductionViseme,
} from "@automovie/interface";

/**
 * Map supplied phoneme chunk sample timing to film-frame vowel/rest intervals.
 *
 * @evidence contracts/common.md#principled-implementation Chunk sample fractions map to floor/ceil frame spans, normalized Unicode nonspace code points populate at most one bin per available frame, and vowel groups map to the closed mouth targets; this coarse mapping is not speech recognition or a phonetic coarticulation model.
 * @evidence contracts/common.md#clear-and-simple-design The owner consumes an already produced phoneme/sample receipt and carries every token's text into an interval, while actor binding and final receipt admission remain separate joins.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonpositive source duration or frame span returns no intervals, empty phoneme text becomes rest and unknown symbols map to rest; fractional/malformed chunk clocks otherwise remain caller admission premises.
 * @evidence contracts/common.md#meaningful-documentation Documents source samples versus film frames, normalization, coarse binning, remainder text retention and empty/rest meanings without claiming synthesized audio provenance.
 * @evidence contracts/performance.md#efficient-algorithms T normalized code points require proportional token/bin traversal and retained text storage; Unicode normalization and repeated concatenation of tail chunks also incur their string-processing costs, which are not bounded here by an independent text budget.
 * @evidence contracts/performance.md#reuse-equivalent-work One normalized chunk token list and computed frame span are reused for that chunk's bins; changed chunk timing or frame range is recalculated with no retained phoneme cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns fresh scalar/text viseme rows; chunk objects and source audio are not retained, and no tokenizer model, network or decoder resource is acquired.
 */
export const productionPhonemesToVisemes: (props: {
  chunks: readonly IAutoMovieProductionPhonemeChunk[];
  sourceSamples: number;
  startFrame: number;
  endFrame: number;
}) => IAutoMovieProductionViseme[] = (props: {
  chunks: readonly IAutoMovieProductionPhonemeChunk[];
  sourceSamples: number;
  startFrame: number;
  endFrame: number;
}): IAutoMovieProductionViseme[] => {
  const duration: number = props.endFrame - props.startFrame;
  if (duration <= 0 || props.sourceSamples <= 0) return [];
  const output: IAutoMovieProductionViseme[] = [];
  let cursor: number = props.startFrame;
  for (const chunk of props.chunks) {
    const tokens: string[] = Array.from(
      chunk.phonemes.normalize("NFKC"),
    ).filter((token: string): boolean => /\s/u.test(token) === false);
    if (tokens.length === 0) continue;
    const chunkStart: number = Math.max(
      cursor,
      props.startFrame +
        Math.floor((duration * chunk.startSample) / props.sourceSamples),
    );
    const chunkEnd: number =
      props.startFrame +
      Math.max(
        1,
        Math.ceil((duration * chunk.endSample) / props.sourceSamples),
      );
    const frames: number = Math.max(
      1,
      Math.min(props.endFrame, chunkEnd) - chunkStart,
    );
    if (chunkStart >= props.endFrame) {
      const previous: IAutoMovieProductionViseme | undefined = output.at(-1);
      if (previous !== undefined) previous.phoneme += tokens.join("");
      continue;
    }
    const bins: number = Math.min(tokens.length, frames);
    for (let index: number = 0; index < bins; ++index) {
      const tokenStart: number = Math.floor((tokens.length * index) / bins);
      const tokenEnd: number = Math.floor((tokens.length * (index + 1)) / bins);
      const phonemes: string = tokens.slice(tokenStart, tokenEnd).join("");
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

/** Case-fold one normalized code point using en-US and match the fixed vowel groups in declared order; unknown symbols return rest and case expansions can contain a matching vowel. */
const phonemeViseme: (
  phoneme: string,
) => "rest" | "aa" | "ih" | "ou" | "ee" | "oh" = (
  phoneme: string,
): IAutoMovieProductionViseme["viseme"] => {
  const token: string = phoneme.toLocaleLowerCase("en-US");
  const matches: (characters: string) => boolean = (
    characters: string,
  ): boolean =>
    Array.from(token).some((character: string): boolean =>
      characters.includes(character),
    );
  if (matches("aɑɒæʌə")) return "aa";
  if (matches("iɪɨ")) return "ih";
  if (matches("uʊw")) return "ou";
  if (matches("eɛj")) return "ee";
  if (matches("oɔ")) return "oh";
  return "rest";
};
