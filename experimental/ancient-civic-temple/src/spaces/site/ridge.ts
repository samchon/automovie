/**
 * Distant ridge and foothold from docs/spaces/site.md#distant-ridge.
 * The ridge is an open ring centered on the origin, with inner/outer slope
 * triangles. The foothold extends the grade outside the local site to a 220 m
 * square. These background surfaces have no walking supports, cells or zones.
 */
import type { IAutoMovieVector3 } from "@automovie/interface";
import type { PlanRectangle } from "../../geometry/planar-domain";
import type { WallFace } from "../../geometry/wall-solids";
import { templeSiteExtent as e } from "./extent";
import { gradeTopFaces } from "./ground";

/**
 * @evidence spaces/site.md Defines inner foot 56 m, crest 88 m, outer foot 108 m, foot height -0.3 m, 72 sectors and foothold half-width 110 m.
 * @evidence spaces/site.md#distant-ridge Uses the designed dimensions for the origin-centered ridge ring and foothold outside the local site.
 * @evidence principles/core/source-units.md#source-scope-preservation Contains only ridge dimensions.
 * @evidence principles/core/source-units.md#source-substantive-completion Ridge and foothold faces share constant dimensions.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly represents distant-ridge distances and subdivision.
 */
export const templeRidge = {
  innerFoot: 56, crest: 88, outerFoot: 108, footHeight: -0.3, segments: 72, farHalf: 110,
} as const;

/**
 * Crest height in meters at azimuth φ, zero at front +Z and increasing toward east +X.
 * @evidence spaces/site.md Computes crest height H(φ)=7.0−2.5·cos φ+1.2·sin(3φ+0.7)+0.6·sin(7φ+1.9).
 * @evidence principles/core/source-units.md#source-scope-preservation Evaluates only the designed equation.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns a numeric crest height.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly implements the distant-ridge crest equation.
 */
export const templeRidgeCrest = (phi: number): number =>
  7.0 - 2.5 * Math.cos(phi) + 1.2 * Math.sin(3 * phi + 0.7) + 0.6 * Math.sin(7 * phi + 1.9);

const at = (radius: number, phi: number, height: number): IAutoMovieVector3 => ({
  x: radius * Math.sin(phi), y: height, z: radius * Math.cos(phi),
});

/**
 * Two inner and two outer slope triangles per sector, with outward-facing tops.
 * @evidence spaces/site.md Makes inner/outer slope triangle faces in 72 ring sectors.
 * @evidence principles/core/source-units.md#source-scope-preservation Emits background surfaces without walking supports or cells.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns outward-facing triangle faces.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly implements the open distant-ridge surface.
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
 * @evidence spaces/site.md Places four foothold bands around the local site within a 220 m square.
 * @evidence principles/core/source-units.md#source-scope-preservation Fills only the area outside the site extent.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns a rectangle list.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly implements the distant-ridge foothold extent.
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

/**
 * @evidence spaces/site.md Emits foothold ground tops as surface.site-distant.ground.
 * @evidence principles/core/source-units.md#source-scope-preservation Creates only top surfaces extending the site grade rule.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns grade-band tops for four foothold bands; with ridge triangles these form the open site-distant model.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly implements the distant-ridge foothold surface.
 */
export const templeFootholdFaces = (): WallFace[] =>
  templeFootholdRects().flatMap((rect) => gradeTopFaces(rect, "surface.site-distant.ground"));
