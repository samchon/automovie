import { AutoMovieTextureBinding } from "@automovie/interface";
import * as THREE from "three";

import { AutoMovieTextureCacheAllocationAuthority } from "./AutoMovieTextureCacheAllocationAuthority.js";
import { IAutoMovieTextureLoader } from "./IAutoMovieTextureLoader.js";
import { readAutoMovieTextureSource } from "./readAutoMovieTextureSource.js";
import { textureBindingAsset } from "./textureBindingAsset.js";

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
 * The first issuance fixes the original's inputs before native copy starts and verifies its successful or failed completion. Later observed original or uncontrolled issued-wrapper changes make its facts uncertified, even after properties are restored. Unobserved round trips between checks are not detected. Normal material and exclusive environment owners acknowledge their own supported transitions.
 *
 * A different live cache cannot acquire this cache's original or issued wrapper; distinct wrappers may still share decoded pixels. A detached Source can leave an earlier native upload alive after public disposal and therefore makes completion indeterminate. An issued binding wrapper cannot return through the loader as a decoder original, including an alias inside this same cache.
 *
 * @evidence contracts/common.md#principled-implementation Asset-keyed decode promises feed binding-private Texture clones sharing decoded Source pixels; allocation authority records original and clone input history, and disposal drains pending loads before independent retirement attempts.
 * @evidence contracts/common.md#clear-and-simple-design Prime owns asynchronous decoding, resolve supplies synchronous per-binding wrappers and disposal owns shot teardown; allocation receipts keep certification history separate from loading and sampling.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unprimed assets, closed caches and foreign or already-issued decoder originals refuse explicitly; failed disposal and detached Source history remain uncertain instead of declaring an empty map physically released.
 * @evidence contracts/common.md#meaningful-documentation Explains decoded-source sharing versus binding-private sampler state, renderer-specific native allocation, loader teardown constraints and single-attempt failure-preserving disposal.
 * @evidence contracts/performance.md#efficient-algorithms Asset Maps deduplicate loading in constant expected lookup time; prime and release traverse distinct assets and issued wrappers, with retained memory proportional to assets, clone count and decoded pixels.
 * @evidence contracts/performance.md#reuse-equivalent-work One pending promise per asset shares completed or in-flight decode within this shot; each binding receives a fresh wrapper because sampler and decoding state differ, and native upload sharing is not guaranteed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The shot owner must dispose the cache; issued wrappers can grow without a numeric bound until then. Teardown waits for loader settlement, clears bookkeeping, attempts distinct textures once and retains failed or indeterminate wrappers with the failed completion.
 */
export class AutoMovieTextureCache {
  private readonly pending: Map<string, Promise<THREE.Texture>> = new Map<
    string,
    Promise<THREE.Texture>
  >();
  private readonly sources: Map<string, THREE.Texture> = new Map<
    string,
    THREE.Texture
  >();
  private readonly issued: THREE.Texture[] = [];
  /** Actual failed or indeterminate wrappers retained after public bookkeeping closes. */
  private readonly uncertainRetirements: Set<THREE.Texture> =
    new Set<THREE.Texture>();
  private readonly allocationOwner: object = {};
  private disposed: boolean = false;
  /** One completion outcome, including a failure, shared by every close caller. */
  private disposal: Promise<void> | undefined;

