import { tags } from "typia";

/**
 * Blend weights of the 15 standard visemes, each from 0 (absent) to 1 (full mouth shape), named as in the Meta (Oculus) Lipsync viseme reference, which follows the MPEG-4 viseme set. Omitted visemes weigh 0; weights are not required to sum to 1.
 *
 * Not consumed by the generator yet (deferred to the mouth-geometry task).
 */
export interface IAutoMovieHumanVisemeWeights {
  /** Silence, the closed resting mouth. */
  sil?: number & tags.Minimum<0> & tags.Maximum<1>;

  /** p, b, m: lips pressed together ("put", "bat", "mat"). */
  PP?: number & tags.Minimum<0> & tags.Maximum<1>;

  /** f, v: lower lip against the upper teeth ("fat", "vat"). */
  FF?: number & tags.Minimum<0> & tags.Maximum<1>;

  /** th: tongue tip between the teeth ("think", "that"). */
  TH?: number & tags.Minimum<0> & tags.Maximum<1>;

  /** t, d: tongue tip on the alveolar ridge ("tip", "doll"). */
  DD?: number & tags.Minimum<0> & tags.Maximum<1>;

  /** k, g: tongue dorsum against the soft palate ("call", "gas"). */
  kk?: number & tags.Minimum<0> & tags.Maximum<1>;

  /** ch, j, sh: rounded, protruded lips ("chair", "join", "she"). */
  CH?: number & tags.Minimum<0> & tags.Maximum<1>;

  /** s, z: teeth nearly closed ("sir", "zeal"). */
  SS?: number & tags.Minimum<0> & tags.Maximum<1>;

  /** n, l: tongue tip up, mouth slightly open ("lot", "not"). */
  nn?: number & tags.Minimum<0> & tags.Maximum<1>;

  /** r ("red"). */
  RR?: number & tags.Minimum<0> & tags.Maximum<1>;

  /** Open vowel as in "car". */
  aa?: number & tags.Minimum<0> & tags.Maximum<1>;

  /** Vowel as in "bed". */
  E?: number & tags.Minimum<0> & tags.Maximum<1>;

  /** Vowel as in "tip". */
  I?: number & tags.Minimum<0> & tags.Maximum<1>;

  /** Rounded vowel as in "toe". */
  O?: number & tags.Minimum<0> & tags.Maximum<1>;

  /** Close rounded vowel as in "book". */
  U?: number & tags.Minimum<0> & tags.Maximum<1>;
}
