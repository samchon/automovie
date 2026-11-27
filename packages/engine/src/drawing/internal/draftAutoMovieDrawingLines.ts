import {
  AutoMovieDrawingRole,
  IAutoMovieBuiltBoundary,
  IAutoMovieBuiltElement,
  type IAutoMovieDraftDrawingLines,
  type IAutoMovieDrawingDesignIndex,
  type IAutoMovieDrawingEdge,
  IAutoMovieDrawingFrame,
  IAutoMovieDrawingLine,
  IAutoMovieDrawingPoint,
  type IAutoMovieDrawingTriangle,
  IAutoMovieModel,
  IAutoMovieVector3,
} from "@automovie/interface";

import { compareAutoMovieRenderIds } from "../../render/internal/compareAutoMovieRenderIds";
import { autoMovieBoundaryShellTriangles } from "./autoMovieBoundaryShellTriangles";
import { autoMovieDrawingCutEdges } from "./autoMovieDrawingCutEdges";
import { autoMovieDrawingElementTriangles } from "./autoMovieDrawingElementTriangles";
import { autoMovieDrawingPlaneDistance } from "./autoMovieDrawingPlaneDistance";
import { autoMovieDrawingRange } from "./autoMovieDrawingRange";
import { autoMovieDrawingSilhouetteEdges } from "./autoMovieDrawingSilhouetteEdges";
import { clipAutoMovieDrawingTriangles } from "./clipAutoMovieDrawingTriangles";
import { AutoMovieEngineDrawingEpsilon } from "../AutoMovieEngineDrawingEpsilon";
import { AutoMovieEngineDrawingRoles } from "../AutoMovieEngineDrawingRoles";
import { projectAutoMovieDrawingPoint } from "./projectAutoMovieDrawingPoint";
import { roundAutoMovieDrawingPoint } from "./roundAutoMovieDrawingPoint";

/*
 * Draft every line one view draws of one validated design, classified by its
 * relation to the cut plane, deduplicated and in canonical order.
 *
 * Drawables are the elements with an environment-owned model and the boundaries
 * that carry a face and are realized by no element, each kept only when `drawn`
 * accepts its kind and space; a boundary is accepted through any space it
 * separates and carries its first space, so a party wall reads the same on both
 * rooms' sheets. An element citing a builder-owned runtime model cannot be
 * drawn and is counted in `unresolvedModels` for the caller's gap.
 *
 * Each drawable is classified by its nearest and deepest corner: wholly on the
 * viewer's side of a cut it is `overhead` while within `view.overhead` and
 * omitted beyond it; wholly deeper than `view.depth` it is `hidden`; otherwise
 * a cut view drafts its section as `cut` and the silhouette of what stands
 * beyond the plane as `projected`. Silhouettes lying in the cut plane are
 * dropped because the cut already draws them. Points are rounded onto the grid,
 * zero-length strokes are dropped, each stroke runs from its smaller point,
 * identical strokes are merged, and the result is sorted by role order, layer,
 * owner and points.
 * Parameter props.environment: The validated design.
 * Parameter props.view: The view whose depth bands apply.
 * Parameter props.frame: The view's resolved page basis.
 * Parameter props.design: Index of `environment`.
 * Parameter props.cut: Whether the view's projection cuts.
 * Parameter props.drawn: Whether a kind and space pass the view's filters.
 * Returns: The sorted lines and the count of undrawable elements.
 */
export const draftAutoMovieDrawingLines = (
  props: IAutoMovieDraftDrawingLines.IProps,
): IAutoMovieDraftDrawingLines.IResult => {
  const { environment, view, frame, design, cut, drawn } = props;
  const drawables: IDrawable[] = [];
  let unresolvedModels: number = 0;
  for (const element of environment.elements) {
    if (!drawn(element.kind, element.space)) continue;
    if (element.model === null) continue;
    const model: IAutoMovieModel | undefined = design.models.get(element.model);
    if (model === undefined) {
      ++unresolvedModels;
      continue;
    }
    drawables.push(elementDrawable(design, element, model));
  }
  for (const boundary of environment.boundaries) {
    if (boundary.face === undefined || boundary.elements.length !== 0) continue;
    if (
      !boundary.spaces.some((candidate: string): boolean =>
        drawn(boundary.kind, candidate),
      )
    )
      continue;
    drawables.push(boundaryDrawable(boundary));
  }

  const drafted: IAutoMovieDrawingLine[] = [];
  for (const drawable of drawables) {
    if (drawable.triangles.length === 0) continue;
    const distance: { min: number; max: number } = autoMovieDrawingRange(
      cornerDistances(frame, drawable.triangles),
    );
    if (cut && distance.min > AutoMovieEngineDrawingEpsilon) {
      if (view.overhead === null || distance.min > view.overhead) continue;
      draftSilhouette(drafted, drawable, "overhead", frame, cut);
      continue;
    }
    if (view.depth !== null && distance.max < -view.depth) {
      draftSilhouette(drafted, drawable, "hidden", frame, cut);
      continue;
    }
    if (cut)
      for (const edge of autoMovieDrawingCutEdges(frame, drawable.triangles))
        draftEdge(drafted, drawable, "cut", frame, edge);
    draftSilhouette(drafted, drawable, "projected", frame, cut);
  }

  // Two edges of one solid can project onto one page stroke, such as the near
  // and far rings of a wall seen face-on, and a drawing draws each stroke once.
  const unique: Map<string, IAutoMovieDrawingLine> = new Map();
  for (const line of drafted) unique.set(lineKey(line), line);
  return {
    lines: [...unique.values()].sort(compareLines),
    unresolvedModels,
  };
};

