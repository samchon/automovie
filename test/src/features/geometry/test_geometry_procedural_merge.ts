import {buildAutoMovieWall,mergeAutoMovieMeshes} from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import {TestValidator} from "@nestia/e2e";
import {namedFacts,throwsError} from "../internal/predicates";

/**
 * Rigid merge rebases indexed and nonindexed members, preserves common attributes, exposes attribute loss and rejects skinning.
 *
 * Scenarios:
 * 1. Authored positive geometry retains its independent topology and dimensional expectations.
 * 2. Every associated invalid row refuses at the same diagnostic beside supported input: skinning, a member index past its own vertices, and a member attribute not aligned to its vertices.
 */
export const test_geometry_procedural_merge=():void=>{
  const plainWall=buildAutoMovieWall({width:2,height:2,depth:.2,openings:[]});
  const nonIndexed: IAutoMovieMesh = {
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    normals: null,
    uvs: [0, 0, 1, 0, 0, 1],
    indices: null,
    skin: null,
  };
  const merged = mergeAutoMovieMeshes([plainWall, nonIndexed]);
  const mergedUvs = mergeAutoMovieMeshes([
    { ...nonIndexed, normals: [0, 0, 1, 0, 0, 1, 0, 0, 1] },
    { ...nonIndexed, normals: [0, 0, 1, 0, 0, 1, 0, 0, 1] },
  ]);
  TestValidator.equals(
    "mesh merge rebases indexed/non-indexed inputs and keeps only common attributes",
    namedFacts([
      [
        "rebased",
        () => merged.indices!.at(-1) === plainWall.positions.length / 3 + 2,
      ],
      ["dropsNormals", () => merged.normals === null],
      ["dropsUvs", () => merged.uvs === null],
      ["keepsUvs", () => mergedUvs.uvs?.length === 12],
      ["keepsNormals", () => mergedUvs.normals?.length === 18],
      ["empty", () => mergeAutoMovieMeshes([]).positions.length === 0],
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
      () =>
        mergeAutoMovieMeshes([
          { ...nonIndexed, skin: { joints: [], boneIndices: [], weights: [] } },
        ]),
      "procedural rigid-mesh merge does not accept skinning",
    ],
    [
      // Rebasing an index past the member's own vertices would silently point
      // it at the next member's first vertex.
      "member index past its own vertices",
      () =>
        mergeAutoMovieMeshes([
          { ...nonIndexed, indices: [0, 1, 3] },
          nonIndexed,
        ]),
      "mesh merge member[0] indexes a vertex the mesh does not carry",
    ],
    [
      "member normals shorter than its vertices",
      () =>
        mergeAutoMovieMeshes([
          nonIndexed,
          { ...nonIndexed, normals: [0, 0, 1, 0, 0, 1] },
        ]),
      "mesh merge member[1] needs one normal per vertex",
    ],
  ];
  for (const [name, callback, message] of invalids) TestValidator.predicate(`${name} is refused by its own diagnostic`,throwsError(callback,message));

};
