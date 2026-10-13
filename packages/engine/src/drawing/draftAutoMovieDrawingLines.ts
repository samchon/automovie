import {
  AutoMovieDrawingRole,
  IAutoMovieBuiltBoundary,
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
  IAutoMovieDrawingFrame,
  IAutoMovieDrawingLine,
  IAutoMovieDrawingPoint,
  IAutoMovieDrawingView,
  IAutoMovieModel,
  IAutoMovieVector3,
} from "@automovie/interface";

import { compareAutoMovieRenderIds } from "../render/compareAutoMovieRenderIds";
import { IAutoMovieDrawingDesignIndex } from "./IAutoMovieDrawingDesignIndex";
import { IAutoMovieDrawingEdge } from "./IAutoMovieDrawingEdge";
import { IAutoMovieDrawingTriangle } from "./IAutoMovieDrawingTriangle";
import { autoMovieBoundaryShellTriangles } from "./autoMovieBoundaryShellTriangles";
import { autoMovieDrawingCutEdges } from "./autoMovieDrawingCutEdges";
import { autoMovieDrawingElementTriangles } from "./autoMovieDrawingElementTriangles";
import { autoMovieDrawingPlaneDistance } from "./autoMovieDrawingPlaneDistance";
import { autoMovieDrawingRange } from "./autoMovieDrawingRange";
import { autoMovieDrawingSilhouetteEdges } from "./autoMovieDrawingSilhouetteEdges";
import { clipAutoMovieDrawingTriangles } from "./clipAutoMovieDrawingTriangles";
import { AUTOMOVIE_DRAWING_EPSILON } from "./constants/AUTOMOVIE_DRAWING_EPSILON";
import { AUTOMOVIE_DRAWING_ROLES } from "./constants/AUTOMOVIE_DRAWING_ROLES";
import { projectAutoMovieDrawingPoint } from "./projectAutoMovieDrawingPoint";
import { roundAutoMovieDrawingPoint } from "./roundAutoMovieDrawingPoint";

/** One thing the view draws, reduced to what drafting needs to know about it. */
interface IDrawable {
  id: string;
  kind: string;
  space: string | null;
  triangles: IAutoMovieDrawingTriangle[];
}

/**
 * Draft every line one view draws of one validated design, classified by its
 * relation to the cut plane, deduplicated and in canonical order.
 *
 * Drawables are the elements with an environment-owned model and the
 * boundaries that carry a face and are realized by no element, each kept only
 * when `drawn` accepts its kind and space; a boundary is accepted through any
 * space it separates and carries its first space, so a party wall reads the
 * same on both rooms' sheets. An element citing a builder-owned runtime model
 * cannot be drawn and is counted in `unresolvedModels` for the caller's gap.
 *
 * Each drawable is classified by its nearest and deepest corner: wholly on the
 * viewer's side of a cut it is `overhead` while within `view.overhead` and
 * omitted beyond it; wholly deeper than `view.depth` it is `hidden`; otherwise
 * a cut view drafts its section as `cut` and the silhouette of what stands
 * beyond the plane as `projected`. Silhouettes lying in the cut plane are
 * dropped because the cut already draws them. Points are rounded onto the
 * grid, zero-length strokes are dropped, each stroke runs from its smaller
 * point, identical strokes are merged, and the result is sorted by role order,
 * layer, owner and points.
 *
 * @param props.environment The validated design.
 * @param props.view The view whose depth bands apply.
 * @param props.frame The view's resolved page basis.
 * @param props.design Index of `environment`.
 * @param props.cut Whether the view's projection cuts.
 * @param props.drawn Whether a kind and space pass the view's filters.
 * @returns The sorted lines and the count of undrawable elements.
 *
 * @evidence contracts/common.md#principled-implementation Classifies by signed plane distance, takes sections with `autoMovieDrawingCutEdges`, clips to the far half-space with `clipAutoMovieDrawingTriangles` and drafts silhouettes with `autoMovieDrawingSilhouetteEdges`, the conventional orthographic drafting pipeline; the premise is a validated design, so every boundary cites a space and every element has a world matrix, and the stated limitation, also declared as a gap by the caller, is that depth bands are not occlusion.
 * @evidence contracts/common.md#clear-and-simple-design One function owns drawable collection, depth classification and stroke canonicalization, and the derivation calls it once; the drawable record and the stroke helpers are private because no other stage reads them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No element, boundary or kind is special-cased; a face boundary realized by elements is skipped because the elements already draw it, by the stated one-pen rule, and an unresolvable model is counted for a gap instead of drawn as nothing silently.
 * @evidence contracts/common.md#meaningful-documentation The comment states which records become drawables and how filters apply, the boundary's space rule, the unresolved count, each depth band, the in-plane rule, and every canonicalization step and the sort order.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the drawn triangles for distance, section, clip and silhouette, with the depth range folded from a generator instead of a flattened array; deduplication is a hash map over strokes and the final sort is `O(L log L)` in the line count, which the canonical order requires.
 * @evidence contracts/performance.md#reuse-equivalent-work Element geometry comes from the design index, so a model placed many times is tessellated once per derivation; each drawable's triangles are computed once and shared by its classification, cut and silhouette passes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The drawable list, drafted strokes and deduplication map live for the call and are released on return; the retained population is bounded by the drawn triangles, and only the returned lines, owned by the caller, survive.
 * @author Samchon
 */
export const draftAutoMovieDrawingLines = (props: {
  environment: IAutoMovieBuiltEnvironment;
  view: IAutoMovieDrawingView;
  frame: IAutoMovieDrawingFrame;
  design: IAutoMovieDrawingDesignIndex;
  cut: boolean;
  drawn: (kind: string, space: string | null) => boolean;
}): { lines: IAutoMovieDrawingLine[]; unresolvedModels: number } => {
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
    if (cut && distance.min > AUTOMOVIE_DRAWING_EPSILON) {
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

/** An element placed in the world, carrying its own kind and space. */
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

/** A face-only boundary's closed slab, carrying its first space. */
const boundaryDrawable = (boundary: IAutoMovieBuiltBoundary): IDrawable => ({
  id: boundary.id,
  kind: boundary.kind,
  space: boundary.spaces[0]!,
  triangles: autoMovieBoundaryShellTriangles(boundary.face!),
});

/** Every triangle corner's signed distance from the cut plane. */
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

/** Draft a drawable's silhouette in one role, clipped unless it is overhead. */
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

/** Whether a world point lies on the cut plane within tolerance. */
const onPlane = (
  frame: IAutoMovieDrawingFrame,
  point: IAutoMovieVector3,
): boolean =>
  Math.abs(autoMovieDrawingPlaneDistance(frame, point)) <=
  AUTOMOVIE_DRAWING_EPSILON;

/** Project, round and orient one edge, dropping it when it has no length. */
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

/** Order two page points by x, then y. */
const comparePoints = (
  left: IAutoMovieDrawingPoint,
  right: IAutoMovieDrawingPoint,
): number => left.x - right.x || left.y - right.y;

/** The identity of one stroke: its role, layer, owner and oriented points. */
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

/** Canonical stroke order: role precedence, layer, owner, then points. */
const compareLines = (
  left: IAutoMovieDrawingLine,
  right: IAutoMovieDrawingLine,
): number =>
  AUTOMOVIE_DRAWING_ROLES.indexOf(left.role) -
    AUTOMOVIE_DRAWING_ROLES.indexOf(right.role) ||
  compareAutoMovieRenderIds(left.layer, right.layer) ||
  compareAutoMovieRenderIds(left.owner, right.owner) ||
  comparePoints(left.from, right.from) ||
  comparePoints(left.to, right.to);
