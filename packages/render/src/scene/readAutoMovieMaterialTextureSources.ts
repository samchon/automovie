import type {
  AutoMovieBuiltinTexturePurpose,
  IAutoMovieRenderTextureResidency,
} from "@automovie/interface";
import * as THREE from "three";

import { AutoMovieThreeKind } from "./AutoMovieThreeKind.js";
import { readAutoMovieTextureSource } from "./readAutoMovieTextureSource.js";

type RuntimeSource = NonNullable<
  IAutoMovieRenderTextureResidency["runtimeTextures"]
>[number];
/**
 * Returned rows always carry the current live-scope list, including an empty
 * list.
 */
type ObservedRuntimeSource = RuntimeSource & { residents: string[] };

/**
 * Read actual implicit material and area-light lookup objects for one scope.
 * Shader factories publish the same Texture reference they bind. The area pair
 * follows WebGLLights' real extension choice without initializing tables.
 * Caller-retained rows belong to this same renderer, survive material removal,
 * and are dropped only after actual texture/context release. Current scope use
 * labels are replaced on each observation; obsolete rows remain retained-only.
 * Each row follows an actual Texture wrapper, not mutable UUIDs. Distinct
 * wrappers retain their own current upload keys; the engine shares equivalent
 * Source/key pairs. Reobserving one wrapper replaces its old state, matching
 * native cache-key reference retirement after upload. This is a reachable
 * current-state bound; a host requiring upload-transition peak storage supplies
 * the previous phase separately until that phase's native release is observed.
 * These are reachable-storage bounds, never a claim of current GLuint count. No
 * shader, texture state or GPU lifetime is changed by the observation.
 */
export function readAutoMovieMaterialTextureSources(props: {
  scope: string;
  renderer: { extensions: Pick<THREE.WebGLRenderer["extensions"], "has"> };
  scene: THREE.Scene;
  retained?: readonly NonNullable<
    IAutoMovieRenderTextureResidency["runtimeTextures"]
  >[number][];
}): NonNullable<IAutoMovieRenderTextureResidency["runtimeTextures"]>[number][] {
  const rows: ObservedRuntimeSource[] = (props.retained ?? []).map(
    (row: RuntimeSource): ObservedRuntimeSource => ({
      ...row,
      residents: (row.residents ?? []).filter(
        (scope: string): boolean => scope !== props.scope,
      ),
    }),
  );
  const byTexture: Map<string, ObservedRuntimeSource> = new Map();
  const owners: Set<string> = new Set();
  const counts: Map<AutoMovieBuiltinTexturePurpose | undefined, number> =
    new Map();
  const key: (
    purpose: AutoMovieBuiltinTexturePurpose | undefined,
    identity: string | undefined,
  ) => string = (
    purpose: AutoMovieBuiltinTexturePurpose | undefined,
    identity: string | undefined,
  ): string => JSON.stringify([purpose, identity]);
  for (const row of rows) {
    const identity: string = key(row.purpose, row.texture.textureIdentity);
    if (!byTexture.has(identity)) byTexture.set(identity, row);
    owners.add(row.owner);
    counts.set(row.purpose, (counts.get(row.purpose) ?? 0) + 1);
  }
  const observe: (
    purpose: AutoMovieBuiltinTexturePurpose,
    value: THREE.Texture | null | undefined,
  ) => void = (
    purpose: AutoMovieBuiltinTexturePurpose,
    value: THREE.Texture | null | undefined,
  ): void => {
    if (value === null || value === undefined) return;
    const {
      asset: _asset,
      ...texture
    }: ReturnType<typeof readAutoMovieTextureSource> =
      readAutoMovieTextureSource(purpose, value);
    const identity: string = key(purpose, texture.textureIdentity);
    const previous: ObservedRuntimeSource | undefined = byTexture.get(identity);
    if (previous !== undefined) {
      previous.residents = [...new Set([...previous.residents, props.scope])];
      previous.texture = texture;
    } else {
      let ordinal: number = counts.get(purpose) ?? 0;
      while (owners.has(`builtin:${purpose}:${ordinal}`)) ordinal++;
      const row: ObservedRuntimeSource = {
        owner: `builtin:${purpose}:${ordinal}`,
        purpose,
        texture,
        residents: [props.scope],
      };
      rows.push(row);
      byTexture.set(identity, row);
      owners.add(row.owner);
      counts.set(purpose, (counts.get(purpose) ?? 0) + 1);
    }
  };
  let area: boolean = false;
  let pbr: boolean = false;
  props.scene.traverse((object: THREE.Object3D): void => {
    if (AutoMovieThreeKind.isRectAreaLight(object)) area = true;
    if (!AutoMovieThreeKind.isDrawn(object)) return;
    for (const material of [object.material].flat()) {
      if (AutoMovieThreeKind.isMeshStandardMaterial(material)) pbr = true;
      observe("subsurface-lut", material.userData.autoMovieSubsurfaceTexture);
      if (
        (AutoMovieThreeKind.isMeshStandardMaterial(material) ||
          AutoMovieThreeKind.isMeshPhongMaterial(material) ||
          AutoMovieThreeKind.isMeshLambertMaterial(material) ||
          AutoMovieThreeKind.isMeshToonMaterial(material)) &&
        material.normalMap === material.userData.autoMovieOverlayFlatNormal
      )
        observe(
          "overlay-flat-normal",
          material.userData.autoMovieOverlayFlatNormal,
        );
    }
  });
  if (area && pbr) {
    const float: boolean = props.renderer.extensions.has(
      "OES_texture_float_linear",
    );
    observe(
      "area-ltc-1",
      Reflect.get(THREE.UniformsLib, float ? "LTC_FLOAT_1" : "LTC_HALF_1"),
    );
    observe(
      "area-ltc-2",
      Reflect.get(THREE.UniformsLib, float ? "LTC_FLOAT_2" : "LTC_HALF_2"),
    );
  }
  return rows;
}
