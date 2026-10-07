import {
  type IMaterialOverlayShading,
  type IMaterialOverlayShape,
  type IMaterialShaderPatch,
  addMaterialShaderPatch,
  materialOverlayFragment,
  materialOverlayVertex,
} from "@automovie/viewer";
import * as THREE from "three";

import { getHumanObservationPassDefinition } from "./getHumanObservationPassDefinition";

/** Viewer shader patches that change lighting or the shading normal, never the base colour. */
const LIGHTING_ONLY_PATCHES: readonly string[] = [
  "automovie-subsurface",
  "automovie-detail-normal",
  "automovie-relief-weights",
];

/** Program-key prefix of the viewer's surface-overlay patch, which edits the base colour. */
const OVERLAY_PATCH_PREFIX = "automovie-overlays-";

/**
 * Create an unlit base-colour projection of one source material.
 *
 * Only the basic, Lambert, Phong, toon and standard families are admitted.
 * The viewer's named shader patches are read from the source's
 * `userData.shaderPatches`: subsurface, detail-normal and relief-weight
 * patches change lighting or the shading normal only and are left out, and
 * the surface-overlay patch, which tints or replaces the base colour, is
 * applied again to the copy with its colour terms alone, so the projection is
 * the authored base colour under its overlays. A shader hook that names no
 * patch, a patch this owner does not know, an overlay patch without its
 * overlay records, a render hook and mapped displacement refuse by name
 * rather than invent a colour or silently change the observed surface. The
 * copy keeps the base colour, colour and alpha maps and wireframe, disables
 * fog and follows the albedo pass's tone-mapping definition. Textures stay
 * source-owned.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Shows a material's authored base colour without lighting for the albedo observation.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Refuses unsupported material families and unknown shader modifications instead of guessing their colour.
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
  const label = source.name || source.type;
  if (source.onBeforeRender !== THREE.Material.prototype.onBeforeRender)
    throw new Error(`Albedo observation refuses custom shader hooks on "${label}".`);
  const patches =
    (source.userData.shaderPatches as IMaterialShaderPatch[] | undefined) ?? [];
  if (
    source.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile &&
    patches.length === 0
  )
    throw new Error(`Albedo observation refuses custom shader hooks on "${label}".`);
  let overlaid = false;
  for (const patch of patches) {
    if (LIGHTING_ONLY_PATCHES.includes(patch.key)) continue;
    if (!patch.key.startsWith(OVERLAY_PATCH_PREFIX))
      throw new Error(
        `Albedo observation refuses shader patch "${patch.key}" on "${label}".`,
      );
    overlaid = true;
  }
  if (
    "displacementMap" in source &&
    source.displacementMap !== null &&
    source.displacementScale !== 0
  )
    throw new Error(
      `Albedo observation refuses mapped displacement on "${label}".`,
    );
  const result = new THREE.MeshBasicMaterial();
  // Borrow the supported base-state copy, not a source override or patched shader.
  // three clones userData through JSON, which would serialize the overlay
  // textures; the copy carries none of the source's patch records.
  const records = source.userData;
  source.userData = {};
  try {
    THREE.Material.prototype.copy.call(result, source);
  } finally {
    source.userData = records;
  }
  result.color.copy(source.color);
  result.map = source.map;
  result.alphaMap = source.alphaMap;
  result.wireframe = source.wireframe;
  result.fog = false;
  result.toneMapped =
    getHumanObservationPassDefinition("albedo").parameters.toneMapped!;
  if (overlaid) {
    const overlays = source.userData.overlays as
      | readonly IMaterialOverlayShading[]
      | undefined;
    if (overlays === undefined || overlays.length === 0) {
      result.dispose();
      throw new Error(
        `Albedo observation refuses an overlay patch without its overlays on "${label}".`,
      );
    }
    applyOverlayColours(result, overlays);
  }
  return result;
}

/** Composite the overlays' colour terms over an unlit copy; roughness and slopes have no unlit meaning. */
function applyOverlayColours(
  material: THREE.MeshBasicMaterial,
  overlays: readonly IMaterialOverlayShading[],
): void {
  const uniforms: Record<string, THREE.IUniform> = {};
  overlays.forEach((overlay, i) => {
    overlay.color.updateMatrix();
    uniforms[`overlayColorMap${i}`] = { value: overlay.color };
    uniforms[`overlayColorTransform${i}`] = {
      value: overlay.color.matrix.clone(),
    };
    uniforms[`overlayStrength${i}`] = { value: overlay.strength };
    uniforms[`overlayColorFactor${i}`] = {
      value: new THREE.Vector3(
        overlay.colorFactor.r,
        overlay.colorFactor.g,
        overlay.colorFactor.b,
      ),
    };
  });
  const shapes: IMaterialOverlayShape[] = overlays.map((overlay) => ({
    blend: overlay.blend,
    roughness: false,
    normal: false,
  }));
  addMaterialShaderPatch(material, {
    key: `automovie-albedo-overlays-${shapes.map((shape) => shape.blend[0]).join(".")}`,
    apply: (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = materialOverlayVertex(shader.vertexShader, shapes);
      shader.fragmentShader = materialOverlayFragment(
        shader.fragmentShader,
        shapes,
      );
    },
  });
}
