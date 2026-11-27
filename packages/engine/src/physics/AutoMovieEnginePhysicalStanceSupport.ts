import type {
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalProfile,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { convexHull2D } from "../math/internal/convexHull2D";
import { AutoMoviePhysicalBalance } from "./AutoMoviePhysicalBalance";
import { AutoMovieEnginePhysicalStanceBalance } from "./AutoMovieEnginePhysicalStanceBalance";
import { physicalSupportFootprint } from "./internal/physicalSupportFootprint";

/** A support limb of the balance pattern. */
type Limb = IAutoMovieFootfallPattern["limbs"][number];

/**
 * The stance's support polygons (`AutoMovieEnginePhysicalStanceBalance`): the planted
 * outlines, their shrinking by the margin, the shared support and its
 * clipping.
 */
export namespace AutoMovieEnginePhysicalStanceSupport {
  /**
   * The support polygon the stance holds its centre of pressure within: the
   * limbs' bearing faces (`physicalSupportFootprint`) joined and shrunk by
   * `MARGIN`. The controller and the push bounds read the same one.
   */
  export function polygon(
    profile: IAutoMoviePhysicalProfile,
    poses: Parameters<typeof physicalSupportFootprint>[1],
    limbs: readonly Limb[],
    floor: number,
  ): IAutoMovieVector3[] {
    return shrink(
      convexHull2D(
        limbs.flatMap((limb: Limb) =>
          physicalSupportFootprint(profile, poses, limb, floor),
        ),
      ),
      AutoMovieEnginePhysicalStanceBalance.MARGIN,
    );
  }

  /**
   * What the bearing feet can carry, each foot's bearing set: a seated foot's
   * outline; an unseated foot that still bears, its edge where it bears now,
   * the vertices of its bearing face at its present pose (Koolen et al.,
   * Section III-B: the hull of the points in contact); its ankle point only
   * when that edge is unknown. Their vertices are the contact points the stance
   * may load, and the command's polygon is the union of them shrunk by `MARGIN`
   * (Pratt et al., M2V2, footnote 2); the union unshrunk, the hull, is the
   * support itself (`allocate`). The margin is kept on the whole support, not
   * on each foot, so a narrow foot (a heel point and a forefoot edge) keeps its
   * own vertices instead of collapsing to one point that bears no moment. A
   * foot with a bearing share under one is drawn that share of the way out from
   * the fully bearing feet's hull; an absent share is one.
   */
  export function support<T>(
    feet: readonly {
      limb: T;
      outline: readonly IAutoMovieVector3[];
      bearing?: number;
      flat: number;
      ankle: IAutoMovieVector3;
      edge?: readonly IAutoMovieVector3[];
    }[],
  ): {
    feet: { limb: T; points: IAutoMovieVector3[] }[];
    polygon: IAutoMovieVector3[];
    hull: IAutoMovieVector3[];
  } {
    const drawn = feet.map(({ limb, outline, flat, ankle, edge }) => ({
      limb,
      points:
        flat > 0
          ? outline.map((vertex: IAutoMovieVector3) => ({ ...vertex }))
          : edge && edge.length > 0
            ? edge.map((vertex: IAutoMovieVector3) => ({ ...vertex }))
            : [{ ...ankle }],
    }));
    // The base of support is the hull of every bearing contact (Koolen et al.,
    // Section III-B): the seated feet's outlines as they are, and each edge
    // shortened by the margin along its length only, an edge being a line;
    // the margin then comes off that hull once, never off each foot, so a
    // narrow foot does not vanish on its own.
    const contacts: IAutoMovieVector3[][] = feet.map((foot, i: number) =>
      foot.flat > 0
        ? drawn[i]!.points
        : shorten(drawn[i]!.points, AutoMovieEnginePhysicalStanceBalance.MARGIN),
    );
    // A foot whose bearing share is ramping, leaving the stance or joining
    // it, has its contacts drawn from the fully bearing feet's hull toward
    // its own by that share, so the support and the command on it move
    // continuously through the transition (Feng et al. 2015, Section
    // II-B4; Herzog et al. 2016, Section 5.3).
    const full: IAutoMovieVector3[] = convexHull2D(
      contacts.filter((_, i: number) => (feet[i]!.bearing ?? 1) >= 1).flat(),
    );
    const points: IAutoMovieVector3[] = contacts.flatMap(
      (list: IAutoMovieVector3[], i: number): IAutoMovieVector3[] => {
        const share: number = Math.max(0, Math.min(1, feet[i]!.bearing ?? 1));
        if (share >= 1 || full.length === 0) return list;
        return list.map((point: IAutoMovieVector3): IAutoMovieVector3 => {
          const near: IAutoMovieVector3 = AutoMoviePhysicalBalance.nearest(
            full,
            point,
          );
          return {
            x: near.x + (point.x - near.x) * share,
            y: point.y,
            z: near.z + (point.z - near.z) * share,
          };
        });
      },
    );
    const hull: IAutoMovieVector3[] = convexHull2D(points);
    return {
      feet: drawn,
      polygon: shrink(hull, AutoMovieEnginePhysicalStanceBalance.MARGIN),
      hull,
    };
  }

  /**
   * An edge's points shortened by a margin along its own length: the two points
   * farthest apart are moved toward each other by the margin each, meeting at
   * their middle when shorter than twice it; a single point stays.
   */
  export function shorten(
    points: readonly IAutoMovieVector3[],
    margin: number,
  ): IAutoMovieVector3[] {
    if (points.length < 2) return points.map((p) => ({ ...p }));
    let a: IAutoMovieVector3 = points[0]!;
    let b: IAutoMovieVector3 = points[0]!;
    let span: number = 0;
    for (const p of points)
      for (const q of points) {
        const d: number = Math.hypot(q.x - p.x, q.z - p.z);
        if (d > span) [a, b, span] = [p, q, d];
      }
    if (!(span > 2 * margin)) {
      const middle: IAutoMovieVector3 = Vector3.scale(Vector3.add(a, b), 0.5);
      return [middle];
    }
    const unit: IAutoMovieVector3 = Vector3.scale(
      Vector3.subtract(b, a),
      1 / span,
    );
    return [
      Vector3.add(a, Vector3.scale(unit, margin)),
      Vector3.subtract(b, Vector3.scale(unit, margin)),
    ];
  }

  /**
   * A convex polygon shrunk by a margin: each edge moved inward and the
   * neighbours intersected; a polygon narrower than twice the margin collapses
   * to its vertices' mean.
   */
  export function shrink(
    polygon: readonly IAutoMovieVector3[],
    margin: number,
  ): IAutoMovieVector3[] {
    if (polygon.length < 3 || !(margin > 0))
      return polygon.map((p) => ({ ...p }));
    const mean: IAutoMovieVector3 = Vector3.scale(
      polygon.reduce(
        (sum: IAutoMovieVector3, p: IAutoMovieVector3) => Vector3.add(sum, p),
        { x: 0, y: 0, z: 0 },
      ),
      1 / polygon.length,
    );
    const lines: { point: IAutoMovieVector3; direction: IAutoMovieVector3 }[] =
      polygon.map((a: IAutoMovieVector3, i: number) => {
        const b: IAutoMovieVector3 = polygon[(i + 1) % polygon.length]!;
        const direction: IAutoMovieVector3 = {
          x: b.x - a.x,
          y: 0,
          z: b.z - a.z,
        };
        const length: number = Math.hypot(direction.x, direction.z) || 1;
        let normal: IAutoMovieVector3 = {
          x: -direction.z / length,
          y: 0,
          z: direction.x / length,
        };
        if ((mean.x - a.x) * normal.x + (mean.z - a.z) * normal.z < 0)
          normal = Vector3.scale(normal, -1);
        return {
          point: Vector3.add(a, Vector3.scale(normal, margin)),
          direction,
        };
      });
    const out: IAutoMovieVector3[] = [];
    for (let i: number = 0; i < lines.length; i++) {
      const p: (typeof lines)[number] =
        lines[(i + lines.length - 1) % lines.length]!;
      const q: (typeof lines)[number] = lines[i]!;
      const cross: number =
        p.direction.x * q.direction.z - p.direction.z * q.direction.x;
      if (Math.abs(cross) < 1e-12) {
        out.push({ ...q.point });
        continue;
      }
      const t: number =
        ((q.point.x - p.point.x) * q.direction.z -
          (q.point.z - p.point.z) * q.direction.x) /
        cross;
      out.push({
        x: p.point.x + p.direction.x * t,
        y: mean.y,
        z: p.point.z + p.direction.z * t,
      });
    }
    // Collapsed: an inner point lies outside the original's centroid side.
    const hull: IAutoMovieVector3[] = convexHull2D(out);
    const inside: boolean = hull.every(
      (point: IAutoMovieVector3) =>
        Vector3.length(
          Vector3.subtract(
            AutoMoviePhysicalBalance.nearest(polygon, point),
            point,
          ),
        ) < 1e-9,
    );
    return inside && hull.length >= 3 ? hull : [{ ...mean }];
  }

  /**
   * The part of a convex polygon on a half-plane's side, (q - point) . normal >=
   * 0, as a counter-clockwise hull (Sutherland and Hodgman 1974, one clipping
   * edge).
   */
  export function clip(
    polygon: readonly IAutoMovieVector3[],
    point: IAutoMovieVector3,
    normal: IAutoMovieVector3,
  ): IAutoMovieVector3[] {
    const side = (q: IAutoMovieVector3): number =>
      (q.x - point.x) * normal.x + (q.z - point.z) * normal.z;
    const kept: IAutoMovieVector3[] = [];
    polygon.forEach((a: IAutoMovieVector3, i: number): void => {
      const b: IAutoMovieVector3 = polygon[(i + 1) % polygon.length]!;
      const sa: number = side(a);
      const sb: number = side(b);
      if (sa >= 0) kept.push({ ...a });
      if (sa >= 0 !== sb >= 0) {
        const t: number = sa / (sa - sb);
        kept.push({
          x: a.x + (b.x - a.x) * t,
          y: a.y,
          z: a.z + (b.z - a.z) * t,
        });
      }
    });
    return convexHull2D(kept);
  }

  /**
   * A convex polygon's area centroid on the floor; its vertices' mean when it has
   * no area.
   */
  export function centroid(
    polygon: readonly IAutoMovieVector3[],
    floor: number,
  ): IAutoMovieVector3 {
    let area: number = 0;
    let x: number = 0;
    let z: number = 0;
    polygon.forEach((a: IAutoMovieVector3, i: number): void => {
      const b: IAutoMovieVector3 = polygon[(i + 1) % polygon.length]!;
      const cross: number = a.x * b.z - b.x * a.z;
      area += cross;
      x += (a.x + b.x) * cross;
      z += (a.z + b.z) * cross;
    });
    if (Math.abs(area) > 1e-12)
      return { x: x / (3 * area), y: floor, z: z / (3 * area) };
    const n: number = Math.max(1, polygon.length);
    return {
      x: polygon.reduce((sum, p) => sum + p.x, 0) / n,
      y: floor,
      z: polygon.reduce((sum, p) => sum + p.z, 0) / n,
    };
  }
}
