import type { IHumanFaceSkinChartCourse } from "../skin/IHumanFaceSkinChartCourse";
import type { IHumanFaceSkinChartMetricSpan } from "../skin/IHumanFaceSkinChartMetricSpan";
import type { IAutoMovieVector3 } from "@automovie/interface";

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
 *
 * @evidence contracts/common.md#principled-implementation The first positive native metric span and its supporting facet supply an orthonormal root tangent/normal frame for the same accumulated course.
 * @evidence contracts/common.md#clear-and-simple-design The shared skin-chart metric compiler owns positive-span admission and frame lookup; the brow adapter adds only its emergence frame.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero-course or collapsed tangent/normal refuses rather than supplying a head-axis proxy or another nearest feature.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes current native arc distance, free-guide parameters, offset-shaft length and facet-derived numerical orthogonalization.
 * @evidence contracts/performance.md#efficient-algorithms Compiling P native spans scans and copies their endpoints once; root-frame construction is constant work, and forwarded frame lookup retains the shared linear span search.
 * @evidence contracts/performance.md#reuse-equivalent-work The result forwards the compiled course's frameAt closure instead of compiling a second sampler or repeating station accumulation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned root vectors and frame closure belong to the course; closure retention scales with compiled spans and original host callbacks for its caller-owned lifetime.
 */
export function createHumanFaceBrowCourse(
  nativeSpans: readonly IHumanFaceSkinChartSpan[],
): IHumanFaceBrowCourse {
  const course: IHumanFaceSkinChartCourse = createHumanFaceSkinChartCourse(nativeSpans),
    spans: readonly IHumanFaceSkinChartMetricSpan[] = course.spans,
    lengthMetres: number = course.totalLengthMetres;
  if (spans.length === 0)
    throw new Error("An eyebrow fibre needs a nonzero path along the skin.");
  const first: IHumanFaceSkinChartMetricSpan = spans[0];
  const tangent: IAutoMovieVector3 = Vector3.normalize(
    Vector3.create(
      ...first.end.map((value: number, axis: number): number  => value - first.start[axis]),
    ),
  );
  const support: IAutoMovieVector3 = Vector3.create(...first.frameAt(0).face);
  const normal: IAutoMovieVector3 = Vector3.normalize(
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