/*
 * One thing the view draws, reduced to what drafting needs to know about it.
 */
interface IDrawable {
  id: string;
  kind: string;
  space: string | null;
  triangles: IAutoMovieDrawingTriangle[];
}

/*
 * An element placed in the world, carrying its own kind and space.
 */
const elementDrawable = (
  design: IAutoMovieDrawingDesignIndex,
  element: IAutoMovieBuiltElement,
  model: IAutoMovieModel,
): IDrawable => ({
  id: element.id,
  kind: element.kind,
  space: element.space,
  triangles: autoMovieDrawingElementTriangles(design, element, model),
});

/*
 * A face-only boundary's closed slab, carrying its first space.
 */
const boundaryDrawable = (boundary: IAutoMovieBuiltBoundary): IDrawable => ({
  id: boundary.id,
  kind: boundary.kind,
  space: boundary.spaces[0]!,
  triangles: autoMovieBoundaryShellTriangles(boundary.face!),
});

/*
 * Every triangle corner's signed distance from the cut plane.
 */
function* cornerDistances(
  frame: IAutoMovieDrawingFrame,
  triangles: readonly IAutoMovieDrawingTriangle[],
): Generator<number, void, undefined> {
  for (const triangle of triangles) {
    yield autoMovieDrawingPlaneDistance(frame, triangle.a);
    yield autoMovieDrawingPlaneDistance(frame, triangle.b);
    yield autoMovieDrawingPlaneDistance(frame, triangle.c);
  }
}

/*
 * Draft a drawable's silhouette in one role, clipped unless it is overhead.
 */
const draftSilhouette = (
  lines: IAutoMovieDrawingLine[],
  drawable: IDrawable,
  role: AutoMovieDrawingRole,
  frame: IAutoMovieDrawingFrame,
  cut: boolean,
): void => {
  const kept: readonly IAutoMovieDrawingTriangle[] =
    cut && role !== "overhead"
      ? clipAutoMovieDrawingTriangles(frame, drawable.triangles)
      : drawable.triangles;
  for (const edge of autoMovieDrawingSilhouetteEdges(frame, kept)) {
    // A silhouette edge in the cut plane is the boundary the clip created,
    // which the cut linework already draws.
    if (cut && onPlane(frame, edge.from) && onPlane(frame, edge.to)) continue;
    draftEdge(lines, drawable, role, frame, edge);
  }
};

/*
 * Whether a world point lies on the cut plane within tolerance.
 */
const onPlane = (
  frame: IAutoMovieDrawingFrame,
  point: IAutoMovieVector3,
): boolean =>
  Math.abs(autoMovieDrawingPlaneDistance(frame, point)) <=
  AutoMovieEngineDrawingEpsilon;

/*
 * Project, round and orient one edge, dropping it when it has no length.
 */
const draftEdge = (
  lines: IAutoMovieDrawingLine[],
  drawable: IDrawable,
  role: AutoMovieDrawingRole,
  frame: IAutoMovieDrawingFrame,
  edge: IAutoMovieDrawingEdge,
): void => {
  const from: IAutoMovieDrawingPoint = roundAutoMovieDrawingPoint(
    projectAutoMovieDrawingPoint(frame, edge.from),
  );
  const to: IAutoMovieDrawingPoint = roundAutoMovieDrawingPoint(
    projectAutoMovieDrawingPoint(frame, edge.to),
  );
  if (from.x === to.x && from.y === to.y) return;
  const forward: boolean = comparePoints(from, to) <= 0;
  lines.push({
    owner: drawable.id,
    space: drawable.space,
    layer: drawable.kind,
    role,
    from: forward ? from : to,
    to: forward ? to : from,
  });
};

/*
 * Order two page points by x, then y.
 */
const comparePoints = (
  left: IAutoMovieDrawingPoint,
  right: IAutoMovieDrawingPoint,
): number => left.x - right.x || left.y - right.y;

/*
 * The identity of one stroke: its role, layer, owner and oriented points.
 */
const lineKey = (line: IAutoMovieDrawingLine): string =>
  JSON.stringify([
    line.role,
    line.layer,
    line.owner,
    line.from.x,
    line.from.y,
    line.to.x,
    line.to.y,
  ]);

/*
 * Canonical stroke order: role precedence, layer, owner, then points.
 */
const compareLines = (
  left: IAutoMovieDrawingLine,
  right: IAutoMovieDrawingLine,
): number =>
  AutoMovieEngineDrawingRoles.indexOf(left.role) -
    AutoMovieEngineDrawingRoles.indexOf(right.role) ||
  compareAutoMovieRenderIds(left.layer, right.layer) ||
  compareAutoMovieRenderIds(left.owner, right.owner) ||
  comparePoints(left.from, right.from) ||
  comparePoints(left.to, right.to);
