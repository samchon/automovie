import type { AutoMovieHumanoidBone } from "@automovie/interface";
import * as THREE from "three";

import { AUTOMOVIE_HUMANOID_BONE_SLOTS } from "../../internal/AUTOMOVIE_HUMANOID_BONE_SLOTS.js";
import type { IAutoMovieImportedModelOptions } from "../../IAutoMovieImportedModelOptions.js";
import type { IAutoMovieModelObject } from "../../IAutoMovieModelObject.js";

/*
 * Wrap an imported runtime object as an IAutoMovieModelObject.
 * The wrapper isolates caller-owned root transforms, normalizes supported
 * humanoid bones, and carries expression targets and frame callbacks through.
 * Imported content remains one runtime object, without part-addressable
 * children.
 */
export const createImportedModelObject: (
  options: IAutoMovieImportedModelOptions,
) => IAutoMovieModelObject = (
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

const wrapObject: (object: THREE.Object3D) => THREE.Group = (
  object: THREE.Object3D,
): THREE.Group => {
  const group: THREE.Group<THREE.Object3DEventMap> = new THREE.Group();
  group.name = object.name === "" ? "imported" : `${object.name}:runtime`;
  group.add(object);
  return group;
};

const isHumanoidBone: (text: string) => text is AutoMovieHumanoidBone = (
  text: string,
): text is AutoMovieHumanoidBone =>
  AUTOMOVIE_HUMANOID_BONE_SLOTS.has(text);

const normalizeBones: (
  input: IAutoMovieImportedModelOptions["bones"],
) => Map<AutoMovieHumanoidBone, THREE.Object3D> = (
  input: IAutoMovieImportedModelOptions["bones"],
): Map<AutoMovieHumanoidBone, THREE.Object3D> => {
  const bones: Map<
    AutoMovieHumanoidBone,
    THREE.Object3D<THREE.Object3DEventMap>
  > = new Map<AutoMovieHumanoidBone, THREE.Object3D>();
  if (input === undefined) return bones;
  for (const [bone, node] of Object.entries(input))
    if (isHumanoidBone(bone) && node !== null && node !== undefined)
      bones.set(bone, node);
  return bones;
};
