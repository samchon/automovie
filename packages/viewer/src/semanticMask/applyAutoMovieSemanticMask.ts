import type { IAutoMovieScene, IAutoMovieSemanticMask, IAutoMovieSemanticMaskEntry } from "@automovie/interface";
import * as THREE from "three";
import { type IAutoMovieFormationCycle, applyFormationCycleMaterial, formationCycleOf } from "../formationCycle/index.js";
import type { IAutoMovieSemanticMaskHandle } from "./IAutoMovieSemanticMaskHandle.js";
import { maskRoots } from "./maskRoots.js";
import { nearest } from "./nearest.js";
import { unresolvedOf } from "./unresolvedOf.js";
import { restoreAutoMovieRenderModeOnce } from "../restoreAutoMovieRenderModeOnce.js";
import { restoreAutoMovieRenderModeState } from "../restoreAutoMovieRenderModeState.js";
import { guardAutoMovieRenderModeRetirement } from "../guardAutoMovieRenderModeRetirement.js";

/**
 * Paint a built scene with its stable semantic palette.
 *
 * An attached palette assigns stable semantic colours instead of a top-level traversal ramp. The nearest claimed root determines each mesh's identity; a correctly rebuilt design can preserve those palette colours despite changed traversal order. This describes material state rather than independently observed pixels.
 *
 * Resolution walks each mesh up to the nearest ancestor the mask names:
 *
 * - Staged nodes match design.nodes by the buildScene top-level construction order.
 * - Named objects match palette roots, including ground and instance-set groups.
 * - Compiled slots use instanceColor so members keep separate identities without separate scene nodes.
 *
 * A mesh no entry claims is painted the reserved background colour rather than left showing its beauty material: a segmentation consumer must never read a lit surface as a class, and an unpainted mesh would be exactly that.
 *
 * A formation's supplied baked cycle is carried onto each replacement material through the same hook used by beauty. This preserves the requested deformation route; actual shader compilation, frame correspondence and delivered pixels remain rendering observations.
 *
 * @evidence contracts/common.md#principled-implementation Preflights roots/unresolved ids, resolves each mesh to its nearest claimed ancestor and paints canonical entry/per-slot colors while preserving existing formation-cycle deformation and suspending nonmesh/atmosphere fields.
 * @evidence contracts/common.md#clear-and-simple-design Root lookup, nearest ownership and unresolved reporting retain their helpers; call-local color/cycle material reuse and captured originals own one failure-safe reversible installation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No child-index ramp replaces an attached semantic id and unclaimed meshes use reserved background; correct built-node order, admitted palette/slot metadata and supported Three color management are premises. Root/mesh counts are not visibility or actual-pixel proof.
 * @evidence contracts/common.md#meaningful-documentation Documents positional/named resolution, per-slot white-base composition, cycle inheritance, independent rollback, borrowed originals and external null-instanceColor native retirement gap.
 * @evidence contracts/performance.md#efficient-algorithms For N scene nodes, M meshes, E entries, ancestor depth D and I instance-color components, setup is O(N+E+M*D+I) with indexed slot lookup and material identity reuse; full traversal/copies preserve supported hidden geometry and original color restoration.
 * @evidence contracts/performance.md#reuse-equivalent-work One material per color/cycle identity shares compile structure within this pass, and actual maintained instance-set producers already own nonnull color arrays reused in place; a new pass owns a fresh reversible snapshot.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Materials register before later patch/mutation and rollback/restore attempt independent owners once. Failed cleanup retains its captured population/cause under the weak scene key and blocks reacquisition even without a returned handle. Maintained nonnull colors restore in place; external temporary native attribute release remains unproved.
 */
