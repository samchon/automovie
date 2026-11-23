import {
  type AutoMovieRingPlacement,
  type IAutoMovieFootprintRing,
  IAutoMovieVector3,
} from "@automovie/interface";

import { pointInPolygon } from "../architecture/pointInPolygon";
import { closestPointOnSegmentXZ } from "../math/closestPointOnSegmentXZ";
import { FOOTPRINT_EPSILON } from "./constants/FOOTPRINT_EPSILON";

/** Classify an XZ query against an authored ring with an explicit rim result. */
export const footprintRingPlacement: (
  ring: IAutoMovieFootprintRing,
  x: number,
  z: number,
) => AutoMovieRingPlacement = (
  ring: IAutoMovieFootprintRing,
  x: number,
  z: number,
): AutoMovieRingPlacement => {
  if (ring.points.length < 3) return "outside";
  const probe: { x: number; y: number; z: number } = { x, y: 0, z };
  for (let index: number = 0; index < ring.points.length; ++index) {
    const near: IAutoMovieVector3 = closestPointOnSegmentXZ(
      probe,
      ring.points[index]!,
      ring.points[(index + 1) % ring.points.length]!,
    );
    if (Math.hypot(x - near.x, z - near.z) <= FOOTPRINT_EPSILON)
      return "boundary";
  }
  return pointInPolygon({ x, y: z }, ring.plan) ? "inside" : "outside";
};
