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
 * Own the exclusive scene handoff and immutable allocation inputs of an image. Public disposal requests withdrawal of earlier native cube/PMREM conversions before a new tuple is certified; failed retirement stays unknown and unchanged application retains those caches. This stores factual owned inputs, never SDK cache keys, GPU handles or byte estimates. Capacity drift detected by prepare invalidates that wrapper and, when its Source is unchanged, marks the Source invalid. The read-only current query does not record drift, and changes fully restored between prepare calls are not independently detected here.
 *
 * For cache-issued clones, the allocation owner acknowledges only a successful same-capacity retirement completion. Source detachment and unrelated original or issued-wrapper uncertainty remain outside that recovery receipt.
 *
 * @evidence contracts/common.md#principled-implementation Texture identity establishes exclusive scene ownership, while observed capacity and conversion-input tuples distinguish reuse from replacement; failed disposal leaves authority unknown and prepare-observed capacity drift marks wrapper/Source validity as described above, without intercepting every external property write.
 * @evidence contracts/common.md#clear-and-simple-design Scene ownership stays separate from cache allocation authority because a scene owns conversion retirement while a cache owns original and issued wrappers; receipts acknowledge only that wrapper's supported transition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Shared LTC textures are refused because RectAreaLightUniformsLib owns them; material aliases are detected through real scene slots, uniforms and plain nested records without replacing SDK methods or inspecting native handles.
 * @evidence contracts/common.md#meaningful-documentation Describes exclusive wrapper handoff, immutable capacity, failure uncertainty and the limited same-capacity acknowledgement available to cache-issued clones; public methods state their read or mutation effects.
 * @evidence contracts/performance.md#efficient-algorithms Material registration is constant time; prepare and current scan scene materials and reachable plain uniform records to detect aliases, with a per-value seen set preventing recursive cycles. Input tuples have fixed size.
 * @evidence contracts/performance.md#reuse-equivalent-work A known unchanged conversion tuple reuses the existing scene conversion only while cache allocation authority also remains stable; identity, upload version and sampling changes force retirement before refresh.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Weak texture and Source keys release ownership records when caller references disappear; the texture-owned disposal listener invalidates conversion authority without retaining a global strong texture population, and conversion disposal belongs to prepare.
 */
export class AutoMovieEnvironmentTextureOwnership {
  private static readonly states: WeakMap<THREE.Texture, State> = new WeakMap<
    THREE.Texture,
    State
  >();
  private static readonly materials: WeakSet<THREE.Texture> =
    new WeakSet<THREE.Texture>();
  private static readonly invalidSources: WeakSet<object> =
    new WeakSet<object>();

  /**
   * A material binding cannot take the same wrapper claimed by a scene.
   *
   * @evidence contracts/common.md#principled-implementation Refuses a previously scene-claimed texture wrapper before registering it as material-owned, preserving exclusive mutation of conversion inputs.
   * @evidence contracts/common.md#clear-and-simple-design Registration records ownership only; material sampling and scene conversion remain with their respective callers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Wrapper identity decides the refusal, without relying on labels, UUIDs or consumer-specific exemptions.
   * @evidence contracts/common.md#meaningful-documentation States the scene-versus-material alias conflict that causes this registration to throw.
   * @evidenceExclude contracts/performance.md#efficient-algorithms One WeakMap membership check and WeakSet insertion require no traversal strategy.
   * @evidence contracts/performance.md#reuse-equivalent-work Repeated material registration of the same wrapper shares its WeakSet membership without allocating duplicate records.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The weak material registry does not keep wrappers alive after their actual material or cache owners release them.
   */
  public static material(texture: THREE.Texture): void {
    if (this.states.has(texture))
      throw new Error(
        "An environment texture belongs exclusively to its scene; resolve a separate material clone.",
      );
    this.materials.add(texture);
  }

