import {
  type IMaterialOverlayShading,
  type IMaterialOverlayShape,
  type IMaterialShaderPatch,
  addMaterialShaderPatch,
  materialOverlayFragment,
  materialOverlayVertex,
} from "../../../index.js";
import * as THREE from "three";

import { restoreAutoMovieRenderModeState } from "../../../restoreAutoMovieRenderModeState.js";
import { getHumanObservationPassDefinition } from "./getHumanObservationPassDefinition.js";

/** Viewer shader patches that change lighting or the shading normal, never the base colour. */
const LIGHTING_ONLY_PATCHES: readonly string[] = [
  "automovie-subsurface",
  "automovie-detail-normal",
  "automovie-relief-weights",
];

/** Program-key prefix of the viewer's surface-overlay patch, which edits the base colour. */
const OVERLAY_PATCH_PREFIX: string = "automovie-overlays-";

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
 * After allocation, any copy or overlay setup refusal retires the owned copy
 * and preserves the original cause alongside an independent cleanup failure.
 * The source's shader records are restored even if base-state copying fails.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Admits supported native material families and known color/lighting patch roles, copies public base state to an unlit material, borrows color/alpha maps and reconstructs supported overlay color terms. The native shader anchors and named patch semantics must remain compatible; unknown hooks or mapped displacement refuse rather than projecting an unsupported surface.
 * @evidence contracts/common.md#clear-and-simple-design One material projection owns base-color interpretation, while createHumanObservationAlbedoPass owns per-mesh assignment and retirement. Color overlays reuse the canonical overlay shader generators with lighting-only terms disabled.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Native prototype.copy is invoked without replacing a foreign method; userData is temporarily withdrawn only to avoid JSON-copying patch texture records and restored on success/failure. Named supported patches encode actual viewer semantics rather than fixture ids; extra untracked shader behavior could violate that admission premise.
 * @evidence contracts/common.md#meaningful-documentation The comment gives supported families, shader/displacement refusals, borrowed texture ownership and failure rollback. Unlit albedo excludes fog/tone mapping and does not judge roughness, specular, emissive or transmission appearance.
 * @evidence contracts/performance.md#efficient-algorithms Scans K shader patches and O overlays, building one basic material and fixed uniforms/source shape per overlay. Native base copy and shader string generation add their actual data/source-length cost; no numerical geometry is rebuilt.
 * @evidence contracts/performance.md#reuse-equivalent-work Source maps remain borrowed and canonical overlay color formulas are reused. Each reversible assignment gets its own material; native program keys can share equivalent shader structure while uniforms preserve each source's actual overlay values.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned material and its uniform closures but borrows source textures. Post-allocation refusal restores source records and independently disposes the candidate with the primary cause; no renderer, worker or scene membership is acquired here.
 */
export function createHumanObservationAlbedoMaterial(
  source: THREE.Material,
): THREE.MeshBasicMaterial {
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
  const label: string = source.name || source.type;
  if (source.onBeforeRender !== THREE.Material.prototype.onBeforeRender)
    throw new Error(
      `Albedo observation refuses custom shader hooks on "${label}".`,
    );
  const patches: IMaterialShaderPatch[] =
    (source.userData.shaderPatches as IMaterialShaderPatch[] | undefined) ?? [];
  if (
    source.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile &&
    patches.length === 0
  )
    throw new Error(
      `Albedo observation refuses custom shader hooks on "${label}".`,
    );
  let overlaid: boolean = false;
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
  const result: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial();
  // Borrow the supported base-state copy, not a source override or patched shader.
  // three clones userData through JSON, which would serialize the overlay
  // textures; the copy carries none of the source's patch records.
  const records: THREE.Material["userData"] = source.userData;
  try {
    source.userData = {};
    THREE.Material.prototype.copy.call(result, source);
    source.userData = records;
    result.color.copy(source.color);
    result.map = source.map;
    result.alphaMap = source.alphaMap;
    result.wireframe = source.wireframe;
    result.fog = false;
    result.toneMapped =
      getHumanObservationPassDefinition("albedo").parameters.toneMapped!;
    if (overlaid) {
      const overlays: readonly IMaterialOverlayShading[] | undefined = source.userData.overlays as
        | readonly IMaterialOverlayShading[]
        | undefined;
      if (overlays === undefined || overlays.length === 0)
        throw new Error(
          `Albedo observation refuses an overlay patch without its overlays on "${label}".`,
        );
      applyOverlayColours(result, overlays);
    }
    return result;
  } catch (error) {
    return restoreAutoMovieRenderModeState([
      (): void => { source.userData = records; },
      (): void => result.dispose(),
    ], { error });
  }
}

/** Composite the overlays' colour terms over an unlit copy; roughness and slopes have no unlit meaning. */
function applyOverlayColours(
  material: THREE.MeshBasicMaterial,
  overlays: readonly IMaterialOverlayShading[],
): void {
  const uniforms: Record<string, THREE.IUniform> = {};
  overlays.forEach((overlay: IMaterialOverlayShading, i: number): void => {
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
  const shapes: IMaterialOverlayShape[] = overlays.map((overlay: IMaterialOverlayShading): { blend: "multiply" | "replace"; roughness: false; normal: false; } => ({
    blend: overlay.blend,
    roughness: false,
    normal: false,
  }));
  addMaterialShaderPatch(material, {
    key: `automovie-albedo-overlays-${shapes.map((shape: IMaterialOverlayShape): string => shape.blend[0]).join(".")}`,
    apply: (shader: THREE.WebGLProgramParametersWithUniforms): void => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = materialOverlayVertex(shader.vertexShader, shapes);
      shader.fragmentShader = materialOverlayFragment(
        shader.fragmentShader,
        shapes,
      );
    },
  });
}
