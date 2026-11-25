/**
 * The front-midline height profile and its ordered millimetre landmark pairs.
 * Runtime construction and admission remain with
 * AutoMovieHumanTrunkProfileFront in Human.
 */
export namespace IAutoMovieHumanTrunkProfileFront {
  /** The profile. */
  export interface IProfile {
    /** The forward place of the front midline at a height, mm. */
    at: (y: number) => number;

    /**
     * The landmark stations the profile runs through, `[height, forward
     * place]`, mm.
     */
    marks: [number, number][];
  }
}
