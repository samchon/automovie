import type { AutoMovieBuiltinTexturePurpose, IAutoMovieRenderTextureResidency } from "@automovie/engine";
import * as THREE from "three";

import { readAutoMovieTextureSource } from "./readAutoMovieTextureSource.js";

type RuntimeSource = NonNullable<IAutoMovieRenderTextureResidency["runtimeTextures"]>[number];

/**
 * Read actual implicit material and area-light lookup objects for one scope.
 * Shader factories publish the same Texture reference they bind. The area
 * pair follows WebGLLights' real extension choice without initializing tables.
 * Caller-retained rows belong to this same renderer, survive material removal,
 * and are dropped only after actual texture/context release. Current scope use
 * labels are replaced on each observation; obsolete rows remain retained-only.
 * Each row follows an actual Texture wrapper, not mutable UUIDs. Distinct
 * wrappers retain their own current upload keys; the engine shares equivalent
 * Source/key pairs. Reobserving one wrapper replaces its old state, matching
 * native cache-key reference retirement after upload. This is a reachable
 * current-state bound; a host requiring upload-transition peak storage supplies
 * the previous phase separately until that phase's native release is observed.
 * These are reachable-storage bounds, never a claim of current GLuint count.
 * No shader, texture state or GPU lifetime is changed by the observation.
 */
export function readAutoMovieMaterialTextureSources(props: {
  scope: string;
  renderer: { extensions: Pick<THREE.WebGLRenderer["extensions"], "has"> };
  scene: THREE.Scene;
  retained?: readonly RuntimeSource[];
}): RuntimeSource[] {
  const rows = (props.retained ?? []).map((row) => ({ ...row,
    residents: (row.residents ?? []).filter((scope) => scope !== props.scope),
  }));
  const observe = (purpose: AutoMovieBuiltinTexturePurpose, value: unknown): void => {
    if (!isTexture(value)) return;
    const { asset: _asset, ...texture } = readAutoMovieTextureSource(purpose, value);
    const previous = rows.find((row) => row.purpose === purpose &&
      row.texture.textureIdentity === texture.textureIdentity);
    if (previous !== undefined) {
      previous.residents = [...new Set([...previous.residents, props.scope])];
      previous.texture = texture;
    } else {
      let ordinal = rows.filter((row) => row.purpose === purpose).length;
      while (rows.some((row) => row.owner === `builtin:${purpose}:${ordinal}`)) ordinal++;
      rows.push({ owner: `builtin:${purpose}:${ordinal}`, purpose, texture, residents: [props.scope] });
    }
  };
  let area = false;
  let pbr = false;
  props.scene.traverse((object) => {
    if ("isRectAreaLight" in object && object.isRectAreaLight === true) area = true;
    if (!("material" in object)) return;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (!isMaterial(material)) continue;
      if ("isMeshStandardMaterial" in material && material.isMeshStandardMaterial === true) pbr = true;
      observe("subsurface-lut", material.userData.autoMovieSubsurfaceTexture);
      if ("normalMap" in material && material.normalMap === material.userData.autoMovieOverlayFlatNormal)
        observe("overlay-flat-normal", material.userData.autoMovieOverlayFlatNormal);
    }
  });
  if (area && pbr) {
    const float = props.renderer.extensions.has("OES_texture_float_linear");
    observe("area-ltc-1", Reflect.get(THREE.UniformsLib, float ? "LTC_FLOAT_1" : "LTC_HALF_1") as unknown);
    observe("area-ltc-2", Reflect.get(THREE.UniformsLib, float ? "LTC_FLOAT_2" : "LTC_HALF_2") as unknown);
  }
  return rows;
}

/** Native markers keep the actual SDK objects usable across ESM/CJS realms. */
const isTexture = (value: unknown): value is THREE.Texture => typeof value === "object" && value !== null &&
  "isTexture" in value && value.isTexture === true;

/** Material user data and native features belong to the actual material object. */
const isMaterial = (value: unknown): value is THREE.Material => typeof value === "object" && value !== null &&
  "isMaterial" in value && value.isMaterial === true;
