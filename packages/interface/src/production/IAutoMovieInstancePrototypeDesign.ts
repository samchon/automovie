/**
 * One reusable weighted model prototype selectable by slots in a logical set.
 *
 * @evidence contracts/common.md#principled-implementation An admitted positive finite weight participates in deterministic seed-and-slot prototype selection, while an explicit slot can name the prototype id directly; modelRecipe resolves an existing production recipe.
 * @evidence contracts/common.md#clear-and-simple-design Separates selection identity and weight from the reusable model recipe, so a set shares prototype data without expanding one model per member.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unique ids, existing recipes, positive finite weights and a finite representable total weight are caller premises; compact materialization does not validate them. Explicit missing ids throw, while seeded selection uses table order and assigns floating residue to its last choice.
 * @evidence contracts/common.md#meaningful-documentation Defines set-local non-blank identity, existing recipe reference and positive deterministic selection weight.
 * @author Samchon
 */
export interface IAutoMovieInstancePrototypeDesign {
  /** Stable non-blank id unique inside the set. */
  id: string;

  /** Existing model recipe used by this prototype. */
  modelRecipe: string;

  /** Positive deterministic selection weight. */
  weight: number;
}
