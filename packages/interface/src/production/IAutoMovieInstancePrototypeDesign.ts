/** One reusable model prototype selectable by slots in a logical set. */
export interface IAutoMovieInstancePrototypeDesign {
  /** Stable non-blank id unique inside the set. */
  id: string;

  /** Existing model recipe used by this prototype. */
  modelRecipe: string;

  /** Positive deterministic selection weight. */
  weight: number;
}
