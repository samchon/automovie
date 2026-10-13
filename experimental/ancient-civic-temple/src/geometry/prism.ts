/**
 * Builds a vertical prism over a convex planar polygon as a closed face list.
 * The bottom and top are each a plane y=ax+bz+c, so a wall top can be a sloped face following the
 * real roof underside. The input polygon follows planar-domain's orientation (rectangle order), and
 * output faces are in the order from which the engine polyhedron derives outward normals.
 * Each face keeps its direction and original polygon edge number so the caller decides surface ownership.
 */
import type { IAutoMovieVector3 } from "@automovie/interface";
import { planeHeight, type HeightPlane, type PlanPoint } from "./planar-domain";

export interface PrismFace {
  /** "top" | "bottom", or a side face identified by its polygon edge number. */
  side: "top" | "bottom" | "edge";
  edge: number;
  /** XZ outward normal (side faces only). Top and bottom faces carry the zero vector. */
  normal: PlanPoint;
  corners: IAutoMovieVector3[];
}

/**
 * The top must be higher than the bottom at every vertex. Equal or reversed heights would make a
 * zero-thickness face that hides a gap, so they are refused (numeric limit 1e-9 m).
 */
export const prismFaces = (
  polygon: readonly PlanPoint[],
  bottom: HeightPlane,
  top: HeightPlane,
): PrismFace[] => {
  if (polygon.length < 3) throw new Error("prism: a plane with at least three vertices is required.");
  const low = polygon.map((p) => planeHeight(bottom, p));
  const high = polygon.map((p) => planeHeight(top, p));
  polygon.forEach((_, i) => {
    if (!(high[i]! - low[i]! > 1e-9)) {
      throw new Error(`prism: the top ${high[i]} at vertex ${i} is not higher than the bottom ${low[i]}.`);
    }
  });
  const v = (p: PlanPoint, y: number): IAutoMovieVector3 => ({ x: p.x, y, z: p.z });
  const faces: PrismFace[] = [
    {
      side: "top", edge: -1, normal: { x: 0, z: 0 },
      corners: polygon.map((p, i) => v(p, high[i]!)).reverse(),
    },
    {
      side: "bottom", edge: -1, normal: { x: 0, z: 0 },
      corners: polygon.map((p, i) => v(p, low[i]!)),
    },
  ];
  polygon.forEach((a, i) => {
    const j = (i + 1) % polygon.length;
    const b = polygon[j]!;
    const length = Math.hypot(b.x - a.x, b.z - a.z);
    faces.push({
      side: "edge", edge: i,
      normal: { x: (b.z - a.z) / length, z: (a.x - b.x) / length },
      corners: [v(a, low[i]!), v(a, high[i]!), v(b, high[j]!), v(b, low[j]!)],
    });
  });
  return faces;
};

/** A constant-height plane. */
export const levelPlane = (height: number): HeightPlane => ({ x: 0, z: 0, constant: height });
