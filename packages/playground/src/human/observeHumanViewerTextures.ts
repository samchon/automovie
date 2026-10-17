import type { AutoMovieTextureBinding } from "@automovie/interface";
import {
  IAutoMovieModelObject,
  readAutoMovieTextureSource,
  textureBindingAsset,
} from "@automovie/viewer";
import * as THREE from "three";

import { IHumanViewerTextureState } from "./IHumanViewerTextureState";
import { setHumanViewerRelief } from "./setHumanViewerRelief";

/**
 * Read configured wrappers from the same displayed model, without resolving another texture.
 *
 * The local resolver supplies weak request associations only. Actual native and detail/overlay slots are traversed after ordinary material construction and again after a draw. Material assignment is recorded independently of mesh or ancestor visibility, occlusion and actual sampling. Internal fallback maps remain explicitly unassociated.
 *
 * @evidence contracts/common.md#principled-implementation Traverses actual built part/material references, resolves saved surface materials before temporary substitutions, and observes their actual configured wrappers through readAutoMovieTextureSource.
 * @evidence contracts/common.md#clear-and-simple-design One read owner projects current material facts while the cache remains the only decode/issuance owner and the relief module owns its uniform.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Performs no extra resolver call, material build, shader compile, rendering, global replacement or GPU-residency inference.
 * @evidence contracts/common.md#meaningful-documentation Explains the normal construction/draw observation points, weak request association and internal fallback distinction.
 * @evidence contracts/performance.md#efficient-algorithms Visits current authored part subtrees and distinct actual materials once; output scales with visible model material slots, not decoded pixel count.
 * @evidence contracts/performance.md#reuse-equivalent-work Deduplicates shared actual material objects in this observation while reading their mutable configured values fresh.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary Maps and borrowed wrappers last only for this read; the result keeps copied declarations and scalar facts, not texture or material objects.
 */
export function observeHumanViewerTextures(props: {
  object: IAutoMovieModelObject | null;
  issued: WeakMap<THREE.Texture, AutoMovieTextureBinding>;
}): IHumanViewerTextureState["materials"] {
  const records: Map<
    THREE.MeshStandardMaterial,
    IHumanViewerTextureState["materials"][number]
  > = new Map();
  if (props.object === null) return [];
  for (const [id, part] of props.object.parts)
    part.traverse((node: THREE.Object3D): void => {
      const mesh: THREE.Mesh = node as THREE.Mesh;
      if (mesh.isMesh !== true) return;
      const saved: THREE.Material | THREE.Material[] = (mesh.userData
        .surfaceMaterial ?? mesh.material) as THREE.Material | THREE.Material[];
      for (const candidate of Array.isArray(saved) ? saved : [saved]) {
        const material: THREE.MeshStandardMaterial =
          candidate as THREE.MeshStandardMaterial;
        if (material.isMeshStandardMaterial !== true) continue;
        const active: boolean = (
          Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        ).includes(material);
        const existing:
          | IHumanViewerTextureState["materials"][number]
          | undefined = records.get(material);
        if (existing !== undefined) {
          if (!existing.parts.includes(id)) existing.parts.push(id);
          existing.active ||= active;
          continue;
        }
        const record: IHumanViewerTextureState["materials"][number] = {
          parts: [id],
          material: material.uuid,
          active,
          normalScale: material.normalScale?.toArray() ?? null,
          relief: setHumanViewerRelief.read(material),
          bindings: [],
        };
        const slots: [string, THREE.Texture | null | undefined][] = [
          ["map", material.map],
          ["normalMap", material.normalMap],
          ["roughnessMap", material.roughnessMap],
          ["metalnessMap", material.metalnessMap],
          ["aoMap", material.aoMap],
          ["emissiveMap", material.emissiveMap],
        ];
        const physical: THREE.MeshPhysicalMaterial =
          material as THREE.MeshPhysicalMaterial;
        if (physical.isMeshPhysicalMaterial === true)
          slots.push(
            ["thicknessMap", physical.thicknessMap],
            ["anisotropyMap", physical.anisotropyMap],
          );
        const detail: { texture: THREE.Texture } | undefined = material.userData
          .detailNormal as { texture: THREE.Texture } | undefined;
        if (detail !== undefined) slots.push(["detailNormal", detail.texture]);
        const overlays: {
          color: THREE.Texture;
          normal: THREE.Texture | null;
        }[] = (material.userData.overlays ?? []) as {
          color: THREE.Texture;
          normal: THREE.Texture | null;
        }[];
        overlays.forEach(
          (
            overlay: { color: THREE.Texture; normal: THREE.Texture | null },
            i: number,
          ): void => {
            slots.push(
              [`overlay.${i}.color`, overlay.color],
              [`overlay.${i}.normal`, overlay.normal],
            );
          },
        );
        for (const [slot, texture] of slots) {
          if (texture === null || texture === undefined) continue;
          const binding: AutoMovieTextureBinding | undefined =
            props.issued.get(texture);
          const asset: string | null =
            binding === undefined ? null : textureBindingAsset(binding);
          record.bindings.push({
            slot,
            asset,
            declared: binding === undefined ? null : structuredClone(binding),
            source: readAutoMovieTextureSource(
              asset ?? "viewer-internal-fallback",
              texture,
            ),
            texCoord: texture.channel,
            colorSpace: texture.colorSpace,
            transform: {
              offset: texture.offset.toArray(),
              repeat: texture.repeat.toArray(),
              rotation: texture.rotation,
            },
          });
        }
        records.set(material, record);
      }
    });
  return [...records.values()];
}
