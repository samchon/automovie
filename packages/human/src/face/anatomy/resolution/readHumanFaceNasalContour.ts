import type { IAutoMovieHumanFaceNasalContour as ImportedIAutoMovieHumanFaceNasalContour, IAutoMovieHumanFaceBasisSurface as ImportedIAutoMovieHumanFaceBasisSurface, IHumanFaceMeasurementSurface as ImportedIHumanFaceMeasurementSurface } from "@automovie/human";
import type { IHumanFaceMeasurementContext } from "./IHumanFaceMeasurementContext";
import type { IHumanFaceNasalContourReading } from "./IHumanFaceNasalContourReading";

/**
 * Read the final Float32 skin's ordered source-authored nasal contour.
 *
 * Orthogonal projection follows the producer's fixed head-frame normal. The polygon retains native boundary order; its shoelace area, longest chord and perpendicular extent do not infer a basal camera or clinical tissue margin. The first actual point is the translation origin. Missing registration, invalid indices, non-finite or degenerate projection and a crossing contour refuse by name. No sparse-region ordering or rest geometry substitutes.
 *
 * @evidence contracts/common.md#principled-implementation Qualified ordered current nasal correspondence projects into a registered plane for polygon area and chord extents.
 * @evidence contracts/common.md#clear-and-simple-design Generation/protocol/qualification checks bind the instrument to its supplied source correspondence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Crossing contours and unusable plane normals refuse; supplied generation metadata does not independently prove publisher correspondence acquisition.
 * @evidence contracts/common.md#meaningful-documentation Current Float32 source points yield model planar area or length, with square/linear metre conversion at output.
 * @evidence contracts/performance.md#efficient-algorithms Pairwise crossing/chord work is quadratic in contour points and projection/shoelace work is linear.
 * @evidence contracts/performance.md#reuse-equivalent-work One projected contour supplies area, longest chord and perpendicular extent.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Projected points and pairwise temporaries are per-call; only a scalar or gap escapes.
 */
export function readHumanFaceNasalContour(
  context: IHumanFaceMeasurementContext,
  side: "left" | "right",
): IHumanFaceNasalContourReading {
  const matches: ImportedIAutoMovieHumanFaceNasalContour[] =
    context.basis.nasalContours?.filter((record: ImportedIAutoMovieHumanFaceNasalContour): boolean => record.side === side) ?? [];
  if (matches.length !== 1)
    throw new Error(
      `The ${side} nasal source contour has no unique registration.`,
    );
  const contour: ImportedIAutoMovieHumanFaceNasalContour = matches[0];
  const fail: (reason: string) => never = (reason: string): never => {
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
  const sourceSurface: ImportedIAutoMovieHumanFaceBasisSurface | undefined = context.basis.surfaces.find(
    (surface: ImportedIAutoMovieHumanFaceBasisSurface): boolean => surface.id === contour.surface,
  );
  if (sourceSurface?.sourcePartition?.generation !== contour.generationSourceId)
    fail(
      "ordered contour and actual skin do not share the owning source generation.",
    );
  const ids: number[] = contour.orderedVertices;
  if (
    ids.length < 3 ||
    ids.length !== contour.orderedNativeVertices.length ||
    new Set(ids).size !== ids.length ||
    new Set(contour.orderedNativeVertices).size !== ids.length
  )
    fail("ordered native correspondence is incomplete or duplicated.");
  if (
    !contour.orderedNativeVertices.every(
      (id: number): boolean => Number.isInteger(id) && id >= 0,
    )
  )
    fail("original native provenance contains an invalid witness.");
  const n: number[] = [
    contour.projectionNormal.x,
    contour.projectionNormal.y,
    contour.projectionNormal.z,
  ];
  const length: number = Math.hypot(...n);
  if (!Number.isFinite(length) || Math.abs(length - 1) > 1e-6)
    fail("projection normal is not a finite unit direction.");
  const seed: number = n.map(Math.abs).indexOf(Math.min(...n.map(Math.abs)));
  const u: number[] = [seed === 0 ? 1 : 0, seed === 1 ? 1 : 0, seed === 2 ? 1 : 0];
  for (let axis: number = 0; axis < 3; axis++)
    u[axis] -= (n[axis] * n[seed]) / (length * length);
  const ul: number = Math.hypot(...u);
  for (let axis: number = 0; axis < 3; axis++) u[axis] /= ul;
  const v: number[] = [
    n[1] * u[2] - n[2] * u[1],
    n[2] * u[0] - n[0] * u[2],
    n[0] * u[1] - n[1] * u[0],
  ].map((value: number): number => value / length);
  const skin: ImportedIHumanFaceMeasurementSurface = context.surface(contour.surface);
  for (const id of ids)
    if (!Number.isInteger(id) || id < 0 || id * 3 + 2 >= skin.positions.length)
      fail("skin index is unavailable.");
  const origin: number = ids[0] * 3;
  const points: number[][] = ids.map((id: number): number[] => {
    const delta: number[] = [0, 1, 2].map(
      (axis: number): number => skin.positions[id * 3 + axis] - skin.positions[origin + axis],
    );
    return [
      delta.reduce((sum: number, value: number, axis: number): number => sum + value * u[axis], 0),
      delta.reduce((sum: number, value: number, axis: number): number => sum + value * v[axis], 0),
    ];
  });
  if (!points.flat().every(Number.isFinite))
    fail("final projected coordinates are non-finite.");
  const orient: (a: number[], b: number[], c: number[]) => number = (a: number[], b: number[], c: number[]): number =>
    (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  let twiceArea: number = 0;
  let longAxis: number = 0;
  let direction: number[] = [0, 0];
  for (let i: number = 0; i < points.length; i++) {
    const a: number[] = points[i],
      b: number[] = points[(i + 1) % points.length];
    if (a[0] === b[0] && a[1] === b[1])
      fail("an ordered edge collapses in the source plane.");
    twiceArea += a[0] * b[1] - b[0] * a[1];
    for (let j: number = i + 1; j < points.length; j++) {
      const c: number[] = points[j],
        d: number[] = points[(j + 1) % points.length];
      const distance: number = Math.hypot(c[0] - a[0], c[1] - a[1]);
      if (distance > longAxis) {
        longAxis = distance;
        direction = [(c[0] - a[0]) / distance, (c[1] - a[1]) / distance];
      }
      if (j === i + 1 || (i === 0 && j === points.length - 1)) continue;
      const overlap: boolean = [0, 1].every(
        (axis: number): boolean =>
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
  const across: number[] = points.map(
    (point: number[]): number => -point[0] * direction[1] + point[1] * direction[0],
  );
  const area: number = Math.abs(twiceArea) / 2;
  const shortAxis: number = Math.max(...across) - Math.min(...across);
  if (!(area > 0) || !(longAxis > 0) || !(shortAxis > 0))
    fail("the final source projection is degenerate.");
  return { area, longAxis, shortAxis };
}
