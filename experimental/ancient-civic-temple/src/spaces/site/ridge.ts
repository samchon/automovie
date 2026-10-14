/**
 * Distant ridge and foothold
 * The ridge is an open ring centered on the origin, with inner/outer slope
 * triangles. The foothold extends the grade outside the local site to a 220 m
 * square. These background surfaces have no walking supports, cells or zones.
 */
import type { IAutoMovieVector3 } from "@automovie/interface";
import type { PlanRectangle } from "../../geometry/planar-domain";
import type { WallFace } from "../../geometry/wall-solids";
import { templeSiteExtent as e } from "./extent";
import { gradeTopFaces } from "./ground";
export const templeRidge = {
  innerFoot: 56, crest: 88, outerFoot: 108, footHeight: -0.3, segments: 72, farHalf: 110,
} as const;

/**
 * Crest height in meters at azimuth φ, zero at front +Z and increasing toward east +X.
 */
export const templeRidgeCrest = (phi: number): number =>
  7.0 - 2.5 * Math.cos(phi) + 1.2 * Math.sin(3 * phi + 0.7) + 0.6 * Math.sin(7 * phi + 1.9);

const at = (radius: number, phi: number, height: number): IAutoMovieVector3 => ({
  x: radius * Math.sin(phi), y: height, z: radius * Math.cos(phi),
});

/**
 * Two inner and two outer slope triangles per sector, with outward-facing tops.
 */
export const templeRidgeFaces = (): WallFace[] => {
  const r = templeRidge;
  const surface = "surface.site-distant.ridge";
  return Array.from({ length: r.segments }, (_, i) => {
    const a = (2 * Math.PI * i) / r.segments;
    const b = (2 * Math.PI * (i + 1)) / r.segments;
    const ia = at(r.innerFoot, a, r.footHeight);
    const ib = at(r.innerFoot, b, r.footHeight);
    const ca = at(r.crest, a, templeRidgeCrest(a));
    const cb = at(r.crest, b, templeRidgeCrest(b));
    const oa = at(r.outerFoot, a, r.footHeight);
    const ob = at(r.outerFoot, b, r.footHeight);
    return [
      { surface, corners: [ia, ca, cb] }, { surface, corners: [ia, cb, ib] },
      { surface, corners: [ca, oa, ob] }, { surface, corners: [ca, ob, cb] },
    ];
  }).flat();
};

/**
 * Four foothold bands surrounding the local site.
 */
export const templeFootholdRects = (): PlanRectangle[] => {
  const h = templeRidge.farHalf;
  return [
    { west: -h, east: h, north: e.south, south: h },
    { west: -h, east: h, north: -h, south: e.north },
    { west: -h, east: e.west, north: e.north, south: e.south },
    { west: e.east, east: h, north: e.north, south: e.south },
  ];
};
export const templeFootholdFaces = (): WallFace[] =>
  templeFootholdRects().flatMap((rect) => gradeTopFaces(rect, "surface.site-distant.ground"));
