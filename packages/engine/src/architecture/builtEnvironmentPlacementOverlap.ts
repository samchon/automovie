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
 * Test two named building bodies for positive-volume world-bounds overlap.
 *
 * The comparison delegates to {@link propBoundsOverlap}, which treats exact
 * face contact as contact rather than intrusion. Population operands stay
 * compact, and every operand's basis remains explicit in the answer, which is
 * what keeps a `separate` verdict readable: a body the record carries no
 * vertices for is an extent-free point that clears almost everything, and the
 * basis is how the caller tells that from a measured miss.
 *
 * An element operand is tested part by part, because a multi-part body's union
 * box is mostly air; a population keeps its one reported box. A missing
 * operand makes the status `unresolved`, is listed by side in left-then-right
 * order, and leaves its basis `null`.
 *
 * @evidence contracts/common.md#principled-implementation Resolves each side once through `resolveBuiltPlacementBody` and reports overlap when any solid of one side shares positive volume with any solid of the other under `propBoundsOverlap`, the placement kernel's exclusive-contact test.
 * @evidence contracts/common.md#clear-and-simple-design Shares body resolution and the part-versus-union rule with the bounds query and the sweep, so this query owns only the pair verdict and the unresolved listing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no body or production; an unresolved side is reported as such rather than defaulted to `separate`, and face contact is excluded by the shared kernel rather than by a tolerance chosen here.
 * @evidence contracts/common.md#meaningful-documentation States the contact rule, that populations stay compact, why the basis is returned, that elements are tested by part, and the unresolved status, its side order and its null basis.
 * @evidence contracts/performance.md#efficient-algorithms Two single-element part queries, each linear in the element count plus that element's vertex count, then a part-by-part test costing the product of the two part counts with an early exit on the first meeting.
 * @evidence contracts/performance.md#reuse-equivalent-work Each side's part boxes are measured once and serve both as its reported box and as its solids, where the earlier form measured every element side twice; nothing is cached across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Keeps nothing after returning; the caller owns the small result record.
 * @author Samchon
 */
export const builtEnvironmentPlacementOverlap = (props: {
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
  const right: IAutoMovieBuiltPlacementBody | null = resolveBuiltPlacementBody(
    { environment: props.environment, target: props.right, parts },
  );
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
