import { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";

/**
 * The action targets a reach query may name: a staged node, a live bone, a
 * literal point or a group centroid, each of which names one place.
 *
 * The relative kinds (`direction` and `offscreen`) are excluded because they
 * name no point to measure an arm against. Its only user is
 * {@link IAutoMovieGetReachRequest}, which no source in this repository
 * answers, so this type constrains the request's shape and nothing resolves
 * it yet.
 *
 * @evidence contracts/common.md#principled-implementation An `Extract` over the action target union by `kind`, so the four admitted records are the action records themselves and a fifth positional kind added there must be admitted here explicitly.
 * @evidence contracts/common.md#clear-and-simple-design Derived from `IAutoMovieActionTarget` rather than restated, so a query and an action name a target with one shape.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The relative kinds are excluded by type instead of being answered with a guessed point, and the documentation states that nothing resolves the request rather than naming a resolver that does not exist.
 * @evidence contracts/common.md#meaningful-documentation States which kinds are admitted and why the relative kinds are not, the one user, and that no source answers it.
 * @author Samchon
 */
export type IAutoMovieReachTarget = Extract<
  IAutoMovieActionTarget,
  { kind: "node" | "bone" | "point" | "group" }
>;
