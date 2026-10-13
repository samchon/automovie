/**
 * One construction role that only one side of a junction declares, so it stops
 * there.
 *
 * Produced by `matchAutoMovieAssemblyJunction`. Role names are compared exactly
 * as authored, and `thickness` sums every layer of the role on the carrying
 * side.
 *
 * @evidence contracts/common.md#principled-implementation A plain record of a one-sided role: `matchAutoMovieAssemblyJunction` emits one for every role name found in one build-up's layers and absent from the other's, comparing names by exact string equality and summing `thickness` over every layer of that role on the carrying side.
 * @evidence contracts/common.md#clear-and-simple-design Three fields, the role, the carrying side and its summed depth, which is what a caller needs to say which barrier stops at the junction and how much of it; no span is kept because a one-sided role has nothing to line up against.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Role names are neither trimmed, case-folded nor aliased, so `Insulation` and `insulation` are two roles, and the matcher applies no role-specific rule or fixture exception when it fills this record.
 * @evidence contracts/common.md#meaningful-documentation States the producer, that roles are compared exactly as authored, that `side` names the build-up carrying the role, and that `thickness` is in metres and sums every layer of the role on that side.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An interface with no runtime body; the matcher fills it during its single pass over each side's layers, and that linear cost is answered on `matchAutoMovieAssemblyJunction`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each break is a new record per junction query and the engine caches no junction answer, so there is no completed work this shape could let a later call share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds one string, one side literal and one number by value; the junction's `broken` array is its only owner and it references no layer record.
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
