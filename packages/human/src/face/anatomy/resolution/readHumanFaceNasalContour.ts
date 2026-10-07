import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceNasalContourReading } from "./IHumanFaceNasalContourReading";

/**
 * Read the final Float32 skin's ordered source-authored nasal contour.
 *
 * Orthogonal projection follows the producer's fixed head-frame normal. The
 * polygon retains native boundary order; its shoelace area, longest chord and
 * perpendicular extent do not infer a basal camera or clinical tissue margin.
 * The first actual point is the translation origin. Missing registration,
 * invalid indices, non-finite or degenerate projection and a crossing contour
 * refuse by name. No sparse-region ordering or rest geometry substitutes.
 *
 * @evidence contracts/common.md#principled-implementation The exact registered order and final emitted coordinates define the source-projected quantity.
 * @evidence contracts/common.md#clear-and-simple-design One orthogonal chart supplies area and two extents.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing registration and invalid projections refuse without a replacement contour.
 * @evidence contracts/common.md#meaningful-documentation States the plane, order, precision, source qualification and refusal conditions.
 * @evidence contracts/modeling.md#spatial-conventions Metres and square metres in an orthogonal plane of the runtime head frame.
 * @evidenceExclude contracts/modeling.md#parameter-channels This report-only instrument does not move geometry.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The instrument creates no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The instrument reads emitted skin.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The source owns the contour incidence.
 * @evidence contracts/modeling.md#rendered-observation The context reads the same final Float32 geometry as the displayed and exported model.
 * @evidenceExclude contracts/anatomy.md#anatomical-source This is explicitly a source-authored projected polygon, not a clinical aperture protocol.
 * @evidenceExclude contracts/anatomy.md#permitted-range This instrument admits no personal input.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This report-only quantity supplies no inverse target.
 */
export function readHumanFaceNasalContour(
  context: IHumanFaceMeasurementContext,
  side: "left" | "right",
): IHumanFaceNasalContourReading {
  const matches =
    context.basis.nasalContours?.filter((record) => record.side === side) ?? [];
  if (matches.length !== 1)
    throw new Error(
      `The ${side} nasal source contour has no unique registration.`,
    );
  const contour = matches[0];
  const fail = (reason: string): never => {
    throw new Error(
      `The ${side} nasal source contour ${contour.generationSourceId}: ${reason}`,
    );
  };
  if (
    contour.protocol !== "authored-source-projected-contour/1" ||
    !contour.generationSourceId ||
    !contour.qualification.trim()
  )
    fail(
      "missing source identity, qualification or supported projection protocol.",
    );
  const sourceSurface = context.basis.surfaces.find(
    (surface) => surface.id === contour.surface,
  );
  if (sourceSurface?.sourcePartition?.generation !== contour.generationSourceId)
    fail(
      "ordered contour and actual skin do not share the owning source generation.",
    );
  const ids = contour.orderedVertices;
  if (
    ids.length < 3 ||
    ids.length !== contour.orderedNativeVertices.length ||
    new Set(ids).size !== ids.length ||
    new Set(contour.orderedNativeVertices).size !== ids.length
  )
    fail("ordered native correspondence is incomplete or duplicated.");
  if (
    !contour.orderedNativeVertices.every(
      (id) => Number.isInteger(id) && id >= 0,
    )
  )
    fail("original native provenance contains an invalid witness.");
  const n = [
    contour.projectionNormal.x,
    contour.projectionNormal.y,
    contour.projectionNormal.z,
  ];
  const length = Math.hypot(...n);
  if (!Number.isFinite(length) || Math.abs(length - 1) > 1e-6)
    fail("projection normal is not a finite unit direction.");
  const seed = n.map(Math.abs).indexOf(Math.min(...n.map(Math.abs)));
  const u = [seed === 0 ? 1 : 0, seed === 1 ? 1 : 0, seed === 2 ? 1 : 0];
  for (let axis = 0; axis < 3; axis++)
    u[axis] -= (n[axis] * n[seed]) / (length * length);
  const ul = Math.hypot(...u);
  for (let axis = 0; axis < 3; axis++) u[axis] /= ul;
  const v = [
    n[1] * u[2] - n[2] * u[1],
    n[2] * u[0] - n[0] * u[2],
    n[0] * u[1] - n[1] * u[0],
  ].map((value) => value / length);
  const skin = context.surface(contour.surface);
  for (const id of ids)
    if (!Number.isInteger(id) || id < 0 || id * 3 + 2 >= skin.positions.length)
      fail("skin index is unavailable.");
  const origin = ids[0] * 3;
  const points = ids.map((id) => {
    const delta = [0, 1, 2].map(
      (axis) => skin.positions[id * 3 + axis] - skin.positions[origin + axis],
    );
    return [
      delta.reduce((sum, value, axis) => sum + value * u[axis], 0),
      delta.reduce((sum, value, axis) => sum + value * v[axis], 0),
    ];
  });
  if (!points.flat().every(Number.isFinite))
    fail("final projected coordinates are non-finite.");
  const orient = (a: number[], b: number[], c: number[]): number =>
    (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  let twiceArea = 0;
  let longAxis = 0;
  let direction = [0, 0];
  for (let i = 0; i < points.length; i++) {
    const a = points[i],
      b = points[(i + 1) % points.length];
    if (a[0] === b[0] && a[1] === b[1])
      fail("an ordered edge collapses in the source plane.");
    twiceArea += a[0] * b[1] - b[0] * a[1];
    for (let j = i + 1; j < points.length; j++) {
      const c = points[j],
        d = points[(j + 1) % points.length];
      const distance = Math.hypot(c[0] - a[0], c[1] - a[1]);
      if (distance > longAxis) {
        longAxis = distance;
        direction = [(c[0] - a[0]) / distance, (c[1] - a[1]) / distance];
      }
      if (j === i + 1 || (i === 0 && j === points.length - 1)) continue;
      const overlap = [0, 1].every(
        (axis) =>
          Math.max(Math.min(a[axis], b[axis]), Math.min(c[axis], d[axis])) <=
          Math.min(Math.max(a[axis], b[axis]), Math.max(c[axis], d[axis])),
      );
      if (
        overlap &&
        orient(a, b, c) * orient(a, b, d) <= 0 &&
        orient(c, d, a) * orient(c, d, b) <= 0
      )
        fail("ordered boundary crosses in the registered source plane.");
    }
  }
  const across = points.map(
    (point) => -point[0] * direction[1] + point[1] * direction[0],
  );
  const area = Math.abs(twiceArea) / 2;
  const shortAxis = Math.max(...across) - Math.min(...across);
  if (!(area > 0) || !(longAxis > 0) || !(shortAxis > 0))
    fail("the final source projection is degenerate.");
  return { area, longAxis, shortAxis };
}
