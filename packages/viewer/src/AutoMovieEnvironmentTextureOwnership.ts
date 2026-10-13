import * as THREE from "three";
import { AutoMovieTextureCacheAllocationAuthority } from "./AutoMovieTextureCacheAllocationAuthority.js";

type State = {
  scene: THREE.Scene;
  capacity: unknown[];
  inputs: unknown[];
  known: boolean;
  invalid: boolean;
};

/**
 * Own the exclusive scene handoff and immutable allocation inputs of an image.
 * Public disposal ends any earlier native cube/PMREM conversion before a new
 * tuple is certified. Unchanged application retains those caches. This stores
 * factual owned inputs, never SDK cache keys, GPU handles or byte estimates.
 * A failed retirement stays unknown. An in-place capacity mutation invalidates
 * its decoded Source until the owner supplies a new Texture and Source.
 * For cache-issued clones, the allocation owner acknowledges only a successful
 * same-capacity retirement completion. Source detachment and unrelated original
 * or issued-wrapper uncertainty remain outside that recovery receipt.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Keeps cached environment allocation authority tied to its actual owned creation and retirement inputs.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Rejects shared or changed immutable input ownership before stale native conversions can certify a smaller bound.
 */
export class AutoMovieEnvironmentTextureOwnership {
  private static readonly states = new WeakMap<THREE.Texture, State>();
  private static readonly materials = new WeakSet<THREE.Texture>();
  private static readonly invalidSources = new WeakSet<object>();

  /** A material binding cannot take the same wrapper claimed by a scene. */
  public static material(texture: THREE.Texture): void {
    if (this.states.has(texture))
      throw new Error("An environment texture belongs exclusively to its scene; resolve a separate material clone.");
    this.materials.add(texture);
  }

  /** Claim or refresh a dedicated environment wrapper before scene mutation. */
  public static prepare(scene: THREE.Scene, texture: THREE.Texture, colorSpace: THREE.ColorSpace): void {
    let state = this.states.get(texture);
    if (state !== undefined && state.scene !== scene)
      throw new Error("An environment texture is already owned by another scene; resolve a separate clone.");
    if (this.materials.has(texture) || sharedAreaTexture(texture) || usesTexture(scene, texture))
      throw new Error("A material already uses this environment texture; resolve a dedicated scene clone.");
    if (this.invalidSources.has(texture.source))
      throw new Error("Changed environment allocation requires a new Texture and decoded Source.");
    const capacity = allocationCapacity(texture);
    if (state !== undefined && (state.invalid || !same(state.capacity, capacity))) {
      state.known = false;
      state.invalid = true;
      if (state.capacity[0] === texture.source) this.invalidSources.add(texture.source);
      throw new Error("Environment dimensions, format or type cannot change in place; dispose and replace its Texture and Source.");
    }
    // The tuple contains the configured mapping/decoding; unchanged capacity
    // also preserves the component type that chooses that decoding.
    if (state !== undefined && state.known && same(state.inputs, allocationInputs(texture)) &&
        AutoMovieTextureCacheAllocationAuthority.environmentStable(texture))
      return;
    if (state === undefined) {
      state = { scene, capacity, inputs: [], known: false, invalid: false };
      this.states.set(texture, state);
      const owned = state;
      texture.addEventListener("dispose", () => { owned.known = false; });
    }
    state.known = false;
    const allocation = AutoMovieTextureCacheAllocationAuthority.beginEnvironment(texture);
    texture.dispose();
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = colorSpace;
    texture.needsUpdate = true;
    state.inputs = allocationInputs(texture);
    state.known = AutoMovieTextureCacheAllocationAuthority.finishEnvironment(allocation);
  }

  /** Read authority without changing metadata, texture state or GPU lifetime. */
  public static current(texture: THREE.Texture): boolean {
    if (this.invalidSources.has(texture.source)) return false;
    const state = this.states.get(texture);
    if (state === undefined)
      return texture.mapping !== THREE.EquirectangularReflectionMapping &&
        texture.mapping !== THREE.EquirectangularRefractionMapping;
    return state.known && same(state.capacity, allocationCapacity(texture)) &&
      same(state.inputs, allocationInputs(texture)) && !usesTexture(state.scene, texture);
  }
}

/** Native capacity survives ordinary content and sampling changes. */
const allocationCapacity = (texture: THREE.Texture): unknown[] => {
  const image: unknown = texture.image;
  const object = typeof image === "object" && image !== null ? image : undefined;
  return [texture.source, object !== undefined && "width" in object ? object.width : undefined,
    object !== undefined && "height" in object ? object.height : undefined,
    texture.type, texture.format, texture.internalFormat];
};

/** Inputs that a cached conversion otherwise never revisits. */
const allocationInputs = (texture: THREE.Texture): unknown[] => {
  const image: unknown = texture.image;
  const data = typeof image === "object" && image !== null && "data" in image ? image.data : undefined;
  const mipmaps: unknown = texture.mipmaps;
  return [image, data, texture.version, texture.generateMipmaps,
    mipmaps, Array.isArray(mipmaps) ? mipmaps.length : undefined, texture.mapping, texture.colorSpace,
    texture.minFilter, texture.magFilter, texture.wrapS, texture.wrapT,
    texture.flipY, texture.premultiplyAlpha, texture.unpackAlignment, texture.anisotropy];
};

/** Each caller compares the same fixed tuple schema after known initialization. */
const same = (left: readonly unknown[], right: readonly unknown[]): boolean =>
  left.every((value, index) => Object.is(value, right[index]));

/** RectAreaLightUniformsLib publishes these actual objects for WebGLLights. */
const sharedAreaTexture = (texture: THREE.Texture): boolean =>
  ["LTC_FLOAT_1", "LTC_FLOAT_2", "LTC_HALF_1", "LTC_HALF_2"].some((key) => {
    const value: unknown = Reflect.get(THREE.UniformsLib, key);
    return value === texture;
  });

/** Actual ordinary slots, uniforms and published overlay/SSS resources. */
const usesTexture = (scene: THREE.Scene, texture: THREE.Texture): boolean => {
  let found = false;
  const inspect = (value: unknown, seen: Set<object>): boolean => {
    if (value === texture) return true;
    if (typeof value !== "object" || value === null || seen.has(value)) return false;
    if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)
      return false;
    seen.add(value);
    return Object.values(value).some((entry) => inspect(entry, seen));
  };
  scene.traverse((object) => {
    if (!("material" in object)) return;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      if (typeof material !== "object" || material === null) continue;
      if (Object.values(material).some((value) => inspect(value, new Set()))) found = true;
    }
  });
  return found;
};
