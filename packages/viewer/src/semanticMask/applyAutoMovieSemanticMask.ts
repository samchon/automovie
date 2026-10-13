import type { IAutoMovieScene, IAutoMovieSemanticMask, IAutoMovieSemanticMaskEntry } from "@automovie/interface";
import * as THREE from "three";
import { type IAutoMovieFormationCycle, applyFormationCycleMaterial, formationCycleOf } from "../formationCycle/index.js";
import type { IAutoMovieSemanticMaskHandle } from "./IAutoMovieSemanticMaskHandle.js";
import { maskRoots } from "./maskRoots.js";
import { nearest } from "./nearest.js";
import { unresolvedOf } from "./unresolvedOf.js";

/**
 * Paint a built scene with its stable semantic palette.
 *
 * The mask pass that shipped before this coloured the Nth top-level child with
 * the Nth colour of a ramp, which meant an entire building read as one colour
 * and inserting an unrelated node repainted everything after it. Here every
 * mesh is painted the colour its own semantic id earned, so a wall, the opening
 * cut through it, the door leaf filling that opening and one repeated window
 * slot are four different colours, and they are the SAME four colours after the
 * scene is rebuilt in a different order.
 *
 * Resolution walks each mesh up to the nearest ancestor the mask names:
 *
 * - A staged node, matched to `design.nodes` by construction order, which is the
 *   order {@link buildScene} adds its top-level children in;
 * - Any named object the mask lists, which is how the standable ground and a
 *   compiled instance set's viewer group are found;
 * - A compiled instance set's per-slot colours, written into `instanceColor` so
 *   one window out of ten thousand is addressable without ever promoting it to
 *   a scene node.
 *
 * A mesh no entry claims is painted the reserved background colour rather than
 * left showing its beauty material: a segmentation consumer must never read a
 * lit surface as a class, and an unpainted mesh would be exactly that.
 *
 * Deformation follows the beauty pass. A formation's baked cycle is carried
 * onto every replacement material, so a marching crowd marches in the mask
 * exactly as it marches in the film, and the mask describes the frame that will
 * be delivered rather than a rest pose nobody sees.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Makes this public surface part of the stable identity-mask channel.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Implements that channel as a structural render product.
 * @author Samchon
 */
export const applyAutoMovieSemanticMask = (props: {
  /** The built scene. */
  scene: THREE.Scene;

  /** The design the scene was built from, in its own declaration order. */
  design: IAutoMovieScene;

  /** Palette derived from the same production. */
  mask: IAutoMovieSemanticMask;
}): IAutoMovieSemanticMaskHandle => {
  const { scene, mask } = props;
  const roots = maskRoots(props);
  const bySlot = new Map<string, IAutoMovieSemanticMaskEntry>();
  for (const entry of mask.entries)
    if (entry.slot !== null)
      bySlot.set(`${entry.slot.instanceSet}#${entry.slot.index}`, entry);

  // A segmentation pass states an identity, and three things in a scene will
  // quietly overwrite one. Fog mixes every `MeshBasicMaterial` toward the fog
  // colour with distance, so the same wall far away would read as a different
  // wall near. Image lighting draws its own background over the reserved black.
  // A grid, a helper line, a sprite or a point cloud draws its live beauty
  // material straight into the mask. All three are suspended for the duration
  // and put back exactly as they were, so calling this directly is as correct
  // as calling it from inside a pass boundary that already suspends them.
  const fog = scene.fog;
  scene.fog = null;
  const environment = scene.environment;
  scene.environment = null;
  const hidden: THREE.Object3D[] = [];
  scene.traverse((object) => {
    if (!object.visible) return;
    if (
      (object as THREE.Line).isLine === true ||
      (object as THREE.Points).isPoints === true ||
      (object as THREE.Sprite).isSprite === true
    ) {
      object.visible = false;
      hidden.push(object);
    }
  });
  const background = scene.background;
  scene.background = new THREE.Color(0x000000);
  const swaps: Array<{
    mesh: THREE.Mesh;
    material: THREE.Material | THREE.Material[];
  }> = [];
  const colors: Array<{
    mesh: THREE.InstancedMesh;
    values: Float32Array | null;
  }> = [];
  const created: THREE.Material[] = [];
  // One material per colour per formation cycle: a hundred chunks of one wall
  // compile one program, and a tier that deforms by its own baked table keeps
  // its own.
  const materials = new Map<
    string,
    Map<IAutoMovieFormationCycle | null, THREE.Material>
  >();
  const materialOf = (
    color: string,
    cycle: IAutoMovieFormationCycle | null,
  ): THREE.Material => {
    let byCycle = materials.get(color);
    if (byCycle === undefined) {
      byCycle = new Map();
      materials.set(color, byCycle);
    }
    const cached = byCycle.get(cycle);
    if (cached !== undefined) return cached;
    const material = new THREE.MeshBasicMaterial({ color });
    if (cycle !== null) applyFormationCycleMaterial(material, cycle);
    byCycle.set(cycle, material);
    created.push(material);
    return material;
  };

  let painted = 0;
  let unaddressed = 0;
  scene.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.isMesh !== true) return;
    const entry = nearest(mesh, roots);
    swaps.push({ mesh, material: mesh.material });
    if (entry === undefined) {
      ++unaddressed;
      mesh.material = materialOf(mask.background, formationCycleOf(mesh));
      return;
    }
    ++painted;
    const cycle = formationCycleOf(mesh);
    if (entry.kind !== "instance-set") {
      mesh.material = materialOf(entry.color, cycle);
      return;
    }
    const instanced = mesh as THREE.InstancedMesh;
    if (instanced.isInstancedMesh !== true) {
      mesh.material = materialOf(entry.color, cycle);
      return;
    }
    const slots = instanced.userData.automovieSlots as number[] | undefined;
    if (slots === undefined || slots.length === 0) {
      mesh.material = materialOf(entry.color, cycle);
      return;
    }
    // Three multiplies the base material by `instanceColor`. White is therefore
    // the only base that renders each slot's exact assigned palette value.
    mesh.material = materialOf("#FFFFFF", cycle);
    const previous = instanced.instanceColor;
    colors.push({
      mesh: instanced,
      values:
        previous === null ? null : (previous.array as Float32Array).slice(),
    });
    const set = entry.id.slice(INSTANCE_SET_PREFIX.length);
    const paint = new THREE.Color();
    slots.forEach((slot, index) => {
      const owned = bySlot.get(`${set}#${slot}`);
      paint.set(owned === undefined ? entry.color : owned.color);
      instanced.setColorAt(index, paint);
    });
    instanced.instanceColor!.needsUpdate = true;
  });

  let done = false;
  return {
    painted,
    unaddressed,
    unresolved: unresolvedOf(mask, roots),
    restore: (): void => {
      if (done) return;
      done = true;
      for (const swap of swaps) swap.mesh.material = swap.material;
      for (const entry of colors)
        if (entry.values === null) entry.mesh.instanceColor = null;
        else {
          (entry.mesh.instanceColor!.array as Float32Array).set(entry.values);
          entry.mesh.instanceColor!.needsUpdate = true;
        }
      for (const material of created) material.dispose();
      for (const object of hidden) object.visible = true;
      scene.background = background;
      scene.environment = environment;
      scene.fog = fog;
    },
  };
};

/** Prefix of the viewer group name a compiled instance set is built under. */
const INSTANCE_SET_PREFIX = "instance-set:";
