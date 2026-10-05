import * as THREE from "three";

import { getHumanObservationPassDefinition } from "./getHumanObservationPassDefinition";

/**
 * Create an unlit base-colour projection of one source material without
 * borrowing shader modifications.
 *
 * Only the basic, Lambert, Phong, toon and standard families are admitted;
 * custom shader hooks and mapped displacement refuse by name rather than
 * invent a colour or silently change the observed surface. The copy keeps the
 * base colour, colour and alpha maps and wireframe, disables fog and follows
 * the albedo pass's tone-mapping definition. Textures stay source-owned.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Shows a material's authored base colour without lighting for the albedo observation.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Refuses unsupported material families and shader modifications instead of guessing their colour.
 * @author Samchon
 */
export function createHumanObservationAlbedoMaterial(source: THREE.Material): THREE.MeshBasicMaterial {
  if (
    !(
      source instanceof THREE.MeshBasicMaterial ||
      source instanceof THREE.MeshLambertMaterial ||
      source instanceof THREE.MeshPhongMaterial ||
      source instanceof THREE.MeshToonMaterial ||
      source instanceof THREE.MeshStandardMaterial
    )
  )
    throw new Error(
      `Albedo observation refuses material family "${source.type}".`,
    );
  if (
    source.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile ||
    source.onBeforeRender !== THREE.Material.prototype.onBeforeRender
  )
    throw new Error(
      `Albedo observation refuses custom shader hooks on "${source.name || source.type}".`,
    );
  if (
    "displacementMap" in source &&
    source.displacementMap !== null &&
    source.displacementScale !== 0
  )
    throw new Error(
      `Albedo observation refuses mapped displacement on "${source.name || source.type}".`,
    );
  const result = new THREE.MeshBasicMaterial();
  // Borrow the supported base-state copy, not a source override or patched shader.
  THREE.Material.prototype.copy.call(result, source);
  result.color.copy(source.color);
  result.map = source.map;
  result.alphaMap = source.alphaMap;
  result.wireframe = source.wireframe;
  result.fog = false;
  result.toneMapped =
    getHumanObservationPassDefinition("albedo").parameters.toneMapped!;
  return result;
}
