import type { IAutoMovieRenderTextureSource } from "./IAutoMovieRenderTextureSource";

/**
 * One host-owned framebuffer's attachment storage and native factory bound. Target
 * objects allocate independently of decoded Source sharing. Requested samples
 * conservatively bound hardware-clamped multisampling; resolved color mips and
 * single-sample depth remain separate from multisample attachments.
 *
 *
 * @evidence contracts/development/design.md#principled-representation Describe host-owned framebuffer attachment storage separately from decoded Source sharing, including faces, resolved mips, requested multisamples and depth texture/renderbuffer distinctions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One attachment profile lets closure count independent targets and connect actual transmission/shadow ownership without importing graphics objects.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Requested sample count bounds hardware-clamped allocation; absent format or null depth storage stays unknown rather than using an assumed byte width.
 * @evidence contracts/development/common.md#meaningful-documentation Members document pixel extents, face population, resolved color formats, sample/depth ownership and live scope associations.
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
