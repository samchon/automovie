/**
 * Buttock and optional thigh constraints with the original trial-width girth
 * callback. Runtime construction and admission remain with
 * AutoMovieHumanTrunkGroinWidth in Human.
 */
export namespace IAutoMovieHumanTrunkGroinWidth {
  /** What the width reads. */
  export interface IInput {
    /** The buttock's half width, mm. */
    buttock: number;

    /** The thigh tape, mm; absent, the references' median ratio is used. */
    thigh?: number;

    /**
     * The ring's half girth over the thigh tape, as the leg reports it; absent,
     * the references' median ratio is used.
     */
    ratio?: number;

    /** The ring's girth at a trial half width, mm: the hull of its own section. */
    girth: (width: number) => number;
  }
}
