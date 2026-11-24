import type { IAutoMovieProductionPhonemeChunk } from "../IAutoMovieProductionPhonemeChunk";

/** Inputs of timing a line's phonemes and mapping them to visemes. */
export namespace IAutoMovieProductionPhonemesToVisemes {
  /**
   * A line's phoneme chunks on its model-native sample clock.
   *
   * Engine's `productionPhonemesToVisemes` gives each phoneme of a chunk an
   * equal share of the chunk's interval, in order, and maps it through the
   * fixed IPA table. It refuses a chunk whose interval is not finite and
   * increasing, and a symbol outside the table, naming the chunk and the
   * symbol. Chunk order and nonoverlap are the receipt admission's checks.
   */
  export type IProps = {
    /** Borrowed chunks in spoken order. */
    chunks: readonly IAutoMovieProductionPhonemeChunk[];
  };
}
