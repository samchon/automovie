import {
  type IAutoMovieDrawingTriangle,
  autoMovieBoundaryFacePoint,
  autoMovieBoundaryShellTriangles,
  autoMovieOpeningArea,
  autoMovieOpeningExtent,
  autoMovieOpeningFillExtent,
  autoMovieOpeningHasArc,
  autoMovieOpeningOutlinePoints,
  deriveAutoMovieDrawing,
  deriveAutoMovieDrawingSchedule,
  triangulateAutoMoviePolygon,
} from "@automovie/engine";
import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieDrawingGap,
  IAutoMovieDrawingSchedule,
  IAutoMovieOpeningProfile,
  IAutoMoviePlanarPoint,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { drawingView } from "./drawingFixtures";
import { namedFacts, nclose, throwsError, vclose } from "./predicates";
import { test12ValuesClose } from "./test12ValuesClose";

/** Original opening-schedule scenarios 5 through 7 with unchanged authored geometry cases. */
export function test02DrawingOpeningGeometry(
  environment: IAutoMovieBuiltEnvironment,
): void {
  // 5. Connectors.
  const connectors: IAutoMovieDrawingSchedule = deriveAutoMovieDrawingSchedule({
    environment,
    subject: "connector",
  });
  TestValidator.predicate(
    "a connector is scheduled at the section that governs it",
    test12ValuesClose(
      [connectors.total, connectors.rows],
      [
        2,
        [
          {
            mark: "ramp-01",
            kind: "ramp",
            model: null,
            // Sampled 1.5 and 1.2 wide, 2.2 and 2.4 clear: the narrowest and the
            // lowest are what the ramp is actually limited by.
            width: 1.2,
            height: 2.2,
            count: 1,
            members: ["service-ramp"],
            omittedMembers: 0,
            basis: "profile",
            place: {
              kind: "connector",
              building: "unit-a",
              stops: ["hall", "roof-deck"],
            },
          },
          {
            mark: "stair-01",
            kind: "stair",
            model: null,
            width: 1.2,
            height: 2.1,
            count: 1,
            members: ["roof-stair"],
            omittedMembers: 0,
            basis: "profile",
            place: {
              kind: "connector",
              building: "unit-a",
              stops: ["hall", "roof-deck"],
            },
          },
        ],
      ],
    ),
  );
  TestValidator.equals(
    "a connector schedule refuses to read a scheduled stair as a climbable one",
    connectors.gaps.map((gap: IAutoMovieDrawingGap): string[] => [
      gap.subject,
      gap.status,
    ]),
    [
      // `connector-location` used to sit here. A connector row now states the
      // regions its declared stops stand in, so there is no gap to declare.
      ["traversal-performance", "unsupported"],
    ],
  );

  // 6-7. Void and face geometry.
  const door: IAutoMovieOpeningProfile = environment.openings[0]!.profile!;
  const oculus: IAutoMovieOpeningProfile = environment.openings[1]!.profile!;
  TestValidator.equals(
    "a void is measured from its arcs and drafted from its chords",
    namedFacts([
      [
        "a rectangular void is 0.9 by 2.1 and 1.89 square metres",
        (): boolean =>
          nclose(autoMovieOpeningExtent(door).width, 0.9, 0) &&
          nclose(autoMovieOpeningExtent(door).height, 2.1, 0) &&
          nclose(autoMovieOpeningArea(door), 1.89, 0),
      ],
      [
        "a circular void of radius 0.3 is 0.6 across and pi times 0.09 in area",
        (): boolean =>
          nclose(autoMovieOpeningExtent(oculus).width, 0.6, 0) &&
          nclose(autoMovieOpeningArea(oculus), Math.PI * 0.09),
      ],
      [
        "a rectangle is drafted through its own four corners and no more",
        (): boolean => autoMovieOpeningOutlinePoints(door).length === 4,
      ],
      [
        "a half-turn arc is drafted as sixteen chords at the fixed density",
        (): boolean => autoMovieOpeningOutlinePoints(oculus).length === 32,
      ],
      [
        "the first arc leans to the left of its own edge, as the hull does",
        (): boolean =>
          autoMovieOpeningOutlinePoints(oculus)
            .slice(1, 16)
            .every(
              (point: IAutoMoviePlanarPoint): boolean =>
                point.y > 2 && !nclose(point.y, 2),
            ),
      ],
      [
        "an arc too shallow to need a chord is drafted as its own endpoints",
        (): boolean =>
          autoMovieOpeningOutlinePoints({
            outline: [
              { x: 0, y: 0 },
              { x: 1, y: 0 },
              { x: 1, y: 1 },
            ],
            bulges: [0.02, 0, 0],
          }).length === 3,
      ],
      [
        "a zero-length edge carries no arc at all",
        (): boolean =>
          autoMovieOpeningOutlinePoints({
            outline: [
              { x: 0, y: 0 },
              { x: 0, y: 0 },
              { x: 1, y: 1 },
            ],
            bulges: [1, 0, 0],
          }).length === 3,
      ],
      [
        "a profile that states no bulge and one that states only zeros are straight",
        (): boolean =>
          autoMovieOpeningHasArc(door) === false &&
          autoMovieOpeningHasArc({ ...door, bulges: [0, 0, 0, 0] }) === false &&
          autoMovieOpeningHasArc(oculus) === true,
      ],
      [
        "an inward left bulge encloses less than the chord's own polygon",
        (): boolean => {
          const area: number = autoMovieOpeningArea({
            outline: [
              { x: 0, y: 0 },
              { x: 1, y: 0 },
              { x: 1, y: 1 },
              { x: 0, y: 1 },
            ],
            bulges: [0.5, 0, 0, 0],
          });
          return area < 1 && !nclose(area, 1);
        },
      ],
      [
        "a leaf lying on its side is described as the wide, thin thing it is",
        (): boolean =>
          nclose(
            autoMovieOpeningFillExtent([
              { x: 0, y: 0, z: 0 },
              { x: 2, y: 0.1, z: 0.5 },
            ]).width,
            2,
            0,
          ) &&
          nclose(
            autoMovieOpeningFillExtent([
              { x: 0, y: 0, z: 0 },
              { x: 2, y: 0.1, z: 0.5 },
            ]).height,
            0.1,
            0,
          ),
      ],
    ]),
    {
      "a rectangular void is 0.9 by 2.1 and 1.89 square metres": true,
      "a circular void of radius 0.3 is 0.6 across and pi times 0.09 in area": true,
      "a rectangle is drafted through its own four corners and no more": true,
      "a half-turn arc is drafted as sixteen chords at the fixed density": true,
      "the first arc leans to the left of its own edge, as the hull does": true,
      "an arc too shallow to need a chord is drafted as its own endpoints": true,
      "a zero-length edge carries no arc at all": true,
      "a profile that states no bulge and one that states only zeros are straight": true,
      "an inward left bulge encloses less than the chord's own polygon": true,
      "a leaf lying on its side is described as the wide, thin thing it is": true,
    },
  );
  TestValidator.equals(
    "a drawing with an arced void says its linework is chorded",
    deriveAutoMovieDrawing({ environment, view: drawingView() }).gaps.find(
      (gap: IAutoMovieDrawingGap): boolean => gap.subject === "curved-linework",
    )?.status,
    "unsupported",
  );

  const square: { x: number; y: number }[] = [
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: 2, y: 2 },
    { x: 0, y: 2 },
  ];
  TestValidator.equals(
    "face and polygon probes match selected triangle counts, points and area",
    namedFacts([
      [
        "a counter-clockwise square and its clockwise twin each yield twelve triangles",
        (): boolean => {
          const forward: IAutoMovieDrawingTriangle[] =
            autoMovieBoundaryShellTriangles({
              origin: { x: 0, y: 0, z: 0 },
              rotation: { x: 0, y: 0, z: 0, w: 1 },
              outline: square,
              thickness: 0.5,
            });
          const reversed: IAutoMovieDrawingTriangle[] =
            autoMovieBoundaryShellTriangles({
              origin: { x: 0, y: 0, z: 0 },
              rotation: { x: 0, y: 0, z: 0, w: 1 },
              outline: [...square].reverse(),
              thickness: 0.5,
            });
          // Four side quads of two triangles, plus two caps of two each.
          return forward.length === 12 && reversed.length === 12;
        },
      ],
      [
        "a face point walks the frame's own outward normal by the depth asked for",
        (): boolean =>
          vclose(
            autoMovieBoundaryFacePoint(
              {
                origin: { x: 1, y: 2, z: 3 },
                rotation: { x: 0, y: 0, z: 0, w: 1 },
                outline: square,
                thickness: 0.5,
              },
              { x: 0.25, y: 0.5 },
            ),
            { x: 1.25, y: 2.5, z: 3 },
          ) &&
          vclose(
            autoMovieBoundaryFacePoint(
              {
                origin: { x: 1, y: 2, z: 3 },
                rotation: { x: 0, y: 0, z: 0, w: 1 },
                outline: square,
                thickness: 0.5,
              },
              { x: 0.25, y: 0.5 },
              0.5,
            ),
            { x: 1.25, y: 2.5, z: 3.5 },
          ),
      ],
      [
        "a triangle is already a triangulation",
        (): boolean =>
          triangulateAutoMoviePolygon([
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 0, y: 1 },
          ]).length === 1,
      ],
      [
        "a square is two triangles",
        (): boolean => triangulateAutoMoviePolygon(square).length === 2,
      ],
      [
        "fewer than three corners is refused, not returned as an empty face",
        (): boolean =>
          throwsError(
            (): [number, number, number][] =>
              triangulateAutoMoviePolygon(square.slice(0, 2)),
            "a polygon needs at least 3 corners to triangulate, but had 2",
          ),
      ],
      [
        "a concave outline yields four triangles with summed area five",
        (): boolean => {
          const ell: { x: number; y: number }[] = [
            { x: 0, y: 0 },
            { x: 3, y: 0 },
            { x: 3, y: 1 },
            { x: 1, y: 1 },
            { x: 1, y: 3 },
            { x: 0, y: 3 },
          ];
          const triangles: Array<[number, number, number]> =
            triangulateAutoMoviePolygon(ell);
          // Any simple polygon of n corners triangulates into n - 2 triangles,
          // and the summed area is the L's own 5 square metres. This does not
          // separately check overlap or containment of every triangle.
          const area: number = triangles.reduce(
            (
              sum: number,
              [first, second, third]: [number, number, number],
            ): number => {
              const a: { x: number; y: number } = ell[first]!;
              const b: { x: number; y: number } = ell[second]!;
              const c: { x: number; y: number } = ell[third]!;
              return (
                sum +
                Math.abs(
                  (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x),
                ) /
                  2
              );
            },
            0,
          );
          return triangles.length === 4 && nclose(area, 5);
        },
      ],
    ]),
    {
      "a counter-clockwise square and its clockwise twin each yield twelve triangles": true,
      "a face point walks the frame's own outward normal by the depth asked for": true,
      "a triangle is already a triangulation": true,
      "a square is two triangles": true,
      "fewer than three corners is refused, not returned as an empty face": true,
      "a concave outline yields four triangles with summed area five": true,
    },
  );
}
