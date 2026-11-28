import { AutoMovieRenderImportedModel } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * `AutoMovieRenderImportedModel.mapHumanoidBones` finds the nodes of an imported rig for the slots
 * asked.
 *
 * Scenarios:
 *
 * 1. Names are compared without case, separators and a `mixamorig` prefix:
 *    `mixamorig:Hips` is `hips`, `Left_Upper_Arm` is `leftUpperArm`.
 * 2. Alias names map to their slot: `Pelvis` to `hips`, `LeftForeArm` to
 *    `leftLowerArm`.
 * 3. Only requested slots are returned, and the first node found for a slot
 *    keeps it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The rig scenario identifies the direct names, normalized names, aliases, and candidate order used to select requested bone slots.
 * @evidence contracts/development/testing.md#behavioral-verification Checks that direct names and aliases resolve requested slots and that a second candidate for one slot leaves the first node selected.
 * @evidence contracts/development/testing.md#independent-expectations Compares the exact requested slot list and the selected identities of the original hips, upper arm, and forearm fixtures.
 */
export function test_render_scene_map_imported_humanoid_bones(): void {
  const named = (name: string): THREE.Object3D => {
    const node: THREE.Object3D = new THREE.Object3D();
    node.name = name;
    return node;
  };
  const root: THREE.Group = new THREE.Group();
  const hips: THREE.Object3D = named("mixamorig:Hips");
  const upper: THREE.Object3D = named("Left_Upper_Arm");
  const fore: THREE.Object3D = named("LeftForeArm");
  const twin: THREE.Object3D = named("mixamorigHips");
  const unwanted: THREE.Object3D = named("Head");
  root.add(hips, upper, fore, twin, unwanted);
  const bones = AutoMovieRenderImportedModel.mapHumanoidBones({
    object: root,
    slots: ["hips", "leftUpperArm", "leftLowerArm"],
  });
  TestValidator.equals("slots", [...bones.keys()], ["hips", "leftUpperArm", "leftLowerArm"]);
  TestValidator.predicate("hips is the first node", bones.get("hips") === hips);
  TestValidator.predicate("direct", bones.get("leftUpperArm") === upper);
  TestValidator.predicate("alias", bones.get("leftLowerArm") === fore);

  const pelvis: THREE.Group = new THREE.Group();
  const node: THREE.Object3D = named("Pelvis");
  pelvis.add(node);
  TestValidator.predicate(
    "pelvis alias",
    AutoMovieRenderImportedModel.mapHumanoidBones({
      object: pelvis,
      slots: ["hips"],
    }).get("hips") === node,
  );
}