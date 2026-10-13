import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * Static mesh attributes at the worker preview's Float32 precision boundary.
 *
 * @evidence contracts/common.md#principled-implementation Transferable Float32 positions/directions/UVs/colours, Uint32 triangle indices and independently cloned physical source incidence describe the already posed worker mesh.
 * @evidence contracts/common.md#clear-and-simple-design One mesh carrier replaces resident number arrays with transferable buffers while retaining the existing physical-source descriptor schema.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Float32 buffers and null skin cannot imply animation binding, clinical anatomy or independent topology acceptance; packing owns actual output validation.
 * @evidence contracts/common.md#meaningful-documentation Fields identify metre coordinates, rounded normal components, UV0, linear colour, triangle references and unchanged opaque physical IDs.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Mesh transport typing performs no Float32 conversion or topology classification.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The buffer schema implements no sharing/cache policy across worker evaluations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration does not allocate or transfer buffers; the packer and message host own those lifetimes.
 *
 * @author Samchon
 */
export interface ConnectedBodyMesh {
  /** Metre positions, three scalars per vertex. */
  positions: Float32Array<ArrayBuffer>;

  /** Rounded normal components, or null when the viewer generates normals. */
  normals: Float32Array<ArrayBuffer> | null;

  /** glTF UV0 coordinates. */
  uvs: Float32Array<ArrayBuffer> | null;

  /** Linear RGB multipliers. */
  colors?: Float32Array<ArrayBuffer>;

  /** Triangle vertex references. */
  indices: Uint32Array<ArrayBuffer>;

  /** Owned source-pair/null incidence, cloned without narrowing opaque IDs. */
  physicalVertices?: IAutoMovieMesh["physicalVertices"];

  /** Already posed, so the viewer must not attempt skin binding. */
  skin: null;
}
