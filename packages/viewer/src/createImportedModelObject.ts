import type { AutoMovieHumanoidBone } from "@automovie/interface";
import * as THREE from "three";

import type { IAutoMovieImportedModelOptions } from "./IAutoMovieImportedModelOptions.js";
import type { IAutoMovieModelObject } from "./IAutoMovieModelObject.js";

/**
 * Wrap an imported runtime object as an {@link IAutoMovieModelObject}.
 *
 * @author Samchon
 * @evidence contracts/common.md#principled-implementation Always adds the supplied loaded root beneath a new runtime group so pose-root TRS does not overwrite the imported root's authored local TRS; normalized semantic bone map drops null/undefined entries and imported bytes have no generated part-id registry. Reparenting uses add, so an already-parented root's previous world placement is not preserved.
 * @evidence contracts/common.md#clear-and-simple-design Adapts one loaded root and optional bone/expression/frame ports into the same model handle as generated assets; loader/byte/native ownership remains with the caller and no duplicate decoded model is built.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Wrapping is uniform for every Object3D class rather than a fixture/instanceof root exception; semantic-map casts rely on admitted keys and no missing bones/parts or expression hooks are fabricated.
 * @evidence contracts/common.md#meaningful-documentation Gives loaded-root adaptation and comments explain protected local transform, empty imported part registry and forwarded hooks; bone mapping and adoption remain caller-owned contracts.
 * @evidence contracts/performance.md#efficient-algorithms Allocates one runtime group and copies B present bone-map entries once, O(B) CPU/reference storage without traversing or cloning mesh buffers/materials.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses actual decoded root/bone objects and forwards existing hook references; separate placements require separate loaded/cloned native roots because a single object cannot retain multiple parents.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows/adopts loaded graph into one wrapper and retains B bone/hook references with the returned handle; no decoder, worker or GPU allocation is acquired here, and the supplied graph's real owner must retire its resources when this runtime is released.
 */
export const createImportedModelObject: (options: IAutoMovieImportedModelOptions) => IAutoMovieModelObject = (
  options: IAutoMovieImportedModelOptions,
): IAutoMovieModelObject => ({
  // ALWAYS wrap (#1047): `applyPose` writes `pose.root` onto the model root's
  // local transform, and adopting a caller's Group directly (GLTFLoader's
  // `gltf.scene`, three-vrm's π-yawed VRM0 root) would stomp caller-owned
  // state, the same asset composed differently on an incidental instanceof.
  object: wrapObject(options.object),
  bones: normalizeBones(options.bones),
  // An imported appearance is one runtime object rather than the authored
  // parts a generated model is built from, so there is nothing here to address
  // by part id. A prop drawing imported bytes therefore cannot hang a joint on
  // a named piece of them; its articulation still turns, and what it turns is
  // whatever the joint's own subtree holds.
  parts: new Map(),
  expressionTargets: options.expressionTargets,
  afterAutoMovieFrame: options.afterAutoMovieFrame,
});

const wrapObject: (object: THREE.Object3D) => THREE.Group = (object: THREE.Object3D): THREE.Group => {
  const group: THREE.Group<THREE.Object3DEventMap> = new THREE.Group();
  group.name = object.name === "" ? "imported" : `${object.name}:runtime`;
  group.add(object);
  return group;
};

const normalizeBones: (input: IAutoMovieImportedModelOptions["bones"]) => Map<AutoMovieHumanoidBone, THREE.Object3D> = (
  input: IAutoMovieImportedModelOptions["bones"],
): Map<AutoMovieHumanoidBone, THREE.Object3D> => {
  const bones: Map<AutoMovieHumanoidBone, THREE.Object3D<THREE.Object3DEventMap>> = new Map<AutoMovieHumanoidBone, THREE.Object3D>();
  if (input === undefined) return bones;
  if (input instanceof Map) {
    for (const [bone, node] of input)
      if (node !== null && node !== undefined) bones.set(bone, node);
    return bones;
  }
  for (const [bone, node] of Object.entries(input))
    if (node !== null && node !== undefined)
      bones.set(bone as AutoMovieHumanoidBone, node);
  return bones;
};
