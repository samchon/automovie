import { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IAutoMovieMeshAssembly, extrudeAutoMovieProfile, inspectAutoMovieMeshTopology, mergeAutoMovieMeshParts, transformAutoMovieMesh } from "@automovie/engine";




import { equalGeometryTestValues } from "../internal/equalGeometryTestValues";
import { namedFacts, nclose, throwsError } from "../internal/predicates";

/** One right triangle on the XY plane, facing +Z, with a known UV corner. */
const facet: () => IAutoMovieMesh = (): IAutoMovieMesh => ({
  positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
  normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
  uvs: [0, 0, 1, 0, 0, 1],
  indices: [0, 1, 2],
  skin: null,
});

const close: (
  values: readonly number[],
  expected: readonly number[],
) => boolean = (
  values: readonly number[],
  expected: readonly number[],
): boolean =>
  values.length === expected.length &&
  values.every((value: number, index: number): boolean =>
    nclose(value, expected[index]!, 1e-12),
  );

/**
 * A rigid placement must carry a surface without lying about which way it
 * faces.
 *
 * Positions take the full translate/rotate/scale; normals take the inverse
 * transpose, because scaling a normal like a position tilts it off a
 * non-uniformly scaled surface; and a mirroring scale flips triangle winding so
 * the geometric face and the stored normal still agree. Every number below is
 * hand-computed from the authored placement, and the mirror case asserts the
 * two independent facts together: the stored normal and the normal implied by
 * the flipped winding are the same vector.
 *
 * Scenarios:
 *
 * 1. Scale (2, ½, 1), a 90° yaw, and a translation place the three corners at
 *    their hand-computed points and turn the +Z normal into +X.
 * 2. A mirroring scale flips winding, and the cross product of the reordered
 *    corners equals the inverse-transpose normal rather than its negation.
 * 3. UVs ride along untouched and a null-normal, non-indexed mesh stays null and
 *    gains the consecutive triangle with its mirrored winding.
 * 4. Assembly members merge in declaration order, each owning an index range that
 *    addresses exactly its own triangles; a member with no transform is merged
 *    in place.
 * 5. A placed unit prism keeps its volume under rotation and multiplies it by the
 *    absolute scale determinant after reflected winding is corrected.
 * 6. Negative twins: skinning, a non-unit quaternion, a collapsed axis, a
 *    non-finite translation or scale, a blank id, and a duplicate id are all
 *    refused by their own diagnostic.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls rigid mesh placement and assembly, checking positions, inverse-transpose normals, winding and member-owned index ranges, including reflection parity after determinant underflow. Caller-buffer mutation is not observed here.
 * @evidence contracts/testing.md#independent-expectations Quarter-turn coordinates, cross products and unit-prism volume times the absolute scale determinant are hand-derived; underflowed scales still have independently countable negative-axis parity. Numeric coordinate checks retain 1e-12 absolute tolerance, while group/range identities remain exact. The topology observer shares engine grid rules and these CPU checks do not certify arbitrary embedding or rendered appearance.
 * @evidence contracts/testing.md#distinguishing-cases Covers ordinary/mirrored/tiny scales, null attributes, nonindexed inputs, assembly order/empty input and malformed placements or member identities; correspondence tests own physical aliases.
 * @evidence contracts/testing.md#execution-ownership This exported geometry entry runs CPU source and mesh observations directly; it neither starts a renderer nor treats numerical checks as visual acceptance.
 */
