import { convexHull2D } from "../math/convexHull2D";
import { ViolationCollector } from "./ViolationCollector";
import { validateNonEmptyId } from "./validateNonEmptyId";
import { validateTransformScalars } from "./validateTransformScalars";
import { IAutoMovieAffordance } from "@automovie/interface";

/**
 * Validate one {@link IAutoMovieAffordance}: a non-empty id, finite frame
 * scalars, and extent semantics by kind: a `stack-top` needs a well-formed
 * supporting face (>= 3 finite, non-collinear plan points), while point-like
 * kinds (`handle` / `socket` / `hook`) must leave `extent` null. The closed
 * kind union makes an unknown kind structurally impossible.
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation Admits the finite interaction frame before checking point-like or planar support extent semantics.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure Admits the finite interaction frame before checking point-like or planar support extent semantics.
 */
export const validateAffordance = (
  affordance: IAutoMovieAffordance,
  path: string,
  collector: ViolationCollector,
): void => {
  validateNonEmptyId(affordance.id, `${path}.id`, "affordance id", collector);
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

  const extent = affordance.extent;
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
  let planFinite = true;
  extent.forEach((point, i) => {
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
