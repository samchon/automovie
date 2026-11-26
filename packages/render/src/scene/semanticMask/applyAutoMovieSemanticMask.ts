import type {
  IAutoMovieScene,
  IAutoMovieSemanticMask,
  IAutoMovieSemanticMaskEntry,
} from "@automovie/interface";
import * as THREE from "three";

import { AutoMovieThreeKind } from "../AutoMovieThreeKind.js";
import { AutoMovieRenderDualQuaternionSkinning } from "../dualQuaternionSkinning/index.js";
import { type IAutoMovieFormationCycle, AutoMovieRenderFormationCycle } from "../formationCycle/index.js";
import { guardAutoMovieRenderModeRetirement } from "../guardAutoMovieRenderModeRetirement.js";
import { restoreAutoMovieRenderModeOnce } from "../internal/restoreAutoMovieRenderModeOnce.js";
import { restoreAutoMovieRenderModeState } from "../restoreAutoMovieRenderModeState.js";
import type { IAutoMovieSemanticMaskHandle } from "./IAutoMovieSemanticMaskHandle.js";
import { maskRoots } from "./maskRoots.js";
import { nearest } from "./nearest.js";
import { unresolvedOf } from "./unresolvedOf.js";

/**
 * Paint a built scene with its stable semantic palette.
 *
 * An attached palette assigns stable semantic colours instead of a top-level
 * traversal ramp. The nearest claimed root determines each mesh's identity; a
 * correctly rebuilt design can preserve those palette colours despite changed
 * traversal order. This describes material state rather than independently
 * observed pixels.
 *
 * Resolution walks each mesh up to the nearest ancestor the mask names:
 *
 * - Staged nodes match design.nodes by the buildScene top-level construction
 *   order.
 * - Named objects match palette roots, including ground and instance-set groups.
 * - Compiled slots use instanceColor so members keep separate identities without
 *   separate scene nodes.
 *
 * A mesh no entry claims is painted the reserved background colour rather than
 * left showing its beauty material: a segmentation consumer must never read a
 * lit surface as a class, and an unpainted mesh would be exactly that.
 *
 * A formation's supplied baked cycle is carried onto each replacement material
 * through the same hook used by beauty. This preserves the requested
 * deformation route; actual shader compilation, frame correspondence and
 * delivered pixels remain rendering observations.
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
  const { scene, mask }: Parameters<typeof applyAutoMovieSemanticMask>[0] =
    props;
  guardAutoMovieRenderModeRetirement(scene);
  const roots: Map<THREE.Object3D, IAutoMovieSemanticMaskEntry> =
    maskRoots(props);
  const unresolved: string[] = unresolvedOf(mask, roots);
  const bySlot: Map<string, IAutoMovieSemanticMaskEntry> = new Map<
    string,
    IAutoMovieSemanticMaskEntry
  >();
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
  const materials: Map<
    string,
    Map<IAutoMovieFormationCycle | null, THREE.Material>
  > = new Map<string, Map<IAutoMovieFormationCycle | null, THREE.Material>>();
  const materialOf: (
    color: string,
    cycle: IAutoMovieFormationCycle | null,
    dual: boolean,
  ) => THREE.Material = (
    color: string,
    cycle: IAutoMovieFormationCycle | null,
    dual: boolean,
  ): THREE.Material => {
    // a dual-quaternion skin deforms in its own vertex stage, so it keys apart
    const key: string = `${dual}:${color}`;
    let byCycle:
      | Map<IAutoMovieFormationCycle | null, THREE.Material>
      | undefined = materials.get(key);
    if (byCycle === undefined) {
      byCycle = new Map();
      materials.set(key, byCycle);
    }
    const cached: THREE.Material | undefined = byCycle.get(cycle);
    if (cached !== undefined) return cached;
    const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({
      color,
    });
    created.push(material);
    if (cycle !== null) AutoMovieRenderFormationCycle.applyFormationCycleMaterial(material, cycle);
    if (dual) AutoMovieRenderDualQuaternionSkinning.apply(material);
    byCycle.set(cycle, material);
    return material;
  };

  const restoreState: () => void = (): void => {
    restoreAutoMovieRenderModeState([
      ...swaps.map(
        (swap: {
          mesh: THREE.Mesh;
          material: THREE.Material | THREE.Material[];
        }): (() => void) =>
          (): void => {
            swap.mesh.material = swap.material;
          },
      ),
      ...colors.map(
        (entry: {
          mesh: THREE.InstancedMesh;
          values: Float32Array | null;
          attribute: THREE.InstancedBufferAttribute | null;
        }): (() => void) =>
          (): void => {
            entry.mesh.instanceColor = entry.attribute;
            if (entry.values !== null && entry.attribute !== null) {
              entry.attribute.copyArray(entry.values);
              entry.attribute.needsUpdate = true;
            }
          },
      ),
      ...created.map((material: THREE.Material): (() => void) => (): void => {
        material.dispose();
      }),
      ...hidden.map((object: THREE.Object3D): (() => void) => (): void => {
        object.visible = true;
      }),
      (): void => {
        scene.background = background;
      },
      (): void => {
        scene.environment = environment;
      },
      (): void => {
        scene.fog = fog;
      },
    ]);
  };
  const restore: () => void = restoreAutoMovieRenderModeOnce((): void =>
    guardAutoMovieRenderModeRetirement(scene, { run: restoreState }),
  );
  let painted: number = 0;
  let unaddressed: number = 0;
  try {
    scene.fog = null;
    scene.environment = null;
    scene.traverse((object: THREE.Object3D): void => {
      if (!object.visible) return;
      if (
        AutoMovieThreeKind.isLine(object) ||
        AutoMovieThreeKind.isPoints(object) ||
        AutoMovieThreeKind.isSprite(object)
      ) {
        hidden.push(object);
        object.visible = false;
      }
    });
    scene.background = new THREE.Color(0x000000);
    scene.traverse((object: THREE.Object3D): void => {
      if (!AutoMovieThreeKind.isMesh(object)) return;
      const mesh: THREE.Mesh = object;
      const entry: IAutoMovieSemanticMaskEntry | undefined = nearest(
        mesh,
        roots,
      );
      swaps.push({ mesh, material: mesh.material });
      const dual: boolean = AutoMovieRenderDualQuaternionSkinning.of(mesh);
      if (entry === undefined) {
        ++unaddressed;
        mesh.material = materialOf(
          mask.background,
          AutoMovieRenderFormationCycle.formationCycleOf(mesh),
          dual,
        );
        return;
      }
      ++painted;
      const cycle: IAutoMovieFormationCycle | null = AutoMovieRenderFormationCycle.formationCycleOf(mesh);
      if (entry.kind !== "instance-set") {
        mesh.material = materialOf(entry.color, cycle, dual);
        return;
      }
      if (!AutoMovieThreeKind.isInstancedMesh(mesh)) {
        mesh.material = materialOf(entry.color, cycle, dual);
        return;
      }
      const instanced: THREE.InstancedMesh = mesh;
      const slots: number[] | undefined = instanced.userData.automovieSlots;
      if (slots === undefined || slots.length === 0) {
        mesh.material = materialOf(entry.color, cycle, dual);
        return;
      }
      // Three multiplies the base material by instanceColor, so white preserves each slot's assigned color under that composition rule.
      mesh.material = materialOf("#FFFFFF", cycle, dual);
      const previous: THREE.InstancedBufferAttribute | null =
        instanced.instanceColor;
      colors.push({
        mesh: instanced,
        attribute: previous,
        values: previous === null ? null : Float32Array.from(previous.array),
      });
      const set: string = entry.id.slice(INSTANCE_SET_PREFIX.length);
      const paint: THREE.Color = new THREE.Color();
      slots.forEach((slot: number, index: number): void => {
        const owned: IAutoMovieSemanticMaskEntry | undefined = bySlot.get(
          `${set}#${slot}`,
        );
        paint.set(owned === undefined ? entry.color : owned.color);
        instanced.setColorAt(index, paint);
      });
      instanced.instanceColor!.needsUpdate = true;
    });

    return { painted, unaddressed, unresolved, restore };
  } catch (error) {
    guardAutoMovieRenderModeRetirement(scene, {
      run: restoreState,
      primary: { error },
    });
    throw error;
  }
};

/** Prefix of the viewer group name a compiled instance set is built under. */
const INSTANCE_SET_PREFIX: string = "instance-set:";
