import { createPortraitMaterials } from "@automovie/human";
import type { ConnectedBodyModel } from "@automovie/playground/src/human/connectedBodyProtocol";
import { createConnectedBodyRenderer } from "@automovie/playground/src/human/connectedBodyRenderer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { rejectsError, throwsError } from "../internal/predicates";

const makeModel = (x = 1): ConnectedBodyModel => ({
  id: "body",
  name: "Body",
  origin: "imported",
  skeleton: null,
  body: null,
  asset: null,
  materials: createPortraitMaterials().filter(
    (material) => material.id === "skin",
  ),
  parts: [
    {
      id: "skin",
      name: "Skin",
      attachedBone: null,
      material: "skin",
      transform: null,
      geometry: {
        type: "mesh",
        mesh: {
          positions: new Float32Array([0, 0, 0, x, 0, 0, 0, 1, 0]),
          normals: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]),
          uvs: null,
          indices: new Uint32Array([0, 1, 2]),
          skin: null,
        },
      },
    },
  ],
});

/** Candidate preparation leaves the displayed mesh untouched until publication. */
export const test_human_body_resident_renderer_2572 =
  async (): Promise<void> => {
    let loads = 0;
    let loadedTexture: THREE.Texture | undefined;
    const renderer = createConnectedBodyRenderer({
      loadTexture: async () => {
        ++loads;
        return (loadedTexture = new THREE.Texture());
      },
      maxAnisotropy: 1,
    });
    const first = await renderer.prepare(makeModel());
    const group = renderer.publish(first);
    const mesh = group.children[0] as THREE.Mesh<THREE.BufferGeometry>;
    const positions = mesh.geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;
    TestValidator.equals("initial position", positions.getX(1), 1);
    const edited = await renderer.prepare(makeModel(2));
    TestValidator.equals(
      "prepare does not touch display",
      positions.getX(1),
      1,
    );
    renderer.publish(edited);
    TestValidator.predicate(
      "ordinary deformation reuses the displayed group",
      renderer.publish(edited) === group && positions.getX(1) === 2,
    );
    const changed = makeModel(3);
    changed.parts[0].geometry.mesh.indices = new Uint32Array([0, 2, 1]);
    const topology = await renderer.prepare(changed);
    const replacement = renderer.publish(topology);
    TestValidator.predicate(
      "changed topology replaces resident group",
      replacement !== group,
    );
    const missingNormals = makeModel();
    missingNormals.parts[0].geometry.mesh.normals = null;
    const computed = await renderer.prepare(missingNormals);
    const computedGroup = renderer.publish(computed);
    TestValidator.predicate(
      "absent normals compute on the resident mesh",
      computedGroup !== replacement &&
        (computedGroup.children[0] as THREE.Mesh).geometry.getAttribute(
          "normal",
        ) !== undefined,
    );
    const uv = makeModel();
    uv.parts[0].geometry.mesh.uvs = new Float32Array([0, 0, 1, 0, 0, 1]);
    const uvFrame = await renderer.prepare(uv);
    const uvGroup = renderer.publish(uvFrame);
    TestValidator.predicate(
      "UV topology change replaces buffers",
      uvGroup !== computedGroup,
    );
    const colored = makeModel();
    colored.parts[0].geometry.mesh.colors = new Float32Array(9).fill(1);
    const colorFrame = await renderer.prepare(colored);
    const colorGroup = renderer.publish(colorFrame);
    TestValidator.predicate(
      "color attribute change replaces buffers",
      colorGroup !== uvGroup,
    );
    const renamed = makeModel();
    renamed.parts[0].name = "Changed skin";
    const renamedFrame = await renderer.prepare(renamed);
    const renamedGroup = renderer.publish(renamedFrame);
    TestValidator.predicate(
      "part metadata change replaces buffers",
      renamedGroup !== colorGroup,
    );
    const added = makeModel();
    added.parts.push({ ...added.parts[0], id: "second" });
    const addedFrame = await renderer.prepare(added);
    const addedGroup = renderer.publish(addedFrame);
    TestValidator.predicate(
      "part count change replaces buffers",
      addedGroup !== renamedGroup,
    );
    const withFinish = makeModel(4);
    withFinish.materials[0].roughness = 0.2;
    const finish = await renderer.prepare(withFinish);
    TestValidator.predicate(
      "finish change replaces resident group",
      renderer.publish(finish) !== addedGroup,
    );
    const stale = await renderer.prepare(makeModel(5));
    renderer.dispose(stale);
    TestValidator.predicate(
      "discarded candidate cannot publish",
      throwsError(() => renderer.publish(stale), "released"),
    );
    const texture = makeModel();
    texture.materials[0].baseColorTexture = "resident-image";
    const textured = await renderer.prepare(texture);
    renderer.publish(textured);
    TestValidator.predicate(
      "declared texture is loaded in glTF orientation",
      loads === 1 && loadedTexture?.flipY === false,
    );
    const failed = createConnectedBodyRenderer({
      loadTexture: async () => {
        throw new Error("missing texture");
      },
      maxAnisotropy: 1,
    });
    TestValidator.predicate(
      "texture failure cannot publish a partial candidate",
      await rejectsError(() => failed.prepare(texture), "resident-image"),
    );
    const invalidSampling = createConnectedBodyRenderer({
      loadTexture: async () => new THREE.Texture(),
      maxAnisotropy: -1,
    });
    TestValidator.predicate(
      "preview preparation failure is propagated",
      await rejectsError(
        () => invalidSampling.prepare(makeModel()),
        "anisotropy",
      ),
    );
  };
