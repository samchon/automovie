/**
 * Associates a literal discriminator with its tag-free variant payload.
 *
 * Use this wrapper when a union needs a stable tag while the payload contract
 * itself remains reusable without carrying a second discriminator.
 *
 * @template Type - Literal string that identifies the variant.
 * @template Value - Tag-free payload carried by the variant.
 */
export interface IAutoMovieDiscriminated<Type extends string, Value> {
  /** Literal string that selects this variant. */
  readonly type: Type;

  /** Variant payload, whose contract does not include the discriminator. */
  readonly value: Value;
}
