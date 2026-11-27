import { AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMovieSceneCollision as Collision,
  IAutoMovieVector3,
} from "@automovie/interface";
import * as THREE from "three";

import type { AutoMovieRenderInspectionGeometry } from "../../AutoMovieRenderInspectionGeometry.js";
import * as FindAutoMovieCollisionWitnessData from "./FindAutoMovieCollisionWitnessData";

/*
 * Search the drawn surface of each part of a candidate pair for a point inside
 * the other part's solid deeper than the allowance at that point.
 *
 * Vertices are tested first, then drawn edges: two penetrating closed surfaces
 * meet along curves that end where an edge of one crosses the other, so when
 * both directions are searched completely without a witness the drawn surfaces
 * do not penetrate beyond the tolerance, and the pair is clear.
 * Parameter props: The pair, the part solids and surfaces, the allowance law and
 * the shared work budget.
 * Returns: A witness, a proof of clearance, an exhausted budget, or an
 * incomplete search.
 */
export function findAutoMovieCollisionWitness(
  props: findAutoMovieCollisionWitness.IProps,
): findAutoMovieCollisionWitness.IOutcome {
  const { pair, surfaces, solidOf, allowance, budget } = props;
  let limited: boolean = false;
  let complete: boolean = true;
  for (const [mover, holder] of [
    [pair.first, pair.second],
    [pair.second, pair.first],
  ] as const) {
    const source: AutoMovieRenderInspectionGeometry.IPartSurface | undefined =
      surfaces.get(mover);
    const solid: findAutoMovieCollisionWitness.ISolid | null | "budget" =
      solidOf(holder);
    if (source === undefined || solid === null) {
      complete = false;
      continue;
    }
    if (solid === "budget") {
      limited = true;
      continue;
    }
    const posed: AutoMovieRenderInspectionGeometry.ISurface | null | "budget" =
      source.read();
    if (posed === "budget") {
      limited = true;
      continue;
    }
    if (posed === null) {
      complete = false;
      continue;
    }
    const found: findAutoMovieCollisionWitness.IOutcome | null =
      searchDirection({
        mover,
        holder,
        source,
        posed,
        solid,
        allowance,
        budget,
      });
    if (found?.kind === "witness") return found;
    if (found?.kind === "budget") limited = true;
  }
  return limited
    ? { kind: "budget" }
    : complete
      ? { kind: "clear" }
      : { kind: "incomplete" };
}

/*
 * Inputs, solids and outcomes of the witness search.
 */
export namespace findAutoMovieCollisionWitness {
  /*
   * The pair, its surfaces and solids, the allowance law and the work budget.
   */
  export interface IProps {
    /*
     * The candidate pair.
     */
    readonly pair: Pick<Collision.IFinding, "first" | "second">;
    /*
     * Lazy drawn surfaces by part.
     */
    readonly surfaces: AutoMovieRenderInspectionGeometry.IResult["surfaces"];
    /*
     * Memoized solid of a part.
     */
    readonly solidOf: (id: string) => ISolid | null | "budget";
    /*
     * Allowed depth for a witness on the mover's surface labelled `moverJoint`
     * inside the holder near `holderJoint`.
     */
    readonly allowance: (
      mover: string,
      moverJoint: string | undefined,
      holderJoint: string | undefined,
    ) => number;
    /*
     * Comparisons and triangle visits the frame may still spend.
     */
    readonly budget: { comparisons: number; surfaceTriangles: number };
  }

  /*
   * A witness point with its depth, proven clearance, exhausted work, or an
   * incomplete search.
   */
  export type IOutcome =
    | {
        readonly kind: "witness";
        readonly point: IAutoMovieVector3;
        readonly separation: number;
      }
    | { readonly kind: "clear" | "budget" | "incomplete" };

