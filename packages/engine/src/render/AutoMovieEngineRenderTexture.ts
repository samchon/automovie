import { type IAutoMovieRenderTextureSource, type IAutoMovieRenderTextureResidency, type IAutoMovieSurfaceGraphicLayer, type AutoMovieTextureBinding, type IAutoMovieTextureReference, type IAutoMovieRenderTextureCost, type IAutoMovieMeasureRenderTextureClosure, type IAutoMovieRenderTextureTarget, type IAutoMovieMeasureTextureStorage } from "@automovie/interface";
import { autoMovieRenderTextureDigest as autoMovieRenderTextureDigestImplementation } from "./internal/autoMovieRenderTextureDigest";
import { autoMovieSurfaceFeedWidth as autoMovieSurfaceFeedWidthImplementation } from "./internal/autoMovieSurfaceFeedWidth";
import { autoMovieTextureBindingStateKey as autoMovieTextureBindingStateKeyImplementation } from "./internal/autoMovieTextureBindingStateKey";
import { autoMovieTextureFormatBytes as autoMovieTextureFormatBytesImplementation } from "./internal/autoMovieTextureFormatBytes";
import { measureAutoMovieRenderTextureClosure as measureAutoMovieRenderTextureClosureImplementation } from "./internal/measureAutoMovieRenderTextureClosure";
import { measureAutoMovieRenderTextureTarget as measureAutoMovieRenderTextureTargetImplementation } from "./internal/measureAutoMovieRenderTextureTarget";
import { measureAutoMovieTextureStorage as measureAutoMovieTextureStorageImplementation } from "./internal/measureAutoMovieTextureStorage";
import { sumAutoMovieRenderTextureAllocations as sumAutoMovieRenderTextureAllocationsImplementation } from "./internal/sumAutoMovieRenderTextureAllocations";

/** Public operations for Auto Movie Engine Render Texture. */
export namespace AutoMovieEngineRenderTexture {
  /**
   * Fingerprint upload facts and their actual object-sharing relation. Runtime
   * equality tokens group sorted stable owner/asset use locations; their random
   * spelling never enters the digest. Renaming tokens preserves identity, while
   * shared-to-independent decode or environment-clone changes invalidate it.
   * Fixed-position records ignore property order and retain unknown facts.
   * Invalid dimensions remain distinct so an unknown bound cannot reuse a valid
   * one. Conflicting facts for one scoped asset refuse rather than choosing by
   * order. The caller supplies the current shot's required source closure;
   * retained scopes are filtered to the texture channels and environment they
   * consume. This proves identity, not validity or a complete memory bound.
   */
  export function autoMovieRenderTextureDigest(sources: readonly IAutoMovieRenderTextureSource[], residency?: IAutoMovieRenderTextureResidency): string {
    return autoMovieRenderTextureDigestImplementation(sources, residency);
  }

  /**
   * Width in pixels of a feed layer's render target: as wide as the layer's box
   * is on the face, at the box's metric aspect, for its `pixels` height.
   *
   * The box spans `width × faceWidth` by `height × faceDepth` metres, so the
   * target is `max(1, round(pixels × width × faceWidth / (height × faceDepth)))`
   * pixels wide; the rounding keeps a whole pixel count and the floor of one
   * keeps a sliver of a box drawable. `render` allocates the target at this width
   * and the render inventory counts it, so both read one rule.
   *
   * @param layer The feed layer, its box in face fractions and its height in
   *   pixels.
   * @param faceWidth The surface's width along its frame's `+X`, metres.
   * @param faceDepth The surface's depth along its frame's `Z`, metres.
   * @returns The target's width, a positive integer.
   */
  export function autoMovieSurfaceFeedWidth(layer: Pick<
    IAutoMovieSurfaceGraphicLayer.IFeed,
    "pixels" | "width" | "height"
  >, faceWidth: number, faceDepth: number): number {
    return autoMovieSurfaceFeedWidthImplementation(layer, faceWidth, faceDepth);
  }

