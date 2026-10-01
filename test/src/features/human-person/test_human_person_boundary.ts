import {
  type IAutoMovieHumanPersonSeam,
  float32MeshBuffers,
  stitchHumanPersonBoundary,
} from "@automovie/human";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/**
 * Two different partitions of a square neck share the union after subdivision.
 *
 * The face owns the four square corners at height zero. The body's reverse
 * loop owns its four edge midpoints, so the body edge from parameter 0.5 to
 * 3.5 must pass through the face corner at parameter zero. Each tested skin
 * triangle gains one boundary point: the face splits into two triangles,
 * while the body retains its old interior centroid with a four-triangle fan.
 * The square's 1/32 metre coordinates are exact binary values.
 *
 * Scenarios:
 * 1. A ribbon triangle with distinct collinear corners fails the unchanged
 *    Float32 admission gate; both subdivided skins pass it and share the
 *    exact boundary segment across their different partitions.
 * 2. Added UV, colour and relief interpolate the material region's own edge;
 *    the caller's mesh stays unchanged, and every array remains aligned.
 * 3. Non-indexed input uses its sequential corners; absent attributes remain
 *    absent. A triangle away from the boundary keeps its index identity.
 * 4. An unposed skin and a boundary with opposing cancelling normals refuse
 *    rather than fabricating a skinning table or a normal direction.
 * 5. A folded body reports only source-adjacent triangles and their original
 *    present or absent attributes; an unrelated triangle stays outside the
 *    diagnostic neighborhood.
 * 6. Upstream posed-source provenance leaves valid geometry unchanged. A
 *    refusal keeps actual source positions, loop follow/target and interior
 *    band interpolation, while omission produces no invented native lineage.
 */
