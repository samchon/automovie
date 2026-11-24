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
 * to be finite and positive, admit a surface's drawable outline, then require
 * stack-top extent plan points to span area or point-like kinds to have null
 * extent.
 *
 * An `outline` belongs to a `surface` with a `width` and `depth`; it has at
 * least three finite XZ points, each inside the width by depth rectangle
 * centred on the frame within a nanometre, encloses positive area and is
 * simple, no two of its non-adjacent edges meeting, because the render clips
 * the surface's graphics to it.
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

  if (affordance.outline !== undefined)
    validateOutline(
      affordance,
      affordance.outline,
      `${path}.outline`,
      collector,
    );

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

/**
 * How far past its rectangle an outline point may lie, metres: the rounding of
 * a corner computed from a circumradius.
 */
const OUTLINE_TOLERANCE: number = 1e-9;

/**
 * Admit a surface's drawable outline: on a sized `surface`, at least three
 * finite XZ points inside its rectangle, positive area, and no two non-adjacent
 * edges meeting.
 */
function validateOutline(
  affordance: IAutoMovieAffordance,
  outline: IAutoMovieVector3[],
  path: string,
  collector: IAutoMovieViolationCollector,
): void {
  if (
    affordance.kind !== "surface" ||
    affordance.width === undefined ||
    affordance.depth === undefined
  ) {
    collector.push(
      "type",
      path,
      "only a `surface` with a width and depth carries an outline",
      outline,
    );
    return;
  }
  if (outline.length < 3) {
    collector.push(
      "type",
      path,
      `an outline needs at least 3 points, but had ${outline.length}`,
      outline.length,
    );
    return;
  }
  const halfWidth: number = affordance.width / 2;
  const halfDepth: number = affordance.depth / 2;
  let inside: boolean = true;
  outline.forEach((point: IAutoMovieVector3, i: number): void => {
    for (const [axis, half] of [
      ["x", halfWidth],
      ["z", halfDepth],
    ] as const)
      if (
        !(
          Number.isFinite(point[axis]) &&
          Math.abs(point[axis]) <= half + OUTLINE_TOLERANCE
        )
      ) {
        inside = false;
        collector.push(
          "range",
          `${path}[${i}].${axis}`,
          `an outline ${axis} must be finite and within ±${half} m of the frame, but was ${point[axis]}`,
          point[axis],
        );
      }
  });
  if (!inside) return;
  const n: number = outline.length;
  let twiceArea: number = 0;
  for (let i: number = 0; i < n; ++i) {
    const a: IAutoMovieVector3 = outline[i]!;
    const b: IAutoMovieVector3 = outline[(i + 1) % n]!;
    twiceArea += a.x * b.z - b.x * a.z;
  }
  if (twiceArea === 0) {
    collector.push("type", path, "an outline encloses no area", outline);
    return;
  }
  for (let i: number = 0; i < n; ++i)
    for (let j: number = i + 2; j < n; ++j) {
      if (i === 0 && j === n - 1) continue;
      if (
        segmentsMeet(
          outline[i]!,
          outline[i + 1]!,
          outline[j]!,
          outline[(j + 1) % n]!,
        )
      ) {
        collector.push(
          "type",
          path,
          `an outline must be simple, but its edges ${i} and ${j} meet`,
          outline,
        );
        return;
      }
    }
}

/** Whether the closed XZ segments `ab` and `cd` share a point. */
function segmentsMeet(
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  c: IAutoMovieVector3,
  d: IAutoMovieVector3,
): boolean {
  const side = (
    p: IAutoMovieVector3,
    q: IAutoMovieVector3,
    r: IAutoMovieVector3,
  ): number => Math.sign((q.x - p.x) * (r.z - p.z) - (q.z - p.z) * (r.x - p.x));
  const within = (
    p: IAutoMovieVector3,
    q: IAutoMovieVector3,
    r: IAutoMovieVector3,
  ): boolean =>
    Math.min(p.x, q.x) <= r.x &&
    r.x <= Math.max(p.x, q.x) &&
    Math.min(p.z, q.z) <= r.z &&
    r.z <= Math.max(p.z, q.z);
  const d1: number = side(c, d, a);
  const d2: number = side(c, d, b);
  const d3: number = side(a, b, c);
  const d4: number = side(a, b, d);
  if (d1 * d2 < 0 && d3 * d4 < 0) return true;
  return (
    (d1 === 0 && within(c, d, a)) ||
    (d2 === 0 && within(c, d, b)) ||
    (d3 === 0 && within(a, b, c)) ||
    (d4 === 0 && within(a, b, d))
  );
}
