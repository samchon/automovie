import {
  createHumanBodyBasisBuilder,
  exportHumanBody,
  segmentHumanBodyModel,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { throwsError } from "../internal/predicates";

/**
 * The dominant-bone partition of a built body and its static export.
 *
 * Scenarios:
 * 1. The analytic box splits into one part per bone in joint order: the
 *    bottom face and the side triangles with two bottom corners belong to
 *    `hips`, the top face and the side triangles with two top corners to
 *    `spine`; every triangle lands in exactly one part, and `sources` maps
 *    each part vertex back to its basis vertex.
 * 2. A three-way corner tie goes to the first corner's bone, and a triangle
 *    with two corners on one bone goes to that bone.
 * 3. A UV seam that duplicates a vertex keeps the partition aligned with the
 *    built vertex population (the split vertex is named once more in
 *    `sources`), and a built model whose vertex count does not match the
 *    region walk, or whose part is not a mesh, refuses.
 * 4. The export returns GLB bytes with the glTF magic and a glTF JSON whose
 *    single mesh carries the box's triangles.
 */
export const test_human_body_segments_and_export = async (): Promise<void> => {
  const { basis, document } = humanBodyBasisFixture();
  const build = createHumanBodyBasisBuilder(basis);
  const built = build(document);
  const { model, sources } = segmentHumanBodyModel(basis, built);
  TestValidator.equals(
    "one part per bone in joint order",
    model.parts.map((part) => part.id),
    ["hips", "spine"],
  );
  const triangles = (id: string): number => {
    const part = model.parts.find((one) => one.id === id)!;
    return part.geometry.type === "mesh"
      ? part.geometry.mesh.indices!.length / 3
      : -1;
  };
  TestValidator.equals(
    "every triangle in exactly one part",
    triangles("hips") + triangles("spine"),
    basis.surfaces[0].indices.length / 3,
  );
  TestValidator.equals(
    "the side faces split two corners up, two down",
    [triangles("hips"), triangles("spine")],
    [6, 6],
  );
  TestValidator.predicate(
    "sources map every part vertex back to its basis vertex",
    [4, 5, 6, 7].every((v) => sources.get("spine")!.includes(v)) &&
      [0, 1, 2, 3].every((v) => sources.get("hips")!.includes(v)) &&
      sources.get("spine")!.length === 8,
  );

  // 2. top corners 4, 5, 6, 7 on hips, chest, chest, spine: the top triangle
  // (4,6,5) and the side triangle (1,5,6) have two chest corners and go to
  // chest; (4,7,6) and (2,6,7) tie three ways and go to their first corner,
  // hips; spine keeps no triangle and so no part
  const tie = humanBodyBasisFixture();
  const skin = tie.basis.surfaces[0].skin;
  skin.joints = ["hips", "spine", "chest"];
  tie.basis.joints.push({
    ...tie.basis.joints[1],
    bone: "chest",
    parent: "spine",
    head: "joint-spine-2",
    tail: "joint-pelvis",
  });
  skin.boneIndices[4 * 4] = 0;
  skin.boneIndices[5 * 4] = 2;
  skin.boneIndices[6 * 4] = 2;
  const tied = segmentHumanBodyModel(
    tie.basis,
    createHumanBodyBasisBuilder(tie.basis)(tie.document),
  );
  TestValidator.equals(
    "majority and first-corner tie rules",
    tied.model.parts.map((part) => [
      part.id,
      part.geometry.type === "mesh"
        ? part.geometry.mesh.indices!.length / 3
        : -1,
    ]),
    [
      ["hips", 10],
      ["chest", 2],
    ],
  );

  // 3. a UV seam duplicates vertex 4 in the built population
  const seam = humanBodyBasisFixture();
  const region = seam.basis.surfaces[0].regions[0];
  region.uvs = region.indices.flatMap((vertex, corner) => [
    vertex === 4 && corner % 2 === 0 ? 0.25 : 0,
    0,
  ]);
  const seamed = segmentHumanBodyModel(
    seam.basis,
    createHumanBodyBasisBuilder(seam.basis)(seam.document),
  );
  // vertex 4 sits on both parts' triangles; the seam adds a second output
  // vertex for it, so the source is named once more than without the seam
  const named = (map: Map<string, number[]>): number =>
    [...map.values()].flat().filter((source) => source === 4).length;
  TestValidator.equals(
    "the seam-split vertex is named once more",
    [named(sources), named(seamed.sources)],
    [2, 3],
  );
  TestValidator.predicate(
    "a built population that does not match the walk refuses",
    throwsError(() =>
      segmentHumanBodyModel(seam.basis, {
        ...built,
        model: {
          ...built.model,
          parts: [
            {
              ...built.model.parts[0],
              geometry: {
                type: "mesh",
                mesh: {
                  positions: [0, 0, 0],
                  normals: [0, 1, 0],
                  indices: [0, 0, 0],
                  uvs: null,
                  skin: null,
                },
              },
            },
          ],
        },
      }),
    ) &&
      throwsError(() =>
        segmentHumanBodyModel(basis, {
          ...built,
          model: {
            ...built.model,
            parts: [
              {
                ...built.model.parts[0],
                geometry: {
                  type: "primitive",
                  shape: { type: "box", width: 1, height: 1, depth: 1 },
                },
              },
            ],
          },
        }),
      ),
  );

  // 4. export
  const { glb, gltf } = await exportHumanBody(built.model);
  TestValidator.equals(
    "GLB magic",
    String.fromCharCode(glb[0], glb[1], glb[2], glb[3]),
    "glTF",
  );
  TestValidator.equals("one mesh in the glTF", gltf.json.meshes?.length, 1);
};