  /**
   * Identify binding-controlled GPU upload state independently of shader UVs. A
   * source's inherited sampler is shared by all clones that omit a sampler; when
   * its host reports that sampler, an equivalent explicit binding shares the same
   * key. UV channel, offset, scale and rotation do not allocate storage. The
   * source owner adds actual format, type and upload state to this key.
   */
  export function autoMovieTextureBindingStateKey(binding: AutoMovieTextureBinding, legacyColorSpace: "srgb" | "linear" | "linear-environment", sourceSampler?: IAutoMovieTextureReference["sampler"], sourceSamplerState?: string | null): string {
    return autoMovieTextureBindingStateKeyImplementation(binding, legacyColorSpace, sourceSampler, sourceSamplerState);
  }

  /**
   * One component-layout owner for source uploads and framebuffer attachments. RG
   * half-float has two two-byte components; RGBA byte/half/float has four
   * one/two/four-byte components. Unreported layout keeps storage unknown.
   */
  export function autoMovieTextureFormatBytes(format: IAutoMovieRenderTextureSource["format"]): number | null {
    return autoMovieTextureFormatBytesImplementation(format);
  }

  /**
   * Close current and retained consumers over one renderer's texture allocations.
   * Raw uploads share only an actual Source and equivalent upload state. PMREM
   * output and sharp-background cubes share only the actual environment Texture
   * object. PBR DFG lookup and PMREM blur scratch belong to the renderer once. A
   * source disposal releases its environment derivatives, while scratch and
   * lookup survive until their host releases the context or replaces the scratch.
   * Environment factory sampling is an initialization-order union: configured
   * mip-linear uploads and temporary linear conversion uploads can occupy
   * distinct keys even after properties match. Count each possible state once
   * with every equivalent material/source consumer; this is an upper bound, not a
   * census.
   *
   * Missing object identities in a multi-resident closure leave required bytes
   * unknown. Legacy single-shot facts describe a fresh context. Opaque object
   * tokens are used only for equality; stable resident owners identify the
   * result. PMREM bounds follow r186: a half-float atlas is 3_max(cubeSize,112)
   * by 4_cubeSize, cubeSize=power-of-two floor(width/4). The background cube
   * retains six RGBA color faces of the inherited component type and a
   * conservative 32-bit depth face attachment. Raw channel/internal format does
   * not own them. DFG is a 16-by-16 RG half-float texture, with no mip chain.
   * Driver overhead and encoded/CPU source bytes are outside these uncompressed
   * storage bounds.
   */
  export function measureAutoMovieRenderTextureClosure(props: IAutoMovieMeasureRenderTextureClosure.IProps): IAutoMovieRenderTextureCost[] {
    return measureAutoMovieRenderTextureClosureImplementation(props);
  }

  /**
   * Bound resolved color mips and color/depth sample attachments across target
   * faces. Four-byte depth bounds D24 and D24S8 storage; a reported custom depth
   * width replaces that profile. Unknown attachments and unsafe sums remain null.
   * Driver allocation overhead and default-window framebuffer storage are outside
   * this target quantity. The requested sample count safely covers driver
   * clamping.
   */
  export function measureAutoMovieRenderTextureTarget(target: IAutoMovieRenderTextureTarget): number | null {
    return measureAutoMovieRenderTextureTargetImplementation(target);
  }

  /**
   * Count uncompressed two-dimensional texel storage in bytes. Each mip level
   * halves integer dimensions and retains at least one texel on either axis; this
   * is the actual chain, including non-square and non-power-of-two images. The
   * host supplies bytes per texel from its decoded upload representation. Unknown
   * formats, invalid dimensions and unsafe integer totals have no bound. Driver
   * allocation overhead is outside this texel-storage quantity.
   */
  export function measureAutoMovieTextureStorage(props: IAutoMovieMeasureTextureStorage.IProps): number | null {
    return measureAutoMovieTextureStorageImplementation(props);
  }

  /**
   * Sum certified allocation populations without replacing unknown by one.
   * Omitted counts retain the legacy one-allocation row meaning. Invalid counts
   * and unsafe aggregate integers remain unbounded rather than rounded totals.
   */
  export function sumAutoMovieRenderTextureAllocations(textures: readonly IAutoMovieRenderTextureCost[]): number | null {
    return sumAutoMovieRenderTextureAllocationsImplementation(textures);
  }
}
