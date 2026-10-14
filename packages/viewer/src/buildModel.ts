import type {
  AutoMovieHumanoidBone,
  IAutoMovieMaterial,
  IAutoMovieMeshMorphTarget,
  IAutoMovieMeshSkin,
  IAutoMovieModel,
} from "@automovie/interface";
import * as THREE from "three";

import type { IAutoMovieModelObject } from "./IAutoMovieModelObject.js";
import type { IAutoMovieTextureResolver } from "./IAutoMovieTextureResolver.js";
import { applyTransform } from "./applyTransform.js";
import { buildGeometry } from "./buildGeometry.js";
import { buildMaterial } from "./buildMaterial.js";
import { constructAutoMovieOwnedResources } from "./constructAutoMovieOwnedResources.js";
import { defaultMaterial } from "./defaultMaterial.js";
import { applyDualQuaternionSkinning } from "./dualQuaternionSkinning/index.js";
import { applyReliefWeights } from "./reliefWeightShading/index.js";

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
 * A skin whose `method` is `"dual-quaternion"` takes a material variant with
 * the dual quaternion vertex patch, and its mesh casts shadows through its own
 * patched depth and distance materials, so the shadow deforms like the surface.
 *
 * A mesh's morph targets reach `morphTargetDictionary` by name, so
 * {@link applyExpression} drives them, and its driven targets are recorded on
 * the mesh for {@link applyPose}.
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
 * Every returned geometry and material is registered as soon as it is acquired,
 * before a later part, binding or attachment can fail. Failure independently
 * retires those owned objects, including objects not yet attached to the group;
 * successful return transfers them to the caller. Texture wrappers stay with
 * the resolver's owner. A nested producer retires its own failed allocation.
 *
 * @author Samchon
 * @evidence contracts/common.md#principled-implementation Builds admitted semantic bone rest TR and part TRS, binds skin joints or rigid attached bones, selects linear or dual quaternion skinning per skin through the material shader patch and matching shadow materials, and realizes geometry/PBR through their canonical owners; attachedBone intentionally takes precedence over skin, bone rest scale is unit by engine convention and complete finite/unique hierarchy/material admission remains upstream.
 * @evidence contracts/common.md#clear-and-simple-design Owns one model graph plus semantic bone/part registries and shares material variants by definition id with vertex-color/relief/skinning-method flags and one patched shadow pair per dual quaternion mesh; geometry, physical-vertex mapping, material shading and imported appearances remain separate producers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing referenced skin/attached bones throw rather than producing frozen geometry; missing material definitions currently select the ordinary default material, so this producer is not a substitute for complete source admission. No anatomical fixture names, patched Three methods or extra UV channels choose output.
 * @evidence contracts/common.md#meaningful-documentation Documents rigid-versus-skin precedence, the dual quaternion material and shadow variants, morph target naming and the driven-target record, bone lookup, texture resolver/binding-private ownership, first-acquisition rollback and result transfer; comments give the shared engine unit bone-scale convention.
 * @evidence contracts/performance.md#efficient-algorithms Builds B bones and P parts with id maps, one geometry per part and one material per encountered definition/colored/weighted/skinning-method variant plus two shadow materials per dual quaternion skinned part; typed buffer work scales with vertices/indices, and skin binding updates the graph for each skinned part, so repeated skin parts may add repeated hierarchy work.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares existing material variants across matching part flags and borrows primed texture bindings; each bone/part graph is independent because Object3D parent/pose state cannot be reused across placements without explicit clone ownership.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Registers created geometry/material/shadow material/skeleton immediately within construction rollback and transfers the complete model graph/registries on success; resolver textures stay externally owned. The returned record provides no universal disposer, so its scene/runtime owner must enumerate physical resources including skin skeleton state when retiring it.
 */
