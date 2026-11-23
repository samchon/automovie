import {
  IAutoMovieAffordance,
  IAutoMovieVector3,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { convexHull2D } from "../math/convexHull2D";
import { collectNonEmptyId } from "./collectNonEmptyId";
import { validateTransformScalars } from "./validateTransformScalars";

/**
 * The optional dimensions of an affordance, each a positive length in metres,
 * angle in degrees or load in newtons when present.
 */
const DIMENSIONS: readonly (
  | "aperture"
  | "depth"
  | "back"
  | "length"
  | "width"
  | "height"
  | "radius"
  | "load"
  | "travel"
  | "reverse"
)[] = [
  "aperture",
  "depth",
  "back",
  "length",
  "width",
  "height",
  "radius",
  "load",
  "travel",
  "reverse",
];

/**
 * Admit nonempty id and finite frame, require every optional dimension present
 * to be finite and positive, then require stack-top extent plan points to span
 * area or point-like kinds to have null extent.
 */
export const validateAffordance: (
  affordance: IAutoMovieAffordance,
  path: string,
  collector: IAutoMovieViolationCollector,
) => void = (
  affordance: IAutoMovieAffordance,
  path: string,
  collector: IAutoMovieViolationCollector,
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
