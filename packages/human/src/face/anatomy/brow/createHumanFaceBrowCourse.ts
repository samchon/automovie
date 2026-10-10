import { Vector3 } from "@automovie/engine";

import type { IHumanFaceSkinChartSpan } from "../skin/IHumanFaceSkinChartSpan";
import { createHumanFaceSkinChartCourse } from "../skin/createHumanFaceSkinChartCourse";
import type { IHumanFaceBrowCourse } from "./IHumanFaceBrowCourse";

/**
 * Read a lifted source-chart course by physical native arc distance.
 * The chart has retained every intervening actual triangle and barycentric
 * interval, so frame lookup never reseats a free point on another sheet.
 * Positive spans retain guide order; zero-length native pieces add no
 * distance. An unrepresentable positive station advance refuses.
 *
 * The first positive span retains its actual supporting facet.
 * Its normal is orthogonalized against that span solely to construct the
 * numerical tangent frame. It is not a head axis, a smoothed proxy or an
 * authored orientation. Distances address this course itself; they never
 * address the free guide's parameter or the final offset shaft's arc length.
 */
export function createHumanFaceBrowCourse(
  nativeSpans: readonly IHumanFaceSkinChartSpan[],
): IHumanFaceBrowCourse {
  const course = createHumanFaceSkinChartCourse(nativeSpans),
    spans = course.spans,
    lengthMetres = course.totalLengthMetres;
  if (spans.length === 0)
    throw new Error("An eyebrow fibre needs a nonzero path along the skin.");
  const first = spans[0];
  const tangent = Vector3.normalize(
    Vector3.create(
      ...first.end.map((value, axis) => value - first.start[axis]),
    ),
  );
  const support = Vector3.create(...first.frameAt(0).face);
  const normal = Vector3.normalize(
    Vector3.subtract(
      support,
      Vector3.scale(tangent, Vector3.dot(support, tangent)),
    ),
  );
  if (
    ![tangent.x, tangent.y, tangent.z, normal.x, normal.y, normal.z].every(
      Number.isFinite,
    ) ||
    Vector3.length(tangent) === 0 ||
    Vector3.length(normal) === 0
  )
    throw new Error(
      "A brow course needs its native tangent and support facet.",
    );
  return {
    lengthMetres,
    rootTangent: [tangent.x, tangent.y, tangent.z],
    rootNormal: [normal.x, normal.y, normal.z],
    frameAt: course.frameAt,
  };
}
