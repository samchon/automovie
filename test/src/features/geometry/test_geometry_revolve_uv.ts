import {
  type IAutoMovieProfilePoint,
  buildAutoMovieWall,
  extrudeAutoMovieRegion,
  inspectAutoMovieMeshTopology,
  mergeAutoMovieMeshes,
  revolveAutoMovieProfile,
} from "@automovie/engine";
import { type IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { equalGeometryTestValues } from "../internal/equalGeometryTestValues";
import { namedFacts, nclose } from "../internal/predicates";

/** The uv pair the vertex at `at` carries. */
const uvAt: (uvs: readonly number[], at: number) => { u: number; v: number } = (
  uvs: readonly number[],
  at: number,
): { u: number; v: number } => ({ u: uvs[at * 2]!, v: uvs[at * 2 + 1]! });

const CYLINDER_RADIUS: number = 1;
const CYLINDER_HEIGHT: number = 2;
const CYLINDER_SEGMENTS: number = 4;

/** A straight meridian at a constant radius: an open tube, rim at each end. */
const cylinderProfile: IAutoMovieProfilePoint[] = [
  { x: CYLINDER_RADIUS, y: 0 },
  { x: CYLINDER_RADIUS, y: CYLINDER_HEIGHT },
];

/**
 * The emitted atlas measures decreasing angular arc and meridian travel.
 *
 * Every expected number is the surface's own geometry rather than the builder's
 * output. A cylinder of radius 1 m has a circumference of exactly `2 * pi` m, so
 * the first ring must read that and the closing ring zero; its
 * meridian is 2 m of straight polyline, so the far ring must read 2. A cone's
 * meridian rising 1 m over 1 m of radius is `sqrt(2)` m of slant, not the 1 m
 * of either leg.
 *
 * Scenarios:
 *
 * 1. A revolved surface carries one uv pair per vertex.
 * 2. The seam is an explicit cut over the true circumference: around runs
 *    against the build direction as `2 * pi - theta` so the atlas stays
 *    right-handed, which puts `2 * pi * r` on the first ring and zero on the
 *    duplicate closing ring. The sampled phases are deliberately unequal when the repeat does not
 *    divide that circumference.
 * 3. Along is the meridian's own length, so a 2 m tube spans 0 to 2, and one
 *    quarter of the way round the lattice reads `3 * pi / 2` m of arc because
 *    around counts down; both are metres and neither is in `[0, 1]`.
 * 4. A cone's slant is measured as slant: `sqrt(2)` for a meridian rising 1 m
 *    over 1 m, and its pole ring reads zero around at every segment, because a
 *    circle of no radius has no arc to travel. The six collapsed pole triangles
 *    remain the operator's declared degenerates while every UV stays finite;
 *    the open-tube twin has none.
 * 5. A merge with another coordinate-bearing member keeps the coordinates, and a
 *    merge with a coordinate-less one drops them for the whole assembly, which
 *    is the stated all-or-nothing rule.
 * 6. The same authored meridian rebuilds with exact finite values and structure.
 *
 * @evidence contracts/testing.md#behavioral-verification Revolves the existing tube/cone meridians and asserts UV cardinality, seam endpoints and quarter-turn arc, meridian/slant travel, zero pole arc, finite pole UVs and declared degeneracy. Merge keeps UVs only when all members carry them, and repeated tube construction retains exact numeric structure.
 * @evidence contracts/testing.md#independent-expectations Angular arc is (2*pi-theta)*radius; a unit-radius tube spans 2*pi to zero and two metres along its meridian. A unit radial/vertical cone has sqrt(2) slant and six pole-degenerate triangles. These analytic UV expectations do not assert equality with each faceted chord's length, general density/shear or rendered seam filtering; deterministic rebuild is compatibility evidence.
 * @evidence contracts/testing.md#distinguishing-cases Preserves tube versus axis-pole cone, first/quarter/closing arc samples, all meridian station heights, pole zeroes and finite UVs, merge with UV-bearing plate versus bare wall, and exact repeat. Normal seam continuity, atlas distortion and malformed meridians have separate owners.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry directly invokes portable revolution/merge/region/wall/topology source on its unchanged fixtures and canonical observers. It installs no consumer, builds no native artifact and starts no process, browser or GPU; all six scenarios remain locally owned without dynamic registration.
 */
export function test_geometry_revolve_uv(): void {
  const tube: IAutoMovieMesh = revolveAutoMovieProfile({
    profile: cylinderProfile,
    segments: CYLINDER_SEGMENTS,
  });
  TestValidator.equals(
    "a revolved surface carries one uv pair per vertex",
    {
      pairs: tube.uvs?.length,
      vertices: (tube.positions.length / 3) * 2,
    },
    {
      pairs: (CYLINDER_SEGMENTS + 1) * cylinderProfile.length * 2,
      vertices: (CYLINDER_SEGMENTS + 1) * cylinderProfile.length * 2,
    },
  );

  const circumference: number = 2 * Math.PI * CYLINDER_RADIUS;
  const closing: number = CYLINDER_SEGMENTS * cylinderProfile.length;
  TestValidator.equals(
    "the seam cut spans the true circumference, in metres of arc",
    namedFacts([
      ["firstRing", (): boolean => nclose(uvAt(tube.uvs!, 0).u, circumference)],
      ["closingRing", (): boolean => nclose(uvAt(tube.uvs!, closing).u, 0)],
      [
        "quarterTurn",
        (): boolean =>
          nclose(
            uvAt(tube.uvs!, cylinderProfile.length).u,
            circumference - Math.PI / 2,
          ),
      ],
      ["notNormalized", (): boolean => uvAt(tube.uvs!, 0).u > 1],
      [
        "phaseIsACut",
        (): boolean =>
          nclose(uvAt(tube.uvs!, closing).u, uvAt(tube.uvs!, 0).u) === false,
      ],
    ]),
    {
      firstRing: true,
      closingRing: true,
      quarterTurn: true,
      notNormalized: true,
      phaseIsACut: true,
    },
  );

  TestValidator.equals(
    "along is the meridian's own length, in metres",
    namedFacts([
      ["foot", (): boolean => nclose(uvAt(tube.uvs!, 0).v, 0)],
      ["head", (): boolean => nclose(uvAt(tube.uvs!, 1).v, CYLINDER_HEIGHT)],
      [
        "sameAtEverySegment",
        (): boolean =>
          Array.from(
            { length: CYLINDER_SEGMENTS + 1 },
            (_ring: unknown, segment: number): boolean =>
              nclose(
                uvAt(tube.uvs!, segment * cylinderProfile.length + 1).v,
                CYLINDER_HEIGHT,
              ),
          ).every((level: boolean): boolean => level),
      ],
    ]),
    { foot: true, head: true, sameAtEverySegment: true },
  );

  // A cone standing on its point: the meridian rises 1 m while the radius opens
  // 1 m, so its slant is sqrt(2) and its first point sits on the axis.
  const cone: IAutoMovieMesh = revolveAutoMovieProfile({
    profile: [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ],
    segments: 6,
  });
  TestValidator.equals(
    "a cone measures slant as slant, and its pole has no arc to travel",
    namedFacts([
      ["slant", (): boolean => nclose(uvAt(cone.uvs!, 1).v, Math.SQRT2)],
      [
        "poleRing",
        (): boolean =>
          Array.from(
            { length: 7 },
            (_ring: unknown, segment: number): boolean =>
              nclose(uvAt(cone.uvs!, segment * 2).u, 0),
          ).every((flat: boolean): boolean => flat),
      ],
      ["rimStart", (): boolean => nclose(uvAt(cone.uvs!, 1).u, 2 * Math.PI)],
      [
        "rimHalfTurn",
        (): boolean => nclose(uvAt(cone.uvs!, 3 * 2 + 1).u, Math.PI),
      ],
      ["rimFullTurn", (): boolean => nclose(uvAt(cone.uvs!, 6 * 2 + 1).u, 0)],
    ]),
    {
      slant: true,
      poleRing: true,
      rimStart: true,
      rimHalfTurn: true,
      rimFullTurn: true,
    },
  );

  TestValidator.equals(
    "a pole keeps finite coordinates on declared degenerates; an open tube has none",
    {
      coneDegenerates: inspectAutoMovieMeshTopology(cone).degenerate,
      coneUvsFinite: cone.uvs!.every(Number.isFinite),
      tubeDegenerates: inspectAutoMovieMeshTopology(tube).degenerate,
    },
    { coneDegenerates: 6, coneUvsFinite: true, tubeDegenerates: 0 },
  );

  const plate: IAutoMovieMesh = extrudeAutoMovieRegion({
    outer: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ],
    depth: 0.1,
  });
  const panel: IAutoMovieMesh = buildAutoMovieWall({
    width: 1,
    height: 1,
    depth: 0.1,
    openings: [],
  });
  TestValidator.equals(
    "a merge keeps coordinates only when every member carries them",
    {
      withBearer:
        mergeAutoMovieMeshes([tube, plate]).uvs?.length ===
        tube.uvs!.length + plate.uvs!.length,
      withoutBearer: mergeAutoMovieMeshes([tube, panel]).uvs,
    },
    { withBearer: true, withoutBearer: null },
  );

  TestValidator.predicate(
    "the same authored meridian rebuilds with exact finite values and structure",
    equalGeometryTestValues(
      revolveAutoMovieProfile({
        profile: cylinderProfile,
        segments: CYLINDER_SEGMENTS,
      }),
      tube,
    ),
  );
}
