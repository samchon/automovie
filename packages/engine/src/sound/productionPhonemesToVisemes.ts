import {
  type IAutoMovieProductionPhonemesToVisemes,
  IAutoMovieProductionViseme,
} from "@automovie/interface";

/**
 * Map supplied phoneme chunk sample timing to film-frame vowel/rest intervals.
 */
export const productionPhonemesToVisemes: (
  props: IAutoMovieProductionPhonemesToVisemes.IProps,
) => IAutoMovieProductionViseme[] = (
  props: IAutoMovieProductionPhonemesToVisemes.IProps,
): IAutoMovieProductionViseme[] => {
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
