import type { IAutoMovieHumanVisemeWeights } from "../human/IAutoMovieHumanVisemeWeights";

/**
 * One actor's dialogue mouth at one film second, in the two forms the figure
 * representations take.
 *
 * Outside every line of the actor the jaw is 0 and the weights are `{ sil: 1
 * }`, which sets no mouth channel, so the authored expression shows.
 */
export interface IAutoMovieDialogueMouth {
  /**
   * Jaw opening in millimetres at the incisors, from the speaking line's own
   * frame level: what the Human and the polygon man receive until viseme shapes
   * resolve for them (#3185). Between 0 and the envelope jaw's maximum speech
   * opening.
   */
  jaw: number;

  /**
   * MPEG-4 viseme weights, each in [0, 1] and summing to 1, for a VRM or
   * imported model. A line with phoneme chunks gives its coarticulated visemes;
   * a line without them gives `aa` at the jaw's fraction of the maximum speech
   * opening and `sil` for the rest.
   */
  visemes: IAutoMovieHumanVisemeWeights;
}
