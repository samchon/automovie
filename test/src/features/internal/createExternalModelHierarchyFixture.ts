import type { IExternalModelHierarchyFixture } from "./IExternalModelHierarchyFixture";
import type { IExternalModelHierarchyNode } from "./IExternalModelHierarchyNode";

/** Create the existing resident weighted-hips model and two-key rotation without changing its byte layout. */
export const createExternalModelHierarchyFixture: () => IExternalModelHierarchyFixture =
  (): IExternalModelHierarchyFixture => {
    const payload: Buffer = Buffer.alloc(100);
    for (let vertex: number = 0; vertex < 3; ++vertex)
      payload[48 + vertex * 4] = 255;
    payload.writeFloatLE(1, 64);
    payload.writeFloatLE(1, 80);
    payload.writeFloatLE(1, 96);
    return {
      payload,
      document: {
        asset: { version: "2.0" },
        buffers: [{ byteLength: 100, uri: "actor.bin" }],
        bufferViews: [
          { buffer: 0, byteOffset: 0, byteLength: 36 },
          { buffer: 0, byteOffset: 36, byteLength: 12 },
          { buffer: 0, byteOffset: 48, byteLength: 12 },
          { buffer: 0, byteOffset: 60, byteLength: 8 },
          { buffer: 0, byteOffset: 68, byteLength: 32 },
        ],
        accessors: [
          { bufferView: 0, componentType: 5126, count: 3, type: "VEC3" },
          { bufferView: 1, componentType: 5121, count: 3, type: "VEC4" },
          {
            bufferView: 2,
            componentType: 5121,
            normalized: true,
            count: 3,
            type: "VEC4",
          },
          { bufferView: 3, componentType: 5126, count: 2, type: "SCALAR" },
          { bufferView: 4, componentType: 5126, count: 2, type: "VEC4" },
        ],
        meshes: [
          {
            primitives: [
              { attributes: { POSITION: 0, JOINTS_0: 1, WEIGHTS_0: 2 } },
            ],
          },
        ],
        nodes: [
          { mesh: 0, skin: 0, name: "Actor" },
          { name: "Hips" },
        ] as IExternalModelHierarchyNode[],
        skins: [{ joints: [1] }],
        scenes: [{ nodes: [0, 1] }] as Array<{ nodes?: number[] }> | undefined,
        scene: undefined as number | undefined,
        animations: [
          {
            samplers: [{ input: 3, output: 4 }],
            channels: [{ sampler: 0, target: { node: 0, path: "rotation" } }],
          },
        ],
      },
    };
  };