export const buildModel: (
  model: IAutoMovieModel,
  resolveTexture?: IAutoMovieTextureResolver,
) => IAutoMovieModelObject = (
  model: IAutoMovieModel,
  resolveTexture?: IAutoMovieTextureResolver,
): IAutoMovieModelObject => {
  return constructAutoMovieOwnedResources(
    (
      own: <Resource extends { dispose(): void }>(
        resource: Resource,
      ) => Resource,
    ): IAutoMovieModelObject => {
      const group: THREE.Group<THREE.Object3DEventMap> = new THREE.Group();
      group.name = model.name ?? model.id;

      const bones: Map<
        AutoMovieHumanoidBone,
        THREE.Bone<THREE.Object3DEventMap>
      > = new Map<AutoMovieHumanoidBone, THREE.Bone>();
      if (model.skeleton !== null) {
        for (const b of model.skeleton.bones) {
          const bone: THREE.Bone<THREE.Object3DEventMap> = new THREE.Bone();
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
          const bone: THREE.Bone<THREE.Object3DEventMap> = bones.get(b.bone)!;
          const parent: THREE.Bone<THREE.Object3DEventMap> | undefined =
            b.parent !== null ? bones.get(b.parent) : undefined;
          (parent ?? group).add(bone);
        }
      }

      const definitions: Map<string, IAutoMovieMaterial> = new Map(
        model.materials.map(
          (m: IAutoMovieMaterial): [string, IAutoMovieMaterial] => [m.id, m],
        ),
      );
      const materials: Map<
        string,
        Map<string, THREE.MeshStandardMaterial>
      > = new Map<string, Map<string, THREE.MeshStandardMaterial>>();
      const parts: Map<
        string,
        THREE.Object3D<THREE.Object3DEventMap>
      > = new Map<string, THREE.Object3D>();
      for (const part of model.parts) {
        const geo: THREE.BufferGeometry<
          THREE.NormalBufferAttributes,
          THREE.BufferGeometryEventMap
        > = own(buildGeometry(part.geometry));
        const colored: boolean = geo.hasAttribute("color");
        // a mesh with relief weights takes its own variant, whose normal map's
        // slopes they scale; one without keeps the material as authored
        const weighted: boolean = geo.hasAttribute("reliefWeight");
        const skin: IAutoMovieMeshSkin | null =
          part.attachedBone === null && part.geometry.type === "mesh"
            ? part.geometry.mesh.skin
            : null;
        const dualQuaternion: boolean = skin?.method === "dual-quaternion";
        const definition: IAutoMovieMaterial | undefined =
          part.material === null ? undefined : definitions.get(part.material);
        let mat: THREE.MeshStandardMaterial;
        if (definition === undefined) {
          mat = own(defaultMaterial());
          mat.vertexColors = colored;
          if (dualQuaternion) applyDualQuaternionSkinning(mat);
        } else {
          let variants: Map<string, THREE.MeshStandardMaterial> | undefined =
            materials.get(definition.id);
          if (variants === undefined) {
            variants = new Map();
            materials.set(definition.id, variants);
          }
          const key: string = `${colored}:${weighted}:${dualQuaternion}`;
          const cached: THREE.MeshStandardMaterial | undefined =
            variants.get(key);
          if (cached === undefined) {
            mat = own(buildMaterial(definition, resolveTexture));
            mat.vertexColors = colored;
            if (weighted && mat.normalMap !== null) applyReliefWeights(mat);
            if (dualQuaternion) applyDualQuaternionSkinning(mat);
            variants.set(key, mat);
          } else mat = cached;
        }
        const mesh: THREE.Mesh<
          THREE.BufferGeometry<
            THREE.NormalBufferAttributes,
            THREE.BufferGeometryEventMap
          >,
          THREE.MeshStandardMaterial,
          THREE.Object3DEventMap
        > = skin !== null
          ? new THREE.SkinnedMesh(geo, mat)
          : new THREE.Mesh(geo, mat);
        mesh.name = part.name ?? part.id;
        parts.set(part.id, mesh);
        // Three's Mesh constructor ran updateMorphTargets(), so the dictionary
        // already names each target; applyPose writes the driven ones.
        const driven: IAutoMovieMeshMorphTarget[] =
          part.geometry.type === "mesh"
            ? (part.geometry.mesh.targets ?? []).filter(
                (target: IAutoMovieMeshMorphTarget): boolean =>
                  target.driver !== undefined && target.driver !== null,
              )
            : [];
        if (driven.length !== 0)
          mesh.userData.automovieMorphTargetDrivers = driven;
        if (part.transform !== null) applyTransform(mesh, part.transform);

        if (mesh instanceof THREE.SkinnedMesh && skin !== null) {
          const jointBones: THREE.Bone<THREE.Object3DEventMap>[] =
            skin.joints.map(
              (
                joint: AutoMovieHumanoidBone,
              ): THREE.Bone<THREE.Object3DEventMap> => {
                const bone: THREE.Bone<THREE.Object3DEventMap> | undefined =
                  bones.get(joint);
                if (bone === undefined)
                  throw new Error(
                    `part "${part.id}" skin references missing bone "${joint}"`,
                  );
                return bone;
              },
            );
          group.add(mesh);
          group.updateMatrixWorld(true);
          mesh.bind(own(new THREE.Skeleton(jointBones)));
          mesh.normalizeSkinWeights();
          if (dualQuaternion) {
            // The depth and distance passes would otherwise draw this skin
            // linearly blended. Three copies the beauty material's alpha, side
            // and clipping onto a custom shadow material before each draw, so
            // each mesh keeps its own pair rather than toggling a shared one.
            const depth: THREE.MeshDepthMaterial = own(
              new THREE.MeshDepthMaterial(),
            );
            const distance: THREE.MeshDistanceMaterial = own(
              new THREE.MeshDistanceMaterial(),
            );
            applyDualQuaternionSkinning(depth);
            applyDualQuaternionSkinning(distance);
            mesh.customDepthMaterial = depth;
            mesh.customDistanceMaterial = distance;
          }
        } else if (part.attachedBone !== null) {
          // An unknown attachedBone must throw like the skin path above (#1106):
          // the silent fallback parented a hand-held prop to the model root,
          // rendering it frozen at the origin while everything else looked right,
          // the silent-skip class #1051 removed from the viewer.
          const parentBone: THREE.Bone<THREE.Object3DEventMap> | undefined =
            bones.get(part.attachedBone);
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
    },
  );
};
