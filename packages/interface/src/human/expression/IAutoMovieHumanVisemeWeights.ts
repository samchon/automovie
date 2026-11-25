/**
 * Blend weights of the 15 standard visemes, each from 0 (absent) to 1 (full
 * mouth shape), named as in the Meta (Oculus) Lipsync viseme reference, which
 * follows the MPEG-4 viseme set. Omitted visemes weigh 0; weights are not
 * required to sum to 1.
 *
 * `AutoMovieHumanMouthExpression` maps each viseme onto lip units, tongue
 * controls and a jaw opening by the articulation of its sounds (Ladefoged and
 * Johnson, A Course in Phonetics), and sums them by weight.
 */
export interface IAutoMovieHumanVisemeWeights {
  /**
   * Silence, the closed resting mouth. Schema constraints: Minimum: 0; Maximum:
   * 1; retained by Human's schema refinement.
   */
  sil?: number;

  /**
   * P, b, m: lips pressed together ("put", "bat", "mat"). Schema constraints:
   * Minimum: 0; Maximum: 1; retained by Human's schema refinement.
   */
  PP?: number;

  /**
   * F, v: lower lip against the upper teeth ("fat", "vat"). Schema constraints:
   * Minimum: 0; Maximum: 1; retained by Human's schema refinement.
   */
  FF?: number;

  /**
   * Th: tongue tip between the teeth ("think", "that"). Schema constraints:
   * Minimum: 0; Maximum: 1; retained by Human's schema refinement.
   */
  TH?: number;

  /**
   * T, d: tongue tip on the alveolar ridge ("tip", "doll"). Schema constraints:
   * Minimum: 0; Maximum: 1; retained by Human's schema refinement.
   */
  DD?: number;

  /**
   * K, g: tongue dorsum against the soft palate ("call", "gas"). Schema
   * constraints: Minimum: 0; Maximum: 1; retained by Human's schema
   * refinement.
   */
  kk?: number;

  /**
   * Ch, j, sh: rounded, protruded lips ("chair", "join", "she"). Schema
   * constraints: Minimum: 0; Maximum: 1; retained by Human's schema
   * refinement.
   */
  CH?: number;

  /**
   * S, z: teeth nearly closed ("sir", "zeal"). Schema constraints: Minimum: 0;
   * Maximum: 1; retained by Human's schema refinement.
   */
  SS?: number;

  /**
   * N, l: tongue tip up, mouth slightly open ("lot", "not"). Schema
   * constraints: Minimum: 0; Maximum: 1; retained by Human's schema
   * refinement.
   */
  nn?: number;

  /**
   * R ("red"). Schema constraints: Minimum: 0; Maximum: 1; retained by Human's
   * schema refinement.
   */
  RR?: number;

  /**
   * Open vowel as in "car". Schema constraints: Minimum: 0; Maximum: 1;
   * retained by Human's schema refinement.
   */
  aa?: number;

  /**
   * Vowel as in "bed". Schema constraints: Minimum: 0; Maximum: 1; retained by
   * Human's schema refinement.
   */
  E?: number;

  /**
   * Vowel as in "tip". Schema constraints: Minimum: 0; Maximum: 1; retained by
   * Human's schema refinement.
   */
  I?: number;

  /**
   * Rounded vowel as in "toe". Schema constraints: Minimum: 0; Maximum: 1;
   * retained by Human's schema refinement.
   */
  O?: number;

  /**
   * Close rounded vowel as in "book". Schema constraints: Minimum: 0; Maximum:
   * 1; retained by Human's schema refinement.
   */
  U?: number;
}