export function test_geometry_procedural_placement(): void {
  const yawed: IAutoMovieMesh = transformAutoMovieMesh(facet(), {
    translation: { x: 1, y: 2, z: 3 },
    rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
    scale: { x: 2, y: 0.5, z: 1 },
  });
  TestValidator.equals(
    "a placement carries positions fully and normals by the inverse transpose",
    namedFacts([
      [
        "positions",
        (): boolean => close(yawed.positions, [1, 2, 3, 1, 2, 1, 1, 2.5, 3]),
      ],
      [
        "normals",
        (): boolean => close(yawed.normals!, [1, 0, 0, 1, 0, 0, 1, 0, 0]),
      ],
      ["uvs", (): boolean => close(yawed.uvs!, [0, 0, 1, 0, 0, 1])],
      ["winding", (): boolean => JSON.stringify(yawed.indices) === "[0,1,2]"],
    ]),
    { positions: true, normals: true, uvs: true, winding: true },
  );

  const mirrored: IAutoMovieMesh = transformAutoMovieMesh(facet(), {
    scale: { x: -1, y: 1, z: 1 },
  });
  const geometric: (mesh: IAutoMovieMesh) => readonly number[] = (
    mesh: IAutoMovieMesh,
  ): readonly number[] => {
    const [a, b, c]: number[] = mesh
      .indices!.slice(0, 3)
      .map((index: number): number => index * 3);
    const p: number[] = mesh.positions;
    const ab: number[] = [
      p[b!]! - p[a!]!,
      p[b! + 1]! - p[a! + 1]!,
      p[b! + 2]! - p[a! + 2]!,
    ];
    const ac: number[] = [
      p[c!]! - p[a!]!,
      p[c! + 1]! - p[a! + 1]!,
      p[c! + 2]! - p[a! + 2]!,
    ];
    return [
      ab[1]! * ac[2]! - ab[2]! * ac[1]!,
      ab[2]! * ac[0]! - ab[0]! * ac[2]!,
      ab[0]! * ac[1]! - ab[1]! * ac[0]!,
    ];
  };
  TestValidator.equals(
    "a mirroring scale flips winding so the drawn face still matches its normal",
    namedFacts([
      [
        "positions",
        (): boolean => close(mirrored.positions, [0, 0, 0, -1, 0, 0, 0, 1, 0]),
      ],
      [
        "flipped",
        (): boolean => JSON.stringify(mirrored.indices) === "[0,2,1]",
      ],
      [
        "normals",
        (): boolean => close(mirrored.normals!, [0, 0, 1, 0, 0, 1, 0, 0, 1]),
      ],
      ["agrees", (): boolean => geometric(mirrored)[2]! > 0],
      ["unmirroredAgrees", (): boolean => geometric(yawed)[0]! > 0],
    ]),
    {
      positions: true,
      flipped: true,
      normals: true,
      agrees: true,
      unmirroredAgrees: true,
    },
  );

  const bare: IAutoMovieMesh = transformAutoMovieMesh(
    {
      positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
      normals: null,
      uvs: null,
      indices: null,
      skin: null,
    },
    { scale: { x: 1, y: 1, z: -1 } },
  );
  for (const scale of [
    { x: -1e-200, y: 1e-200, z: 1e-200 },
    { x: -1e-200, y: -1e-200, z: 1e-200 },
  ])
    TestValidator.equals(
      "scale parity survives an underflowed determinant",
      transformAutoMovieMesh(facet(), { scale }).indices,
      scale.y < 0 ? [0, 1, 2] : [0, 2, 1],
    );
  TestValidator.equals(
    "a null-attribute non-indexed mesh keeps its nulls and gains an index run",
    {
      normals: bare.normals,
      uvs: bare.uvs,
      indices: JSON.stringify(bare.indices),
    },
    { normals: null, uvs: null, indices: "[0,2,1]" },
  );

  const prism: IAutoMovieMesh = extrudeAutoMovieProfile({
    profile: [
      { x: -0.5, y: -0.5 },
      { x: 0.5, y: -0.5 },
      { x: 0.5, y: 0.5 },
      { x: -0.5, y: 0.5 },
    ],
    depth: 1,
  });
  TestValidator.equals(
    "a placed prism keeps its volume under rotation and scales it by the determinant",
    namedFacts([
      [
        "unit",
        (): boolean =>
          nclose(inspectAutoMovieMeshTopology(prism).volume, 1, 1e-12),
      ],
      [
        "rotated",
        (): boolean =>
          nclose(
            inspectAutoMovieMeshTopology(
              transformAutoMovieMesh(prism, {
                rotation: { x: 0.5, y: 0.5, z: 0.5, w: 0.5 },
                translation: { x: 7, y: -3, z: 2 },
              }),
            ).volume,
            1,
            1e-12,
          ),
      ],
      [
        "scaled",
        (): boolean =>
          nclose(
            inspectAutoMovieMeshTopology(
              transformAutoMovieMesh(prism, { scale: { x: 2, y: 3, z: 4 } }),
            ).volume,
            24,
            1e-12,
          ),
      ],
      [
        "mirroredVolume",
        (): boolean =>
          nclose(
            inspectAutoMovieMeshTopology(
              transformAutoMovieMesh(prism, { scale: { x: -2, y: 3, z: 4 } }),
            ).volume,
            24,
            1e-12,
          ),
      ],
    ]),
    { unit: true, rotated: true, scaled: true, mirroredVolume: true },
  );

  const assembly: IAutoMovieMeshAssembly = mergeAutoMovieMeshParts([
    { id: "here", mesh: facet() },
    {
      id: "there",
      mesh: facet(),
      transform: { translation: { x: 10, y: 0, z: 0 } },
    },
    {
      id: "loose",
      mesh: {
        positions: [0, 0, 0, 0, 0, 1, 0, 1, 0],
        normals: null,
        uvs: null,
        indices: null,
        skin: null,
      },
    },
  ]);
  TestValidator.predicate(
    "assembly members merge in order and each owns exactly its own index range",
    equalGeometryTestValues(
      {
        groups: assembly.groups,
        indices: assembly.mesh.indices!.length,
        normals: assembly.mesh.normals,
        uvs: assembly.mesh.uvs,
        placed: assembly.mesh.positions[12]!,
      },
      {
        groups: [
          { id: "here", start: 0, count: 3 },
          { id: "there", start: 3, count: 3 },
          { id: "loose", start: 6, count: 3 },
        ],
        indices: 9,
        normals: null,
        uvs: null,
        placed: 11,
      },
    ),
  );
  TestValidator.equals(
    "an empty assembly is an empty mesh with no groups",
    {
      groups: mergeAutoMovieMeshParts([]).groups,
      positions: mergeAutoMovieMeshParts([]).mesh.positions.length,
    },
    { groups: [], positions: 0 },
  );

  const skinned: IAutoMovieMesh = {
    ...facet(),
    skin: { joints: [], boneIndices: [], weights: [] },
  };
  const refusals: Array<readonly [string, () => unknown, string]> = [
    [
      "skinned placement",
      (): IAutoMovieMesh => transformAutoMovieMesh(skinned, {}),
      "procedural mesh transform does not accept skinning",
    ],
    [
      "non-unit rotation",
      (): IAutoMovieMesh =>
        transformAutoMovieMesh(facet(), {
          rotation: { x: 0, y: 0, z: 0, w: 0.5 },
        }),
      "mesh transform rotation must be a unit quaternion",
    ],
    [
      "non-finite rotation",
      (): IAutoMovieMesh =>
        transformAutoMovieMesh(facet(), {
          rotation: { x: Number.NaN, y: 0, z: 0, w: 1 },
        }),
      "mesh transform rotation must be a unit quaternion",
    ],
    [
      "collapsed axis",
      (): IAutoMovieMesh =>
        transformAutoMovieMesh(facet(), { scale: { x: 1, y: 0, z: 1 } }),
      "mesh transform scale may not collapse an axis",
    ],
    [
      "non-finite translation",
      (): IAutoMovieMesh =>
        transformAutoMovieMesh(facet(), {
          translation: { x: Number.POSITIVE_INFINITY, y: 0, z: 0 },
        }),
      "mesh transform translation must be finite",
    ],
    [
      "non-finite scale",
      (): IAutoMovieMesh =>
        transformAutoMovieMesh(facet(), {
          scale: { x: 1, y: Number.NaN, z: 1 },
        }),
      "mesh transform scale must be finite",
    ],
    [
      "blank part id",
      (): IAutoMovieMeshAssembly =>
        mergeAutoMovieMeshParts([{ id: "  ", mesh: facet() }]),
      "mesh part id must be non-empty",
    ],
    [
      "duplicate part id",
      (): IAutoMovieMeshAssembly =>
        mergeAutoMovieMeshParts([
          { id: "twin", mesh: facet() },
          { id: "twin", mesh: facet() },
        ]),
      'mesh part id "twin" must be unique',
    ],
  ];
  for (const [name, callback, message] of refusals)
    TestValidator.predicate(
      `${name} is refused by its own diagnostic`,
      throwsError(callback, message),
    );
}
