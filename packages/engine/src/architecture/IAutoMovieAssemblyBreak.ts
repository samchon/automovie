/**
 * One construction role that only one side of a junction declares, so it stops
 * there.
 *
 * Produced by `matchAutoMovieAssemblyJunction`. Role names are compared exactly
 * as authored, and `thickness` sums every layer of the role on the carrying
 * side.
 *
 * @evidence contracts/common.md#principled-implementation Records a role present in one build-up's role map and absent from the other's, with the carrying side and that side's summed layer thickness for the role.
 * @evidence contracts/common.md#clear-and-simple-design Three fields, enough for a caller to name the layer that stops without carrying a span that exists on only one side.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No role such as insulation or barrier gets special handling; the caller decides what a role name means and the matcher only compares names.
 * @evidence contracts/common.md#meaningful-documentation States the producer, exact role matching, which side carries the role, and that thickness sums same-role layers in metres.
 * @evidenceExclude contracts/performance.md#cost-and-resources A three-field record built from one hashed role lookup inside the junction matcher and owned by the junction result.
 * @author Samchon
 */
export interface IAutoMovieAssemblyBreak {
  /** The role only one side declares. */
  role: string;

  /** Which build-up carries it. */
  side: "left" | "right";

  /** Summed thickness the carrying side gives the role, in metres. */
  thickness: number;
}
