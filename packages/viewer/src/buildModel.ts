import type {
  AutoMovieHumanoidBone,
  IAutoMovieModel,
} from "@automovie/interface";
import * as THREE from "three";

import type { IAutoMovieModelObject } from "./IAutoMovieModelObject";
import type { IAutoMovieTextureResolver } from "./IAutoMovieTextureResolver";
import { applyTransform } from "./applyTransform";
import { buildGeometry } from "./buildGeometry";
import { buildMaterial } from "./buildMaterial";
import { defaultMaterial } from "./defaultMaterial";
import { applyReliefWeights } from "./reliefWeightShading";

/**
 * Build a renderable `three.js` object from an {@link IAutoMovieModel}.
 *
 * Constructs the bone hierarchy, then attaches each part. A rigid part is
 * parented to its `attachedBone` and rides that bone. A mesh with skin data and
 * no rigid attachment becomes a `THREE.SkinnedMesh` bound to the skeleton. If
 * both signals are present, `attachedBone` wins: the part is treated as a rigid
 * prop and its skin payload is ignored by the viewer. An `attachedBone` the
 * skeleton does not carry throws, the same class as a skin referencing a
 * missing bone (#1106): a silently root-parented prop renders frozen at the
 * origin while everything else looks right.
 *
 * The returned `bones` map is what {@link applyPose} drives.
 *
 * `resolveTexture` is how a declared PBR finish gets its pixels, and it is the
 * host's to supply because this package performs no I/O: the caller decodes the
 * model's bindings first (an `AutoMovieTextureCache` primes them in one pass)
 * and hands over an {@link IAutoMovieTextureResolver} that answers
 * synchronously. Omitting it builds every material with its scalar coefficients
 * and no maps, which is exactly what a model declaring no texture renders and
 * what every pre-texture production still renders. The resolver must answer
 * with a texture object PER BINDING, because {@link buildMaterial} writes that
 * binding's color space, UV transform and sampler onto whatever it is given,
 * and two slots sharing one object would fight over one repeat.
 *
 * @evidence requirements/rendering/geometry-visibility-and-culling.md#rendering-hierarchical-transforms Keeps this model surface in the compiled transform hierarchy.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-visibility-culling Materializes the same hierarchy for render visibility and culling.
 * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-lowering-ownership Keeps compiled model identity distinct from viewer-owned runtime objects.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Implements the runtime ownership side of isolated scene lowering.
 * @author Samchon
 */
export const buildModel = (
  model: IAutoMovieModel,
  resolveTexture?: IAutoMovieTextureResolver,
): IAutoMovieModelObject => {
  const group = new THREE.Group();
  group.name = model.name ?? model.id;

  const bones = new Map<AutoMovieHumanoidBone, THREE.Bone>();
  if (model.skeleton !== null) {
    for (const b of model.skeleton.bones) {
      const bone = new THREE.Bone();
      bone.name = b.bone;
      // Rig rest SCALE is ignored, the engine's pinned convention (#1052):
      // `resolvePose` composes rotation and translation only, and
      // `motionToClip` matches it ("rest scale ignored on both sides").
      // Applying it here would render every descendant at the accumulated
      // scale product while ground contact, collision, and framing measured
      // the unscaled body. Scale stays first-class on scene NODES and object
      // motions (#1049). This convention is about rig bones only.
      bone.position.set(
        b.rest.translation.x,
        b.rest.translation.y,
        b.rest.translation.z,
      );
      bone.quaternion.set(
        b.rest.rotation.x,
        b.rest.rotation.y,
        b.rest.rotation.z,
        b.rest.rotation.w,
      );
      bones.set(b.bone, bone);
    }
    for (const b of model.skeleton.bones) {
      const bone = bones.get(b.bone)!;
      const parent = b.parent !== null ? bones.get(b.parent) : undefined;
      (parent ?? group).add(bone);
    }
  }

  const definitions = new Map(model.materials.map((m) => [m.id, m]));
  const materials = new Map<string, Map<string, THREE.MeshStandardMaterial>>();
  const parts = new Map<string, THREE.Object3D>();
  for (const part of model.parts) {
    const geo = buildGeometry(part.geometry);
    const colored = geo.hasAttribute("color");
    // a mesh with relief weights takes its own variant, whose normal map's
    // slopes they scale; one without keeps the material as authored
    const weighted = geo.hasAttribute("reliefWeight");
    const definition =
      part.material === null ? undefined : definitions.get(part.material);
    let mat: THREE.MeshStandardMaterial;
    if (definition === undefined) {
      mat = defaultMaterial();
      mat.vertexColors = colored;
    } else {
      let variants = materials.get(definition.id);
      if (variants === undefined) {
        variants = new Map();
        materials.set(definition.id, variants);
      }
      const key = `${colored}:${weighted}`;
      const cached = variants.get(key);
      if (cached === undefined) {
        mat = buildMaterial(definition, resolveTexture);
        mat.vertexColors = colored;
        if (weighted && mat.normalMap !== null) applyReliefWeights(mat);
        variants.set(key, mat);
      } else mat = cached;
    }
    const skin =
      part.attachedBone === null && part.geometry.type === "mesh"
        ? part.geometry.mesh.skin
        : null;
    const mesh =
      skin !== null
        ? new THREE.SkinnedMesh(geo, mat)
        : new THREE.Mesh(geo, mat);
    mesh.name = part.name ?? part.id;
    parts.set(part.id, mesh);
    if (part.transform !== null) applyTransform(mesh, part.transform);

    if (mesh instanceof THREE.SkinnedMesh && skin !== null) {
      const jointBones = skin.joints.map((joint) => {
        const bone = bones.get(joint);
        if (bone === undefined)
          throw new Error(
            `part "${part.id}" skin references missing bone "${joint}"`,
          );
        return bone;
      });
      group.add(mesh);
      group.updateMatrixWorld(true);
      mesh.bind(new THREE.Skeleton(jointBones));
      mesh.normalizeSkinWeights();
    } else if (part.attachedBone !== null) {
      // An unknown attachedBone must throw like the skin path above (#1106):
      // the silent fallback parented a hand-held prop to the model root,
      // rendering it frozen at the origin while everything else looked right,
      // the silent-skip class #1051 removed from the viewer.
      const parentBone = bones.get(part.attachedBone);
      if (parentBone === undefined)
        throw new Error(
          `part "${part.id}" attachedBone references missing bone "${part.attachedBone}"`,
        );
      parentBone.add(mesh);
    } else {
      group.add(mesh);
    }
  }

  return { object: group, bones, parts };
};
