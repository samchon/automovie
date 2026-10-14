import {
  AutoMovieBuiltPlacementBodyLocator,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltPlacementOverlapResult,
  IAutoMovieSubjectBox,
} from "@automovie/interface";

import { propBoundsOverlap } from "../film/propBoundsOverlap";
import { IAutoMovieBuiltPlacementBody } from "./IAutoMovieBuiltPlacementBody";
import { builtEnvironmentElementPartBounds } from "./builtEnvironmentElementPartBounds";
import { resolveBuiltPlacementBody } from "./resolveBuiltPlacementBody";

/**
 * Test two named building bodies with the placement kernel's AABB overlap rule.
 *
 * The comparison delegates to {@link propBoundsOverlap}. For positive extents, exact face contact is excluded; a zero-width plane or point strictly inside another box can still pass its strict endpoint comparisons. Population operands stay compact and each operand's basis identifies measured bounds versus an extent-free fallback point.
 *
 * An element operand is tested part by part because a multi-part body's union box can include gaps; a population keeps its one reported box. A missing operand makes the status `unresolved`, is listed by side in left-then-right order, and leaves its basis `null`.
 *
 * Parts are axis-aligned CPU box proxies, not mesh solids. Positive overlap can over-admit actual geometry, and a population box can also include gaps between members; `overlapping` is a bounds finding under those premises.
 *
 * @evidence contracts/common.md#principled-implementation Resolves each side once and applies `propBoundsOverlap` to proxy pairs. Its strict endpoint inequalities exclude exterior contact but can admit internal degenerate planes/points; this pair query does not promise the positive shared-volume policy applied by the sweep's separate volume fold.
 * @evidence contracts/common.md#clear-and-simple-design Shares body resolution and the part-versus-union rule with the bounds query and the sweep, so this query owns only the pair verdict and the unresolved listing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no body or production; an unresolved side is reported as such rather than defaulted to `separate`, and face contact is excluded by the shared kernel rather than by a tolerance chosen here.
 * @evidence contracts/common.md#meaningful-documentation States the contact rule, that populations stay compact, why the basis is returned, that elements are tested by part, and the unresolved status, its side order and its null basis.
 * @evidence contracts/performance.md#efficient-algorithms Each side pays its selected body-resolution cost: element/model scans, full world staging and tessellation for an element, or a population scan and placement fold for a population. The final box test costs O(P₁P₂) for the two part counts, with an early exit on the first overlap.
 * @evidence contracts/performance.md#reuse-equivalent-work Each side's part boxes are measured once and serve both as its reported box and as its solids, where the earlier form measured every element side twice; nothing is cached across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Keeps nothing after returning; the caller owns the small result record.
 * @author Samchon
 */
export const builtEnvironmentPlacementOverlap: (props: {
  environment: IAutoMovieBuiltEnvironment;
  left: AutoMovieBuiltPlacementBodyLocator;
  right: AutoMovieBuiltPlacementBodyLocator;
}) => IAutoMovieBuiltPlacementOverlapResult = (props: {
  environment: IAutoMovieBuiltEnvironment;
  left: AutoMovieBuiltPlacementBodyLocator;
  right: AutoMovieBuiltPlacementBodyLocator;
}): IAutoMovieBuiltPlacementOverlapResult => {
  const parts: (elementId: string) => IAutoMovieSubjectBox[] | null = (
    elementId: string,
  ): IAutoMovieSubjectBox[] | null =>
    builtEnvironmentElementPartBounds(props.environment, elementId);
  const left: IAutoMovieBuiltPlacementBody | null = resolveBuiltPlacementBody({
    environment: props.environment,
    target: props.left,
    parts,
  });
  const right: IAutoMovieBuiltPlacementBody | null = resolveBuiltPlacementBody({
    environment: props.environment,
    target: props.right,
    parts,
  });
  const unresolved: ("left" | "right")[] = [];
  if (left === null) unresolved.push("left");
  if (right === null) unresolved.push("right");
  return {
    status:
      left === null || right === null
        ? "unresolved"
        : left.solids.some((leftPart: IAutoMovieSubjectBox): boolean =>
              right.solids.some((rightPart: IAutoMovieSubjectBox): boolean =>
                propBoundsOverlap(leftPart, rightPart),
              ),
            )
          ? "overlapping"
          : "separate",
    unresolved,
    leftBasis: left?.bounds.basis ?? null,
    rightBasis: right?.bounds.basis ?? null,
  };
};