export const applyAutoMovieSemanticMask: (props: {
  /** The built scene. */
  scene: THREE.Scene;

  /** The design the scene was built from, in its own declaration order. */
  design: IAutoMovieScene;

  /** Palette derived from the same production. */
  mask: IAutoMovieSemanticMask;
}) => IAutoMovieSemanticMaskHandle = (props: {
  /** The built scene. */
  scene: THREE.Scene;

  /** The design the scene was built from, in its own declaration order. */
  design: IAutoMovieScene;

  /** Palette derived from the same production. */
  mask: IAutoMovieSemanticMask;
}): IAutoMovieSemanticMaskHandle => {
  const { scene, mask }: Parameters<typeof applyAutoMovieSemanticMask>[0] = props;
  guardAutoMovieRenderModeRetirement(scene);
  const roots: Map<THREE.Object3D, IAutoMovieSemanticMaskEntry> = maskRoots(props);
  const unresolved: string[] = unresolvedOf(mask, roots);
  const bySlot: Map<string, IAutoMovieSemanticMaskEntry> = new Map<string, IAutoMovieSemanticMaskEntry>();
  for (const entry of mask.entries)
    if (entry.slot !== null)
      bySlot.set(`${entry.slot.instanceSet}#${entry.slot.index}`, entry);

  // Fog, image lighting/background and visible nonmesh helpers can overwrite a palette identity. Suspend their borrowed fields during installation and restore their actual original state for both direct and outer-pass callers.
  const fog: THREE.Scene["fog"] = scene.fog;
  const environment: THREE.Scene["environment"] = scene.environment;
  const background: THREE.Scene["background"] = scene.background;
  const hidden: THREE.Object3D[] = [];
  const swaps: Array<{
    mesh: THREE.Mesh;
    material: THREE.Material | THREE.Material[];
  }> = [];
  const colors: Array<{
    mesh: THREE.InstancedMesh;
    values: Float32Array | null;
    attribute: THREE.InstancedBufferAttribute | null;
  }> = [];
  const created: THREE.Material[] = [];
  // One material per colour/cycle identity shares the same configured hook within this installation; native program compilation remains the renderer's responsibility.
  const materials: Map<string, Map<IAutoMovieFormationCycle | null, THREE.Material>> = new Map<
    string,
    Map<IAutoMovieFormationCycle | null, THREE.Material>
  >();
  const materialOf: (color: string, cycle: IAutoMovieFormationCycle | null) => THREE.Material = (
    color: string,
    cycle: IAutoMovieFormationCycle | null,
  ): THREE.Material => {
    let byCycle: Map<IAutoMovieFormationCycle | null, THREE.Material> | undefined = materials.get(color);
    if (byCycle === undefined) {
      byCycle = new Map();
      materials.set(color, byCycle);
    }
    const cached: THREE.Material | undefined = byCycle.get(cycle);
    if (cached !== undefined) return cached;
    const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ color });
    created.push(material);
    if (cycle !== null) applyFormationCycleMaterial(material, cycle);
    byCycle.set(cycle, material);
    return material;
  };

  const restoreState: () => void = (): void => {
    restoreAutoMovieRenderModeState([
      ...swaps.map((swap: {mesh: THREE.Mesh; material: THREE.Material | THREE.Material[]}): (() => void) => (): void => { swap.mesh.material = swap.material; }),
      ...colors.map((entry: {mesh: THREE.InstancedMesh; values: Float32Array | null; attribute: THREE.InstancedBufferAttribute | null}): (() => void) => (): void => {
        entry.mesh.instanceColor = entry.attribute;
        if (entry.values !== null && entry.attribute !== null) {
          (entry.attribute.array as Float32Array).set(entry.values);
          entry.attribute.needsUpdate = true;
        }
      }),
      ...created.map((material: THREE.Material): (() => void) => (): void => { material.dispose(); }),
      ...hidden.map((object: THREE.Object3D): (() => void) => (): void => { object.visible = true; }),
      (): void => { scene.background = background; },
      (): void => { scene.environment = environment; },
      (): void => { scene.fog = fog; },
    ]);
  };
  const restore: () => void = restoreAutoMovieRenderModeOnce((): void => guardAutoMovieRenderModeRetirement(scene, { run: restoreState }));
  let painted: number = 0;
  let unaddressed: number = 0;
  try {
    scene.fog = null;
    scene.environment = null;
    scene.traverse((object: THREE.Object3D): void => {
      if (!object.visible) return;
      if ((object as THREE.Line).isLine === true || (object as THREE.Points).isPoints === true || (object as THREE.Sprite).isSprite === true) {
        hidden.push(object);
        object.visible = false;
      }
    });
    scene.background = new THREE.Color(0x000000);
  scene.traverse((object: THREE.Object3D) : void => {
    const mesh: THREE.Mesh = object as THREE.Mesh;
    if (mesh.isMesh !== true) return;
    const entry: IAutoMovieSemanticMaskEntry | undefined = nearest(mesh, roots);
    swaps.push({ mesh, material: mesh.material });
    if (entry === undefined) {
      ++unaddressed;
      mesh.material = materialOf(mask.background, formationCycleOf(mesh));
      return;
    }
    ++painted;
    const cycle: IAutoMovieFormationCycle | null = formationCycleOf(mesh);
    if (entry.kind !== "instance-set") {
      mesh.material = materialOf(entry.color, cycle);
      return;
    }
    const instanced: THREE.InstancedMesh = mesh as THREE.InstancedMesh;
    if (instanced.isInstancedMesh !== true) {
      mesh.material = materialOf(entry.color, cycle);
      return;
    }
    const slots: number[] | undefined = instanced.userData.automovieSlots as number[] | undefined;
    if (slots === undefined || slots.length === 0) {
      mesh.material = materialOf(entry.color, cycle);
      return;
    }
    // Three multiplies the base material by instanceColor, so white preserves each slot's assigned color under that composition rule.
    mesh.material = materialOf("#FFFFFF", cycle);
    const previous: THREE.InstancedBufferAttribute | null = instanced.instanceColor;
    colors.push({
      mesh: instanced,
      attribute: previous,
      values:
        previous === null ? null : (previous.array as Float32Array).slice(),
    });
    const set: string = entry.id.slice(INSTANCE_SET_PREFIX.length);
    const paint: THREE.Color = new THREE.Color();
    slots.forEach((slot: number, index: number) : void => {
      const owned: IAutoMovieSemanticMaskEntry | undefined = bySlot.get(`${set}#${slot}`);
      paint.set(owned === undefined ? entry.color : owned.color);
      instanced.setColorAt(index, paint);
    });
    instanced.instanceColor!.needsUpdate = true;
  });

  return { painted, unaddressed, unresolved, restore };
  } catch (error) {
    guardAutoMovieRenderModeRetirement(scene, { run: restoreState, primary: { error } });
    throw error;
  }
};

/** Prefix of the viewer group name a compiled instance set is built under. */
const INSTANCE_SET_PREFIX: string = "instance-set:";
