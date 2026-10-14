import { buildAutoMovieWall, mergeAutoMovieMeshes } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, throwsError } from "../internal/predicates";

/**
 * Rigid merge rebases indexed and nonindexed members, preserves common attributes, exposes attribute loss and rejects skinning.
 *
 * Scenarios:
 * 1. Authored positive geometry retains its independent topology and dimensional expectations.
 * 2. Every associated invalid row refuses at the same diagnostic beside supported input: skinning, a member index past its own vertices, and a member attribute not aligned to its vertices.
 *
 * @evidence contracts/testing.md#behavioral-verification Merges indexed wall and nonindexed triangle members, asserting the final rebased index, survival of common attributes, loss of incomplete attribute sets and empty output. Skinning, an out-of-range member index and short normals must refuse with their original named diagnostics.
 * @evidence contracts/testing.md#independent-expectations Concatenation adds the first member's vertex count to each second-member index; two three-vertex UV/normal runs contain twelve/eighteen components. Missing normals or UVs require dropping that whole attribute. These counts and admission rules are independent of recorded output but do not verify every concatenated value, surface union or rendering.
 * @evidence contracts/testing.md#distinguishing-cases Preserves mixed indexed/nonindexed operands, missing versus complete attributes, empty merge and the three skin/index/cardinality refusals. Large operand buffers and physical source lineage are owned by companion merge tests.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry calls portable wall and merge source with its existing triangle data and exception observer. It installs no consumer, builds no native artifact and starts no host, browser or GPU; no cases are dynamically registered.
 */
export function test_geometry_procedural_merge(): void {
  const plainWall: IAutoMovieMesh = buildAutoMovieWall({
    width: 2,
    height: 2,
    depth: 0.2,
    openings: [],
  });
  const nonIndexed: IAutoMovieMesh = {
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    normals: null,
    uvs: [0, 0, 1, 0, 0, 1],
    indices: null,
    skin: null,
  };
  const merged: IAutoMovieMesh = mergeAutoMovieMeshes([plainWall, nonIndexed]);
  const mergedUvs: IAutoMovieMesh = mergeAutoMovieMeshes([
    { ...nonIndexed, normals: [0, 0, 1, 0, 0, 1, 0, 0, 1] },
    { ...nonIndexed, normals: [0, 0, 1, 0, 0, 1, 0, 0, 1] },
  ]);
  TestValidator.equals(
    "mesh merge rebases indexed/non-indexed inputs and keeps only common attributes",
    namedFacts([
      [
        "rebased",
        (): boolean =>
          merged.indices!.at(-1) === plainWall.positions.length / 3 + 2,
      ],
      ["dropsNormals", (): boolean => merged.normals === null],
      ["dropsUvs", (): boolean => merged.uvs === null],
      ["keepsUvs", (): boolean => mergedUvs.uvs?.length === 12],
      ["keepsNormals", (): boolean => mergedUvs.normals?.length === 18],
      ["empty", (): boolean => mergeAutoMovieMeshes([]).positions.length === 0],
    ]),
    {
      rebased: true,
      dropsNormals: true,
      dropsUvs: true,
      keepsUvs: true,
      keepsNormals: true,
      empty: true,
    },
  );

  const invalids: Array<readonly [string, () => unknown, string]> = [
    [
      "skinned merge",
      (): IAutoMovieMesh =>
        mergeAutoMovieMeshes([
          { ...nonIndexed, skin: { joints: [], boneIndices: [], weights: [] } },
        ]),
      "procedural rigid-mesh merge does not accept skinning",
    ],
    [
      // Rebasing an index past the member's own vertices would silently point
      // it at the next member's first vertex.
      "member index past its own vertices",
      (): IAutoMovieMesh =>
        mergeAutoMovieMeshes([
          { ...nonIndexed, indices: [0, 1, 3] },
          nonIndexed,
        ]),
      "mesh merge member[0] indexes a vertex the mesh does not carry",
    ],
    [
      "member normals shorter than its vertices",
      (): IAutoMovieMesh =>
        mergeAutoMovieMeshes([
          nonIndexed,
          { ...nonIndexed, normals: [0, 0, 1, 0, 0, 1] },
        ]),
      "mesh merge member[1] needs one normal per vertex",
    ],
  ];
  for (const [name, callback, message] of invalids)
    TestValidator.predicate(
      `${name} is refused by its own diagnostic`,
      throwsError(callback, message),
    );
}