  /*
   * A solid a drawn surface vertex or edge can be tested against.
   */
  export interface ISolid {
    /*
     * World bounds of the solid, or null when its distance is cheap everywhere.
     */
    readonly bounds: THREE.Box3 | null;
    /*
     * Pose error of the solid's surface in world metres.
     */
    readonly error: number;
    /*
     * Triangle visits one point query costs.
     */
    readonly cost: number;
    /*
     * Signed distance of a point, negative inside, with the joint of the
     * nearest surface.
     */
    readonly distance: (point: THREE.Vector3) => IDepth;
    /*
     * The point of a segment deepest inside, or null when the segment cannot
     * pass the limit.
     */
    readonly deepest: (
      a: THREE.Vector3,
      b: THREE.Vector3,
      limit: number,
    ) =>
      | (IDepth & { readonly point: THREE.Vector3; readonly cost: number })
      | null;
  }

  /*
   * A signed depth and the joint owning the nearest holder surface.
   */
  export interface IDepth {
    /*
     * Signed distance in metres, negative inside.
     */
    readonly separation: number;
    /*
     * Joint of the nearest holder surface, when the holder is a labelled skin.
     */
    readonly joint?: string;
  }

  /*
   * Build the solid of an exact displayed shape or a closed drawn surface.
   * Parameter part: The part.
   * Parameter surface: Its lazy drawn surface, when collected.
   * Returns: The solid, null when the part bounds no solid, or "budget" when
   * its surface exceeds the vertex allowance.
   */
  export function solid(
    part: Collision.IPart | undefined,
    surface: AutoMovieRenderInspectionGeometry.IPartSurface | undefined,
  ): ISolid | null | "budget" {
    const geometry: Collision.IPart["geometry"] | undefined = part?.geometry;
    if (geometry?.kind === "shape" && geometry.basis === "displayed") {
      const distance: (a: IAutoMovieVector3, b: IAutoMovieVector3) => number =
        AutoMovieEnginePhysics.preparePhysicalShapeSegmentDistance(
          geometry.collider.pose,
          geometry.collider.shape,
        );
      return {
        bounds: null,
        error: 0,
        cost: 0,
        distance: (point: THREE.Vector3): IDepth => ({
          separation: distance(point, point),
        }),
        deepest: (a: THREE.Vector3, b: THREE.Vector3, limit: number) =>
          convexDeepest(distance, a, b, limit),
      };
    }
    if (surface === undefined || surface.owns !== undefined) return null;
    const posed: AutoMovieRenderInspectionGeometry.ISurface | null | "budget" =
      surface.read();
    if (posed === null || posed === "budget") return posed;
    if (!posed.closed) return null;
    return {
      bounds: posed.bounds,
      error: posed.error,
      cost: posed.triangles.length / 3,
      distance: (point: THREE.Vector3): IDepth => closedDistance(posed, point),
      deepest: (a: THREE.Vector3, b: THREE.Vector3) =>
        closedDeepest(posed, a, b),
    };
  }
}

/*
 * Test one part's drawn vertices, then its drawn edges, against the other's
 * solid.
 */
