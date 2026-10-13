/**
 * One construction role that only one side of a junction declares, so it stops
 * there.
 *
 * Produced by `matchAutoMovieAssemblyJunction`. Role names are compared exactly
 * as authored, and `thickness` sums every layer of the role on the carrying
 * side.
 *
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
