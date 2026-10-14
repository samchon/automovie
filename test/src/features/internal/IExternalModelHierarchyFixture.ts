import type { IExternalModelHierarchyNode } from "./IExternalModelHierarchyNode";

/**
 * Owned resident glTF bytes and mutable declarations used by the existing hierarchy cases.
 *
 * @author Samchon
 */
export interface IExternalModelHierarchyFixture {
  /** Resident sidecar buffer containing the original weights and rotation samples. */
  payload: Buffer;

  /** Original document fields that the hierarchy cases mutate before inspection. */
  document: {
    /** glTF asset-version declaration. */
    asset: { version: string };

    /** Resident sidecar identity and declared size. */
    buffers: { byteLength: number; uri: string }[];

    /** Original byte ranges within the sidecar. */
    bufferViews: { buffer: number; byteOffset: number; byteLength: number }[];

    /** Original typed sample declarations. */
    accessors: {
      bufferView: number;
      componentType: number;
      count: number;
      type: string;
      normalized?: boolean;
    }[];

    /** Weighted triangle's attribute references. */
    meshes: {
      primitives: {
        attributes: { POSITION: number; JOINTS_0: number; WEIGHTS_0: number };
      }[];
    }[];

    /** Flat node inventory whose edges define the tested forest. */
    nodes: IExternalModelHierarchyNode[];

    /** Joint ordinals consumed by humanoid profiles. */
    skins: { joints: number[] }[];

    /** Optional scene-root declarations, including deliberately absent roots. */
    scenes: { nodes?: number[] }[] | undefined;

    /** Optional default-scene ordinal. */
    scene: number | undefined;

    /** Original rotation animation and its mutable target ordinal. */
    animations: {
      /** Input/output accessor pairs in declaration order. */
      samplers: { input: number; output: number }[];

      /** Sampler references and authored node-channel paths. */
      channels: { sampler: number; target: { node: number; path: string } }[];
    }[];
  };
}
