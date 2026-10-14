import { buildAutoMoviePolyhedron } from "@automovie/engine";
import { IAutoMovieVector3, type IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose } from "../internal/predicates";

/** The uv pair the vertex at `at` carries. */
const uvAt: (uvs: readonly number[], at: number) => { u: number; v: number; } = (
  uvs: readonly number[],
  at: number,
): { u: number; v: number } => ({ u: uvs[at * 2]!, v: uvs[at * 2 + 1]! });

/** The uv a named corner of one built mesh received, found by position. */
const uvOf: (mesh: { positions: number[]; uvs: number[] | null; }, point: IAutoMovieVector3) => { u: number; v: number; } = (
  mesh: { positions: number[]; uvs: number[] | null },
  point: IAutoMovieVector3,
): { u: number; v: number } => {
  for (let at: number = 0; at * 3 < mesh.positions.length; ++at)
    if (
      nclose(mesh.positions[at * 3], point.x, 0) &&
      nclose(mesh.positions[at * 3 + 1], point.y, 0) &&
      nclose(mesh.positions[at * 3 + 2], point.z, 0)
    )
      return uvAt(mesh.uvs!, at);
  throw new Error("the mesh carries no vertex at that point");
};

const corner: (x: number, y: number, z: number) => IAutoMovieVector3 = (x: number, y: number, z: number): IAutoMovieVector3 => ({
  x,
  y,
  z,
});

/**
 * Where a polyhedron's grain continues from one face to the next, and where it
 * is declared to stop.
 *
 * The continuity requirement asks two things of adjacent faces: that the
 * relationship be stated, and that it not change by accident. Both are read
 * here from the coordinates themselves rather than from a render, because two
 * surfaces sampling the same image at different phases look alike until the
 * numbers are compared.
 *
 * The accident the frame rule removes is the authored corner order. A frame
 * taken from a face's first edge moves when the same polygon is typed starting
 * at a different corner, so two coplanar faces of one solid carried unrelated
 * coordinates and broke the grain along a seam that is not a seam.
 *
 * Scenarios:
 *
 * 1. One face and the same face with its corner list rotated by one produce the
 *    same coordinates at the same points: the frame is a function of the normal
 *    and the position, and of nothing the author typed first.
 * 2. Two coplanar faces meeting along a shared edge agree on both coordinates at
 *    every shared point, so a wall split into two faces is one continuous
 *    surface rather than two independently mapped ones.
 * 3. A wall return, the case the requirement names: the two faces meet at a
 *    vertical edge, and V agrees at every height along it, so a course laid at
 *    1.2 m is at 1.2 m on both sides of the corner.
 * 4. U across that same return does not continue, and that is the declared
 *    behaviour rather than a defect: continuing both axes across a fold is a
 *    developed layout the kernel does not cut. The break is pinned so a later
 *    change cannot make it silently disagree.
 * 5. A level face against an upright one uses a different orientation rule:
 *    their coordinates can agree on the shared edge while V advances into the
 *    floor on one side and up the wall on the other.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds the original rotated-corner, split coplanar, upright-return and wall/floor faces, checking per-corner UV agreement, coplanar shared-edge phases, upright V-height agreement and the declared U/level-frame breaks. It catches a first-edge-dependent frame or lost coursing while allowing the intentional fold seams.
 * @evidence contracts/testing.md#independent-expectations Authored +Z/+X upright faces give V=Y with U=X/-Z, while a +Y floor gives V=-Z. The original dimensions determine phases zero/four/three/minus-two independently of stored mesh output. Comparisons are at emitted corners and rely on the affine face convention for intermediate edge continuity; they do not observe texture sampling, filtering or rendered grain.
 * @evidence contracts/testing.md#distinguishing-cases Preserves first-corner rotation, two coplanar halves, perpendicular upright faces with V continuity but U reset, and level/upright meeting with distinct V directions. Near-level threshold and metric frame lengths belong to surface-uv-frame; malformed face admission belongs to procedural-topology.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry directly executes portable polyhedron frame source and ordinary coordinate observers on existing authored faces. It installs no consumer, builds no native artifact and starts no process, browser or GPU; all cases remain locally owned without dynamic registration.
 */
