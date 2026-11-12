import { IAutoMovieAffordance, IAutoMovieVector3 } from "@automovie/interface";

import { convexHull2D } from "../math/convexHull2D";
import { ViolationCollector } from "./ViolationCollector";
import { collectNonEmptyId } from "./collectNonEmptyId";
import { validateTransformScalars } from "./validateTransformScalars";

/** The optional dimensions of an affordance, each a positive length in metres or angle in degrees when present. */
const DIMENSIONS: readonly (
  | "aperture"
  | "depth"
  | "back"
  | "length"
  | "width"
  | "height"
  | "radius"
  | "travel"
)[] = [
  "aperture",
  "depth",
  "back",
  "length",
  "width",
  "height",
  "radius",
  "travel",
];

/**
 * Admit nonempty id and finite frame, require every optional dimension present to be finite and positive, then require stack-top extent plan points to span area or point-like kinds to have null extent.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Admit nonempty id and finite frame, the positivity `IAutoMovieAffordance` states for its optional dimensions, then require stack-top extent plan points to span area or point-like kinds to have null extent.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Transform scalar admission and convexHull2D own frame/collinearity rules; affordance kind owns extent meaning.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only XZ finiteness is checked for the extent, and its convex hull is not a simple authored-polygon certificate.
 * @evidence contracts/development/common.md#meaningful-documentation Null extent semantics and exact caller-relative frame, point and dimension fault paths (`<path>.<dimension>`) are stated.
 * @evidence contracts/development/implementation.md#efficient-algorithms P extent points require linear finite checks and O(P log P) hull construction when admitted.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Canonical transform and hull owners are shared; changed affordance data is checked anew.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns diagnostic rows, while temporary hull storage releases and no seat/contact solve is created.
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

  // Every optional dimension an action law reads is a positive length or angle.
  for (const name of DIMENSIONS) {
    const value: number | undefined = affordance[name];
    if (value !== undefined && !(Number.isFinite(value) && value > 0))
      collector.push(
        "range",
        `${path}.${name}`,
        `affordance ${name} must be a finite number > 0, but was ${value}`,
        value,
      );
  }

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