  /**
   * Claim or refresh a dedicated environment wrapper before scene mutation.
   *
   * @evidence contracts/common.md#principled-implementation Checks scene/material aliasing and immutable capacity before retiring cached conversions; only successful same-capacity allocation acknowledgement publishes a known configured tuple, and failure leaves authority unknown.
   * @evidence contracts/common.md#clear-and-simple-design Owns conversion lifecycle before applySceneEnvironment changes scene fields, delegating issued-wrapper history to allocation receipts instead of duplicating cache ownership.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses shared LTC tables and current material references because their owners need independent wrappers; changed capacity is rejected rather than laundered through repeated disposal.
   * @evidence contracts/common.md#meaningful-documentation Describes the pre-scene-mutation claim; class documentation details immutable capacity, dedicated ownership and failed retirement effects.
   * @evidence contracts/performance.md#efficient-algorithms Scans scene materials and nested plain uniform records for actual aliases, then compares fixed-size capacity and conversion tuples; recursive seen sets terminate cyclic records.
   * @evidence contracts/performance.md#reuse-equivalent-work Returns without disposal when installed capacity/inputs match and allocation authority confirms stability; the new colorSpace argument is not separately compared on that path. applySceneEnvironment derives it from the unchanged component type, while a direct caller requesting another decoding must not assume that argument alone refreshes the wrapper.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Installs one texture-owned invalidation listener on first claim, uses weak registry keys and disposes previous cube/PMREM storage before changing mapping or decoding.
   */
  public static prepare(
    scene: THREE.Scene,
    texture: THREE.Texture,
    colorSpace: THREE.ColorSpace,
  ): void {
    let state: State | undefined = this.states.get(texture);
    if (state !== undefined && state.scene !== scene)
      throw new Error(
        "An environment texture is already owned by another scene; resolve a separate clone.",
      );
    if (
      this.materials.has(texture) ||
      sharedAreaTexture(texture) ||
      usesTexture(scene, texture)
    )
      throw new Error(
        "A material already uses this environment texture; resolve a dedicated scene clone.",
      );
    if (this.invalidSources.has(texture.source))
      throw new Error(
        "Changed environment allocation requires a new Texture and decoded Source.",
      );
    const capacity: unknown[] = allocationCapacity(texture);
    if (
      state !== undefined &&
      (state.invalid || !same(state.capacity, capacity))
    ) {
      state.known = false;
      state.invalid = true;
      if (state.capacity[0] === texture.source)
        this.invalidSources.add(texture.source);
      throw new Error(
        "Environment dimensions, format or type cannot change in place; dispose and replace its Texture and Source.",
      );
    }
    // The tuple contains the configured mapping/decoding; unchanged capacity
    // also preserves the component type that chooses that decoding.
    if (
      state !== undefined &&
      state.known &&
      same(state.inputs, allocationInputs(texture)) &&
      AutoMovieTextureCacheAllocationAuthority.environmentStable(texture)
    )
      return;
    if (state === undefined) {
      state = { scene, capacity, inputs: [], known: false, invalid: false };
      this.states.set(texture, state);
      const owned: State = state;
      texture.addEventListener("dispose", (): void => {
        owned.known = false;
      });
    }
    state.known = false;
    const allocation: ReturnType<
      typeof AutoMovieTextureCacheAllocationAuthority.beginEnvironment
    > = AutoMovieTextureCacheAllocationAuthority.beginEnvironment(texture);
    texture.dispose();
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = colorSpace;
    texture.needsUpdate = true;
    state.inputs = allocationInputs(texture);
    state.known =
      AutoMovieTextureCacheAllocationAuthority.finishEnvironment(allocation);
  }