export function test_geometry_surface_uv_continuity(): void {
  const face: IAutoMovieVector3[] = [
    corner(0, 0, 0),
    corner(4, 0, 0),
    corner(4, 3, 0),
    corner(0, 3, 0),
  ];
  const rotated: IAutoMovieMesh = buildAutoMoviePolyhedron([[...face.slice(1), face[0]!]]);
  const straight: IAutoMovieMesh = buildAutoMoviePolyhedron([face]);
  TestValidator.equals(
    "rotating a face's corner list leaves every coordinate where it was",
    namedFacts(
      face.map(
        (point: IAutoMovieVector3, index: number): readonly [string, () => boolean] =>
          [
            `corner${index}`,
            (): boolean => {
              const was: { u: number; v: number; } = uvOf(straight, point);
              const is: { u: number; v: number; } = uvOf(rotated, point);
              return nclose(was.u, is.u) && nclose(was.v, is.v);
            },
          ] as const,
      ),
    ),
    { corner0: true, corner1: true, corner2: true, corner3: true },
  );

  // One 4 m wall authored as two 2 m faces sharing the edge at x = 2.
  const split: IAutoMovieMesh = buildAutoMoviePolyhedron([
    [corner(0, 0, 0), corner(2, 0, 0), corner(2, 3, 0), corner(0, 3, 0)],
    [corner(2, 0, 0), corner(4, 0, 0), corner(4, 3, 0), corner(2, 3, 0)],
  ]);
  TestValidator.equals(
    "two coplanar faces are one continuous surface across their shared edge",
    namedFacts([
      [
        "sharedFoot",
        (): boolean => {
          const left: { u: number; v: number; } = uvAt(split.uvs!, 1);
          const right: { u: number; v: number; } = uvAt(split.uvs!, 4);
          return nclose(left.u, right.u) && nclose(left.v, right.v);
        },
      ],
      [
        "sharedHead",
        (): boolean => {
          const left: { u: number; v: number; } = uvAt(split.uvs!, 2);
          const right: { u: number; v: number; } = uvAt(split.uvs!, 7);
          return nclose(left.u, right.u) && nclose(left.v, right.v);
        },
      ],
      ["continuousU", (): boolean => nclose(uvAt(split.uvs!, 5).u, 4)],
    ]),
    { sharedFoot: true, sharedHead: true, continuousU: true },
  );

  // A wall return: a face on z = 0 facing +Z and a face on x = 4 facing +X,
  // meeting along the vertical edge at (4, *, 0).
  const returnCorner: IAutoMovieMesh = buildAutoMoviePolyhedron([
    [corner(0, 0, 0), corner(4, 0, 0), corner(4, 3, 0), corner(0, 3, 0)],
    [corner(4, 0, 0), corner(4, 0, -3), corner(4, 3, -3), corner(4, 3, 0)],
  ]);
  TestValidator.equals(
    "a wall return keeps its coursing level around the corner",
    namedFacts([
      [
        "footHeight",
        (): boolean => {
          const front: { u: number; v: number; } = uvOf(returnCorner, corner(4, 0, 0));
          return nclose(front.v, 0);
        },
      ],
      [
        "headHeight",
        (): boolean => {
          const front: { u: number; v: number; } = uvAt(returnCorner.uvs!, 2);
          const side: { u: number; v: number; } = uvAt(returnCorner.uvs!, 7);
          return nclose(front.v, 3) && nclose(side.v, 3);
        },
      ],
      [
        "levelEverywhere",
        (): boolean => {
          const uvs: number[] = returnCorner.uvs!;
          return returnCorner.positions.every((_component: number, index: number): boolean => {
            if (index % 3 !== 1) return true;
            const at: number = (index - 1) / 3;
            return nclose(uvAt(uvs, at).v, returnCorner.positions[index]!);
          });
        },
      ],
    ]),
    { footHeight: true, headHeight: true, levelEverywhere: true },
  );

  TestValidator.equals(
    "U resets across the fold, which is the stated break rather than a defect",
    namedFacts([
      // The front face reads u = x, so the shared edge is 4 m along it.
      ["frontEdge", (): boolean => nclose(uvAt(returnCorner.uvs!, 1).u, 4)],
      // The side face reads u = -z, so the same edge is 0 m along that one.
      ["sideEdge", (): boolean => nclose(uvAt(returnCorner.uvs!, 4).u, 0)],
      [
        "breaks",
        (): boolean =>
          nclose(uvAt(returnCorner.uvs!, 1).u, uvAt(returnCorner.uvs!, 4).u) ===
          false,
      ],
    ]),
    { frontEdge: true, sideEdge: true, breaks: true },
  );

  // A floor meeting the foot of a wall along the edge at y = 0, z = 0.
  const skirting: IAutoMovieMesh = buildAutoMoviePolyhedron([
    [corner(0, 0, 0), corner(4, 0, 0), corner(4, 3, 0), corner(0, 3, 0)],
    [corner(0, 0, 0), corner(0, 0, 2), corner(4, 0, 2), corner(4, 0, 0)],
  ]);
  TestValidator.equals(
    "a level face and an upright one map through different rules and say so",
    namedFacts([
      ["wallFoot", (): boolean => nclose(uvAt(skirting.uvs!, 1).v, 0)],
      ["floorSameV", (): boolean => nclose(uvAt(skirting.uvs!, 7).v, 0)],
      ["floorAdvancesV", (): boolean => nclose(uvAt(skirting.uvs!, 5).v, -2)],
      ["wallDoesNotAdvanceV", (): boolean => nclose(uvAt(skirting.uvs!, 2).v, 3)],
    ]),
    {
      wallFoot: true,
      floorSameV: true,
      floorAdvancesV: true,
      wallDoesNotAdvanceV: true,
    },
  );
}
