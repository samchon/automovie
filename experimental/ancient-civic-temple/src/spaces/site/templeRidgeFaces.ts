import type { WallFace } from "../../geometry/WallFace";
import { templeRidge } from "./templeRidge";
import type { IAutoMovieVector3 } from "@automovie/interface";

const at = (radius: number, phi: number, height: number): IAutoMovieVector3 => ({
  x: radius * Math.sin(phi), y: height, z: radius * Math.cos(phi),
});
/**
 * Crest height in meters at azimuth φ, zero at front +Z and increasing toward east +X.
 */
const templeRidgeCrest = (phi: number): number => 7.0 - 2.5 * Math.cos(phi) + 1.2 * Math.sin(3 * phi + 0.7) + 0.6 * Math.sin(7 * phi + 1.9);
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
