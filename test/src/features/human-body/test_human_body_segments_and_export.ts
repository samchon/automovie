import { measureAutoMovieModelCrossings } from "@automovie/engine";
import {
  createHumanBodyBasisBuilder,
  createHumanBodySegmenter,
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
 * 5. A basis-compiled partition reuses UV and skin ownership across two
 *    different shaped builds but returns fresh posed buffers and source maps.
 *    A same-size builder mesh with reordered corners or a render copy that
 *    disagrees with the connected posed skin refuses.
 * 6. Region compilation gathers site colour for skin and leaves an adjacent
 *    material uncoloured across repeated builds without altering triangles.
 */
export const test_human_body_segments_and_export = async (): Promise<void> => {
  const { basis, document } = humanBodyBasisFixture();
  const build = createHumanBodyBasisBuilder(basis);
  const built = build(document);
  const { model, sources } = segmentHumanBodyModel(basis, built);
  TestValidator.equals(
    "the build retains one connected posed skin before material splitting",
    [built.posedSurfaces.length, built.posedSurfaces[0].positions],
    [1, basis.surfaces[0].positions],
  );
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
  TestValidator.predicate(
    "segmented vertices read the same connected skin by source identity",
    model.parts.every((part) => {
      if (part.geometry.type !== "mesh") return false;
      const mesh = part.geometry.mesh;
      return sources
        .get(part.id)!
        .every((source, vertex) =>
          [0, 1, 2].every(
            (axis) =>
              mesh.positions[vertex * 3 + axis] ===
              built.posedSurfaces[0].positions[source * 3 + axis],
          ),
        );
    }),
  );
  const segment = createHumanBodySegmenter(basis);
  const atRest = segment(built);
  const restPart = atRest.model.parts[0];
  if (restPart.geometry.type !== "mesh") throw new Error("expected a mesh");
  const restPositions = restPart.geometry.mesh.positions.slice();
  const shaped = segment(build({ ...document, shape: { width: 1 } }));
  const shapedPart = shaped.model.parts[0];
  if (shapedPart.geometry.type !== "mesh") throw new Error("expected a mesh");
  TestValidator.predicate(
    "compiled ownership survives a new shape with fresh output buffers",
    shapedPart.geometry.mesh.positions.some(
      (value, at) => value !== restPositions[at],
    ) &&
      atRest.sources !== shaped.sources &&
      atRest.sources.get("hips") !== shaped.sources.get("hips") &&
      JSON.stringify([...atRest.sources]) ===
        JSON.stringify([...shaped.sources]),
  );
  TestValidator.equals(
    "a later shape leaves the first built positions alone",
    restPart.geometry.mesh.positions,
    restPositions,
  );
  const firstPart = built.model.parts[0];
  if (firstPart.geometry.type !== "mesh") throw new Error("expected a mesh");
  const reordered = {
    ...built,
    model: {
      ...built.model,
      parts: [
        {
          ...firstPart,
          geometry: {
            type: "mesh" as const,
            mesh: {
              ...firstPart.geometry.mesh,
              indices: firstPart.geometry.mesh.indices!.slice().reverse(),
            },
          },
        },
      ],
    },
  };
  TestValidator.predicate(
    "same-size reordered builder corners refuse",
    throwsError(() => segment(reordered), "corner order"),
  );
  const divergent = {
    ...built,
    model: {
      ...built.model,
      parts: [
        {
          ...firstPart,
          geometry: {
            type: "mesh" as const,
            mesh: {
              ...firstPart.geometry.mesh,
              positions: firstPart.geometry.mesh.positions.map(
                (value, index) => (index === 0 ? value + 0.01 : value),
              ),
            },
          },
        },
      ],
    },
  };
  TestValidator.predicate(
    "a divergent render copy cannot redefine the connected skin",
    throwsError(() => segment(divergent), "connected posed skin") &&
      throwsError(
        () =>
          segment({
            ...built,
            posedSurfaces: [{ ...built.posedSurfaces[0], positions: [] }],
          }),
        "connected posed skin",
      ) &&
      throwsError(
        () =>
          segment({
            ...built,
            posedSurfaces: [{ ...built.posedSurfaces[0], normals: [] }],
          }),
        "connected posed skin",
      ) &&
      throwsError(
        () => segment({ ...built, posedSurfaces: [] }),
        "connected posed skin",
      ),
  );
  const badNormal = {
    ...built,
    model: {
      ...built.model,
      parts: [
        {
          ...firstPart,
          geometry: {
            type: "mesh" as const,
            mesh: {
              ...firstPart.geometry.mesh,
              normals: firstPart.geometry.mesh.normals!.map((value, index) =>
                index === 0 ? value + 0.01 : value,
              ),
            },
          },
        },
      ],
    },
  };
  TestValidator.predicate(
    "render normals cannot diverge from connected skin normals",
    throwsError(() => segment(badNormal), "connected posed skin"),
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
  TestValidator.equals(
    "a UV seam alone is not a crossing",
    measureAutoMovieModelCrossings(seamed.model),
    [],
  );
  TestValidator.equals(
    "a UV seam alone is not a within-segment crossing",
    measureAutoMovieModelCrossings(seamed.model, { withinParts: true }),
    [],
  );
  const regions = humanBodyBasisFixture();
  const two = regions.basis.surfaces[0];
  regions.basis.materials.push({
    ...regions.basis.materials[0],
    id: "alternate",
  });
  two.regions = [
    { ...two.regions[0], id: "box/first", indices: two.indices.slice(0, 18) },
    {
      ...two.regions[0],
      id: "box/second",
      material: "alternate",
      indices: two.indices.slice(18),
    },
  ];
  const builtRegions = createHumanBodyBasisBuilder(regions.basis)(
    regions.document,
  );
  const colouredRegions = createHumanBodyBasisBuilder(regions.basis)({
    ...regions.document,
    skinColour: { cheek: { r: 0.463, g: 0.2714, b: 0.2091 } },
  });
  const colouredSkin = colouredRegions.model.parts[0].geometry;
  const plainAlternate = colouredRegions.model.parts[1].geometry;
  TestValidator.predicate(
    "site colour follows skin while the other compiled region stays plain",
    colouredSkin.type === "mesh" &&
      plainAlternate.type === "mesh" &&
      colouredSkin.mesh.colors?.length === colouredSkin.mesh.positions.length &&
      plainAlternate.mesh.colors === undefined &&
      colouredSkin.mesh.indices?.length === 18 &&
      plainAlternate.mesh.indices?.length === 18,
  );
  const segmentedRegions = segmentHumanBodyModel(regions.basis, builtRegions);
  TestValidator.equals(
    "every material region reaches the segment partition",
    segmentedRegions.model.parts.reduce(
      (count, part) =>
        count +
        (part.geometry.type === "mesh"
          ? part.geometry.mesh.indices!.length / 3
          : 0),
      0,
    ),
    12,
  );
  TestValidator.predicate(
    "both region identities remain stable on their bone segments",
    segmentedRegions.model.parts.some((part) =>
      part.id.endsWith("box/first"),
    ) &&
      segmentedRegions.model.parts.some((part) =>
        part.id.endsWith("box/second"),
      ) &&
      segmentedRegions.model.parts.every((part) =>
        segmentedRegions.sources.has(part.id),
      ),
  );
  TestValidator.predicate(
    "both resident materials follow their source regions",
    segmentedRegions.model.parts.some((part) => part.material === "skin") &&
      segmentedRegions.model.parts.some(
        (part) => part.material === "alternate",
      ),
  );
  TestValidator.equals(
    "a material seam alone is not a crossing",
    measureAutoMovieModelCrossings(segmentedRegions.model),
    [],
  );
  TestValidator.predicate(
    "a built model missing a declared region refuses partition",
    throwsError(() =>
      segmentHumanBodyModel(regions.basis, {
        ...builtRegions,
        model: {
          ...builtRegions.model,
          parts: builtRegions.model.parts.slice(0, 1),
        },
      }),
    ),
  );
  const probe = {
    ...builtRegions.model.parts[0],
    id: "interior-probe",
    geometry: {
      type: "mesh" as const,
      mesh: {
        positions: [0, 1.9, 0, 0.05, 2.1, 0, -0.05, 2.1, 0.1],
        normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
        indices: [0, 1, 2],
        uvs: null,
        skin: null,
      },
    },
  };
  const contacts = measureAutoMovieModelCrossings({
    ...segmentedRegions.model,
    parts: [...segmentedRegions.model.parts, probe],
  });
  TestValidator.predicate(
    "a crossing only on the second region reaches contact measurement",
    contacts.some(
      (contact) =>
        (contact.part.includes("box/second") &&
          contact.other === "interior-probe") ||
        (contact.other.includes("box/second") &&
          contact.part === "interior-probe"),
    ) &&
      !contacts.some(
        (contact) =>
          contact.part.includes("box/first") &&
          contact.other === "interior-probe",
      ),
  );
  const surfaces = humanBodyBasisFixture();
  const first = surfaces.basis.surfaces[0];
  surfaces.basis.surfaces.push({
    ...first,
    id: "other-box",
    positions: first.positions.map((value, i) =>
      i % 3 === 0 ? value + 1 : value,
    ),
    regions: first.regions.map((region) => ({
      ...region,
      id: "other-box/skin",
    })),
  });
  const segmentedSurfaces = segmentHumanBodyModel(
    surfaces.basis,
    createHumanBodyBasisBuilder(surfaces.basis)(surfaces.document),
  );
  TestValidator.predicate(
    "both surfaces contribute all triangles and distinct source ordinals",
    segmentedSurfaces.model.parts.reduce(
      (count, part) =>
        count +
        (part.geometry.type === "mesh"
          ? part.geometry.mesh.indices!.length / 3
          : 0),
      0,
    ) === 24 &&
      [...segmentedSurfaces.sources.values()]
        .flat()
        .some((source) => source >= 8),
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
  const exportedRegions = await exportHumanBody(builtRegions.model);
  TestValidator.equals(
    "static export preserves both material-region triangle populations",
    exportedRegions.gltf.json.meshes?.reduce(
      (count, mesh) =>
        count +
        mesh.primitives.reduce(
          (sum, primitive) =>
            sum +
            exportedRegions.gltf.json.accessors![primitive.indices!].count,
          0,
        ),
      0,
    ),
    36,
  );
};
