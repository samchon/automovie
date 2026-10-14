import {
  type IAutoMovieMesh,
  type IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { buildAutoMoviePolyhedron, extrudeAutoMovieRegion, loftAutoMovieSections } from "@automovie/engine";


import { type IAtlasDensityRange } from "../internal/IAtlasDensityRange";
import { atlasDensityRange } from "../internal/atlasDensityRange";
import { namedFacts } from "../internal/namedFacts";
import { nclose } from "../internal/nclose";

/** The largest `v` any vertex of a mesh carries. */
const longestAlong: (mesh: IAutoMovieMesh) => number = (
  mesh: IAutoMovieMesh,
): number => {
  let longest: number = Number.NEGATIVE_INFINITY;
  for (let at: number = 1; at < mesh.uvs!.length; at += 2)
    longest = Math.max(longest, mesh.uvs![at]!);
  return longest;
};

/**
 * A rectangular section, wound counter-clockwise.
 *
 * `x` runs in the plane the path turns in and `y` perpendicular to it, which is
 * the distinction the bend cases are built to separate.
 */
const rectangle: (
  halfWidth: number,
  halfHeight: number,
) => { x: number; y: number }[] = (
  halfWidth: number,
  halfHeight: number,
): { x: number; y: number }[] => [
  { x: -halfWidth, y: -halfHeight },
  { x: halfWidth, y: -halfHeight },
  { x: halfWidth, y: halfHeight },
  { x: -halfWidth, y: halfHeight },
];

/** A square section of the given half-width. */
const square: (half: number) => { x: number; y: number }[] = (
  half: number,
): { x: number; y: number }[] => rectangle(half, half);

/** One polyhedron corner, written positionally so a face list stays readable. */
const corner: (x: number, y: number, z: number) => IAutoMovieVector3 = (
  x: number,
  y: number,
  z: number,
): IAutoMovieVector3 => ({
  x,
  y,
  z,
});

/** A quarter-turn path of radius `radius`, sampled as a polyline. */
const quarterTurn: (radius: number, steps: number) => IAutoMovieVector3[] = (
  radius: number,
  steps: number,
): IAutoMovieVector3[] =>
  Array.from(
    { length: steps + 1 },
    (_station: unknown, at: number): IAutoMovieVector3 => {
      const angle: number = (at / steps) * (Math.PI / 2);
      return {
        x: radius * Math.sin(angle),
        y: 0,
        z: radius - radius * Math.cos(angle),
      };
    },
  );

/** One loft of a constant rectangular section around a quarter turn. */
const bend: (
  radius: number,
  halfWidth: number,
  halfHeight: number,
) => IAutoMovieMesh = (
  radius: number,
  halfWidth: number,
  halfHeight: number,
): IAutoMovieMesh =>
  loftAutoMovieSections({
    path: quarterTurn(radius, 96),
    sections: [
      { at: 0, outer: rectangle(halfWidth, halfHeight) },
      { at: 1, outer: rectangle(halfWidth, halfHeight) },
    ],
  });

const STRAIGHT_PATH: IAutoMovieVector3[] = [
  { x: 0, y: 0, z: 0 },
  { x: 0, y: 0, z: 4 },
];

/**
 * The texel density a lofted atlas keeps, and the two ways it does not.
 *
 * Loft V measures path travel, which differs from surface travel on tapering
 * and bent sides. Independent triangle area measurements distinguish that loss
 * from the straight loft, region extrusion and projected polyhedron frames.
 * This test measures atlas area only; it observes neither a revolution nor
 * directional shear, filtering or the appearance of a finish.
 *
 * Every expected number is the geometry's own, not the builder's. A taper tilts
 * each ruling off the path by its own angle, so a leg carries that angle's
 * cosine; a bend of curvature radius `R` carries a section point sitting `d`
 * from the path through `(R + d) / R` times the path's own travel, so its area
 * ratio is `R / (R + d)`. A polyline path only approaches a true arc, so the
 * inner extreme is allowed the error its own sampling admits while the outer
 * one, which falls on a station rather than between two, is compared at 1e-9.
 *
 * Scenarios:
 *
 * 1. A straight run of constant section is exactly equiareal, every triangle
 *    reading 1, so the frame itself is not what loses area.
 * 2. The other two frames keep area exactly: a region extrusion, developed in
 *    the same metre pair, and a pyramid whose sloped and level faces exercise
 *    both branches of the projected frame. Being developed is therefore not the
 *    cause; taking `v` from the path is. Anisotropy would not have settled this,
 *    because a frame scaled equally on both axes is isotropic and still moves
 *    area, so the area ratio is read directly.
 * 3. A section growing 0.5 m over 4 m of path reads `cos(atan(0.125))` on every
 *    side triangle, the reciprocal of the ruling's length per path metre.
 * 4. A bend costs far more than a taper. A 2 m turn carrying a 0.5 m half
 *    section reads exactly `R / (R + d)` at 0.8 outside and `R / (R - d)` at
 *    4 / 3 inside: a 1.67 to 1 density range across one member, from a section
 *    that never changes.
 * 5. `d / R` alone decides it. A bend twenty times as large carrying a section
 *    twenty times as wide reports the identical extremes, so building the
 *    member bigger is not the remedy an author would reach for first.
 * 6. The mechanism, not just the symptom: the tapered loft and the straight one
 *    carry the identical `v` span, both exactly the path length, although only
 *    the straight one's atlas keeps its area. `v` is therefore a fact about the
 *    path and blind to the surface it is laid on.
 * 7. The negative twin, one property away. `d` is the offset into the plane the
 *    path turns in and not the distance from the path, so a section four times
 *    as tall at the same width reads the identical extremes while a tenth of
 *    the width reads a tenth of the spread and twice the width reads 0.667 to
 *    2. Around a level bend the width costs density and the height costs none.
 * 8. None of the bounds was taken over a shrinking subset. Every mesh measured
 *    carries zero triangles with surface area at or below 1e-12, so no band dropped
 *    out of an extreme and left the survivors looking well behaved.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs loft, region extrusion and polyhedron builders, measuring every emitted indexed triangle's UV-area/surface-area ratio and asserting straight/taper/bend extrema, path-v span, scale and width-versus-height behavior. The degenerate count prevents the helper's excluded small-area triangles from silently shrinking these samples.
 * @evidence contracts/testing.md#independent-expectations Straight developed frames have area ratio one; taper ruling tilt gives 1/hypot(1,0.125), and circular geometry gives R/(R+d). The 96-segment bend only approximates an arc, with the retained 1e-3 inner and 1e-9 outer tolerances. Ratios from emitted triangles measure area, not directional shear, texel filtering or a rendered finish.
 * @evidence contracts/testing.md#distinguishing-cases Keeps straight, tapered, region and projected-face frames; bends at two absolute scales; tall, narrow and wide sections; common path-v span; and zero small-area exclusions for all nine meshes. Atlas anisotropy and malformed builder inputs belong to other procedural tests.
 * @evidence contracts/testing.md#execution-ownership The named geometry entry directly calls portable builders and the existing canonical area observer on its unchanged fixtures. It starts no process, browser, GPU or native build, and dynamically registers no cases; the measurements cannot establish visual appearance.
 */
export function test_geometry_loft_atlas_density(): void {
  const straight: IAutoMovieMesh = loftAutoMovieSections({
    path: STRAIGHT_PATH,
    sections: [
      { at: 0, outer: square(0.5) },
      { at: 1, outer: square(0.5) },
    ],
  });
  const level: IAtlasDensityRange = atlasDensityRange(straight);
  TestValidator.equals(
    "a straight run of constant section keeps every texel exactly",
    namedFacts([
      ["leastIsOne", (): boolean => nclose(level.least, 1, 1e-12)],
      ["mostIsOne", (): boolean => nclose(level.most, 1, 1e-12)],
    ]),
    { leastIsOne: true, mostIsOne: true },
  );

  const prism: IAtlasDensityRange = atlasDensityRange(
    extrudeAutoMovieRegion({ outer: square(0.5), depth: 4 }),
  );
  // A pyramid exercises both branches of the projected frame at once: four
  // sloped faces take world up projected into their plane, the base is level
  // and takes world +X. An anisotropy of 1 would not settle this, because a
  // frame scaled equally on both axes is isotropic and still changes area.
  const faceted: IAtlasDensityRange = atlasDensityRange(
    buildAutoMoviePolyhedron([
      [corner(-1, 0, -1), corner(1, 0, -1), corner(0, 2, 0)],
      [corner(1, 0, -1), corner(1, 0, 1), corner(0, 2, 0)],
      [corner(1, 0, 1), corner(-1, 0, 1), corner(0, 2, 0)],
      [corner(-1, 0, 1), corner(-1, 0, -1), corner(0, 2, 0)],
      [corner(-1, 0, -1), corner(-1, 0, 1), corner(1, 0, 1), corner(1, 0, -1)],
    ]),
  );
  TestValidator.equals(
    "the other two frames keep area exactly, so being developed is not the cause",
    namedFacts([
      ["regionExtrusionLeast", (): boolean => nclose(prism.least, 1, 1e-12)],
      ["regionExtrusionMost", (): boolean => nclose(prism.most, 1, 1e-12)],
      ["projectedFrameLeast", (): boolean => nclose(faceted.least, 1, 1e-12)],
      ["projectedFrameMost", (): boolean => nclose(faceted.most, 1, 1e-12)],
    ]),
    {
      regionExtrusionLeast: true,
      regionExtrusionMost: true,
      projectedFrameLeast: true,
      projectedFrameMost: true,
    },
  );

  // Half-width 0.5 grows to 1 over 4 m of path, so each face leans 0.125 off it.
  const taper: IAutoMovieMesh = loftAutoMovieSections({
    path: STRAIGHT_PATH,
    sections: [
      { at: 0, outer: square(0.5) },
      { at: 1, outer: square(1) },
    ],
  });
  const tapered: IAtlasDensityRange = atlasDensityRange(taper);
  TestValidator.predicate(
    "a taper loses exactly the cosine of the angle its rulings lean off the path",
    nclose(tapered.least, 1 / Math.hypot(1, 0.125), 1e-9),
  );
  TestValidator.predicate(
    "and its caps, which are the section's own coordinates, keep their area",
    nclose(tapered.most, 1, 1e-12),
  );

  const turn: IAtlasDensityRange = atlasDensityRange(bend(2, 0.5, 0.5));
  TestValidator.equals(
    "a bend stretches the outside and crowds the inside by R / (R +- d)",
    namedFacts([
      ["outsideIsExact", (): boolean => nclose(turn.least, 2 / 2.5, 1e-9)],
      ["insideMatchesTheForm", (): boolean => nclose(turn.most, 2 / 1.5, 1e-3)],
      ["whichIsAWideRange", (): boolean => turn.most / turn.least > 1.66],
    ]),
    {
      outsideIsExact: true,
      insideMatchesTheForm: true,
      whichIsAWideRange: true,
    },
  );

  const larger: IAtlasDensityRange = atlasDensityRange(bend(40, 10, 10));
  TestValidator.equals(
    "d / R alone decides it, so a member twenty times the size reads the same",
    namedFacts([
      ["sameOutside", (): boolean => nclose(larger.least, turn.least, 1e-12)],
      ["sameInside", (): boolean => nclose(larger.most, turn.most, 1e-12)],
    ]),
    { sameOutside: true, sameInside: true },
  );

  // The negative twin: one property away, where the loss must not appear. Both
  // sections reach further from the path than the square above, one across the
  // turn and one perpendicular to it, and only the first pays for it.
  const tall: IAtlasDensityRange = atlasDensityRange(bend(2, 0.5, 2));
  const narrow: IAtlasDensityRange = atlasDensityRange(bend(2, 0.05, 2));
  const flat: IAtlasDensityRange = atlasDensityRange(bend(2, 1, 0.05));
  TestValidator.equals(
    "d is the offset into the turn, so height costs nothing and width costs all",
    namedFacts([
      [
        "fourTimesTallerReadsIdentically",
        (): boolean => nclose(tall.least, turn.least),
      ],
      ["andIdenticallyInside", (): boolean => nclose(tall.most, turn.most)],
      [
        "aTenthTheWidthOutside",
        (): boolean => nclose(narrow.least, 2 / 2.05, 1e-9),
      ],
      [
        "aTenthTheWidthInside",
        (): boolean => nclose(narrow.most, 2 / 1.95, 1e-3),
      ],
      ["twiceTheWidthOutside", (): boolean => nclose(flat.least, 2 / 3, 1e-9)],
      ["twiceTheWidthInside", (): boolean => nclose(flat.most, 2 / 1, 1e-3)],
    ]),
    {
      fourTimesTallerReadsIdentically: true,
      andIdenticallyInside: true,
      aTenthTheWidthOutside: true,
      aTenthTheWidthInside: true,
      twiceTheWidthOutside: true,
      twiceTheWidthInside: true,
    },
  );

  TestValidator.equals(
    "v counts the path rather than the surface, which is where the area goes",
    namedFacts([
      [
        "straightAlongIsThePath",
        (): boolean => nclose(longestAlong(straight), 4, 1e-12),
      ],
      [
        "taperedCarriesTheSameSpan",
        (): boolean =>
          nclose(longestAlong(taper), longestAlong(straight), 1e-12),
      ],
      [
        "yetOnlyOneOfThemKeptItsArea",
        (): boolean => tapered.least < level.least,
      ],
    ]),
    {
      straightAlongIsThePath: true,
      taperedCarriesTheSameSpan: true,
      yetOnlyOneOfThemKeptItsArea: true,
    },
  );

  TestValidator.equals(
    "every bound above was taken over real area, none of it over a collapsed band",
    namedFacts(
      (
        [
          ["straight", level],
          ["prism", prism],
          ["faceted", faceted],
          ["taper", tapered],
          ["turn", turn],
          ["larger", larger],
          ["tall", tall],
          ["narrow", narrow],
          ["flat", flat],
        ] as ReadonlyArray<readonly [string, IAtlasDensityRange]>
      ).map(
        ([name, measured]: readonly [string, IAtlasDensityRange]): readonly [
          string,
          () => boolean,
        ] => [name, (): boolean => measured.degenerate === 0] as const,
      ),
    ),
    {
      straight: true,
      prism: true,
      faceted: true,
      taper: true,
      turn: true,
      larger: true,
      tall: true,
      narrow: true,
      flat: true,
    },
  );
}