function searchDirection(direction: {
  mover: string;
  holder: string;
  source: AutoMovieRenderInspectionGeometry.IPartSurface;
  posed: AutoMovieRenderInspectionGeometry.ISurface;
  solid: findAutoMovieCollisionWitness.ISolid;
  allowance: findAutoMovieCollisionWitness.IProps["allowance"];
  budget: findAutoMovieCollisionWitness.IProps["budget"];
}): findAutoMovieCollisionWitness.IOutcome | null {
  const { mover, source, posed, solid, allowance, budget } = direction;
  const reach: THREE.Box3 | null =
    solid.bounds === null
      ? null
      : solid.bounds.clone().expandByScalar(solid.error + posed.error);
  const spend = (cost: number): boolean => {
    if (budget.comparisons === 0 || budget.surfaceTriangles < cost)
      return false;
    --budget.comparisons;
    budget.surfaceTriangles -= cost;
    return true;
  };
  for (const vertex of posed.drawn) {
    const point: THREE.Vector3 = posed.values[vertex]!;
    if (reach !== null && !reach.containsPoint(point)) continue;
    if (source.owns !== undefined && !source.owns(point)) continue;
    if (!spend(solid.cost)) return { kind: "budget" };
    const depth: findAutoMovieCollisionWitness.IDepth = solid.distance(point);
    const limit: number =
      -allowance(mover, posed.label?.(vertex), depth.joint) -
      tolerance(posed.error + solid.error, point);
    if (depth.separation < limit) return witness(point, depth.separation);
  }
  const box: THREE.Box3 = new THREE.Box3();
  for (const [a, b] of drawnEdges(posed)) {
    const start: THREE.Vector3 = posed.values[a]!;
    const end: THREE.Vector3 = posed.values[b]!;
    if (reach !== null && !reach.intersectsBox(box.setFromPoints([start, end])))
      continue;
    if (source.owns !== undefined && !source.owns(start) && !source.owns(end))
      continue;
    if (!spend(0)) return { kind: "budget" };
    // Before the deepest point and its joints are known, only the bare
    // tolerance can reject the edge: no window can be tighter than zero.
    const deepest:
      | (findAutoMovieCollisionWitness.IDepth & {
          readonly point: THREE.Vector3;
          readonly cost: number;
        })
      | null = solid.deepest(
      start,
      end,
      -tolerance(posed.error + solid.error, start, end),
    );
    if (deepest === null) continue;
    budget.surfaceTriangles = Math.max(
      0,
      budget.surfaceTriangles - deepest.cost,
    );
    const near: number =
      deepest.point.distanceToSquared(start) <=
      deepest.point.distanceToSquared(end)
        ? a
        : b;
    const limit: number =
      -allowance(mover, posed.label?.(near), deepest.joint) -
      tolerance(posed.error + solid.error, start, end);
    if (
      deepest.separation < limit &&
      (source.owns === undefined || source.owns(deepest.point))
    )
      return witness(deepest.point, deepest.separation);
  }
  return null;
}

/*
 * A witness outcome with a plain point.
 */
function witness(
  point: THREE.Vector3,
  separation: number,
): findAutoMovieCollisionWitness.IOutcome {
  return {
    kind: "witness",
    point: { x: point.x, y: point.y, z: point.z },
    separation,
  };
}

/*
 * Pose error plus the single-precision allowance at these coordinates.
 */
function tolerance(error: number, ...points: THREE.Vector3[]): number {
  let scale: number = 1;
  for (const point of points)
    scale = Math.max(
      scale,
      Math.abs(point.x),
      Math.abs(point.y),
      Math.abs(point.z),
    );
  return error + 32 * 2 ** -23 * scale;
}

/*
 * Distinct undirected edges of the drawn triangles of a posed surface.
 */
