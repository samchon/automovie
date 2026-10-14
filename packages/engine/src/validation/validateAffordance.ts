import { IAutoMovieAffordance, IAutoMovieVector3 } from "@automovie/interface";

import { convexHull2D } from "../math/convexHull2D";
import { ViolationCollector } from "./ViolationCollector";
import { collectNonEmptyId } from "./collectNonEmptyId";
import { validateTransformScalars } from "./validateTransformScalars";

/**
 * Admit nonempty id and finite frame, then require stack-top extent plan points to span area or point-like kinds to have null extent.
 *
 * @evidence contracts/common.md#principled-implementation Admit nonempty id and finite frame, then require stack-top extent plan points to span area or point-like kinds to have null extent.
 * @evidence contracts/common.md#clear-and-simple-design Transform scalar admission and convexHull2D own frame/collinearity rules; affordance kind owns extent meaning.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only XZ finiteness is checked for the extent, and its convex hull is not a simple authored-polygon certificate.
 * @evidence contracts/common.md#meaningful-documentation Null extent semantics and exact caller-relative frame/point fault paths are stated.
 * @evidence contracts/performance.md#efficient-algorithms P extent points require linear finite checks and O(P log P) hull construction when admitted.
 * @evidence contracts/performance.md#reuse-equivalent-work Canonical transform and hull owners are shared; changed affordance data is checked anew.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns diagnostic rows, while temporary hull storage releases and no seat/contact solve is created.
 */
export const validateAffordance: (
  affordance: IAutoMovieAffordance,
  path: string,
  collector: ViolationCollector,
) => void = (
  affordance: IAutoMovieAffordance,
  path: string,
  collector: ViolationCollector,
): void => {
  collectNonEmptyId(affordance.id, `${path}.id`, "affordance id", collector);
  validateTransformScalars({
    transform: affordance.frame,
    path: `${path}.frame`,
    label: "affordance frame",
    collector,
  });

  if (affordance.kind !== "stack-top") {
    if (affordance.extent !== null)
      collector.push(
        "type",
        `${path}.extent`,
        `a "${affordance.kind}" affordance is point-like and must have extent null`,
        affordance.extent,
      );
    return;
  }

  const extent: IAutoMovieVector3[] | null = affordance.extent;
  if (extent === null) {
    collector.push(
      "type",
      `${path}.extent`,
      'a "stack-top" affordance needs an extent polygon (the supporting face)',
      extent,
    );
    return;
  }
  if (extent.length < 3)
    collector.push(
      "type",
      `${path}.extent`,
      `a stack-top extent needs at least 3 points, but had ${extent.length}`,
      extent.length,
    );
  let planFinite: boolean = true;
  extent.forEach((point: IAutoMovieVector3, i: number): void => {
    for (const axis of ["x", "z"] as const)
      if (!Number.isFinite(point[axis])) {
        planFinite = false;
        collector.push(
          "range",
          `${path}.extent[${i}].${axis}`,
          `extent ${axis} must be finite, but was ${point[axis]}`,
          point[axis],
        );
      }
  });
  if (planFinite && extent.length >= 3 && convexHull2D(extent).length < 3)
    collector.push(
      "type",
      `${path}.extent`,
      "stack-top extent points are collinear: they enclose no area",
      extent,
    );
};
