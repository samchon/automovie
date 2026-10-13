import {
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
  IAutoMovieDrawingFeature,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { IAutoMovieDrawingDesignIndex } from "./IAutoMovieDrawingDesignIndex";
import { IAutoMovieDrawingFeatureResolution } from "./IAutoMovieDrawingFeatureResolution";
import { IAutoMovieDrawingTriangle } from "./IAutoMovieDrawingTriangle";
import { autoMovieDrawingElementTriangles } from "./autoMovieDrawingElementTriangles";
import { indexAutoMovieDrawingDesign } from "./indexAutoMovieDrawingDesign";
import { roundAutoMovieDrawingScalar } from "./roundAutoMovieDrawingScalar";
import { transformAutoMovieDrawingPoint } from "./transformAutoMovieDrawingPoint";

/** A world point with its coordinates on the drawing grid, for ordering. */
interface IWelded {
  point: IAutoMovieVector3;
  key: string;
  x: number;
  y: number;
  z: number;
}

/** A welded undirected edge, oriented from its smaller corner. */
interface IWeldedEdge {
  from: IWelded;
  to: IWelded;
}

/**
 * Resolve one pinned feature against the design as it stands now.
 *
 * A target stores where a feature is, not what it measured, so moving a wall
 * moves its dimension and changes its number; and it may store how many
 * features of its kind existed, so replacing a wall with a differently shaped
 * one is reported stale instead of relocating the note onto whichever feature
 * inherited the index. A feature that cannot be found is never approximated
 * to the nearest surviving one.
 *
 * Features are read from the element's world geometry in its current
 * operating state: `axis` is one of the element's three local axes (origin and
 * unit direction); `vertex` and `edge` index the welded corners and undirected
 * edges in coordinate order on the drawing grid, an edge resolving to its
 * midpoint and unit direction; `face` indexes the triangles in part and mesh
 * order and resolves to the triangle's centroid; `centroid` is the mean of the
 * welded corners, which is a vertex average rather than a volume centroid.
 * Every failure is a `stale` result whose `reason` names the cause and whose
 * `count` is the current feature count where one exists.
 *
 * @param environment The validated design.
 * @param feature The pinned target.
 * @param design Index of `environment` to reuse; built from it when omitted.
 * @returns The resolved world point and direction, or a stale result.
 *
 * @evidence contracts/common.md#principled-implementation Reads features from the placed tessellation with corners welded on the six-decimal grid and ordered numerically, so an index means the same corner after parts are reordered; the axis is the transformed basis vector, and the stated limitations are that welding can split two corners straddling a rounding boundary and that the centroid is a vertex mean.
 * @evidence contracts/common.md#clear-and-simple-design One function owns target resolution for every feature kind, sharing placement with the drafter through the design index; the welding, ordering and guard helpers are private because nothing else reads them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No element or feature is special-cased; a changed count, an out-of-range or fractional index, a missing element, part or model and a collapsed axis are each reported stale instead of being snapped to a nearby feature.
 * @evidence contracts/common.md#meaningful-documentation The comment states the stale-versus-relocate rule, the staging used, how each feature kind is indexed and what it resolves to, the centroid's meaning, and what a stale result carries.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the element's triangle count to place and weld its corners, plus `O(V log V)` or `O(E log E)` to order the welded vertices or edges, with grid coordinates computed once per corner instead of inside the comparator.
 * @evidence contracts/performance.md#reuse-equivalent-work Accepts the caller's design index so every dimension end and note in one derivation shares the element lookups, world matrices and part tessellations; without one, it indexes the environment for this call only, since a standalone call has nothing to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The placed triangles and welding maps live for the call and are released on return; only a small resolution record survives.
 * @author Samchon
 */
export const resolveAutoMovieDrawingFeature = (
  environment: IAutoMovieBuiltEnvironment,
  feature: IAutoMovieDrawingFeature,
  design: IAutoMovieDrawingDesignIndex = indexAutoMovieDrawingDesign(
    environment,
  ),
): IAutoMovieDrawingFeatureResolution => {
  const element: IAutoMovieBuiltElement | undefined = design.elements.get(
    feature.element,
  );
  if (element === undefined)
    return stale(
      `built environment "${environment.id}" has no element "${feature.element}"`,
    );

  if (feature.kind === "axis") {
    // Integral on purpose: a fractional index names no axis, and would
    // otherwise produce a zero direction reported as a collapsed scale.
    if (
      !Number.isInteger(feature.index) ||
      feature.index < 0 ||
      feature.index > 2
    )
      return stale(
        `element "${element.id}" axis index must be 0, 1 or 2, but was ${feature.index}`,
      );
    if (feature.count !== null && feature.count !== 3)
      return stale(
        `element "${element.id}" has 3 axes, but the target was authored against ${feature.count}`,
        3,
      );
    const matrix: number[] = design.matrices.get(element.id)!;
    const origin: IAutoMovieVector3 = transformAutoMovieDrawingPoint(
      matrix,
      Vector3.create(),
    );
    const tip: IAutoMovieVector3 = transformAutoMovieDrawingPoint(
      matrix,
      Vector3.create(
        feature.index === 0 ? 1 : 0,
        feature.index === 1 ? 1 : 0,
        feature.index === 2 ? 1 : 0,
      ),
    );
    const direction: IAutoMovieVector3 = Vector3.subtract(tip, origin);
    if (Vector3.length(direction) === 0)
      return stale(
        `element "${element.id}" axis ${feature.index} is collapsed by its own scale, so it has no direction`,
      );
    return {
      status: "resolved",
      point: origin,
      direction: Vector3.normalize(direction),
      count: 3,
      reason: null,
    };
  }

  if (element.model === null)
    return stale(
      `element "${element.id}" has no model, so it carries no "${feature.kind}" feature`,
    );
  const model: IAutoMovieModel | undefined = design.models.get(element.model);
  if (model === undefined)
    return stale(
      `element "${element.id}" cites runtime model "${element.model}", whose geometry this design does not carry`,
    );
  const parts: IAutoMovieModelPart[] =
    feature.part === null
      ? model.parts
      : model.parts.filter(
          (part: IAutoMovieModelPart): boolean => part.id === feature.part,
        );
  if (parts.length === 0)
    return stale(`model "${model.id}" has no part "${String(feature.part)}"`);
  const triangles: IAutoMovieDrawingTriangle[] =
    autoMovieDrawingElementTriangles(design, element, model, parts);

  if (feature.kind === "centroid") {
    if (feature.index !== 0)
      return stale(
        `element "${element.id}" centroid index must be 0, but was ${feature.index}`,
      );
    if (feature.count !== null && feature.count !== 1)
      return stale(
        `element "${element.id}" has 1 centroid, but the target was authored against ${feature.count}`,
        1,
      );
    const vertices: IWelded[] = canonicalVertices(triangles);
    if (vertices.length === 0)
      return stale(
        `element "${element.id}" has no geometry, so it has no centroid`,
      );
    return {
      status: "resolved",
      point: Vector3.scale(
        vertices.reduce(
          (sum: IAutoMovieVector3, vertex: IWelded): IAutoMovieVector3 =>
            Vector3.add(sum, vertex.point),
          Vector3.create(),
        ),
        1 / vertices.length,
      ),
      direction: null,
      count: 1,
      reason: null,
    };
  }

  if (feature.kind === "vertex") {
    const vertices: IWelded[] = canonicalVertices(triangles);
    const guard: IAutoMovieDrawingFeatureResolution | null = check(
      feature,
      vertices.length,
      element.id,
      "vertex",
    );
    if (guard !== null) return guard;
    return {
      status: "resolved",
      point: vertices[feature.index]!.point,
      direction: null,
      count: vertices.length,
      reason: null,
    };
  }

  if (feature.kind === "edge") {
    const edges: IWeldedEdge[] = canonicalEdges(triangles);
    const guard: IAutoMovieDrawingFeatureResolution | null = check(
      feature,
      edges.length,
      element.id,
      "edge",
    );
    if (guard !== null) return guard;
    const edge: IWeldedEdge = edges[feature.index]!;
    return {
      status: "resolved",
      point: Vector3.scale(Vector3.add(edge.from.point, edge.to.point), 0.5),
      direction: Vector3.normalize(
        Vector3.subtract(edge.to.point, edge.from.point),
      ),
      count: edges.length,
      reason: null,
    };
  }

  const guard: IAutoMovieDrawingFeatureResolution | null = check(
    feature,
    triangles.length,
    element.id,
    "face",
  );
  if (guard !== null) return guard;
  const face: IAutoMovieDrawingTriangle = triangles[feature.index]!;
  return {
    status: "resolved",
    point: Vector3.scale(
      Vector3.add(Vector3.add(face.a, face.b), face.c),
      1 / 3,
    ),
    direction: null,
    count: triangles.length,
    reason: null,
  };
};

/** A world point with its grid coordinates and welding key. */
const weld = (point: IAutoMovieVector3): IWelded => {
  const x: number = roundAutoMovieDrawingScalar(point.x);
  const y: number = roundAutoMovieDrawingScalar(point.y);
  const z: number = roundAutoMovieDrawingScalar(point.z);
  return { point, key: `${x},${y},${z}`, x, y, z };
};

/**
 * The element's world vertices, welded and in one canonical order.
 *
 * Sorted numerically on the grid rather than left in emission order, so the
 * index a target stores means the same corner after the model's parts are
 * reordered; numeric rather than textual so `10` does not sort before `2`.
 */
const canonicalVertices = (
  triangles: readonly IAutoMovieDrawingTriangle[],
): IWelded[] => {
  const unique: Map<string, IWelded> = new Map();
  for (const triangle of triangles)
    for (const corner of [triangle.a, triangle.b, triangle.c]) {
      const welded: IWelded = weld(corner);
      unique.set(welded.key, welded);
    }
  return [...unique.values()].sort(comparePoints);
};

/** The element's welded undirected edges, in one canonical order. */
const canonicalEdges = (
  triangles: readonly IAutoMovieDrawingTriangle[],
): IWeldedEdge[] => {
  const unique: Map<string, IWeldedEdge> = new Map();
  for (const triangle of triangles) {
    const corners: IWelded[] = [
      weld(triangle.a),
      weld(triangle.b),
      weld(triangle.c),
    ];
    for (let index: number = 0; index < 3; ++index) {
      const from: IWelded = corners[index]!;
      const to: IWelded = corners[(index + 1) % 3]!;
      const forward: number = comparePoints(from, to);
      if (forward === 0) continue;
      const ordered: IWeldedEdge =
        forward < 0 ? { from, to } : { from: to, to: from };
      unique.set(`${ordered.from.key}|${ordered.to.key}`, ordered);
    }
  }
  return [...unique.values()].sort(
    (left: IWeldedEdge, right: IWeldedEdge): number =>
      comparePoints(left.from, right.from) || comparePoints(left.to, right.to),
  );
};

/** Order two welded points by grid x, then y, then z. */
const comparePoints = (left: IWelded, right: IWelded): number =>
  left.x - right.x || left.y - right.y || left.z - right.z;

/** A stale result when the count changed or the index is out of range. */
const check = (
  feature: IAutoMovieDrawingFeature,
  count: number,
  element: string,
  label: string,
): IAutoMovieDrawingFeatureResolution | null => {
  if (feature.count !== null && feature.count !== count)
    return stale(
      `element "${element}" now has ${count} ${label} features, but the target was authored against ${feature.count}`,
      count,
    );
  if (
    !Number.isInteger(feature.index) ||
    feature.index < 0 ||
    feature.index >= count
  )
    return stale(
      `element "${element}" ${label} index ${feature.index} is outside its ${count} ${label} features`,
      count,
    );
  return null;
};

/** A stale resolution carrying its reason and the current feature count. */
const stale = (
  reason: string,
  count: number = 0,
): IAutoMovieDrawingFeatureResolution => ({
  status: "stale",
  point: null,
  direction: null,
  count,
  reason,
});