  /** Build a cache over one host-owned loader. */
  public constructor(private readonly load: IAutoMovieTextureLoader) {
    this.resolve = (binding: AutoMovieTextureBinding): THREE.Texture => {
      this.assertLive();
      const asset: string = textureBindingAsset(binding);
      const source: THREE.Texture | undefined = this.sources.get(asset);
      if (source === undefined)
        throw new Error(
          `Texture asset "${asset}" was never primed into this shot cache.`,
        );
      const allocation: ReturnType<
        typeof AutoMovieTextureCacheAllocationAuthority.beginIssue
      > = AutoMovieTextureCacheAllocationAuthority.beginIssue(source);
      let clone: THREE.Texture;
      try {
        clone = source.clone();
      } catch (error) {
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
   * @evidence contracts/common.md#principled-implementation Deduplicates non-null binding assets, waits for every decode outcome and reports all failed asset names; all successful sources are ready for the synchronous resolver.
   * @evidence contracts/common.md#clear-and-simple-design Asset extraction and decodeOnce isolate binding representation and per-asset promise ownership from this batch-coordination method.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A rejected asset is reported rather than replaced with an absent texture or silently decoded again under a different binding.
   * @evidence contracts/common.md#meaningful-documentation Explains the asynchronous prerequisite for synchronous material resolution and aggregate asset-name failure behavior.
   * @evidence contracts/performance.md#efficient-algorithms Walks bindings once into a Set, starts one lookup per distinct asset and examines settled results once, using temporary space linear in distinct assets.
   * @evidence contracts/performance.md#reuse-equivalent-work decodeOnce shares the same promise for an asset across overlapping prime calls, including its completed outcome; the cache lifetime and host loader fix the decode context.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Pending and completed decoded textures enter shot-owned Maps before loader execution; dispose waits for those promises and retires their successful textures even during interrupted preparation.
   */
  public async prime(
    bindings: Iterable<AutoMovieTextureBinding | null | undefined>,
  ): Promise<void> {
    this.assertLive();
    const assets: Set<string> = new Set<string>();
    for (const binding of bindings)
      if (binding !== null && binding !== undefined)
        assets.add(textureBindingAsset(binding));
    const settled: PromiseSettledResult<THREE.Texture>[] =
      await Promise.allSettled(
        [...assets].map(
          (asset: string): Promise<THREE.Texture> => this.decodeOnce(asset),
        ),
      );
    const failed: string[] = [...assets].filter(
      (_asset: string, index: number): boolean =>
        settled[index]!.status === "rejected",
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
   * @evidence contracts/common.md#principled-implementation Looks up a primed asset and clones its decoded Texture wrapper while allocation receipts observe both successful and failed copies; shared Source pixels keep binding-local sampling state independent.
   * @evidence contracts/common.md#clear-and-simple-design A bound resolver field can be passed directly to model/material builders while the cache retains clone retirement ownership.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing primed assets and closed-cache use throw rather than returning an untextured substitute for an authored binding.
   * @evidence contracts/common.md#meaningful-documentation Explains bound-field use, per-binding wrappers and the distinction between missing authored assets and a legitimately absent map.
   * @evidence contracts/performance.md#efficient-algorithms Uses one asset Map lookup and one wrapper clone per binding; decoded image bytes are shared, while SDK userData copying follows the source object's metadata size.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses decoded Source data but deliberately issues a distinct wrapper for each binding's independent color-space, UV and sampler writes.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Every issued wrapper enters the shot-owned clone list for disposal; repeated resolves grow that list without a numeric cap until the shot owner closes the cache.
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
   * @evidence contracts/common.md#principled-implementation Observes each original decoded texture through readAutoMovieTextureSource, preserving actual extent, format, source identity and allocation authority instead of substituting declared asset dimensions.
   * @evidence contracts/common.md#clear-and-simple-design The cache supplies its asset-to-original mapping and delegates texture fact interpretation to the common observer used by resolved environment wrappers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Describing originals does not certify issued environment derivatives; the documentation requires observing the actual resolved clone for that ownership path.
   * @evidence contracts/common.md#meaningful-documentation Explains preflight use, original-object tokens, preparation before first issue and the limitation of original facts for environment derivatives.
   * @evidence contracts/performance.md#efficient-algorithms Visits each decoded asset once and allocation authority also checks its issued wrappers; result space is linear in decoded assets rather than image pixels.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Texture fields and wrapper history are mutable, so source facts are reobserved instead of cached across calls.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns fact records without acquiring textures or native storage; existing Maps remain owned by the cache's shot lifetime.
   */
  public describeSources(): ReturnType<typeof readAutoMovieTextureSource>[] {
    this.assertLive();
    return [...this.sources].map(
      ([asset, texture]: [string, THREE.Texture]): ReturnType<
        typeof readAutoMovieTextureSource
      > => readAutoMovieTextureSource(asset, texture),
    );
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
   * @evidence contracts/common.md#principled-implementation Marks the cache closed synchronously and memoizes release, which waits for all decodes and independently retires every distinct issued or decoded wrapper, preserving listener errors and detached-Source uncertainty.
   * @evidence contracts/common.md#clear-and-simple-design Public closure and shared completion remain in dispose while release owns draining and physical-retirement attempts.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Failed or indeterminate retirement rejects completion; clearing sources cannot serve as proof that earlier GPU allocations were physically freed.
   * @evidence contracts/common.md#meaningful-documentation States loader settlement requirements, single-attempt disposal, shared completion identity and preservation of original causes and unknown residency.
   * @evidence contracts/performance.md#efficient-algorithms Promise settlement and Set deduplication visit pending assets plus issued wrappers once; disposal calls scale with distinct texture objects and collect at most their failure causes.
   * @evidence contracts/performance.md#reuse-equivalent-work Concurrent and repeated close callers receive one disposal promise, including rejection, so native disposal effects are not repeated to obtain a different outcome.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Successful wrappers leave ownership bookkeeping after all attempts; failed or indeterminate wrappers remain strongly retained as uncertainty, and a loader that never settles leaves teardown pending without a time bound.
   */
  public dispose(): Promise<void> {
    if (this.disposal !== undefined) return this.disposal;
    this.disposed = true;
    this.disposal = this.release();
    return this.disposal;
  }

  /** Drain settled ownership without allowing one native event to skip another. */
  private async release(): Promise<void> {
    const settled: PromiseSettledResult<THREE.Texture>[] =
      await Promise.allSettled(this.pending.values());
    const textures: Set<THREE.Texture> = new Set(this.issued);
    for (const result of settled)
      if (result.status === "fulfilled") textures.add(result.value);
    this.issued.length = 0;
    this.pending.clear();
    this.sources.clear();
    const failures: unknown[] = [];
    for (const texture of textures) {
      this.uncertainRetirements.add(texture);
      AutoMovieTextureCacheAllocationAuthority.beginRetirement(texture);
      let failed: boolean = false;
      try {
        texture.dispose();
      } catch (error) {
        failed = true;
        failures.push(error);
      }
      const uncertain: ReturnType<
        typeof AutoMovieTextureCacheAllocationAuthority.finishRetirement
      > = AutoMovieTextureCacheAllocationAuthority.finishRetirement(texture);
      if (uncertain !== undefined) failures.push(uncertain);
      if (!failed && uncertain === undefined)
        this.uncertainRetirements.delete(texture);
    }
    if (failures.length === 1) throw failures[0];
    if (failures.length > 1)
      throw new AggregateError(failures, "Texture cache retirement failed.");
  }

  private decodeOnce(asset: string): Promise<THREE.Texture> {
    const existing: Promise<THREE.Texture> | undefined =
      this.pending.get(asset);
    if (existing !== undefined) return existing;
    // Register ownership before a host loader can synchronously request close.
    const decoding: Promise<THREE.Texture> = Promise.resolve()
      .then((): Promise<THREE.Texture> => this.load(asset))
      .then((texture: THREE.Texture): THREE.Texture => {
        AutoMovieTextureCacheAllocationAuthority.claim(
          this.allocationOwner,
          texture,
        );
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
