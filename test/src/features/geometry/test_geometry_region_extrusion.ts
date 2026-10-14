import {
  type IAutoMovieMeshTopology,
  type IAutoMovieProfilePoint,
  buildAutoMovieWall,
  extrudeAutoMovieProfile,
  extrudeAutoMovieRegion,
  inspectAutoMovieMeshTopology,
  validateMeshTopology,
  validateModel,
} from "@automovie/engine";
import { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { equalGeometryTestValues } from "../internal/equalGeometryTestValues";
import { makeProp } from "../internal/fixtures";
import { namedFacts, nclose, throwsError } from "../internal/predicates";

/** One prop model carrying nothing but this mesh, as a model would hold it. */
const asPart: (mesh: IAutoMovieMesh) => IAutoMovieModel = (
  mesh: IAutoMovieMesh,
): IAutoMovieModel =>
  makeProp([
    {
      id: "member",
      name: null,
      geometry: { type: "mesh", mesh },
      material: null,
      attachedBone: null,
      transform: null,
    },
  ]);

const ell: IAutoMovieProfilePoint[] = [
  { x: 0, y: 0 },
  { x: 3, y: 0 },
  { x: 3, y: 1 },
  { x: 1, y: 1 },
  { x: 1, y: 3 },
  { x: 0, y: 3 },
];

const box: (half: number) => IAutoMovieProfilePoint[] = (
  half: number,
): IAutoMovieProfilePoint[] => [
  { x: -half, y: -half },
  { x: half, y: -half },
  { x: half, y: half },
  { x: -half, y: half },
];

/**
 * Check topology counts, declared closure, model admission and analytic volume.
 * These engine observers share weld semantics; their agreement is not an
 * independent surface or rendering oracle.
 */
const closes: (mesh: IAutoMovieMesh, volume: number) => boolean = (
  mesh: IAutoMovieMesh,
  volume: number,
): boolean => {
  const topology: IAutoMovieMeshTopology = inspectAutoMovieMeshTopology(mesh);
  return (
    topology.watertight &&
    topology.degenerate === 0 &&
    topology.nonFinite === 0 &&
    validateMeshTopology({ mesh, expectClosed: true }).success &&
    validateModel({ model: asPart(mesh) }).success &&
    nclose(topology.volume, volume, 1e-12)
  );
};

// A semicircle of `segments` chords on a chord of 2r: the rectangle below it
// plus `segments` isoceles triangles of apex angle pi / segments.
const ARCH_SEGMENTS: number = 8;
const ARCH_RADIUS: number = 0.6;
const archOpening: IAutoMovieProfilePoint[] = [
  { x: 1.4, y: 0.2 },
  { x: 2.6, y: 0.2 },
  ...Array.from(
    { length: ARCH_SEGMENTS + 1 },
    (_corner: unknown, step: number): IAutoMovieProfilePoint => ({
      x: 2 + ARCH_RADIUS * Math.cos((step * Math.PI) / ARCH_SEGMENTS),
      y: 1.5 + ARCH_RADIUS * Math.sin((step * Math.PI) / ARCH_SEGMENTS),
    }),
  ),
];
const ARCH_AREA: number =
  1.2 * 1.3 +
  0.5 *
    ARCH_SEGMENTS *
    ARCH_RADIUS *
    ARCH_RADIUS *
    Math.sin(Math.PI / ARCH_SEGMENTS);

const OCULUS_SEGMENTS: number = 12;
const OCULUS_RADIUS: number = 0.5;
const OCULUS_AREA: number =
  0.5 *
  OCULUS_SEGMENTS *
  OCULUS_RADIUS *
  OCULUS_RADIUS *
  Math.sin((2 * Math.PI) / OCULUS_SEGMENTS);

/**
 * Free-form extrusion, and with it the arbitrary-shape host opening.
 *
 * Every volume here is the region's hand-computed area times the depth, and
 * every area is closed-form rather than sampled: an L of legs 3x1 and 1x2 is 5
 * m², a semicircular arch on a 1.2 m chord is its rectangle plus eight isoceles
 * triangles of apex angle pi/8, and a twelve-sided oculus of radius 0.5 m is
 * exactly 0.75 m². The wall builder can cut none of these, and the convex
 * extrusion refuses all of them.
 *
 * Scenarios:
 *
 * 1. A concave L extrudes to a closed prism of `area * depth`, with the vertex and
 *    index counts a flat-shaded prism owns, while the convex extrusion still
 *    refuses the same profile: the escape hatch did not loosen the old gate.
 * 2. Normals and UVs are pinned by hand on the +Z cap and on the first side quad:
 *    the cap carries its own profile coordinates against +Z, and the side
 *    carries distance travelled along the ring against height.
 * 3. An arched opening and a round oculus each cut a real hole through a wall
 *    panel, closed and 2-manifold, of exactly the panel less the opening.
 * 4. An opening that reaches the floor is a concave outer ring rather than a hole,
 *    and closes to the same kind of solid.
 * 5. A hollow tube: the section's void runs the whole depth and the walls close
 *    around it.
 * 6. The -Z cap mirrors its V coordinate so its atlas reads from outside.
 * 7. The pinched shape `buildAutoMovieWall` refuses is refused here too, so the
 *    free-form path is not the way around a solid that touches itself.
 * 8. Determinism, and the refusal of a non-positive depth.
 *
 * @evidence contracts/testing.md#behavioral-verification Extrudes the existing concave L, polygonal arch/oculus openings, floor-reaching notch and hollow section; checks analytic volumes, finite closed topology/model admission, exact cap/side positions/normals/UVs and populations. Convex-profile, touching-ring/pinched-wall and invalid-depth boundaries retain named refusals beside valid construction and deterministic rebuild.
 * @evidence contracts/testing.md#independent-expectations L area five and rectangle-minus-opening areas determine prism volumes; the eight-chord arch and twelve-gon oculus use sums of isosceles-triangle areas, not true curved surfaces. Authored section coordinates, half-depth, ring travel and outward signs determine cap/side numeric arrays. Engine topology/model observers share weld rules; rebuild parity and these CPU quantities do not establish arbitrary embedded geometry or rendered openings.
 * @evidence contracts/testing.md#distinguishing-cases Preserves all eight numbered scenarios, concavity versus convex admission, holed versus notched region, both cap signs and first side atlas, touching-hole/wall-pinch refusals, repeat construction and zero/negative/infinite depth. General malformed planar rings, source provenance and atlas distortion belong to other region/loft entries.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry directly calls portable extrusion/wall/triangulation/topology/model source and existing canonical fixture/observers. It installs no consumer, builds no native artifact and starts no process, browser or GPU; it owns its cases without dynamic registration.
 */
export function test_geometry_region_extrusion(): void {
  const prism: IAutoMovieMesh = extrudeAutoMovieRegion({
    outer: ell,
    depth: 2,
  });
  TestValidator.equals(
    "a concave section extrudes to a closed prism the convex path still refuses",
    namedFacts([
      ["closed", (): boolean => closes(prism, 5 * 2)],
      // Six corners per cap, plus four corners for each of the six side quads.
      [
        "vertices",
        (): boolean => prism.positions.length === (6 + 6 + 6 * 4) * 3,
      ],
      ["indices", (): boolean => prism.indices!.length === (4 * 2 + 6 * 2) * 3],
      [
        "convexStillRefuses",
        (): boolean =>
          throwsError(
            (): IAutoMovieMesh =>
              extrudeAutoMovieProfile({ profile: ell, depth: 2 }),
            "profile must be convex and contain no interior points",
          ),
      ],
    ]),
    {
      closed: true,
      vertices: true,
      indices: true,
      convexStillRefuses: true,
    },
  );

  TestValidator.predicate(
    "the +Z cap and the first side quad carry the atlas they declare",
    equalGeometryTestValues(
      {
        capPositions: prism.positions.slice(0, 9),
        capNormals: prism.normals!.slice(0, 9),
        capUvs: prism.uvs!.slice(0, 6),
        // The sides start after both caps: six corners each.
        sidePositions: prism.positions.slice(36, 48),
        sideNormal: prism.normals!.slice(36, 39),
        sideUvs: prism.uvs!.slice(24, 32),
      },
      {
        capPositions: [0, 0, 1, 3, 0, 1, 3, 1, 1],
        capNormals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
        capUvs: [0, 0, 3, 0, 3, 1],
        sidePositions: [0, 0, 1, 0, 0, -1, 3, 0, -1, 3, 0, 1],
        sideNormal: [0, -1, 0],
        sideUvs: [0, 1, 0, -1, 3, -1, 3, 1],
      },
    ),
  );

  TestValidator.predicate(
    "the -Z cap mirrors V so its atlas reads from outside",
    equalGeometryTestValues(
      {
        positions: prism.positions.slice(24, 27),
        normals: prism.normals!.slice(24, 27),
        uvs: prism.uvs!.slice(16, 18),
      },
      { positions: [3, 1, -1], normals: [0, 0, -1], uvs: [3, -1] },
    ),
  );

  const panel: IAutoMovieProfilePoint[] = [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 3 },
    { x: 0, y: 3 },
  ];
  const arched: IAutoMovieMesh = extrudeAutoMovieRegion({
    outer: panel,
    holes: [archOpening],
    depth: 0.25,
  });
  const oculus: IAutoMovieMesh = extrudeAutoMovieRegion({
    outer: [
      { x: 0, y: 0 },
      { x: 3, y: 0 },
      { x: 3, y: 3 },
      { x: 0, y: 3 },
    ],
    holes: [
      Array.from(
        { length: OCULUS_SEGMENTS },
        (_corner: unknown, step: number): IAutoMovieProfilePoint => ({
          x:
            1.5 +
            OCULUS_RADIUS * Math.cos((2 * step * Math.PI) / OCULUS_SEGMENTS),
          y:
            1.5 +
            OCULUS_RADIUS * Math.sin((2 * step * Math.PI) / OCULUS_SEGMENTS),
        }),
      ),
    ],
    depth: 0.2,
  });
  TestValidator.equals(
    "an arch and a round oculus each cut a real hole through a wall panel",
    namedFacts([
      ["arch", (): boolean => closes(arched, (4 * 3 - ARCH_AREA) * 0.25)],
      [
        "archReveal",
        // Both caps triangulate fifteen corners bridged into seventeen, and
        // every one of those fifteen ring edges owns a reveal quad.
        (): boolean => arched.indices!.length === (15 * 2 + 15 * 2) * 3,
      ],
      ["oculus", (): boolean => closes(oculus, (3 * 3 - OCULUS_AREA) * 0.2)],
      ["oculusArea", (): boolean => nclose(OCULUS_AREA, 0.75, 1e-15)],
    ]),
    { arch: true, archReveal: true, oculus: true, oculusArea: true },
  );

  const doorway: IAutoMovieMesh = extrudeAutoMovieRegion({
    outer: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 2.1 },
      { x: 2, y: 2.1 },
      { x: 2, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 3 },
      { x: 0, y: 3 },
    ],
    depth: 0.25,
  });
  const tube: IAutoMovieMesh = extrudeAutoMovieRegion({
    outer: box(1),
    holes: [box(0.5)],
    depth: 3,
  });
  TestValidator.equals(
    "an opening reaching the floor is a notch, and a section's void runs the depth",
    namedFacts([
      ["doorway", (): boolean => closes(doorway, (4 * 3 - 1 * 2.1) * 0.25)],
      ["tube", (): boolean => closes(tube, (2 * 2 - 1 * 1) * 3)],
      [
        "tubeIndices",
        (): boolean => tube.indices!.length === (8 * 2 + 8 * 2) * 3,
      ],
    ]),
    { doorway: true, tube: true, tubeIndices: true },
  );

  // Two openings meeting at a corner pinch the standing wall to a line, which
  // is a surface no edge-pair rule can describe. The wall builder refuses it by
  // name; the free-form path must refuse the same shape rather than become the
  // way around it, and it does, because rings may not touch.
  TestValidator.equals(
    "the pinch the wall builder refuses is refused here by the ring-contact rule",
    namedFacts([
      [
        "wall",
        (): boolean =>
          throwsError(
            (): IAutoMovieMesh =>
              buildAutoMovieWall({
                width: 2,
                height: 2,
                depth: 0.2,
                openings: [
                  { id: "low", x: 0, y: 0, width: 1, height: 1 },
                  { id: "high", x: 1, y: 1, width: 1, height: 1 },
                ],
              }),
            "pinch the wall to a line",
          ),
      ],
      [
        "region",
        (): boolean =>
          throwsError(
            (): IAutoMovieMesh =>
              extrudeAutoMovieRegion({
                outer: [
                  { x: 0, y: 0 },
                  { x: 4, y: 0 },
                  { x: 4, y: 4 },
                  { x: 0, y: 4 },
                ],
                holes: [
                  [
                    { x: 1, y: 1 },
                    { x: 2, y: 1 },
                    { x: 2, y: 2 },
                    { x: 1, y: 2 },
                  ],
                  [
                    { x: 2, y: 2 },
                    { x: 3, y: 2 },
                    { x: 3, y: 3 },
                    { x: 2, y: 3 },
                  ],
                ],
                depth: 0.2,
              }),
            "polygon hole[0] and polygon hole[1] touch or cross",
          ),
      ],
    ]),
    { wall: true, region: true },
  );

  TestValidator.predicate(
    "the same authored region rebuilds with exact finite values and structure",
    equalGeometryTestValues(
      extrudeAutoMovieRegion({ outer: box(1), holes: [box(0.5)], depth: 3 }),
      tube,
    ),
  );

  for (const [name, depth] of [
    ["zero", 0],
    ["negative", -1],
    ["infinite", Number.POSITIVE_INFINITY],
  ] as ReadonlyArray<readonly [string, number]>)
    TestValidator.predicate(
      `a ${name} depth is refused by its own diagnostic`,
      throwsError(
        (): IAutoMovieMesh => extrudeAutoMovieRegion({ outer: ell, depth }),
        "polygon extrusion depth must be a finite number > 0",
      ),
    );
}
