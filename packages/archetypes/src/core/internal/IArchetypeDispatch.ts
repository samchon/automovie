/**
 * One saved variant's producer as a dispatcher calls it.
 *
 * A saved record spans every variant of a producer family, so its parameters
 * are wider than any one variant's. The selected variant admits them at run
 * time with its own draw. `build` is a method on purpose: a method's parameters
 * are compared bivariantly, so a variant that declares narrower parameters
 * fits the family's wider record without a cast.
 *
 * @template Params The family's saved parameters.
 * @template Built The archetype a variant builds.
 */
export interface IArchetypeDispatch<Params, Built> {
  /**
   * Build the variant.
   *
   * @param params The saved parameters.
   * @param seed The seed that draws the omitted settings.
   * @returns The variant's archetype.
   */
  build(params: Params, seed?: number): Built;
}
