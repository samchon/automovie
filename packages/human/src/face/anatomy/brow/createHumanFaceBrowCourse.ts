import { Vector3 } from "@automovie/engine";

import type { IHumanFaceSkinChartSpan } from "../skin/IHumanFaceSkinChartSpan";
import type { IHumanFaceBrowCourse } from "./IHumanFaceBrowCourse";
import { createHumanFaceSkinChartCourse } from "../skin/createHumanFaceSkinChartCourse";

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
 * @evidence contracts/common.md#principled-implementation Native affine spans supply their own hypot lengths and cumulative stations; one support-facet frame defines the actual initial tangent decomposition.
 * @evidence contracts/common.md#clear-and-simple-design Consumes the source chart's actual intervals and owns only physical station lookup and initial frame.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No sample-dependent metric substitution, input saturation, iteration budget or clinical epsilon is introduced.
 * @evidence contracts/common.md#meaningful-documentation States zero spans, support selection, metric meaning and representability refusal.
 * @evidence contracts/modeling.md#spatial-conventions The guide, course and frames stay in head-frame metres; unit directions carry no length.
 * @evidence contracts/modeling.md#shared-boundaries Source-chart continuity remains the native walker condition and every frame reads its retained barycentric support without reseating.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Compiles an internal course on an existing skin part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Introduces no authoring quantity.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The shaft consumer owns its requested render resolution.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembled brow consumer owns current observations.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Native geometry is not a clinical shaft trajectory or emergence measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing profile and actual emitted-skin contact guards remain unchanged.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Consumes the builder's source-derived guide, not a personal curve.
 */
export function createHumanFaceBrowCourse(
  nativeSpans: readonly IHumanFaceSkinChartSpan[],
): IHumanFaceBrowCourse {
  const course = createHumanFaceSkinChartCourse(nativeSpans),
    spans = course.spans, lengthMetres = course.totalLengthMetres;
  if (spans.length === 0)
    throw new Error("An eyebrow fibre needs a nonzero path along the skin.");
  const first = spans[0];
  const tangent = Vector3.normalize(Vector3.create(
    ...first.end.map((value, axis) => value - first.start[axis]),
  ));
  const support = Vector3.create(...first.frameAt(0).face);
  const normal = Vector3.normalize(Vector3.subtract(
    support, Vector3.scale(tangent, Vector3.dot(support, tangent)),
  ));
  if (![tangent.x, tangent.y, tangent.z, normal.x, normal.y, normal.z].every(Number.isFinite) ||
      Vector3.length(tangent) === 0 || Vector3.length(normal) === 0)
    throw new Error("A brow course needs its native tangent and support facet.");
  return {
    lengthMetres,
    rootTangent: [tangent.x, tangent.y, tangent.z],
    rootNormal: [normal.x, normal.y, normal.z],
    frameAt: course.frameAt,
  };
}