export const test_human_person_boundary = (): void => {
  const r = 1 / 32;
  const face = [r, 0, r, -r, 0, r, -r, 0, -r, r, 0, -r];
  const normals = [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0];
  const seam: IAutoMovieHumanPersonSeam = {
    axis: { x: 0, z: 0 },
    faceBasis: "analytic-face",
    bodyBasis: "analytic-body",
    faceSurface: "face",
    bodySurface: "body",
    faceLoop: [0, 1, 2, 3],
    bodyLoop: [0, 1, 2, 3],
    covered: [],
    ribbon: [],
    collar: {
      reachMetres: 0.1,
      headReachMetres: 0.1,
      follow: [
        { edge: 0, fraction: 0.5 },
        { edge: 3, fraction: 0.5 },
        { edge: 2, fraction: 0.5 },
        { edge: 1, fraction: 0.5 },
      ],
      band: [],
    },
  };
  const base = (positions: number[]): IAutoMovieMesh => ({
    positions,
    normals: [0, 1, 0, 0, 1, 0, 0, 1, 0],
    uvs: [0, 0, 1, 0, 0, 1],
    colors: [0, 0, 0, 1, 1, 1, 0, 0, 0],
    reliefWeights: [0, 1, 0],
    indices: [0, 1, 2],
    skin: null,
  });
  const faceMesh = base([...face.slice(0, 6), r, r, r]);
  const bodyMesh = base([0, 0, r, r, 0, 0, 0, -r, 0]);
  const before = structuredClone(faceMesh);
  const stitch = (mesh: IAutoMovieMesh, side: "face" | "body", sources = [0, 1, 4]) =>
    stitchHumanPersonBoundary({ mesh, side, sources, seam, face, faceNormals: normals });
  const a = stitch(faceMesh, "face");
  const b = stitch(bodyMesh, "body");
  TestValidator.equals("caller geometry stays owned", faceMesh, before);
  TestValidator.equals("face uses the minimum split while body retains its original interior", [a.indices!.length, b.indices!.length], [6, 12]);
  const segment = (mesh: IAutoMovieMesh, from: number[], to: number[]): boolean =>
    mesh.indices!.some((_, at, indices) => {
      const first = indices[at];
      const next = indices[Math.floor(at / 3) * 3 + (at % 3 + 1) % 3];
      return from.every((value, axis) => nclose(mesh.positions[first * 3 + axis], value, 1e-12)) &&
        to.every((value, axis) => nclose(mesh.positions[next * 3 + axis], value, 1e-12));
    });
  TestValidator.predicate("the two partitions share the same segment with opposite winding", segment(a, [r, 0, r], [0, 0, r]) && segment(b, [0, 0, r], [r, 0, r]));
  for (const [mesh, vertices, corners] of [[a, 4, 6], [b, 5, 12]] as const) {
    const packed = float32MeshBuffers(mesh);
    TestValidator.equals("Float32 preserves each subdivided face", packed.indices.length, corners);
    TestValidator.equals("all parallel attributes remain aligned", [mesh.normals!.length, mesh.uvs!.length, mesh.colors!.length, mesh.reliefWeights!.length], [vertices * 3, vertices * 2, vertices * 3, vertices]);
    TestValidator.predicate("mid-edge attributes interpolate independently of shared geometry", nclose(mesh.uvs![6], 0.5, 1e-12) && nclose(mesh.colors![9], 0.5, 1e-12) && nclose(mesh.reliefWeights![3], 0.5, 1e-12));
  }
  TestValidator.predicate("a distinct-collinear ribbon is refused by precision admission", throwsError(() => float32MeshBuffers(base([r, 0, r, -r, 0, r, 0, 0, r])), "nonredundant triangle"));
  const bare = stitch({ ...faceMesh, indices: null, normals: null, uvs: null, colors: undefined, reliefWeights: undefined }, "face");
  TestValidator.equals("missing attributes stay missing", [bare.normals, bare.uvs, bare.colors, bare.reliefWeights], [null, null, undefined, undefined]);
  const bodyBare = stitch({ ...bodyMesh, normals: null, uvs: null, colors: undefined, reliefWeights: undefined }, "body");
  TestValidator.equals("body subdivision also preserves missing attributes", [bodyBare.normals, bodyBare.uvs, bodyBare.colors, bodyBare.reliefWeights], [null, null, undefined, undefined]);
  TestValidator.predicate("the body's old interior centroid is preserved", [r / 3, -r / 3, r / 3].every((value, axis) => nclose(b.positions[12 + axis], value, 1e-12)) && nclose(b.uvs![8], 1 / 3, 1e-12) && nclose(b.uvs![9], 1 / 3, 1e-12));
  const away = stitch(faceMesh, "face", [10, 11, 12]);
  TestValidator.equals("unaffected triangles keep their indices", away.indices, [0, 1, 2]);
  const reversed = stitch({ ...faceMesh, indices: [1, 0, 2] }, "face");
  TestValidator.equals("a reversed region edge keeps its winding through subdivision", float32MeshBuffers(reversed).indices.length, 6);
  const twoEdges = stitch(base(face.slice(0, 9)), "face", [0, 1, 2]);
  TestValidator.equals("two subdivided face edges still use the minimum polygon triangulation", float32MeshBuffers(twoEdges).indices.length, 9);
  TestValidator.equals("face subdivision needs no added interior point", twoEdges.positions.length / 3, 5);
  const nearlyAtCorner = stitchHumanPersonBoundary({
    mesh: bodyMesh,
    side: "body",
    sources: [0, 1, 4],
    seam: { ...seam, collar: { ...seam.collar, follow: [{ edge: 0, fraction: 2 ** -50 }, ...seam.collar.follow.slice(1)] } },
    face,
    faceNormals: normals,
  });
  TestValidator.equals("Float32-identical samples share one boundary identity", float32MeshBuffers(nearlyAtCorner).indices.length, 3);
  const distinguishable = stitchHumanPersonBoundary({
    mesh: bodyMesh,
    side: "body",
    sources: [0, 1, 4],
    seam: { ...seam, collar: { ...seam.collar, follow: [{ edge: 0, fraction: 2 ** -20 }, ...seam.collar.follow.slice(1)] } },
    face,
    faceNormals: normals,
  });
  TestValidator.equals("a Float32-distinct adjacent sample keeps its own identity", float32MeshBuffers(distinguishable).indices.length, 12);
  const collapsed = stitchHumanPersonBoundary({
    mesh: bodyMesh,
    side: "body",
    sources: [0, 1, 4],
    seam: { ...seam, collar: { ...seam.collar, follow: [{ edge: 0, fraction: 0.5 }, { edge: 0, fraction: 0.5 }, ...seam.collar.follow.slice(2)] } },
    face,
    faceNormals: normals,
  });
  TestValidator.equals("coincident boundary samples carry no skin triangle", collapsed.indices, []);
  TestValidator.predicate("a corner that folds the skin triangle refuses", throwsError(() => stitch(base([0, 0, r, r, 0, 0, 2 * r, 0, r]), "body"), "person boundary subdivision"));
  TestValidator.predicate("a fold reports the actual boundary side and triangle positions", throwsError(() => stitch(base([0, 0, r, r, 0, 0, 2 * r, 0, r]), "body"), "Side=body; original=[[0,0,0.03125],[0.03125,0,0],[0.0625,0,0.03125]]; emitted="));
  const neighbourhood = {
    ...base([0, 0, r, r, 0, 0, 2 * r, 0, r, -r, -r, 0, 10, 0, 0, 10, r, 0, 10, 0, r]),
    indices: [0, 1, 2, 0, 2, 3, 4, 5, 6],
    normals: Array.from({ length: 7 }, () => [0, 1, 0]).flat(),
    uvs: Array.from({ length: 7 }, () => [0, 0]).flat(),
    colors: Array.from({ length: 7 }, () => [1, 0, 0]).flat(),
    reliefWeights: new Array<number>(7).fill(0),
  };
  const nearbySources = [0, 1, 4, 5, 20, 21, 22];
  TestValidator.predicate("a refusal reports actual source-adjacent triangles and attributes", throwsError(() => stitch(neighbourhood, "body", nearbySources), '"corners":[0,2,3],"sources":[0,4,5]'));
  const expectedNeighbours = [{
    triangle: 1, corners: [0, 2, 3], sources: [0, 4, 5],
    positions: [[0, 0, r], [2 * r, 0, r], [-r, -r, 0]],
    normals: [[0, 1, 0], [0, 1, 0], [0, 1, 0]],
    uvs: [[0, 0], [0, 0], [0, 0]],
    colors: [[1, 0, 0], [1, 0, 0], [1, 0, 0]],
    reliefWeights: [[0], [0], [0]],
  }];
  TestValidator.predicate("a refusal collects exactly the adjacent triangle and excludes an unrelated triangle", throwsError(() => stitch(neighbourhood, "body", nearbySources), `; neighbours=${JSON.stringify(expectedNeighbours)}; lineage=null.`));
  TestValidator.predicate("missing neighbor attributes stay absent", throwsError(() => stitch({ ...neighbourhood, normals: null, uvs: null, colors: undefined, reliefWeights: undefined }, "body", nearbySources), '"normals":null,"uvs":null,"colors":null,"reliefWeights":null'));
  const bodyBeforeCollar = [0, 0, r, r, 0, 0, 0, 0, 0, 0, 0, 0, 2 * r, 0, r];
  const traced = (mesh: IAutoMovieMesh): IAutoMovieMesh => stitchHumanPersonBoundary({
    mesh, sources: [0, 1, 4], side: "body", face, faceNormals: normals,
    bodyBeforeCollar,
    seam: { ...seam, collar: { ...seam.collar, band: [
      { vertex: 4, low: 0, high: 1, along: 0.25, weight: 0.5 },
    ] } },
  });
  TestValidator.equals("upstream provenance does not change valid emitted geometry", traced(bodyMesh), b);
  TestValidator.predicate("a refusal retains native doubles, loop follow and band provenance", throwsError(
    () => traced(base([0, 0, r, r, 0, 0, 2 * r, 0, r])),
    [
      '"nativePosed":[0,0,0.03125]',
      '"loop":{"index":0,"follow":{"edge":0,"fraction":0.5},"target":[0,0,0.03125]}',
      '"source":4,"nativePosed":[0.0625,0,0.03125]',
      '"loop":null,"band":{"vertex":4,"low":0,"high":1,"along":0.25,"weight":0.5',
      '"lowSource":0,"highSource":1',
      '"lowTarget":[0,0,0.03125],"highTarget":[0.03125,0,0]',
    ],
  ));
  TestValidator.predicate("a wrapped final-edge endpoint keeps its finite first-corner target in a refusal", throwsError(() => stitchHumanPersonBoundary({
    mesh: base([r, 0, r, r, 0, 0, r, 0, 2 * r]),
    sources: [0, 1, 4], side: "body", face, faceNormals: normals, bodyBeforeCollar,
    seam: { ...seam, collar: { ...seam.collar, follow: [
      { edge: 3, fraction: 1 }, seam.collar.follow[1],
      { edge: 3, fraction: 0.75 }, seam.collar.follow[3],
    ] } },
  }), '"loop":{"index":0,"follow":{"edge":3,"fraction":1},"target":[0.03125,0,0.03125]}'));
  TestValidator.predicate("an unposed mesh refuses", throwsError(() => stitch({ ...faceMesh, skin: { joints: ["head"], boneIndices: new Array(12).fill(0), weights: new Array(12).fill(0.25) } }, "face"), "already posed"));
  TestValidator.predicate("opposing boundary normals refuse", throwsError(() => stitchHumanPersonBoundary({ mesh: bodyMesh, side: "body", sources: [0, 1, 4], seam, face, faceNormals: [0, 1, 0, 0, -1, 0, 0, 1, 0, 0, 1, 0] }), "nonzero interpolated normal"));
  TestValidator.predicate("a malformed input cancelling the centroid normal refuses", throwsError(() => stitch({ ...bodyMesh, normals: [0, 1, 0, 0, 1, 0, 0, -2, 0] }, "body"), "centroid needs a nonzero normal"));
};
