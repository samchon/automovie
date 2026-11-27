import type {
  AutoMovieHumanoidBone,
  IAutoMovieMaterial,
  IAutoMovieMeshMorphTarget,
  IAutoMovieMeshSkin,
  IAutoMovieModel,
} from "@automovie/interface";
import * as THREE from "three";

import { AutoMovieRenderSkinnedMesh } from "../AutoMovieRenderSkinnedMesh.js";
import { AutoMovieRenderThreeKind } from "../AutoMovieRenderThreeKind.js";
import type { IAutoMovieRenderModelObject } from "../IAutoMovieRenderModelObject.js";
import type { IAutoMovieRenderTextureResolver } from "../IAutoMovieRenderTextureResolver.js";
import { applyTransform } from "./applyTransform.js";
import { buildGeometry } from "./buildGeometry.js";
import { AutoMovieRenderMaterial } from "../AutoMovieRenderMaterial.js";
import { constructAutoMovieOwnedResources } from "./constructAutoMovieOwnedResources.js";
import { defaultMaterial } from "./defaultMaterial.js";
import { AutoMovieRenderDualQuaternionSkinning, AutoMovieRenderDualQuaternionSkinning } from "../AutoMovieRenderDualQuaternionSkinning.js";
import { AutoMovieRenderCollisionSource } from "../AutoMovieRenderCollisionSource.js";
import { AutoMovieRenderReliefWeightShading, AutoMovieRenderReliefWeightShading } from "../AutoMovieRenderReliefWeightShading.js";
import { AutoMovieRenderWearShading, AutoMovieRenderWearShading } from "../AutoMovieRenderWearShading.js";

/*
 * Build a renderable `three.js` object from an IAutoMovieModel.
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
 * patched depth and distance materials, so the shadow deforms like the surface;
 * the mesh is flagged so guide passes patch the materials they swap in. Every
 * skinned part is an AutoMovieRenderSkinnedMesh of its skin's method, so
 * bounds, culling, raycasts and vertex queries read the blend the shader draws.
 * Parts with the same ordered joint slots share one skeleton and bone texture
 * within this model; each mesh retains its own bind matrix and blend method.
 * Separate model builds own independent skeletons and pose state.
 *
 * A mesh's morph targets reach `morphTargetDictionary` by name, so
 * applyExpression drives them, and its driven targets are recorded on
 * the mesh for applyPose.
 *
 * The returned `bones` map is what applyPose drives, and the model's
 * `lookAt` rides along so AutoMovieRenderPlayer can turn its eye bones.
 *
 * `resolveTexture` is how a declared PBR finish gets its pixels, and it is the
 * host's to supply because this package performs no I/O: the caller decodes the
 * model's bindings first (an `AutoMovieRenderTextureCache` primes them in one pass)
 * and hands over an IAutoMovieRenderTextureResolver that answers
 * synchronously. Omitting it builds every material with its scalar coefficients
 * and no maps, which is exactly what a model declaring no texture renders and
 * what every pre-texture production still renders. The resolver must answer
 * with a texture object PER BINDING, because AutoMovieRenderMaterial.build writes that
 * binding's color space, UV transform and sampler onto whatever it is given,
 * and two slots sharing one object would fight over one repeat. Every returned
 * geometry and material is registered as soon as it is acquired, before a later
 * part, binding or attachment can fail. Failure independently retires those
 * owned objects, including objects not yet attached to the group; successful
 * return transfers them to the caller. Texture wrappers stay with the
 * resolver's owner. A nested producer retires its own failed allocation. An
 * anisotropic rigid mesh without morph targets or normal maps receives native
 * computed tangents when its indexed normal/UV geometry supports them. Mapped
 * and deforming meshes retain their derivative frame: a rest tangent cannot
 * follow a morph or replace a transformed normal-map frame. This changes no
 * source arrays or material coefficients, is not a MikkTSpace bake guarantee
 * and leaves degenerate UVs on their existing fallback. Fully transparent,
 * non-transmissive parts stay hidden when a guide swaps materials. A part whose
 * material declares `wear` gets its own material instance and is drawn
 * non-indexed with its bind-pose feature edges, by `AutoMovieRenderWearShading.apply`;
 * disposing that material also disposes its edge texture.
 */
