import { AutoMovieTextureBinding } from "@automovie/interface";
import * as THREE from "three";

import { IAutoMovieTextureLoader } from "./IAutoMovieTextureLoader.js";
import { textureBindingAsset } from "./textureBindingAsset.js";
import { readAutoMovieTextureSource } from "./readAutoMovieTextureSource.js";
import { AutoMovieTextureCacheAllocationAuthority } from "./AutoMovieTextureCacheAllocationAuthority.js";

/**
 * One shot's decoded texture assets: loaded once, handed out per binding, and
 * released once.
 *
 * Two facts pull in opposite directions and this class is where they meet.
 * {@link buildMaterial} writes a binding's color space, UV transform and sampler
 * ONTO the texture object it is given, so two slots that name the same image
 * must not receive the same object: a floor repeating its tile 40 times and a
 * table top repeating the same tile twice would otherwise fight over one
 * `repeat`, last writer winning. Decoding that image once instead lets every
 * binding reuse its loaded pixel source without repeating the host's load and
 * decode work for each model.
 *
 * So the asset is decoded once and each binding gets `clone()` of it. A
 * `three.js` clone shares its source's `Source` object while keeping binding
 * state private. Within one WebGL renderer, that source can share a GPU texture
 * when the renderer's texture-state keys match. UV repeat and offset alone do
 * not change that key; different sampler, format, flip or color-space state can
 * allocate and upload separate textures for the same pixels. GPU resources
 * also belong to their renderer, so sharing a decoded source does not promise
 * one upload across bindings, updates or renderers.
 *
 * The cache is per shot rather than per model because a shot is the lifetime a
 * host can actually end: {@link dispose} attempts every distinct Texture it
 * owns once and preserves failed retirement, however many times it is called. A
 * cache that has been disposed refuses further work rather than quietly
 * decoding into a bucket nobody will empty.
 * The first issuance fixes the original's inputs before native copy starts and
 * verifies its successful or failed completion. Later original
 * or uncontrolled issued-wrapper changes make its facts uncertified, even after
 * properties are restored. Normal material and exclusive environment owners
 * acknowledge their own supported transitions. A different live cache cannot
 * acquire this cache's original or issued wrapper; distinct wrappers may still
 * share decoded pixels. A detached Source can leave an earlier native upload
 * alive after public disposal and therefore makes completion indeterminate.
 * An issued binding wrapper cannot return through the loader as a decoder
 * original, including an alias inside this same cache.
 *
 * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-material-resolution Resolves this public surface into the declared render material.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Implements the material and color binding at the render boundary.
 */
export class AutoMovieTextureCache {
  private readonly pending = new Map<string, Promise<THREE.Texture>>();
  private readonly sources = new Map<string, THREE.Texture>();
  private readonly issued: THREE.Texture[] = [];
  /** Actual failed or indeterminate wrappers retained after public bookkeeping closes. */
  private readonly uncertainRetirements = new Set<THREE.Texture>();
  private readonly allocationOwner = {};
  private disposed = false;
  /** One completion outcome, including a failure, shared by every close caller. */
  private disposal: Promise<void> | undefined;

  /** Build a cache over one host-owned loader. */
  public constructor(private readonly load: IAutoMovieTextureLoader) {
    this.resolve = (binding) => {
      this.assertLive();
      const asset = textureBindingAsset(binding);
      const source = this.sources.get(asset);
      if (source === undefined)
        throw new Error(
          `Texture asset "${asset}" was never primed into this shot cache.`,
        );
      const allocation = AutoMovieTextureCacheAllocationAuthority.beginIssue(source);
      let clone: THREE.Texture;
      try { clone = source.clone(); }
      catch (error) {
        AutoMovieTextureCacheAllocationAuthority.finishIssue(allocation);
        throw error;
      }
      AutoMovieTextureCacheAllocationAuthority.finishIssue(allocation, clone);
      this.issued.push(clone);
      return clone;
    };
  }

  /**
   * Decode every distinct asset the given bindings name, at most once each.
   *
   * Awaiting this is what makes {@link resolve} synchronous, which is what lets
   * {@link buildMaterial} stay a pure function of a material. A binding whose
   * asset fails to decode rejects here, naming every asset that failed, rather
   * than surfacing later as a silently untextured surface.
   *
   * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-material-resolution Resolves this public surface into the declared render material.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Implements the material and color binding at the render boundary.
   */
  public async prime(
    bindings: Iterable<AutoMovieTextureBinding | null | undefined>,
  ): Promise<void> {
    this.assertLive();
    const assets = new Set<string>();
    for (const binding of bindings)
      if (binding !== null && binding !== undefined)
        assets.add(textureBindingAsset(binding));
    const settled = await Promise.allSettled(
      [...assets].map((asset) => this.decodeOnce(asset)),
    );
    const failed = [...assets].filter(
      (_asset, index) => settled[index]!.status === "rejected",
    );
    if (failed.length !== 0)
      throw new Error(
        `Texture assets could not be decoded: ${failed.join(", ")}.`,
      );
  }

