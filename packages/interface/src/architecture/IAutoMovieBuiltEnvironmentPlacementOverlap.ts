import type { IAutoMovieBuiltEnvironment } from "./IAutoMovieBuiltEnvironment";
import type { IAutoMovieBuiltPlacementBodyLocator } from "./IAutoMovieBuiltPlacementBodyLocator";

/**
 * Two building body identities compared through their static box proxies.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Two building body identities compared through their static box proxies. Left and right use the shared element/population locator union in one world-metre environment; the query reports unresolved sides instead of inventing bounds.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Strict endpoint box comparisons exclude exterior contact but do not certify mesh intersection; finite admitted geometry remains a caller premise.
 * @evidence contracts/development/design.md#principled-representation Left and right use the shared element/population locator union in one world-metre environment; the query reports unresolved sides instead of inventing bounds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface builtEnvironmentPlacementOverlap consumes both identities and the common environment, resolving each side once through the placement resolver.
 */
export namespace IAutoMovieBuiltEnvironmentPlacementOverlap {
  /**
   * Two building body identities compared through their static box proxies.
   *
   * The comparison delegates to {@link propBoundsOverlap}. For positive extents, exact face contact is excluded; a zero-width plane or point strictly inside another box can still pass its strict endpoint comparisons. Population operands stay compact and each operand's basis identifies measured bounds versus an extent-free fallback point.
   *
   * An element operand is tested part by part because a multi-part body's union box can include gaps; a population keeps its one reported box. A missing operand makes the status `unresolved`, is listed by side in left-then-right order, and leaves its basis `null`.
   *
   * Parts are axis-aligned CPU box proxies, not mesh solids. Positive overlap can over-admit actual geometry, and a population box can also include gaps between members; `overlapping` is a bounds finding under those premises.
   *
   * @evidence contracts/development/design.md#principled-representation Left and right use the shared element/population locator union in one world-metre environment; the query reports unresolved sides instead of inventing bounds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface builtEnvironmentPlacementOverlap consumes both identities and the common environment, resolving each side once through the placement resolver.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Strict endpoint box comparisons exclude exterior contact but do not certify mesh intersection; finite admitted geometry remains a caller premise.
   * @evidence contracts/development/common.md#meaningful-documentation Two building body identities compared through their static box proxies. Left and right use the shared element/population locator union in one world-metre environment; the query reports unresolved sides instead of inventing bounds.
   */
  export type IProps = {
    /** Borrowed common building frame and geometry declarations for both operands. */
    environment: IAutoMovieBuiltEnvironment;

    /** First element/population; unresolved identity is reported as left with a null basis. */
    left: IAutoMovieBuiltPlacementBodyLocator;

    /** Second element/population; unresolved identity is reported as right with a null basis. */
    right: IAutoMovieBuiltPlacementBodyLocator;
  };
}