export const buildModel: (
  model: IAutoMovieModel,
  resolveTexture?: IAutoMovieRenderTextureResolver,
) => IAutoMovieRenderModelObject = (
  model: IAutoMovieModel,
  resolveTexture?: IAutoMovieRenderTextureResolver,
): IAutoMovieRenderModelObject => {
  return constructAutoMovieOwnedResources(
    (
      own: <Resource extends { dispose(): void }>(
        resource: Resource,
      ) => Resource,
    ): IAutoMovieRenderModelObject => {
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

      // Inverse binds depend on bone rest worlds, which no part changes.
      // Establish them once before adding any skin instead of revisiting the
      // growing part graph for every mesh.
      group.updateMatrixWorld(true);
      const skeletons: Map<string, THREE.Skeleton> = new Map();

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
        let geo: THREE.BufferGeometry<
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
          if (dualQuaternion) AutoMovieRenderDualQuaternionSkinning.apply(mat);
        } else if (definition.wear !== undefined) {
          // A worn material reads this geometry's own feature edges, so each
          // part gets its own material and its non-indexed geometry.
          mat = own(AutoMovieRenderMaterial.build(definition, resolveTexture));
          mat.vertexColors = colored;
          if (weighted && mat.normalMap !== null) AutoMovieRenderReliefWeightShading.apply(mat);
          if (dualQuaternion) AutoMovieRenderDualQuaternionSkinning.apply(mat);
          const worn: {
            geometry: THREE.BufferGeometry;
            texture: THREE.DataTexture;
          } = AutoMovieRenderWearShading.apply(geo, mat, definition.wear);
          geo = own(worn.geometry);
          own(worn.texture);

          // Only the material's compiled program reads the edge texture, so
          // whoever disposes the part's material releases it too.
          mat.addEventListener("dispose", (): void => worn.texture.dispose());
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
            mat = own(AutoMovieRenderMaterial.build(definition, resolveTexture));
            mat.vertexColors = colored;
            if (weighted && mat.normalMap !== null) AutoMovieRenderReliefWeightShading.apply(mat);
            if (dualQuaternion) AutoMovieRenderDualQuaternionSkinning.apply(mat);
            variants.set(key, mat);
          } else mat = cached;
        }
        // A supplied tangent also changes normal-map projection. Keep mapped
        // and deforming meshes on their prior derivative frame, rather than
        // replacing transformed UVs or a moving morph with UV0 rest tangents.
        const morphed: boolean =
          part.geometry.type === "mesh" &&
          (part.geometry.mesh.targets?.length ?? 0) > 0;
        if (
          (definition?.anisotropy?.strength ?? 0) > 0 &&
          skin === null &&
          !morphed &&
          mat.normalMap === null &&
          geo.index !== null &&
          geo.hasAttribute("normal") &&
          geo.hasAttribute("uv")
        ) {
          geo.computeTangents();
          const tangent:
            | THREE.BufferAttribute
            | THREE.InterleavedBufferAttribute = geo.getAttribute("tangent");
          for (let k: number = 0; k < tangent.count; ++k) {
            const length: number = Math.hypot(
              tangent.getX(k),
              tangent.getY(k),
              tangent.getZ(k),
            );
            if (length === 0) {
              geo.deleteAttribute("tangent");
              break;
            }
          }
        }
        const mesh: THREE.Mesh<
          THREE.BufferGeometry<
            THREE.NormalBufferAttributes,
            THREE.BufferGeometryEventMap
          >,
          THREE.MeshStandardMaterial,
          THREE.Object3DEventMap
        > = skin !== null
          ? new AutoMovieRenderSkinnedMesh(geo, mat, skin.method ?? "linear")
          : new THREE.Mesh(geo, mat);
        mesh.visible = mat.visible;
        mesh.name = part.name ?? part.id;
        parts.set(part.id, mesh);
        // Three's Mesh constructor ran updateMorphTargets(), so the dictionary
        // already names each target; applyPose writes the driven ones.
        // Names and drivers only: Object3D.clone copies userData through JSON,
        // and the delta buffers already live in the geometry.
        const driven: Pick<IAutoMovieMeshMorphTarget, "name" | "driver">[] =
          part.geometry.type === "mesh"
            ? (part.geometry.mesh.targets ?? [])
                .filter(
                  (target: IAutoMovieMeshMorphTarget): boolean =>
                    target.driver !== undefined && target.driver !== null,
                )
                .map(
                  (
                    target: IAutoMovieMeshMorphTarget,
                  ): Pick<IAutoMovieMeshMorphTarget, "name" | "driver"> => ({
                    name: target.name,
                    driver: target.driver,
                  }),
                )
            : [];
        if (driven.length !== 0)
          mesh.userData.automovieMorphTargetDrivers = driven;
        if (part.transform !== null) applyTransform(mesh, part.transform);

        if (AutoMovieRenderThreeKind.isSkinnedMesh(mesh) && skin !== null) {
          const palette: string = JSON.stringify(skin.joints);
          let skeleton: THREE.Skeleton | undefined = skeletons.get(palette);
          if (skeleton === undefined) {
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
            skeleton = own(new THREE.Skeleton(jointBones));
            skeletons.set(palette, skeleton);
          }
          group.add(mesh);

          // A palette's inverse binds are shared, but a mesh's authored TRS
          // determines its own bind matrix. Passing it explicitly also avoids
          // Three recalculating the shared inverses for each mesh.
          mesh.updateMatrixWorld(true);
          mesh.bind(skeleton, mesh.matrixWorld);
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
            AutoMovieRenderDualQuaternionSkinning.apply(depth);
            AutoMovieRenderDualQuaternionSkinning.apply(distance);
            mesh.customDepthMaterial = depth;
            mesh.customDistanceMaterial = distance;
            // guide passes that swap the material read this to patch theirs
            mesh.userData.automovieDualQuaternionSkinning = true;
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

      // Without a skeleton every part is fixed to the root: one rigid assembly
      // for placed collision checks while its parts keep their built placement.
      if (model.skeleton === null)
        AutoMovieRenderCollisionSource.bindAssembly(group, parts.values());

      return {
        object: group,
        bones,
        parts,
        ...(model.lookAt === undefined ? {} : { lookAt: model.lookAt }),
      };
    },
  );
};