  /**
   * A binding-private texture over the primed source, for {@link buildMaterial}.
   *
   * A bound field rather than a method so it can be handed straight to
   * {@link buildModel} as the resolver itself. An asset that was never primed
   * throws instead of returning `undefined`: `undefined` is the host's honest
   * "this project ships no such map", and answering it for an asset the
   * material DOES declare would render a floor with no tile and call that
   * success.
   *
   * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-material-resolution Resolves this public surface into the declared render material.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Implements the material and color binding at the render boundary.
   */
  public readonly resolve: (binding: AutoMovieTextureBinding) => THREE.Texture;

  /** How many distinct assets this cache has decoded. */
  public get size(): number {
    return this.sources.size;
  }

  /**
   * Read host-decoded upload facts for preflight before the first GPU draw.
   * The source object supplies its dimensions, component width and inherited
   * sampling; material bindings still select their separate resident variants.
   * The texture token names the cache's original object. For environment
   * derivative ownership, call {@link readAutoMovieTextureSource} on the actual
   * resolved environment clone instead of substituting this original object.
   * Before any clone is issued the host may prepare its decoded original. After
   * issue, this observation checks every owned wrapper's actual tuple/version;
   * clone-created shared Source.version increments do not invalidate it.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Exposes decoded source facts from the same objects whose clones the material resolver returns.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Connects loaded texture facts to the public render budget assessment without author-supplied memory numbers.
   */
  public describeSources() {
    this.assertLive();
    return [...this.sources].map(([asset, texture]) =>
      readAutoMovieTextureSource(asset, texture));
  }

  /**
   * Attempt every distinct issued clone and decoded source exactly once.
   *
   * In-flight decodes are awaited before release, so a host that tears a shot
   * down mid-load frees what it started rather than leaking whatever landed
   * after the teardown. The loader must settle independently of this release;
   * awaiting cache disposal from inside its own decode would await itself.
   * Concurrent and repeated callers receive the same completion promise. Every
   * public retirement is attempted even when another listener throws. A single
   * failure preserves its original identity; multiple failures retain their
   * original values in attempt order. A failed attempt is not physical release.
   * Detached Source history also rejects completion after every attempt: native
   * disposal looks up the current Source and cannot certify the old footprint.
   * Retain that context's unknown residency until its physical release; neither
   * an empty cache nor a new cache in the same context proves it was retired.
   *
   * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-material-resolution Resolves this public surface into the declared render material.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Implements the material and color binding at the render boundary.
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-runtime-lifecycle Attempts every owned texture retirement and preserves one shared failed or successful completion.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Prevents one disposal listener failure or in-flight decode from skipping another owned lifetime.
   */
  public dispose(): Promise<void> {
    if (this.disposal !== undefined) return this.disposal;
    this.disposed = true;
    this.disposal = this.release();
    return this.disposal;
  }

  /** Drain settled ownership without allowing one native event to skip another. */
  private async release(): Promise<void> {
    const settled = await Promise.allSettled(this.pending.values());
    const textures = new Set(this.issued);
    for (const result of settled)
      if (result.status === "fulfilled") textures.add(result.value);
    this.issued.length = 0;
    this.pending.clear();
    this.sources.clear();
    const failures: unknown[] = [];
    for (const texture of textures) {
      this.uncertainRetirements.add(texture);
      AutoMovieTextureCacheAllocationAuthority.beginRetirement(texture);
      let failed = false;
      try { texture.dispose(); } catch (error) {
        failed = true;
        failures.push(error);
      }
      const uncertain = AutoMovieTextureCacheAllocationAuthority.finishRetirement(texture);
      if (uncertain !== undefined) failures.push(uncertain);
      if (!failed && uncertain === undefined) this.uncertainRetirements.delete(texture);
    }
    if (failures.length === 1) throw failures[0];
    if (failures.length > 1)
      throw new AggregateError(failures, "Texture cache retirement failed.");
  }

  private decodeOnce(asset: string): Promise<THREE.Texture> {
    const existing = this.pending.get(asset);
    if (existing !== undefined) return existing;
    // Register ownership before a host loader can synchronously request close.
    const decoding = Promise.resolve().then(() => this.load(asset)).then((texture) => {
      AutoMovieTextureCacheAllocationAuthority.claim(this.allocationOwner, texture);
      this.sources.set(asset, texture);
      return texture;
    });
    this.pending.set(asset, decoding);
    return decoding;
  }

  private assertLive(): void {
    if (this.disposed)
      throw new Error("This shot texture cache has already been disposed.");
  }
}