function drawnEdges(
  surface: AutoMovieRenderInspectionGeometry.ISurface,
): readonly (readonly [number, number])[] {
  const seen: Set<string> = new Set();
  const edges: [number, number][] = [];
  const { triangles } = surface;
  for (let i: number = 0; i < triangles.length; i += 3)
    for (const [p, q] of [
      [triangles[i]!, triangles[i + 1]!],
      [triangles[i + 1]!, triangles[i + 2]!],
      [triangles[i + 2]!, triangles[i]!],
    ] as const) {
      const key: string = p < q ? `${p},${q}` : `${q},${p}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push([p, q]);
    }
  return edges;
}

/*
 * The deepest point of a segment inside a convex solid. The Engine reads the
 * segment's least signed distance first; along a segment the signed distance to
 * a convex solid is convex, so a bracketing search locates the point.
 */
function convexDeepest(
  distance: (a: IAutoMovieVector3, b: IAutoMovieVector3) => number,
  a: THREE.Vector3,
  b: THREE.Vector3,
  limit: number,
): { point: THREE.Vector3; separation: number; cost: number } | null {
  if (!(distance(a, b) < limit)) return null;
  const at = (t: number): THREE.Vector3 =>
    new THREE.Vector3().lerpVectors(a, b, t);
  const value = (t: number): number => {
    const point: THREE.Vector3 = at(t);
    return distance(point, point);
  };
  let low: number = 0;
  let high: number = 1;
  for (let step: number = 0; step < 48; ++step) {
    const left: number = low + (high - low) / 3;
    const right: number = high - (high - low) / 3;
    if (value(left) <= value(right)) high = right;
    else low = left;
  }
  const point: THREE.Vector3 = at((low + high) / 2);
  return { point, separation: distance(point, point), cost: 0 };
}

/*
 * The deepest point of a segment inside a closed drawn surface. The segment
 * changes side only where it crosses a triangle, so the middle of each span
 * between consecutive crossings is tested for containment and depth.
 */
function closedDeepest(
  surface: AutoMovieRenderInspectionGeometry.ISurface,
  a: THREE.Vector3,
  b: THREE.Vector3,
):
  | (findAutoMovieCollisionWitness.IDepth & {
      point: THREE.Vector3;
      cost: number;
    })
  | null {
  const ray: THREE.Ray = new THREE.Ray(a, new THREE.Vector3().subVectors(b, a));
  const length: number = ray.direction.length();
  if (!(length > 0)) return null;
  ray.direction.divideScalar(length);
  const crossings: number[] = [0, 1];
  const hit: THREE.Vector3 = new THREE.Vector3();
  const { triangles, values } = surface;
  for (let i: number = 0; i < triangles.length; i += 3)
    if (
      ray.intersectTriangle(
        values[triangles[i]!]!,
        values[triangles[i + 1]!]!,
        values[triangles[i + 2]!]!,
        false,
        hit,
      ) !== null
    ) {
      const t: number = hit.distanceTo(a) / length;
      if (t > 0 && t < 1) crossings.push(t);
    }
  crossings.sort((x: number, y: number): number => x - y);
  let best:
    | (findAutoMovieCollisionWitness.IDepth & { point: THREE.Vector3 })
    | null = null;
  for (let i: number = 0; i + 1 < crossings.length; ++i) {
    if (crossings[i + 1]! - crossings[i]! <= 0) continue;
    const point: THREE.Vector3 = new THREE.Vector3().lerpVectors(
      a,
      b,
      (crossings[i]! + crossings[i + 1]!) / 2,
    );
    const depth: findAutoMovieCollisionWitness.IDepth = closedDistance(
      surface,
      point,
    );
    if (best === null || depth.separation < best.separation)
      best = { ...depth, point };
  }
  const cost: number = (triangles.length / 3) * crossings.length;
  return best === null ? null : { ...best, cost };
}

/*
 * Signed distance to a closed drawn surface: the generalized winding number
 * decides inside, independent of triangle orientation, and the nearest drawn
 * triangle gives the magnitude and the joint label.
 */
function closedDistance(
  surface: AutoMovieRenderInspectionGeometry.ISurface,
  point: THREE.Vector3,
): findAutoMovieCollisionWitness.IDepth {
  const a: THREE.Vector3 = new THREE.Vector3();
  const b: THREE.Vector3 = new THREE.Vector3();
  const c: THREE.Vector3 = new THREE.Vector3();
  const triangle: THREE.Triangle = new THREE.Triangle();
  const closest: THREE.Vector3 = new THREE.Vector3();
  const cross: THREE.Vector3 = new THREE.Vector3();
  let solidAngle: number = 0;
  let nearest: number = Infinity;
  let owner: number = -1;
  const { triangles, values } = surface;
  for (let i: number = 0; i < triangles.length; i += 3) {
    const pa: THREE.Vector3 = values[triangles[i]!]!;
    const pb: THREE.Vector3 = values[triangles[i + 1]!]!;
    const pc: THREE.Vector3 = values[triangles[i + 2]!]!;
    a.subVectors(pa, point);
    b.subVectors(pb, point);
    c.subVectors(pc, point);
    const la: number = a.length();
    const lb: number = b.length();
    const lc: number = c.length();
    const numerator: number = a.dot(cross.crossVectors(b, c));
    const denominator: number =
      la * lb * lc + a.dot(b) * lc + a.dot(c) * lb + b.dot(c) * la;
    solidAngle += 2 * Math.atan2(numerator, denominator);
    triangle.set(pa, pb, pc);
    const gap: number = triangle
      .closestPointToPoint(point, closest)
      .distanceTo(point);
    if (gap < nearest) {
      nearest = gap;
      owner = triangles[i]!;
    }
  }
  const joint: string | undefined =
    owner < 0 ? undefined : surface.label?.(owner);
  return {
    separation: Math.abs(solidAngle / FindAutoMovieCollisionWitnessData.FOUR_PI) > 0.5 ? -nearest : nearest,
    ...(joint === undefined ? {} : { joint }),
  };
}
