import {
  type IAutoMovieBuiltEnvironmentPlacementOverlap,
  type IAutoMovieBuiltPlacementBody,
  IAutoMovieBuiltPlacementOverlapResult,
  IAutoMovieSubjectBox,
} from "@automovie/interface";

import { propBoundsOverlap } from "../../film/internal/propBoundsOverlap";
import { builtEnvironmentElementPartBounds } from "./builtEnvironmentElementPartBounds";
import { resolveBuiltPlacementBody } from "./resolveBuiltPlacementBody";

/*
 * Test two named building bodies with the placement kernel's AABB overlap rule.
 *
 * The comparison delegates to propBoundsOverlap. For positive extents,
 * exact face contact is excluded; a zero-width plane or point strictly inside
 * another box can still pass its strict endpoint comparisons. Population
 * operands stay compact and each operand's basis identifies measured bounds
 * versus an extent-free fallback point.
 *
 * An element operand is tested part by part because a multi-part body's union
 * box can include gaps; a population keeps its one reported box. A missing
 * operand makes the status `unresolved`, is listed by side in left-then-right
 * order, and leaves its basis `null`.
 *
 * Parts are axis-aligned CPU box proxies, not mesh solids. Positive overlap can
 * over-admit actual geometry, and a population box can also include gaps
 * between members; `overlapping` is a bounds finding under those premises.
 */
export function builtEnvironmentPlacementOverlap(
  props: IAutoMovieBuiltEnvironmentPlacementOverlap.IProps,
): IAutoMovieBuiltPlacementOverlapResult {
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
}
