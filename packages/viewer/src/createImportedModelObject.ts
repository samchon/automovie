import type { AutoMovieHumanoidBone } from "@automovie/interface";
import * as THREE from "three";

import type { IAutoMovieImportedModelOptions } from "./IAutoMovieImportedModelOptions";
import type { IAutoMovieModelObject } from "./IAutoMovieModelObject";

/**
 * Wrap an imported runtime object as an {@link IAutoMovieModelObject}.
 *
 * @evidence requirements/external-inputs/adoption-modes-and-composition.md#external-adoption-direct-placement Adapts this already-loaded object by direct placement without decoding it.
 * @evidence specifications/interchange-and-adoption/adoption-decisions-and-composition.md#interchange-direct-placement-boundary Implements the direct-placement boundary while preserving caller ownership.
 * @author Samchon
 */
export const createImportedModelObject = (
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

const wrapObject = (object: THREE.Object3D): THREE.Group => {
  const group = new THREE.Group();
  group.name = object.name === "" ? "imported" : `${object.name}:runtime`;
  group.add(object);
  return group;
};

const normalizeBones = (
  input: IAutoMovieImportedModelOptions["bones"],
): Map<AutoMovieHumanoidBone, THREE.Object3D> => {
  const bones = new Map<AutoMovieHumanoidBone, THREE.Object3D>();
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