  /**
   * Read authority without changing metadata, texture state or GPU lifetime.
   *
   * @evidence contracts/common.md#principled-implementation Owned authority requires a known matching capacity and conversion tuple with no material alias; unowned equirectangular mappings remain unknown because no scene owner certified their conversion history.
   * @evidence contracts/common.md#clear-and-simple-design A boolean observation lets readAutoMovieTextureSource combine environment and cache authority without exposing mutable ownership records.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Sources marked invalid by prepare stay unknown after property restoration; this query only reads current tuples and does not itself remember a mismatch or prove that no intermediate external mutation occurred.
   * @evidence contracts/common.md#meaningful-documentation Explicitly promises an observation without metadata writes, texture mutation or GPU lifetime changes.
   * @evidence contracts/performance.md#efficient-algorithms Unowned textures need fixed membership/mapping checks; owned textures compare constant-size tuples and scan current scene materials only after those checks succeed.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Scene material graphs can change between observations, so alias detection reads current state instead of caching a boolean.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Authority observation acquires no resources and retains no additional texture, scene or tuple after return.
   */
  public static current(texture: THREE.Texture): boolean {
    if (this.invalidSources.has(texture.source)) return false;
    const state: State | undefined = this.states.get(texture);
    if (state === undefined)
      return (
        texture.mapping !== THREE.EquirectangularReflectionMapping &&
        texture.mapping !== THREE.EquirectangularRefractionMapping
      );
    return (
      state.known &&
      same(state.capacity, allocationCapacity(texture)) &&
      same(state.inputs, allocationInputs(texture)) &&
      !usesTexture(state.scene, texture)
    );
  }
}

/** Native capacity survives ordinary content and sampling changes. */
const allocationCapacity: (texture: THREE.Texture) => unknown[] = (
  texture: THREE.Texture,
): unknown[] => {
  const image: unknown = texture.image;
  const object: object | undefined =
    typeof image === "object" && image !== null ? image : undefined;
  return [
    texture.source,
    object !== undefined && "width" in object ? object.width : undefined,
    object !== undefined && "height" in object ? object.height : undefined,
    texture.type,
    texture.format,
    texture.internalFormat,
  ];
};

/** Inputs that a cached conversion otherwise never revisits. */
const allocationInputs: (texture: THREE.Texture) => unknown[] = (
  texture: THREE.Texture,
): unknown[] => {
  const image: unknown = texture.image;
  const data: unknown =
    typeof image === "object" && image !== null && "data" in image
      ? image.data
      : undefined;
  const mipmaps: unknown = texture.mipmaps;
  return [
    image,
    data,
    texture.version,
    texture.generateMipmaps,
    mipmaps,
    Array.isArray(mipmaps) ? mipmaps.length : undefined,
    texture.mapping,
    texture.colorSpace,
    texture.minFilter,
    texture.magFilter,
    texture.wrapS,
    texture.wrapT,
    texture.flipY,
    texture.premultiplyAlpha,
    texture.unpackAlignment,
    texture.anisotropy,
  ];
};

/** Each caller compares the same fixed tuple schema after known initialization. */
const same: (left: readonly unknown[], right: readonly unknown[]) => boolean = (
  left: readonly unknown[],
  right: readonly unknown[],
): boolean =>
  left.every((value: unknown, index: number): boolean =>
    Object.is(value, right[index]),
  );

/** RectAreaLightUniformsLib publishes these actual objects for WebGLLights. */
const sharedAreaTexture: (texture: THREE.Texture) => boolean = (
  texture: THREE.Texture,
): boolean =>
  ["LTC_FLOAT_1", "LTC_FLOAT_2", "LTC_HALF_1", "LTC_HALF_2"].some(
    (key: string): boolean => {
      const value: unknown = Reflect.get(THREE.UniformsLib, key);
      return value === texture;
    },
  );

/** Actual ordinary slots, uniforms and published overlay/SSS resources. */
const usesTexture: (scene: THREE.Scene, texture: THREE.Texture) => boolean = (
  scene: THREE.Scene,
  texture: THREE.Texture,
): boolean => {
  let found: boolean = false;
  const inspect: (value: unknown, seen: Set<object>) => boolean = (
    value: unknown,
    seen: Set<object>,
  ): boolean => {
    if (value === texture) return true;
    if (typeof value !== "object" || value === null || seen.has(value))
      return false;
    if (
      !Array.isArray(value) &&
      Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null
    )
      return false;
    seen.add(value);
    return Object.values(value).some((entry: unknown): boolean =>
      inspect(entry, seen),
    );
  };
  scene.traverse((object: THREE.Object3D): void => {
    if (!("material" in object)) return;
    for (const material of Array.isArray(object.material)
      ? object.material
      : [object.material]) {
      if (typeof material !== "object" || material === null) continue;
      if (
        Object.values(material).some((value: unknown): boolean =>
          inspect(value, new Set<object>()),
        )
      )
        found = true;
    }
  });
  return found;
};
