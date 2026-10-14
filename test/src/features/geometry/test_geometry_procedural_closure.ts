import {
  type IAutoMovieProfilePoint,
  buildAutoMoviePolyhedron,
  buildAutoMovieWall,
  extrudeAutoMovieProfile,
  inspectAutoMovieMeshTopology,
  mergeAutoMovieMeshParts,
  revolveAutoMovieProfile,
  sweepAutoMovieProfile,
  transformAutoMovieMesh,
  validateMeshTopology,
  validateModel,
} from "@automovie/engine";
import { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { makeProp } from "../internal/fixtures";
import {
  hasViolation,
  namedFacts,
  violationCount,
} from "../internal/predicates";

const square: IAutoMovieProfilePoint[] = [
  { x: -0.5, y: -0.5 },
  { x: 0.5, y: -0.5 },
  { x: 0.5, y: 0.5 },
  { x: -0.5, y: 0.5 },
];

const prism: IAutoMovieMesh = extrudeAutoMovieProfile({
  profile: square,
  depth: 1,
});

const cutWall: IAutoMovieMesh = buildAutoMovieWall({
  width: 4,
  height: 3,
  depth: 0.2,
  openings: [
    { id: "door", x: 0.5, y: 0, width: 1, height: 2 },
    { id: "window", x: 2, y: 1, width: 1, height: 1 },
  ],
});

/** How many violations the engine raises against a declared closure. */
const closureViolations: (mesh: IAutoMovieMesh, closed: boolean) => number = (
  mesh: IAutoMovieMesh,
  closed: boolean,
): number =>
  violationCount(validateMeshTopology({ mesh, expectClosed: closed }));

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

/**
 * Every builder's closure is a declaration, and the engine's own verdict is
 * what holds it to it.
 *
 * The topology inspector and validator share source identity and weld rules.
 * The validator additionally checks winding and the caller's `expectClosed`
 * policy; model validation reaches that same topology owner. Agreement is a
 * compatibility observation and cannot detect a common weld defect or certify
 * arbitrary surface embedding.
 *
 * Scenarios:
 *
 * 1. Every builder that declares a closed solid — a prism, a revolve whose
 *    meridian lands on the axis, a capped sweep, a face-authored ridged roof,
 *    an uncut wall, a wall cut by an opening, a mirrored placement, and an
 *    assembly of members that do not touch — raises no violation at all under
 *    `expectClosed`.
 * 2. The open twin: a revolve whose meridian stays off the axis is a tube with a
 *    rim at each end. Declared open it is clean, declared closed it is refused
 *    for a boundary edge, so the declaration is a claim that can be wrong in
 *    both directions rather than a label.
 * 3. Members that overlap are not a solid: their shared faces make edges four
 *    triangles use, and the engine says so instead of this kernel pretending to
 *    the boolean union it does not have.
 * 4. Consumer parity: the cut wall goes into a model and `validateModel` accepts
 *    it, while the overlapping union is refused there with the same topology
 *    verdict.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds the eight existing closed solids and checks topology admission, distinguishes an open tube's zero versus sixteen boundary violations under the closure policy, refuses the shared-face assembly and observes the same wall/assembly decisions through model validation.
 * @evidence contracts/testing.md#independent-expectations Closed authored primitive/member boundaries require paired opposite edge incidence, and an eight-segment tube has eight open rim edges at each end. Translating the second unit prism by one makes their coincident face edges over-shared; those authored constructions determine expected admission independently of a stored output. Inspector, topology and model validators share engine weld semantics, so their agreement does not prove independent geometric or rendered validity.
 * @evidence contracts/testing.md#distinguishing-cases Preserves prism, axis-capped revolve, capped sweep, convex roof, uncut/cut wall, mirrored placement and separated assembly positives; the tube changes only closure policy, and adjacent prisms retain their refusal through both validation entries. Individual builders own malformed dimension/profile inputs.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry directly runs portable builders and validators through ordinary existing prop fixtures. It installs no consumer, builds no native artifact, starts no process, browser or GPU and owns all listed cases without dynamic registration.
 */
export function test_geometry_procedural_closure(): void {
  const solids: ReadonlyArray<readonly [string, IAutoMovieMesh]> = [
    ["prism", prism],
    [
      "revolve",
      revolveAutoMovieProfile({
        profile: [
          { x: 0, y: -1 },
          { x: 1, y: -1 },
          { x: 1, y: 1 },
          { x: 0, y: 1 },
        ],
        segments: 8,
      }),
    ],
    [
      "sweep",
      sweepAutoMovieProfile({
        profile: square.map(
          (point: IAutoMovieProfilePoint): IAutoMovieProfilePoint => ({
            x: point.x * 0.2,
            y: point.y * 0.2,
          }),
        ),
        path: [
          { x: 0, y: 0, z: 0 },
          { x: 2, y: 0, z: 0 },
          { x: 2, y: 2, z: 0 },
        ],
      }),
    ],
    [
      "roof",
      buildAutoMoviePolyhedron([
        [
          { x: -1, y: 0, z: -2 },
          { x: 1, y: 0, z: -2 },
          { x: 1, y: 0, z: 2 },
          { x: -1, y: 0, z: 2 },
        ],
        [
          { x: 1, y: 0, z: -2 },
          { x: 0, y: 3, z: -2 },
          { x: 0, y: 3, z: 2 },
          { x: 1, y: 0, z: 2 },
        ],
        [
          { x: -1, y: 0, z: 2 },
          { x: 0, y: 3, z: 2 },
          { x: 0, y: 3, z: -2 },
          { x: -1, y: 0, z: -2 },
        ],
        [
          { x: -1, y: 0, z: -2 },
          { x: 0, y: 3, z: -2 },
          { x: 1, y: 0, z: -2 },
        ],
        [
          { x: 1, y: 0, z: 2 },
          { x: 0, y: 3, z: 2 },
          { x: -1, y: 0, z: 2 },
        ],
      ]),
    ],
    [
      "uncutWall",
      buildAutoMovieWall({ width: 2, height: 2, depth: 0.2, openings: [] }),
    ],
    ["cutWall", cutWall],
    [
      "mirrored",
      transformAutoMovieMesh(prism, { scale: { x: -1, y: 2, z: 1 } }),
    ],
    [
      "assembly",
      mergeAutoMovieMeshParts([
        { id: "near", mesh: prism },
        {
          id: "far",
          mesh: prism,
          transform: { translation: { x: 5, y: 0, z: 0 } },
        },
      ]).mesh,
    ],
  ];
  TestValidator.equals(
    "every builder that declares a closed solid is one by the engine's verdict",
    Object.fromEntries(
      solids.map(
        ([name, mesh]: readonly [string, IAutoMovieMesh]): [string, number] => [
          name,
          closureViolations(mesh, true),
        ],
      ),
    ),
    Object.fromEntries(
      solids.map(
        ([name]: readonly [string, IAutoMovieMesh]): [string, number] => [
          name,
          0,
        ],
      ),
    ),
  );

  const tube: IAutoMovieMesh = revolveAutoMovieProfile({
    profile: [
      { x: 1, y: -1 },
      { x: 1, y: 1 },
    ],
    segments: 8,
  });
  TestValidator.equals(
    "an open tube satisfies the open declaration and fails the closed one",
    namedFacts([
      ["open", (): boolean => closureViolations(tube, false) === 0],
      // Sixteen rim edges: eight at each end of the ring.
      ["closed", (): boolean => closureViolations(tube, true) === 16],
      [
        "boundary",
        (): boolean =>
          hasViolation(
            validateMeshTopology({ mesh: tube, expectClosed: true }),
            "topology",
            "$input.indices",
          ),
      ],
      [
        // The kernel's own measurement and the engine's verdict are separate
        // implementations of the same weld, so agreeing on the rim is a fact
        // about both rather than one of them repeating itself.
        "measured",
        (): boolean => inspectAutoMovieMeshTopology(tube).boundaryEdges === 16,
      ],
    ]),
    { open: true, closed: true, boundary: true, measured: true },
  );

  const overlapping: IAutoMovieMesh = mergeAutoMovieMeshParts([
    { id: "left", mesh: prism },
    {
      id: "right",
      mesh: prism,
      transform: { translation: { x: 1, y: 0, z: 0 } },
    },
  ]).mesh;
  TestValidator.equals(
    "members that share a face are refused rather than passed off as a union",
    namedFacts([
      ["open", (): boolean => closureViolations(overlapping, false) > 0],
      [
        "nonManifold",
        (): boolean =>
          hasViolation(
            validateMeshTopology({ mesh: overlapping, expectClosed: false }),
            "topology",
            "$input.indices",
          ),
      ],
    ]),
    { open: true, nonManifold: true },
  );

  TestValidator.equals(
    "a model carries the cut wall and refuses the overlapping union",
    namedFacts([
      [
        "wall",
        (): boolean =>
          validateModel({ model: asPart(cutWall) }).success === true,
      ],
      [
        "union",
        (): boolean =>
          hasViolation(
            validateModel({ model: asPart(overlapping) }),
            "topology",
            "parts[0].geometry.mesh",
          ),
      ],
    ]),
    { wall: true, union: true },
  );
}
