import {
  AutoMovieTextureBinding,
} from "@automovie/interface";
import * as THREE from "three";

import { IAutoMovieTextureLoader } from "./IAutoMovieTextureLoader";
import { IAutoMovieTextureResolver } from "./IAutoMovieTextureResolver";
import { textureBindingAsset } from "./textureBindingAsset";

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
 * host can actually end: {@link dispose} releases every clone it issued and
 * every source it decoded, exactly once however many times it is called, and a
 * cache that has been disposed refuses further work rather than quietly
 * decoding into a bucket nobody will empty.
 *
 * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-material-resolution Resolves this public surface into the declared render material.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Implements the material and color binding at the render boundary.
 */
export class AutoMovieTextureCache {
  private readonly pending = new Map<string, Promise<THREE.Texture>>();
  private readonly sources = new Map<string, THREE.Texture>();
  private readonly issued: THREE.Texture[] = [];
  private disposed = false;

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
      const clone = source.clone();
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
  public readonly resolve: IAutoMovieTextureResolver;

  /** How many distinct assets this cache has decoded. */
  public get size(): number {
    return this.sources.size;
  }

  /**
   * Release every issued clone and every decoded source, exactly once.
   *
   * In-flight decodes are awaited before release, so a host that tears a shot
   * down mid-load frees what it started rather than leaking whatever landed
   * after the teardown.
   *
   * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-material-resolution Resolves this public surface into the declared render material.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Implements the material and color binding at the render boundary.
   */
  public async dispose(): Promise<void> {
    if (this.disposed) return;
    this.disposed = true;
    const settled = await Promise.allSettled(this.pending.values());
    for (const clone of this.issued) clone.dispose();
    this.issued.length = 0;
    for (const result of settled)
      if (result.status === "fulfilled") result.value.dispose();
    this.pending.clear();
    this.sources.clear();
  }

  private decodeOnce(asset: string): Promise<THREE.Texture> {
    const existing = this.pending.get(asset);
    if (existing !== undefined) return existing;
    const decoding = this.load(asset).then((texture) => {
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
