import type {
  AutoMovieBuiltinTexturePurpose,
  IAutoMovieRenderTextureResidency,
} from "@automovie/engine";
import * as THREE from "three";

import { readAutoMovieTextureSource } from "./readAutoMovieTextureSource.js";

type RuntimeSource = NonNullable<
  IAutoMovieRenderTextureResidency["runtimeTextures"]
>[number];
/** Returned rows always carry the current live-scope list, including an empty list. */
type ObservedRuntimeSource = RuntimeSource & { residents: string[] };

/**
 * Read actual implicit material and area-light lookup objects for one scope. Shader factories publish the same Texture reference they bind. The area pair follows WebGLLights' real extension choice without initializing tables. Caller-retained rows belong to this same renderer, survive material removal, and are dropped only after actual texture/context release. Current scope use labels are replaced on each observation; obsolete rows remain retained-only. Each row follows an actual Texture wrapper, not mutable UUIDs. Distinct wrappers retain their own current upload keys; the engine shares equivalent Source/key pairs. Reobserving one wrapper replaces its old state, matching native cache-key reference retirement after upload. This is a reachable current-state bound; a host requiring upload-transition peak storage supplies the previous phase separately until that phase's native release is observed. These are reachable-storage bounds, never a claim of current GLuint count. No shader, texture state or GPU lifetime is changed by the observation.
 *
 * @evidence contracts/common.md#principled-implementation Observes actual material-published lookup textures and native area-light extension selection, updates current scope use and replaces each actual wrapper current upload metadata while retaining prior context-owned rows.
 * @evidence contracts/common.md#clear-and-simple-design Call-local first-row identity and owner/count indexes separate efficient row matching from actual shader producers and Engine allocation-equivalence grouping.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Wrapper identity rather than mutable UUID names governs updates; first duplicate row and generated owner order are preserved, removed use retains potential context facts and reobservation does not independently prove native upload transition retirement.
 * @evidence contracts/common.md#meaningful-documentation Documents reachable storage versus GLuint/history proof, current live labels, retained-only rows and no texture/program mutation by this observer.
 * @evidence contracts/performance.md#efficient-algorithms R retained rows are indexed once and N scene nodes/material roles scanned; expected indexed row matching avoids repeated whole-row scans, with scope-list copies/deduplication and metadata string generation costing their actual lengths.
 * @evidence contracts/performance.md#reuse-equivalent-work Equal actual purpose/wrapper tokens replace the same first retained row while separate wrappers stay distinct; Engine decides Source/upload-equivalent allocation sharing, and no lookup table is initialized merely to observe it.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Indexes are call-local and returned rows borrow live Texture identity facts through scalar tokens; caller explicitly prunes after actual texture/context release, and there is no independent row-count cap in this observer.
 */
export function readAutoMovieMaterialTextureSources(props: {
  scope: string;
  renderer: { extensions: Pick<THREE.WebGLRenderer["extensions"], "has"> };
  scene: THREE.Scene;
  retained?: readonly RuntimeSource[];
}): RuntimeSource[] {
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
    value: unknown,
  ) => void = (
    purpose: AutoMovieBuiltinTexturePurpose,
    value: unknown,
  ): void => {
    if (!isTexture(value)) return;
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
    if ("isRectAreaLight" in object && object.isRectAreaLight === true)
      area = true;
    if (!("material" in object)) return;
    for (const material of Array.isArray(object.material)
      ? object.material
      : [object.material]) {
      if (!isMaterial(material)) continue;
      if (
        "isMeshStandardMaterial" in material &&
        material.isMeshStandardMaterial === true
      )
        pbr = true;
      observe("subsurface-lut", material.userData.autoMovieSubsurfaceTexture);
      if (
        "normalMap" in material &&
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
      Reflect.get(
        THREE.UniformsLib,
        float ? "LTC_FLOAT_1" : "LTC_HALF_1",
      ) as unknown,
    );
    observe(
      "area-ltc-2",
      Reflect.get(
        THREE.UniformsLib,
        float ? "LTC_FLOAT_2" : "LTC_HALF_2",
      ) as unknown,
    );
  }
  return rows;
}

/** Native markers keep the actual SDK objects usable across ESM/CJS realms. */
const isTexture: (value: unknown) => value is THREE.Texture = (
  value: unknown,
): value is THREE.Texture =>
  typeof value === "object" &&
  value !== null &&
  "isTexture" in value &&
  value.isTexture === true;

/** Material user data and native features belong to the actual material object. */
const isMaterial: (value: unknown) => value is THREE.Material = (
  value: unknown,
): value is THREE.Material =>
  typeof value === "object" &&
  value !== null &&
  "isMaterial" in value &&
  value.isMaterial === true;
