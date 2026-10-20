import type { IAutoMovieRenderTextureSource } from "./IAutoMovieRenderTextureSource";

/**
 * One host-owned framebuffer's attachment storage and native factory bound. Target
 * objects allocate independently of decoded Source sharing. Requested samples
 * conservatively bound hardware-clamped multisampling; resolved color mips and
 * single-sample depth remain separate from multisample attachments.
 *
 *
 * @evidence contracts/common.md#principled-implementation Describe host-owned framebuffer attachment storage separately from decoded Source sharing, including faces, resolved mips, requested multisamples and depth texture/renderbuffer distinctions.
 * @evidence contracts/common.md#clear-and-simple-design One attachment profile lets closure count independent targets and connect actual transmission/shadow ownership without importing graphics objects.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Requested sample count bounds hardware-clamped allocation; absent format or null depth storage stays unknown rather than using an assumed byte width.
 * @evidence contracts/common.md#meaningful-documentation Members document pixel extents, face population, resolved color formats, sample/depth ownership and live scope associations.
 * @evidence contracts/performance.md#efficient-algorithms The profile is proportional to attachment count; target measurement uses mip extent arithmetic and separate multisample/depth terms, not per-pixel buffers.
 * @evidence contracts/performance.md#reuse-equivalent-work Targets allocate independently of source identity; the same stable target owner denotes a retained allocation only while host facts and context ownership remain valid.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The capture host removes actually retired target rows and releases native scene/camera caches; this interface neither disposes nor retains the framebuffer itself.
 */
export interface IAutoMovieRenderTextureTarget {
  /** Stable host target owner, unique among retained targets in one context. */
  owner: string;

  /**
   * Live shot owner whose transmission pass uses this target, when applicable.
   */
  transmissionScope?: string;

  /** Shadow attachment's stable scope, light and native map/filtering role. */
  shadow?: { scope: string; light: string; role: "map" | "blur" };

  /**
   * Color and depth face population: one for a 2D target, six for a cube.
   * Omission preserves the legacy 2D attachment profile.
   */
  faces?: 1 | 6;

  /**
   * Physical target width in pixels, observed or conservatively factory-bound,
   * before face and multisample expansion.
   */
  width: number;

  /** Actual framebuffer height in pixels. */
  height: number;

  /**
   * Upload representation of each resolved color attachment; unknown stays absent.
   */
  formats: readonly IAutoMovieRenderTextureSource["format"][];

  /** Whether resolved color attachments retain their full integer mip chain. */
  mipmapped: boolean;

  /**
   * Requested multisample count; zero means no separate multisample attachments.
   */
  samples: number;

  /**
   * Depth/stencil bytes per base pixel; zero means absent, null means unknown.
   */
  depthBytesPerTexel: number | null;

  /**
   * Whether resolved depth is a Texture allocation rather than a renderbuffer.
   * Omission retains the legacy renderbuffer profile; color and depth textures
   * both contribute to the renderer's allocation count.
   */
  depthTexture?: boolean;
}
